param(
  [string]$SSHUser,
  [string]$SSHHost
)

. (Join-Path $PSScriptRoot 'load-env.ps1')

if (-not $SSHUser) {
  $SSHUser = $env:SSH_USER
}
if (-not $SSHHost) {
  $SSHHost = $env:SSH_HOST
}
if (-not $SSHUser -or -not $SSHHost) {
  Write-Error 'Set SSH_USER and SSH_HOST in the environment or root .env file.'
  exit 1
}

Write-Host 'Opening PostgreSQL tunnel on local port 5433; press Ctrl+C to close it.'
Write-Host 'Set DATABASE_URL to localhost:5433 and DB_HOST=localhost, DB_PORT=5433 while this tunnel is open.'
& ssh -N -L 5433:localhost:5432 "$SSHUser@$SSHHost"
exit $LASTEXITCODE
