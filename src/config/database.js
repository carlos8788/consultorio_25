import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/consultorio';
let cachedConnectionPromise = null;

/**
 * Establish a MongoDB connection once and reuse it across serverless invocations.
 * Vercel keeps the Lambda container warm, so holding the connection in module scope
 * avoids exhausting the connection pool on cold starts.
 */
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2 && cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  if (!cachedConnectionPromise) {
    cachedConnectionPromise = mongoose.connect(MONGODB_URI);
  }

  try {
    await cachedConnectionPromise;
    return mongoose.connection;
  } catch (error) {
    cachedConnectionPromise = null;
    throw error;
  }
};

mongoose.connection.on('connected', () => {
  console.log('Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Error de conexion de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose desconectado de MongoDB');
});

export default connectDB;
