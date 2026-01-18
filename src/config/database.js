import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/consultorio';
let cachedConnectionPromise = null;
let cachedMongoUri = null;

/**
 * Establish a MongoDB connection once and reuse it across serverless invocations.
 * Vercel keeps the Lambda container warm, so holding the connection in module scope
 * avoids exhausting the connection pool on cold starts.
 */
export const connectDB = async (mongoUri) => {
  const resolvedUri = mongoUri || process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2 && cachedConnectionPromise && cachedMongoUri === resolvedUri) {
    return cachedConnectionPromise;
  }

  if (!cachedConnectionPromise || cachedMongoUri !== resolvedUri) {
    cachedMongoUri = resolvedUri;
    cachedConnectionPromise = mongoose.connect(resolvedUri);
  }

  try {
    await cachedConnectionPromise;
    return mongoose.connection;
  } catch (error) {
    cachedConnectionPromise = null;
    cachedMongoUri = null;
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
