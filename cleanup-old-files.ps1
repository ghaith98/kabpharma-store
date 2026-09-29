# Deletes the old copies of files that moved in this update.
# Run from the project folder BEFORE copying in the update files:
#   powershell -ExecutionPolicy Bypass -File .\cleanup-old-files.ps1

if (Test-Path -LiteralPath 'app\admin-mobile\layout.tsx') { Remove-Item -LiteralPath 'app\admin-mobile\layout.tsx' -Force; Write-Host 'removed app\admin-mobile\layout.tsx' }
if (Test-Path -LiteralPath 'app\admin-mobile\page.tsx') { Remove-Item -LiteralPath 'app\admin-mobile\page.tsx' -Force; Write-Host 'removed app\admin-mobile\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\AdminLayoutShell.tsx') { Remove-Item -LiteralPath 'app\admin\AdminLayoutShell.tsx' -Force; Write-Host 'removed app\admin\AdminLayoutShell.tsx' }
if (Test-Path -LiteralPath 'app\admin\AdminShell.tsx') { Remove-Item -LiteralPath 'app\admin\AdminShell.tsx' -Force; Write-Host 'removed app\admin\AdminShell.tsx' }
if (Test-Path -LiteralPath 'app\admin\OnlineUsersCard.tsx') { Remove-Item -LiteralPath 'app\admin\OnlineUsersCard.tsx' -Force; Write-Host 'removed app\admin\OnlineUsersCard.tsx' }
if (Test-Path -LiteralPath 'app\admin\archived-orders\page.tsx') { Remove-Item -LiteralPath 'app\admin\archived-orders\page.tsx' -Force; Write-Host 'removed app\admin\archived-orders\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\banners\main\page.tsx') { Remove-Item -LiteralPath 'app\admin\banners\main\page.tsx' -Force; Write-Host 'removed app\admin\banners\main\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\banners\new-arrivals\page.tsx') { Remove-Item -LiteralPath 'app\admin\banners\new-arrivals\page.tsx' -Force; Write-Host 'removed app\admin\banners\new-arrivals\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\banners\page.tsx') { Remove-Item -LiteralPath 'app\admin\banners\page.tsx' -Force; Write-Host 'removed app\admin\banners\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\brands\page.tsx') { Remove-Item -LiteralPath 'app\admin\brands\page.tsx' -Force; Write-Host 'removed app\admin\brands\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\categories\page.tsx') { Remove-Item -LiteralPath 'app\admin\categories\page.tsx' -Force; Write-Host 'removed app\admin\categories\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\concerns\page.tsx') { Remove-Item -LiteralPath 'app\admin\concerns\page.tsx' -Force; Write-Host 'removed app\admin\concerns\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\coupons\page.tsx') { Remove-Item -LiteralPath 'app\admin\coupons\page.tsx' -Force; Write-Host 'removed app\admin\coupons\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\delivery-companies\page.tsx') { Remove-Item -LiteralPath 'app\admin\delivery-companies\page.tsx' -Force; Write-Host 'removed app\admin\delivery-companies\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\delivery-orders\manage\page.tsx') { Remove-Item -LiteralPath 'app\admin\delivery-orders\manage\page.tsx' -Force; Write-Host 'removed app\admin\delivery-orders\manage\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\delivery-orders\page.tsx') { Remove-Item -LiteralPath 'app\admin\delivery-orders\page.tsx' -Force; Write-Host 'removed app\admin\delivery-orders\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\delivery\page.tsx') { Remove-Item -LiteralPath 'app\admin\delivery\page.tsx' -Force; Write-Host 'removed app\admin\delivery\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\drivers\page.tsx') { Remove-Item -LiteralPath 'app\admin\drivers\page.tsx' -Force; Write-Host 'removed app\admin\drivers\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\layout.tsx') { Remove-Item -LiteralPath 'app\admin\layout.tsx' -Force; Write-Host 'removed app\admin\layout.tsx' }
if (Test-Path -LiteralPath 'app\admin\loading.tsx') { Remove-Item -LiteralPath 'app\admin\loading.tsx' -Force; Write-Host 'removed app\admin\loading.tsx' }
if (Test-Path -LiteralPath 'app\admin\login\page.tsx') { Remove-Item -LiteralPath 'app\admin\login\page.tsx' -Force; Write-Host 'removed app\admin\login\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\orders\PrintOrderButton.tsx') { Remove-Item -LiteralPath 'app\admin\orders\PrintOrderButton.tsx' -Force; Write-Host 'removed app\admin\orders\PrintOrderButton.tsx' }
if (Test-Path -LiteralPath 'app\admin\orders\page.tsx') { Remove-Item -LiteralPath 'app\admin\orders\page.tsx' -Force; Write-Host 'removed app\admin\orders\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\orders\print\page.tsx') { Remove-Item -LiteralPath 'app\admin\orders\print\page.tsx' -Force; Write-Host 'removed app\admin\orders\print\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\page.tsx') { Remove-Item -LiteralPath 'app\admin\page.tsx' -Force; Write-Host 'removed app\admin\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\payment-settings\page.tsx') { Remove-Item -LiteralPath 'app\admin\payment-settings\page.tsx' -Force; Write-Host 'removed app\admin\payment-settings\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\products\page.tsx') { Remove-Item -LiteralPath 'app\admin\products\page.tsx' -Force; Write-Host 'removed app\admin\products\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\promotions\page.tsx') { Remove-Item -LiteralPath 'app\admin\promotions\page.tsx' -Force; Write-Host 'removed app\admin\promotions\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\reviews\page.tsx') { Remove-Item -LiteralPath 'app\admin\reviews\page.tsx' -Force; Write-Host 'removed app\admin\reviews\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\users\page.tsx') { Remove-Item -LiteralPath 'app\admin\users\page.tsx' -Force; Write-Host 'removed app\admin\users\page.tsx' }
if (Test-Path -LiteralPath 'app\delivery-company\layout.tsx') { Remove-Item -LiteralPath 'app\delivery-company\layout.tsx' -Force; Write-Host 'removed app\delivery-company\layout.tsx' }
if (Test-Path -LiteralPath 'app\delivery-company\login\page.tsx') { Remove-Item -LiteralPath 'app\delivery-company\login\page.tsx' -Force; Write-Host 'removed app\delivery-company\login\page.tsx' }
if (Test-Path -LiteralPath 'app\delivery-company\page.tsx') { Remove-Item -LiteralPath 'app\delivery-company\page.tsx' -Force; Write-Host 'removed app\delivery-company\page.tsx' }
if (Test-Path -LiteralPath 'app\delivery\layout.tsx') { Remove-Item -LiteralPath 'app\delivery\layout.tsx' -Force; Write-Host 'removed app\delivery\layout.tsx' }
if (Test-Path -LiteralPath 'app\delivery\page.tsx') { Remove-Item -LiteralPath 'app\delivery\page.tsx' -Force; Write-Host 'removed app\delivery\page.tsx' }
if (Test-Path -LiteralPath 'app\driver\DriverPullToRefresh.tsx') { Remove-Item -LiteralPath 'app\driver\DriverPullToRefresh.tsx' -Force; Write-Host 'removed app\driver\DriverPullToRefresh.tsx' }
if (Test-Path -LiteralPath 'app\driver\layout.tsx') { Remove-Item -LiteralPath 'app\driver\layout.tsx' -Force; Write-Host 'removed app\driver\layout.tsx' }
if (Test-Path -LiteralPath 'app\driver\login\page.tsx') { Remove-Item -LiteralPath 'app\driver\login\page.tsx' -Force; Write-Host 'removed app\driver\login\page.tsx' }
if (Test-Path -LiteralPath 'app\driver\my-orders\page.tsx') { Remove-Item -LiteralPath 'app\driver\my-orders\page.tsx' -Force; Write-Host 'removed app\driver\my-orders\page.tsx' }
if (Test-Path -LiteralPath 'app\driver\page.tsx') { Remove-Item -LiteralPath 'app\driver\page.tsx' -Force; Write-Host 'removed app\driver\page.tsx' }
if (Test-Path -LiteralPath 'app\about\layout.tsx') { Remove-Item -LiteralPath 'app\about\layout.tsx' -Force; Write-Host 'removed app\about\layout.tsx' }
if (Test-Path -LiteralPath 'app\about\page.tsx') { Remove-Item -LiteralPath 'app\about\page.tsx' -Force; Write-Host 'removed app\about\page.tsx' }
if (Test-Path -LiteralPath 'app\account-information\page.tsx') { Remove-Item -LiteralPath 'app\account-information\page.tsx' -Force; Write-Host 'removed app\account-information\page.tsx' }
if (Test-Path -LiteralPath 'app\best-sellers\loading.tsx') { Remove-Item -LiteralPath 'app\best-sellers\loading.tsx' -Force; Write-Host 'removed app\best-sellers\loading.tsx' }
if (Test-Path -LiteralPath 'app\best-sellers\page.tsx') { Remove-Item -LiteralPath 'app\best-sellers\page.tsx' -Force; Write-Host 'removed app\best-sellers\page.tsx' }
if (Test-Path -LiteralPath 'app\brands\[slug]\page.tsx') { Remove-Item -LiteralPath 'app\brands\[slug]\page.tsx' -Force; Write-Host 'removed app\brands\[slug]\page.tsx' }
if (Test-Path -LiteralPath 'app\brands\page.tsx') { Remove-Item -LiteralPath 'app\brands\page.tsx' -Force; Write-Host 'removed app\brands\page.tsx' }
if (Test-Path -LiteralPath 'app\cart\layout.tsx') { Remove-Item -LiteralPath 'app\cart\layout.tsx' -Force; Write-Host 'removed app\cart\layout.tsx' }
if (Test-Path -LiteralPath 'app\cart\page.tsx') { Remove-Item -LiteralPath 'app\cart\page.tsx' -Force; Write-Host 'removed app\cart\page.tsx' }
if (Test-Path -LiteralPath 'app\checkout\layout.tsx') { Remove-Item -LiteralPath 'app\checkout\layout.tsx' -Force; Write-Host 'removed app\checkout\layout.tsx' }
if (Test-Path -LiteralPath 'app\checkout\page.tsx') { Remove-Item -LiteralPath 'app\checkout\page.tsx' -Force; Write-Host 'removed app\checkout\page.tsx' }
if (Test-Path -LiteralPath 'app\contact\layout.tsx') { Remove-Item -LiteralPath 'app\contact\layout.tsx' -Force; Write-Host 'removed app\contact\layout.tsx' }
if (Test-Path -LiteralPath 'app\contact\page.tsx') { Remove-Item -LiteralPath 'app\contact\page.tsx' -Force; Write-Host 'removed app\contact\page.tsx' }
if (Test-Path -LiteralPath 'app\error.tsx') { Remove-Item -LiteralPath 'app\error.tsx' -Force; Write-Host 'removed app\error.tsx' }
if (Test-Path -LiteralPath 'app\layout.tsx') { Remove-Item -LiteralPath 'app\layout.tsx' -Force; Write-Host 'removed app\layout.tsx' }
if (Test-Path -LiteralPath 'app\loading.tsx') { Remove-Item -LiteralPath 'app\loading.tsx' -Force; Write-Host 'removed app\loading.tsx' }
if (Test-Path -LiteralPath 'app\login\layout.tsx') { Remove-Item -LiteralPath 'app\login\layout.tsx' -Force; Write-Host 'removed app\login\layout.tsx' }
if (Test-Path -LiteralPath 'app\login\page.tsx') { Remove-Item -LiteralPath 'app\login\page.tsx' -Force; Write-Host 'removed app\login\page.tsx' }
if (Test-Path -LiteralPath 'app\needs\[id]\loading.tsx') { Remove-Item -LiteralPath 'app\needs\[id]\loading.tsx' -Force; Write-Host 'removed app\needs\[id]\loading.tsx' }
if (Test-Path -LiteralPath 'app\needs\[id]\page.tsx') { Remove-Item -LiteralPath 'app\needs\[id]\page.tsx' -Force; Write-Host 'removed app\needs\[id]\page.tsx' }
if (Test-Path -LiteralPath 'app\new-arrivals\loading.tsx') { Remove-Item -LiteralPath 'app\new-arrivals\loading.tsx' -Force; Write-Host 'removed app\new-arrivals\loading.tsx' }
if (Test-Path -LiteralPath 'app\new-arrivals\page.tsx') { Remove-Item -LiteralPath 'app\new-arrivals\page.tsx' -Force; Write-Host 'removed app\new-arrivals\page.tsx' }
if (Test-Path -LiteralPath 'app\not-found.tsx') { Remove-Item -LiteralPath 'app\not-found.tsx' -Force; Write-Host 'removed app\not-found.tsx' }
if (Test-Path -LiteralPath 'app\orders\[id]\loading.tsx') { Remove-Item -LiteralPath 'app\orders\[id]\loading.tsx' -Force; Write-Host 'removed app\orders\[id]\loading.tsx' }
if (Test-Path -LiteralPath 'app\orders\[id]\page.tsx') { Remove-Item -LiteralPath 'app\orders\[id]\page.tsx' -Force; Write-Host 'removed app\orders\[id]\page.tsx' }
if (Test-Path -LiteralPath 'app\orders\layout.tsx') { Remove-Item -LiteralPath 'app\orders\layout.tsx' -Force; Write-Host 'removed app\orders\layout.tsx' }
if (Test-Path -LiteralPath 'app\orders\loading.tsx') { Remove-Item -LiteralPath 'app\orders\loading.tsx' -Force; Write-Host 'removed app\orders\loading.tsx' }
if (Test-Path -LiteralPath 'app\orders\page.tsx') { Remove-Item -LiteralPath 'app\orders\page.tsx' -Force; Write-Host 'removed app\orders\page.tsx' }
if (Test-Path -LiteralPath 'app\page.tsx') { Remove-Item -LiteralPath 'app\page.tsx' -Force; Write-Host 'removed app\page.tsx' }
if (Test-Path -LiteralPath 'app\payment\layout.tsx') { Remove-Item -LiteralPath 'app\payment\layout.tsx' -Force; Write-Host 'removed app\payment\layout.tsx' }
if (Test-Path -LiteralPath 'app\payment\page.tsx') { Remove-Item -LiteralPath 'app\payment\page.tsx' -Force; Write-Host 'removed app\payment\page.tsx' }
if (Test-Path -LiteralPath 'app\privacy-policy\layout.tsx') { Remove-Item -LiteralPath 'app\privacy-policy\layout.tsx' -Force; Write-Host 'removed app\privacy-policy\layout.tsx' }
if (Test-Path -LiteralPath 'app\privacy-policy\page.tsx') { Remove-Item -LiteralPath 'app\privacy-policy\page.tsx' -Force; Write-Host 'removed app\privacy-policy\page.tsx' }
if (Test-Path -LiteralPath 'app\products\[id]\loading.tsx') { Remove-Item -LiteralPath 'app\products\[id]\loading.tsx' -Force; Write-Host 'removed app\products\[id]\loading.tsx' }
if (Test-Path -LiteralPath 'app\products\[id]\page.tsx') { Remove-Item -LiteralPath 'app\products\[id]\page.tsx' -Force; Write-Host 'removed app\products\[id]\page.tsx' }
if (Test-Path -LiteralPath 'app\products\loading.tsx') { Remove-Item -LiteralPath 'app\products\loading.tsx' -Force; Write-Host 'removed app\products\loading.tsx' }
if (Test-Path -LiteralPath 'app\products\page.tsx') { Remove-Item -LiteralPath 'app\products\page.tsx' -Force; Write-Host 'removed app\products\page.tsx' }
if (Test-Path -LiteralPath 'app\profile\layout.tsx') { Remove-Item -LiteralPath 'app\profile\layout.tsx' -Force; Write-Host 'removed app\profile\layout.tsx' }
if (Test-Path -LiteralPath 'app\profile\page.tsx') { Remove-Item -LiteralPath 'app\profile\page.tsx' -Force; Write-Host 'removed app\profile\page.tsx' }
if (Test-Path -LiteralPath 'app\refund-policy\layout.tsx') { Remove-Item -LiteralPath 'app\refund-policy\layout.tsx' -Force; Write-Host 'removed app\refund-policy\layout.tsx' }
if (Test-Path -LiteralPath 'app\refund-policy\page.tsx') { Remove-Item -LiteralPath 'app\refund-policy\page.tsx' -Force; Write-Host 'removed app\refund-policy\page.tsx' }
if (Test-Path -LiteralPath 'app\search\layout.tsx') { Remove-Item -LiteralPath 'app\search\layout.tsx' -Force; Write-Host 'removed app\search\layout.tsx' }
if (Test-Path -LiteralPath 'app\search\page.tsx') { Remove-Item -LiteralPath 'app\search\page.tsx' -Force; Write-Host 'removed app\search\page.tsx' }
if (Test-Path -LiteralPath 'app\shop-by-need\[id]\loading.tsx') { Remove-Item -LiteralPath 'app\shop-by-need\[id]\loading.tsx' -Force; Write-Host 'removed app\shop-by-need\[id]\loading.tsx' }
if (Test-Path -LiteralPath 'app\shop-by-need\[id]\page.tsx') { Remove-Item -LiteralPath 'app\shop-by-need\[id]\page.tsx' -Force; Write-Host 'removed app\shop-by-need\[id]\page.tsx' }
if (Test-Path -LiteralPath 'app\signup\layout.tsx') { Remove-Item -LiteralPath 'app\signup\layout.tsx' -Force; Write-Host 'removed app\signup\layout.tsx' }
if (Test-Path -LiteralPath 'app\signup\page.tsx') { Remove-Item -LiteralPath 'app\signup\page.tsx' -Force; Write-Host 'removed app\signup\page.tsx' }
if (Test-Path -LiteralPath 'app\terms\layout.tsx') { Remove-Item -LiteralPath 'app\terms\layout.tsx' -Force; Write-Host 'removed app\terms\layout.tsx' }
if (Test-Path -LiteralPath 'app\terms\page.tsx') { Remove-Item -LiteralPath 'app\terms\page.tsx' -Force; Write-Host 'removed app\terms\page.tsx' }
if (Test-Path -LiteralPath 'app\wishlist\layout.tsx') { Remove-Item -LiteralPath 'app\wishlist\layout.tsx' -Force; Write-Host 'removed app\wishlist\layout.tsx' }
if (Test-Path -LiteralPath 'app\wishlist\page.tsx') { Remove-Item -LiteralPath 'app\wishlist\page.tsx' -Force; Write-Host 'removed app\wishlist\page.tsx' }
if (Test-Path -LiteralPath 'app\admin\payment-proofs\page.tsx') { Remove-Item -LiteralPath 'app\admin\payment-proofs\page.tsx' -Force; Write-Host 'removed app\admin\payment-proofs\page.tsx' }

# Remove folders left empty by the move
if (Test-Path -LiteralPath 'app\admin') { Get-ChildItem -LiteralPath 'app\admin' -Recurse -Directory | Sort-Object FullName -Descending | Where-Object { -not (Get-ChildItem -LiteralPath $_.FullName -Force) } | Remove-Item -Force; if (-not (Get-ChildItem -LiteralPath 'app\admin' -Recurse -File -Force)) { Remove-Item -LiteralPath 'app\admin' -Recurse -Force; Write-Host 'removed folder app\admin' } }
if (Test-Path -LiteralPath 'app\admin-mobile') { Get-ChildItem -LiteralPath 'app\admin-mobile' -Recurse -Directory | Sort-Object FullName -Descending | Where-Object { -not (Get-ChildItem -LiteralPath $_.FullName -Force) } | Remove-Item -Force; if (-not (Get-ChildItem -LiteralPath 'app\admin-mobile' -Recurse -File -Force)) { Remove-Item -LiteralPath 'app\admin-mobile' -Recurse -Force; Write-Host 'removed folder app\admin-mobile' } }
if (Test-Path -LiteralPath 'app\driver') { Get-ChildItem -LiteralPath 'app\driver' -Recurse -Directory | Sort-Object FullName -Descending | Where-Object { -not (Get-ChildItem -LiteralPath $_.FullName -Force) } | Remove-Item -Force; if (-not (Get-ChildItem -LiteralPath 'app\driver' -Recurse -File -Force)) { Remove-Item -LiteralPath 'app\driver' -Recurse -Force; Write-Host 'removed folder app\driver' } }
if (Test-Path -LiteralPath 'app\delivery-company') { Get-ChildItem -LiteralPath 'app\delivery-company' -Recurse -Directory | Sort-Object FullName -Descending | Where-Object { -not (Get-ChildItem -LiteralPath $_.FullName -Force) } | Remove-Item -Force; if (-not (Get-ChildItem -LiteralPath 'app\delivery-company' -Recurse -File -Force)) { Remove-Item -LiteralPath 'app\delivery-company' -Recurse -Force; Write-Host 'removed folder app\delivery-company' } }
if (Test-Path -LiteralPath 'app\delivery') { Get-ChildItem -LiteralPath 'app\delivery' -Recurse -Directory | Sort-Object FullName -Descending | Where-Object { -not (Get-ChildItem -LiteralPath $_.FullName -Force) } | Remove-Item -Force; if (-not (Get-ChildItem -LiteralPath 'app\delivery' -Recurse -File -Force)) { Remove-Item -LiteralPath 'app\delivery' -Recurse -Force; Write-Host 'removed folder app\delivery' } }
Write-Host 'Cleanup finished.'
