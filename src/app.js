import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { logger } from './logger/index.js';
import cors from 'cors';

// Importar rutas API
import apiRoutes from './routes/apiRoutes.js';

// Configuración de __dirname para ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '../public');
const assetsPath = path.join(publicPath, 'assets');

// Cargar variables de entorno
dotenv.config();

// Crear app de Express
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // Necesario para cookies secure detrás del proxy de Vercel
app.set('etag', false); // Evita 304 en API y entrega siempre el cuerpo

// Configuración CORS para permitir comunicación con Next.js (LAN)
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.0.238:3001'
];
const extraOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
const allowlist = Array.from(new Set([
  ...defaultOrigins,
  process.env.FRONTEND_URL || '',
  ...extraOrigins
])).filter(Boolean);

const normalizeOrigin = (origin) => (origin ? origin.replace(/\/$/, '') : origin);
const logCorsDecision = (origin, normalizedOrigin, allowed) => {
  if (!origin) return;
  logger.info(`[CORS] origin=${origin} normalized=${normalizedOrigin || 'none'} allowed=${allowed}`);
};
const allowlistNormalized = new Set(allowlist.map(normalizeOrigin).filter(Boolean));
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // curl / health checks
    const normalizedOrigin = normalizeOrigin(origin);
    const isAllowed = allowlistNormalized.has(normalizedOrigin);
    logCorsDecision(origin, normalizedOrigin, isAllowed);
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
};

// Middlewares
app.use(morgan(process.env.LOG_LEVEL || 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// Assets estáticos
const isDevelopment = process.env.NODE_ENV !== 'production';
app.use('/assets', express.static(assetsPath, {
  maxAge: isDevelopment ? 0 : '30d',
  immutable: !isDevelopment
}));

app.use(express.static(publicPath, {
  maxAge: isDevelopment ? 0 : '1d'
}));

// Rutas API
app.use('/api', apiRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Ha ocurrido un error en el servidor',
    ...(isDevelopment && { stack: err.stack })
  });
});

export default app;
