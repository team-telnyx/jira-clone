const express = require('express');
const cors = require('cors');
const projectRoutes = require('./routes/projectRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/projects', projectRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      status: 404,
    },
  });
});

// Global error handler
app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      status,
    },
  });
});

module.exports = app;
