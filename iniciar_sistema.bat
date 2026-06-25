@echo off
chcp 65001 > nul
title Iniciar Sistema de Compras en Red

echo ===================================================
echo        INICIANDO SISTEMA DE COMPRAS EN RED
echo ===================================================
echo.

:: Detectar IP actual y actualizar archivos .env dinamicamente
echo Detectando IP local y actualizando configuracion...
powershell -Command "$ip = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object {$_.AddressFamily -eq 'InterNetwork'} | Select-Object -First 1 -ExpandProperty IPAddressToString; echo \"IP Detectada: $ip\"; if (Test-Path 'compras-backend-node-master\.env') { (Get-Content 'compras-backend-node-master\.env' -Raw) -replace 'http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:5173', \"http://$ip:5173\" | Set-Content 'compras-backend-node-master\.env' }; if (Test-Path 'sistemacompras_frontend-main\.env') { (Get-Content 'sistemacompras_frontend-main\.env' -Raw) -replace 'http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:4000', \"http://$ip:4000\" | Set-Content 'sistemacompras_frontend-main\.env' }"

echo.
echo [1/2] Iniciando Backend en segundo plano...
start "Backend - Compras" cmd /k "cd compras-backend-node-master && npm run dev"

echo [2/2] Iniciando Frontend en segundo plano...
start "Frontend - Compras" cmd /k "cd sistemacompras_frontend-main && npm run dev"

echo.
echo ===================================================
echo   ¡TODO LISTO!
echo ===================================================
echo.
echo El backend esta corriendo en el puerto 4000.
echo El frontend esta corriendo en el puerto 5173.
echo.
echo Podes acceder desde esta maquina en:
echo   http://localhost:5173
echo.
echo Desde otras maquinas de la red local, ingresa a:
powershell -Command "$ip = [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object {$_.AddressFamily -eq 'InterNetwork'} | Select-Object -First 1 -ExpandProperty IPAddressToString; echo \"  http://$ip:5173\""
echo.
echo (Asegurate de que PostgreSQL este corriendo en tu PC).
echo.
pause
