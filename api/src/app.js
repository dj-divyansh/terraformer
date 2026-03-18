const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const resourceRoutes = require('./routes/resourceRoutes');
const vmRoutes = require('./routes/vmRoutes');
const diskRoutes = require('./routes/diskRoutes');
const nicRoutes = require('./routes/nicRoutes');
const errorHandler = require('./middleware/errorHandler');
const validateQuery = require('./middleware/validateQuery');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./docs/openapi');
const dataService = require('./services/dataService');

const app = express();

// Configuration
app.set('query parser', 'extended');

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/v1/resources', validateQuery, resourceRoutes);
app.use('/api/v1/vm', validateQuery, vmRoutes);
app.use('/api/v1/disk', validateQuery, diskRoutes);
app.use('/api/v1/nic', validateQuery, nicRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/api-docs.json', (req, res) => {
  res.json(openapiSpec);
});

// Cache invalidation
app.post('/api/v1/cache/invalidate', (req, res) => {
  dataService.invalidateCache();
  res.status(200).json({ status: 'success', message: 'Cache invalidated' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 Handler
app.use((req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
