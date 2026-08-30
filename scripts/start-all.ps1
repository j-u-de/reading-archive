$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
Set-Location $root
Start-Process -FilePath 'python' -ArgumentList 'scripts/ai_proxy.py' -WorkingDirectory $root -WindowStyle Hidden
Start-Process -FilePath 'npx.cmd' -ArgumentList 'next','dev','-p','3000' -WorkingDirectory $root
Write-Host 'Reading Archive started: http://localhost:3000'
