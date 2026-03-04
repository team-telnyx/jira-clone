import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.use(helmet());
app.use(cors());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'Jira Clone API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    statusCode: 404,
    message: 'The requested resource was not found',
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err.message);
  
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Bad Request',
      statusCode: 400,
      message: 'Invalid JSON in request body',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    statusCode: 500,
    message: NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
  });
});

let server: ReturnType<typeof app.listen> | null = null;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  });
}

const gracefulShutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };
