"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Line, LineChart, Legend } from "recharts"
import {
  MapPin,
  Flame,
  Clock,
  Users,
  AlertTriangle,
  Droplets,
  Activity,
  Building,
  Info,
  CheckCircle,
  XCircle,
  Target,
  TrendingUp,
  Shield,
  } from "lucide-react"
import MapComponent from "./map-component"
import CallsAnalysisDashboard from "./calls-analysis-dashboard"
import { ResponsiveContainer } from "recharts"

// Interfaces for real data
interface Station {
  id: number
  latitude: string
  longitude: string
  description: string
  caption: string
  district_id: number
  district_name?: string
  district_name_kz?: string
  exist_text: string
  has_land?: boolean // Для динамических рекомендаций
  score?: number // Оценка рекомендации
  land_info?: {
    kad_nomer?: string
    granted_right?: string
    land_use_term?: string
    celevoe?: string
    location?: string
    area?: number
    divisible_plot?: string
    limitations?: string
    district_name?: string
    centroid?: string
  }
}

interface CoverageGrid {
  district_id: number
  geometry: string
  color: string
  population: number
  fire_count: number
  all_risk_objects?: number
  availabe_in_15_text?: string
  availabe_in_30_text?: string
  shape_area?: number
}

interface DistrictStat {
  district_id: number
  district_name: string
  district_name_kz: string
  red_zones: number
  yellow_zones: number
  green_zones: number
  total_population: number
  total_fire_incidents: number
  total_area: number
  total_risk_objects: number
}

interface Scenario {
  name: string
  description: string
  stations: Station[]
  coverage_grids: CoverageGrid[]
  district_stats: DistrictStat[]
}

interface ScenariosData {
  current: Scenario
  planned5: Scenario
  planned16: Scenario
  aiRecommended: Scenario
  metadata: {
    updated: string
    source_files: string[]
    districts: Array<{id: number, name_ru: string, name_kz: string}>
  }
}

// Enhanced mock data for Fire Stations Accessibility
const accessibilityKPIs = {
  current: {
    stations: 20,
    populationCoverage: 72.4,
    incidentCoverage: 68.9,
    highRiskCoverage: 65.2,
  },
  planned5: {
    stations: 25,
    populationCoverage: 81.7,
    incidentCoverage: 78.3,
    highRiskCoverage: 74.8,
  },
  planned16: {
    stations: 36,
    populationCoverage: 92.1,
    incidentCoverage: 89.6,
    highRiskCoverage: 87.3,
  },
  aiRecommended: {
    stations: 35, // Обновлено: 20 существующих + 5 планируемых + 10 рекомендуемых
    populationCoverage: 94.8,
    incidentCoverage: 92.4,
    highRiskCoverage: 91.7,
  },
}

const districtAnalysis = [
  {
    district: "Downtown",
    current: { population: 89, incidents: 85, buildings: 82 },
    planned5: { population: 92, incidents: 89, buildings: 86 },
    planned16: { population: 96, incidents: 94, buildings: 92 },
    aiRecommended: { population: 98, incidents: 96, buildings: 95 },
  },
  {
    district: "Industrial East",
    current: { population: 45, incidents: 52, buildings: 48 },
    planned5: { population: 68, incidents: 72, buildings: 65 },
    planned16: { population: 85, incidents: 88, buildings: 82 },
    aiRecommended: { population: 91, incidents: 94, buildings: 89 },
  },
  {
    district: "North Residential",
    current: { population: 78, incidents: 74, buildings: 71 },
    planned5: { population: 82, incidents: 79, buildings: 76 },
    planned16: { population: 91, incidents: 89, buildings: 86 },
    aiRecommended: { population: 93, incidents: 91, buildings: 88 },
  },
  {
    district: "South Residential",
    current: { population: 82, incidents: 79, buildings: 76 },
    planned5: { population: 86, incidents: 83, buildings: 80 },
    planned16: { population: 93, incidents: 91, buildings: 88 },
    aiRecommended: { population: 95, incidents: 93, buildings: 90 },
  },
  {
    district: "Commercial West",
    current: { population: 71, incidents: 68, buildings: 64 },
    planned5: { population: 79, incidents: 76, buildings: 72 },
    planned16: { population: 88, incidents: 86, buildings: 83 },
    aiRecommended: { population: 92, incidents: 90, buildings: 87 },
  },
  {
    district: "Waterfront",
    current: { population: 58, incidents: 61, buildings: 55 },
    planned5: { population: 72, incidents: 75, buildings: 68 },
    planned16: { population: 84, incidents: 87, buildings: 81 },
    aiRecommended: { population: 89, incidents: 92, buildings: 86 },
  },
]

const cumulativeCoverage = [
  { stations: 20, population: 72.4, incidents: 68.9, buildings: 65.2, scenario: "Current" },
  { stations: 22, population: 76.8, incidents: 72.1, buildings: 68.9, scenario: "Current + 2" },
  { stations: 25, population: 81.7, incidents: 78.3, buildings: 74.8, scenario: "Current + 5" },
  { stations: 28, population: 85.2, incidents: 82.1, buildings: 78.6, scenario: "Current + 8" },
  { stations: 32, population: 88.9, incidents: 85.7, buildings: 82.4, scenario: "Current + 12" },
  { stations: 36, population: 92.1, incidents: 89.6, buildings: 87.3, scenario: "Current + 16" },
]

const aiRecommendedStations = [
  {
    id: 43,
    landInfo: {
      kad_nomer: "20322025401.0",
      granted_right: "частная собственность",
      land_use_term: "",
      celevoe: "для ведения личного подсобного хозяйства",
      location: "улица Азербаева, дом б/н, с. Карагайлы, Наурызбайский район",
      area: 550.0,
      divisible_plot: "да",
      geom_wkt: "POINT(76.8527853285585 43.1750130170782)"
    }
  },
  {
    id: 39,
    landInfo: {
      kad_nomer: "20321042768.0",
      granted_right: "временное возмездное долгосрочное землепользование",
      land_use_term: "5 лет, до 02 сентября 2025 года",
      celevoe: "для эксплуатации и обслуживания жилого дома",
      location: "г.Алматы, Алатауский район, микрорайон Шанырак-1, улица Жанаталап, 23",
      area: 655.0,
      divisible_plot: "нет",
      geom_wkt: "POINT(76.8657798444513 43.2895310483861)"
    }
  },
  {
    id: 40,
    landInfo: {
      kad_nomer: "203130561210.0",
      granted_right: "частная собственность",
      land_use_term: "",
      celevoe: "для садоводства",
      location: "г. Алматы, Бостандыкский район, садоводческое товарищество \"Энергетик\", переулок Восточный, участок 4",
      area: 890.0,
      divisible_plot: "да",
      geom_wkt: "POINT(76.9364450794078 43.3003443022758)"
    }
  },
  {
    id: 37,
    landInfo: {
      kad_nomer: "20317024039.0",
      granted_right: "постоянное землепользование",
      land_use_term: "",
      celevoe: "для эксплуатации и обслуживания автодрома",
      location: "г. Алматы Турксибский р-н., восточнее автомагистрали Капчагай, севернее ул. Бекмаханова,Турксибский район ориен.мест.",
      area: 87245.0,
      divisible_plot: "нет",
      geom_wkt: "POINT(76.9425724664789 43.3570059934677)"
    }
  },
  {
    id: 44,
    landInfo: {
      kad_nomer: "20315916273.0",
      granted_right: "общая долевая собственность",
      land_use_term: "",
      celevoe: "для эксплуатации и обслуживания жилого дома",
      location: "улица Сарсенбаева, дом 182, Медеуский район",
      area: 1638.0,
      divisible_plot: "нет",
      geom_wkt: "POINT(76.9923473178305 43.2633991250275)"
    }
  },
  {
    id: 46,
    landInfo: {
      kad_nomer: "20311012138.0",
      granted_right: "общая долевая собственность",
      land_use_term: "",
      celevoe: "для эксплуатации и обслуживания жилого дома, магазина, офиса и выставочного зала",
      location: "г. Алматы Алмалинский р-н., ул. Айманова, д. 3",
      area: 806.0,
      divisible_plot: "нет",
      geom_wkt: "POINT(76.8953973659699 43.2504914255177)"
    }
  },
  {
    id: 45,
    landInfo: {
      kad_nomer: "",
      granted_right: "",
      land_use_term: "",
      celevoe: "",
      location: "",
      area: null,
      divisible_plot: "",
      geom_wkt: "POINT(76.838049497487 43.3406891208943)"
    }
  },
  {
    id: 42,
    landInfo: {
      kad_nomer: "",
      granted_right: "",
      land_use_term: "",
      celevoe: "",
      location: "",
      area: null,
      divisible_plot: "",
      geom_wkt: "POINT(76.7973236213588 43.2498437431006)"
    }
  },
  {
    id: 41,
    landInfo: {
      kad_nomer: "",
      granted_right: "",
      land_use_term: "",
      celevoe: "",
      location: "",
      area: null,
      divisible_plot: "",
      geom_wkt: "POINT(76.9177799616102 43.1971270187262)"
    }
  },
  {
    id: 38,
    landInfo: {
      kad_nomer: "",
      granted_right: "",
      land_use_term: "",
      celevoe: "",
      location: "",
      area: null,
      divisible_plot: "",
      geom_wkt: "POINT(76.957221300487 43.2073943511688)"
    }
  }
]

const mapStations = {
  current: [
    { id: 1, x: 25, y: 30, name: "Station 1", type: "current" },
    { id: 2, x: 65, y: 20, name: "Station 2", type: "current" },
    { id: 3, x: 45, y: 60, name: "Station 3", type: "current" },
    { id: 4, x: 80, y: 75, name: "Station 4", type: "current" },
    { id: 5, x: 15, y: 50, name: "Station 5", type: "current" },
    { id: 6, x: 70, y: 45, name: "Station 6", type: "current" },
    { id: 7, x: 35, y: 25, name: "Station 7", type: "current" },
    { id: 8, x: 55, y: 80, name: "Station 8", type: "current" },
    { id: 9, x: 85, y: 40, name: "Station 9", type: "current" },
    { id: 10, x: 20, y: 70, name: "Station 10", type: "current" },
    { id: 11, x: 60, y: 35, name: "Station 11", type: "current" },
    { id: 12, x: 40, y: 85, name: "Station 12", type: "current" },
    { id: 13, x: 75, y: 60, name: "Station 13", type: "current" },
    { id: 14, x: 30, y: 15, name: "Station 14", type: "current" },
    { id: 15, x: 90, y: 55, name: "Station 15", type: "current" },
    { id: 16, x: 10, y: 35, name: "Station 16", type: "current" },
    { id: 17, x: 50, y: 10, name: "Station 17", type: "current" },
    { id: 18, x: 85, y: 85, name: "Station 18", type: "current" },
    { id: 19, x: 15, y: 85, name: "Station 19", type: "current" },
    { id: 20, x: 65, y: 65, name: "Station 20", type: "current" },
  ],
  planned5: [
    { id: 21, x: 12, y: 45, name: "Planned A", type: "planned5" },
    { id: 22, x: 38, y: 42, name: "Planned B", type: "planned5" },
    { id: 23, x: 72, y: 28, name: "Planned C", type: "planned5" },
    { id: 24, x: 88, y: 68, name: "Planned D", type: "planned5" },
    { id: 25, x: 52, y: 52, name: "Planned E", type: "planned5" },
  ],
  planned16: [
    { id: 26, x: 8, y: 25, name: "Long-term F", type: "planned16" },
    { id: 27, x: 28, y: 38, name: "Long-term G", type: "planned16" },
    { id: 28, x: 48, y: 22, name: "Long-term H", type: "planned16" },
    { id: 29, x: 68, y: 52, name: "Long-term I", type: "planned16" },
    { id: 30, x: 82, y: 32, name: "Long-term J", type: "planned16" },
    { id: 31, x: 92, y: 72, name: "Long-term K", type: "planned16" },
    { id: 32, x: 18, y: 62, name: "Long-term L", type: "planned16" },
    { id: 33, x: 42, y: 78, name: "Long-term M", type: "planned16" },
    { id: 34, x: 58, y: 88, name: "Long-term N", type: "planned16" },
    { id: 35, x: 78, y: 18, name: "Long-term O", type: "planned16" },
    { id: 36, x: 95, y: 45, name: "Long-term P", type: "planned16" },
  ],
  aiRecommended: [
    { id: 37, x: 22, y: 55, name: "AI Rec 1", type: "aiRecommended", priority: "Critical" },
    { id: 38, x: 58, y: 38, name: "AI Rec 2", type: "aiRecommended", priority: "High" },
    { id: 39, x: 32, y: 68, name: "AI Rec 3", type: "aiRecommended", priority: "High" },
    { id: 40, x: 78, y: 82, name: "AI Rec 4", type: "aiRecommended", priority: "Medium" },
    { id: 41, x: 88, y: 25, name: "AI Rec 5", type: "aiRecommended", priority: "Medium" },
    { id: 42, x: 5, y: 75, name: "AI Rec 6", type: "aiRecommended", priority: "Medium" },
    { id: 43, x: 62, y: 15, name: "AI Rec 7", type: "aiRecommended", priority: "Low" },
    { id: 44, x: 95, y: 88, name: "AI Rec 8", type: "aiRecommended", priority: "Low" },
    { id: 45, x: 8, y: 8, name: "AI Rec 9", type: "aiRecommended", priority: "Low" },
    { id: 46, x: 48, y: 95, name: "AI Rec 10", type: "aiRecommended", priority: "Low" },
  ],
}

// Enhanced mock data for Hydrant Infrastructure
const hydrantKPIs = {
  totalHydrants: 1847,
  operationalPercentage: 89.3,
  within200mBuildings: 94.7,
  firesWithNearbyHydrants: 87.2,
  coverageGap: 127,
}

const hydrantStatusData = [
  { status: "Working", count: 1649, percentage: 89.3, color: "#22c55e" },
  { status: "Broken", count: 128, percentage: 6.9, color: "#ef4444" },
  { status: "Missing", count: 70, percentage: 3.8, color: "#f59e0b" },
]

const districtCoverage = [
  { district: "Downtown", buildingsCovered: 97.2, hydrantDensity: 8.4, riskLevel: "High" },
  { district: "Industrial East", buildingsCovered: 82.1, hydrantDensity: 5.2, riskLevel: "Critical" },
  { district: "North Residential", buildingsCovered: 91.8, hydrantDensity: 6.8, riskLevel: "Medium" },
  { district: "South Residential", buildingsCovered: 93.4, hydrantDensity: 7.1, riskLevel: "Medium" },
  { district: "Commercial West", buildingsCovered: 88.9, hydrantDensity: 6.9, riskLevel: "High" },
  { district: "Waterfront", buildingsCovered: 76.3, hydrantDensity: 4.1, riskLevel: "High" },
]

const currentHydrants = [
  { id: 1, x: 25, y: 30, status: "working", district: "Downtown", lastInspection: "2024-01-15" },
  { id: 2, x: 28, y: 35, status: "working", district: "Downtown", lastInspection: "2024-01-10" },
  { id: 3, x: 65, y: 20, status: "broken", district: "Commercial", lastInspection: "2023-12-20" },
  { id: 4, x: 45, y: 60, status: "working", district: "Residential", lastInspection: "2024-01-08" },
  { id: 5, x: 80, y: 75, status: "working", district: "Industrial", lastInspection: "2024-01-12" },
  { id: 6, x: 15, y: 50, status: "missing", district: "Waterfront", lastInspection: "2023-11-15" },
  { id: 7, x: 70, y: 45, status: "working", district: "Commercial", lastInspection: "2024-01-05" },
  { id: 8, x: 35, y: 25, status: "broken", district: "Downtown", lastInspection: "2023-12-28" },
  { id: 9, x: 55, y: 80, status: "working", district: "Industrial", lastInspection: "2024-01-14" },
  { id: 10, x: 85, y: 40, status: "working", district: "Commercial", lastInspection: "2024-01-11" },
  { id: 11, x: 20, y: 70, status: "working", district: "Residential", lastInspection: "2024-01-09" },
  { id: 12, x: 60, y: 35, status: "working", district: "Downtown", lastInspection: "2024-01-13" },
  { id: 13, x: 40, y: 85, status: "broken", district: "Waterfront", lastInspection: "2023-12-15" },
  { id: 14, x: 75, y: 60, status: "working", district: "Industrial", lastInspection: "2024-01-07" },
  { id: 15, x: 30, y: 15, status: "working", district: "Downtown", lastInspection: "2024-01-16" },
  { id: 16, x: 90, y: 55, status: "missing", district: "Commercial", lastInspection: "2023-10-20" },
  { id: 17, x: 10, y: 35, status: "working", district: "Waterfront", lastInspection: "2024-01-06" },
  { id: 18, x: 50, y: 10, status: "working", district: "Downtown", lastInspection: "2024-01-17" },
  { id: 19, x: 85, y: 85, status: "working", district: "Industrial", lastInspection: "2024-01-04" },
  { id: 20, x: 15, y: 85, status: "broken", district: "Waterfront", lastInspection: "2023-12-10" },
]

const recommendedHydrants = [
  {
    id: 101,
    x: 22,
    y: 55,
    priority: "Critical",
    reason: "Fire hotspot, 350m from nearest hydrant",
    buildingsServed: 23,
    riskScore: 94.2,
    estimatedCost: 15000,
  },
  {
    id: 102,
    x: 58,
    y: 38,
    priority: "High",
    reason: "High-rise cluster, inadequate coverage",
    buildingsServed: 18,
    riskScore: 87.6,
    estimatedCost: 12000,
  },
  {
    id: 103,
    x: 78,
    y: 82,
    priority: "High",
    reason: "Industrial zone, chemical storage",
    buildingsServed: 15,
    riskScore: 89.1,
    estimatedCost: 18000,
  },
  {
    id: 104,
    x: 32,
    y: 68,
    priority: "Medium",
    reason: "Residential expansion, growing density",
    buildingsServed: 12,
    riskScore: 76.3,
    estimatedCost: 11000,
  },
  {
    id: 105,
    x: 88,
    y: 25,
    priority: "Medium",
    reason: "Commercial district gap",
    buildingsServed: 14,
    riskScore: 72.8,
    estimatedCost: 13000,
  },
  {
    id: 106,
    x: 8,
    y: 75,
    priority: "Low",
    reason: "Backup coverage, emergency access",
    buildingsServed: 8,
    riskScore: 65.4,
    estimatedCost: 10000,
  },
]

const hydrantDetailData = [
  {
    id: "H-001",
    coordinates: "40.7589, -73.9851",
    status: "Working",
    district: "Downtown",
    lastInspection: "2024-01-15",
    pressure: "65 PSI",
    flowRate: "1200 GPM",
    riskZone: "High",
  },
  {
    id: "H-002",
    coordinates: "40.7505, -73.9934",
    status: "Broken",
    district: "Commercial",
    lastInspection: "2023-12-20",
    pressure: "0 PSI",
    flowRate: "0 GPM",
    riskZone: "Medium",
  },
  {
    id: "H-003",
    coordinates: "40.7614, -73.9776",
    status: "Working",
    district: "Residential",
    lastInspection: "2024-01-08",
    pressure: "58 PSI",
    flowRate: "1100 GPM",
    riskZone: "Low",
  },
  {
    id: "H-004",
    coordinates: "40.7681, -73.9872",
    status: "Missing",
    district: "Waterfront",
    lastInspection: "2023-11-15",
    pressure: "N/A",
    flowRate: "N/A",
    riskZone: "High",
  },
  {
    id: "H-005",
    coordinates: "40.7420, -73.9865",
    status: "Working",
    district: "Industrial",
    lastInspection: "2024-01-12",
    pressure: "72 PSI",
    flowRate: "1350 GPM",
    riskZone: "Critical",
  },
]

const gapReductionData = [
  { district: "Downtown", currentGap: 12, afterRecommendations: 3, reduction: 75 },
  { district: "Industrial East", currentGap: 28, afterRecommendations: 8, reduction: 71 },
  { district: "North Residential", currentGap: 18, afterRecommendations: 6, reduction: 67 },
  { district: "South Residential", currentGap: 15, afterRecommendations: 4, reduction: 73 },
  { district: "Commercial West", currentGap: 22, afterRecommendations: 7, reduction: 68 },
  { district: "Waterfront", currentGap: 32, afterRecommendations: 12, reduction: 63 },
]

const SelectedStationsInfo = ({ stations }: { stations: Station[] }) => {
  if (stations.length === 0) {
    return null
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Информация о выбранных депо ({stations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stations.map((station, index) => (
            <div key={station.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{station.description}</h4>
                <Badge variant={station.has_land ? "default" : "destructive"}>
                  {station.has_land ? "С землей" : "Без земли"}
                </Badge>
              </div>
              
              {station.land_info && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Кадастровый номер:</span>
                    <p className="text-gray-600">{station.land_info.kad_nomer || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Форма собственности:</span>
                    <p className="text-gray-600">{station.land_info.granted_right || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Срок землепользования:</span>
                    <p className="text-gray-600">{station.land_info.land_use_term || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Целевое назначение:</span>
                    <p className="text-gray-600">{station.land_info.celevoe || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Местоположение:</span>
                    <p className="text-gray-600">{station.land_info.location || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Площадь:</span>
                    <p className="text-gray-600">{station.land_info.area ? `${station.land_info.area} м²` : 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Делимость участка:</span>
                    <p className="text-gray-600">{station.land_info.divisible_plot || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Район:</span>
                    <p className="text-gray-600">{station.land_info.district_name || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="font-medium">Ограничения:</span>
                    <p className="text-gray-600">{station.land_info.limitations || 'Нет данных'}</p>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <span className="font-medium">Центроид:</span>
                    <p className="text-gray-600 font-mono text-xs">{station.land_info.centroid || 'N/A'}</p>
                  </div>
                </div>
              )}
              
              {!station.land_info && (
                <p className="text-gray-500 text-sm">
                  Для данной рекомендации требуется покупка земли. Подходящий участок не найден.
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const DistrictDistributionCharts = ({ populationData, areaData }: { 
  populationData: { district: string; value: number }[],
  areaData: { district: string; value: number }[]
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Population Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение населения в красной зоне по районам</CardTitle>
                            <CardDescription>
                    Население без покрытия пожарных депо по районам
                  </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={populationData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit=" тыс." tick={{ fill: '#000000' }} />
                <YAxis 
                  type="category" 
                  dataKey="district" 
                  width={100} 
                  tick={{ fontSize: 12, fill: '#000000' }}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[0.70rem] uppercase text-black">
                                Население:
                              </span>
                              <span className="font-bold text-black">
                                {data.value} тыс.
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="value" fill="#ef4444" name="Население" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Area Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Распределение площади в красной зоне по районам</CardTitle>
                            <CardDescription>
                    Площадь территории без покрытия пожарных депо по районам
                  </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" unit=" млн" tick={{ fill: '#000000' }} />
                <YAxis 
                  type="category" 
                  dataKey="district" 
                  width={100} 
                  tick={{ fontSize: 12, fill: '#000000' }}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[0.70rem] uppercase text-black">
                                Площадь:
                              </span>
                              <span className="font-bold text-black">
                                {data.value} млн
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar dataKey="value" fill="#ef4444" name="Площадь" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// Компонент для сравнения AI рекомендаций и плана +16
const AiVsPlanned16Comparison = ({ comparisonData }: { comparisonData: any }) => {
  return (
    <div className="space-y-6">
      {/* Первая линия графиков */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Покрытие по зонам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Покрытие по зонам
            </CardTitle>
            <CardDescription>Распределение территории по времени доступности</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                "До 5 мин": { label: "До 5 мин", color: "hsl(120, 70%, 50%)" },
                "5-10 мин": { label: "5-10 мин", color: "hsl(45, 70%, 50%)" },
                "Более 10 мин": { label: "Более 10 мин", color: "hsl(0, 70%, 50%)" },
              }}
              className="h-64"
            >
              <BarChart data={comparisonData.coverageComparison} margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="До 5 мин" fill="hsl(120, 70%, 50%)" name="До 5 мин" />
                <Bar dataKey="5-10 мин" fill="hsl(45, 70%, 50%)" name="5-10 мин" />
                <Bar dataKey="Более 10 мин" fill="hsl(0, 70%, 50%)" name="Более 10 мин" />
                <Legend />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Покрытие населения по районам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Покрытие населения по районам
            </CardTitle>
            <CardDescription>Сравнение по районам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                "Население AI": { label: "AI рекомендации", color: "hsl(260, 70%, 50%)" },
                "Население П16": { label: "План +16", color: "hsl(160, 70%, 50%)" },
              }}
              className="h-64"
            >
              <BarChart data={comparisonData.districtComparison} layout="vertical" margin={{ left: 100, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="district" type="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="Население AI" fill="hsl(260, 70%, 50%)" name="AI рекомендации" />
                <Bar dataKey="Население П16" fill="hsl(160, 70%, 50%)" name="План +16" />
                <Legend />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Вторая линия графиков */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Покрытие объектов риска по районам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-600" />
              Покрытие объектов риска по районам
            </CardTitle>
            <CardDescription>Сравнение по районам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                "Риски AI": { label: "AI рекомендации", color: "hsl(260, 70%, 50%)" },
                "Риски П16": { label: "План +16", color: "hsl(160, 70%, 50%)" },
              }}
              className="h-64"
            >
              <BarChart data={comparisonData.districtComparison} layout="vertical" margin={{ left: 100, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="district" type="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="Риски AI" fill="hsl(260, 70%, 50%)" name="AI рекомендации" />
                <Bar dataKey="Риски П16" fill="hsl(160, 70%, 50%)" name="План +16" />
                <Legend />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Покрытие пожаров по районам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-600" />
              Покрытие пожаров по районам
            </CardTitle>
            <CardDescription>Сравнение по районам</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                "Пожары AI": { label: "AI рекомендации", color: "hsl(260, 70%, 50%)" },
                "Пожары П16": { label: "План +16", color: "hsl(160, 70%, 50%)" },
              }}
              className="h-64"
            >
              <BarChart data={comparisonData.districtComparison} layout="vertical" margin={{ left: 100, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="district" type="category" width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="Пожары AI" fill="hsl(260, 70%, 50%)" name="AI рекомендации" />
                <Bar dataKey="Пожары П16" fill="hsl(160, 70%, 50%)" name="План +16" />
                <Legend />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function FireInfrastructureDashboard() {
  const [scenariosData, setScenariosData] = useState<ScenariosData | null>(null)
  const [selectedScenario, setSelectedScenario] = useState("current")
  const [selectedDistrict, setSelectedDistrict] = useState("all")
  const [selectedRiskType, setSelectedRiskType] = useState("population")
  const [viewType, setViewType] = useState("population")
  const [showCoverageZones, setShowCoverageZones] = useState(true)
  const [activeTab, setActiveTab] = useState("accessibility")

  // Hydrant specific states
  const [hydrantStatus, setHydrantStatus] = useState("all")
  const [coverageRadius, setCoverageRadius] = useState("200")
  const [riskLevel, setRiskLevel] = useState("all")
  const [showGapZones, setShowGapZones] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [analysisView, setAnalysisView] = useState("current")
  
      // Smart Recommendations states
    const [dynamicScenario, setDynamicScenario] = useState<any>(null)
    const [showSmartRecommendations, setShowSmartRecommendations] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [landFilters, setLandFilters] = useState({
      ownership: "all",
      max_area: 50000, // Увеличили по умолчанию для максимальной площади
      purpose: "all",
      min_lease_year: 0
    })
    const [customPurpose, setCustomPurpose] = useState("")
    const [selectedStations, setSelectedStations] = useState<Station[]>([])
    const [algorithmSettings, setAlgorithmSettings] = useState({
      num_stations: 5,
      coverage_radius: 2200
    })
    const [lastGenerationTime, setLastGenerationTime] = useState<Date | null>(null)
    const [generationStatus, setGenerationStatus] = useState<{type: 'info' | 'success' | 'error', message: string} | null>(null)

  // Состояние для динамических рекомендаций
  const [selectedDynamicStation, setSelectedDynamicStation] = useState<Station | null>(null)
  const [showAllDynamicStations, setShowAllDynamicStations] = useState(false)

  // Load real scenarios data
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const response = await fetch('/data/scenarios.json')
        const data = await response.json()
        setScenariosData(data)
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      }
    }
    
    loadScenarios()
  }, [])

  // Clear selected stations when switching tabs
  useEffect(() => {
    setSelectedStations([])
  }, [activeTab])

  const getStationColor = (type: string) => {
    switch (type) {
      case "current":
        return "bg-gray-700 border-gray-600"
      case "planned5":
        return "bg-blue-600 border-blue-500"
      case "planned16":
        return "bg-green-500 border-green-400"
      case "aiRecommended":
        return "bg-red-600 border-red-500"
      default:
        return "bg-gray-600 border-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-600"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getHydrantColor = (status: string) => {
    switch (status) {
      case "working":
        return "bg-green-500 border-green-400"
      case "broken":
        return "bg-red-500 border-red-400"
      case "missing":
        return "bg-yellow-500 border-yellow-400"
      default:
        return "bg-gray-500 border-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Working":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "Broken":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "Missing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getVisibleStations = () => {
    // Обработка динамического сценария
    if (selectedScenario === "dynamic" && dynamicScenario?.stations) {
      return dynamicScenario.stations
    }
    
    let stations = [...mapStations.current]

    if (selectedScenario === "planned5" || selectedScenario === "all") {
      stations = [...stations, ...mapStations.planned5]
    }
    if (selectedScenario === "planned16" || selectedScenario === "all") {
      stations = [...stations, ...mapStations.planned16]
    }
    if (selectedScenario === "aiRecommended" || selectedScenario === "all") {
      stations = [...stations, ...mapStations.aiRecommended]
    }

    return stations
  }

  // Функция для получения реальных данных сценария
  const getRealScenarioData = (scenarioName: string) => {
    if (!scenariosData) return null
    
    const scenario = scenariosData[scenarioName as keyof ScenariosData]
    if (!scenario || typeof scenario !== 'object' || !('stations' in scenario)) return null
    
    let filteredGrids = scenario.coverage_grids || []
    let filteredStations = scenario.stations || []
    
    if (selectedDistrict !== "all") {
      const districtId = parseInt(selectedDistrict)
      filteredGrids = filteredGrids.filter(g => g.district_id === districtId)
      filteredStations = filteredStations.filter(s => s.district_id === districtId)
    }
    
    const totalPopulation = filteredGrids.reduce((sum, g) => sum + (g.population || 0), 0)
    const coveredPopulation = filteredGrids.filter(g => g.color === 'green' || g.color === 'orange')
      .reduce((sum, g) => sum + (g.population || 0), 0)
    
    const totalFireIncidents = filteredGrids.reduce((sum, g) => sum + (g.fire_count || 0), 0)
    const coveredFireIncidents = filteredGrids.filter(g => g.color === 'green' || g.color === 'orange')
      .reduce((sum, g) => sum + (g.fire_count || 0), 0)

    const totalRiskObjects = filteredGrids.reduce((sum, g) => sum + (g.all_risk_objects || 0), 0)
    const coveredRiskObjects = filteredGrids.filter(g => g.color === 'green' || g.color === 'orange')
      .reduce((sum, g) => sum + (g.all_risk_objects || 0), 0)

    return {
      stations: filteredStations.length,
      populationCoverage: totalPopulation > 0 ? parseFloat(((coveredPopulation / totalPopulation) * 100).toFixed(2)) : 0,
      incidentCoverage: totalFireIncidents > 0 ? parseFloat(((coveredFireIncidents / totalFireIncidents) * 100).toFixed(2)) : 0,
      highRiskCoverage: totalRiskObjects > 0 ? parseFloat(((coveredRiskObjects / totalRiskObjects) * 100).toFixed(2)) : 0,
    }
  }

  const getCurrentScenarioData = () => {
    return getRealScenarioData(selectedScenario) || {
      stations: 0,
      populationCoverage: 0,
      incidentCoverage: 0,
      highRiskCoverage: 0,
      stationBreakdown: ""
    };
  };

  const getDistrictData = () => {
    if (!scenariosData || selectedScenario === "all") {
      return [];
    }

    const scenario = scenariosData[selectedScenario as keyof Omit<ScenariosData, 'metadata'>];
    if (!scenario || !('district_stats' in scenario)) {
      return [];
    }

    // Получаем массив статистики по районам
    let districtStats = Object.values(scenario.district_stats) as DistrictStat[];

    // Фильтруем по выбранному району
    if (selectedDistrict !== "all") {
      const districtId = parseInt(selectedDistrict);
      districtStats = districtStats.filter(d => d.district_id === districtId);
    }

    // Преобразуем данные для отображения
    return districtStats.map(district => ({
      district: district.district_name || `Район ${district.district_id}`,
      value: viewType === "population" ? district.total_population :
             viewType === "incidents" ? district.total_fire_incidents :
             district.total_risk_objects,
    }));
  }

  const getComparisonData = () => {
    return districtAnalysis.map((district) => ({
      district: district.district,
      current: district.current[viewType as keyof typeof district.current],
      planned5: district.planned5[viewType as keyof typeof district.planned5],
      planned16: district.planned16[viewType as keyof typeof district.planned16],
      aiRecommended: district.aiRecommended[viewType as keyof typeof district.aiRecommended],
    }))
  }

  const getFilteredHydrants = () => {
    return currentHydrants.filter((hydrant) => {
      if (selectedDistrict !== "all" && !hydrant.district.toLowerCase().includes(selectedDistrict)) return false
      if (hydrantStatus !== "all" && hydrant.status !== hydrantStatus) return false
      return true
    })
  }

  const getFilteredRecommendations = () => {
    return recommendedHydrants.filter((rec) => {
      if (riskLevel === "high" && rec.priority !== "Critical" && rec.priority !== "High") return false
      if (riskLevel === "medium" && rec.priority !== "Medium") return false
      if (riskLevel === "low" && rec.priority !== "Low") return false
      return true
    })
  }

  // Функции для новых аналитических графиков
  const getStationsByDistrictData = () => {
    if (!scenariosData || selectedScenario === "all") return []
    
    const scenario = scenariosData[selectedScenario as keyof ScenariosData]
    if (!scenario || typeof scenario !== 'object' || !('district_stats' in scenario)) return []
    
    return scenario.district_stats?.map(district => {
      const districtStations = scenario.stations?.filter(s => s.district_id === district.district_id) || []
      
      const existing = districtStations.filter(s => s.exist_text === "Существует").length
      const recommended = districtStations.filter(s => s.exist_text === "Рекомендация").length
      const planned = districtStations.filter(s => s.exist_text.includes("Планируется")).length
      
      return {
        district: district.district_name.length > 15 ? district.district_name.substring(0, 15) + "..." : district.district_name,
        existing,
        recommended, 
        planned
      }
    }).filter(d => selectedDistrict === "all" || d.district.includes(
      scenariosData.metadata.districts.find(dist => dist.id === parseInt(selectedDistrict))?.name_ru?.substring(0, 15) || ""
    )) || []
  }

  // Кэшированные данные для графиков
  const redZonePopulationData = useMemo(() => {
    if (!scenariosData || selectedScenario === "all") return []
    
    const scenario = scenariosData[selectedScenario as keyof ScenariosData]
    if (!scenario || typeof scenario !== 'object' || !('coverage_grids' in scenario)) return []
    
    // Безопасная проверка metadata
    const districts = scenariosData.metadata?.districts || []
    
    // Группируем данные по районам используя coverage_grids
    const districtMap = new Map<number, { name: string, population: number }>()
    
    // Получаем красные гриды
    const redGrids = scenario.coverage_grids?.filter(g => g.color === 'red') || []
    
    // Группируем по district_id
    redGrids.forEach(grid => {
      const current = districtMap.get(grid.district_id) || { name: '', population: 0 }
      current.population += grid.population || 0
      
      // Получаем название района из metadata
      if (!current.name) {
        const districtInfo = districts.find(d => d.id === grid.district_id)
        current.name = districtInfo?.name_ru || `Район ${grid.district_id}`
      }
      
      districtMap.set(grid.district_id, current)
    })
    
    // Преобразуем в массив без обрезки названий
    const data = Array.from(districtMap.values()).map(item => ({
      district: item.name,
      redZonePopulation: item.population
    }))
    
    // Фильтруем по выбранному району
    let filteredData = data
    if (selectedDistrict !== "all") {
      const selectedDistrictName = districts.find(dist => dist.id === parseInt(selectedDistrict))?.name_ru
      if (selectedDistrictName) {
        filteredData = data.filter(d => d.district.includes(selectedDistrictName))
      }
    }
    
    // Сортировка по убыванию (от большего к меньшему)
    return filteredData.sort((a, b) => b.redZonePopulation - a.redZonePopulation)
  }, [scenariosData, selectedScenario, selectedDistrict])

  const redZoneAreaData = useMemo(() => {
    if (!scenariosData || selectedScenario === "all") return []
    
    const scenario = scenariosData[selectedScenario as keyof ScenariosData]
    if (!scenario || typeof scenario !== 'object' || !('coverage_grids' in scenario)) return []
    
    // Безопасная проверка metadata
    const districts = scenariosData.metadata?.districts || []
    
    // Группируем данные по районам используя coverage_grids
    const districtMap = new Map<number, { name: string, area: number }>()
    
    // Получаем красные гриды
    const redGrids = scenario.coverage_grids?.filter(g => g.color === 'red') || []
    
    // Группируем по district_id
    redGrids.forEach(grid => {
      const current = districtMap.get(grid.district_id) || { name: '', area: 0 }
      current.area += grid.shape_area || 0
      
      // Получаем название района из metadata
      if (!current.name) {
        const districtInfo = districts.find(d => d.id === grid.district_id)
        current.name = districtInfo?.name_ru || `Район ${grid.district_id}`
      }
      
      districtMap.set(grid.district_id, current)
    })
    
    // Преобразуем в массив без обрезки названий
    const data = Array.from(districtMap.values()).map(item => ({
      district: item.name,
      redZoneArea: item.area
    }))
    
    // Фильтруем по выбранному району
    let filteredData = data
    if (selectedDistrict !== "all") {
      const selectedDistrictName = districts.find(dist => dist.id === parseInt(selectedDistrict))?.name_ru
      if (selectedDistrictName) {
        filteredData = data.filter(d => d.district.includes(selectedDistrictName))
      }
    }
    
    // Отфильтровываем районы с нулевой площадью и сортируем по убыванию
    return filteredData
      .filter(d => d.redZoneArea > 0)
      .sort((a, b) => b.redZoneArea - a.redZoneArea)
  }, [scenariosData, selectedScenario, selectedDistrict])

  const getCoverageAreaData = (minutes: number) => {
    if (!scenariosData || selectedScenario === "all") return [
      { name: 'Доступно', value: 0 },
      { name: 'Недоступно', value: 100 }
    ]
    
    const scenario = scenariosData[selectedScenario as keyof ScenariosData]
    if (!scenario || typeof scenario !== 'object' || !('coverage_grids' in scenario)) return [
      { name: 'Доступно', value: 0 },
      { name: 'Недоступно', value: 100 }
    ]
    
    let grids = scenario.coverage_grids || []
    if (selectedDistrict !== "all") {
      grids = grids.filter(g => g.district_id === parseInt(selectedDistrict))
    }
    
    const totalArea = grids.reduce((sum, g) => sum + (g.shape_area || 0), 0)
    if (totalArea === 0) return [
      { name: 'Доступно', value: 0 },
      { name: 'Недоступно', value: 100 }
    ]
    
    // Используем поле color и shape_area:
    // - Для 5 минут: доступны только "green" зоны (≤5 мин)
    // - Для 10 минут: доступны "green" и "orange" зоны (≤10 мин)
    const availableArea = minutes === 5 
      ? grids.filter(g => g.color === 'green').reduce((sum, g) => sum + (g.shape_area || 0), 0)
      : grids.filter(g => g.color === 'green' || g.color === 'orange').reduce((sum, g) => sum + (g.shape_area || 0), 0)
      
    const availablePercent = (availableArea / totalArea) * 100
    const unavailablePercent = 100 - availablePercent

    return [
      { name: 'Доступно', value: parseFloat(availablePercent.toFixed(1)) },
      { name: 'Недоступно', value: parseFloat(unavailablePercent.toFixed(1)) }
    ]
  }

  // Новые функции для сравнения AI рекомендаций и плана +16
  const getAiVsPlanned16ComparisonData = () => {
    if (!scenariosData) return {
      stationsComparison: [],
      coverageComparison: [],
      populationComparison: [],
      districtComparison: [],
      redZoneComparison: []
    }

    const aiScenario = scenariosData.aiRecommended
    const planned16Scenario = scenariosData.planned16

    // Сравнение количества станций
    const stationsComparison = [
      {
        scenario: "AI рекомендации",
        stations: aiScenario?.stations?.length || 0,
        newStations: (aiScenario?.stations?.filter(s => s.exist_text === "Рекомендация") || []).length,
        existingStations: (aiScenario?.stations?.filter(s => s.exist_text === "Существует") || []).length
      },
      {
        scenario: "План +16",
        stations: planned16Scenario?.stations?.length || 0,
        newStations: (planned16Scenario?.stations?.filter(s => s.exist_text.includes("Планируется")) || []).length,
        existingStations: (planned16Scenario?.stations?.filter(s => s.exist_text === "Существует") || []).length
      }
    ]

    // Сравнение покрытия по цветам
    const getCoverageByColor = (scenario: Scenario | undefined) => {
      if (!scenario?.coverage_grids) return { green: 0, orange: 0, red: 0, total: 0 }
      
      const grids = selectedDistrict !== "all" 
        ? scenario.coverage_grids.filter(g => g.district_id === parseInt(selectedDistrict))
        : scenario.coverage_grids

      const green = grids.filter(g => g.color === 'green').length
      const orange = grids.filter(g => g.color === 'orange').length  
      const red = grids.filter(g => g.color === 'red').length
      
      return { green, orange, red, total: grids.length }
    }

    const aiCoverage = getCoverageByColor(aiScenario)
    const planned16Coverage = getCoverageByColor(planned16Scenario)

    const coverageComparison = [
      {
        scenario: "AI рекомендации",
        "До 5 мин": aiCoverage.green,
        "5-10 мин": aiCoverage.orange,
        "Более 10 мин": aiCoverage.red,
        "Всего зон": aiCoverage.total
      },
      {
        scenario: "План +16",
        "До 5 мин": planned16Coverage.green,
        "5-10 мин": planned16Coverage.orange,
        "Более 10 мин": planned16Coverage.red,
        "Всего зон": planned16Coverage.total
      }
    ]

    // Сравнение покрытия населения (в процентах)
    const getPopulationCoverage = (scenario: Scenario | undefined) => {
      if (!scenario?.coverage_grids) return { covered: 0, uncovered: 100 }
      
      const grids = selectedDistrict !== "all" 
        ? scenario.coverage_grids.filter(g => g.district_id === parseInt(selectedDistrict))
        : scenario.coverage_grids

      const totalPopulation = grids.reduce((sum, g) => sum + (g.population || 0), 0)
      const coveredPopulation = grids
        .filter(g => g.color === 'green' || g.color === 'orange')
        .reduce((sum, g) => sum + (g.population || 0), 0)

      if (totalPopulation === 0) return { covered: 0, uncovered: 100 }
      
      const coveredPercent = (coveredPopulation / totalPopulation) * 100
      return { covered: coveredPercent, uncovered: 100 - coveredPercent }
    }

    const aiPopulation = getPopulationCoverage(aiScenario)
    const planned16Population = getPopulationCoverage(planned16Scenario)

    const populationComparison = [
      {
        scenario: "AI рекомендации",
        "Покрытое население %": aiPopulation.covered,
        "Непокрытое население %": aiPopulation.uncovered
      },
      {
        scenario: "План +16", 
        "Покрытое население %": planned16Population.covered,
        "Непокрытое население %": planned16Population.uncovered
      }
    ]

    // Сравнение по районам с реальными данными
    const getDistrictComparison = () => {
      if (!scenariosData.metadata?.districts) return []
      
      return scenariosData.metadata.districts.map(district => {
        const aiGrids = aiScenario?.coverage_grids?.filter(g => g.district_id === district.id) || []
        const planned16Grids = planned16Scenario?.coverage_grids?.filter(g => g.district_id === district.id) || []
        
        // Охват населения (% покрытого населения)
        const aiTotalPop = aiGrids.reduce((sum, g) => sum + (g.population || 0), 0)
        const aiCoveredPop = aiGrids.filter(g => g.color === 'green' || g.color === 'orange').reduce((sum, g) => sum + (g.population || 0), 0)
        const aiPopCoverage = aiTotalPop > 0 ? (aiCoveredPop / aiTotalPop) * 100 : 0

        const p16TotalPop = planned16Grids.reduce((sum, g) => sum + (g.population || 0), 0)
        const p16CoveredPop = planned16Grids.filter(g => g.color === 'green' || g.color === 'orange').reduce((sum, g) => sum + (g.population || 0), 0)
        const p16PopCoverage = p16TotalPop > 0 ? (p16CoveredPop / p16TotalPop) * 100 : 0

        // Охват объектов с высоким риском
        const aiTotalRisk = aiGrids.reduce((sum, g) => sum + (g.all_risk_objects || 0), 0)
        const aiCoveredRisk = aiGrids.filter(g => g.color === 'green' || g.color === 'orange').reduce((sum, g) => sum + (g.all_risk_objects || 0), 0)
        const aiRiskCoverage = aiTotalRisk > 0 ? (aiCoveredRisk / aiTotalRisk) * 100 : 0

        const p16TotalRisk = planned16Grids.reduce((sum, g) => sum + (g.all_risk_objects || 0), 0)
        const p16CoveredRisk = planned16Grids.filter(g => g.color === 'green' || g.color === 'orange').reduce((sum, g) => sum + (g.all_risk_objects || 0), 0)
        const p16RiskCoverage = p16TotalRisk > 0 ? (p16CoveredRisk / p16TotalRisk) * 100 : 0

        // Охват пожаров
        const aiTotalFires = aiGrids.reduce((sum, g) => sum + (g.fire_count || 0), 0)
        const aiCoveredFires = aiGrids.filter(g => g.color === 'green' || g.color === 'orange').reduce((sum, g) => sum + (g.fire_count || 0), 0)
        const aiFireCoverage = aiTotalFires > 0 ? (aiCoveredFires / aiTotalFires) * 100 : 0

        const p16TotalFires = planned16Grids.reduce((sum, g) => sum + (g.fire_count || 0), 0)
        const p16CoveredFires = planned16Grids.filter(g => g.color === 'green' || g.color === 'orange').reduce((sum, g) => sum + (g.fire_count || 0), 0)
        const p16FireCoverage = p16TotalFires > 0 ? (p16CoveredFires / p16TotalFires) * 100 : 0
        
        return {
          district: district.name_ru,
          "Население AI": parseFloat(aiPopCoverage.toFixed(1)),
          "Население П16": parseFloat(p16PopCoverage.toFixed(1)),
          "Риски AI": parseFloat(aiRiskCoverage.toFixed(1)),
          "Риски П16": parseFloat(p16RiskCoverage.toFixed(1)),
          "Пожары AI": parseFloat(aiFireCoverage.toFixed(1)),
          "Пожары П16": parseFloat(p16FireCoverage.toFixed(1))
        }
      })
    }

    // Сравнение красных зон
    const getRedZoneComparison = () => {
      const getRedZoneStats = (scenario: Scenario | undefined) => {
        if (!scenario?.coverage_grids) return { population: 0, fires: 0, risks: 0, area: 0 }
        
        const redGrids = selectedDistrict !== "all" 
          ? scenario.coverage_grids.filter(g => g.district_id === parseInt(selectedDistrict) && g.color === 'red')
          : scenario.coverage_grids.filter(g => g.color === 'red')

        return {
          population: redGrids.reduce((sum, g) => sum + (g.population || 0), 0),
          fires: redGrids.reduce((sum, g) => sum + (g.fire_count || 0), 0),
          risks: redGrids.reduce((sum, g) => sum + (g.all_risk_objects || 0), 0),
          area: redGrids.reduce((sum, g) => sum + (g.shape_area || 0), 0)
        }
      }

      const aiRedZone = getRedZoneStats(aiScenario)
      const p16RedZone = getRedZoneStats(planned16Scenario)

      return [
        {
          scenario: "AI рекомендации",
          "Население (тыс.)": Math.round(aiRedZone.population / 1000),
          "Пожары": aiRedZone.fires,
          "Объекты риска": aiRedZone.risks,
          "Площадь (км²)": Math.round(aiRedZone.area / 1000000 * 10) / 10
        },
        {
          scenario: "План +16",
          "Население (тыс.)": Math.round(p16RedZone.population / 1000),
          "Пожары": p16RedZone.fires,
          "Объекты риска": p16RedZone.risks,
          "Площадь (км²)": Math.round(p16RedZone.area / 1000000 * 10) / 10
        }
      ]
    }

    return {
      stationsComparison,
      coverageComparison, 
      populationComparison,
      districtComparison: getDistrictComparison(),
      redZoneComparison: getRedZoneComparison()
    }
  }

  // Smart Recommendations functions
  const generateRecommendations = async () => {
    setIsGenerating(true)
    setGenerationStatus({ type: 'info', message: 'Анализ данных о земельных участках...' })
    
    try {
      // Получаем депо из сценария "планируется +5" для учета в алгоритме
      const planned5Stations = scenariosData?.planned5?.stations || []
      
      // const payload = {
      //   landFilters,
      //   algorithmSettings,
      //   selectedDistrict,
      //   existingStations: planned5Stations,
      //   customPurpose: landFilters.purpose === "custom" ? customPurpose : ""
      // }
      const isTemporaryOwnership = landFilters.ownership.includes('временн');
      const apiLandFilters = {
        ownership: landFilters.ownership,
        min_area: landFilters.max_area, // ВАЖНО: Бэкенд должен использовать логику <= (меньше или равно) вместо >= для площади
        purpose: landFilters.purpose,
        min_lease_year: isTemporaryOwnership ? landFilters.min_lease_year : 0
      };

      const payload = {
        landFilters: apiLandFilters,
        algorithmSettings,
        selectedDistrict,
        existingStations: planned5Stations,
        customPurpose: landFilters.purpose === "custom" ? customPurpose : ""
      }
      const response = await fetch('/api/generate-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error('Ошибка генерации рекомендаций')
      }
      
      const result = await response.json()
      setDynamicScenario(result)
      setLastGenerationTime(new Date())
      setGenerationStatus({ 
        type: 'success', 
        message: `Успешно сгенерировано ${result.stations?.length || 0} рекомендаций. Переключитесь на "Динамические рекомендации" чтобы увидеть результаты.` 
      })
      
    } catch (error) {
      console.error('Ошибка генерации:', error)
      setGenerationStatus({ 
        type: 'error', 
        message: 'Ошибка при генерации рекомендаций. Проверьте настройки и попробуйте снова.' 
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const clearRecommendations = () => {
    setDynamicScenario(null)
    setLastGenerationTime(null)
    setGenerationStatus(null)
    if (selectedScenario === 'dynamic') {
      setSelectedScenario('current')
    }
  }

  const getDistrictDistributionData = () => {
    if (!scenariosData || !selectedScenario || selectedScenario === 'dynamic') {
      return { populationData: [], areaData: [] };
    }

    const scenarioKey = selectedScenario as keyof Omit<ScenariosData, 'metadata'>;
    const currentScenarioData = scenariosData[scenarioKey];

    if (!currentScenarioData || !currentScenarioData.district_stats) {
      return { populationData: [], areaData: [] };
    }

    type ChartDataPoint = { district: string; value: number };

    // Получаем массив статистики по районам
    const statsArray = Object.values(currentScenarioData.district_stats);

    // Создаем данные по населению в красных зонах
    const populationData = statsArray
      .map(district => {
        const redZonePopulation = Math.round((district.total_population * district.red_zones) / (district.red_zones + district.yellow_zones + district.green_zones));
        return {
          district: district.district_name,
          value: Math.round(redZonePopulation / 1000), // тысяч человек
        };
      })
      .sort((a, b) => b.value - a.value);

    // Создаем данные по площади красных зон
    const areaData = statsArray
      .map(district => ({
        district: district.district_name,
        value: Math.round(district.total_area / 1000000), // миллионов кв.м.
      }))
      .sort((a, b) => b.value - a.value);

    return { populationData, areaData };
  };

  const getCoverageImprovementData = () => {
    // ... existing code ...
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="h-8 w-8 text-red-500" />
              Мониторинг и планирование пожарной инфраструктуры
            </h1>
                          <p className="text-gray-600 mt-1">Стратегический анализ и оптимизация инфраструктуры пожарной безопасности</p>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="accessibility" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">🔥 Доступность пожарных депо</TabsTrigger>
          <TabsTrigger value="calls" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">📞 Анализ вызовов диспетчера</TabsTrigger>
        </TabsList>

        {/* Enhanced Tab 1: Fire Stations Accessibility */}
        <TabsContent value="accessibility" className="space-y-6">
          {/* Scenario Selection and View Toggle */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded-lg border">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="scenario-select">Сценарий:</Label>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Текущее состояние ({scenariosData?.current?.stations?.length || 20} депо)</SelectItem>
                    <SelectItem value="planned5">План ДЧС с учетом 5 утвержденных депо ({scenariosData?.planned5?.stations?.length || 5} новых)</SelectItem>
                    <SelectItem value="planned16">Полный план ДЧС ({scenariosData?.planned16?.stations?.length || 11} новых)</SelectItem>
                    <SelectItem value="aiRecommended">Рекомендации без земли ({scenariosData?.aiRecommended?.stations?.length || 10} новых)</SelectItem>
                    <SelectItem value="dynamic">Динамические рекомендации с землей ({dynamicScenario?.stations?.length || 0} новых) </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="district-filter">Район:</Label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все районы</SelectItem>
                    {scenariosData?.metadata?.districts?.map(district => (
                      <SelectItem key={district.id} value={district.id.toString()}>
                        {district.name_ru}
                      </SelectItem>
                    )) || [
                      <SelectItem key="downtown" value="downtown">Downtown</SelectItem>,
                      <SelectItem key="industrial" value="industrial">Industrial</SelectItem>,
                      <SelectItem key="residential" value="residential">Residential</SelectItem>,
                      <SelectItem key="commercial" value="commercial">Commercial</SelectItem>,
                      <SelectItem key="waterfront" value="waterfront">Waterfront</SelectItem>
                    ]}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* How Coverage is Calculated Button */}
            <div className="flex items-center justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 text-blue-700 hover:text-blue-800 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <Info className="h-4 w-4" />
                    Как рассчитывается покрытие?
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Методология расчета покрытия пожарных депо</DialogTitle>
                    <DialogDescription>
                      Подробное описание алгоритмов анализа покрытия и рекомендаций по размещению депо
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm max-h-96 overflow-y-auto">
                    <div>
                      <h4 className="font-semibold mb-2">Как рассчитывается шаговая доступность?</h4>
                      <p>
                        Шаговая доступность определялась по линиям дорог на основе кратчайших путей от пожарных депо:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>До 1500 м</strong> — зелёные клетки (до 5 минут пешком)</li>
                        <li><strong>От 1500 до 3000 м</strong> — жёлтые клетки (5–10 минут)</li>
                        <li><strong>Свыше 3000 м</strong> — красные клетки (более 10 минут)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Как рассчитывалась рекомендация?</h4>
                      <p>
                        Использовались 3 признака: количество пожаров, объекты риска и численность населения. 
                        Данные были нормализованы, а веса рассчитаны через KMeans по дисперсии кластеров. 
                        Итоговый взвешенный скор использовался в жадном алгоритме, который выбрал 10 точек 
                        без перекрытия охвата (радиус 2.2 км) для максимального покрытия зон высокого риска.
                      </p>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <code className="text-xs">
                          score = w₁ · fire_count + w₂ · all_risk_objects + w₃ · total_sum_population
                        </code>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Как рассчитывается динамическая рекомендация?</h4>
                      <p>
                        Динамическая рекомендация рассчитывается в несколько этапов:
                      </p>
                      <ol className="list-decimal list-inside mt-2 space-y-2">
                        <li>
                          <strong>Расчет интегрального скора:</strong> На основе пожаров, населения и объектов риска 
                          с помощью нормализации и кластеризации (KMeans) вычисляется интегральный скор для каждой зоны.
                        </li>
                        <li>
                          <strong>Отбор земельных участков:</strong> Из земельных участков отбираются подходящие 
                          по площади, назначению, форме собственности и сроку аренды.
                        </li>
                        <li>
                          <strong>Жадный алгоритм:</strong> Выбирает до 10 участков, покрывающих максимум зон 
                          высокого риска в радиусе 2200 м без перекрытия.
                        </li>
                        <li>
                          <strong>Дополнение безземельными точками:</strong> Если не хватает участков с подходящей землёй, 
                          выбираются точки без земли (только по координатам).
                        </li>
                        <li>
                          <strong>Оптимизация:</strong> Слабые участки с землёй могут быть заменены на более 
                          эффективные безземельные варианты.
                        </li>
                      </ol>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Используемые данные</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium mb-1">Основные источники:</h5>
                          <ul className="list-disc list-inside space-y-1">
                            <li><strong>Население</strong> — ЦИС (Центр информационных систем)</li>
                            <li><strong>Сетка дорог</strong> — OpenStreetMap</li>
                            <li><strong>Пожарные депо</strong> — ДЧС (Департамент по чрезвычайным ситуациям)</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium mb-1">Дополнительные данные:</h5>
                          <ul className="list-disc list-inside space-y-1">
                            <li><strong>Пожары</strong> — ДЧС (2021-2024)</li>
                            <li><strong>Объекты с высоким риском</strong> — ДЧС</li>
                            <li><strong>Земельный кадастр</strong> — www.aisgzk.kz</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Алгоритм KMeans для весовых коэффициентов</h4>
                      <p>
                        Для определения оптимальных весов в формуле скора используется кластеризация KMeans:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Данные нормализуются по методу Min-Max</li>
                        <li>Применяется кластеризация для выявления групп схожих зон</li>
                        <li>Веса рассчитываются на основе дисперсии кластеров</li>
                        <li>Зоны с высокой дисперсией получают больший вес</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Валидация и контроль качества</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Перекрестная проверка с операционными данными пожарной службы</li>
                        <li>Анализ покрытия исторических инцидентов</li>
                        <li>Проверка соответствия нормативам времени отклика</li>
                        <li>Регулярное обновление модели с новыми данными об инцидентах</li>
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          {selectedScenario !== "dynamic" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-max">Покрытие населения</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Percentage of population within 5-minute response time</p>
                          <p>Based on 2.5km radius from each station</p>
                          <p>Uses isochrone analysis for accurate travel time</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getCurrentScenarioData().populationCoverage}%</div>
                  <p className="text-xs text-muted-foreground">
                     {(() => {
                       if (selectedScenario === "current") return ""
                       
                       const currentData = getRealScenarioData("current")
                       const planned5Data = getRealScenarioData("planned5")
                       const currentValue = getCurrentScenarioData().populationCoverage
                       
                                               if (selectedScenario === "planned5") {
                          const baselineValue = currentData?.populationCoverage || accessibilityKPIs.current.populationCoverage
                          const improvement = currentValue - baselineValue
                          return `+${improvement.toFixed(2)}% от текущей ситуации (${baselineValue}%)`
                        }
                        
                        if (selectedScenario === "planned16" || selectedScenario === "aiRecommended") {
                          const currentBaseline = currentData?.populationCoverage || accessibilityKPIs.current.populationCoverage
                          const planned5Baseline = planned5Data?.populationCoverage || accessibilityKPIs.planned5.populationCoverage
                          
                          return (
                            <div className="space-y-1">
                              <div>+{(currentValue - currentBaseline).toFixed(2)}% от текущей ситуации ({currentBaseline}%)</div>
                              <div>+{(currentValue - planned5Baseline).toFixed(2)}% от утвержденного плана 5 депо ({planned5Baseline}%)</div>
                            </div>
                          )
                       }
                       
                       return ""
                     })()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Покрытие пожаров</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Percentage of historical fire incidents within 5-min response</p>
                          <p>Based on 3 years of incident data (2021-2024)</p>
                          <p>Includes structure fires, vehicle fires, and outdoor fires</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Flame className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getCurrentScenarioData().incidentCoverage}%</div>
                  <p className="text-xs text-muted-foreground">
                     {(() => {
                       if (selectedScenario === "current") return ""
                       
                       const currentData = getRealScenarioData("current")
                       const planned5Data = getRealScenarioData("planned5")
                       const currentValue = getCurrentScenarioData().incidentCoverage
                       
                                               if (selectedScenario === "planned5") {
                          const baselineValue = currentData?.incidentCoverage || accessibilityKPIs.current.incidentCoverage
                          const improvement = currentValue - baselineValue
                          return `+${improvement.toFixed(2)}% от текущей ситуации (${baselineValue}%)`
                        }
                        
                        if (selectedScenario === "planned16" || selectedScenario === "aiRecommended") {
                          const currentBaseline = currentData?.incidentCoverage || accessibilityKPIs.current.incidentCoverage
                          const planned5Baseline = planned5Data?.incidentCoverage || accessibilityKPIs.planned5.incidentCoverage
                          
                          return (
                            <div className="space-y-1">
                              <div>+{(currentValue - currentBaseline).toFixed(2)}% от текущей ситуации ({currentBaseline}%)</div>
                              <div>+{(currentValue - planned5Baseline).toFixed(2)}% от утвержденного плана 5 депо ({planned5Baseline}%)</div>
                            </div>
                          )
                       }
                       
                       return ""
                     })()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Быстрое реагирование</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                                          <p>Покрытие всех объектов риска в зонах реагирования</p>
                  <p>На основе поля all_risk_objects из сеток покрытия</p>
                                                    <p>Рассчитывается как покрытые объекты / общее количество объектов * 100%</p>
                            <p>Зеленые + Оранжевые зоны = покрытые области</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getCurrentScenarioData().highRiskCoverage}%</div>
                  <p className="text-xs text-muted-foreground">
                     {(() => {
                       if (selectedScenario === "current") return ""
                       
                       const currentData = getRealScenarioData("current")
                       const planned5Data = getRealScenarioData("planned5")
                       const currentValue = getCurrentScenarioData().highRiskCoverage
                       
                                               if (selectedScenario === "planned5") {
                          const baselineValue = currentData?.highRiskCoverage || accessibilityKPIs.current.highRiskCoverage
                          const improvement = currentValue - baselineValue
                          return `+${improvement.toFixed(2)}% от текущей ситуации (${baselineValue}%)`
                        }
                        
                        if (selectedScenario === "planned16" || selectedScenario === "aiRecommended") {
                          const currentBaseline = currentData?.highRiskCoverage || accessibilityKPIs.current.highRiskCoverage
                          const planned5Baseline = planned5Data?.highRiskCoverage || accessibilityKPIs.planned5.highRiskCoverage
                          
                          return (
                            <div className="space-y-1">
                              <div>+{(currentValue - currentBaseline).toFixed(2)}% от текущей ситуации ({currentBaseline}%)</div>
                              <div>+{(currentValue - planned5Baseline).toFixed(2)}% от утвержденного плана 5 депо ({planned5Baseline}%)</div>
                            </div>
                          )
                       }
                       
                       return ""
                     })()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего депо</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getCurrentScenarioData().stations}</div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {selectedScenario === "aiRecommended" ? (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Текущие:</span>
                          <span className="font-medium">20</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Утвержденные:</span>
                          <span className="font-medium">5</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Рекомендуемые:</span>
                          <span className="font-medium">10</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span>Текущие:</span>
                        <span className="font-medium">{scenariosData?.current?.stations?.length || 20}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* Smart Recommendations Panel */}
          {selectedScenario === "dynamic" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  🔬 Настройки динамических рекомендаций
                </CardTitle>
                <CardDescription>
                  Настройте фильтры земельных участков и параметры алгоритма
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Фильтры земли */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Фильтры земельных участков</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ownership">Форма собственности</Label>
                      <Select 
                        value={landFilters.ownership} 
                        onValueChange={(value) => setLandFilters({...landFilters, ownership: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все формы</SelectItem>
                          <SelectItem value="Не определено">Не определено</SelectItem>
                          <SelectItem value="временное безвозмездное землепользование">Временное безвозмездное землепользование</SelectItem>
                          <SelectItem value="временное безвозмездное общее долевое землепользование">Временное безвозмездное общее долевое землепользование</SelectItem>
                          <SelectItem value="временное безвозмездное общее совместное землепользование">Временное безвозмездное общее совместное землепользование</SelectItem>
                          <SelectItem value="временное возмездное долгосрочное землепользование">Временное возмездное долгосрочное землепользование</SelectItem>
                          <SelectItem value="временное возмездное долгосрочное общее долевое землепользование">Временное возмездное долгосрочное общее долевое землепользование</SelectItem>
                          <SelectItem value="временное возмездное долгосрочное общее совместное землепользование">Временное возмездное долгосрочное общее совместное землепользование</SelectItem>
                          <SelectItem value="временное возмездное краткосрочное землепользование">Временное возмездное краткосрочное землепользование</SelectItem>
                          <SelectItem value="временное возмездное краткосрочное общее долевое землепользование">Временное возмездное краткосрочное общее долевое землепользование</SelectItem>
                          <SelectItem value="временное возмездное краткосрочное общее совместное землепользование">Временное возмездное краткосрочное общее совместное землепользование</SelectItem>
                          <SelectItem value="государственная собственность">Государственная собственность</SelectItem>
                          <SelectItem value="общая долевая собственность">Общая долевая собственность</SelectItem>
                          <SelectItem value="общая совместная собственность">Общая совместная собственность</SelectItem>
                          <SelectItem value="постоянное землепользование">Постоянное землепользование</SelectItem>
                          <SelectItem value="постоянное общее долевое землепользование">Постоянное общее долевое землепользование</SelectItem>
                          <SelectItem value="постоянное общее совместное землепользование">Постоянное общее совместное землепользование</SelectItem>
                          <SelectItem value="частная собственность">Частная собственность</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_area">Максимальная площадь (кв.м)</Label>
                      <Select 
                        value={landFilters.max_area.toString()} 
                        onValueChange={(value) => setLandFilters({...landFilters, max_area: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="500">500 кв.м</SelectItem>
                          <SelectItem value="1000">1000 кв.м</SelectItem>
                          <SelectItem value="2000">2000 кв.м</SelectItem>
                          <SelectItem value="3000">3000 кв.м</SelectItem>
                          <SelectItem value="4000">4000 кв.м</SelectItem>
                          <SelectItem value="5000">5000 кв.м</SelectItem>
                          <SelectItem value="10000">10000 кв.м</SelectItem>
                          <SelectItem value="20000">20000 кв.м</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Фильтр года аренды - активен только для временного землепользования */}
                    {(landFilters.ownership.includes('временное') || landFilters.ownership.includes('временн')) && (
                      <div className="space-y-2">
                        <Label htmlFor="min_lease_year">Минимальный год аренды</Label>
                        <Select 
                          value={landFilters.min_lease_year?.toString() || "0"} 
                          onValueChange={(value) => setLandFilters({...landFilters, min_lease_year: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Любое</SelectItem>
                            <SelectItem value="2025">2025 год</SelectItem>
                            <SelectItem value="2026">2026 год</SelectItem>
                            <SelectItem value="2027">2027 год</SelectItem>
                            <SelectItem value="2028">2028 год</SelectItem>
                            <SelectItem value="2029">2029 год</SelectItem>
                            <SelectItem value="2030">2030 год</SelectItem>
                            <SelectItem value="2031">2031 год</SelectItem>
                            <SelectItem value="2032">2032 год</SelectItem>
                            <SelectItem value="2033">2033 год</SelectItem>
                            <SelectItem value="2034">2033 год</SelectItem>
                            <SelectItem value="2035">2035 год</SelectItem>
                            <SelectItem value="2040">2040 год</SelectItem>
                            <SelectItem value="2045">2045 год</SelectItem>
                            <SelectItem value="2050">2050 год</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="purpose">Назначение участка</Label>
                      <Select 
                        value={landFilters.purpose} 
                        onValueChange={(value) => {
                          setLandFilters({...landFilters, purpose: value})
                          if (value !== "custom") {
                            setCustomPurpose("")
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          <SelectItem value="all">Любое назначение</SelectItem>
                          <SelectItem value="ведение личного подсобного хозяйства">Ведение личного подсобного хозяйства</SelectItem>
                          <SelectItem value="для строительства и эксплуатации индивидуального жилого дома">Для строительства и эксплуатации индивидуального жилого дома</SelectItem>
                          <SelectItem value="для эксплуатации и обслуживания жилого дома">Для эксплуатации и обслуживания жилого дома</SelectItem>
                          <SelectItem value="для административного здания">Для административного здания</SelectItem>
                          <SelectItem value="для благоустройства и озеленения">Для благоустройства и озеленения</SelectItem>
                          <SelectItem value="для ведения садоводства">Для ведения садоводства</SelectItem>
                          <SelectItem value="для индивидуального жилого дома">Для индивидуального жилого дома</SelectItem>
                          <SelectItem value="для нежилого помещение">Для нежилого помещения</SelectItem>
                          <SelectItem value="для строительства и эксплуатации автоматизированного бетоносмесительного узла">Для строительства и эксплуатации автоматизированного бетоносмесительного узла</SelectItem>
                          <SelectItem value="для строительства и эксплуатации сборочно-торгового центра">Для строительства и эксплуатации сборочно-торгового центра</SelectItem>
                          <SelectItem value="для эксплуатации и обслуживания автозаправочной станции">Для эксплуатации и обслуживания автозаправочной станции</SelectItem>
                          <SelectItem value="для эксплуатации и обслуживания магазина, кондитерского цеха, складского помещения, офиса">Для эксплуатации и обслуживания магазина, кондитерского цеха, складского помещения, офиса</SelectItem>
                          <SelectItem value="садоводство">Садоводство</SelectItem>
                          <SelectItem value="жилой дом">Жилой дом</SelectItem>
                          <SelectItem value="нежилое помещение">Нежилое помещение</SelectItem>
                          <SelectItem value="подсобные производственные помещения">Подсобные производственные помещения</SelectItem>
                          <SelectItem value="custom">🖊️ Ввести свой текст</SelectItem>
                        </SelectContent>
                      </Select>
                      {landFilters.purpose === "custom" && (
                        <div className="mt-2">
                                                     <Input
                             placeholder="Введите целевое назначение..."
                             value={customPurpose}
                             onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomPurpose(e.target.value)}
                           />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Настройки алгоритма */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Параметры алгоритма</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="num_stations">Количество рекомендаций</Label>
                      <Select 
                        value={algorithmSettings.num_stations.toString()} 
                        onValueChange={(value) => setAlgorithmSettings({...algorithmSettings, num_stations: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 депо</SelectItem>
                          <SelectItem value="5">5 депо</SelectItem>
                          <SelectItem value="7">7 депо</SelectItem>
                          <SelectItem value="10">10 депо</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coverage_radius">Радиус покрытия (м)</Label>
                      <Select 
                        value={algorithmSettings.coverage_radius.toString()} 
                        onValueChange={(value) => setAlgorithmSettings({...algorithmSettings, coverage_radius: parseInt(value)})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1800">1.8 км</SelectItem>
                          <SelectItem value="2200">2.2 км</SelectItem>
                          <SelectItem value="2500">2.5 км</SelectItem>
                          <SelectItem value="3000">3.0 км</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Действия</h4>
                    
                    <div className="space-y-2">
                      <Button
                        onClick={generateRecommendations}
                        disabled={isGenerating}
                        className="w-full"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Генерация...
                          </>
                        ) : (
                          <>
                            🎯 Сгенерировать рекомендации
                          </>
                        )}
                      </Button>
                      
                      {dynamicScenario && (
                        <Button
                          onClick={clearRecommendations}
                          variant="outline"
                          className="w-full"
                        >
                          🗑️ Очистить результаты
                        </Button>
                      )}
                    </div>

                    {dynamicScenario && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          ✅ Сгенерировано {dynamicScenario.stations?.length || 0} рекомендаций
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          С землей: {dynamicScenario.stations?.filter((s: Station) => s.has_land).length || 0} | 
                          Без земли: {dynamicScenario.stations?.filter((s: Station) => !s.has_land).length || 0}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
            {/* Enhanced Interactive Map */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Карта покрытия</CardTitle>
                    <CardDescription>
                      {scenariosData && selectedScenario !== "all" && scenariosData[selectedScenario as keyof ScenariosData] && typeof scenariosData[selectedScenario as keyof ScenariosData] === 'object' && 'name' in scenariosData[selectedScenario as keyof ScenariosData]
                        ? (scenariosData[selectedScenario as keyof ScenariosData] as Scenario).name
                        : "Анализ покрытия пожарных депо"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="coverage-zones" checked={showCoverageZones} onCheckedChange={setShowCoverageZones} />
                      <Label htmlFor="coverage-zones" className="text-sm">
                        Зоны покрытия
                      </Label>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative h-[605px]">
                  {/* Карта на всю ширину */}
                  <div className="w-full h-full">
                    {(scenariosData || dynamicScenario) && (
                      <MapComponent 
                        stations={selectedScenario === "dynamic" && dynamicScenario?.stations 
                          ? dynamicScenario.stations 
                          : scenariosData && scenariosData[selectedScenario as keyof ScenariosData] && typeof scenariosData[selectedScenario as keyof ScenariosData] === 'object' && 'stations' in scenariosData[selectedScenario as keyof ScenariosData] 
                          ? (scenariosData[selectedScenario as keyof ScenariosData] as Scenario).stations || [] 
                          : []}
                        coverageGrids={selectedScenario === "dynamic" && dynamicScenario?.coverage_grids 
                          ? dynamicScenario.coverage_grids 
                          : scenariosData && scenariosData[selectedScenario as keyof ScenariosData] && typeof scenariosData[selectedScenario as keyof ScenariosData] === 'object' && 'coverage_grids' in scenariosData[selectedScenario as keyof ScenariosData] 
                          ? (scenariosData[selectedScenario as keyof ScenariosData] as Scenario).coverage_grids || [] 
                          : []}
                        baseCoverageGrids={scenariosData?.planned5?.coverage_grids || []}
                        showCoverageZones={showCoverageZones}
                        selectedScenario={selectedScenario}
                        selectedDistrict={selectedDistrict}
                        onStationSelect={(station) => {
                          if (selectedScenario === "dynamic") {
                            // Для динамических рекомендаций - заменяем выбранную станцию (без накопления)
                            setSelectedDynamicStation(station)
                          } else {
                            // Для других сценариев - добавляем депо к выбранным если его еще нет
                            if (!selectedStations.find(s => s.id === station.id)) {
                              setSelectedStations([...selectedStations, station])
                            }
                          }
                        }}
                      />
                    )}
                    {!scenariosData && (
                      <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2 animate-pulse" />
                          <p className="text-gray-500 text-sm">Загрузка данных карты...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Информационная панель как overlay */}
                  {((selectedScenario === "dynamic" && selectedDynamicStation) || 
                    (selectedScenario !== "dynamic" && selectedStations.length > 0)) && (
                    <div className="absolute top-4 right-4 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border z-10">
                      {selectedScenario === "dynamic" && selectedDynamicStation && (
                        <div className="p-4 border-blue-200 bg-blue-50">
                          <div className="flex items-center gap-2 mb-3">
                            <MapPin className="h-5 w-5 text-blue-600" />
                            <h3 className="font-semibold text-blue-900">Выбранная рекомендация</h3>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <span className="text-sm text-gray-600">ID:</span>
                                <div className="font-mono text-sm">{selectedDynamicStation.id}</div>
                              </div>
                              <div>
                                <span className="text-sm text-gray-600">Приоритет:</span>
                                <div className="font-medium text-sm">
                                  {selectedDynamicStation.score ? `${selectedDynamicStation.score.toFixed(2)}` : 'Н/Д'}
                                </div>
                              </div>
                            </div>
                            
                            {selectedDynamicStation.land_info && (
                              <div className="border-t pt-3">
                                <div className="text-sm font-medium mb-2">Информация о земельном участке:</div>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                  <div>
                                    <span className="text-gray-600">Кадастровый номер:</span>
                                    <div className="font-mono text-xs break-all">{selectedDynamicStation.land_info.kad_nomer || 'Н/Д'}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Право пользования:</span>
                                    <div className="text-xs">{selectedDynamicStation.land_info.granted_right || 'Н/Д'}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Целевое назначение:</span>
                                    <div className="text-xs">{selectedDynamicStation.land_info.celevoe || 'Н/Д'}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Площадь:</span>
                                    <div className="text-xs">{selectedDynamicStation.land_info.area ? `${selectedDynamicStation.land_info.area} м²` : 'Н/Д'}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Местоположение:</span>
                                    <div className="text-xs">{selectedDynamicStation.land_info.location || 'Н/Д'}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {!selectedDynamicStation.land_info && (
                              <div className="border-t pt-3">
                                <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                  ⚠️ Для данной рекомендации требуется покупка земли. Подходящий участок не найден.
                                </div>
                              </div>
                            )}
                            
                            <div className="flex flex-col gap-2 pt-3 border-t">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedDynamicStation(null)}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                Сбросить выбор
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setShowAllDynamicStations(!showAllDynamicStations)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                {showAllDynamicStations ? 'Скрыть все' : 'Показать все станции'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Информация о выбранных депо для других сценариев */}
                      {selectedScenario !== "dynamic" && selectedStations.length > 0 && (
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-gray-600">
                              Выбрано депо: {selectedStations.length}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedStations([])}
                              className="text-red-600 hover:text-red-700"
                            >
                              Очистить выбор
                            </Button>
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            <SelectedStationsInfo stations={selectedStations} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Таблица всех рекомендаций под картой */}
                {selectedScenario === "dynamic" && dynamicScenario?.stations && (
                  <div className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Все рекомендованные места размещения</CardTitle>
                        <CardDescription>Полный список динамических рекомендаций</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <SelectedStationsInfo stations={dynamicScenario.stations} />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>



            {/* Coverage Area Charts */}
            {selectedScenario !== "dynamic" && (
              <div className="space-y-6 lg:col-span-2">
                {/* Общая площадь покрытия (5 мин.) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Общая площадь (5 мин.)</CardTitle>
                    <CardDescription>Доступность территории за 5 минут</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center">
                    <ChartContainer
                      config={{
                        available: { label: "Доступно", color: "hsl(120, 70%, 50%)" },
                        unavailable: { label: "Недоступно", color: "hsl(0, 70%, 50%)" },
                      }}
                      className="h-64 w-full max-w-sm"
                    >
                      <PieChart>
                        <Pie
                          data={getCoverageAreaData(5)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${(value || 0).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {getCoverageAreaData(5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Доступно' ? 'hsl(120, 70%, 50%)' : 'hsl(0, 70%, 50%)'} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white p-3 border rounded shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p className={data.name === 'Доступно' ? 'text-green-600' : 'text-red-600'}>
                                    {(data.value || 0).toFixed(1)}%
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => (
                            <span style={{ color: entry.color }}>
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Общая площадь покрытия (10 мин.) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Общая площадь (10 мин.)</CardTitle>
                    <CardDescription>Доступность территории за 10 минут</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center items-center">
                    <ChartContainer
                      config={{
                        available: { label: "Доступно", color: "hsl(120, 70%, 50%)" },
                        unavailable: { label: "Недоступно", color: "hsl(0, 70%, 50%)" },
                      }}
                      className="h-64 w-full max-w-sm"
                    >
                      <PieChart>
                        <Pie
                          data={getCoverageAreaData(10)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${(value || 0).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {getCoverageAreaData(10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Доступно' ? 'hsl(120, 70%, 50%)' : 'hsl(0, 70%, 50%)'} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-white p-3 border rounded shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p className={data.name === 'Доступно' ? 'text-green-600' : 'text-red-600'}>
                                    {(data.value || 0).toFixed(1)}%
                                  </p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => (
                            <span style={{ color: entry.color }}>
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>



          {/* Сравнение AI рекомендаций и плана +16 */}
          {selectedScenario === "aiRecommended" && scenariosData && scenariosData.aiRecommended && scenariosData.planned16 && (
            <Card className="p-8 mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-full mr-4">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-800">Сравнение сценариев: AI рекомендации vs План +16</h3>
                  <p className="text-sm text-blue-600">Детальное сравнение эффективности двух стратегий размещения депо</p>
                </div>
              </div>
              
              <AiVsPlanned16Comparison comparisonData={getAiVsPlanned16ComparisonData()} />
            </Card>
          )}

          {/* Red Zone Statistics */}
          {selectedScenario !== "dynamic" && (
            <Card className="p-8 mb-6 bg-white border-gray-200">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-red-100 rounded-full mr-4">
                  <span className="text-2xl">🚨</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black-800">Анализ критических зон</h3>
                  <p className="text-sm text-black-600">Сценарий: {
                    scenariosData && selectedScenario !== "all" &&
                    scenariosData[selectedScenario as keyof ScenariosData] &&
                    typeof scenariosData[selectedScenario as keyof ScenariosData] === 'object' &&
                    'name' in scenariosData[selectedScenario as keyof ScenariosData]
                      ? (scenariosData[selectedScenario as keyof ScenariosData] as Scenario).name
                      : selectedScenario
                  }</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Количество красных гридов */}
                <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <span className="text-lg">🔥</span>
                    </div>
                    <div className="text-xs text-red-600 font-medium">ГРИДЫ</div>
                  </div>
                  <div className="text-2xl font-bold text-red-700 mb-1">
                    {(() => {
                      if (!scenariosData || selectedScenario === "all") return "0"
                      const scenario = scenariosData[selectedScenario as keyof ScenariosData]
                      if (!scenario || typeof scenario !== 'object' || !('coverage_grids' in scenario)) return "0"
                      const allRedGrids = scenario.coverage_grids?.filter(g => g.color === 'red') || []
                      return allRedGrids.length.toLocaleString()
                    })()}
                  </div>
                  <div className="text-xs text-gray-600">Красных зон</div>
                </div>

                {/* Общая площадь */}
                <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <span className="text-lg">📏</span>
                    </div>
                    <div className="text-xs text-red-600 font-medium">ПЛОЩАДЬ</div>
                  </div>
                  <div className="text-2xl font-bold text-red-700 mb-1">
                    {(() => {
                      if (!scenariosData || selectedScenario === "all") return "0"
                      const scenario = scenariosData[selectedScenario as keyof ScenariosData]
                      if (!scenario || typeof scenario !== 'object' || !('coverage_grids' in scenario)) return "0"
                      const allRedGrids = scenario.coverage_grids?.filter(g => g.color === 'red') || []
                      const totalRedZoneArea = allRedGrids.reduce((sum, g) => sum + (g.shape_area || 0), 0)
                      return totalRedZoneArea > 0 ? (totalRedZoneArea / 1000000).toFixed(1) + " км²" : "0 км²"
                    })()}
                  </div>
                  <div className="text-xs text-gray-600">Общая площадь</div>
                </div>

                {/* Население */}
                <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <span className="text-lg">👥</span>
                    </div>
                    <div className="text-xs text-red-600 font-medium">НАСЕЛЕНИЕ</div>
                  </div>
                  <div className="text-2xl font-bold text-red-700 mb-1">
                    {(() => {
                      if (!scenariosData || selectedScenario === "all") return "0"
                      const scenario = scenariosData[selectedScenario as keyof ScenariosData]
                      if (!scenario || typeof scenario !== 'object' || !('coverage_grids' in scenario)) return "0"
                      const allRedGrids = scenario.coverage_grids?.filter(g => g.color === 'red') || []
                      const totalPopulation = allRedGrids.reduce((sum, g) => sum + (g.population || 0), 0)
                      return (totalPopulation / 1000).toFixed(0) + " тыс."
                    })()}
                  </div>
                  <div className="text-xs text-gray-600">В красных зонах</div>
                </div>

                {/* Пожары в красной зоне */}
                <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-red-200 rounded-lg">
                      <span className="text-lg">🚒</span>
                    </div>
                    <div className="text-xs text-red-600 font-medium">ПОЖАРЫ</div>
                  </div>
                  <div className="text-2xl font-bold text-red-700 mb-1">
                    {(() => {
                      if (!scenariosData || selectedScenario === "all") return "0"
                      const scenario = scenariosData[selectedScenario as keyof ScenariosData]
                      if (!scenario || typeof scenario !== 'object' || !('coverage_grids' in scenario)) return "0"
                      const allRedGrids = scenario.coverage_grids?.filter(g => g.color === 'red') || []
                      const totalFires = allRedGrids.reduce((sum, g) => sum + (g.fire_count || 0), 0)
                      return totalFires.toLocaleString()
                    })()}
                  </div>
                  <div className="text-xs text-gray-600">Исторические пожары в красной зоне</div>
                </div>

                {/* Объекты с высоким риском */}
                <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <span className="text-lg">⚠️</span>
                    </div>
                    <div className="text-xs text-red-600 font-medium">РИСКИ</div>
                  </div>
                  <div className="text-2xl font-bold text-red-700 mb-1">
                    {(() => {
                      if (!scenariosData || selectedScenario === "all") return "0"
                      const scenario = scenariosData[selectedScenario as keyof ScenariosData]
                      if (!scenario || typeof scenario !== 'object' || !('coverage_grids' in scenario)) return "0"
                      const allRedGrids = scenario.coverage_grids?.filter(g => g.color === 'red') || []
                      const totalRiskObjects = allRedGrids.reduce((sum, g) => sum + (g.all_risk_objects || 0), 0)
                      return totalRiskObjects.toLocaleString()
                    })()}
                  </div>
                  <div className="text-xs text-gray-600">Объектов высокого риска</div>
                </div>
              </div>

              {/* Дополнительная информация */}
              <div className="mt-6 p-4 bg-white/50 rounded-lg border border-red-100">
                <div className="flex items-center text-sm text-black-700">
                  <span className="mr-2">ℹ️</span>
                                     <span className="font-medium">Критическая зона:</span>
                   <span className="ml-1">территория с временем прибытия пожарных {'>'}  10 минут</span>
                </div>
              </div>
            </Card>
          )}

          {/* Red Zone Analysis Charts */}
          {/* Графики анализа красных зон */}
          {selectedScenario !== "dynamic" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Red Zone Population Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Распределение населения в красной зоне по районам</CardTitle>
                  <CardDescription>Население без покрытия пожарных депо по районам</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {redZonePopulationData.map((item, index) => {
                      const maxValue = Math.max(...redZonePopulationData.map(d => d.redZonePopulation));
                      const percentage = Math.max((item.redZonePopulation / maxValue) * 100, 5);
                      const labelValue = `${(item.redZonePopulation / 1000).toFixed(0)} тыс.`;
                      // Показываем метку внутри только если она выходит за пределы графика (длинная полоса > 80%)
                      const showLabelInside = percentage > 80;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="min-w-[200px] text-xs font-medium text-gray-700 shrink-0">{item.district}</div>
                          <div className="flex-1 relative bg-gray-100 h-7 rounded-md">
                            <div 
                              className="absolute left-0 top-0 h-full bg-red-500 rounded-md transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                            <div 
                              className={`absolute top-1/2 transform -translate-y-1/2 ${showLabelInside ? 'right-2' : 'ml-2'}`}
                              style={showLabelInside ? { right: `${100 - percentage}%` } : { left: `${percentage}%` }}
                            >
                              <span className={`text-xs font-bold whitespace-nowrap ${showLabelInside ? 'text-white' : 'text-gray-800'}`}>
                                {labelValue}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Red Zone Area Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Распределение площади в красной зоне по районам</CardTitle>
                  <CardDescription>Площадь территории без покрытия пожарных станций по районам</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {redZoneAreaData.map((item, index) => {
                      const maxValue = Math.max(...redZoneAreaData.map(d => d.redZoneArea));
                      const percentage = Math.max((item.redZoneArea / maxValue) * 100, 5);
                      const labelValue = `${(item.redZoneArea / 1000000).toFixed(1)} млн`;
                      // Показываем метку внутри только если она выходит за пределы графика (длинная полоса > 80%)
                      const showLabelInside = percentage > 80;
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <div className="min-w-[200px] text-xs font-medium text-gray-700 shrink-0">{item.district}</div>
                          <div className="flex-1 relative bg-gray-100 h-7 rounded-md">
                            <div 
                              className="absolute left-0 top-0 h-full bg-red-500 rounded-md transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                            <div 
                              className={`absolute top-1/2 transform -translate-y-1/2 ${showLabelInside ? 'right-2' : 'ml-2'}`}
                              style={showLabelInside ? { right: `${100 - percentage}%` } : { left: `${percentage}%` }}
                            >
                              <span className={`text-xs font-bold whitespace-nowrap ${showLabelInside ? 'text-white' : 'text-gray-800'}`}>
                                {labelValue}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}



          {/* AI Recommendations Table */}
          {selectedScenario === "aiRecommended" && (
            <>

              <Card>
                <CardHeader>
                  <CardTitle>Рекомендуемые места размещения пожарных депо</CardTitle>
                  <CardDescription>
                    Оптимальные места размещения на основе анализа плотности населения, истории инцидентов и объектов повышенного риска
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Кадастровый номер</TableHead>
                          <TableHead>Право на землю</TableHead>
                          <TableHead>Срок пользования</TableHead>
                          <TableHead>Целевое назначение</TableHead>
                          <TableHead>Местоположение</TableHead>
                          <TableHead>Площадь (м²)</TableHead>
                          <TableHead>Делимость участка</TableHead>
                          <TableHead>Геометрия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aiRecommendedStations.map((station) => (
                          <TableRow key={station.id}>
                            <TableCell className="font-mono text-sm">{station.landInfo?.kad_nomer || ''}</TableCell>
                            <TableCell className="text-sm">{station.landInfo?.granted_right || ''}</TableCell>
                            <TableCell className="text-sm">{station.landInfo?.land_use_term || ''}</TableCell>
                            <TableCell className="text-sm break-words whitespace-normal" title={station.landInfo?.celevoe}>
                              {station.landInfo?.celevoe || ''}
                            </TableCell>
                            <TableCell className="text-sm break-words whitespace-normal" title={station.landInfo?.location}>
                              {station.landInfo?.location || ''}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {station.landInfo?.area ? Number(station.landInfo.area).toLocaleString() : ''}
                            </TableCell>
                            <TableCell className="text-sm">{station.landInfo?.divisible_plot || ''}</TableCell>
                            <TableCell className="font-mono text-xs break-words whitespace-normal" title={station.landInfo?.geom_wkt}>
                              {station.landInfo?.geom_wkt ? station.landInfo.geom_wkt.replace('POINT(', '').replace(')', '') : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

        </TabsContent>

        {/* Enhanced Tab 2: Hydrant Infrastructure */}
        <TabsContent value="hydrants" className="space-y-6">
          {/* Analysis View Toggle */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-white rounded-lg border">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-4 p-2 bg-gray-100 rounded-lg">
                <Label className="text-sm font-medium">Analysis View:</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={analysisView === "current" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setAnalysisView("current")}
                    className="flex items-center gap-1"
                  >
                    <Droplets className="h-4 w-4" />
                    Current Network
                  </Button>
                  <Button
                    variant={analysisView === "recommendations" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setAnalysisView("recommendations")}
                    className="flex items-center gap-1"
                  >
                    <Target className="h-4 w-4" />
                    Recommendations
                  </Button>
                </div>
              </div>
            </div>

            {/* Global Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="district-filter">District:</Label>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="downtown">Downtown</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="waterfront">Waterfront</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                                  <Label htmlFor="coverage-radius">Покрытие:</Label>
                <Select value={coverageRadius} onValueChange={setCoverageRadius}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100m</SelectItem>
                    <SelectItem value="200">200m</SelectItem>
                    <SelectItem value="300">300m</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="risk-level">Risk Level:</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Total Hydrants</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total number of fire hydrants in the city</p>
                        <p>Includes working, broken, and missing units</p>
                        <p>Updated monthly from inspection reports</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hydrantKPIs.totalHydrants.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Citywide network</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">% Operational</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of hydrants in working condition</p>
                        <p>Based on latest inspection reports</p>
                        <p>Minimum 50 PSI pressure and 1000 GPM flow rate</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hydrantKPIs.operationalPercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((hydrantKPIs.totalHydrants * hydrantKPIs.operationalPercentage) / 100)} working
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Building Coverage</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of buildings within 200m of a working hydrant</p>
                        <p>Critical for fire suppression operations</p>
                        <p>Based on NFPA 1142 standards</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hydrantKPIs.within200mBuildings}%</div>
                <p className="text-xs text-muted-foreground">Within 200m radius</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Fire Coverage</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Percentage of historical fires with nearby hydrants</p>
                        <p>Based on 3-year incident history (2021-2024)</p>
                        <p>Within 150m for effective hose deployment</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hydrantKPIs.firesWithNearbyHydrants}%</div>
                <p className="text-xs text-muted-foreground">Historical incidents</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Coverage Gap</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>High-risk buildings without adequate hydrant access</p>
                        <p>Requires immediate attention for safety</p>
                        <p>Includes hospitals, schools, and high-rises</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hydrantKPIs.coverageGap}</div>
                <p className="text-xs text-muted-foreground">High-risk buildings</p>
              </CardContent>
            </Card>
          </div>

          {/* Section 1: Current Hydrant Infrastructure */}
          {analysisView === "current" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Network Map */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Current Hydrant Network</CardTitle>
                        <CardDescription>Status and coverage analysis of existing hydrants</CardDescription>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="coverage-zones"
                            checked={showCoverageZones}
                            onCheckedChange={setShowCoverageZones}
                          />
                          <Label htmlFor="coverage-zones" className="text-sm">
                            Зоны покрытия
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="gap-zones" checked={showGapZones} onCheckedChange={setShowGapZones} />
                          <Label htmlFor="gap-zones" className="text-sm">
                            Зоны пропусков
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="hydrant-status">Статус:</Label>
                          <Select value={hydrantStatus} onValueChange={setHydrantStatus}>
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Все</SelectItem>
                              <SelectItem value="working">Рабочие</SelectItem>
                              <SelectItem value="broken">Неисправные</SelectItem>
                              <SelectItem value="missing">Отсутствующие</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border overflow-hidden">
                      {/* Map Background with Building Density Overlay */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"></div>
                        {/* Building density areas */}
                        <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-orange-200 rounded-lg opacity-60"></div>
                        <div className="absolute top-1/2 right-1/4 w-1/4 h-1/4 bg-red-200 rounded-lg opacity-60"></div>
                        <div className="absolute bottom-1/4 left-1/3 w-1/4 h-1/4 bg-yellow-200 rounded-lg opacity-60"></div>
                        {/* Fire incident density areas */}
                        <div className="absolute top-1/5 left-1/5 w-16 h-16 bg-red-400 rounded-full opacity-30"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-red-400 rounded-full opacity-30"></div>
                        <div className="absolute top-2/3 left-1/3 w-12 h-12 bg-orange-400 rounded-full opacity-30"></div>
                      </div>

                      {/* Coverage Zones */}
                      {showCoverageZones &&
                        getFilteredHydrants()
                          .filter((h) => h.status === "working")
                          .map((hydrant) => (
                            <div
                              key={`zone-${hydrant.id}`}
                              className="absolute rounded-full border-2 border-green-300 bg-green-100 opacity-30"
                              style={{
                                left: `${hydrant.x - Number.parseInt(coverageRadius) / 10}%`,
                                top: `${hydrant.y - Number.parseInt(coverageRadius) / 10}%`,
                                width: `${(Number.parseInt(coverageRadius) * 2) / 10}%`,
                                height: `${(Number.parseInt(coverageRadius) * 2) / 10}%`,
                              }}
                            ></div>
                          ))}

                      {/* Gap Zones */}
                      {showGapZones && (
                        <>
                          <div className="absolute top-1/3 left-1/6 w-16 h-16 bg-red-300 rounded-full opacity-40 border-2 border-red-500 border-dashed"></div>
                          <div className="absolute bottom-1/3 right-1/6 w-20 h-20 bg-red-300 rounded-full opacity-40 border-2 border-red-500 border-dashed"></div>
                          <div className="absolute top-1/6 right-1/3 w-12 h-12 bg-red-300 rounded-full opacity-40 border-2 border-red-500 border-dashed"></div>
                        </>
                      )}

                      {/* Hydrant Markers */}
                      {getFilteredHydrants().map((hydrant) => (
                        <div
                          key={hydrant.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${hydrant.x}%`, top: `${hydrant.y}%` }}
                        >
                          <div className="relative group">
                            <div
                              className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${getHydrantColor(hydrant.status)}`}
                            ></div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              <div className="font-medium">Hydrant {hydrant.id}</div>
                              <div className="text-xs opacity-75">Status: {hydrant.status}</div>
                              <div className="text-xs opacity-75">District: {hydrant.district}</div>
                              <div className="text-xs opacity-75">Last Inspection: {hydrant.lastInspection}</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Enhanced Legend */}
                      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border">
                        <div className="text-sm font-semibold mb-3">Hydrant Status</div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full border border-white"></div>
                            <span>Working ({hydrantStatusData[0].count})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full border border-white"></div>
                            <span>Broken ({hydrantStatusData[1].count})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full border border-white"></div>
                            <span>Missing ({hydrantStatusData[2].count})</span>
                          </div>
                          {showCoverageZones && (
                            <div className="flex items-center gap-2 pt-1 border-t">
                              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded-full opacity-50"></div>
                              <span>{coverageRadius}m Coverage</span>
                            </div>
                          )}
                          {showGapZones && (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-red-300 rounded-full opacity-50 border border-red-500 border-dashed"></div>
                              <span>Coverage Gaps</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Building Density Legend */}
                      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
                        <div className="text-sm font-semibold mb-2">Overlays</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-200 rounded"></div>
                            <span>High Building Density</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-200 rounded"></div>
                            <span>Medium Building Density</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                            <span>Low Building Density</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-400 rounded-full opacity-50"></div>
                            <span>Fire Incident Hotspots</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Operational Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Operational Status</CardTitle>
                    <CardDescription>Distribution of hydrant conditions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        working: { label: "Working", color: "#22c55e" },
                        broken: { label: "Broken", color: "#ef4444" },
                        missing: { label: "Missing", color: "#f59e0b" },
                      }}
                      className="h-64"
                    >
                      <PieChart>
                        <Pie
                          data={hydrantStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                        >
                          {hydrantStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="mt-4 space-y-2">
                      {hydrantStatusData.map((item) => (
                        <div key={item.status} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span>{item.status}</span>
                          </div>
                          <span className="font-medium">
                            {item.count} ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* District Coverage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>District Coverage Analysis</CardTitle>
                  <CardDescription>Building coverage and hydrant density by district</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      buildingsCovered: { label: "Buildings Covered %", color: "hsl(var(--chart-1))" },
                      hydrantDensity: { label: "Hydrant Density", color: "hsl(var(--chart-2))" },
                    }}
                    className="h-64"
                  >
                    <BarChart data={districtCoverage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="district" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="buildingsCovered" fill="var(--color-buildingsCovered)" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Hydrant Details Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Hydrant Details</CardTitle>
                  <CardDescription>Comprehensive hydrant information and status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hydrant ID</TableHead>
                          <TableHead>Coordinates</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>District</TableHead>
                          <TableHead>Last Inspection</TableHead>
                          <TableHead>Pressure</TableHead>
                          <TableHead>Flow Rate</TableHead>
                          <TableHead>Risk Zone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hydrantDetailData.map((hydrant) => (
                          <TableRow key={hydrant.id}>
                            <TableCell className="font-medium">{hydrant.id}</TableCell>
                            <TableCell className="font-mono text-sm">{hydrant.coordinates}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(hydrant.status)}
                                <span>{hydrant.status}</span>
                              </div>
                            </TableCell>
                            <TableCell>{hydrant.district}</TableCell>
                            <TableCell>{hydrant.lastInspection}</TableCell>
                            <TableCell>{hydrant.pressure}</TableCell>
                            <TableCell>{hydrant.flowRate}</TableCell>
                            <TableCell>
                              <Badge
                                className={`${
                                  hydrant.riskZone === "Critical"
                                    ? "bg-red-600"
                                    : hydrant.riskZone === "High"
                                      ? "bg-orange-500"
                                      : hydrant.riskZone === "Medium"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                } text-white`}
                              >
                                {hydrant.riskZone}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Section 2: Hydrant Recommendations */}
          {analysisView === "recommendations" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recommendations Map */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Hydrant Recommendations</CardTitle>
                        <CardDescription>Proposed locations for new hydrant installations</CardDescription>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-recommendations"
                            checked={showRecommendations}
                            onCheckedChange={setShowRecommendations}
                          />
                          <Label htmlFor="show-recommendations" className="text-sm">
                            Show Current + Recommended
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border overflow-hidden">
                      {/* Map Background */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"></div>
                        {/* Fire incident hotspots */}
                        <div className="absolute top-1/5 left-1/5 w-16 h-16 bg-red-400 rounded-full opacity-50"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-red-400 rounded-full opacity-50"></div>
                        <div className="absolute top-2/3 left-1/3 w-12 h-12 bg-orange-400 rounded-full opacity-50"></div>
                      </div>

                      {/* Current Hydrants (if showing comparison) */}
                      {showRecommendations &&
                        currentHydrants.map((hydrant) => (
                          <div
                            key={`current-${hydrant.id}`}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${hydrant.x}%`, top: `${hydrant.y}%` }}
                          >
                            <div
                              className={`w-3 h-3 rounded-full border border-white shadow-sm opacity-60 ${getHydrantColor(hydrant.status)}`}
                            ></div>
                          </div>
                        ))}

                      {/* Recommended Hydrant Locations */}
                      {getFilteredRecommendations().map((rec) => (
                        <div
                          key={rec.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${rec.x}%`, top: `${rec.y}%` }}
                        >
                          <div className="relative group">
                            <div
                              className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${getPriorityColor(rec.priority)}`}
                            >
                              <Target className="h-3 w-3 text-white" />
                              {rec.priority === "Critical" && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                              )}
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              <div className="font-medium">Recommended Hydrant</div>
                              <div className="text-xs opacity-75">Priority: {rec.priority}</div>
                              <div className="text-xs opacity-75">Buildings: {rec.buildingsServed}</div>
                              <div className="text-xs opacity-75">Score: {rec.riskScore}</div>
                              <div className="text-xs opacity-75">Cost: ${rec.estimatedCost.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Underserved Areas */}
                      <div className="absolute top-1/4 left-1/6 w-24 h-24 border-2 border-red-500 border-dashed rounded-full bg-red-100 opacity-40"></div>
                      <div className="absolute bottom-1/3 right-1/5 w-28 h-28 border-2 border-red-500 border-dashed rounded-full bg-red-100 opacity-40"></div>

                      {/* Legend */}
                      <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg border">
                        <div className="text-sm font-semibold mb-3">Recommendations</div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-600 rounded-full border border-white flex items-center justify-center">
                              <Target className="h-2 w-2 text-white" />
                            </div>
                            <span>Critical Priority</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-orange-500 rounded-full border border-white flex items-center justify-center">
                              <Target className="h-2 w-2 text-white" />
                            </div>
                            <span>High Priority</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded-full border border-white flex items-center justify-center">
                              <Target className="h-2 w-2 text-white" />
                            </div>
                            <span>Medium Priority</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full border border-white flex items-center justify-center">
                              <Target className="h-2 w-2 text-white" />
                            </div>
                            <span>Low Priority</span>
                          </div>
                          {showRecommendations && (
                            <div className="flex items-center gap-2 pt-1 border-t">
                              <div className="w-3 h-3 bg-green-500 rounded-full opacity-60"></div>
                              <span>Current Hydrants</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-red-500 border-dashed rounded-full bg-red-100 opacity-60"></div>
                            <span>Underserved Areas</span>
                          </div>
                        </div>
                      </div>

                      {/* Fire Hotspot Legend */}
                      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
                        <div className="text-sm font-semibold mb-2">Fire Incident Density</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-400 rounded-full opacity-50"></div>
                            <span>High Incident Area</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-400 rounded-full opacity-50"></div>
                            <span>Medium Incident Area</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gap Reduction Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Coverage Gap Reduction</CardTitle>
                    <CardDescription>Impact of recommended hydrant installations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        currentGap: { label: "Current Gap", color: "hsl(var(--chart-1))" },
                        afterRecommendations: { label: "After Recommendations", color: "hsl(var(--chart-2))" },
                      }}
                      className="h-64"
                    >
                      <BarChart data={gapReductionData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="district" type="category" width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="currentGap" fill="var(--color-currentGap)" />
                        <Bar dataKey="afterRecommendations" fill="var(--color-afterRecommendations)" />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Hydrant Placement Recommendations</CardTitle>
                  <CardDescription>Detailed analysis and justification for new hydrant locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Location ID</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Risk Score</TableHead>
                          <TableHead>Buildings Served</TableHead>
                          <TableHead>Justification</TableHead>
                          <TableHead>Estimated Cost</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredRecommendations().map((rec) => (
                          <TableRow key={rec.id}>
                            <TableCell className="font-medium">REC-{rec.id}</TableCell>
                            <TableCell>
                              <Badge className={`${getPriorityColor(rec.priority)} text-white`}>{rec.priority}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${rec.riskScore}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{rec.riskScore}</span>
                              </div>
                            </TableCell>
                            <TableCell>{rec.buildingsServed}</TableCell>
                            <TableCell className="max-w-xs">
                              <div className="text-sm">{rec.reason}</div>
                            </TableCell>
                            <TableCell>${rec.estimatedCost.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* How Coverage is Calculated - Info Dialog */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Coverage Analysis Methodology</CardTitle>
                  <CardDescription>Understanding hydrant coverage calculations and recommendations</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                      <Info className="h-4 w-4" />
                      How is hydrant coverage calculated?
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Hydrant Coverage Calculation Methodology</DialogTitle>
                      <DialogDescription>
                        Comprehensive explanation of our coverage analysis and recommendation algorithms
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm max-h-96 overflow-y-auto">
                      <div>
                        <h4 className="font-semibold mb-2">Coverage Definition</h4>
                        <p>
                          Hydrant coverage is calculated using distance buffers around each operational hydrant. The
                          standard coverage radius is 200 meters, based on fire department operational requirements and
                          hose deployment capabilities. This follows NFPA 1142 standards for water supply.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Risk Zone Identification</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>
                            <strong>Critical:</strong> Hospitals, schools, chemical storage, nuclear facilities, data
                            centers
                          </li>
                          <li>
                            <strong>High:</strong> Commercial districts, dense residential areas, industrial facilities,
                            high-rises
                          </li>
                          <li>
                            <strong>Medium:</strong> Standard residential areas, small commercial buildings, warehouses
                          </li>
                          <li>
                            <strong>Low:</strong> Rural areas, parks, low-density residential zones, agricultural areas
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Recommendation Criteria</h4>
                        <p>
                          New hydrant locations are recommended based on a composite scoring algorithm that considers:
                        </p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                          <li>Distance to nearest existing hydrant (weight: 30%)</li>
                          <li>Historical fire incident density (weight: 25%)</li>
                          <li>Building density and risk classification (weight: 25%)</li>
                          <li>Population density (weight: 10%)</li>
                          <li>Water infrastructure accessibility (weight: 10%)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Data Sources</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Fire incident history: Last 3 years (2021-2024)</li>
                          <li>Building classifications: City planning database</li>
                          <li>Population data: Latest census and growth projections</li>
                          <li>Hydrant inspections: Monthly maintenance reports</li>
                          <li>Water pressure data: Utility company records</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Quality Standards</h4>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Minimum water pressure: 50 PSI static pressure</li>
                          <li>Minimum flow rate: 1000 GPM at 20 PSI residual pressure</li>
                          <li>Maximum spacing: 300 feet in commercial areas, 500 feet in residential</li>
                          <li>Accessibility: Within 150 feet of roadway for fire apparatus</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        {/* Calls Analysis Tab */}
        <TabsContent value="calls">
          <CallsAnalysisDashboard />
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Station Load & Resources</CardTitle>
              <CardDescription>Coming soon - Resource optimization and load balancing</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

