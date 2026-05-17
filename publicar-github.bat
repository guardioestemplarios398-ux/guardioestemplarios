@echo off
setlocal
cls
echo ======================================================
echo   GUARDIOES TEMPLARIOS CHECK-IN - PUBLICAR NO GITHUB
echo ======================================================
echo.

echo Informe a URL do repositorio GitHub.
echo Exemplo: https://github.com/SEU-USUARIO/guardioes-templarios-checkin.git
echo.
set /p REPO_URL=URL do repositorio: 

if "%REPO_URL%"=="" (
  echo [ERRO] URL do repositorio nao informada.
  pause
  exit /b 1
)

where git >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERRO] Git nao encontrado. Instale o Git e tente novamente.
  pause
  exit /b 1
)

echo.
echo [1/6] Inicializando Git...
if not exist .git (
  git init
)

echo [2/6] Configurando branch main...
git branch -M main

echo [3/6] Removendo remote antigo, se existir...
git remote remove origin >nul 2>nul

echo [4/6] Adicionando remote...
git remote add origin %REPO_URL%

echo [5/6] Criando commit...
git add .
git commit -m "primeira versao guardioes templarios checkin"

echo [6/6] Enviando para GitHub...
git push -u origin main

echo.
echo ======================================================
echo   PUBLICACAO FINALIZADA
echo ======================================================
pause
