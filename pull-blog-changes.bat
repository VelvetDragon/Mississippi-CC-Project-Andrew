@echo off
REM Windows batch script to pull blog changes from GitHub
REM Double-click this file or run from command prompt

echo ========================================
echo   Pulling Blog Changes from GitHub
echo ========================================
echo.

REM Check if we're in a git repository
if not exist .git (
    echo ERROR: Not in a git repository!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check git status
echo Checking git status...
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo WARNING: You may have uncommitted changes!
    echo.
    set /p stash="Do you want to stash changes before pulling? (y/n): "
    if /i "%stash%"=="y" (
        echo Stashing changes...
        git stash
        echo Changes stashed successfully.
    )
)

REM Fetch latest changes
echo.
echo Fetching latest changes from GitHub...
git fetch origin main

REM Pull changes
echo.
echo Pulling changes from GitHub...
git pull origin main

if %errorlevel% equ 0 (
    echo.
    echo Successfully pulled latest changes!
    echo.
    echo Recent changes:
    git log --oneline -5
    
    REM Restore stashed changes if any
    git stash list >nul 2>&1
    if %errorlevel% equ 0 (
        echo.
        set /p restore="Do you want to restore your stashed changes? (y/n): "
        if /i "%restore%"=="y" (
            git stash pop
            echo Stashed changes restored.
        )
    )
) else (
    echo.
    echo Error pulling changes!
    echo You may have merge conflicts. Run 'git status' to see details.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Done!
echo ========================================
pause

