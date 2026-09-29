$ErrorActionPreference = 'Stop'
$siteRoot = [IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $PSScriptRoot) '网页'))
$StatePath = $args[0]
$InstanceId = $args[1]
if (-not $StatePath -or $InstanceId -notmatch '^[a-f0-9]{16}$') { throw '启动参数无效。' }
if (-not (Test-Path (Join-Path $siteRoot 'index.html'))) {
    Write-Host '找不到 网页\index.html，请先运行 重新构建网页.cmd。'
    exit 1
}

$preferredPort = 40000 + ([Convert]::ToInt32($InstanceId.Substring(0, 4), 16) % 20000)
try {
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $preferredPort)
    $listener.Start()
} catch [Net.Sockets.SocketException] {
    $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, 0)
    $listener.Start()
}
$port = $listener.LocalEndpoint.Port
[pscustomobject]@{ InstanceId = $InstanceId; Port = $port; Pid = $PID } |
    ConvertTo-Json -Compress | Set-Content -LiteralPath $StatePath -Encoding UTF8

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 10000
            $network = $client.GetStream()
            $reader = [IO.StreamReader]::new($network, [Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            if (-not $requestLine) { continue }
            $requestHeaders = @{}
            while ($true) {
                $header = $reader.ReadLine()
                if ($null -eq $header -or $header.Length -eq 0) { break }
                $separator = $header.IndexOf(':')
                if ($separator -gt 0) { $requestHeaders[$header.Substring(0, $separator).ToLowerInvariant()] = $header.Substring($separator + 1).Trim() }
            }
            $target = ($requestLine -split ' ')[1].Split('?')[0]
            $etag = $null
            $cacheControl = 'no-cache'
            if ($target -eq '/__observatory_status') {
                $body = [Text.Encoding]::ASCII.GetBytes($InstanceId)
                $mime = 'text/plain; charset=utf-8'
                $status = '200 OK'
                $cacheControl = 'no-store'
            } else {
                $relative = [Uri]::UnescapeDataString($target).TrimStart('/').Replace('/', '\')
                if (-not $relative) { $relative = 'index.html' }
                $filePath = [IO.Path]::GetFullPath((Join-Path $siteRoot $relative))
                $allowed = $filePath.StartsWith($siteRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)
                if ($allowed -and [IO.File]::Exists($filePath)) {
                    $file = [IO.FileInfo]::new($filePath)
                    $etag = '"{0:x}-{1:x}"' -f $file.Length, $file.LastWriteTimeUtc.Ticks
                    if ($target -match '^/assets/.+-[A-Za-z0-9_-]+\.(js|css)$') { $cacheControl = 'public, max-age=31536000, immutable' }
                    $mime = switch ($file.Extension.ToLowerInvariant()) {
                        '.html' { 'text/html; charset=utf-8' }
                        '.js'   { 'text/javascript; charset=utf-8' }
                        '.css'  { 'text/css; charset=utf-8' }
                        '.svg'  { 'image/svg+xml' }
                        '.jpg'  { 'image/jpeg' }
                        '.jpeg' { 'image/jpeg' }
                        '.png'  { 'image/png' }
                        '.ico'  { 'image/x-icon' }
                        default { 'application/octet-stream' }
                    }
                    if ($requestHeaders['if-none-match'] -eq $etag) {
                        $body = [byte[]]@()
                        $status = '304 Not Modified'
                    } else {
                        $body = [IO.File]::ReadAllBytes($filePath)
                        $status = '200 OK'
                    }
                } else {
                    $body = [Text.Encoding]::UTF8.GetBytes('404 Not Found')
                    $mime = 'text/plain; charset=utf-8'
                    $status = '404 Not Found'
                }
            }
            $etagHeader = if ($etag) { "ETag: $etag`r`n" } else { '' }
            $response = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status`r`nContent-Type: $mime`r`nContent-Length: $($body.Length)`r`nCache-Control: $cacheControl`r`n${etagHeader}Connection: close`r`n`r`n")
            $network.Write($response, 0, $response.Length)
            $network.Write($body, 0, $body.Length)
        } catch {
            Write-Host "请求处理失败：$($_.Exception.Message)"
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
}
