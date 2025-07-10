import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Извлекаем параметры из запроса
    const {
      landFilters = {},
      algorithmSettings = {},
      selectedDistrict = 'all',
      existingStations = []
    } = body

    console.log('Получен запрос на генерацию рекомендаций:', {
      landFilters,
      algorithmSettings,
      selectedDistrict
    })

    // Создаем конфигурацию для Python скрипта
    const config = {
      lands_file: join(process.cwd(), 'gos_lands_in_buffer_2.json'),
      unified_file: join(process.cwd(), 'dchs_unified_coverage.xlsx'),
      filters: {
        ownership_type: landFilters.ownership || 'all',
        min_area: landFilters.min_area || 500,
        purpose: landFilters.purpose || 'all',
        custom_purpose: body.customPurpose || '',
        min_lease_year: landFilters.min_lease_year
      },
      num_stations: algorithmSettings.num_stations || 5,
      coverage_radius: algorithmSettings.coverage_radius || 2200,
      selected_district: selectedDistrict,
      existing_stations: existingStations
    }

    // Пути для временных файлов
    const configPath = join(process.cwd(), 'temp_config.json')
    const outputPath = join(process.cwd(), 'temp_recommendations.json')

    // Записываем конфигурацию в файл
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')

    // Запускаем Python скрипт v3.0 с продвинутым алгоритмом
    const pythonScript = join(process.cwd(), 'lands_recommendation_v3.py')
    
    console.log('Запуск Python скрипта:', {
      script: pythonScript,
      config: configPath,
      output: outputPath
    })

    const pythonProcess = spawn('python', [
      pythonScript,
      '--config', configPath,
      '--output', outputPath
    ], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONLEGACYWINDOWSSTDIO: '1'
      }
    })

    // Собираем вывод процесса
    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    // Ждем завершения процесса
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve)
    })

    console.log('Python скрипт завершен:', {
      exitCode,
      stdout: stdout.substring(0, 500),
      stderr: stderr.substring(0, 500)
    })

    // Читаем результат
    let result
    try {
      const resultText = readFileSync(outputPath, 'utf-8')
      result = JSON.parse(resultText)
    } catch (error) {
      console.error('Ошибка чтения результата:', error)
      throw new Error(`Не удалось прочитать результат: ${error}`)
    }

    // Очищаем временные файлы
    try {
      unlinkSync(configPath)
      unlinkSync(outputPath)
    } catch (error) {
      console.warn('Не удалось удалить временные файлы:', error)
    }

    if (exitCode !== 0) {
      console.error('Python скрипт завершился с ошибкой:', { exitCode, stderr })
      throw new Error(`Python скрипт завершился с кодом ${exitCode}: ${stderr}`)
    }

    if (!result.success) {
      console.error('Python скрипт вернул ошибку:', result.error)
      throw new Error(result.error || 'Неизвестная ошибка в Python скрипте')
    }

    console.log('Рекомендации успешно сгенерированы:', {
      totalRecommendations: result.stations?.length || 0,
      withLand: result.metadata?.with_land || 0,
      withoutLand: result.metadata?.without_land || 0
    })

    // Форматируем результат для фронтенда
    const formattedResult = {
      success: true,
      stations: result.stations || [],
      metadata: {
        generated_at: new Date().toISOString(),
        total_recommendations: result.stations?.length || 0,
        with_suitable_land: result.metadata?.with_land || 0,
        requires_land_purchase: result.metadata?.without_land || 0,
        filters_applied: config.filters,
        algorithm_settings: {
          num_stations: config.num_stations,
          coverage_radius: config.coverage_radius,
          algorithm_version: result.metadata?.algorithm_version || '3.0'
        }
      }
    }

    return NextResponse.json(formattedResult)

  } catch (error: any) {
    console.error('Ошибка в API генерации рекомендаций:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Внутренняя ошибка сервера',
      stations: []
    }, { status: 500 })
  }
} 