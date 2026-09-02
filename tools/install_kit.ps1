<#
.SYNOPSIS
    Installs the Agentic Planning Kit v3 into a consumer Git repository.

.DESCRIPTION
    Vendors the kit into <Workspace>/<Prefix>, merges the .gitignore and
    .gitattributes fragments into the consumer's ROOT files (they only work
    from the root), merges the CODEOWNERS fragment and installs the CI
    workflow with KIT_PATH already pointing at the installed prefix.

    Every generated section lives inside an idempotent managed block, so the
    script can be re-run to refresh an installation without duplicating rules.

    The script never pushes. In 'subtree' mode git itself creates one commit
    for the vendored kit; the merged fragments are left uncommitted for review.

.PARAMETER Workspace
    Path inside the consumer repository. The repository root is resolved with
    git rev-parse --show-toplevel.

.PARAMETER Mode
    subtree (default) vendors the kit with an upstream update path.
    copy vendors a detached snapshot with no update path.

.PARAMETER KitSource
    Kit repository URL or local path. Defaults to this script's own kit, which
    vendors the copy you are looking at. Pass the canonical URL
    https://github.com/pedro-aaron/agentic-planning-kit.git to vendor upstream
    instead.

.PARAMETER Prefix
    Directory name inside the consumer repository. Keep the default:
    TRIGGERS.md and the prompts reference agentic-planning-kit/ by name.

.PARAMETER RefreshOnly
    Leaves the vendored kit untouched and only regenerates the managed blocks.
    Use it after a 'git subtree pull' to pick up changed template fragments.

.EXAMPLE
    .\install_kit.ps1 -Workspace C:\src\my_workspace

.EXAMPLE
    .\install_kit.ps1 -Workspace ..\my_workspace -DryRun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Workspace,

    [ValidateSet('subtree', 'copy')]
    [string]$Mode = 'subtree',

    [string]$KitSource,

    [string]$KitRef = 'main',

    [string]$RemoteName = 'planning-kit',

    [string]$Prefix = 'agentic-planning-kit',

    [string]$CodeownersOwner = '@myteam',

    [switch]$SkipCi,

    [switch]$SkipCodeowners,

    [switch]$RefreshOnly,

    [switch]$Force,

    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Marker text is shared with install_kit.sh: either script must recognize and
# refresh a block written by the other.
$BlockStart = '# >>> agentic-planning-v3 (managed by install_kit) >>>'
$BlockEnd = '# <<< agentic-planning-v3 (managed by install_kit) <<<'
$LF = [string][char]10

# ---------------------------------------------------------------- helpers ---

function Write-Step { param([string]$Text) Write-Host "==> $Text" -ForegroundColor Cyan }
function Write-Ok { param([string]$Text) Write-Host "    $Text" -ForegroundColor Green }
function Write-Note { param([string]$Text) Write-Host "    $Text" -ForegroundColor DarkGray }
function Write-Alert { param([string]$Text) Write-Host "    $Text" -ForegroundColor Yellow }

function Fail {
    param([string]$Text)
    Write-Host "ERROR $Text" -ForegroundColor Red
    exit 1
}

# Windows PowerShell 5.1 turns a native command's stderr into terminating
# NativeCommandError records under ErrorActionPreference='Stop'. git writes
# ordinary progress to stderr, so the preference is relaxed for the call only.
# -StdOutOnly is required whenever the caller parses the output: it keeps
# progress lines and warnings out of the parsed text.
function Invoke-Git {
    param(
        [string[]]$Arguments,
        [switch]$AllowFailure,
        [switch]$StdOutOnly
    )
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        if ($StdOutOnly) {
            $output = & git @Arguments 2>$null
        }
        else {
            $output = & git @Arguments 2>&1
        }
        $code = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previous
    }
    $text = (($output | ForEach-Object { $_.ToString() }) -join $LF)
    if ($code -ne 0 -and -not $AllowFailure) {
        Fail "git $($Arguments -join ' ') failed with exit code $code$LF$text"
    }
    return [pscustomobject]@{ ExitCode = $code; Output = $text }
}

function Read-TextFile {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    return ([System.IO.File]::ReadAllText($Path) -replace "\r\n", $LF)
}

function Write-TextFile {
    param([string]$Path, [string]$Text)
    $normalized = ($Text -replace "\r\n", $LF).TrimEnd() + $LF
    if ($DryRun) {
        Write-Note "[dry-run] would write $Path"
        return
    }
    $parent = Split-Path -Parent $Path
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $normalized, (New-Object System.Text.UTF8Encoding($false)))
}

# Drops the "copy me into your repo" instructions from a template fragment.
function Get-FragmentBody {
    param([string]$Text)
    $kept = $Text -split $LF | Where-Object {
        $_ -notmatch '^#\s*(Merge (this fragment )?into|Copy into|Replace @|Adjust KIT_PATH)'
    }
    return (($kept -join $LF).Trim())
}

function Merge-ManagedBlock {
    param([string]$Path, [string]$Body, [string]$Label)

    $block = $BlockStart + $LF + $Body.Trim() + $LF + $BlockEnd
    $existing = Read-TextFile -Path $Path

    if ($null -eq $existing) {
        Write-Ok "creating $Label"
        Write-TextFile -Path $Path -Text $block
        return
    }

    $pattern = '(?s)' + [regex]::Escape($BlockStart) + '.*?' + [regex]::Escape($BlockEnd)
    if ($existing -match $pattern) {
        $updated = [regex]::Replace($existing, $pattern, [System.Text.RegularExpressions.MatchEvaluator] { param($m) $block })
        if ($updated.TrimEnd() -eq $existing.TrimEnd()) {
            Write-Note "$Label already up to date"
        }
        else {
            Write-Ok "refreshing managed block in $Label"
        }
        Write-TextFile -Path $Path -Text $updated
    }
    else {
        Write-Ok "appending managed block to $Label"
        Write-TextFile -Path $Path -Text ($existing.TrimEnd() + $LF + $LF + $block)
    }
}

# -------------------------------------------------------------- preflight ---

Write-Step 'Preflight'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail 'git is not on PATH.'
}

$kitRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $kitRoot 'tools/agentic_planning_v3.py'))) {
    Fail "cannot locate the kit from $PSScriptRoot; run this script from the kit's tools/ directory."
}
if (-not $KitSource) { $KitSource = $kitRoot }

if (-not (Test-Path -LiteralPath $Workspace)) {
    Fail "workspace path does not exist: $Workspace"
}

$topLevel = Invoke-Git @('-C', $Workspace, 'rev-parse', '--show-toplevel') -AllowFailure -StdOutOnly
if ($topLevel.ExitCode -ne 0) {
    Fail "$Workspace is not inside a Git repository. Run 'git init' and make one commit first."
}
$root = (Resolve-Path -LiteralPath $topLevel.Output).Path

Write-Note "kit source:     $KitSource"
Write-Note "consumer root:  $root"
Write-Note "install prefix: $Prefix"
Write-Note "mode:           $Mode"
if ($DryRun) { Write-Alert 'dry-run: no file or Git changes will be made' }

if ($Prefix -ne 'agentic-planning-kit') {
    Write-Alert "TRIGGERS.md and the prompts reference 'agentic-planning-kit/' literally."
    Write-Alert "Using prefix '$Prefix' means every trigger block must be edited by hand."
}

$kitTop = Invoke-Git @('-C', $kitRoot, 'rev-parse', '--show-toplevel') -AllowFailure -StdOutOnly
if ($kitTop.ExitCode -eq 0 -and (Resolve-Path -LiteralPath $kitTop.Output).Path -eq $root) {
    Fail 'the workspace resolves to the kit repository itself; point -Workspace at the consumer project.'
}

$target = Join-Path $root $Prefix
$targetExists = Test-Path -LiteralPath $target

if ($RefreshOnly) {
    if (-not $targetExists) {
        Fail "-RefreshOnly needs an existing installation, but $Prefix is not present in $root."
    }
    Write-Note 'refresh-only: the vendored kit will not be touched'
}
elseif ($Mode -eq 'subtree') {
    $head = Invoke-Git @('-C', $root, 'rev-parse', '--verify', 'HEAD') -AllowFailure -StdOutOnly
    if ($head.ExitCode -ne 0) {
        Fail "git subtree needs at least one commit in $root. Commit something first, or use -Mode copy."
    }
    $status = Invoke-Git @('-C', $root, 'status', '--porcelain') -StdOutOnly
    if ($status.Output.Trim()) {
        Fail "git subtree needs a clean working tree in $root. Commit or stash your changes first."
    }
    if ($targetExists) {
        Fail "$Prefix already exists.$LF  Update the vendored kit:  git -C `"$root`" subtree pull --prefix $Prefix $RemoteName $KitRef --squash$LF  Regenerate managed blocks: re-run this script with -RefreshOnly"
    }
}
if (-not $RefreshOnly -and $Mode -eq 'copy' -and $targetExists -and -not $Force) {
    Fail "$Prefix already exists. Re-run with -Force to overwrite the snapshot."
}

# ------------------------------------------------------------ install kit ---

if ($RefreshOnly) {
    Write-Step "Kit install: skipped (-RefreshOnly)"
}
elseif ($Mode -eq 'subtree') {
    Write-Step "Installing the kit into $Prefix"

    $remotes = Invoke-Git @('-C', $root, 'remote') -StdOutOnly
    if (($remotes.Output -split $LF) -contains $RemoteName) {
        Write-Note "remote '$RemoteName' already configured"
    }
    elseif ($DryRun) {
        Write-Note "[dry-run] would run: git remote add $RemoteName $KitSource"
    }
    else {
        Invoke-Git @('-C', $root, 'remote', 'add', $RemoteName, $KitSource) | Out-Null
        Write-Ok "added remote '$RemoteName' -> $KitSource"
    }

    if ($DryRun) {
        Write-Note "[dry-run] would run: git subtree add --prefix $Prefix $RemoteName $KitRef --squash"
    }
    else {
        Invoke-Git @('-C', $root, 'fetch', $RemoteName, $KitRef) | Out-Null
        Invoke-Git @('-C', $root, 'subtree', 'add', '--prefix', $Prefix, $RemoteName, $KitRef, '--squash') | Out-Null
        Write-Ok 'vendored via git subtree (one commit created)'
    }
}
else {
    Write-Step "Installing the kit into $Prefix"
    if ($DryRun) {
        Write-Note "[dry-run] would copy $KitSource -> $target (excluding .git)"
    }
    else {
        if ($targetExists) { Remove-Item -LiteralPath $target -Recurse -Force }
        New-Item -ItemType Directory -Path $target -Force | Out-Null
        Get-ChildItem -LiteralPath $KitSource -Force |
            Where-Object { $_.Name -ne '.git' } |
            ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force }
        Get-ChildItem -LiteralPath $target -Recurse -Force -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -eq '__pycache__' -or $_.Name -eq '.pytest_cache' } |
            Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Ok 'copied snapshot (no upstream update path)'
    }
}

# -------------------------------------------------------------- fragments ---

Write-Step 'Merging Git fragments into the consumer root'

$ignoreFragment = Read-TextFile -Path (Join-Path $kitRoot 'templates/gitignore.agentic-planning-v3')
if ($null -eq $ignoreFragment) { Fail 'missing templates/gitignore.agentic-planning-v3' }
Merge-ManagedBlock -Path (Join-Path $root '.gitignore') -Body (Get-FragmentBody $ignoreFragment) -Label '.gitignore'

$attrFragment = Read-TextFile -Path (Join-Path $kitRoot 'templates/gitattributes.agentic-planning-v3')
if ($null -eq $attrFragment) { Fail 'missing templates/gitattributes.agentic-planning-v3' }
Merge-ManagedBlock -Path (Join-Path $root '.gitattributes') -Body (Get-FragmentBody $attrFragment) -Label '.gitattributes'

# ------------------------------------------------------------- CODEOWNERS ---

if ($SkipCodeowners) {
    Write-Step 'CODEOWNERS: skipped (-SkipCodeowners)'
}
else {
    Write-Step 'Merging CODEOWNERS'
    $ownersFragment = Read-TextFile -Path (Join-Path $kitRoot 'templates/CODEOWNERS.agentic-planning-v3')
    if ($null -eq $ownersFragment) { Fail 'missing templates/CODEOWNERS.agentic-planning-v3' }
    $ownersBody = Get-FragmentBody $ownersFragment
    $ownersBody = $ownersBody.Replace('/agentic-planning-kit/', '/' + $Prefix + '/')
    if ($CodeownersOwner -eq '@myteam') {
        Write-Note "using the default owner '@myteam'; pass -CodeownersOwner to set your team handle."
    }
    else {
        $ownersBody = $ownersBody.Replace('@myteam', $CodeownersOwner)
    }
    Merge-ManagedBlock -Path (Join-Path $root '.github/CODEOWNERS') -Body $ownersBody -Label '.github/CODEOWNERS'
}

# --------------------------------------------------------------------- CI ---

if ($SkipCi) {
    Write-Step 'CI workflow: skipped (-SkipCi)'
}
else {
    Write-Step 'Installing the CI workflow'
    $workflowTarget = Join-Path $root '.github/workflows/agentic-planning-v3.yml'
    if ((Test-Path -LiteralPath $workflowTarget) -and -not $Force) {
        Write-Alert 'workflow already exists; left untouched (re-run with -Force to overwrite)'
    }
    else {
        $workflow = Read-TextFile -Path (Join-Path $kitRoot 'templates/ci/github-actions-agentic-planning-v3.yml')
        if ($null -eq $workflow) { Fail 'missing templates/ci/github-actions-agentic-planning-v3.yml' }
        $workflow = Get-FragmentBody $workflow
        $workflow = $workflow -replace 'KIT_PATH:\s*agentic-planning-kit', ('KIT_PATH: ' + $Prefix)
        $header = "# Generated by $Prefix/tools/install_kit. KIT_PATH points at the vendored kit."
        Write-TextFile -Path $workflowTarget -Text ($header + $LF + $workflow)
        if (-not $DryRun) { Write-Ok 'wrote .github/workflows/agentic-planning-v3.yml' }
    }
}

# ----------------------------------------------------------------- verify ---

Write-Step 'Verifying the control plane'

$python = $null
foreach ($candidate in @('python', 'py')) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) { $python = $candidate; break }
}
$tool = Join-Path $target 'tools/agentic_planning_v3.py'

if (-not $python) {
    Write-Alert 'no local Python found; CI installs its own, but you cannot run the validator here.'
}
elseif (-not (Test-Path -LiteralPath $tool)) {
    Write-Note 'validator not present yet; skipping check'
}
else {
    & $python $tool --help *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "validator responds: $python $Prefix/tools/agentic_planning_v3.py"
    }
    else {
        Write-Alert "validator returned exit code $LASTEXITCODE; check the Python version (3.11+)."
    }
}

# ------------------------------------------------------------- next steps ---

Write-Step 'Next steps'
Write-Host ''
Write-Host '  1. Review and commit the merged fragments:' -ForegroundColor White
Write-Host "       git -C `"$root`" status"
Write-Host ''
Write-Host '  2. Set the CODEOWNERS owner to your team handle when you have one, then protect main:' -ForegroundColor White
Write-Host '       no direct pushes, required checks, serialized merge/integration queue.'
Write-Host ''
Write-Host '  3. Establish planning state from a session opened at the consumer root:' -ForegroundColor White
Write-Host "       greenfield  -> $Prefix/TRIGGERS.md route 3 (PROPOSE)"
Write-Host "       brownfield  -> $Prefix/TRIGGERS.md route 1 (OBSERVE), then route 5"
Write-Host "       existing v2 -> $Prefix/TRIGGERS.md route M (PLAN)"
Write-Host ''
if ($Mode -eq 'subtree') {
    Write-Host '  Update the kit later with:' -ForegroundColor White
    Write-Host "       git -C `"$root`" subtree pull --prefix $Prefix $RemoteName $KitRef --squash"
    Write-Host ''
}
