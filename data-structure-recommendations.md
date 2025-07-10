# 🎯 РЕКОМЕНДАЦИИ ПО РЕОРГАНИЗАЦИИ ДАННЫХ FIRE STATION DASHBOARD

## 📊 Текущая ситуация

### Файлы со станциями:
- **dchs_fire_stations123.xlsx** → 41 текущая станция
- **dchs_fire_stations_plan_2030.xlsx** → 62 планируемые станции  
- **dchs_fire_stations_plan_predict.xlsx** → 36 AI рекомендаций

### Файлы с покрытием:
- **dchs_demo_grids_population2.xlsx** → 3938 сеток с покрытием (только текущее)
- **dchs_plan_2030.xlsx** → отсутствует (планируемое покрытие)
- **recommendations.xlsx** → отсутствует (AI покрытие)

## 🎯 РЕКОМЕНДУЕМАЯ СТРУКТУРА БД

### 1. Таблица сценариев
```sql
CREATE TABLE scenarios (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  year INT NOT NULL,
  station_count INT,
  status ENUM('current', 'planned', 'predicted') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO scenarios VALUES
('current_2025', 'Текущие станции 2025', 'Действующие 41 станция', 2025, 41, 'current'),
('planned_5_2030', 'План +5 станций', 'Планируемые 5 дополнительных станций', 2030, 46, 'planned'),
('planned_16_2030', 'План +16 станций', 'Планируемые 16 дополнительных станций', 2030, 57, 'planned'),
('ai_predict_2030', 'AI рекомендации', 'AI оптимизированное размещение', 2030, 36, 'predicted');
```

### 2. Таблица станций
```sql
CREATE TABLE fire_stations (
  id INT PRIMARY KEY,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  description TEXT,
  caption VARCHAR(255),
  district_id INT,
  exist BOOLEAN DEFAULT FALSE,
  number_of_staff INT,
  city_area_id INT,
  osnavnaya INT DEFAULT 0,
  vspomagatelnaya INT DEFAULT 0,
  specialnaya INT DEFAULT 0,
  dchs_id VARCHAR(50),
  geom_wkt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Связующая таблица станций и сценариев
```sql
CREATE TABLE scenario_stations (
  scenario_id VARCHAR(50),
  station_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  station_type ENUM('existing', 'new', 'relocated') DEFAULT 'existing',
  priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
  PRIMARY KEY (scenario_id, station_id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id),
  FOREIGN KEY (station_id) REFERENCES fire_stations(id)
);
```

### 4. Таблица сеток (базовая геометрия)
```sql
CREATE TABLE grids (
  id INT PRIMARY KEY,
  grid_id INT UNIQUE NOT NULL,
  district_id INT,
  note TEXT,
  x DECIMAL(10,8),
  y DECIMAL(10,8),
  shape_leng DECIMAL(15,4),
  shape_area DECIMAL(15,4),
  geometry TEXT,
  rayon VARCHAR(255),
  INDEX idx_grid_id (grid_id),
  INDEX idx_district (district_id)
);
```

### 5. Таблица покрытия по сценариям
```sql
CREATE TABLE grid_coverage (
  grid_id INT,
  scenario_id VARCHAR(50),
  available_in_15 BOOLEAN DEFAULT FALSE,
  available_in_30 BOOLEAN DEFAULT FALSE,
  coverage_score DECIMAL(5,2),
  response_time_min DECIMAL(4,1),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (grid_id, scenario_id),
  FOREIGN KEY (grid_id) REFERENCES grids(grid_id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
);
```

### 6. Демографические данные
```sql
CREATE TABLE grid_demographics (
  grid_id INT,
  year INT,
  age_0_14 INT DEFAULT 0,
  age_15_25 INT DEFAULT 0,
  age_26_35 INT DEFAULT 0,
  age_36_45 INT DEFAULT 0,
  age_46_55 INT DEFAULT 0,
  age_56_65 INT DEFAULT 0,
  age_66_plus INT DEFAULT 0,
  total_population INT DEFAULT 0,
  population_density DECIMAL(15,10),
  population_rank INT,
  PRIMARY KEY (grid_id, year),
  FOREIGN KEY (grid_id) REFERENCES grids(grid_id)
);
```

### 7. Пожарная статистика и риски
```sql
CREATE TABLE grid_fire_data (
  grid_id INT,
  year INT,
  fire_count INT DEFAULT 0,
  fire_density DECIMAL(15,10),
  fire_density_rank INT,
  rang_1_risk INT DEFAULT 0,
  rang_2_risk INT DEFAULT 0,
  rang_2b_risk INT DEFAULT 0,
  rang_3_risk INT DEFAULT 0,
  total_risk_objects INT DEFAULT 0,
  risk_score DECIMAL(5,2),
  PRIMARY KEY (grid_id, year),
  FOREIGN KEY (grid_id) REFERENCES grids(grid_id)
);
```

## 💡 ПРЕИМУЩЕСТВА НОВОЙ СТРУКТУРЫ

### 1. **Производительность**
- ✅ Быстрые запросы по сценариям
- ✅ Индексы по ключевым полям
- ✅ Кэширование результатов

### 2. **Масштабируемость**
- ✅ Легко добавлять новые сценарии
- ✅ Историчность данных
- ✅ Поддержка множественных лет

### 3. **Гибкость**
- ✅ Сравнение сценариев
- ✅ Динамические фильтры
- ✅ Пользовательские сценарии

## 🔄 ПЛАН МИГРАЦИИ

### Этап 1: Создание структуры
```javascript
// API endpoints
GET /api/scenarios - список сценариев
GET /api/scenarios/{id}/coverage - покрытие по сценарию
GET /api/scenarios/{id}/stations - станции сценария
POST /api/scenarios/compare - сравнение сценариев
```

### Этап 2: Импорт данных
```javascript
// Парсинг Excel файлов
const parseStations = (file, scenarioId) => {
  // Импорт станций из Excel
};

const parseCoverage = (file, scenarioId) => {
  // Расчет покрытия для сценария
};
```

### Этап 3: Интеграция с React
```typescript
interface ScenarioData {
  id: string;
  name: string;
  stations: FireStation[];
  coverage: GridCoverage[];
  metrics: CoverageMetrics;
}

const useScenarioData = (scenarioId: string) => {
  // Hook для загрузки данных сценария
};
```

## 🚀 API СТРУКТУРА

### Запросы для Dashboard:
```javascript
// Получить данные сценария
GET /api/scenarios/current_2025/full

// Сравнить сценарии  
POST /api/compare
{
  "scenarios": ["current_2025", "planned_16_2030"],
  "metrics": ["coverage", "response_time", "population"]
}

// Поиск оптимального размещения
POST /api/optimize
{
  "constraints": {
    "max_stations": 50,
    "min_coverage": 0.8,
    "budget": 1000000
  }
}
```

## 📈 УЛУЧШЕНИЯ ДЛЯ DASHBOARD

### 1. Селектор сценариев
```typescript
const ScenarioSelector = () => {
  const [selectedScenario, setSelectedScenario] = useState('current_2025');
  // Dropdown с 4 сценариями
};
```

### 2. Сравнение сценариев
```typescript
const ScenarioComparison = () => {
  // Side-by-side comparison of metrics
  // Charts showing differences
};
```

### 3. Динамические расчеты
```typescript
const CoverageCalculator = () => {
  // Real-time coverage calculation
  // What-if scenarios
};
```

Хотите, чтобы я создал скрипты для импорта данных и обновил Dashboard компонент? 