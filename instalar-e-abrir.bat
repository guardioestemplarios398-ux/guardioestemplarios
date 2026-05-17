@echo off
setlocal
cls
echo ======================================================
echo   GUARDIOES TEMPLARIOS CHECK-IN - INSTALAR E ABRIR
echo ======================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale o Node.js LTS e tente novamente.
  pause
  exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERRO] NPM nao encontrado.
  pause
  exit /b 1
)

echo [1/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
  echo [ERRO] Falha ao instalar dependencias.
  pause
  exit /b 1
)

echo.
echo [2/3] Verificando arquivo .env...
if not exist .env (
  copy .env.example .env >nul
  echo [OK] Arquivo .env criado a partir do .env.example.
) else (
  echo [OK] Arquivo .env encontrado.
)

echo.
echo [3/3] Abrindo sistema local...
echo.
echo URL publica local: http://localhost:5173/checkin/checkin-diario-templo
echo Login admin: http://localhost:5173/admin/login
echo.
start http://localhost:5173/admin/login
call npm run dev
pause
