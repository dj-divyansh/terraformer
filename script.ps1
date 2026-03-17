# 1. Create the directory Terraformer is looking for
$PluginDir = "$env:USERPROFILE\.terraform.d\plugins\windows_amd64"
New-Item -ItemType Directory -Force -Path $PluginDir | Out-Null
Write-Host "Created directory: $PluginDir" -ForegroundColor Green

# 2. Find the provider you already downloaded via 'init'
# (It lives deep inside the .terraform folder)
$SourceFile = Get-ChildItem -Path ".\.terraform\providers\registry.terraform.io\hashicorp\azurerm\*\windows_amd64\terraform-provider-azurerm*.exe" | Select-Object -First 1

if ($SourceFile) {
    # 3. Copy it to the global plugin directory
    Copy-Item -Path $SourceFile.FullName -Destination $PluginDir
    Write-Host "Success! Copied provider to $($PluginDir)" -ForegroundColor Cyan
    Write-Host "You are ready to run the import command again." -ForegroundColor Green
} else {
    Write-Error "Could not find the Azure provider. Did you run 'terraform init' in this folder?"
}