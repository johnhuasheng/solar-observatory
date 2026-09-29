$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$siteRoot = Join-Path $projectRoot '网页'
if (-not (Test-Path -LiteralPath (Join-Path $siteRoot 'index.html'))) {
    throw '找不到 网页\index.html，请先运行 重新构建网页.cmd。'
}

$sha = [Security.Cryptography.SHA256]::Create()
try {
    $digest = $sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot.ToLowerInvariant()))
} finally {
    $sha.Dispose()
}
$instanceId = -join ($digest[0..7] | ForEach-Object { $_.ToString('x2') })
$stateDirectory = Join-Path $env:LOCALAPPDATA 'SolarObservatoryLocal'
[IO.Directory]::CreateDirectory($stateDirectory) | Out-Null
$statePath = Join-Path $stateDirectory "$instanceId.json"

function Get-RunningAddress {
    if (-not (Test-Path -LiteralPath $statePath)) { return $null }
    try {
        $state = Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
        $port = [int]$state.Port
        if ($state.InstanceId -ne $instanceId -or $port -lt 1 -or $port -gt 65535) { return $null }
        $address = "http://127.0.0.1:$port/"
        $request = [Net.WebRequest]::Create("${address}__observatory_status")
        $request.Proxy = $null
        $request.Timeout = 800
        $response = $request.GetResponse()
        try {
            $reader = [IO.StreamReader]::new($response.GetResponseStream())
            try { $answer = $reader.ReadToEnd() } finally { $reader.Dispose() }
        } finally { $response.Dispose() }
        if ($answer -eq $instanceId) { return $address }
    } catch { return $null }
    return $null
}

$mutex = [Threading.Mutex]::new($false, "Local\SolarObservatory_$instanceId")
$hasLock = $false
try {
    $hasLock = $mutex.WaitOne(10000)
    if (-not $hasLock) { throw '观测站正在启动，请稍后重试。' }
    $address = Get-RunningAddress
    if (-not $address) {
        $serverScript = Join-Path $PSScriptRoot 'local-server.ps1'
        $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$serverScript`" `"$statePath`" $instanceId"
        $server = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $arguments -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
        $deadline = [DateTime]::UtcNow.AddSeconds(10)
        do {
            Start-Sleep -Milliseconds 100
            $address = Get-RunningAddress
            if ($address) { break }
            if ($server.HasExited) { throw '本地服务启动失败，请检查 网页 文件夹。' }
        } while ([DateTime]::UtcNow -lt $deadline)
        if (-not $address) { throw '本地服务启动超时，请重试。' }
    }
    Start-Process $address
} finally {
    if ($hasLock) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
