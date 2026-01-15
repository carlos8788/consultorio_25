import app from '../src/app.js';
import { connectDB } from '../src/config/database.js';

// Handler compatible con Serverless Functions de Vercel.
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('No se pudo conectar a la base de datos', error);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Error interno del servidor');
  }
}
