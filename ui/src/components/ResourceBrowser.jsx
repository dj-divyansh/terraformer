import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Server, 
  HardDrive, 
  Network, 
  Box, 
  ArrowRight, 
  Search, 
  Filter,
  ChevronDown,
  ChevronRight,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';

const ResourceBrowser = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]); // Changed to array for multi-select
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      // Fetch all resources with a high limit to ensure we get everything
      const response = await axios.get('http://localhost:3000/api/v1/resources?limit=1000');
      if (response.data.status === 'success') {
        // The API returns an object grouped by type, we need to flatten it for the browser view
        const data = response.data.data || {};
        const flattenedResources = Array.isArray(data) ? data : Object.values(data).flat();
        setResources(flattenedResources);
      }
    } catch (err) {
      setError('Failed to load resources. Please ensure the API is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to normalize resource group names (lowercase)
  const normalizeGroup = (name) => name ? name.toLowerCase() : '';

  // Extract unique resource groups (normalized)
  const resourceGroupsMap = resources.reduce((acc, r) => {
    const rawName = r.resource_group;
    if (!rawName) return acc;
    
    const normalized = normalizeGroup(rawName);
    if (!acc[normalized]) {
      acc[normalized] = {
        name: rawName, // Keep the first variation as display name
        count: 0,
        types: new Set(),
        resources: []
      };
    }
    
    acc[normalized].count++;
    acc[normalized].types.add(r.type);
    acc[normalized].resources.push(r);
    return acc;
  }, {});

  const resourceGroups = Object.keys(resourceGroupsMap).sort();
  
  // Filter groups based on search
  const filteredGroups = resourceGroups.filter(normalizedKey => 
    normalizedKey.includes(searchTerm.toLowerCase())
  );

  // Toggle group selection
  const toggleGroup = (groupKey) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupKey)) {
        return prev.filter(g => g !== groupKey);
      } else {
        return [...prev, groupKey];
      }
    });
  };

  // Get resources for the selected groups
  const displayedResources = selectedGroups.flatMap(groupKey => resourceGroupsMap[groupKey]?.resources || []);

  // Group resources by type
  const resourcesByType = displayedResources.reduce((acc, curr) => {
    const type = curr.type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(curr);
    return acc;
  }, {});

  const getIconForType = (type) => {
    if (type.includes('virtual_machine')) return <Server className="text-blue-500" />;
    if (type.includes('disk')) return <HardDrive className="text-purple-500" />;
    if (type.includes('network')) return <Network className="text-green-500" />;
    return <Box className="text-gray-500" />;
  };

  const getTypeLabel = (type) => {
    if (type.includes('virtual_machine')) return 'Virtual Machines';
    if (type.includes('disk')) return 'Disks';
    if (type.includes('network')) return 'Network Interfaces';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading && !resources.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block">
          {error}
        </div>
      </div>
    );
  }

  // View 1: Resource Group Selection (Always visible, but changes layout when items selected)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-64px)]">
      
      {/* Header Section */}
      <div className="mb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Resource Browser</h1>
            <p className="text-slate-600">
              Select one or more Resource Groups to visualize their infrastructure.
            </p>
          </div>
          
          {selectedGroups.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{selectedGroups.length} selected</span>
              <button
                onClick={() => setSelectedGroups([])}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 bg-white"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-xl relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm shadow-sm"
            placeholder="Search Resource Groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden gap-6">
        
        {/* Left Panel: Resource Group List */}
        <div className={cn(
          "overflow-y-auto transition-all duration-300 pr-2",
          selectedGroups.length > 0 ? "w-1/3 border-r border-gray-200" : "w-full"
        )}>
          <div className={cn(
            "grid gap-4",
            selectedGroups.length > 0 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          )}>
            {filteredGroups.map(groupKey => {
              const groupData = resourceGroupsMap[groupKey];
              const isSelected = selectedGroups.includes(groupKey);
              
              return (
                <button
                  key={groupKey}
                  onClick={() => toggleGroup(groupKey)}
                  className={cn(
                    "group relative border rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left flex flex-col",
                    isSelected 
                      ? "bg-sky-50 border-sky-300 ring-1 ring-sky-300" 
                      : "bg-white border-gray-200 hover:border-sky-300"
                  )}
                >
                  <div className="flex items-start justify-between w-full mb-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isSelected ? "bg-sky-100" : "bg-gray-50 group-hover:bg-sky-50"
                    )}>
                      <Database className={cn("h-5 w-5", isSelected ? "text-sky-700" : "text-gray-500 group-hover:text-sky-600")} />
                    </div>
                    {isSelected && <div className="h-2 w-2 bg-sky-500 rounded-full"></div>}
                  </div>
                  
                  <h3 className={cn("text-lg font-semibold mb-1 truncate w-full", isSelected ? "text-sky-900" : "text-gray-900")}>
                    {groupData.name}
                  </h3>
                  
                  <div className="mt-auto flex items-center justify-between text-sm w-full">
                    <span className="text-gray-500">{groupData.count} Resources</span>
                    <span className="text-gray-400 text-xs">{groupData.types.size} Types</span>
                  </div>
                </button>
              );
            })}
            
            {filteredGroups.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No resource groups found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Details (only visible when selected) */}
        {selectedGroups.length > 0 && (
          <div className="w-2/3 overflow-y-auto pl-2">
            <div className="space-y-8">
              {Object.keys(resourcesByType).length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  Select a group to view resources
                </div>
              ) : (
                Object.entries(resourcesByType).map(([type, items]) => (
                  <div key={type} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                      {getIconForType(type)}
                      <h2 className="text-lg font-semibold text-gray-800">
                        {getTypeLabel(type)}
                      </h2>
                      <span className="ml-auto bg-white px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 text-gray-600">
                        {items.length} items
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {items.map((resource) => (
                            <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {resource.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {resource.resource_group}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {resource.location}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {type.includes('disk') && (
                                  <span>Size: {resource.disk_size_gb} GB</span>
                                )}
                                {type.includes('virtual_machine') && (
                                  <span>Size: {resource.size || 'Standard'}</span>
                                )}
                                {!type.includes('disk') && !type.includes('virtual_machine') && (
                                  <span className="italic text-gray-400">Standard Resource</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceBrowser;
