$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$sha = [Security.Cryptography.SHA256]::Create()
try {
    $digest = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot.ToLowerInvariant()))
} finally {
    $sha.Dispose()
}
$instanceId = -join ($digest[0..7] | ForEach-Object { $_.ToString('x2') })
$statePath = Join-Path (Join-Path $env:LOCALAPPDATA 'SolarObservatoryLocal') "$instanceId.json"
if (-not (Test-Path -LiteralPath $statePath)) { exit 0 }
$state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($state.InstanceId -ne $instanceId) { throw '观测站状态不匹配，未停止任何进程。' }
$serverScript = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'local-server.ps1'))
$process = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$state.Pid)"
if (-not $process -or -not $process.CommandLine -or -not $process.CommandLine.Contains($serverScript)) { exit 0 }
Stop-Process -Id $process.ProcessId
