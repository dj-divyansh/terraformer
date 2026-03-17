<#
.SYNOPSIS
    Fetches Azure resources across all (or specified) Resource Groups using Terraformer.
    Scalable solution for 100+ resource types.

.DESCRIPTION
    1. Checks Azure login status.
    2. Retrieves a list of all Resource Groups in the subscription (dynamic).
    3. Runs Terraformer to import resources from EACH group.
    4. Calls generate-json.ps1 to convert the generated Terraform state into clean JSON inventory files.

.EXAMPLE
    .\fetch-all-resources.ps1
    Fetches everything from all resource groups.

.EXAMPLE
    .\fetch-all-resources.ps1 -ResourceGroups "Infra-Poc,InfraMate"
    Fetches only specific groups.
#>

param (
    [string[]]$ResourceGroups = "*"
)

# --- Configuration ---
$TerraformerExe = ".\terraformer.exe"
$GenerateScript = ".\generate-json.ps1"
$Provider = "azurerm"

# List of resources to import. 
# Terraformer doesn't support "all" natively for Azure in a way that is stable, so we list common ones.
# Add more types here as needed to scale.
$ResourceTypes = @(
    "virtual_machine",
    "managed_disk",
    "network_interface",
    "network_security_group",
    "virtual_network",
    "subnet",
    "public_ip",
    "storage_account",
    "key_vault",
    "resource_group",
    "aks_cluster",
    "sql_server",
    "sql_database",
    "app_service_plan",
    "app_service",
    "function_app",
    "dns_zone",
    "load_balancer",
    "application_gateway",
    "cosmosdb_account",
    "virtual_machine_scale_set",
    "availability_set",
    "disk_encryption_set",
    "snapshot",
    "image",
    "firewall",
    "route_table",
    "private_dns_zone",
    "express_route_circuit",
    "virtual_network_gateway",
    "local_network_gateway",
    "network_watcher",
    "storage_container",
    "file_share",
    "postgresql_server",
    "mysql_server",
    "redis_cache",
    "logic_app_workflow",
    "api_management",
    "container_registry",
    "kubernetes_cluster",
    "user_assigned_identity",
    "key_vault_secret",
    "key_vault_key",
    "monitor_action_group",
    "monitor_metric_alert",
    "log_analytics_workspace",
    "management_lock",
    "policy_assignment"
) -join ","

# --- Helper Functions ---

function Write-Status {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor Cyan
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

# --- Main Execution ---

# 1. Check Prerequisites
Write-Status "Checking prerequisites..."

if (-not (Get-Command "az" -ErrorAction SilentlyContinue)) {
    Write-ErrorMsg "Azure CLI ('az') is not installed or not in PATH."
    exit 1
}

if (-not (Get-Command "terraform" -ErrorAction SilentlyContinue)) {
    Write-ErrorMsg "Terraform ('terraform') is not installed or not in PATH. Required for JSON generation."
    exit 1
}

# Check if logged in
$account = az account show 2>$null
if (-not $account) {
    Write-ErrorMsg "Not logged in to Azure. Please run 'az login' first."
    exit 1
} else {
    $subName = ($account | ConvertFrom-Json).name
    Write-Status "Logged in to subscription: $subName"
}

if (-not (Test-Path $TerraformerExe)) {
    Write-ErrorMsg "Terraformer executable not found at $TerraformerExe"
    exit 1
}

# 2. Get Resource Groups
Write-Status "Fetching Resource Groups..."
$GroupsToProcess = @()

if ($ResourceGroups -contains "*" -or $ResourceGroups.Count -eq 0) {
    # Dynamic fetch of all groups
    Write-Status "Querying Azure for all resource groups..."
    $azGroups = az group list --query "[].name" -o tsv 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $azGroups) {
        Write-ErrorMsg "Failed to list resource groups from Azure."
        # Fallback for demo/testing if Azure CLI fails (e.g. permission issues)
        Write-Status "Using fallback/known groups."
        $GroupsToProcess = @("Infra-Poc", "InfraMate", "GL-Legacy-to-Cloud-ADF")
    } else {
        $GroupsToProcess = $azGroups
    }
} else {
    # Handle comma-separated string input
    if ($ResourceGroups.Count -eq 1 -and $ResourceGroups[0] -match ",") {
        $GroupsToProcess = $ResourceGroups[0] -split ","
    } else {
        $GroupsToProcess = $ResourceGroups
    }
}

$count = $GroupsToProcess.Count
Write-Status "Found $count resource group(s) to process."

# 3. Import Resources
foreach ($Group in $GroupsToProcess) {
    $Group = $Group.Trim()
    if ([string]::IsNullOrWhiteSpace($Group)) { continue }

    Write-Status "--------------------------------------------------"
    Write-Status "Importing resources for group: $Group"
    Write-Status "--------------------------------------------------"

    # Construct Terraformer command
    # Syntax: terraformer import azure --resources=... --resource-group=...
    $ArgsList = @(
        "import", 
        "azure", 
        "--resource-group", $Group, 
        "--resources", $ResourceTypes
    )
    
    # We use Start-Process to handle argument parsing correctly and avoid shell issues
    $Process = Start-Process -FilePath $TerraformerExe -ArgumentList $ArgsList -NoNewWindow -PassThru -Wait
    
    if ($Process.ExitCode -eq 0) {
        Write-Success "Successfully imported resources for $Group"
    } else {
        Write-ErrorMsg "Terraformer exited with code $($Process.ExitCode) for $Group. (This might be normal if no resources of specified types exist)"
    }
}

# 4. Generate JSON Inventory
Write-Status "--------------------------------------------------"
Write-Status "Generating JSON inventory files..."
Write-Status "--------------------------------------------------"

if (Test-Path $GenerateScript) {
    # Execute the generation script
    Invoke-Expression -Command "$GenerateScript"
} else {
    Write-ErrorMsg "Generation script ($GenerateScript) not found!"
}

Write-Success "All operations completed."
