const fs = require('fs').promises;
const path = require('path');

// Configuration for data sources
const INVENTORY_DIR = path.resolve(__dirname, '../../../inventory');
const ROOT_DIR = path.resolve(__dirname, '../../../');

class DataService {
  constructor() {
    this.cache = {};
    this.lastLoad = 0;
    this.CACHE_TTL = 60000; // 1 minute cache
  }

  /**
   * Reads a file and handles potential BOMs and encoding issues (PowerShell UTF-16LE)
   */
  async readJsonFile(filePath) {
    const buffer = await fs.readFile(filePath);
    let content;

    // Check for UTF-16 LE BOM (FF FE)
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
      content = buffer.toString('utf16le');
    }
    // Check for UTF-8 BOM (EF BB BF)
    else if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      content = buffer.toString('utf8').slice(1); // Strip BOM
    }
    else {
      // Default to UTF-8
      content = buffer.toString('utf8');
    }

    // Remove any leading Byte Order Mark (ZERO WIDTH NO-BREAK SPACE)
    // 0xFEFF is the char code for BOM
    if (content.length > 0 && content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }

    return JSON.parse(content);
  }

  /**
   * Loads and normalizes data from the JSON files
   */
  async getAllResources() {
    const now = Date.now();
    if (this.cache.all && (now - this.lastLoad < this.CACHE_TTL)) {
      return this.cache.all;
    }

    const results = {};

    try {
      // Dynamically find all inventory-*.json files
      let dataDir = INVENTORY_DIR;
      let files;
      try {
        files = await fs.readdir(dataDir);
      } catch {
        dataDir = ROOT_DIR;
        files = await fs.readdir(dataDir);
      }
      const inventoryFiles = files.filter(f => f.startsWith('inventory-') && f.endsWith('.json'));

      // Aggregate all resources into a single list first, then group by type
      // This handles cases where multiple files contribute to the same resource type (e.g. inventory-vm-RG1.json and inventory-vm-RG2.json)
      const allResources = [];

      for (const filename of inventoryFiles) {
        // Skip inventory-azure.json if it's not a resource file
        if (filename === 'inventory-azure.json') continue;

        try {
          const filePath = path.join(dataDir, filename);
          
          // Use the robust reader
          const jsonData = await this.readJsonFile(filePath);
          
          let resources = [];
          
          // Case 1: terraform show -json output
          if (jsonData.values?.root_module?.resources) {
            resources = jsonData.values.root_module.resources;
          } 
          // Case 2: Raw terraform.tfstate (v4)
          else if (jsonData.resources && Array.isArray(jsonData.resources)) {
            // Flatten the raw state structure
            for (const resBlock of jsonData.resources) {
                if (resBlock.instances) {
                    for (const instance of resBlock.instances) {
                        if (instance.attributes) {
                             resources.push({
                                 values: instance.attributes,
                                 type: resBlock.type,
                                 name: resBlock.name,
                                 address: `${resBlock.type}.${resBlock.name}`,
                                 provider_name: resBlock.provider
                             });
                        }
                    }
                }
            }
          }
          
          console.log(`Loaded ${resources.length} resources from ${filename}`);

          // Add to master list
          allResources.push(...resources);
        } catch (error) {
          console.error(`Error loading ${filename}:`, error.message);
          // Continue with other files
        }
      }

      // Group resources by normalized type
      for (const resource of allResources) {
        // Extract type from resource definition (e.g. azurerm_virtual_machine -> virtual_machine)
        // Or use the filename-based approach if resource.type is missing?
        // Terraformer output always has resource.type
        
        let type = resource.type;
        if (type && type.startsWith('azurerm_')) {
            type = type.replace('azurerm_', '');
        } else if (!type) {
            // Fallback if type is missing (should not happen for valid TF state)
            type = 'unknown';
        }

        if (!results[type]) {
            results[type] = [];
        }

        // Normalize the data structure
        results[type].push({
          id: resource.values.id,
          name: resource.values.name,
          type: resource.type, // Keep original full type here
          location: resource.values.location,
          resource_group: resource.values.resource_group_name,
          // Include all other values for filtering
          ...resource.values,
          // Add metadata
          _terraform_address: resource.address,
          _provider: resource.provider_name
        });
      }
    } catch (err) {
      console.error('Error reading data directory:', err);
    }

    this.cache.all = results;
    this.lastLoad = now;
    return results;
  }

  async getResourcesByType(type) {
    const all = await this.getAllResources();
    return all[type] || [];
  }

  invalidateCache() {
    this.cache = {};
    this.lastLoad = 0;
  }
}

module.exports = new DataService();
