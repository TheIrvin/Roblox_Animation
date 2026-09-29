$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $repositoryRoot "dist"
$msiSource = Join-Path $repositoryRoot "src-tauri/target/release/bundle/msi/Roblox Animator Desktop_0.1.0_x64_en-US.msi"
$nsisSource = Join-Path $repositoryRoot "src-tauri/target/release/bundle/nsis/Roblox Animator Desktop_0.1.0_x64-setup.exe"
$pluginPath = Join-Path $outputDirectory "RobloxAnimatorPlugin.rbxm"

foreach ($requiredFile in @($msiSource, $nsisSource, $pluginPath)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Release input is missing: $requiredFile. Build the Windows app and plugin first."
    }
}

Copy-Item -LiteralPath $msiSource -Destination (Join-Path $outputDirectory "RobloxAnimatorDesktop-0.1.0-Windows-x64.msi") -Force
Copy-Item -LiteralPath $nsisSource -Destination (Join-Path $outputDirectory "RobloxAnimatorDesktop-0.1.0-Windows-x64-setup.exe") -Force
Write-Host "Windows installers and Studio plugin staged in $outputDirectory"
