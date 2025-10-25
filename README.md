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
├── src/
│   ├── config/          # Configuraciones (BD)
│   ├── models/          # Modelos de Mongoose
│   ├── controllers/     # Controladores
│   ├── routes/          # Rutas
│   ├── middlewares/     # Middlewares
│   ├── validators/      # Validadores
│   ├── views/           # Vistas de Handlebars
│   │   ├── layouts/     # Layouts
│   │   ├── partials/    # Componentes reutilizables
│   │   └── pages/       # Páginas
│   └── app.js           # Archivo principal
├── public/              # Archivos estáticos
│   ├── css/
│   ├── js/
│   └── img/
├── .env                 # Variables de entorno
├── .env.example         # Ejemplo de variables de entorno
├── package.json
└── README.md
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

## Próximos pasos / Mejoras sugeridas

- [ ] Implementar sistema de autenticación completo (bcrypt, JWT)
- [ ] Agregar roles y permisos de usuario
- [ ] Implementar búsqueda avanzada
- [ ] Agregar exportación de datos (Excel, PDF)
- [ ] Implementar calendario interactivo para turnos
- [ ] Agregar notificaciones por email/SMS
- [ ] Implementar historial médico detallado
- [ ] Agregar dashboard con estadísticas
- [ ] Implementar sistema de respaldos automáticos

## Licencia

ISC
