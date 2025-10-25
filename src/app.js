import express from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import morgan from 'morgan';
import session from 'express-session';
import MongoStore from 'connect-mongo';

// Importar configuración de BD
import connectDB from './config/database.js';

// Importar rutas
import indexRoutes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import obraSocialRoutes from './routes/obraSocialRoutes.js';
import pacienteRoutes from './routes/pacienteRoutes.js';
import turnoRoutes from './routes/turnoRoutes.js';

// Configuración de __dirname para ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Crear app de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a la base de datos
connectDB();

// Configuración de Handlebars
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  },
  helpers: {
    eq: (a, b) => a === b,
    or: (a, b) => a || b,
    and: (a, b) => a && b,
    add: (a, b) => parseInt(a) + parseInt(b),
    subtract: (a, b) => parseInt(a) - parseInt(b),
    range: (start, end) => {
      const result = [];
      for (let i = start; i <= end; i++) {
        result.push(i);
      }
      return result;
    },
    formatDate: (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('es-AR');
    },
    json: (context) => JSON.stringify(context)
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(morgan(process.env.LOG_LEVEL || 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'tu_secreto_super_seguro',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/consultorio',
    touchAfter: 24 * 3600
  }),
  cookie: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  },
  name: process.env.SESSION_NAME || 'consultorio_session'
}));

// Middleware para pasar datos de sesión y ruta actual a las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.currentPath = req.path;
  next();
});

// Rutas
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/obras-sociales', obraSocialRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/turnos', turnoRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página no encontrada',
    error: 'La página que buscas no existe'
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).render('error', {
    title: 'Error',
    error: err.message || 'Ha ocurrido un error en el servidor'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('Servidor corriendo en http://localhost:' + PORT);
  console.log('Entorno: ' + (process.env.NODE_ENV || 'development'));
});

export default app;
