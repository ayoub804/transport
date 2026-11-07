param(
  [string]$DBHost,
  [int]$DBPort = 0,
  [string]$RedisHost,
  [int]$RedisPort = 0,
  [string]$SSHHost,
  [int]$SSHPort = 0
)

. (Join-Path $PSScriptRoot 'load-env.ps1')

$databaseUri = $null
if ($env:DATABASE_URL) {
  try {
    $databaseUri = [Uri]$env:DATABASE_URL
  } catch {
    Write-Error 'DATABASE_URL is not a valid URL.'
    exit 1
  }
}

if (-not $DBHost) {
  $DBHost = $env:DB_HOST
}
if (-not $DBHost -and $databaseUri) {
  $DBHost = $databaseUri.Host
}
if (-not $DBHost) {
  $DBHost = 'localhost'
}
if ($DBPort -eq 0 -and $env:DB_PORT) {
  $DBPort = [int]$env:DB_PORT
}
if ($DBPort -eq 0 -and $databaseUri -and $databaseUri.Port -gt 0) {
  $DBPort = $databaseUri.Port
}
if ($DBPort -eq 0) {
  $DBPort = 5432
}

$redisUri = $null
if ($env:REDIS_URL) {
  try {
    $redisUri = [Uri]$env:REDIS_URL
  } catch {
    Write-Error 'REDIS_URL is not a valid URL.'
    exit 1
  }
}
if (-not $RedisHost) {
  $RedisHost = $env:REDIS_HOST
}
if (-not $RedisHost -and $redisUri) {
  $RedisHost = $redisUri.Host
}
if (-not $RedisHost) {
  $RedisHost = 'localhost'
}
if ($RedisPort -eq 0 -and $env:REDIS_PORT) {
  $RedisPort = [int]$env:REDIS_PORT
}
if ($RedisPort -eq 0 -and $redisUri -and $redisUri.Port -gt 0) {
  $RedisPort = $redisUri.Port
}
if ($RedisPort -eq 0) {
  $RedisPort = 6379
}

if (-not $SSHHost) {
  $SSHHost = $env:SSH_HOST
}
if ($SSHPort -eq 0 -and $env:SSH_PORT) {
  $SSHPort = [int]$env:SSH_PORT
}
if ($SSHPort -eq 0) {
  $SSHPort = 22
}

$results = [System.Collections.Generic.List[object]]::new()
$targets = @(
  [pscustomobject]@{ Name = 'Database'; Host = $DBHost; Port = $DBPort },
  [pscustomobject]@{ Name = 'Redis'; Host = $RedisHost; Port = $RedisPort }
)
if ($SSHHost) {
  $targets += [pscustomobject]@{ Name = 'SSH'; Host = $SSHHost; Port = $SSHPort }
} else {
  Write-Host 'SSH checks skipped: SSH_HOST is not configured.'
}

$tcpFailures = 0
foreach ($target in $targets) {
  $pingOk = $false
  try {
    $pingOk = Test-Connection -ComputerName $target.Host -Count 1 -Quiet -ErrorAction SilentlyContinue
  } catch {
    $pingOk = $false
  }
  $results.Add([pscustomobject]@{
    Test = "$($target.Name) ping"
    Target = $target.Host
    Result = if ($pingOk) { 'PASS' } else { 'FAIL' }
    Hint = if ($pingOk) { 'Host responds to ICMP' } else { 'ICMP may be blocked; check TCP result' }
  })

  $tcpOk = Test-NetConnection -ComputerName $target.Host -Port $target.Port -InformationLevel Quiet -WarningAction SilentlyContinue
  if ($tcpOk) {
    $results.Add([pscustomobject]@{
      Test = "$($target.Name) TCP"
      Target = "$($target.Host):$($target.Port)"
      Result = 'PASS'
      Hint = 'TCP port is reachable'
    })
  } else {
    $tcpFailures++
    $results.Add([pscustomobject]@{
      Test = "$($target.Name) TCP"
      Target = "$($target.Host):$($target.Port)"
      Result = 'FAIL'
      Hint = 'Check VPN, firewall, service status, and port'
    })
  }
}

$results | Format-Table -AutoSize
if ($tcpFailures -gt 0) {
  exit 1
}
exit 0
