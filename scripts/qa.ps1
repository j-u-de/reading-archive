$ErrorActionPreference='Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
foreach ($check in @('lint', 'test', 'build', 'typecheck')) {
  & pnpm.cmd run $check
  if ($LASTEXITCODE -ne 0) { throw "QA check failed: $check" }
}
Write-Output 'QA checks passed. Start development separately with: pnpm dev'
