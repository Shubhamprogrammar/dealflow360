import { createServer } from 'node:http';
import { app } from './app.js';
import {
  connectDatabase,
  connectRedis,
  disconnectDatabase,
  disconnectRedis,
  env,
  logger,
} from './config/index.js';
import { closeMailer } from './config/mailer.js';
import { createSocketServer } from './socket/socket.js';
import { closeQueues } from './queues/index.js';
import { closeWorkers, createWorkers } from './queues/workers/index.js';
const server = createServer(app);
const io = createSocketServer(server);
const workers: ReturnType<typeof createWorkers> = [];
const start = async (): Promise<void> => {
  await connectDatabase();
  await connectRedis();
  workers.push(...createWorkers());
  server.listen(env.PORT, () => logger.info({ port: env.PORT }, 'HTTP server listening'));
};
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Shutdown started');
  io.close();
  server.close();
  await closeWorkers(workers);
  await closeQueues();
  closeMailer();
  await disconnectRedis();
  await disconnectDatabase();
  process.exit(0);
};
process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));
start().catch((error: unknown) => {
  logger.error({ err: error }, 'Startup failed');
  process.exit(1);
});
