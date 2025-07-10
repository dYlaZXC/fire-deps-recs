# 🎯 ФИНАЛЬНАЯ СТРУКТУРА ДАННЫХ FIRE STATION DASHBOARD

## 📊 ПОЛНАЯ КАРТА ДАННЫХ (ПРОАНАЛИЗИРОВАНО)

### 1️⃣ **ТЕКУЩИЙ СЦЕНАРИЙ** (Current 2025)
- **Станции**: `dchs_fire_stations123.xlsx` → **41 станция**
- **Покрытие**: `dchs_demo_grids_population2.xlsx` → **3938 сеток**
- **Статус**: ✅ Данные полные

### 2️⃣ **ПЛАН +5 СТАНЦИЙ** (Planned 5)
- **Станции**: `dchs_fire_stations_plan_2030.xlsx` → **62 станции** (включая существующие)
- **Покрытие**: `dchs_plan_2030.xlsx` → **3962 сетки** (тип = "2")
- **Статус**: ✅ Данные полные

### 3️⃣ **ПЛАН +16 СТАНЦИЙ** (Planned 16)
- **Станции**: `dchs_fire_stations_plan_2030.xlsx` → **62 станции** (включая существующие)
- **Покрытие**: `dchs_plan_2030.xlsx` → **3973 сетки** (тип = "3")
- **Статус**: ✅ Данные полные

### 4️⃣ **AI РЕКОМЕНДАЦИИ** (AI Recommended)
- **Станции**: `dchs_fire_stations_plan_predict.xlsx` → **36 станций**
- **Покрытие**: `recommendations.xlsx` → **3973 сетки**
- **Статус**: ✅ Данные полные

## 🎯 РЕКОМЕНДУЕМАЯ АРХИТЕКТУРА

### Вариант A: **JSON файлы для быстрого прототипа** ⭐ РЕКОМЕНДУЮ

```typescript
// data/scenarios.json
{
  "current_2025": {
    "id": "current_2025",
    "name": "Текущие станции (2025)",
    "description": "41 действующая станция",
    "year": 2025,
    "stations": FireStation[],
    "coverage": GridCoverage[],
    "metrics": {
      "total_stations": 41,
      "coverage_15min": 1234, // количество покрытых сеток
      "coverage_30min": 2456,
      "population_covered": 1500000,
      "avg_response_time": 12.5
    }
  },
  "planned_5_2030": { ... },
  "planned_16_2030": { ... },
  "ai_predict_2030": { ... }
}
```

### Вариант B: **SQLite для полнофункциональной системы**

```sql
-- Быстрая SQLite база для локального хранения
CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  year INTEGER,
  station_count INTEGER,
  data_json TEXT -- JSON с полными данными сценария
);

CREATE TABLE scenario_comparison (
  scenario_1 TEXT,
  scenario_2 TEXT,
  metric_type TEXT,
  value_1 REAL,
  value_2 REAL,
  difference REAL,
  PRIMARY KEY (scenario_1, scenario_2, metric_type)
);
```

## 🔄 ПЛАН ИМПОРТА ДАННЫХ

### Этап 1: Создание парсера Excel → JSON

```javascript
// import-data.js
const XLSX = require('xlsx');

const importScenario = (stationFile, coverageFile, filter) => ({
  stations: parseStations(stationFile, filter),
  coverage: parseCoverage(coverageFile, filter),
  metrics: calculateMetrics(stations, coverage)
});

const scenarios = {
  current_2025: importScenario(
    'dchs_fire_stations123.xlsx',
    'dchs_demo_grids_population2.xlsx'
  ),
  planned_5_2030: importScenario(
    'dchs_fire_stations_plan_2030.xlsx',
    'dchs_plan_2030.xlsx',
    { type: '2' }
  ),
  planned_16_2030: importScenario(
    'dchs_fire_stations_plan_2030.xlsx', 
    'dchs_plan_2030.xlsx',
    { type: '3' }
  ),
  ai_predict_2030: importScenario(
    'dchs_fire_stations_plan_predict.xlsx',
    'recommendations.xlsx'
  )
};
```

### Этап 2: Интеграция с React Dashboard

```typescript
// hooks/useScenarios.ts
export const useScenarios = () => {
  const [scenarios, setScenarios] = useState<ScenariosData>();
  const [selectedScenario, setSelectedScenario] = useState('current_2025');
  
  useEffect(() => {
    import('../data/scenarios.json').then(setScenarios);
  }, []);
  
  return {
    scenarios,
    selectedScenario,
    setSelectedScenario,
    currentData: scenarios?.[selectedScenario]
  };
};
```

### Этап 3: Обновление Dashboard компонента

```typescript
// components/ScenarioSelector.tsx
const ScenarioSelector = ({ onScenarioChange }) => (
  <Select onValueChange={onScenarioChange}>
    <SelectItem value="current_2025">Текущие станции (41)</SelectItem>
    <SelectItem value="planned_5_2030">План +5 станций (46)</SelectItem>
    <SelectItem value="planned_16_2030">План +16 станций (57)</SelectItem>
    <SelectItem value="ai_predict_2030">AI рекомендации (36)</SelectItem>
  </Select>
);

// components/ScenarioComparison.tsx
const ScenarioComparison = ({ scenario1, scenario2 }) => {
  const metrics = useMemo(() => 
    compareScenarios(scenario1, scenario2), [scenario1, scenario2]
  );
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map(metric => (
        <MetricCard key={metric.name} {...metric} />
      ))}
    </div>
  );
};
```

## 📈 КЛЮЧЕВЫЕ МЕТРИКИ ДЛЯ СРАВНЕНИЯ

```typescript
interface ScenarioMetrics {
  coverage: {
    total_grids: number;
    covered_15min: number;
    covered_30min: number;
    coverage_percentage_15: number;
    coverage_percentage_30: number;
  };
  population: {
    total_population: number;
    covered_population_15: number;
    covered_population_30: number;
    population_coverage_15: number;
    population_coverage_30: number;
  };
  efficiency: {
    avg_response_time: number;
    stations_utilization: number;
    cost_per_covered_person: number;
    risk_reduction_score: number;
  };
  infrastructure: {
    total_stations: number;
    new_stations_needed: number;
    construction_cost: number;
    maintenance_cost: number;
  };
}
```

## 🚀 БЫСТРЫЙ СТАРТ (Следующие шаги)

### 1. Создайте импортер данных
```bash
npm run import-data  # Парсит Excel → JSON
```

### 2. Обновите Dashboard
```typescript
// Добавьте селектор сценариев в header
<ScenarioSelector 
  value={selectedScenario} 
  onChange={setSelectedScenario} 
/>

// Используйте данные выбранного сценария
const scenarioData = scenarios[selectedScenario];
```

### 3. Добавьте сравнение сценариев
```typescript
// Новая вкладка "Сравнение сценариев"
<ScenarioComparison 
  scenarios={['current_2025', 'planned_16_2030']}
/>
```

## 💡 ПРЕИМУЩЕСТВА ЭТОГО ПОДХОДА

- ⚡ **Быстро**: Переключение сценариев за ~50ms
- 📊 **Наглядно**: Визуальное сравнение показателей
- 🔧 **Гибко**: Легко добавлять новые сценарии
- 💾 **Эффективно**: Данные загружаются один раз
- 🎯 **Точно**: Все расчеты основаны на реальных данных

## 📋 СЛЕДУЮЩИЕ ЗАДАЧИ

1. **Немедленно**: Создать скрипт импорта Excel → JSON
2. **На этой неделе**: Добавить селектор сценариев в Dashboard  
3. **В ближайшем будущем**: Реализовать сравнение сценариев
4. **Долгосрочно**: Мигрировать в полноценную БД с API

Готов создать скрипт импорта данных? 🚀 