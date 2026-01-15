# Sistema de Gestión de Consultorio Médico

Sistema de gestión para consultorios médicos desarrollado con Express.js, Handlebars y MongoDB.

## Características

- 🏥 Gestión de pacientes
- 📅 Administración de turnos
- 🏢 Control de obras sociales
- 🔐 Sistema de autenticación con sesiones
- 📊 Paginación de datos
- ✅ Validación de formularios
- 🎨 Interfaz moderna con Bootstrap 5

## Tecnologías

- **Backend**: Express.js (ES6 modules)
- **Motor de vistas**: Handlebars
- **Base de datos**: MongoDB con Mongoose
- **Validación**: express-validator
- **Sesiones**: express-session con connect-mongo
- **Logger**: Morgan
- **Paginación**: mongoose-paginate-v2
- **Gestión de variables de entorno**: dotenv

## Estructura del proyecto

```
CONSULTORIO_25/
|-- api/
|   `-- index.js          # Handler serverless (Vercel) que usa Express
|-- src/
|   |-- app.js            # Configuración de Express (sin listen)
|   |-- server.js         # Entrada local: conecta a Mongo y arranca Express
|   |-- config/           # Configuraciones (BD)
|   |-- models/           # Modelos de Mongoose
|   |-- controllers/      # Controladores
|   |-- routes/           # Rutas
|   |-- middlewares/      # Middlewares
|   |-- validators/       # Validadores
|   `-- views/            # Layouts, parciales y páginas
|-- public/               # Archivos estáticos
|-- vercel.json           # Configuración serverless para Vercel
|-- .env / .env.example   # Variables de entorno
|-- package.json
`-- README.md
```

## Instalación

1. Clonar el repositorio o descargar el proyecto

2. Instalar dependencias con pnpm:
```bash
pnpm install
```

3. Configurar las variables de entorno:
   - Copiar `.env.example` a `.env` si no existe
   - Modificar los valores según tu configuración local

4. Asegurarse de tener MongoDB ejecutándose localmente o configurar la URI de MongoDB remota

## Uso

### Desarrollo (con auto-reload)
```bash
pnpm run dev
```

### Producción
```bash
pnpm start
```

El servidor estará disponible en: `http://localhost:3000`

## Despliegue en Vercel (serverless)

- Express vive dentro de `api/index.js` como Serverless Function; `vercel.json` reescribe todas las rutas hacia esa función y fija runtime Node.js 20 con `maxDuration: 10s`.
- La conexión a MongoDB se abre bajo demanda y se reutiliza entre invocaciones. Usa una instancia gestionada (p. ej. MongoDB Atlas) y define `MONGODB_URI` en los Environment Variables de Vercel.
- Variables mínimas en Vercel: `MONGODB_URI`, `SESSION_SECRET`, `SESSION_NAME` (opcional), `SESSION_MAX_AGE` (opcional) y `LOG_LEVEL` (opcional).
- Desarrollo local: `pnpm run dev` sigue funcionando; si querés emular rutas serverless, `vercel dev` funciona con la misma configuración.
- Archivos estáticos se sirven con `express.static` desde `/public` dentro de la función. Si querés que Vercel los sirva directamente, podés moverlos a `/public` y quitar la reescritura global.
- Subida de imágenes: `src/utils/imageHandler.js` escribe en disco (`/public/...`), lo cual no es persistente en Vercel. Para producción migrá a un storage externo (S3, Cloudinary, etc.).

## Credenciales de acceso

Los usuarios se configuran en el archivo `.env` para mayor seguridad:

### Usuario Administrador
- **Usuario**: admin
- **Contraseña**: 123456
- **Rol**: Administrador

### Usuario Regular
- **Usuario**: meli209
- **Contraseña**: 123456
- **Rol**: Usuario

> **Nota de seguridad**: Las credenciales están almacenadas en variables de entorno (`.env`) para evitar compromisos de la base de datos. Cambia las contraseñas en producción.

## Modelos de datos

### Paciente (User)
- nombre
- apellido
- dni (único)
- telefono
- obraSocial (referencia)
- observaciones
- edad
- fechaNacimiento

### Obra Social
- nombre (único)
- telefono
- direccion
- padron

### Turno
- paciente (referencia)
- fecha
- hora
- diagnostico
- estado (pendiente, confirmado, cancelado, completado)

### Doctor
- userId (coincide con el usuario que inicia sesión)
- nombre
- apellido
- especialidad
- matrícula (opcional)
- datos de contacto

## Rutas principales

- `/` - Redirección al dashboard o login
- `/login` - Página de inicio de sesión
- `/dashboard` - Dashboard principal (requiere autenticación)
- `/pacientes` - Gestión de pacientes
- `/turnos` - Gestión de turnos
- `/obras-sociales` - Gestión de obras sociales
- `/logout` - Cerrar sesión

## Características de seguridad

- Sesiones seguras con connect-mongo
- Middleware de autenticación
- Validación de datos con express-validator
- Variables de entorno para datos sensibles
- **Usuarios y contraseñas almacenados en .env** (no en base de datos)
- Sistema de roles (admin/user)
- Protección contra compromiso de base de datos

## Gestión por doctor

- Cada usuario médico cuenta con un documento en la colección `Doctor` enlazado mediante `userId`.
- Los pacientes y turnos registran el campo `doctor`, por lo que los usuarios con rol `user` solo pueden ver y modificar sus propios registros.
- Los usuarios con rol `admin` siguen visualizando y gestionando toda la información.
- En el primer inicio de sesión de un doctor marcado con `assignLegacyRecords` (actualmente Ana Melis Gutierrez) se migran automáticamente los pacientes y turnos que no tenían doctor asignado.
- Para sumar nuevos profesionales basta con definir sus credenciales en `.env`, agregar su perfil en `authController` y, si es necesario, ejecutar una migración similar para sus registros.

## Próximos pasos / Mejoras sugeridas

- [ ] Implementar sistema de autenticación completo (bcrypt, JWT)
- [ ] Agregar roles y permisos de usuario
- [ ] Implementar búsqueda avanzada
- [ ] Agregar exportación de datos (Excel, PDF)
- [ ] Implementar calendario interactivo para turnos
- [ ] Migrar almacenamiento de imágenes a un servicio externo (S3/Cloudinary) compatible con serverless
- [ ] Agregar notificaciones por email/SMS
- [ ] Implementar historial médico detallado
- [ ] Agregar dashboard con estadísticas
- [ ] Implementar sistema de respaldos automáticos

## Documentación adicional

- **Arquitectura de capas:** consulta `docs/ARQUITECTURA.md` para entender cómo se organizan repositorios, servicios, DTOs, middlewares, validaciones, configuración, logging y manejo de imágenes.

## Licencia

ISC

## Deploy en Render (Node)

- Entry point: `pnpm start` (usa `src/server.js` y escucha `process.env.PORT`).
- Vars minimas: `MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL` (o `CORS_ORIGINS` si necesitas multiples dominios).
- Opcionales: `JWT_ISSUER`, `JWT_EXPIRES_IN`, `LOG_LEVEL`.
- Si usas `render.yaml` en la raiz, la config ya esta lista para Node + pnpm.
