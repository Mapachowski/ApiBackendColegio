@echo off
echo ====================================
echo Creando tunel SSH al droplet
echo ====================================
echo.
echo Puerto local: 3307
echo Puerto remoto: 3306 (MySQL en droplet)
echo Presiona Ctrl+C para cerrar el tunel
echo.
echo Conectando usando configuracion SSH...
ssh colegio-db -N
