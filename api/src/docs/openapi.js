const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Terraformer Resource API',
      version: '1.0.0',
      description:
        'RESTful API providing access to imported Azure resources with advanced filtering, sorting, and pagination.',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: [], // We construct schema below
};

const spec = swaggerJSDoc(options);

// Paths
spec.paths = {
  '/api/v1/resources': {
    get: {
      summary: 'List all resources across types',
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
        { in: 'query', name: 'sort', schema: { type: 'string' }, description: 'Comma-separated fields; prefix with - for descending' },
        { in: 'query', name: 'fields', schema: { type: 'string' }, description: 'Comma-separated field selection' },
      ],
      responses: {
        200: { description: 'OK' },
        400: { description: 'Bad Request' },
      },
    },
  },
  '/api/v1/vm': {
    get: {
      summary: 'List VM resources',
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
        { in: 'query', name: 'sort', schema: { type: 'string' } },
        { in: 'query', name: 'fields', schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/api/v1/disk': {
    get: {
      summary: 'List Disk resources',
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
        { in: 'query', name: 'sort', schema: { type: 'string' } },
        { in: 'query', name: 'fields', schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/api/v1/nic': {
    get: {
      summary: 'List NIC resources',
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
        { in: 'query', name: 'sort', schema: { type: 'string' } },
        { in: 'query', name: 'fields', schema: { type: 'string' } },
      ],
      responses: { 200: { description: 'OK' } },
    },
  },
  '/api/v1/resources/{type}': {
    get: {
      summary: 'List resources by type (vm, disk, nic, etc.)',
      parameters: [
        { in: 'path', name: 'type', required: true, schema: { type: 'string' }, description: 'Resource type key (e.g. vm, disk, nic, virtual_network)' },
        { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 1000 } },
        { in: 'query', name: 'sort', schema: { type: 'string' } },
        { in: 'query', name: 'fields', schema: { type: 'string' } },
        {
          in: 'query',
          name: 'filter',
          schema: { type: 'object' },
          description: 'Advanced filters via nested query (e.g., disk_size_gb[gte]=50, name[like]=vm)',
        },
      ],
      responses: {
        200: { description: 'OK' },
        404: { description: 'Type not found' },
        400: { description: 'Bad Request' },
      },
    },
  },
  '/api/v1/resources/{type}/{id}': {
    get: {
      summary: 'Get a resource by ID (or name)',
      parameters: [
        { in: 'path', name: 'type', required: true, schema: { type: 'string' }, description: 'Resource type key' },
        { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
      ],
      responses: {
        200: { description: 'OK' },
        404: { description: 'Resource not found' },
      },
    },
  },
  '/api/v1/cache/invalidate': {
    post: {
      summary: 'Invalidate the in-memory resource cache',
      description: 'Forces the API to reload inventory data from disk on the next request.',
      responses: {
        200: { description: 'Cache invalidated' },
      },
    },
  },
  '/health': {
    get: {
      summary: 'Health check',
      responses: { 200: { description: 'OK' } },
    },
  },
};

module.exports = spec;
