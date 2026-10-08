Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\user\.gemini\antigravity\brain\daa3b83a-2afa-46e8-ab04-478eb2c56c09\.user_uploaded\media_1791496678723_cf23bfc3.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $src.Width
$h = $src.Height
Write-Host "Source image size: $w x $h"

# Create a transparent bitmap
$dest = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Background color is the blue background (around R:30-60, G:40-80, B:210-255)
# White logo is (R>200, G>200, B>200)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)
        # Check if it's the blue background vs the white logo
        # In this logo, the glyph is white, background is blue
        if ($p.R -gt 180 -and $p.G -gt 180 -and $p.B -gt 180) {
            # White shape - keep it pure white with original opacity
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        } elseif ($p.B -gt $p.R + 60 -and $p.B -gt $p.G + 40) {
            # Clearly blue background - make transparent
            $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Antialiasing edge between white and blue
            # Compute brightness / distance from blue vs white
            $whiteScore = ($p.R + $p.G + $p.B) / (3 * 255.0)
            if ($whiteScore -gt 0.6) {
                $alpha = [int]([Math]::Min(255, [Math]::Max(0, ($whiteScore - 0.4) * 425)))
                $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
            } else {
                $dest.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }
}

# Ensure directories exist
$publicDir = "c:\Users\user\Desktop\MASTERED OPS ERP\frontend\public"
$assetsDir = "c:\Users\user\Desktop\MASTERED OPS ERP\frontend\src\assets"
if (!(Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir -Force }
if (!(Test-Path $assetsDir)) { New-Item -ItemType Directory -Path $assetsDir -Force }

# Save full size transparent logo (white version)
$dest.Save("$publicDir\logo-white-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$dest.Save("$assetsDir\logo-white-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Also create blue-on-transparent version (brand blue #1e3a8a or #2563eb) for light backgrounds
$destBlue = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $dest.GetPixel($x, $y)
        if ($p.A -gt 0) {
            $destBlue.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, 30, 58, 138))
        } else {
            $destBlue.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}
$destBlue.Save("$publicDir\logo-blue-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destBlue.Save("$assetsDir\logo-blue-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Function to resize and save icons
function Save-ResizedIcon($sourceBitmap, $width, $height, $outPath, $bgColor) {
    $resized = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    if ($bgColor -ne $null) {
        $g.Clear($bgColor)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }
    
    # Draw centered
    $padding = [int]($width * 0.1)
    $drawW = $width - ($padding * 2)
    $drawH = $height - ($padding * 2)
    $g.DrawImage($sourceBitmap, $padding, $padding, $drawW, $drawH)
    $g.Dispose()
    
    $resized.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
}

$brandBlueColor = [System.Drawing.Color]::FromArgb(255, 30, 58, 138) # #1e3a8a brand blue

# PWA icons (with solid brand background for square app icons on Android / Windows / iOS)
Save-ResizedIcon $dest 192 192 "$publicDir\pwa-192x192.png" $brandBlueColor
Save-ResizedIcon $dest 512 512 "$publicDir\pwa-512x512.png" $brandBlueColor
Save-ResizedIcon $dest 180 180 "$publicDir\apple-touch-icon.png" $brandBlueColor
Save-ResizedIcon $dest 64 64 "$publicDir\favicon-64x64.png" $brandBlueColor
Save-ResizedIcon $dest 32 32 "$publicDir\favicon-32x32.png" $brandBlueColor

# Also transparent PWA icons
Save-ResizedIcon $dest 192 192 "$publicDir\icon-192-maskable.png" $null
Save-ResizedIcon $dest 512 512 "$publicDir\icon-512-maskable.png" $null

$src.Dispose()
$dest.Dispose()
$destBlue.Dispose()
Write-Host "All icons and transparent logos generated successfully!"
