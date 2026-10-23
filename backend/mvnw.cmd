@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup script for Windows
@REM ----------------------------------------------------------------------------

@echo off
@setlocal EnableExtensions EnableDelayedExpansion

if not "%JAVA_HOME%"=="" (
    set "JAVACMD=%JAVA_HOME%\bin\java.exe"
) else (
    set "JAVACMD=java.exe"
)

set "MAVEN_PROJECTBASEDIR=%~dp0"
if "%MAVEN_PROJECTBASEDIR:~-1%"=="\" set "MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%"

set "WRAPPER_DIR=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.9"
set "MAVEN_HOME=%WRAPPER_DIR%\apache-maven-3.9.9"

if exist "%MAVEN_HOME%\bin\mvn.cmd" goto runMaven

echo [INFO] Maven no detectado en el wrapper local. Descargando Apache Maven 3.9.9...
if not exist "%WRAPPER_DIR%" mkdir "%WRAPPER_DIR%"
set "ZIP_FILE=%WRAPPER_DIR%\apache-maven-3.9.9-bin.zip"

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object System.Net.WebClient).DownloadFile('https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.9.9/apache-maven-3.9.9-bin.zip', '%ZIP_FILE%')"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] No se pudo descargar Maven. Comprueba tu conexion a Internet.
    exit /b 1
)

echo [INFO] Descomprimiendo Apache Maven...
powershell -Command "Expand-Archive -Path '%ZIP_FILE%' -DestinationPath '%WRAPPER_DIR%' -Force"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] No se pudo descomprimir el archivo de Maven.
    exit /b 1
)

:runMaven
"%MAVEN_HOME%\bin\mvn.cmd" %*
exit /b %ERRORLEVEL%
