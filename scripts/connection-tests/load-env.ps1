$envFile = Join-Path $PSScriptRoot '..\..\.env'
if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
      $name = $Matches[1]
      $value = $Matches[2]
      if (
        ($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))
      ) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      if (-not (Test-Path "Env:$name")) {
        Set-Item "Env:$name" $value
      }
    }
  }
}
