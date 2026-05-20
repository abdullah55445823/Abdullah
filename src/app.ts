import express from 'express';
import cors from 'cors';
import path from 'path';
import { createRouter } from './routes';
import { AgentOrchestrator } from './services/AgentOrchestrator';
import { MockDbService } from './services/MockDbService';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

export function createApp(): express.Application {
  const app = express();

  const dbPath = path.join(process.cwd(), 'src', 'db');
  const mockDb = new MockDbService(dbPath);
  const orchestrator = new AgentOrchestrator(mockDb);

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  const apiRouter = createRouter(orchestrator, mockDb);
  app.use('/api', apiRouter);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'ServeAi' });
  });

  app.use(errorHandler);

  return app;
}
