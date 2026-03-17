function Write-Status($msg) { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg" -ForegroundColor Cyan }
function Write-ErrorMsg($msg) { Write-Host "$msg" -ForegroundColor Red }

$GeneratedDir = "$PSScriptRoot\generated"
$Provider = "azurerm"
$InventoryDir = Join-Path $PSScriptRoot "inventory"

if (-not (Test-Path $GeneratedDir)) {
    Write-ErrorMsg "Generated directory not found at $GeneratedDir"
    exit 1
}

New-Item -ItemType Directory -Force -Path $InventoryDir | Out-Null

$Groups = Get-ChildItem -Path $GeneratedDir -Directory | Select-Object -ExpandProperty Name

Write-Status "Converting Terraform state to JSON inventory files..."

foreach ($Group in $Groups) {
    $GroupProviderDir = "$GeneratedDir\$Group\$Provider"
    
    if (-not (Test-Path $GroupProviderDir)) {
        continue
    }

    # Find all directory paths that contain a terraform.tfstate file
    $StateFiles = Get-ChildItem -Path $GroupProviderDir -Recurse -Filter "terraform.tfstate"

    foreach ($StateFile in $StateFiles) {
        $ResourceType = $StateFile.Directory.Name
        $OutputFile = "inventory-$ResourceType-$Group.json"
        $OutputFilePath = Join-Path $InventoryDir $OutputFile
        
        Write-Status "Processing $ResourceType for $Group..."

        Push-Location $StateFile.DirectoryName
        
        try {
            # Fix provider.tf to add source for Terraform 0.13+ compatibility
            $ProviderTfPath = "provider.tf"
            if (Test-Path $ProviderTfPath) {
                $Content = Get-Content $ProviderTfPath -Raw
                $NewContent = $Content
                
                # Check if source is missing in required_providers
                if ($Content -match 'required_providers' -and -not ($Content -match 'source\s*=\s*"hashicorp/azurerm"')) {
                    # Inject source into azurerm block
                    $NewContent = $NewContent -replace 'azurerm\s*=\s*\{', 'azurerm = { source = "hashicorp/azurerm"'
                    Write-Host "  -> Updated provider.tf (added source)" -ForegroundColor Gray
                }

                # Also remove standalone version line if it exists (legacy format issue)
                # But keep it if it's inside the block we just modified?
                # Actually, let's just ensure source is there.
                
                # Write back if changed
                if ($Content -ne $NewContent) {
                    $NewContent | Set-Content $ProviderTfPath -NoNewline
                }
            }
            
            # Upgrade state provider (for legacy Terraformer output compatibility)
            # This fixes "Invalid legacy provider address" error
            # We ignore errors because it might fail if already upgraded or no matching provider found
            $null = terraform state replace-provider -auto-approve "registry.terraform.io/-/azurerm" "hashicorp/azurerm" 2>&1

            # Initialize (upgrade to ensure new config is picked up)
            $initResult = terraform init -no-color -upgrade -input=false 2>&1
            $initFailed = $LASTEXITCODE -ne 0

            if ($initFailed) {
                Write-ErrorMsg "  terraform init failed for $ResourceType. Attempting raw state fallback."
            }
            
            $jsonOutput = $null
            $terraformShowSuccess = $false

            if (-not $initFailed) {
                # Output JSON
                # Capture stdout only, stderr might contain warnings
                $jsonOutput = terraform show -json 2>$null
                if ($LASTEXITCODE -eq 0 -and $jsonOutput) {
                    $terraformShowSuccess = $true
                }
            }
            
            $jsonWritten = $false

            if ($terraformShowSuccess) {
                # Ensure output looks like JSON (starts with {)
                # Handle single string or array of strings
                if ($jsonOutput -is [array]) {
                    $jsonString = $jsonOutput -join "`n"
                } else {
                    $jsonString = [string]$jsonOutput
                }
                
                # Trim potential whitespace/BOM
                $trimmed = $jsonString.Trim()
                if ($trimmed.Length -gt 0 -and $trimmed.Substring(0,1) -eq "{") {
                     $jsonString | Out-File $OutputFilePath -Encoding UTF8
                     Write-Host "  -> Generated $OutputFile" -ForegroundColor Green
                     $jsonWritten = $true
                } else {
                     Write-ErrorMsg "  terraform show output was not JSON for $ResourceType"
                }
            } 
            
            if (-not $jsonWritten) {
                if (-not $initFailed -and -not $terraformShowSuccess) {
                     Write-ErrorMsg "  terraform show failed for $ResourceType (Exit Code: $LASTEXITCODE)"
                }

                # Fallback to raw state file
                if (Test-Path "terraform.tfstate") {
                    Copy-Item "terraform.tfstate" $OutputFilePath -Force
                    Write-Host "  -> Generated $OutputFile (from raw state)" -ForegroundColor Yellow
                } else {
                    Write-ErrorMsg "  terraform.tfstate not found for $ResourceType"
                }
            }
        } catch {
            Write-ErrorMsg ("  Failed to process " + $ResourceType + " for " + $Group + ": " + $_)
        } finally {
            Pop-Location
        }
    }
}
