const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.0.238:3001'
];

const allowlist = Array.from(new Set([
  ...defaultOrigins,
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean)
]));

export const corsConfig = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser / curl
    if (allowlist.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
};
