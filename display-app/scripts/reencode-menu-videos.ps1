param(
  [string]$InputDir = "..\Cocktail Menu Animation",
  [string]$OutputDir = "..\Cocktail Menu Animation Optimized"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg is required but not found in PATH."
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Get-ChildItem -Path $InputDir -Filter "*.mp4" | ForEach-Object {
  $inPath = $_.FullName
  $outPath = Join-Path $OutputDir $_.Name

  ffmpeg -y -i $inPath `
    -vf "scale='min(960,iw)':'min(960,ih)':force_original_aspect_ratio=decrease,fps=24" `
    -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p `
    -preset medium -crf 23 -g 48 -keyint_min 48 -sc_threshold 0 `
    -an -movflags +faststart `
    $outPath
}

Write-Host "Re-encoded menu videos written to: $OutputDir"
