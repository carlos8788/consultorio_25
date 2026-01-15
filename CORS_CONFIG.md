# Configuración CORS para el Backend

## 📌 Puertos de la aplicación

- **Backend API**: `http://localhost:5000`
- **Frontend Next.js**: `http://localhost:3001`

## 🛡️ Configurar CORS en Express

Para que Next.js pueda comunicarse con el backend, necesitás instalar y configurar CORS:

### 1. Instalar el paquete CORS

```bash
pnpm add cors
```

### 2. Configurar en `src/app.js`

Agregar **después** de crear la app de Express y **antes** de los middlewares:

```javascript
import express from 'express';
import cors from 'cors';
// ... otras importaciones

const app = express();

// Configuración CORS - AGREGAR ESTO
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true, // Importante para cookies de sesión
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Resto de middlewares...
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ...
```

### 3. Agregar variable de entorno

En tu `.env` del backend:

```env
# Puerto del backend
PORT=5000

# URL del frontend (para CORS)
FRONTEND_URL=http://localhost:3001

# En producción:
# FRONTEND_URL=https://tudominio.vercel.app
```

### 4. Configuración de sesiones (importante)

Asegurarse que las cookies de sesión estén configuradas correctamente:

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true solo en producción
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' en producción con HTTPS
    domain: undefined // No especificar domain en desarrollo
  },
  name: process.env.SESSION_NAME || 'consultorio_session'
}));
```

## ✅ Checklist de configuración

- [ ] Instalar `pnpm add cors`
- [ ] Importar cors en `src/app.js`
- [ ] Agregar middleware `app.use(cors({ ... }))`
- [ ] Configurar `credentials: true`
- [ ] Actualizar configuración de cookies de sesión
- [ ] Agregar `FRONTEND_URL` en `.env`
- [ ] Reiniciar el servidor backend

## 🧪 Verificar que funciona

### Desde el navegador (consola):

```javascript
// Probar endpoint de login
fetch('http://localhost:5000/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: '123456' }),
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('Response:', data));
```

### Desde Next.js:

El frontend ya está configurado para enviar cookies (`withCredentials: true` en axios).

## 🚨 Errores comunes

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solución**: Verificar que el middleware CORS esté antes de las rutas.

### Error: "Cookies no se guardan"

**Solución**:
- Verificar `credentials: true` en CORS
- Verificar `withCredentials: true` en axios (ya está configurado)
- En desarrollo, usar `sameSite: 'lax'`

### Error: "401 Unauthorized" después de login

**Solución**: Verificar que las cookies se estén enviando correctamente. Revisar la pestaña "Application" > "Cookies" en DevTools.

## 📝 Configuración para producción

Cuando despliegues:

**Backend (Render)**:
```env
FRONTEND_URL=https://consultorio-frontend.vercel.app
NODE_ENV=production
SESSION_SECRET=un_secreto_muy_seguro_generado_aleatoriamente
```

**Frontend (Vercel)**:
```env
NEXT_PUBLIC_API_URL=https://consultorio-api.onrender.com
```

**CORS en producción**:
```javascript
app.use(cors({
  origin: [
    'https://consultorio-frontend.vercel.app',
    'https://consultorio.tudominio.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```
