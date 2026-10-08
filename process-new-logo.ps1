Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\user\.gemini\antigravity\brain\daa3b83a-2afa-46e8-ab04-478eb2c56c09\.user_uploaded\media_1791499184911_a8ba1806.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $src.Width
$h = $src.Height
Write-Host "Source image size: $w x $h"

# Create a 32-bit ARGB bitmap for the transparent colored logo
$destColored = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
# Also create an all-white version for dark headers/sidebars
$destWhite = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Background is white (R,G,B close to 255)
# Logo has blue colors (R: 0-60, G: 0-100, B: 150-255) and dark navy (R: 0-30, G: 0-50, B: 120-180)
for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
        $p = $src.GetPixel($x, $y)
        
        # Calculate how close the pixel is to white (255, 255, 255)
        # Background is white if R, G, B are all high
        $minChannel = [Math]::Min($p.R, [Math]::Min($p.G, $p.B))
        $maxChannel = [Math]::Max($p.R, [Math]::Max($p.G, $p.B))
        
        if ($minChannel -ge 245) {
            # Pure white background -> fully transparent
            $destColored.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            $destWhite.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($minChannel -gt 210) {
            # Antialiasing edge near white background
            # Compute alpha based on distance from white
            $whiteness = ($p.R + $p.G + $p.B) / (3.0 * 255.0)
            $alpha = [int]([Math]::Max(0, [Math]::Min(255, (1.0 - $whiteness) * 255.0 * 5.0)))
            
            # Decontaminate color (remove white bleed)
            $factor = if ($alpha -gt 0) { 255.0 / $alpha } else { 1.0 }
            $r = [int]([Math]::Max(0, [Math]::Min(255, ($p.R - 255 * (1.0 - $alpha/255.0)) * $factor)))
            $g = [int]([Math]::Max(0, [Math]::Min(255, ($p.G - 255 * (1.0 - $alpha/255.0)) * $factor)))
            $b = [int]([Math]::Max(0, [Math]::Min(255, ($p.B - 255 * (1.0 - $alpha/255.0)) * $factor)))
            
            $destColored.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $r, $g, $b))
            $destWhite.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
        } else {
            # Solid logo pixel
            $destColored.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
            $destWhite.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        }
    }
}

$publicDir = "c:\Users\user\Desktop\MASTERED OPS ERP\frontend\public"
$assetsDir = "c:\Users\user\Desktop\MASTERED OPS ERP\frontend\src\assets"

# Save master transparent images
$destColored.Save("$publicDir\logo-blue-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destColored.Save("$assetsDir\logo-blue-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destColored.Save("$publicDir\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)

$destWhite.Save("$publicDir\logo-white-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)
$destWhite.Save("$assetsDir\logo-white-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Function to resize with high quality bicubic interpolation
function Create-Icon($sourceBitmap, $width, $height, $outPath, $bgColor) {
    $resized = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($resized)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    if ($bgColor -ne $null) {
        $g.Clear($bgColor)
        $padding = [int]($width * 0.12)
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
        $padding = 0
    }
    
    $drawW = $width - ($padding * 2)
    $drawH = $height - ($padding * 2)
    $g.DrawImage($sourceBitmap, $padding, $padding, $drawW, $drawH)
    $g.Dispose()
    
    $resized.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $resized.Dispose()
}

$appBrandBg = [System.Drawing.Color]::FromArgb(255, 6, 27, 77) # #061B4D deep brand navy

# 1. PWA & Web App Icons (with solid navy background for Android WebAPK & iOS)
Create-Icon $destColored 512 512 "$publicDir\pwa-512x512.png" $appBrandBg
Create-Icon $destColored 192 192 "$publicDir\pwa-192x192.png" $appBrandBg
Create-Icon $destColored 180 180 "$publicDir\apple-touch-icon.png" $appBrandBg

# 2. Transparent maskable icons & favicons
Create-Icon $destColored 512 512 "$publicDir\icon-512-maskable.png" $null
Create-Icon $destColored 192 192 "$publicDir\icon-192-maskable.png" $null
Create-Icon $destColored 64 64 "$publicDir\favicon-64x64.png" $null
Create-Icon $destColored 32 32 "$publicDir\favicon-32x32.png" $null
Create-Icon $destColored 32 32 "$publicDir\favicon.png" $null

$src.Dispose()
$destColored.Dispose()
$destWhite.Dispose()
Write-Host "New logo processed, transparent PNGs and multi-platform icons generated successfully!"
