$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repositoryRoot

try {
    $commands = @(
        @{ Label = "TypeScript typecheck"; Executable = "npm"; Arguments = @("run", "typecheck") },
        @{ Label = "ESLint"; Executable = "npm"; Arguments = @("run", "lint") },
        @{ Label = "Vitest"; Executable = "npm"; Arguments = @("run", "test") },
        @{ Label = "Prettier"; Executable = "npm"; Arguments = @("run", "format:check") },
        @{ Label = "Rust formatting"; Executable = "cargo"; Arguments = @("fmt", "--manifest-path", "src-tauri/Cargo.toml", "--", "--check") },
        @{ Label = "Rust Clippy"; Executable = "cargo"; Arguments = @("clippy", "--manifest-path", "src-tauri/Cargo.toml", "--", "-D", "warnings") },
        @{ Label = "Rust tests"; Executable = "cargo"; Arguments = @("test", "--manifest-path", "src-tauri/Cargo.toml") },
        @{ Label = "Frontend production build"; Executable = "npm"; Arguments = @("run", "build") }
    )

    foreach ($command in $commands) {
        Write-Host "`n== $($command.Label) ==" -ForegroundColor Cyan
        & $command.Executable @($command.Arguments)
        if ($LASTEXITCODE -ne 0) {
            throw "$($command.Label) failed with exit code $LASTEXITCODE"
        }
    }
}
finally {
    Pop-Location
}
