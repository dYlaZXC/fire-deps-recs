import fs from 'fs';
import path from 'path';

export interface Station {
  id: number;
  latitude: string | number;
  longitude: string | number;
  description: string;
  caption: string;
  district_id: number;
  exist: boolean;
  exist_text: string;
  number_of_staff: number;
  osnavnaya: number;
  vspomagatelnaya: number;
  specialnaya: number;
  dchs_id: number;
  color_exist: string;
  district_name_ru?: string;
  district_name_kz?: string;
}

export interface CoverageMetrics {
  total_cells: number;
  green_cells: number;
  orange_cells: number;
  red_cells: number;
  green_percentage: string;
  orange_percentage: string;
  red_percentage: string;
  total_population: number;
  served_population: number;
  population_coverage: string;
}

export interface DistrictStats {
  count: number;
  name_ru?: string;
  name_kz?: string;
}

export interface Scenario {
  name: string;
  description: string;
  stations: Station[];
  total_stations: number;
  districts_stats: Record<string, DistrictStats>;
  coverage_data: any[];
  coverage_metrics: CoverageMetrics;
}

export interface ScenariosData {
  current: Scenario;
  planned_5: Scenario;
  planned_16: Scenario;
  ai_recommendations: Scenario;
}

export function loadScenarios(): ScenariosData | null {
  try {
    const filePath = path.join(process.cwd(), 'data', 'scenarios.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Преобразуем ключи для соответствия интерфейсу
    return {
      current: data.current,
      planned_5: data.planned_5,
      planned_16: data.planned_16,
      ai_recommendations: data.ai_recommendations
    };
  } catch (error) {
    console.error('Ошибка загрузки scenarios.json:', error);
    return null;
  }
}

export function getScenarioKPIs(scenarios: ScenariosData | null) {
  if (!scenarios) {
    return {
      current: { stations: 0, populationCoverage: 0, incidentCoverage: 0, highRiskCoverage: 0 },
      planned5: { stations: 0, populationCoverage: 0, incidentCoverage: 0, highRiskCoverage: 0 },
      planned16: { stations: 0, populationCoverage: 0, incidentCoverage: 0, highRiskCoverage: 0 },
      aiRecommended: { stations: 0, populationCoverage: 0, incidentCoverage: 0, highRiskCoverage: 0 },
    };
  }

  const calculateMetrics = (scenario: any) => {
    if (!scenario?.coverage_grids) {
      return {
        stations: 0,
        populationCoverage: 0,
        incidentCoverage: 0,
        highRiskCoverage: 0
      };
    }

    const grids = scenario.coverage_grids;
    const totalPopulation = grids.reduce((sum: number, g: any) => sum + (g.population || 0), 0);
    const coveredPopulation = grids
      .filter((g: any) => g.color === 'green' || g.color === 'orange')
      .reduce((sum: number, g: any) => sum + (g.population || 0), 0);

    const totalIncidents = grids.reduce((sum: number, g: any) => sum + (g.fire_count || 0), 0);
    const coveredIncidents = grids
      .filter((g: any) => g.color === 'green' || g.color === 'orange')
      .reduce((sum: number, g: any) => sum + (g.fire_count || 0), 0);

    const totalRiskObjects = grids.reduce((sum: number, g: any) => sum + (g.all_risk_objects || 0), 0);
    const coveredRiskObjects = grids
      .filter((g: any) => g.color === 'green' || g.color === 'orange')
      .reduce((sum: number, g: any) => sum + (g.all_risk_objects || 0), 0);

    return {
      stations: scenario.stations?.length || 0,
      populationCoverage: totalPopulation > 0 ? parseFloat(((coveredPopulation / totalPopulation) * 100).toFixed(2)) : 0,
      incidentCoverage: totalIncidents > 0 ? parseFloat(((coveredIncidents / totalIncidents) * 100).toFixed(2)) : 0,
      highRiskCoverage: totalRiskObjects > 0 ? parseFloat(((coveredRiskObjects / totalRiskObjects) * 100).toFixed(2)) : 0
    };
  };

  return {
    current: calculateMetrics(scenarios.current),
    planned5: calculateMetrics(scenarios.planned_5),
    planned16: calculateMetrics(scenarios.planned_16),
    aiRecommended: calculateMetrics(scenarios.ai_recommendations)
  };
}

export function getDistrictAnalysis(scenarios: ScenariosData | null) {
  if (!scenarios) return [];

  const districts = new Set<string>();
  
  // Собираем все районы
  Object.values(scenarios).forEach(scenario => {
    Object.keys(scenario.districts_stats || {}).forEach(district => {
      districts.add(district);
    });
  });

  return Array.from(districts).map(district => ({
    district,
    current: {
      population: scenarios.current.districts_stats[district]?.count || 0,
      incidents: scenarios.current.districts_stats[district]?.count || 0,
      buildings: scenarios.current.districts_stats[district]?.count || 0,
    },
    planned5: {
      population: scenarios.planned_5.districts_stats[district]?.count || 0,
      incidents: scenarios.planned_5.districts_stats[district]?.count || 0,
      buildings: scenarios.planned_5.districts_stats[district]?.count || 0,
    },
    planned16: {
      population: scenarios.planned_16.districts_stats[district]?.count || 0,
      incidents: scenarios.planned_16.districts_stats[district]?.count || 0,
      buildings: scenarios.planned_16.districts_stats[district]?.count || 0,
    },
    aiRecommended: {
      population: scenarios.ai_recommendations.districts_stats[district]?.count || 0,
      incidents: scenarios.ai_recommendations.districts_stats[district]?.count || 0,
      buildings: scenarios.ai_recommendations.districts_stats[district]?.count || 0,
    },
  }));
}

export function getCumulativeCoverage(scenarios: ScenariosData | null) {
  if (!scenarios) return [];

  const calculateCoverage = (scenario: any) => {
    if (!scenario?.coverage_grids) {
      return {
        stations: 0,
        population: 0,
        incidents: 0,
        buildings: 0
      };
    }

    const grids = scenario.coverage_grids;
    const totalPopulation = grids.reduce((sum: number, g: any) => sum + (g.population || 0), 0);
    const coveredPopulation = grids
      .filter((g: any) => g.color === 'green' || g.color === 'orange')
      .reduce((sum: number, g: any) => sum + (g.population || 0), 0);

    const totalIncidents = grids.reduce((sum: number, g: any) => sum + (g.fire_count || 0), 0);
    const coveredIncidents = grids
      .filter((g: any) => g.color === 'green' || g.color === 'orange')
      .reduce((sum: number, g: any) => sum + (g.fire_count || 0), 0);

    const totalRiskObjects = grids.reduce((sum: number, g: any) => sum + (g.all_risk_objects || 0), 0);
    const coveredRiskObjects = grids
      .filter((g: any) => g.color === 'green' || g.color === 'orange')
      .reduce((sum: number, g: any) => sum + (g.all_risk_objects || 0), 0);

    return {
      stations: scenario.stations?.length || 0,
      population: totalPopulation > 0 ? parseFloat(((coveredPopulation / totalPopulation) * 100).toFixed(2)) : 0,
      incidents: totalIncidents > 0 ? parseFloat(((coveredIncidents / totalIncidents) * 100).toFixed(2)) : 0,
      buildings: totalRiskObjects > 0 ? parseFloat(((coveredRiskObjects / totalRiskObjects) * 100).toFixed(2)) : 0
    };
  };

  return [
    {
      ...calculateCoverage(scenarios.current),
      scenario: "Текущее состояние"
    },
    {
      ...calculateCoverage(scenarios.planned_5),
      scenario: "Планируемые +5"
    },
    {
      ...calculateCoverage(scenarios.planned_16),
      scenario: "Планируемые +16"
    },
    {
      ...calculateCoverage(scenarios.ai_recommendations),
      scenario: "AI рекомендации"
    }
  ];
} 