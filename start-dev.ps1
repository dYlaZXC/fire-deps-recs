# Скрипт быстрого запуска с оптимизациями
Write-Host "🚀 Запуск оптимизированного dev сервера..." -ForegroundColor Green

# Останавливаем все процессы Node.js
Write-Host "⏹️  Останавливаем предыдущие процессы..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null

# Очищаем кэш если нужно
if (Test-Path ".next") {
    Write-Host "🧹 Очищаем кэш..." -ForegroundColor Yellow
    Remove-Item .next -Recurse -Force
}

# Устанавливаем переменные окружения для оптимизации
$env:NEXT_TELEMETRY_DISABLED = 1
$env:WATCHPACK_POLLING = 'true'
$env:DISABLE_ESLINT_PLUGIN = 'true'
$env:FAST_REFRESH = 'true'

Write-Host "✅ Запускаем сервер..." -ForegroundColor Green
npm run dev 