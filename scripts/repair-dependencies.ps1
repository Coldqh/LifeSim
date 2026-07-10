$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $projectRoot

Write-Host "Project: $projectRoot"
Write-Host "Node: $(node --version)"
Write-Host "npm: $(npm --version)"

if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
}

npm config set registry https://registry.npmjs.org/
npm run verify:lock
npm ci --include=optional --no-audit --no-fund --registry=https://registry.npmjs.org/
npm run typecheck
npm run build
