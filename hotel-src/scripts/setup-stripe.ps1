# Connects 6ixPlanet to your Stripe account in one go. Run it yourself in PowerShell (the keys never go anywhere except Stripe and Cloudflare):
#     cd F:\Done\6habbo\hotel-demo
#     .\scripts\setup-stripe.ps1
#
# Before running it, once:
#   1. Make a free account at https://dashboard.stripe.com/register (stay in "Test mode" first: the switch is top right).
#   2. Open https://dashboard.stripe.com/test/apikeys and copy the "Secret key" (it starts with sk_test_). Click "Reveal" first.
# Then run this script and paste the key when it asks. It does the rest:
#   - checks that the key works,
#   - makes the Stripe webhook that tells the game a payment arrived (and fetches its signing secret),
#   - saves both as secrets on the game's Cloudflare Worker.
# Later, to go live: switch Stripe to live mode, copy the live secret key (sk_live_...) and run this script again.
$ErrorActionPreference = "Stop"
$webhookUrl = "https://sixplanet-api.sixplanet.workers.dev/pay/webhook"
$server = Join-Path (Split-Path -Parent $PSScriptRoot) "server"

$secure = Read-Host "Paste your Stripe SECRET key (sk_test_... or sk_live_...), then press Enter" -AsSecureString
$key = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)).Trim()
if ($key -notmatch '^(sk|rk)_(test|live)_[A-Za-z0-9]+$') { throw "That doesn't look like a Stripe secret key (it should start with sk_test_ or sk_live_)." }
$mode = if ($key -match '_live_') { "LIVE (real money)" } else { "test (no real money)" }
Write-Host "Key accepted. Mode: $mode"
if ($key -match '_live_') {
  $ok = Read-Host "This is a LIVE key: real cards will be charged. Type yes to continue"
  if ($ok -ne "yes") { throw "Stopped." }
}

$auth = @{ Authorization = "Bearer $key" }
Write-Host "Checking the key with Stripe..."
Invoke-RestMethod -Uri "https://api.stripe.com/v1/balance" -Headers $auth | Out-Null

# an old webhook for the same address would hide its secret: remove it, and make a fresh one
Write-Host "Setting up the webhook..."
$existing = Invoke-RestMethod -Uri "https://api.stripe.com/v1/webhook_endpoints?limit=100" -Headers $auth
foreach ($e in $existing.data) { if ($e.url -eq $webhookUrl) { Invoke-RestMethod -Method Delete -Uri "https://api.stripe.com/v1/webhook_endpoints/$($e.id)" -Headers $auth | Out-Null } }
$body = @{ url = $webhookUrl; "enabled_events[0]" = "checkout.session.completed"; "enabled_events[1]" = "checkout.session.async_payment_succeeded"; description = "6ixPlanet: CDs bought at the record player" }
$hook = Invoke-RestMethod -Method Post -Uri "https://api.stripe.com/v1/webhook_endpoints" -Headers $auth -Body $body
if (-not $hook.secret) { throw "Stripe didn't hand out a webhook secret." }

Write-Host "Saving the secrets on the Cloudflare Worker..."
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
Push-Location $server
try {
  $key | node node_modules\wrangler\bin\wrangler.js secret put STRIPE_SECRET_KEY
  if ($LASTEXITCODE -ne 0) { throw "Couldn't save STRIPE_SECRET_KEY (are you logged in to Cloudflare? run: node node_modules\wrangler\bin\wrangler.js login)" }
  $hook.secret | node node_modules\wrangler\bin\wrangler.js secret put STRIPE_WEBHOOK_SECRET
  if ($LASTEXITCODE -ne 0) { throw "Couldn't save STRIPE_WEBHOOK_SECRET" }
} finally { Pop-Location }

Write-Host ""
Write-Host "Done. The record player in the shop now sends people to Stripe ($mode)." -ForegroundColor Green
if ($key -match '_test_') {
  Write-Host "Try it with the test card 4242 4242 4242 4242, any future date, any 3 digits, any name."
}
