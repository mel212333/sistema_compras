@echo off
echo ===================================================
echo   Importando Base de Datos: compras_nueva.sql
echo ===================================================
echo.

set PSQL_PATH="C:\Program Files\PostgreSQL\18\bin\psql.exe"

if not exist %PSQL_PATH% (
    echo [ERROR] No se encontro psql.exe en %PSQL_PATH%
    echo Edita este archivo con la ruta correcta a psql.exe.
    pause
    exit /b
)

:: Pedir contraseña de forma dinámica
set /p PGPASSWORD="Introduce la contrasena de tu usuario 'postgres' de PostgreSQL: "

echo.
echo 1. Creando base de datos 'compras' si no existe...
%PSQL_PATH% -U postgres -h localhost -c "CREATE DATABASE compras;" 2>nul

echo 2. Importando archivo SQL 'compras_nueva.sql'...
%PSQL_PATH% -U postgres -h localhost -d compras -f "..\compras_nueva.sql"

if %errorlevel% equ 0 (
    echo.
    echo [OK] Base de datos importada exitosamente en 'compras'.
) else (
    echo.
    echo [ERROR] Hubo un error al importar. Verifica que la contrasena ingresada sea la correcta.
)

pause
