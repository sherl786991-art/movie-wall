# One-click publish of the static movie wall to GitHub Pages.
# Prereq: GitHub CLI installed (winget install --id GitHub.cli -e) and
#         logged in (gh auth login -> GitHub.com -> HTTPS -> browser).
# Then run this file in PowerShell.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$REPO = 'HQY0558/movie-wall'

# 1. create repo (if missing) and push
$has = gh repo view $REPO *> $null
if ($LASTEXITCODE -ne 0) {
    gh repo create $REPO --public --source . --remote origin --push
} else {
    if (-not (git remote | Select-String '^origin$')) {
        git remote add origin "https://github.com/$REPO.git"
    }
    git push -u origin main
}

# 2. enable GitHub Pages on the main branch
gh api --method POST "repos/$REPO/pages" -f 'source[branch]=main' -f 'source[path]=/' *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Pages already enabled or needs Settings tweak.'
}

Write-Host ''
Write-Host 'Done. Site will be available at (wait 1-3 min after first build):'
Write-Host '  https://HQY0558.github.io/movie-wall/'
Write-Host ''
Write-Host 'Check build status:  gh api repos/HQY0558/movie-wall/pages'