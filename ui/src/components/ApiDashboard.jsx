import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Send, CheckCircle, AlertCircle, Clock, Server, Layers, Star, Play, Database, ChevronRight, Layout, Table as TableIcon, Code, List } from 'lucide-react';
import { cn } from '../lib/utils';

const API_BASE_URL = 'http://localhost:3000';
const SPEC_URL = `${API_BASE_URL}/api-docs.json`;

const MethodBadge = ({ method }) => {
  const colors = {
    get: 'bg-blue-100 text-blue-800 border-blue-200',
    post: 'bg-green-100 text-green-800 border-green-200',
    put: 'bg-orange-100 text-orange-800 border-orange-200',
    delete: 'bg-red-100 text-red-800 border-red-200',
    patch: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded text-xs font-medium uppercase border", colors[method] || 'bg-gray-100 text-gray-800')}>
      {method}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const isSuccess = status >= 200 && status < 300;
  return (
    <span className={cn(
      "px-2 py-1 rounded text-sm font-medium flex items-center gap-1",
      isSuccess ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    )}>
      {isSuccess ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      Status: {status}
    </span>
  );
};

const ResponseViewer = ({ data }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'json'

  // Helper to extract array from response object
  const getDisplayData = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
      // Check for common array property names
      const arrayProp = ['data', 'results', 'items', 'list', 'values'].find(key => Array.isArray(data[key]));
      if (arrayProp) return data[arrayProp];
    }
    return null;
  };

  const tableData = getDisplayData(data);
  const isArray = Array.isArray(tableData);
  const isEmpty = isArray && tableData.length === 0;
  const effectiveViewMode = isArray ? viewMode : 'json';

  if (!data) return <div className="text-gray-400 italic p-4">No data returned</div>;

  const renderTable = () => {
    if (isEmpty) return <div className="p-4 text-gray-500">Empty list returned</div>;
    
    // Get all unique keys from the first few items to build headers
    const sample = tableData.slice(0, 5);
    const allKeys = Array.from(new Set(sample.flatMap(Object.keys)));
    
    // Prioritize common keys
    const priorityKeys = ['id', 'name', 'type', 'location', 'resource_group', 'status'];
    const sortedKeys = [
      ...priorityKeys.filter(k => allKeys.includes(k)),
      ...allKeys.filter(k => !priorityKeys.includes(k) && !k.startsWith('_')) // Hide internal keys like _terraform_address
    ];

    return (
      <div className="overflow-x-auto border-t border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {sortedKeys.map(key => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {sortedKeys.map(key => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {typeof row[key] === 'object' ? (
                      <span className="text-gray-400 text-xs italic">{JSON.stringify(row[key]).substring(0, 20)}...</span>
                    ) : (
                      String(row[key] || '-')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-2">
          {isArray && (
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                viewMode === 'table' ? "bg-white text-sky-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <TableIcon size={14} /> Table
            </button>
          )}
          <button
            onClick={() => setViewMode('json')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              effectiveViewMode === 'json' ? "bg-white text-sky-600 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Code size={14} /> JSON
          </button>
        </div>
        <div className="text-xs text-gray-400">
          {isArray ? `${tableData.length} items` : 'Object'}
        </div>
      </div>

      <div className="bg-white min-h-[200px] max-h-[500px] overflow-auto">
        {effectiveViewMode === 'table' && isArray ? renderTable() : (
          <div className="bg-[#0f172a] text-gray-100 p-4 min-h-full">
            <pre className="font-mono text-sm leading-relaxed">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ApiDashboard() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [filter, setFilter] = useState('');
  const [favorites, setFavorites] = useState([]);
  
  // Request State
  const [requestParams, setRequestParams] = useState({});
  const [requestHeaders, setRequestHeaders] = useState({ 'Content-Type': 'application/json' });
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState(null);
  const [requestLoading, setRequestLoading] = useState(false);

  const [newHeaderKey, setNewHeaderKey] = useState('');

  useEffect(() => {
    fetchSpec();
    const savedFavs = localStorage.getItem('api_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  const fetchSpec = async () => {
    try {
      const res = await axios.get(SPEC_URL);
      setSpec(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch spec:", err);
      setError("Failed to load API specification. Is the backend running?");
      setLoading(false);
    }
  };

  const toggleFavorite = (id) => {
    const newFavs = favorites.includes(id) 
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('api_favorites', JSON.stringify(newFavs));
  };

  const handleEndpointSelect = (path, method, operation) => {
    setSelectedEndpoint({ path, method, operation });
    setResponse(null);
    setRequestParams({});
    
    // Initialize params from spec
    const params = {};
    if (operation.parameters) {
      operation.parameters.forEach(p => {
        params[p.name] = ''; 
      });
    }
    setRequestParams(params);
  };

  const executeRequest = async () => {
    if (!selectedEndpoint) return;
    
    setRequestLoading(true);
    setResponse(null);
    const startTime = Date.now();

    try {
      // Construct URL with path params
      let url = selectedEndpoint.path;
      const queryParams = {};

      Object.entries(requestParams).forEach(([key, value]) => {
        if (url.includes(`{${key}}`)) {
          url = url.replace(`{${key}}`, value);
        } else if (value) {
          queryParams[key] = value;
        }
      });

      const config = {
        method: selectedEndpoint.method,
        url: `${API_BASE_URL}${url}`,
        params: queryParams,
        headers: requestHeaders,
        data: requestBody ? JSON.parse(requestBody) : undefined,
        validateStatus: () => true // Resolve promise for all status codes
      };

      const res = await axios(config);
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        headers: res.headers,
        time: Date.now() - startTime
      });
    } catch (err) {
      setResponse({
        error: true,
        message: err.message,
        time: Date.now() - startTime
      });
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-2"></div>
        Loading Resources...
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 flex items-center justify-center text-red-500">{error}</div>
    </div>
  );

  // Process endpoints for list
  const endpoints = [];
  Object.entries(spec.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, operation]) => {
      const id = `${method}:${path}`;
      if (
        filter && 
        !path.toLowerCase().includes(filter.toLowerCase()) && 
        !operation.summary?.toLowerCase().includes(filter.toLowerCase())
      ) return;

      endpoints.push({
        id,
        path,
        method,
        operation,
        isFavorite: favorites.includes(id)
      });
    });
  });

  endpoints.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.path.localeCompare(b.path);
  });

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] font-sans">
      
      <main className="flex-1 flex overflow-hidden p-6 gap-6 max-w-[1920px] mx-auto w-full">
        {/* Sidebar / Resource List */}
        <div className="w-96 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              Resources
            </h2>
            <p className="text-xs text-gray-500 mt-1">Select a resource to manage</p>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full pl-9 pr-4 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-white">
            {endpoints.map((ep) => (
              <div
                key={ep.id}
                onClick={() => handleEndpointSelect(ep.path, ep.method, ep.operation)}
                className={cn(
                  "p-3 rounded-md cursor-pointer group transition-all flex items-start justify-between border hover:shadow-sm",
                  selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method 
                    ? "bg-sky-50 border-sky-200 shadow-sm" 
                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MethodBadge method={ep.method} />
                    <span className="text-xs font-mono text-gray-500 truncate" title={ep.path}>{ep.path}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-700 truncate">{ep.operation.summary || 'No summary'}</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(ep.id); }}
                  className={cn("opacity-0 group-hover:opacity-100 transition-opacity p-1", ep.isFavorite ? "opacity-100 text-yellow-400" : "text-gray-300 hover:text-yellow-400")}
                >
                  <Star size={14} fill={ep.isFavorite ? "currentColor" : "none"} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t bg-gray-50 text-xs text-center text-gray-400">
            {spec.info?.title} v{spec.info?.version}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {selectedEndpoint ? (
            <div className="flex flex-col h-full">
              {/* Endpoint Header */}
              <header className="px-6 py-5 border-b bg-white flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="flex items-center gap-1"><Layout size={14}/> Dashboard</span>
                    <ChevronRight size={14} />
                    <span>Resources</span>
                    <ChevronRight size={14} />
                    <span className="font-medium text-gray-900">{selectedEndpoint.operation.summary}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MethodBadge method={selectedEndpoint.method} />
                    <h2 className="text-xl font-mono font-semibold text-gray-800">{selectedEndpoint.path}</h2>
                  </div>
                </div>
                <button
                  onClick={executeRequest}
                  disabled={requestLoading}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-md font-medium text-white shadow-sm transition-all",
                    requestLoading 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-sky-500 hover:bg-sky-600 hover:shadow-md active:transform active:scale-95"
                  )}
                >
                  {requestLoading ? <Clock className="animate-spin h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                  {requestLoading ? 'Running...' : 'Run Request'}
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {/* Request Configuration */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b font-medium text-gray-700 flex items-center gap-2">
                    <Server size={16} className="text-gray-500" /> Request Configuration
                  </div>
                  <div className="p-6 space-y-8">
                    {/* Parameters */}
                    {selectedEndpoint.operation.parameters && selectedEndpoint.operation.parameters.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Parameters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {selectedEndpoint.operation.parameters.map((param) => (
                            <div key={param.name} className="flex flex-col gap-1.5">
                              <label className="text-xs font-medium text-gray-700 flex justify-between">
                                {param.name}
                                <span className="text-gray-400 font-normal italic px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">{param.in}</span>
                              </label>
                              <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all shadow-sm"
                                placeholder={param.description || ''}
                                value={requestParams[param.name] || ''}
                                onChange={(e) => setRequestParams({ ...requestParams, [param.name]: e.target.value })}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Headers */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Headers</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(requestHeaders).map(([key, value]) => (
                          <div key={key} className="flex gap-2 group">
                            <input
                              type="text"
                              className="w-1/3 px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500 font-mono text-xs"
                              value={key}
                              readOnly
                            />
                            <input
                              type="text"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-sm"
                              value={value}
                              onChange={(e) => setRequestHeaders({ ...requestHeaders, [key]: e.target.value })}
                            />
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="New Header Key"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sky-500 outline-none shadow-sm"
                            value={newHeaderKey}
                            onChange={(e) => setNewHeaderKey(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newHeaderKey) {
                                setRequestHeaders({ ...requestHeaders, [newHeaderKey]: '' });
                                setNewHeaderKey('');
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              if (newHeaderKey) {
                                setRequestHeaders({ ...requestHeaders, [newHeaderKey]: '' });
                                setNewHeaderKey('');
                              }
                            }}
                            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Body for POST/PUT */}
                    {['post', 'put', 'patch'].includes(selectedEndpoint.method) && (
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Request Body (JSON)</h3>
                        <textarea
                          className="w-full h-40 px-4 py-3 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-sm"
                          value={requestBody}
                          onChange={(e) => setRequestBody(e.target.value)}
                          placeholder='{"key": "value"}'
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Response Panel */}
                {response && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
                      <div className="font-medium text-gray-700 flex items-center gap-2">
                        <Layers size={16} className="text-gray-500" /> Response Output
                      </div>
                      <div className="flex items-center gap-4">
                        {response.time && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 bg-white px-2 py-1 rounded border">
                            <Clock size={12} /> {response.time}ms
                          </span>
                        )}
                        <StatusBadge status={response.status} />
                      </div>
                    </div>
                    
                    <div className="p-0">
                      {response.error ? (
                        <div className="p-6 text-red-600 bg-red-50">
                          <h4 className="font-bold mb-2 flex items-center gap-2"><AlertCircle size={16}/> Error</h4>
                          <pre className="whitespace-pre-wrap font-mono text-sm">{response.message}</pre>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <ResponseViewer data={response.data} />
                          {response.headers && (
                            <div className="border-t bg-gray-50 p-4">
                              <details>
                                <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none">Response Headers</summary>
                                <div className="mt-2 grid grid-cols-1 gap-1 pl-2 border-l-2 border-gray-200">
                                  {Object.entries(response.headers).map(([k, v]) => (
                                    <div key={k} className="flex text-xs">
                                      <span className="font-medium text-gray-600 min-w-[120px]">{k}:</span>
                                      <span className="text-gray-800 font-mono truncate">{v}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
              <div className="bg-white p-6 rounded-full shadow-sm mb-4 border border-gray-100">
                <Database className="h-12 w-12 text-sky-200" />
              </div>
              <h3 className="text-lg font-medium text-gray-600">No Resource Selected</h3>
              <p className="text-sm text-gray-400 mt-2">Select a resource from the sidebar to view details</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
