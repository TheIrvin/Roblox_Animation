$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$luauDirectory = Join-Path $env:LOCALAPPDATA "Programs\Luau"
$luau = Get-Command luau -ErrorAction SilentlyContinue
$compiler = Get-Command luau-compile -ErrorAction SilentlyContinue

if (-not $luau) {
	$luauPath = Join-Path $luauDirectory "luau.exe"
	if (Test-Path -LiteralPath $luauPath) {
		$luau = @{ Source = $luauPath }
	}
}
if (-not $compiler) {
	$compilerPath = Join-Path $luauDirectory "luau-compile.exe"
	if (Test-Path -LiteralPath $compilerPath) {
		$compiler = @{ Source = $compilerPath }
	}
}
if (-not $luau -or -not $compiler) {
	throw "Luau CLI and compiler are required. Install the Windows binaries from https://github.com/luau-lang/luau/releases and add them to PATH or %LOCALAPPDATA%\Programs\Luau."
}

Get-ChildItem (Join-Path $repositoryRoot "studio-plugin\src") -Filter "*.lua" | ForEach-Object {
	& $compiler.Source --only-parse $_.FullName
	if ($LASTEXITCODE -ne 0) {
		throw "Luau parse failed for $($_.Name)."
	}
}

& $luau.Source (Join-Path $repositoryRoot "studio-plugin\tests\run.luau")
if ($LASTEXITCODE -ne 0) {
	throw "Luau plugin tests failed with exit code $LASTEXITCODE."
}
