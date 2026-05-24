# Build script for copy-message-id Firefox extension
# Equivalent to: make (uses PowerShell instead of zip)
# Uses ZipArchive directly so entry names use forward slashes (required by ZIP spec / Thunderbird).

param([string]$OutFile = "copy-message-id@j.kahn.xpi")

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$Root = $PSScriptRoot

$Files = @(
    "manifest.json",
    "background.js",
    "LICENSE",
    "popup/popup.html",
    "popup/popup.css",
    "popup/popup.js",
    "options/options.html",
    "options/options.css",
    "options/options.js",
    "icons/button.png"
)

foreach ($f in $Files) {
    $abs = Join-Path $Root ($f -replace '/', '\')
    if (-not (Test-Path $abs)) { Write-Error "Missing: $abs"; exit 1 }
}

$OutPath = Join-Path $Root $OutFile
if (Test-Path $OutPath) { Remove-Item $OutPath -Force }

$stream = [System.IO.File]::Open($OutPath, 'Create')
$zip    = [System.IO.Compression.ZipArchive]::new($stream, 'Create')

foreach ($f in $Files) {
    $abs   = Join-Path $Root ($f -replace '/', '\')
    $entry = $zip.CreateEntry($f)          # forward-slash entry name
    $dst   = $entry.Open()
    $src   = [System.IO.File]::OpenRead($abs)
    $src.CopyTo($dst)
    $src.Dispose(); $dst.Dispose()
}

$zip.Dispose(); $stream.Dispose()
Write-Host "Built $OutFile"
