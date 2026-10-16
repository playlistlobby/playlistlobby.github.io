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
$wrangler = "node_modules/wrangler/bin/wrangler.js"
Push-Location $server
$file = Join-Path $env:TEMP ("stripe-secrets-" + [guid]::NewGuid().ToString("N") + ".json")
try {
  # logged in to Cloudflare? (if not, a browser window opens: click Allow, then come back here)
  $who = (cmd /c "node $wrangler whoami 2>&1" | Out-String) # (cmd does the redirect: PowerShell 5.1 would turn wrangler's harmless "out of date" warning into an error)
  if ($who -notmatch "You are logged in") {
    Write-Host "You need to log in to Cloudflare first: a browser window opens, click Allow."
    node $wrangler login
    if ($LASTEXITCODE -ne 0) { throw "Cloudflare login didn't finish. Run the script again." }
  }
  # both secrets in one go, from a temporary file (deleted right after); nothing is typed into wrangler's stdin, so it can ask or choose normally
  @{ STRIPE_SECRET_KEY = $key; STRIPE_WEBHOOK_SECRET = $hook.secret } | ConvertTo-Json | Set-Content -Path $file -Encoding UTF8
  node $wrangler secret bulk $file
  if ($LASTEXITCODE -ne 0) { throw "Couldn't save the secrets on Cloudflare. Run:  cd $server ; node $wrangler login   and then run this script again." }
} finally {
  Remove-Item -Path $file -Force -ErrorAction SilentlyContinue
  Pop-Location
}

Write-Host ""
Write-Host "Done. The record player in the shop now sends people to Stripe ($mode)." -ForegroundColor Green
if ($key -match '_test_') {
  Write-Host "Try it with the test card 4242 4242 4242 4242, any future date, any 3 digits, any name."
}
