@echo off
REM ===============================================
REM BigMaterials Catalog Plugin - Packager
REM Creates .ccx file for distribution
REM ===============================================

echo.
echo ========================================
echo BigMaterials Plugin Packager
echo ========================================
echo.

REM Set variables
set PLUGIN_FOLDER=indesign-plugin
set TEMP_ZIP=temp-plugin.zip
set OUTPUT_FILE=BigMaterials-Catalog-Generator-v1.0.0.ccx

echo [1/3] Verificando archivos del plugin...
if not exist "%PLUGIN_FOLDER%\manifest.json" (
    echo ERROR: No se encontro manifest.json
    pause
    exit /b 1
)

echo [2/3] Creando archivo ZIP temporal...
REM Crear ZIP primero
cd /d "%~dp0%PLUGIN_FOLDER%"
powershell -Command "Compress-Archive -Path * -DestinationPath ..\%TEMP_ZIP% -Force"
cd ..

REM Renombrar de .zip a .ccx
if exist "%TEMP_ZIP%" (
    if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"
    ren "%TEMP_ZIP%" "%OUTPUT_FILE%"
    echo Archivo renombrado a .ccx
) else (
    echo ERROR: No se pudo crear el archivo ZIP
    pause
    exit /b 1
)

echo [3/3] Verificando archivo creado...
if exist "%OUTPUT_FILE%" (
    echo.
    echo ========================================
    echo EXITO! Plugin empaquetado
    echo ========================================
    echo.
    echo Archivo creado: %OUTPUT_FILE%
    echo Tamano: 
    for %%A in ("%OUTPUT_FILE%") do echo %%~zA bytes
    echo.
    echo Para instalar:
    echo 1. Doble click en %OUTPUT_FILE%
    echo 2. Adobe Creative Cloud se abrira
    echo 3. Click "Install"
    echo.
) else (
    echo ERROR: No se pudo crear el archivo .ccx
    pause
    exit /b 1
)

pause
