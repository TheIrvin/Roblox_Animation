$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $repositoryRoot "studio-plugin/default.project.json"
$outputDirectory = Join-Path $repositoryRoot "studio-plugin/build"
$outputPath = Join-Path $outputDirectory "RobloxAnimatorPlugin.rbxm"

if (-not (Get-Command rojo -ErrorAction SilentlyContinue)) {
    throw "Rojo CLI is required. Install Rojo 7, then run this script again."
}

New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
rojo build $projectPath --output $outputPath
if ($LASTEXITCODE -ne 0) {
    throw "Rojo plugin build failed with exit code $LASTEXITCODE"
}
Write-Host "Plugin model written to $outputPath"
