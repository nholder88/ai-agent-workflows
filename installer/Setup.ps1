[CmdletBinding()]
param(
    [Parameter()]
    [string]$InstallRoot,

    [Parameter()]
    [string]$SourceRepoPath,

    [Parameter()]
    [string]$VSCodePromptsPath,

    [Parameter()]
    [string]$CursorPromptsPath,

    [Parameter()]
    [switch]$SkipVSCode,

    [Parameter()]
    [switch]$SkipCursor,

    [Parameter()]
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message"
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Fail {
    param([string]$Message)
    throw "[ERROR] $Message"
}

function Resolve-FullPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    $item = Resolve-Path -LiteralPath $Path -ErrorAction Stop
    return $item.Path
}

function Get-PackageVersion {
    param([Parameter(Mandatory = $true)][string]$RepoRoot)

    $packageJsonPath = Join-Path $RepoRoot "package.json"
    if (-not (Test-Path -LiteralPath $packageJsonPath -PathType Leaf)) {
        return "unknown"
    }

    try {
        $packageJson = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
        if ($null -ne $packageJson.version -and $packageJson.version.ToString().Trim().Length -gt 0) {
            return $packageJson.version.ToString()
        }
        return "unknown"
    }
    catch {
        Write-Warn "Could not parse package.json; using version=unknown."
        return "unknown"
    }
}

function Ensure-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Copy-AgentsAndTemplates {
    param(
        [Parameter(Mandatory = $true)][string]$AgentsSource,
        [Parameter(Mandatory = $true)][string]$TemplatesSource,
        [Parameter(Mandatory = $true)][string]$TargetPromptsPath,
        [Parameter(Mandatory = $true)][string]$TargetName
    )

    Ensure-Directory -Path $TargetPromptsPath

    $templatesTargetPath = Join-Path $TargetPromptsPath "Templates"
    Ensure-Directory -Path $templatesTargetPath

    $installedFiles = @()

    # Install agent files directly into prompts path.
    Get-ChildItem -LiteralPath $AgentsSource -File -Recurse | ForEach-Object {
        $targetFilePath = Join-Path $TargetPromptsPath $_.Name
        Copy-Item -LiteralPath $_.FullName -Destination $targetFilePath -Force
        $installedFiles += $targetFilePath
    }

    # Install templates under prompts/Templates preserving folder structure.
    Get-ChildItem -LiteralPath $TemplatesSource -File -Recurse | ForEach-Object {
        $trimChars = [char[]]([char]92, [char]47)
        $relativePath = $_.FullName.Substring($TemplatesSource.Length).TrimStart($trimChars)
        $targetFilePath = Join-Path $templatesTargetPath $relativePath
        $targetParent = Split-Path -Parent $targetFilePath
        Ensure-Directory -Path $targetParent
        Copy-Item -LiteralPath $_.FullName -Destination $targetFilePath -Force
        $installedFiles += $targetFilePath
    }

    return [PSCustomObject]@{
        target            = $TargetName
        promptsPath       = $TargetPromptsPath
        templatesPath     = $templatesTargetPath
        installedFiles    = $installedFiles
        agentFileCount    = (Get-ChildItem -LiteralPath $AgentsSource -File -Recurse | Measure-Object).Count
        templateFileCount = (Get-ChildItem -LiteralPath $TemplatesSource -File -Recurse | Measure-Object).Count
    }
}

try {
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

    $localAppData = [Environment]::GetFolderPath("LocalApplicationData")
    $roamingAppData = [Environment]::GetFolderPath("ApplicationData")
    $userProfile = [Environment]::GetFolderPath("UserProfile")

    if ([string]::IsNullOrWhiteSpace($InstallRoot)) {
        $InstallRoot = Join-Path $localAppData "ai-agent-workflows-pack"
    }
    if ([string]::IsNullOrWhiteSpace($VSCodePromptsPath)) {
        $VSCodePromptsPath = Join-Path $roamingAppData "Code\User\prompts"
    }
    if ([string]::IsNullOrWhiteSpace($CursorPromptsPath)) {
        $CursorPromptsPath = Join-Path $userProfile ".cursor\agents"
    }

    if ([string]::IsNullOrWhiteSpace($SourceRepoPath)) {
        $SourceRepoPath = Split-Path -Parent $scriptRoot
    }

    $repoRoot = Resolve-FullPath -Path $SourceRepoPath
    $agentsSource = Join-Path $repoRoot "VS Code\agents"
    $templatesSource = Join-Path $repoRoot "Templates"

    if (-not (Test-Path -LiteralPath $agentsSource -PathType Container)) {
        Fail "Required source folder not found: $agentsSource"
    }
    if (-not (Test-Path -LiteralPath $templatesSource -PathType Container)) {
        Fail "Required source folder not found: $templatesSource"
    }

    $installRootFull = [System.IO.Path]::GetFullPath($InstallRoot)
    Ensure-Directory -Path $installRootFull

    $managedMarkerPath = Join-Path $installRootFull ".managed-by-ai-agent-workflows"
    Set-Content -LiteralPath $managedMarkerPath -Value "managed=true" -Encoding ASCII

    $targetResults = @()

    if (-not $SkipVSCode) {
        $targetResults += (Copy-AgentsAndTemplates -AgentsSource $agentsSource -TemplatesSource $templatesSource -TargetPromptsPath $VSCodePromptsPath -TargetName "vscode")
    }

    if (-not $SkipCursor) {
        $targetResults += (Copy-AgentsAndTemplates -AgentsSource $agentsSource -TemplatesSource $templatesSource -TargetPromptsPath $CursorPromptsPath -TargetName "cursor")
    }

    if ($targetResults.Count -eq 0) {
        Fail "Nothing to install. Remove -SkipVSCode/-SkipCursor exclusions."
    }

    $manifestPath = Join-Path $installRootFull "install-manifest.json"
    $manifest = [PSCustomObject]@{
        schemaVersion  = 2
        packageVersion = (Get-PackageVersion -RepoRoot $repoRoot)
        installedAtUtc = [DateTime]::UtcNow.ToString("o")
        installRoot    = $installRootFull
        sourceRepoPath = $repoRoot
        managedMarker  = $managedMarkerPath
        targets        = $targetResults
    }

    $manifest | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

    Write-Ok "Quick install complete."
    Write-Host "Install root (manifest): $installRootFull"
    Write-Host "Manifest: $manifestPath"

    foreach ($target in $targetResults) {
        Write-Host "Target [$($target.target)] prompts: $($target.promptsPath)"
        Write-Host "  Agents copied   : $($target.agentFileCount)"
        Write-Host "  Templates copied: $($target.templateFileCount)"
    }

    if (-not $SkipVSCode) {
        Write-Host "VS Code expected prompts path: $VSCodePromptsPath"
    }

    exit 0
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.InvocationInfo) {
        Write-Host $_.InvocationInfo.PositionMessage -ForegroundColor DarkGray
    }
    if (-not [string]::IsNullOrWhiteSpace($_.ScriptStackTrace)) {
        Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    }
    exit 1
}
