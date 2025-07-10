"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChartContainer } from '@/components/ui/chart'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  Flame, 
  Car, 
  Building, 
  TreePine, 
  HelpCircle, 
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  FileText,
  Info
} from 'lucide-react'
import MapComponent from './map-component'

interface TransportIncident {
  id: number
  latitude: number
  longitude: number
  cause: string
  transport_type: string
  brand: string
  model: string
  year: string
  created_at: string
  was_fire: boolean
  injured: string
  deceased: string
}

interface BuildingIncident {
  id: number
  latitude: number
  longitude: number
  building_type: string
  cause: string
  floors: string
  damage_level: string
  created_at: string
  was_fire: boolean
  injured: string
  deceased: string
}

interface HelpIncident {
  id: number
  latitude: number
  longitude: number
  help_type: string
  location: string
  assistance_type: string
  created_at: string
  was_fire: boolean
  injured: string
  deceased: string
}

interface VigilanceIncident {
  id: number
  latitude: number
  longitude: number
  reason: string
  source: string
  district: string
  created_at: string
  was_fire: boolean
  injured: string
  deceased: string
}

interface DryGrassIncident {
  id: number
  latitude: number
  longitude: number
  grass_type: string
  location: string
  cause: string
  area: string
  created_at: string
  was_fire: boolean
  injured: string
  deceased: string
}

interface CallsData {
  general: {
    total: number
    withFire: number
    withInjuries: number
    withDeaths: number
    byCategory: Array<{ name: string; value: number }>
  }
  transport: {
    total: number
    withFire: number
    withInjuries: number
    withDeaths: number
    byType: Record<string, number>
    byBrand: Record<string, number>
    byYear: Record<string, number>
    byCause: Record<string, number>
    byRoute: Record<string, number>
    topTypes: Array<{ name: string; value: number }>
    topBrands: Array<{ name: string; value: number }>
    topYears: Array<{ name: string; value: number }>
    topCauses: Array<{ name: string; value: number }>
    topRoutes: Array<{ name: string; value: number }>
    ageRanges: Array<{ name: string; value: number }>
    seasonalData: Array<{ name: string; value: number }>
    timeOfDayData: Array<{ name: string; value: number }>
    hourlyData: Array<{ hour: number; value: number }>
    brandAgeData: Array<{ brand: string; avgAge: number; incidents: number }>
  }
  buildings: {
    total: number
    withFire: number
    withInjuries: number
    withDeaths: number
    byType: Record<string, number>
    byCause: Record<string, number>
    byFloors: Record<string, number>
    byDistrict: Record<string, number>
    timeOfDayData: Record<string, number>
    seasonalData: Record<string, number>
    hourlyData: Record<string, number>
    ageGroupsInjured: Record<string, number>
    damageLevel: Record<string, number>
  }
  dryGrass: {
    total: number
    withFire: number
    withInjuries: number
    withDeaths: number
    byType: Array<{ name: string; value: number }>
    byLocation: Array<{ name: string; value: number }>
    byCause: Array<{ name: string; value: number }>
    byDistrict: Array<{ name: string; value: number }>
    seasonalData: Array<{ name: string; value: number }>
    timeOfDayData: Array<{ name: string; value: number }>
    hourlyData: Array<{ hour: number; value: number }>
    monthlyData: Array<{ month: string; value: number }>
  }
  unconfirmed: {
    total: number
    withFire: number
    withInjuries: number
    withDeaths: number
    byReason: Array<{ name: string; value: number }>
    bySource: Array<{ name: string; value: number }>
    byDistrict: Array<{ name: string; value: number }>
    timeOfDayData: Array<{ name: string; value: number }>
    hourlyData: Array<{ hour: number; value: number }>
  }
  help: {
    total: number
    withFire: number
    withInjuries: number
    withDeaths: number
    byType: Array<{ name: string; value: number }>
    byLocation: Array<{ name: string; value: number }>
    byDistrict: Array<{ name: string; value: number }>
    timeOfDayData: Array<{ name: string; value: number }>
    hourlyData: Array<{ hour: number; value: number }>
  }
  categories: string[]
  rawData?: {
    transport: TransportIncident[]
    buildings: BuildingIncident[]
    help: HelpIncident[]
    vigilance: VigilanceIncident[]
    dryGrass: DryGrassIncident[]
  }
}

const COLORS = {
  fire: '#ef4444',
  transport: '#3b82f6',
  building: '#10b981',
  dryGrass: '#f59e0b',
  unconfirmed: '#8b5cf6',
  help: '#ec4899',
  warning: '#f59e0b', 
  success: '#22c55e',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366F1',
  gray: '#6B7280'
}

// Функция для преобразования объекта в массив для графиков
const transformToChartData = (obj: Record<string, number>) => {
  return Object.entries(obj).map(([name, value]) => ({ name, value }))
}

export default function CallsAnalysisDashboard() {
  const [data, setData] = useState<CallsData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('Все вызовы')
  const [loading, setLoading] = useState(true)
  const [showMethodology, setShowMethodology] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/data/calls-analysis.json')
        const jsonData = await response.json()
        setData(jsonData)
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Транспорт': return <Car className="w-5 h-5" />
      case 'Здание': return <Building className="w-5 h-5" />
      case 'Сухостой, мусор': return <TreePine className="w-5 h-5" />
      case 'Бдительность граждан': return <AlertTriangle className="w-5 h-5" />
      case 'Помощь': return <HelpCircle className="w-5 h-5" />
      default: return <Flame className="w-5 h-5" />
    }
  }

  const getCategoryMetrics = (category: string) => {
    if (!data) return null
    
    switch (category) {
      case 'Транспорт':
        return {
          total: data.transport.total,
          withFire: data.transport.withFire,
          withInjuries: data.transport.withInjuries,
          withDeaths: data.transport.withDeaths
        }
      case 'Здание':
        return {
          total: data.buildings.total,
          withFire: data.buildings.withFire,
          withInjuries: data.buildings.withInjuries,
          withDeaths: data.buildings.withDeaths
        }
      case 'Сухостой, мусор':
        return {
          total: data.dryGrass.total,
          withFire: data.dryGrass.withFire,
          withInjuries: data.dryGrass.withInjuries,
          withDeaths: data.dryGrass.withDeaths
        }
             case 'Бдительность граждан':
         return {
           total: data.unconfirmed.total,
           withFire: data.unconfirmed.withFire,
           withInjuries: data.unconfirmed.withInjuries,
           withDeaths: data.unconfirmed.withDeaths
         }
      case 'Помощь':
        return {
          total: data.help.total,
          withFire: data.help.withFire,
          withInjuries: data.help.withInjuries,
          withDeaths: data.help.withDeaths
        }
      default:
        return {
          total: data.general.total,
          withFire: data.general.withFire,
          withInjuries: data.general.withInjuries,
          withDeaths: data.general.withDeaths
        }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных анализа вызовов...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Не удалось загрузить данные</p>
      </div>
    )
  }

  const categories = ['Все вызовы', 'Транспорт', 'Здание', 'Сухостой, мусор', 'Бдительность граждан', 'Помощь']
  const metrics = getCategoryMetrics(selectedCategory)

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">📊 Анализ вызовов пожарной службы</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMethodology(!showMethodology)}
              className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border flex items-center space-x-1"
            >
              <FileText className="w-4 h-4" />
              <span>Методология</span>
            </Button>
            <Badge variant="outline" className="text-sm">
              Всего вызовов: {data.general.total.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Методология */}
        {showMethodology && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span>Методология анализа</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• Данные собраны из системы учета вызовов пожарной службы</p>
                <p>• Период анализа: полный календарный год</p>
                <p>• Категории классифицированы по типу происшествия</p>
                <p>• Географические данные привязаны к координатам вызовов</p>
                <p>• Статистика обновляется в реальном времени</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Метрики для выбранной категории */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-600">Всего вызовов</p>
                    <p className="text-2xl font-bold">{metrics.total.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">С пожаром</p>
                    <p className="text-2xl font-bold">{metrics.withFire.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">С пострадавшими</p>
                    <p className="text-2xl font-bold">{metrics.withInjuries.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">С погибшими</p>
                    <p className="text-2xl font-bold">{metrics.withDeaths.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Фильтры по категориям */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex items-center space-x-1"
            >
              {getCategoryIcon(category)}
              <span>{category}</span>
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="analysis">Анализ вызовов</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            
            {/* Все вызовы */}
            {selectedCategory === 'Все вызовы' && (
              <>
                {/* Карта всех вызовов */}
                <Card>
                  <CardHeader>
                    <CardTitle>🗺️ Карта всех вызовов</CardTitle>
                    <CardDescription>Общее распределение вызовов по городу</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <MapComponent 
                        stations={[]} 
                        coverageGrids={[]} 
                        baseCoverageGrids={[]}
                        showCoverageZones={false}
                        selectedScenario="base"
                        selectedDistrict="all"
                        transportIncidents={data.rawData?.transport || []}
                        buildingIncidents={data.rawData?.buildings || []}
                        showTransportIncidents={true}
                        showBuildingIncidents={true}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📊 Распределение по категориям</CardTitle>
                    <CardDescription>Общее количество вызовов по типам</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.general.byCategory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill={COLORS.fire} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Транспорт */}
            {selectedCategory === 'Транспорт' && (
              <>
                {/* KPI карточки для транспорта */}
                {/*<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Car className="w-5 h-5 text-blue-600" />
                        Всего вызовов
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.transport.total}</div>
                      <div className="text-sm text-muted-foreground">
                        транспортных инцидентов
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Flame className="w-5 h-5 text-red-600" />
                        С возгоранием
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{data.transport.withFire}</div>
                      <div className="text-sm text-muted-foreground">
                        {((data.transport.withFire / data.transport.total) * 100).toFixed(1)}% от общего числа
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-orange-600" />
                        Пострадавшие
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{data.transport.withInjuries}</div>
                      <div className="text-sm text-muted-foreground">
                        человек получили травмы
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-800" />
                        Погибло
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-800">{data.transport.withDeaths}</div>
                      <div className="text-sm text-muted-foreground">
                        смертельных случаев
                      </div>
                    </CardContent>
                  </Card>
                </div>*/}

                {/* Карта для транспорта */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-blue-600" />
                      Карта транспортных инцидентов
                    </CardTitle>
                    <CardDescription>
                      Интерактивная карта с точками возгораний транспорта. Цвет маркера зависит от причины инцидента.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Legend */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Короткое замыкание</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span>ДТП</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>Топливная система</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Тормозная система</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                          <span>Прочие причины</span>
                        </div>
                      </div>
                      
                      {/* Map Container */}
                      <div className="w-full h-[500px] rounded-lg overflow-hidden border">
                        <MapComponent 
                          stations={[]} 
                          coverageGrids={[]} 
                          baseCoverageGrids={[]}
                          showCoverageZones={false}
                          selectedScenario="transport"
                          selectedDistrict="all"
                          transportIncidents={data.rawData?.transport || []}
                          showTransportIncidents={true}
                          buildingIncidents={[]}
                          showBuildingIncidents={false}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Графики транспорта */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🚗 Типы транспорта</CardTitle>
                      <CardDescription>Какой транспорт чаще горит</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.transport.topTypes.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.transport} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🏷️ Популярные марки</CardTitle>
                      <CardDescription>Марки авто в происшествиях</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.transport.topBrands.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.warning} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🔥 Причины возгораний</CardTitle>
                      <CardDescription>Основные причины пожаров</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.transport.topCauses.slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.fire} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Вторая строка графиков - год выпуска и возраст */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📅 По году выпуска</CardTitle>
                      <CardDescription>Распределение по годам выпуска</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.transport.topYears.slice(0, 15)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.purple} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">⏱️ Возраст транспорта</CardTitle>
                      <CardDescription>Распределение инцидентов по возрастным группам</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.transport.ageRanges}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.indigo} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🚌 Маршруты автобусов</CardTitle>
                      <CardDescription>Проблемные маршруты</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.transport.topRoutes.slice(0, 8)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.success} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🌍 Сезонность</CardTitle>
                      <CardDescription>Распределение по временам года</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={data.transport.seasonalData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                              {data.transport.seasonalData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">⏰ Время суток</CardTitle>
                      <CardDescription>Когда чаще происходят ДТП</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.transport.timeOfDayData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.info} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">📈 Почасовая статистика</CardTitle>
                      <CardDescription>Распределение по часам суток</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.transport.hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke={COLORS.transport} strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>


              </>
            )}

            {/* Здания */}
            {selectedCategory === 'Здание' && (
              <>
                {/* Карта для зданий */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Карта пожаров в зданиях
                    </CardTitle>
                    <CardDescription>Географическое распределение пожаров в зданиях с цветовой кодировкой по типу</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Легенда */}
                      <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded border-2 border-white" style={{backgroundColor: '#3B82F6'}}></div>
                          <span className="text-sm">Жилые дома</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded border-2 border-white" style={{backgroundColor: '#10B981'}}></div>
                          <span className="text-sm">Административные</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-orange-500 rounded border-2 border-white" style={{backgroundColor: '#F59E0B'}}></div>
                          <span className="text-sm">Торговые</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-red-500 rounded border-2 border-white" style={{backgroundColor: '#EF4444'}}></div>
                          <span className="text-sm">Производственные</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-purple-500 rounded border-2 border-white" style={{backgroundColor: '#8B5CF6'}}></div>
                          <span className="text-sm">Образовательные</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-500 rounded border-2 border-white" style={{backgroundColor: '#6B7280'}}></div>
                          <span className="text-sm">Прочие</span>
                        </div>
                      </div>
                      <div className="h-96">
                        <MapComponent 
                          stations={[]} 
                          coverageGrids={[]} 
                          baseCoverageGrids={[]}
                          showCoverageZones={false}
                          selectedScenario="base"
                          selectedDistrict="all"
                          buildingIncidents={data.rawData?.buildings || []}
                          showBuildingIncidents={true}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Графики зданий */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>🏢 Типы зданий</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={transformToChartData(data.buildings.byType).slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.building} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>🔥 Причины пожаров</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={transformToChartData(data.buildings.byCause).slice(0, 10)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.fire} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>🏗️ Этажность зданий</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={transformToChartData(data.buildings.byFloors)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.building} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>⏰ Время суток</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={transformToChartData(data.buildings.timeOfDayData)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {transformToChartData(data.buildings.timeOfDayData).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Сухостой, мусор */}
            {selectedCategory === 'Сухостой, мусор' && (
              <>
                {/* Карта для сухостоя */}
                <Card>
                  <CardHeader>
                    <CardTitle>🗺️ Карта пожаров сухостоя и мусора</CardTitle>
                    <CardDescription>Тепловая карта распределения пожаров растительности</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <MapComponent 
                        stations={[]} 
                        coverageGrids={[]} 
                        baseCoverageGrids={[]}
                        showCoverageZones={false}
                        selectedScenario="base"
                        selectedDistrict="all"
                        dryGrassIncidents={data.rawData?.dryGrass || []}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>🌿 Что горит</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.dryGrass.byType}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.dryGrass} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>📍 Место возгорания</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.dryGrass.byLocation}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.dryGrass} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>🔥 Было ли ликвидировано до прибытия</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'НЕТ', value: 5676 },
                                { name: 'да', value: 92 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#ef4444" />
                              <Cell fill="#22c55e" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Бдительность граждан */}
            {selectedCategory === 'Бдительность граждан' && (
              <>
                {/* Карта для неподтвержденной информации */}
                <Card>
                  <CardHeader>
                    <CardTitle>🗺️ Карта неподтвержденных вызовов</CardTitle>
                    <CardDescription>Распределение ложных вызовов по городу</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                                             <MapComponent 
                         stations={[]} 
                         coverageGrids={[]} 
                         baseCoverageGrids={[]}
                         showCoverageZones={false}
                         selectedScenario="base"
                         selectedDistrict="all"
                         vigilanceIncidents={data.rawData?.vigilance || []}
                       />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>❌ Причины неподтверждения</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.unconfirmed.byReason}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.unconfirmed} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>📞 Источник сообщения</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.unconfirmed.bySource}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {data.unconfirmed.bySource.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>🔍 Предварительная информация</CardTitle>
                      <CardDescription>Было ли сообщение о возгорании</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Что горит указано', value: 89 },
                            { name: 'Что горит не указано', value: 178 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.info} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>🚨 Было ли вмешательство</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Нет', value: 201 },
                                { name: 'Да', value: 66 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              <Cell fill="#ef4444" />
                              <Cell fill="#22c55e" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Помощь */}
            {selectedCategory === 'Помощь' && (
              <>
                {/* Карта для помощи */}
                <Card>
                  <CardHeader>
                    <CardTitle>🗺️ Карта вызовов помощи</CardTitle>
                    <CardDescription>Распределение вызовов на оказание помощи</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                                             <MapComponent 
                         stations={[]} 
                         coverageGrids={[]} 
                         baseCoverageGrids={[]}
                         showCoverageZones={false}
                         selectedScenario="base"
                         selectedDistrict="all"
                         helpIncidents={data.rawData?.help || []}
                       />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🚨 Тип инцидента</CardTitle>
                      <CardDescription>Виды происшествий</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: "Утечка ГСМ", value: 67 },
                            { name: "ДТП", value: 45 },
                            { name: "Угроза взрыва", value: 23 },
                            { name: "Спасение людей", value: 21 },
                            { name: "Другое", value: 17 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.success} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🤝 Помощь других служб</CardTitle>
                      <CardDescription>Взаимодействие с другими службами</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: "Полиция", value: 89 },
                            { name: "Скорая помощь", value: 67 },
                            { name: "Служба спасения", value: 45 },
                            { name: "Газовая служба", value: 23 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.info} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">⚠️ Обнаруженные опасности</CardTitle>
                      <CardDescription>Что было обнаружено на месте</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: "ГСМ", value: 67 },
                                { name: "Газ", value: 34 },
                                { name: "Химикаты", value: 23 },
                                { name: "Другое", value: 49 }
                              ]}
                              cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" 
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {[0, 1, 2, 3].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🔧 Что сделано</CardTitle>
                      <CardDescription>Действия пожарных</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: "Смыв ГСМ", value: 45 },
                            { name: "Эвакуация", value: 34 },
                            { name: "Вскрытие замков", value: 29 },
                            { name: "Откачка воды", value: 23 },
                            { name: "Другое", value: 42 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.warning} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">👥 Пострадавшие</CardTitle>
                      <CardDescription>Статистика по пострадавшим</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={{}} className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: "Без пострадавших", value: 134 },
                            { name: "1-2 пострадавших", value: 28 },
                            { name: "3-5 пострадавших", value: 8 },
                            { name: "Более 5", value: 3 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.fire} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 