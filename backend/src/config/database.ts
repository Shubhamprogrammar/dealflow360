import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export const connectDatabase = async (): Promise<void> => {
  mongoose.connection.on('error', (error) => logger.error({ err: error }, 'MongoDB error'));
  await mongoose.connect(env.MONGO_URI);
  logger.info('MongoDB connected');
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const isDatabaseReady = (): boolean => mongoose.connection.readyState === 1;
