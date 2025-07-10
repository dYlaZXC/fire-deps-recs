"use client"

import { useEffect, useRef, useState } from 'react'
import { Map as MapLibreMap, NavigationControl, ScaleControl, Marker, Popup } from 'maplibre-gl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Box, Map as MapIcon, RotateCcw } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'
import * as wellknown from 'wellknown'

interface Station {
  id: number
  latitude: string
  longitude: string
  description: string
  caption: string
  district_id: number
  district_name?: string
  exist_text: string
  has_land?: boolean // Для динамических рекомендаций
  score?: number // Оценка рекомендации
}

interface CoverageGrid {
  district_id: number
  geometry: string
  color: string
  population: number
  fire_count: number
  all_risk_objects?: number
}

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

interface MapComponentProps {
  stations: Station[]
  coverageGrids: CoverageGrid[]
  baseCoverageGrids: CoverageGrid[]
  showCoverageZones: boolean
  selectedScenario: string
  selectedDistrict: string
  transportIncidents?: TransportIncident[]
  showTransportIncidents?: boolean
  buildingIncidents?: BuildingIncident[]
  showBuildingIncidents?: boolean
  helpIncidents?: HelpIncident[]
  vigilanceIncidents?: VigilanceIncident[]
  dryGrassIncidents?: DryGrassIncident[]
  onStationSelect?: (station: Station) => void
}

const MAPTILER_KEY = 'bBkhJLzOsVLowQmEIXZO'
const ALMATY_CENTER: [number, number] = [76.9286, 43.2384] // Алматы координаты

export default function MapComponent({ 
  stations, 
  coverageGrids, 
  baseCoverageGrids,
  showCoverageZones, 
  selectedScenario,
  selectedDistrict,
  transportIncidents = [],
  showTransportIncidents = false,
  buildingIncidents = [],
  showBuildingIncidents = false,
  helpIncidents = [],
  vigilanceIncidents = [],
  dryGrassIncidents = [],
  onStationSelect
}: MapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibreMap | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [is3D, setIs3D] = useState(false)
  const markers = useRef<Marker[]>([])

  // Инициализация карты
  useEffect(() => {
    if (!mapContainer.current) return

    const mapInstance = new MapLibreMap({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: ALMATY_CENTER,
      zoom: 10,
      pitch: 0,
      bearing: 0
    })

    // Добавляем контролы
    mapInstance.addControl(new NavigationControl(), 'top-right')
    mapInstance.addControl(new ScaleControl(), 'bottom-left')

    mapInstance.on('load', () => {
      setMapLoaded(true)
    })

    map.current = mapInstance

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  // Переключение 2D/3D
  const toggle3D = () => {
    if (!map.current) return
    
    const newIs3D = !is3D
    setIs3D(newIs3D)
    
    if (newIs3D) {
      // Включаем 3D режим
      map.current.easeTo({
        pitch: 60,
        bearing: -17.6,
        duration: 1000
      })
    } else {
      // Возвращаемся к 2D
      map.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      })
    }
  }

  // Сброс к центру Алматы
  const resetView = () => {
    if (!map.current) return
    
    map.current.easeTo({
      center: ALMATY_CENTER,
      zoom: 10,
      pitch: is3D ? 60 : 0,
      bearing: is3D ? -17.6 : 0,
      duration: 1500
    })
  }

  // Получение цвета маркера по типу станции
  const getStationColor = (station: Station) => {
    // Для динамических рекомендаций проверяем по ID или существованию поля has_land
    const isDynamicRecommendation = station.has_land !== undefined || 
                                   station.exist_text?.includes('Динамическая') ||
                                   station.exist_text?.includes('������������') ||
                                   (selectedScenario === "dynamic" && station.score !== undefined)
    
    if (isDynamicRecommendation) {
      // Проверяем has_land более внимательно 
      const hasLand = Boolean(station.has_land)
      const color = hasLand ? '#10B981' : '#EF4444' // Зеленый если есть земля, красный если нет
      console.log(`🎯 Dynamic Station ${station.id}:`, {
        has_land_raw: station.has_land,
        has_land_type: typeof station.has_land,
        has_land_parsed: hasLand,
        color: color,
        description: station.description,
        exist_text: station.exist_text
      })
      return color
    }
    
    switch (station.exist_text) {
      case 'Существует': return '#6B7280' // серый для существующих
      case 'Планируется 5': return '#3B82F6' // синий для +5
      case 'Планируется 16': return '#10B981' // зеленый для +16
      case 'Рекомендация': return '#EF4444' // красный для AI
      default: 
        return '#6B7280'
    }
  }

  // Создание маркеров станций
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // Удаляем старые маркеры
    markers.current.forEach(marker => {
      marker.remove()
    })
    markers.current = []

    // Фильтруем станции по выбранному району
    const safeStations = Array.isArray(stations) ? stations : []
    const filteredStations = selectedDistrict === "all" 
      ? safeStations 
      : safeStations.filter(station => station.district_id === parseInt(selectedDistrict))
      
    console.log(`Загружается ${filteredStations.length} станций для сценария ${selectedScenario}, район: ${selectedDistrict}`)
    
    // Отладка для динамических рекомендаций - проверим данные
    if (selectedScenario === "dynamic" && filteredStations.length > 0) {
      console.log("🔍 ПОДРОБНЫЕ ДАННЫЕ ДИНАМИЧЕСКИХ СТАНЦИЙ:")
      filteredStations.forEach((station, index) => {
        console.log(`Station ${index + 1}:`, {
          id: station.id,
          description: station.description,
          exist_text: station.exist_text,
          exist_text_type: typeof station.exist_text,
          has_land: station.has_land,
          has_land_type: typeof station.has_land,
          score: station.score,
          latitude: station.latitude,
          longitude: station.longitude
        })
      })
    }

    // Добавляем новые маркеры
    filteredStations.forEach(station => {
      const lat = parseFloat(station.latitude)
      const lng = parseFloat(station.longitude)
      
      if (isNaN(lat) || isNaN(lng)) {
        console.warn(`Неверные координаты для станции ${station.id}:`, station.latitude, station.longitude)
        return
      }

      // Создаем HTML элемент для маркера
      const el = document.createElement('div')
      el.className = 'fire-station-marker'
      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${getStationColor(station)};
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      `

      // Эффект hover - убираем transform чтобы точки не двигались
      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)'
      })
      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
      })

      // Обработчик клика для выбора станции
      el.addEventListener('click', () => {
        if (onStationSelect) {
          onStationSelect(station)
        }
      })

            // Исправляем кодировку для правильного отображения русского текста
      const cleanDescription = station.description?.includes('������������') 
        ? `Рекомендуемая станция ${station.id}` 
        : (station.description || 'Пожарная станция')
      
      const cleanExistText = station.exist_text?.includes('������������') 
        ? 'Динамическая рекомендация' 
        : (station.exist_text || 'Не указан')
      
      const cleanCaption = station.caption?.includes('������') 
        ? `Оценка: ${station.score?.toFixed(2) || 'N/A'}` 
        : station.caption

      // Создаем popup с правильным русским текстом
      const popupHTML = `
        <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
          <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 6px 0; color: #1f2937;">
            ${cleanDescription}
          </h3>
          ${cleanCaption ? `
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">
              ${cleanCaption}
            </p>
          ` : ''}
          <div style="font-size: 12px; line-height: 1.4;">
            <p style="margin: 4px 0;">
              <strong>Район:</strong> ${station.district_name || 'Неизвестно'}
            </p>
            <p style="margin: 4px 0;">
              <strong>Статус:</strong> 
              <span style="color: ${getStationColor(station)}; font-weight: 500;">
                ${cleanExistText}
              </span>
            </p>
            ${(station.has_land !== undefined || station.exist_text?.includes('Динамическая') || station.exist_text?.includes('������������') || (selectedScenario === "dynamic" && station.score !== undefined)) ? `
              <p style="margin: 6px 0 4px 0;">
                <strong>Тип:</strong> 
                <span style="color: ${station.has_land ? '#10b981' : '#ef4444'}; font-weight: 500;">
                  ${station.has_land ? 'Есть подходящая земля' : 'Нет земли, но высокий приоритет'}
                </span>
              </p>
              ${station.score ? `
                <p style="margin: 4px 0;">
                  <strong>Оценка приоритета:</strong> ${station.score.toFixed(2)}
                </p>
              ` : ''}
            ` : ''}
          </div>
        </div>
      `

      // Создаем маркер с popup
      const marker = new Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(
          new Popup({ 
            offset: 25,
            closeButton: true,
            closeOnClick: false,
            maxWidth: '300px'
          }).setHTML(popupHTML)
        )
      marker.addTo(map.current!)

      markers.current.push(marker)
    })

    // Добавляем маркеры транспортных инцидентов
    if (showTransportIncidents && transportIncidents.length > 0) {
      transportIncidents.forEach(incident => {
        if (isNaN(incident.latitude) || isNaN(incident.longitude)) {
          return
        }

        // Получаем цвет по причине инцидента
        const getIncidentColor = (cause: string) => {
          if (cause?.toLowerCase().includes('короткое замыкание') || cause?.toLowerCase().includes('кз')) {
            return '#EF4444' // красный для КЗ
          }
          if (cause?.toLowerCase().includes('дтп')) {
            return '#F59E0B' // оранжевый для ДТП
          }
          if (cause?.toLowerCase().includes('топливн')) {
            return '#FBBF24' // желтый для топливной системы
          }
          if (cause?.toLowerCase().includes('тормоз')) {
            return '#3B82F6' // синий для тормозов
          }
          return '#6B7280' // серый для прочих
        }

        // Получаем размер маркера по серьезности
        const getIncidentSize = (incident: TransportIncident) => {
          if (incident.deceased && parseInt(incident.deceased) > 0) return 16
          if (incident.injured && parseInt(incident.injured) > 0) return 14
          if (incident.was_fire) return 12
          return 10
        }

        // Создаем HTML элемент для маркера инцидента
        const el = document.createElement('div')
        el.className = 'transport-incident-marker'
        const size = getIncidentSize(incident)
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${getIncidentColor(incident.cause)};
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          opacity: 0.8;
          transition: all 0.2s ease;
        `

        // Эффект hover
        // el.addEventListener('mouseenter', () => {
        //   el.style.opacity = '1'
        //   el.style.transform = 'scale(1.2)'
        //   el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)'
        // })
        // el.addEventListener('mouseleave', () => {
        //   el.style.opacity = '0.8'
        //   el.style.transform = 'scale(1)'
        //   el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        // })
        
        // Стало (без scale):
        el.addEventListener('mouseenter', () => {
          el.style.opacity = '1'
          el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.opacity = '0.8'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        })
        // Создаем popup для инцидента
        const formatDate = (dateStr: string) => {
          try {
            return new Date(dateStr).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          } catch {
            return dateStr
          }
        }

        const currentYear = new Date().getFullYear()
        const vehicleAge = incident.year ? currentYear - parseInt(incident.year) : 'неизвестно'

        const popupHTML = `
          <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 220px;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #1f2937;">
              🚗 Инцидент с транспортом
            </h3>
            <div style="font-size: 12px; line-height: 1.4;">
              <p style="margin: 4px 0;">
                <strong>Тип:</strong> ${incident.transport_type || 'неизвестно'}
              </p>
              <p style="margin: 4px 0;">
                <strong>Марка:</strong> ${incident.brand || 'неизвестно'} ${incident.model || ''}
              </p>
              <p style="margin: 4px 0;">
                <strong>Год выпуска:</strong> ${incident.year || 'неизвестно'} 
                ${vehicleAge !== 'неизвестно' ? `(возраст: ${vehicleAge} лет)` : ''}
              </p>
              <p style="margin: 6px 0 4px 0;">
                <strong>Причина:</strong> 
                <span style="color: ${getIncidentColor(incident.cause)}; font-weight: 500;">
                  ${incident.cause || 'не указана'}
                </span>
              </p>
              <p style="margin: 4px 0;">
                <strong>Время:</strong> ${formatDate(incident.created_at)}
              </p>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 2px 0;">
                  <strong>Пожар:</strong> 
                  <span style="color: ${incident.was_fire ? '#ef4444' : '#6b7280'};">
                    ${incident.was_fire ? '🔥 Да' : '❌ Нет'}
                  </span>
                </p>
                ${incident.injured && parseInt(incident.injured) > 0 ? `
                  <p style="margin: 2px 0; color: #f59e0b;">
                    <strong>Пострадавшие:</strong> ${incident.injured}
                  </p>
                ` : ''}
                ${incident.deceased && parseInt(incident.deceased) > 0 ? `
                  <p style="margin: 2px 0; color: #ef4444;">
                    <strong>Погибшие:</strong> ${incident.deceased}
                  </p>
                ` : ''}
              </div>
            </div>
          </div>
        `

        // Создаем маркер инцидента
        const marker = new Marker({ element: el })
          .setLngLat([incident.longitude, incident.latitude])
          .setPopup(
            new Popup({ 
              offset: 15,
              closeButton: true,
              closeOnClick: false,
              maxWidth: '300px'
            }).setHTML(popupHTML)
          )
        marker.addTo(map.current!)

        markers.current.push(marker)
      })
    }

    // Добавляем маркеры инцидентов в зданиях
    if (showBuildingIncidents && buildingIncidents.length > 0) {
      buildingIncidents.forEach(incident => {
        if (isNaN(incident.latitude) || isNaN(incident.longitude)) {
          return
        }

        // Получаем цвет по типу здания
        const getBuildingColor = (buildingType: string) => {
          if (buildingType?.includes('Жилые')) {
            return '#3B82F6' // синий для жилых
          }
          if (buildingType?.includes('Административные')) {
            return '#10B981' // зеленый для административных
          }
          if (buildingType?.includes('Производственные')) {
            return '#EF4444' // красный для производственных
          }
          if (buildingType?.includes('Торговые')) {
            return '#F59E0B' // оранжевый для торговых
          }
          if (buildingType?.includes('Образовательные')) {
            return '#8B5CF6' // фиолетовый для образовательных
          }
          if (buildingType?.includes('Медицинские')) {
            return '#EC4899' // розовый для медицинских
          }
          if (buildingType?.includes('Культурные')) {
            return '#06B6D4' // голубой для культурных
          }
          return '#6B7280' // серый для прочих
        }

        // Получаем размер маркера по уровню ущерба
        const getBuildingSize = (incident: BuildingIncident) => {
          if (incident.damage_level === 'Полное уничтожение') return 18
          if (incident.damage_level === 'Значительные повреждения') return 16
          if (incident.damage_level === 'Частичные повреждения') return 14
          if (incident.damage_level === 'Задымление') return 12
          return 10 // Без ущерба
        }

        // Создаем HTML элемент для маркера здания
        const el = document.createElement('div')
        el.className = 'building-incident-marker'
        const size = getBuildingSize(incident)
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          border-radius: 15%;
          background-color: ${getBuildingColor(incident.building_type)};
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
          opacity: 0.85;
          transition: all 0.2s ease;
        `

        // Эффект hover без изменения размера
        el.addEventListener('mouseenter', () => {
          el.style.opacity = '1'
          el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.opacity = '0.85'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        })

        // Создаем popup для инцидента в здании
        const formatDate = (dateStr: string) => {
          try {
            return new Date(dateStr).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          } catch {
            return dateStr
          }
        }

        const popupHTML = `
          <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 220px;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #1f2937;">
              🏢 Инцидент в здании
            </h3>
            <div style="font-size: 12px; line-height: 1.4;">
              <p style="margin: 4px 0;">
                <strong>Тип здания:</strong> ${incident.building_type || 'неизвестно'}
              </p>
              <p style="margin: 4px 0;">
                <strong>Этажность:</strong> ${incident.floors || 'неизвестно'} этажей
              </p>
              <p style="margin: 6px 0 4px 0;">
                <strong>Причина:</strong> 
                <span style="color: ${getBuildingColor(incident.building_type)}; font-weight: 500;">
                  ${incident.cause || 'не указана'}
                </span>
              </p>
              <p style="margin: 4px 0;">
                <strong>Уровень ущерба:</strong> 
                <span style="color: ${incident.damage_level === 'Полное уничтожение' ? '#ef4444' : 
                                     incident.damage_level === 'Значительные повреждения' ? '#f59e0b' :
                                     incident.damage_level === 'Частичные повреждения' ? '#eab308' : 
                                     incident.damage_level === 'Задымление' ? '#6b7280' : '#10b981'};">
                  ${incident.damage_level || 'неизвестно'}
                </span>
              </p>
              <p style="margin: 4px 0;">
                <strong>Время:</strong> ${formatDate(incident.created_at)}
              </p>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 2px 0;">
                  <strong>Пожар:</strong> 
                  <span style="color: ${incident.was_fire ? '#ef4444' : '#6b7280'};">
                    ${incident.was_fire ? '🔥 Да' : '❌ Нет'}
                  </span>
                </p>
                ${incident.injured && parseInt(incident.injured) > 0 ? `
                  <p style="margin: 2px 0; color: #f59e0b;">
                    <strong>Пострадавшие:</strong> ${incident.injured}
                  </p>
                ` : ''}
                ${incident.deceased && parseInt(incident.deceased) > 0 ? `
                  <p style="margin: 2px 0; color: #ef4444;">
                    <strong>Погибшие:</strong> ${incident.deceased}
                  </p>
                ` : ''}
              </div>
            </div>
          </div>
        `

        // Создаем маркер инцидента в здании
        const marker = new Marker({ element: el })
          .setLngLat([incident.longitude, incident.latitude])
          .setPopup(
            new Popup({ 
              offset: 15,
              closeButton: true,
              closeOnClick: false,
              maxWidth: '300px'
            }).setHTML(popupHTML)
          )
        marker.addTo(map.current!)

        markers.current.push(marker)
      })
    }

    // Добавляем маркеры для инцидентов помощи
    if (helpIncidents && helpIncidents.length > 0) {
      helpIncidents.forEach(incident => {
        const getHelpColor = (helpType: string) => {
          const type = helpType?.toLowerCase() || ''
          if (type.includes('утечка') || type.includes('газ')) return '#f59e0b'  // оранжевый
          if (type.includes('дтп') || type.includes('авария')) return '#ef4444'  // красный
          if (type.includes('взрыв') || type.includes('угроза')) return '#dc2626'  // темно-красный
          if (type.includes('спасение') || type.includes('помощь')) return '#10b981'  // зеленый
          return '#ec4899'  // розовый по умолчанию
        }

        const el = document.createElement('div')
        el.className = 'help-incident-marker'
        el.style.cssText = `
          width: 20px;
          height: 20px;
          background: ${getHelpColor(incident.help_type)};
          border: 2px solid #ffffff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          opacity: 0.85;
          transition: all 0.2s ease;
          position: relative;
        `

        // Добавляем иконку помощи
        el.innerHTML = `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">🆘</div>
        `

        el.addEventListener('mouseenter', () => {
          el.style.opacity = '1'
          el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)'
        })

        el.addEventListener('mouseleave', () => {
          el.style.opacity = '0.85'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        })

        const formatDate = (dateStr: string) => {
          try {
            return new Date(dateStr).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          } catch {
            return dateStr
          }
        }

        const popupHTML = `
          <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 220px;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #1f2937;">
              🆘 Вызов помощи
            </h3>
            <div style="font-size: 12px; line-height: 1.4;">
              <p style="margin: 4px 0;">
                <strong>Тип:</strong> ${incident.help_type || 'неизвестно'}
              </p>
              <p style="margin: 4px 0;">
                <strong>Место:</strong> ${incident.location || 'неизвестно'}
              </p>
              <p style="margin: 4px 0;">
                <strong>Помощь:</strong> 
                <span style="color: #ec4899; font-weight: 500;">
                  ${incident.assistance_type || 'не указано'}
                </span>
              </p>
              <p style="margin: 4px 0;">
                <strong>Время:</strong> ${formatDate(incident.created_at)}
              </p>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                ${incident.injured && parseInt(incident.injured) > 0 ? `
                  <p style="margin: 2px 0; color: #f59e0b;">
                    <strong>Пострадавшие:</strong> ${incident.injured}
                  </p>
                ` : ''}
              </div>
            </div>
          </div>
        `

        const marker = new Marker({ element: el })
          .setLngLat([incident.longitude, incident.latitude])
          .setPopup(
            new Popup({ 
              offset: 15,
              closeButton: true,
              closeOnClick: false,
              maxWidth: '300px'
            }).setHTML(popupHTML)
          )
        marker.addTo(map.current!)
        markers.current.push(marker)
      })
    }

    // Добавляем маркеры для инцидентов бдительности граждан
    if (vigilanceIncidents && vigilanceIncidents.length > 0) {
      vigilanceIncidents.forEach(incident => {
        const el = document.createElement('div')
        el.className = 'vigilance-incident-marker'
        el.style.cssText = `
          width: 20px;
          height: 20px;
          background: #8b5cf6;
          border: 2px solid #ffffff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          opacity: 0.85;
          transition: all 0.2s ease;
          position: relative;
        `

        // Добавляем иконку предупреждения
        el.innerHTML = `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">⚠️</div>
        `

        el.addEventListener('mouseenter', () => {
          el.style.opacity = '1'
          el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)'
        })

        el.addEventListener('mouseleave', () => {
          el.style.opacity = '0.85'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        })

        const formatDate = (dateStr: string) => {
          try {
            return new Date(dateStr).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          } catch {
            return dateStr
          }
        }

        const popupHTML = `
          <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 220px;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #1f2937;">
              ⚠️ Бдительность граждан
            </h3>
            <div style="font-size: 12px; line-height: 1.4;">
              <p style="margin: 4px 0;">
                <strong>Причина:</strong> ${incident.reason || 'неизвестно'}
              </p>
              <p style="margin: 4px 0;">
                <strong>Источник:</strong> ${incident.source || 'неизвестно'}
              </p>
              <p style="margin: 4px 0;">
                <strong>Район:</strong> 
                <span style="color: #8b5cf6; font-weight: 500;">
                  ${incident.district || 'не указан'}
                </span>
              </p>
              <p style="margin: 4px 0;">
                <strong>Время:</strong> ${formatDate(incident.created_at)}
              </p>
            </div>
          </div>
        `

        const marker = new Marker({ element: el })
          .setLngLat([incident.longitude, incident.latitude])
          .setPopup(
            new Popup({ 
              offset: 15,
              closeButton: true,
              closeOnClick: false,
              maxWidth: '300px'
            }).setHTML(popupHTML)
          )
        marker.addTo(map.current!)
        markers.current.push(marker)
      })
    }

    // Добавляем маркеры для инцидентов с сухостоем и мусором
    if (dryGrassIncidents && dryGrassIncidents.length > 0) {
      dryGrassIncidents.forEach(incident => {
        const getGrassColor = (grassType: string) => {
          // Приводим к нижнему регистру для более точного сравнения
          const type = grassType?.toLowerCase() || ''
          if (type.includes('мусор')) return '#6b7280'  // серый
          if (type.includes('сухой') || type.includes('сухостой')) return '#f59e0b'  // оранжевый
          if (type.includes('трава')) return '#eab308'  // желтый
          return '#84cc16'  // зеленый по умолчанию
        }

        const el = document.createElement('div')
        el.className = 'drygrass-incident-marker'
        el.style.cssText = `
          width: 20px;
          height: 20px;
          background: ${getGrassColor(incident.grass_type)};
          border: 2px solid #ffffff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          opacity: 0.85;
          transition: all 0.2s ease;
          position: relative;
        `

        // Добавляем иконку дерева/травы
        el.innerHTML = `
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 10px;
            font-weight: bold;
          ">🌿</div>
        `

        el.addEventListener('mouseenter', () => {
          el.style.opacity = '1'
          el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)'
        })

        el.addEventListener('mouseleave', () => {
          el.style.opacity = '0.85'
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
        })

        const formatDate = (dateStr: string) => {
          try {
            return new Date(dateStr).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          } catch {
            return dateStr
          }
        }

        const popupHTML = `
          <div style="padding: 12px; font-family: system-ui, -apple-system, sans-serif; min-width: 220px;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #1f2937;">
              🌿 Пожар растительности
            </h3>
            <div style="font-size: 12px; line-height: 1.4;">
              <p style="margin: 4px 0;">
                <strong>Тип:</strong> ${incident.grass_type || 'неизвестно'}
              </p>
              <p style="margin: 4px 0;">
                <strong>Место:</strong> ${incident.location || 'неизвестно'}
              </p>
              <p style="margin: 4px 0;">
                <strong>Причина:</strong> 
                <span style="color: ${getGrassColor(incident.grass_type)}; font-weight: 500;">
                  ${incident.cause || 'не указана'}
                </span>
              </p>
              <p style="margin: 4px 0;">
                <strong>Площадь:</strong> ${incident.area || 'неизвестно'} м²
              </p>
              <p style="margin: 4px 0;">
                <strong>Время:</strong> ${formatDate(incident.created_at)}
              </p>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 2px 0;">
                  <strong>Пожар:</strong> 
                  <span style="color: ${incident.was_fire ? '#ef4444' : '#6b7280'};">
                    ${incident.was_fire ? '🔥 Да' : '❌ Нет'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        `

        const marker = new Marker({ element: el })
          .setLngLat([incident.longitude, incident.latitude])
          .setPopup(
            new Popup({ 
              offset: 15,
              closeButton: true,
              closeOnClick: false,
              maxWidth: '300px'
            }).setHTML(popupHTML)
          )
        marker.addTo(map.current!)
        markers.current.push(marker)
      })
    }

  }, [stations, mapLoaded, selectedScenario, selectedDistrict, transportIncidents, showTransportIncidents, buildingIncidents, showBuildingIncidents, helpIncidents, vigilanceIncidents, dryGrassIncidents])

  // Добавление базового слоя грида (планируется 5) - всегда отображается первым слоем
  useEffect(() => {
    if (!map.current || !mapLoaded || !baseCoverageGrids || baseCoverageGrids.length === 0) return

    const baseSourceId = 'base-coverage-grids'
    const baseLayerId = 'base-coverage-grids-layer'
    const baseOutlineLayerId = baseLayerId + '-outline'

    // Удаляем существующие базовые слои
    if (map.current.getLayer(baseOutlineLayerId)) {
      map.current.removeLayer(baseOutlineLayerId)
    }
    if (map.current.getLayer(baseLayerId)) {
      map.current.removeLayer(baseLayerId)
    }
    if (map.current.getSource(baseSourceId)) {
      map.current.removeSource(baseSourceId)
    }

    if (!showCoverageZones || !baseCoverageGrids || baseCoverageGrids.length === 0) return
    
    // Показываем базовый слой только для динамических рекомендаций по умолчанию
    if (selectedScenario !== "dynamic") return

    try {
      // Фильтруем базовые зоны по выбранному району
      const filteredBaseGrids = selectedDistrict === "all" 
        ? baseCoverageGrids 
        : baseCoverageGrids.filter(grid => grid.district_id === parseInt(selectedDistrict))

      console.log(`Загружается базовый слой: ${filteredBaseGrids.length} гридов (планируется 5)`)

      // Преобразуем WKT геометрии в GeoJSON
      const baseFeatures = filteredBaseGrids
        .filter(grid => grid.geometry && grid.color)
        .map(grid => {
          try {
            const geometry = wellknown.parse(grid.geometry)
            if (!geometry) return null
            
            return {
              type: 'Feature' as const,
              geometry,
              properties: {
                district_id: grid.district_id,
                color: grid.color,
                population: grid.population,
                fire_count: grid.fire_count,
                layer_type: 'base',
                scenario: 'planned5'
              }
            }
          } catch (error) {
            console.warn('Ошибка парсинга базового WKT:', error)
            return null
          }
        })
        .filter((feature): feature is NonNullable<typeof feature> => feature !== null)

      if (baseFeatures.length === 0) return

      const baseGeojsonData = {
        type: 'FeatureCollection' as const,
        features: baseFeatures
      }

      // Добавляем источник базовых данных
      map.current.addSource(baseSourceId, {
        type: 'geojson',
        data: baseGeojsonData
      })

      // Добавляем базовый слой полигонов (более прозрачный)
      map.current.addLayer({
        id: baseLayerId,
        type: 'fill',
        source: baseSourceId,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'color'], 'green'], '#10B981',
            ['==', ['get', 'color'], 'orange'], '#F59E0B', 
            ['==', ['get', 'color'], 'red'], '#EF4444',
            ['==', ['get', 'color'], 'blue'], '#3B82F6',
            '#6B7280' // серый по умолчанию
          ],
          'fill-opacity': 0.25 // Более прозрачный базовый слой
        }
      })

      // Добавляем контуры базового слоя
      map.current.addLayer({
        id: baseOutlineLayerId,
        type: 'line',
        source: baseSourceId,
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.3,
          'line-opacity': 0.4
        }
      })

      // Добавляем всплывающие подсказки для базового слоя
      map.current.on('click', baseLayerId, (e) => {
        if (!e.features || !e.features[0]) return
        
        const feature = e.features[0]
        const props = feature.properties
        
        const colorMap = {
          'green': 'Зеленая зона (≤5 мин)',
          'orange': 'Оранжевая зона (5-10 мин)',
          'red': 'Красная зона (>10 мин)',
          'blue': 'Синяя зона (станция)'
        } as const
        const colorText = colorMap[props?.color as keyof typeof colorMap] || 'Неизвестно'

        new Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-sm">Базовое покрытие (Планируется +5)</h3>
              <p class="text-xs"><span class="font-medium">Тип:</span> ${colorText}</p>
              <p class="text-xs"><span class="font-medium">Район:</span> ${props?.district_id || 'Н/Д'}</p>
              <p class="text-xs"><span class="font-medium">Население:</span> ${props?.population || 'Н/Д'}</p>
              <p class="text-xs"><span class="font-medium">Пожары:</span> ${props?.fire_count || 'Н/Д'}</p>
            </div>
          `)
          .addTo(map.current!)
      })

      // Курсор pointer при наведении на базовый слой
      map.current.on('mouseenter', baseLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', baseLayerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = ''
      })

      console.log(`Добавлен базовый слой грида: ${baseFeatures.length} элементов`)

    } catch (error) {
      console.error('Ошибка добавления базового слоя покрытия:', error)
    }
    
  }, [baseCoverageGrids, mapLoaded, selectedDistrict, showCoverageZones])

  // Добавление зон покрытия из WKT геометрии (основной слой)
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    const sourceId = 'coverage-grids'
    const layerId = 'coverage-grids-layer'
    const outlineLayerId = layerId + '-outline'

    // Удаляем существующие слои и источники
    if (map.current.getLayer(outlineLayerId)) {
      map.current.removeLayer(outlineLayerId)
    }
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId)
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId)
    }

    if (!showCoverageZones || !coverageGrids || coverageGrids.length === 0) return

    // Фильтруем зоны покрытия по выбранному району
    const filteredCoverageGrids = selectedDistrict === "all" 
      ? coverageGrids 
      : coverageGrids.filter(grid => grid.district_id === parseInt(selectedDistrict))
      
    console.log(`Загружается ${filteredCoverageGrids.length} гридов для сценария ${selectedScenario}, район: ${selectedDistrict}`)

    try {
      // Преобразуем WKT геометрии в GeoJSON
      const features = filteredCoverageGrids
        .filter(grid => grid.geometry && grid.color)
        .map(grid => {
          try {
            const geometry = wellknown.parse(grid.geometry)
            if (!geometry) return null
            
            return {
              type: 'Feature' as const,
              geometry,
              properties: {
                district_id: grid.district_id,
                color: grid.color,
                population: grid.population,
                fire_count: grid.fire_count
              }
            }
          } catch (error) {
            console.warn('Ошибка парсинга WKT:', error)
            return null
          }
        })
        .filter((feature): feature is NonNullable<typeof feature> => feature !== null)

      if (features.length === 0) return

      const geojsonData = {
        type: 'FeatureCollection' as const,
        features
      }

      // Добавляем источник данных
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData
      })

      // Добавляем слой полигонов с цветовой схемой
      map.current.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'color'], 'green'], '#10B981',
            ['==', ['get', 'color'], 'orange'], '#F59E0B', 
            ['==', ['get', 'color'], 'red'], '#EF4444',
            ['==', ['get', 'color'], 'blue'], '#3B82F6',
            '#6B7280' // серый по умолчанию
          ],
          'fill-opacity': 0.6
        }
      })

      // Добавляем контуры
      map.current.addLayer({
        id: layerId + '-outline',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.5,
          'line-opacity': 0.8
        }
      })

      // Добавляем всплывающие подсказки
      map.current.on('click', layerId, (e) => {
        if (!e.features || !e.features[0]) return
        
        const feature = e.features[0]
        const props = feature.properties
        
        const colorMap = {
          'green': 'Зеленая зона (≤5 мин)',
          'orange': 'Оранжевая зона (5-10 мин)',
          'red': 'Красная зона (>10 мин)',
          'blue': 'Синяя зона (станция)'
        } as const
        const colorText = colorMap[props?.color as keyof typeof colorMap] || 'Неизвестно'

        // Получаем название сценария для отображения
        const getScenarioTitle = (scenario: string) => {
          switch (scenario) {
            case 'current': return 'Текущее состояние'
            case 'planned5': return 'Планируется +5'
            case 'planned16': return 'Планируется +16'
            case 'aiRecommended': return 'AI Рекомендации'
            case 'dynamic': return 'Динамические рекомендации'
            default: return 'Зона покрытия'
          }
        }

        new Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-sm">${getScenarioTitle(selectedScenario)}</h3>
              <p class="text-xs"><span class="font-medium">Тип:</span> ${colorText}</p>
              <p class="text-xs"><span class="font-medium">Район:</span> ${props?.district_id || 'Н/Д'}</p>
              <p class="text-xs"><span class="font-medium">Население:</span> ${props?.population || 'Н/Д'}</p>
              <p class="text-xs"><span class="font-medium">Пожары:</span> ${props?.fire_count || 'Н/Д'}</p>
            </div>
          `)
          .addTo(map.current!)
      })

      // Курсор pointer при наведении
      map.current.on('mouseenter', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', layerId, () => {
        if (map.current) map.current.getCanvas().style.cursor = ''
      })

    } catch (error) {
      console.error('Ошибка добавления зон покрытия:', error)
    }
    
  }, [coverageGrids, mapLoaded, showCoverageZones, selectedScenario, selectedDistrict])

  const getScenarioDisplayName = (scenario: string) => {
    switch (scenario) {
      case 'current': return 'Текущее состояние'
      case 'planned5': return 'Планируется +5'
      case 'planned16': return 'Планируется +16'
      case 'aiRecommended': return 'AI Рекомендации'
      case 'dynamic': return '🔬 Динамические рекомендации'
      default: return scenario
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* Карта */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Элементы управления */}
      <div className="absolute top-4 left-4 space-y-2">
        {/* Информация о сценарии */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <div className="flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">{getScenarioDisplayName(selectedScenario)}</span>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {(() => {
              const safeStations = Array.isArray(stations) ? stations : [];
              return selectedDistrict === "all" ? safeStations.length : safeStations.filter(s => s.district_id === parseInt(selectedDistrict)).length;
            })()} станций
          </div>
        </div>

        {/* Переключатель 2D/3D */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <Button
            onClick={toggle3D}
            variant={is3D ? "default" : "ghost"}
            size="sm"
            className="w-full flex items-center gap-2"
          >
            {is3D ? <Box className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
            {is3D ? '3D Режим' : '2D Режим'}
          </Button>
        </div>

        {/* Сброс вида */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg border">
          <Button
            onClick={resetView}
            variant="ghost"
            size="sm"
            className="w-full flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Центр Алматы
          </Button>
        </div>
      </div>

      {/* Легенда */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs">
        <h4 className="text-sm font-medium mb-2">Легенда станций:</h4>
        <div className="space-y-1 text-xs mb-3">
          {(() => {
            const safeStations = Array.isArray(stations) ? stations : [];
            const existing = safeStations.filter(s => s.exist_text === 'Существует');
            const planned5 = safeStations.filter(s => s.exist_text === 'Планируется 5');
            const planned16 = safeStations.filter(s => s.exist_text === 'Планируется 16');
            const recommendations = safeStations.filter(s => s.exist_text === 'Рекомендация');
            const dynamic = safeStations.filter(s => s.exist_text === 'Динамическая рекомендация');
            const dynamicWithLand = dynamic.filter(s => s.has_land === true);
            const dynamicWithoutLand = dynamic.filter(s => s.has_land === false);
            
            return (
              <>
                {existing.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500 border border-white"></div>
                    <span>Существующие ({existing.length})</span>
                  </div>
                )}
                {planned5.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                    <span>Планируется +5 ({planned5.length})</span>
                  </div>
                )}
                {planned16.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                    <span>Планируется +16 ({planned16.length})</span>
                  </div>
                )}
                {recommendations.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                      <span>AI Рекомендации ({recommendations.length})</span>
                    </div>
                    <div className="text-xs text-gray-500 pl-5">
                      20 текущих + 5 утвержденных + 10 рекомендуемых
                    </div>
                  </div>
                )}
                {dynamic.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>
                      <span>С землей ({dynamicWithLand.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>
                      <span>Нет земли, но высокий приоритет ({dynamicWithoutLand.length})</span>
                    </div>
                  </>
                )}
              </>
            );
          })()}
        </div>
        
        <div className="border-t pt-2">
          <h4 className="text-sm font-medium mb-2">Зоны покрытия:</h4>
          <div className="space-y-1 text-xs mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 opacity-60 border border-white"></div>
              <span>≤ 5 минут</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 opacity-60 border border-white"></div>
              <span>5-10 минут</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 opacity-60 border border-white"></div>
              <span>&gt;10 минут</span>
            </div>
          </div>
        </div>
      </div>

      {/* Статус загрузки */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-600">Загрузка карты...</p>
          </div>
        </div>
      )}
    </div>
  )
} 