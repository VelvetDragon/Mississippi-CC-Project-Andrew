# PowerShell script to pull blog changes from GitHub
# Run this script whenever the professor publishes a blog post

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pulling Blog Changes from GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "ERROR: Not in a git repository!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

# Check git status
Write-Host "Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain

if ($status) {
    Write-Host ""
    Write-Host "WARNING: You have uncommitted changes!" -ForegroundColor Yellow
    Write-Host "Uncommitted files:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $response = Read-Host "Do you want to stash your changes before pulling? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Stashing changes..." -ForegroundColor Yellow
        git stash
        Write-Host "Changes stashed successfully." -ForegroundColor Green
    } else {
        Write-Host "Pulling anyway (may cause merge conflicts)..." -ForegroundColor Yellow
    }
}

# Fetch latest changes
Write-Host ""
Write-Host "Fetching latest changes from GitHub..." -ForegroundColor Yellow
git fetch origin main

# Check if there are new changes
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/main

if ($localCommit -eq $remoteCommit) {
    Write-Host ""
    Write-Host "✓ Already up to date! No new changes to pull." -ForegroundColor Green
    exit 0
}

# Pull changes
Write-Host ""
Write-Host "Pulling changes from GitHub..." -ForegroundColor Yellow
$pullResult = git pull origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully pulled latest changes!" -ForegroundColor Green
    Write-Host ""
    
    # Show what changed
    Write-Host "Recent changes:" -ForegroundColor Cyan
    git log --oneline -5
    
    # Check if blog files changed
    $blogChanges = git diff --name-only HEAD~1 HEAD | Select-String "src/content/blog"
    
    if ($blogChanges) {
        Write-Host ""
        Write-Host "Blog files updated:" -ForegroundColor Green
        $blogChanges | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    }
    
    # Restore stashed changes if any
    if (git stash list) {
        Write-Host ""
        $response = Read-Host "Do you want to restore your stashed changes? (y/n)"
        if ($response -eq 'y' -or $response -eq 'Y') {
            git stash pop
            Write-Host "Stashed changes restored." -ForegroundColor Green
        }
    }
} else {
    Write-Host ""
    Write-Host "✗ Error pulling changes!" -ForegroundColor Red
    Write-Host "You may have merge conflicts. Run 'git status' to see details." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Done!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

