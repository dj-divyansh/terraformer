# Azure Inventory Export (Terraformer + API + UI)

Imports existing Azure resources with [Terraformer](https://github.com/GoogleCloudPlatform/terraformer), converts Terraform state to JSON inventory files, and serves them via an API + UI for browsing and integration.

## Quick Start

```powershell
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"

terraform init
.\script.ps1

.\fetch-all-resources.ps1

cd api; npm install; npm run start
cd ..\ui; npm install; npm run dev
```

- API docs: http://localhost:3000/api-docs
- UI: http://localhost:5173/ and http://localhost:5173/resources

## Repository Layout

| Path | What it is |
| --- | --- |
| [terraformer.exe](file:///d:/InfraMate/terraformer/terraformer.exe) | Terraformer binary |
| [fetch-all-resources.ps1](file:///d:/InfraMate/terraformer/fetch-all-resources.ps1) | Orchestrates imports (multi-group, multi-type) |
| [generate-json.ps1](file:///d:/InfraMate/terraformer/generate-json.ps1) | Converts generated state to inventory JSON |
| [script.ps1](file:///d:/InfraMate/terraformer/script.ps1) | Places AzureRM provider plugin where Terraformer expects it |
| [generated/](file:///d:/InfraMate/terraformer/generated) | Terraformer output (tf + tfstate), grouped by resource group |
| [inventory/](file:///d:/InfraMate/terraformer/inventory) | JSON inventory outputs consumed by API/UI |
| [api/](file:///d:/InfraMate/terraformer/api) | Node/Express API that reads inventory JSON |
| [ui/](file:///d:/InfraMate/terraformer/ui) | React UI (API Dashboard + Resource Browser) |

## How It Works

```text
Azure → Terraformer → generated/<group>/azurerm/<type>/terraform.tfstate
     → generate-json.ps1 → inventory/inventory-<type>-<group>.json
     → API reads inventory/*.json → UI renders + platform can integrate via API
```

## Prerequisites

- Terraform CLI (v1.x)
- Azure CLI (`az`)
- PowerShell 5.1+ or 7+

## Terraformer Import

Terraformer command uses `import azure` (provider is `azurerm`, argument is `azure`).

```powershell
.\terraformer.exe import azure --resources=virtual_machine,network_interface --resource-group="<RESOURCE_GROUP_NAME>"
```

To list supported Azure resources:

```powershell
.\terraformer.exe import azure list
```

## Inventory Generation

Inventory files are written under [inventory/](file:///d:/InfraMate/terraformer/inventory) as:

```text
inventory-<resource_type>-<resource_group>.json
```

Notes:
- Primary output is `terraform show -json` (preferred, richer schema).
- If `terraform show -json` fails, the script falls back to copying the raw `terraform.tfstate`.
- `inventory-azure.json` is ignored by the API and is not part of the normal inventory set.

## Scripts (What To Run)

- Import everything and generate inventory:
  - [fetch-all-resources.ps1](file:///d:/InfraMate/terraformer/fetch-all-resources.ps1)
- Convert already-imported state to inventory JSON:
  - [generate-json.ps1](file:///d:/InfraMate/terraformer/generate-json.ps1)

## API Service

- Location: [api/](file:///d:/InfraMate/terraformer/api)
- Start:
  - `npm run start` (prod)
  - `npm run dev` (watch)
- Reads inventory JSON from [inventory/](file:///d:/InfraMate/terraformer/inventory) (falls back to repo root if needed):
  - [dataService.js](file:///d:/InfraMate/terraformer/api/src/services/dataService.js)

Core endpoints:
- `GET /api/v1/resources` aggregate across groups
- `GET /api/v1/resources/:group` resources for a group
- `GET /api/v1/resources/:group/:id` lookup by id/name

Filtering examples:
- `/api/v1/resources/vm?location=eastus`
- `/api/v1/resources/disk?disk_size_gb[gte]=50`
- `/api/v1/resources/vm?name[like]=vm-1`
- `/api/v1/resources/vm?disable_password_authentication=true`
- `?page=1&limit=50&sort=-size,name`

## UI

- Location: [ui/](file:///d:/InfraMate/terraformer/ui)
- Start: `npm run dev`
- Pages:
  - API Dashboard: [ApiDashboard.jsx](file:///d:/InfraMate/terraformer/ui/src/components/ApiDashboard.jsx)
  - Resource Browser: [ResourceBrowser.jsx](file:///d:/InfraMate/terraformer/ui/src/components/ResourceBrowser.jsx)

## Integration Notes

- Treat `inventory/` as an artifact folder:
  - Generate it on a schedule (or on-demand)
  - Mount/ship it alongside the API (shared folder, volume, artifact download)
- The API is the stable integration surface; UI can be embedded behind a reverse proxy.

## Troubleshooting

- Azure auth: `az login` then `az account set --subscription "<SUB_ID>"`
- Provider plugin not found: run [script.ps1](file:///d:/InfraMate/terraformer/script.ps1) after `terraform init`
- Legacy provider address blocks `terraform show -json`:

```powershell
terraform state replace-provider --auto-approve "registry.terraform.io/-/azurerm" "hashicorp/azurerm"
```
