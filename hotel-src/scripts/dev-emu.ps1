# Starts the Firebase emulators (auth + database) and the Vite dev server in "emulator" mode.
# Windows quirk: Java's loopback pipe uses unix-domain sockets, which break when TEMP is a very long path,
# so the emulator JVM gets a short temp dir (C:\jtmp).
$root = Split-Path -Parent $PSScriptRoot
$jdk = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -Filter 'jdk-21*' | Select-Object -First 1
if (-not $jdk) { throw 'Install a JDK 11+ first: winget install EclipseAdoptium.Temurin.21.JDK' }

New-Item -ItemType Directory -Force 'C:\jtmp' | Out-Null
$env:JAVA_HOME = $jdk.FullName
$env:Path = "$($jdk.FullName)\bin;$env:Path"

Start-Process powershell -WorkingDirectory $root -ArgumentList '-NoExit', '-Command', "`$env:TEMP='C:\jtmp'; `$env:TMP='C:\jtmp'; `$env:JAVA_TOOL_OPTIONS='-Djava.io.tmpdir=C:\jtmp'; npm run emulators"
Start-Sleep -Seconds 8
Set-Location $root
npm run dev:emu -- --host 127.0.0.1 --port 5173 --open
