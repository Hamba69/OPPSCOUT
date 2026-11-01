param(
  [ValidateSet("Status", "Start", "Stop")]
  [string]$Action = "Status",
  [switch]$Reset
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$containerName = "oppscout-local-db"
$volumeName = "oppscout-local-db-data"
$containerLabel = "com.oppscout.localdb"
$legacyContainerName = "oppscout-plan-local-postgres"
$legacyVolumeName = "oppscout-plan-local-postgres-data"
$legacyLabel = "com.oppscout.review.localdb"
$bootstrapPath = Join-Path $PSScriptRoot "local-db"
$supabaseCommand = Get-Command supabase -ErrorAction SilentlyContinue
$dockerCommand = Get-Command docker -ErrorAction SilentlyContinue

function Get-LocalDatabasePassword {
  if ($env:LOCAL_DB_PASSWORD) {
    if ($env:LOCAL_DB_PASSWORD.Length -lt 20) {
      throw "LOCAL_DB_PASSWORD must be at least 20 characters. Its value will not be displayed."
    }
    return $env:LOCAL_DB_PASSWORD
  }

  $passwordPath = Join-Path $repoRoot ".env.local-db"
  if (Test-Path -LiteralPath $passwordPath) {
    $entry = Get-Content -LiteralPath $passwordPath | Where-Object { $_.StartsWith("LOCAL_DB_PASSWORD=") } | Select-Object -First 1
    if ($entry) {
      $password = $entry.Substring("LOCAL_DB_PASSWORD=".Length)
      if ($password.Length -ge 20) {
        $env:LOCAL_DB_PASSWORD = $password
        return $password
      }
    }
    throw "The ignored .env.local-db file has no valid LOCAL_DB_PASSWORD entry. Set LOCAL_DB_PASSWORD in this PowerShell session or repair that file without displaying its value."
  }

  $password = [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
  [System.IO.File]::WriteAllText($passwordPath, "LOCAL_DB_PASSWORD=$password`n")
  $env:LOCAL_DB_PASSWORD = $password
  return $password
}

function Remove-ManagedContainer([string]$name, [string]$labelName) {
  $found = docker container ls --all --filter "name=^${name}$" --format "{{.Names}}"
  if ($LASTEXITCODE -ne 0) { throw "Docker could not list local containers." }
  if ($found -notcontains $name) { return }
  $details = docker container inspect $name | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) { throw "Docker could not inspect the named local container." }
  if ($details[0].Config.Labels.$labelName -ne "true") {
    throw "Refusing to remove $name because it is not marked as an OppScout local review database."
  }
  docker container rm --force $name | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Docker could not remove the managed local container $name." }
}

function Remove-LocalVolume([string]$name) {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $null = docker volume inspect $name 2>&1
    $result = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($result -eq 0) {
    docker volume rm $name | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker could not remove the local review volume $name." }
  }
}

function Invoke-Supabase {
  param(
    [string[]]$Arguments,
    [switch]$AllowFailure
  )

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $null = & $supabaseCommand.Source @Arguments 2>&1
    $result = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($result -ne 0 -and -not $AllowFailure) {
    throw "Supabase CLI command '$($Arguments[0])' failed with exit code $result. Key-bearing CLI output was suppressed; inspect Docker status and run the guarded preflight for a specific connection diagnosis."
  }
  return $result
}

function Set-SupabaseDatabaseUrls {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $status = & $supabaseCommand.Source status --workdir $repoRoot --output env 2>&1
    $result = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($result -ne 0) {
    throw "Supabase local status could not be read. Start the stack and rerun the local database preflight."
  }

  $entry = $status | ForEach-Object { $_.ToString() } | Where-Object { $_.StartsWith("DB_URL=") } | Select-Object -First 1
  if (-not $entry) {
    throw "Supabase status did not provide a database URL; no connection variables were set."
  }
  $databaseUrl = $entry.Substring("DB_URL=".Length).Trim('"')
  $uri = [uri]$databaseUrl
  if ($uri.Host -notin @("localhost", "127.0.0.1") -or $uri.Port -ne 54329 -or $uri.UserInfo.Split(":")[0] -ne "postgres" -or $uri.AbsolutePath -ne "/postgres") {
    throw "Supabase returned a database URL outside the expected local PostgreSQL endpoint; no connection variables were set."
  }
  if (-not $uri.Query.Contains("schema=")) {
    $databaseUrl += $(if ($uri.Query) { "&schema=public" } else { "?schema=public" })
  }
  $env:LOCAL_DATABASE_URL = $databaseUrl
  $env:LOCAL_DIRECT_URL = $databaseUrl
}

if ($Reset -and $Action -ne "Start") {
  throw "Use -Reset with -Action Start so the fresh local database is recreated immediately."
}

if (-not $dockerCommand) {
  throw "Docker CLI is unavailable. Install Docker Desktop, start it, and rerun this command."
}

if ($supabaseCommand) {
  if ($Reset) {
    $null = Invoke-Supabase -Arguments @("stop", "--no-backup", "--workdir", $repoRoot) -AllowFailure
    Remove-ManagedContainer $containerName $containerLabel
    Remove-LocalVolume $volumeName
    Remove-ManagedContainer $legacyContainerName $legacyLabel
    Remove-LocalVolume $legacyVolumeName
  }

  if ($Action -eq "Status") {
    $result = Invoke-Supabase -Arguments @("status", "--workdir", $repoRoot) -AllowFailure
    if ($result -eq 0) {
      Set-SupabaseDatabaseUrls
      Write-Output "Supabase local stack is running; key-bearing status output was suppressed."
    } else {
      Write-Output "Supabase local stack is not running. Start it with .\scripts\review\impl\local-db.ps1 -Action Start."
    }
    exit 0
  }

  if ($Action -eq "Stop") {
    $null = Invoke-Supabase -Arguments @("stop", "--workdir", $repoRoot) -AllowFailure
    Write-Output "Supabase local stack stopped. Its database volume was retained."
    exit 0
  }

  $null = Invoke-Supabase -Arguments @("start", "--workdir", $repoRoot, "--output-format", "json")
  Set-SupabaseDatabaseUrls
  Write-Output "Supabase local stack started with project configuration at supabase/config.toml; generated keys were suppressed."
  exit 0
}

if ($Action -eq "Status") {
  $found = docker container ls --all --filter "name=^${containerName}$" --format "{{.Names}}"
  if ($LASTEXITCODE -ne 0) { throw "Docker could not list local containers." }
  if ($found -notcontains $containerName) {
    Write-Output "Local PostgreSQL container is not created. Run this script with -Action Start."
    exit 0
  }
  Write-Output "Local PostgreSQL container exists; use docker status to determine whether it is running. Its volume is retained."
  exit 0
}

if ($Reset) {
  Remove-ManagedContainer $containerName $containerLabel
  Remove-LocalVolume $volumeName
  Remove-ManagedContainer $legacyContainerName $legacyLabel
  Remove-LocalVolume $legacyVolumeName
}

if ($Action -eq "Stop") {
  $found = docker container ls --all --filter "name=^${containerName}$" --format "{{.Names}}"
  if ($LASTEXITCODE -ne 0) { throw "Docker could not list local containers." }
  if ($found -notcontains $containerName) {
    Write-Output "Local PostgreSQL container is not created."
    exit 0
  }
  docker container stop $containerName | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Docker could not stop the local PostgreSQL container." }
  Write-Output "Local PostgreSQL container stopped; its volume was retained."
  exit 0
}

$password = Get-LocalDatabasePassword
$env:POSTGRES_PASSWORD = $password
$found = docker container ls --all --filter "name=^${containerName}$" --format "{{.Names}}"
if ($LASTEXITCODE -ne 0) { throw "Docker could not list local containers." }
if ($found -contains $containerName) {
  $details = docker container inspect $containerName | ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) { throw "Docker could not inspect the local PostgreSQL container." }
  if ($details[0].Config.Labels.$containerLabel -ne "true") {
    throw "Refusing to start $containerName because it is not marked as an OppScout local review database."
  }
  if (-not $details[0].State.Running) {
    docker container start $containerName | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Docker could not start the local PostgreSQL container." }
  }
  Write-Output "Local PostgreSQL container is running on 127.0.0.1:54329."
  exit 0
}

$mount = "type=bind,source=$bootstrapPath,target=/docker-entrypoint-initdb.d,readonly"
docker run --detach `
  --name $containerName `
  --label "$containerLabel=true" `
  --publish 127.0.0.1:54329:5432 `
  --volume "${volumeName}:/var/lib/postgresql/data" `
  --mount $mount `
  --env POSTGRES_USER=postgres `
  --env POSTGRES_DB=postgres `
  --env POSTGRES_PASSWORD `
  postgres:16 | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Docker could not create the isolated local PostgreSQL container." }
Write-Output "Local PostgreSQL container created on 127.0.0.1:54329 with the committed idempotent bootstrap."
