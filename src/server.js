import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/database.js';
import { logger } from './logger/index.js';
import { initNotificationHub } from './realtime/notificationHub.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    initNotificationHub(server);

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Servidor corriendo en http://localhost:${PORT}`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('No se pudo iniciar el servidor', error);
    process.exit(1);
  }
};

start();
