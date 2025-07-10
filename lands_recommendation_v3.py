#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Продвинутая система генерации рекомендаций для пожарных депо
Версия 3.0 с использованием алгоритма на основе кластеризации и анализа покрытия
"""

import pandas as pd
import geopandas as gpd
import numpy as np
import json
import sys
import os
import argparse
from shapely.geometry import Point
from shapely import wkt
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

# Устанавливаем кодировку для вывода в Windows консоль
if os.name == 'nt':  # Windows
    try:
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())
    except:
        pass

def load_grid_data(unified_file):
    """Загрузка данных сетки покрытия для анализа"""
    try:
        # Пробуем найти лист с данными сетки
        excel_file = pd.ExcelFile(unified_file)
        
        # Ищем подходящий лист (planned5, current, или первый доступный)
        sheet_candidates = ['planned5', 'current', 'plan_5_2030']
        sheet_name = None
        
        for candidate in sheet_candidates:
            matching_sheets = [sheet for sheet in excel_file.sheet_names if candidate.lower() in sheet.lower()]
            if matching_sheets:
                sheet_name = matching_sheets[0]
                break
        
        if not sheet_name:
            sheet_name = excel_file.sheet_names[0]
        
        print(f"Загружаем данные сетки из листа: {sheet_name}")
        grid_df = pd.read_excel(unified_file, sheet_name=sheet_name)
        
        print(f"Загружено {len(grid_df)} записей из файла")
        
        # ВАЖНО: Фильтруем только сценарий planned5
        if 'scenario_name' in grid_df.columns:
            planned5_variants = ['planned5', 'plan_5', 'Planned5', 'Plan_5', 'plan5', 'Планируется 5', 'планируется 5']
            for variant in planned5_variants:
                planned5_data = grid_df[grid_df['scenario_name'].str.contains(variant, case=False, na=False)]
                if len(planned5_data) > 0:
                    grid_df = planned5_data
                    print(f"Отфильтровано по сценарию '{variant}': {len(grid_df)} записей")
                    break
            else:
                print(f"Внимание: Не найден сценарий planned5. Доступные сценарии: {grid_df['scenario_name'].unique()}")
        elif 'scenario_code' in grid_df.columns:
            planned5_data = grid_df[grid_df['scenario_code'].str.contains('5', na=False)]
            if len(planned5_data) > 0:
                grid_df = planned5_data
                print(f"Отфильтровано по scenario_code содержащему '5': {len(grid_df)} записей")
        else:
            print("Внимание: Не найдены колонки сценария. Используем все данные.")
        
        # Проверяем наличие необходимых колонок
        required_cols = ['fire_count', 'all_risk_objects', 'total_sum_population', 'color', 'geometry_wkt2']
        missing_cols = [col for col in required_cols if col not in grid_df.columns]
        
        if missing_cols:
            print(f"Предупреждение: Отсутствуют колонки: {missing_cols}")
            print(f"Доступные колонки: {list(grid_df.columns)}")
            
            # Пробуем найти альтернативные названия
            alt_names = {
                'fire_count': ['пожары', 'fires', 'fire'],
                'all_risk_objects': ['объекты', 'objects', 'risk'],
                'total_sum_population': ['население', 'population', 'pop'],
                'color': ['цвет', 'colour'],
                'geometry_wkt2': ['geometry', 'geom', 'wkt']
            }
            
            for col in missing_cols:
                for alt in alt_names.get(col, []):
                    matches = [c for c in grid_df.columns if alt.lower() in c.lower()]
                    if matches:
                        grid_df = grid_df.rename(columns={matches[0]: col})
                        print(f"Переименовали {matches[0]} -> {col}")
                        break
        
        print(f"Итого записей сетки для анализа (только planned5): {len(grid_df)}")
        
        # Показываем статистику по цветам
        if 'color' in grid_df.columns:
            color_stats = grid_df['color'].value_counts()
            print(f"Распределение по цветам: {dict(color_stats)}")
        
        return grid_df
        
    except Exception as e:
        print(f"Ошибка при загрузке данных сетки: {e}")
        return pd.DataFrame()

def load_and_filter_lands(lands_file, filters):
    """Загрузка и фильтрация земельных участков"""
    try:
        if lands_file.endswith('.json'):
            print(f"Загружаем JSON файл: {lands_file}")
            with open(lands_file, 'r', encoding='utf-8') as f:
                lands_data = json.load(f)
            lands_df = pd.DataFrame(lands_data)
        else:
            print(f"Загружаем CSV файл: {lands_file}")
            lands_df = pd.read_csv(lands_file)
        
        print(f"Исходное количество участков: {len(lands_df)}")
        
        # Применяем фильтры
        ownership_type = filters.get('ownership_type', 'all')
        min_area = filters.get('min_area', 500)
        purpose = filters.get('purpose', 'all')
        custom_purpose = filters.get('custom_purpose', '')
        min_lease_year = filters.get('min_lease_year', 2020)
        
        print(f"Применяем фильтры: ownership_type={ownership_type}, min_area={min_area}, purpose={purpose}, custom_purpose={custom_purpose}, min_lease_year={min_lease_year}")
        
        # Фильтр по форме собственности
        if ownership_type != 'all':
            if 'granted_right' in lands_df.columns:
                lands_df = lands_df[lands_df['granted_right'] == ownership_type]
                print(f"После фильтрации по форме собственности '{ownership_type}': {len(lands_df)} участков")
            elif 'Предоставленное право' in lands_df.columns:
                lands_df = lands_df[lands_df['Предоставленное право'] == ownership_type]
                print(f"После фильтрации по форме собственности '{ownership_type}': {len(lands_df)} участков")
        
        # Фильтр по площади
        area_col = None
        if 'area' in lands_df.columns:
            area_col = 'area'
        elif 'ShapeArea' in lands_df.columns:
            area_col = 'ShapeArea'
        
        if area_col:
            # Преобразуем area в числовой формат
            lands_df[f'{area_col}_numeric'] = pd.to_numeric(lands_df[area_col], errors='coerce')
            lands_df = lands_df[lands_df[f'{area_col}_numeric'] >= min_area]
            print(f"После фильтрации по площади >= {min_area}: {len(lands_df)} участков")
        
        # Фильтр по целевому назначению
        if purpose == 'custom' and custom_purpose:
            # Используем кастомное назначение
            if 'celevoe' in lands_df.columns:
                lands_df = lands_df[lands_df['celevoe'].str.contains(custom_purpose, case=False, na=False)]
                print(f"После фильтрации по кастомному назначению '{custom_purpose}': {len(lands_df)} участков")
        elif purpose != 'all':
            # Используем выбранное назначение из списка
            if 'celevoe' in lands_df.columns:
                lands_df = lands_df[lands_df['celevoe'].str.contains(purpose, case=False, na=False)]
                print(f"После фильтрации по назначению '{purpose}': {len(lands_df)} участков")
        
        # Фильтр по минимальному году аренды
        def extract_year(term_str):
            if pd.isna(term_str) or not isinstance(term_str, str):
                return None
            import re
            years = re.findall(r'\b(20\d{2})\b', term_str)
            return int(years[0]) if years else None
        
        # Фильтр по минимальному году аренды
        if 'временн' in str(ownership_type).lower() and 'land_use_term' in lands_df.columns and min_lease_year and min_lease_year > 0:
            lands_df['extracted_year'] = lands_df['land_use_term'].apply(extract_year)
            lands_df = lands_df[(lands_df['extracted_year'].isna()) | (lands_df['extracted_year'] <= min_lease_year)]
            print(f"После фильтрации по году аренды >= {min_lease_year}: {len(lands_df)} участков")
        print(f"После фильтрации: {len(lands_df)} участков")
        
        # Преобразуем в GeoDataFrame
        if 'centroid' in lands_df.columns:
            lands_df['geometry'] = lands_df['centroid'].apply(
                lambda val: wkt.loads(val) if isinstance(val, str) and 'POINT' in val else Point()
            )
        
        lands_gdf = gpd.GeoDataFrame(lands_df, geometry='geometry', crs='EPSG:4326')
        lands_gdf = lands_gdf[lands_gdf['geometry'].is_valid & ~lands_gdf['geometry'].is_empty].copy()
        lands_gdf = lands_gdf.to_crs(epsg=3857)
        
        print(f"Создан GeoDataFrame с {len(lands_gdf)} валидными участками")
        return lands_gdf
        
    except Exception as e:
        print(f"Ошибка загрузки земель: {e}")
        return gpd.GeoDataFrame()

def perform_risk_analysis(grid_df):
    """Выполняет KMeans кластеризацию и анализ рисков"""
    try:
        # Основные признаки для анализа
        features = ['fire_count', 'all_risk_objects', 'total_sum_population']
        
        # Заполняем пропуски и подготавливаем данные
        df_selected = grid_df[features].fillna(0).reset_index(drop=True)
        
        # Нормализация данных
        scaler = MinMaxScaler()
        X_scaled = scaler.fit_transform(df_selected)
        df_scaled = pd.DataFrame(X_scaled, columns=features, index=df_selected.index)
        
        # KMeans кластеризация
        n_clusters = min(5, len(df_selected))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        df_scaled['cluster'] = kmeans.fit_predict(df_scaled)
        
        # Вычисляем веса на основе дисперсии центров кластеров
        cluster_centers = pd.DataFrame(kmeans.cluster_centers_, columns=features)
        feature_variances = cluster_centers.var(axis=0)
        weights_kmeans = (feature_variances / feature_variances.sum()).to_dict()
        
        print(f"Веса признаков (KMeans): {weights_kmeans}")
        
        # Рассчитываем итоговый скор риска
        score_values = sum(df_scaled[feat] * weight for feat, weight in weights_kmeans.items())
        
        # Обновляем grid_df с теми же индексами
        grid_df = grid_df.reset_index(drop=True)
        grid_df['score_kmeans_based'] = score_values
        
        print(f"Статистика score_kmeans_based: min={grid_df['score_kmeans_based'].min():.6f}, " + 
              f"max={grid_df['score_kmeans_based'].max():.6f}, " + 
              f"mean={grid_df['score_kmeans_based'].mean():.6f}")
        
        return grid_df
        
    except Exception as e:
        print(f"Ошибка анализа рисков: {e}")
        import traceback
        traceback.print_exc()
        return grid_df

def generate_advanced_recommendations(grid_df, lands_gdf, num_stations=10, coverage_radius=2200):
    """Генерация рекомендаций по продвинутому алгоритму с жадным отбором"""
    try:
        # Подготовка geometry в grid_gdf
        if 'geometry_wkt2' in grid_df.columns:
            grid_df['geometry'] = grid_df['geometry_wkt2'].apply(wkt.loads)
        elif 'geometry' not in grid_df.columns:
            print("Ошибка: Не найдена геометрия в данных сетки")
            return []
        
        grid_gdf = gpd.GeoDataFrame(grid_df, geometry='geometry', crs='EPSG:4326')
        grid_gdf = grid_gdf.to_crs(epsg=3857)
        
        # Фильтруем красные зоны (высокий риск)
        gdf_red = grid_gdf[grid_gdf['color'] == 'red'].copy()
        print(f"Найдено {len(gdf_red)} красных зон высокого риска")
        
        if len(gdf_red) == 0:
            print("Внимание: Нет красных зон. Используем все зоны для анализа.")
            gdf_red = grid_gdf.copy()
        
        # === 4. Кандидаты с землёй ===
        land_candidates = []
        print(f"Начинаем анализ {len(lands_gdf)} земельных участков...")
        
        for idx, land in lands_gdf.iterrows():
            center = land.geometry.centroid
            buf = center.buffer(coverage_radius)
            covered = gdf_red[gdf_red.geometry.intersects(buf)]
            score_sum = covered['score_kmeans_based'].sum()
            
            print(f"Участок {idx}: kad_nomer={land.get('kad_nomer', 'N/A')}, "
                  f"площадь={land.get('area', 'N/A')}, "
                  f"право={land.get('granted_right', 'N/A')}, "
                  f"покрытые красные зоны={len(covered)}, "
                  f"score={score_sum:.4f}")
            
            if score_sum > 0.2:  # Пороговое значение как в оригинале
                land_candidates.append({
                    'idx': idx, 
                    'score': score_sum, 
                    'geometry': center, 
                    'buffer': buf, 
                    'no_land': False,
                    'land_data': land
                })
                print(f"  -> Участок добавлен в кандидаты (score={score_sum:.4f})")
            else:
                print(f"  -> Участок отклонен (score={score_sum:.4f} < 0.2)")
        
        print(f"Найдено {len(land_candidates)} кандидатов с землей")
        
        # === 5. Жадный отбор с землёй ===
        land_candidates = sorted(land_candidates, key=lambda x: -x['score'])
        selected_land_data = []
        used_buffers = []
        
        for cand in land_candidates:
            if all(not cand['buffer'].intersects(b) for b in used_buffers):
                selected_land_data.append(cand)
                used_buffers.append(cand['buffer'])
            if len(selected_land_data) == num_stations:
                break
        
        print(f"Выбрано {len(selected_land_data)} участков с землей")
        
        # === 6. Подбор no_land кандидатов ===
        covered = set()
        for c in selected_land_data:
            covered |= set(gdf_red[gdf_red.geometry.intersects(c['buffer'])].index)
        
        no_land_candidates = []
        for idx, row in gdf_red[~gdf_red.index.isin(covered)].iterrows():
            centroid = row.geometry.centroid
            buf = centroid.buffer(coverage_radius)
            additional_coverage = gdf_red[~gdf_red.index.isin(covered)]
            covered_now = additional_coverage[additional_coverage.geometry.intersects(buf)]
            score_sum = covered_now['score_kmeans_based'].sum()
            
            if score_sum > 0.2:  # То же пороговое значение
                no_land_candidates.append({
                    'idx': idx, 
                    'score': score_sum, 
                    'geometry': centroid, 
                    'buffer': buf, 
                    'no_land': True,
                    'grid_data': row
                })
        
        # === 7. Дозаполнение до нужного количества точек ===
        no_land_candidates = sorted(no_land_candidates, key=lambda x: -x['score'])
        
        for candidate in no_land_candidates:
            if len(selected_land_data) == num_stations:
                break
            if all(not candidate['buffer'].intersects(b) for b in used_buffers):
                selected_land_data.append(candidate)
                used_buffers.append(candidate['buffer'])
        
        # === 8. Замена слабых с землёй на сильных no_land ===
        selected_land_data = sorted(selected_land_data, key=lambda x: x['score'])
        
        for candidate in no_land_candidates:
            for i, weak in enumerate(selected_land_data):
                if not weak['no_land'] and candidate['score'] > weak['score']:
                    if all(not candidate['buffer'].intersects(o['buffer']) for j, o in enumerate(selected_land_data) if j != i):
                        selected_land_data[i] = candidate
                        break
        
        print(f"Итоговых рекомендаций: {len(selected_land_data)}")
        print(f"Из них без земли: {sum(1 for x in selected_land_data if x['no_land'])}")
        
        # === 9. Преобразование в формат результата ===
        recommendations = []
        for i, cand in enumerate(selected_land_data):
            # Преобразуем координаты обратно в WGS84
            geom_wgs84 = gpd.GeoSeries([cand['geometry']], crs='EPSG:3857').to_crs('EPSG:4326').iloc[0]
            
            rec = {
                'id': i + 1000,
                'latitude': str(geom_wgs84.y),
                'longitude': str(geom_wgs84.x),
                'score': float(cand['score']),
                'has_land': not cand['no_land'],
                'exist_text': 'Динамическая рекомендация',
                'description': f"Рекомендуемая станция #{i + 1}",
                'caption': f"Приоритет: {cand['score']:.2f}",
                'district_id': 1,
                'district_name': 'Алматы'
            }
            
            # Добавляем информацию о земле если есть
            if not cand['no_land'] and 'land_data' in cand:
                land = cand['land_data']
                rec['land_info'] = {
                    'kad_nomer': land.get('kad_nomer', 'N/A'),
                    'granted_right': land.get('granted_right', 'N/A'),
                    'land_use_term': land.get('land_use_term', 'N/A'),
                    'celevoe': land.get('celevoe', 'N/A'),
                    'location': land.get('location', 'N/A'),
                    'area': land.get('area', 0),
                    'divisible_plot': land.get('divisible_plot', 'N/A'),
                    'limitations': land.get('limitations', 'Нет данных'),
                    'district_name': land.get('district_name', 'N/A'),
                    'centroid': land.get('centroid', 'N/A')
                }
            else:
                rec['land_info'] = None
                rec['caption'] += " (требуется покупка земли)"
            
            recommendations.append(rec)
        
        print(f"Сгенерировано {len(recommendations)} рекомендаций")
        print(f"С землей: {sum(1 for r in recommendations if r['has_land'])}")
        print(f"Без земли: {sum(1 for r in recommendations if not r['has_land'])}")
        
        return recommendations
        
    except Exception as e:
        print(f"Ошибка генерации рекомендаций: {e}")
        import traceback
        traceback.print_exc()
        return []

def main():
    parser = argparse.ArgumentParser(description='Генерация рекомендаций для пожарных депо v3.0')
    parser.add_argument('--config', required=True, help='Путь к JSON файлу с конфигурацией')
    parser.add_argument('--output', required=True, help='Путь для сохранения результатов')
    
    args = parser.parse_args()
    
    try:
        # Загружаем конфигурацию
        with open(args.config, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        print("Конфигурация загружена:")
        print(json.dumps(config, ensure_ascii=False, indent=2))
        
        # Пути к файлам
        lands_file = config.get('lands_file', 'lands_all.json')
        unified_file = config.get('unified_file', 'dchs_unified_coverage.xlsx')
        
        # Параметры
        filters = config.get('filters', {})
        num_stations = config.get('num_stations', 10)
        coverage_radius = config.get('coverage_radius', 2200)
        
        print(f"\nЗагрузка данных...")
        
        # Загружаем данные сетки для анализа рисков
        grid_df = load_grid_data(unified_file)
        if len(grid_df) == 0:
            raise Exception("Не удалось загрузить данные сетки покрытия")
        
        # Выполняем анализ рисков
        print("Выполняем анализ рисков...")
        grid_df = perform_risk_analysis(grid_df)
        
        # Загружаем и фильтруем земельные участки
        print("Загружаем земельные участки...")
        lands_gdf = load_and_filter_lands(lands_file, filters)
        
        if len(lands_gdf) == 0:
            print("Предупреждение: Нет подходящих земельных участков")
        
        # Генерируем рекомендации
        print(f"\nГенерация {num_stations} рекомендаций...")
        recommendations = generate_advanced_recommendations(
            grid_df, lands_gdf, num_stations, coverage_radius
        )
        
        if len(recommendations) > 0:
            result = {
                'success': True,
                'stations': recommendations,
                'metadata': {
                    'total_grid_cells': len(grid_df),
                    'red_zones': len(grid_df[grid_df['color'] == 'red']) if 'color' in grid_df.columns else 0,
                    'available_lands': len(lands_gdf),
                    'recommendations_generated': len(recommendations),
                    'with_land': sum(1 for r in recommendations if r['has_land']),
                    'without_land': sum(1 for r in recommendations if not r['has_land']),
                    'algorithm_version': '3.0',
                    'filters_applied': filters
                }
            }
        else:
            result = {
                'success': False,
                'error': 'Не удалось сгенерировать рекомендации',
                'stations': []
            }
        
        # Сохраняем результат
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"\nРезультаты сохранены в {args.output}")
        print("Генерация завершена успешно!")
        
    except Exception as e:
        print(f"Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        
        error_result = {
            'success': False,
            'error': str(e),
            'stations': []
        }
        
        try:
            with open(args.output, 'w', encoding='utf-8') as f:
                json.dump(error_result, f, ensure_ascii=False, indent=2)
        except:
            pass
        
        sys.exit(1)

if __name__ == "__main__":
    main() 