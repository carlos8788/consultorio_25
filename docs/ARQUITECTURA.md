# Arquitectura de Capas

Esta app se estructuró para escalar funciones del CRM médico separando responsabilidades. A continuación un resumen de cada capa y su ubicación:

## Rutas y Controladores
- **Rutas (`src/routes/`)** definen endpoints y aplican middlewares/validaciones.
- **Controladores (`src/controllers/`)** coordinan cada request: obtienen parámetros, invocan servicios y seleccionan la vista/respuesta.

## Servicios (`src/services/`)
- Encapsulan la lógica de negocio (reglas por doctor, asignaciones automáticas, formatos).
- Ejemplos: `authService` maneja login y sesión, `doctorService` sincroniza perfiles, `pacienteService` y `turnoService` controlan CRUD con filtros por doctor.

## Repositorios (`src/repositories/`)
- Proveen acceso a datos en Mongoose con funciones específicas (paginación, búsquedas, migraciones).
- Permite cambiar almacenamiento sin tocar servicios/controladores.

## DTOs (`src/dtos/`)
- Transforman documentos de Mongo en estructuras listas para las vistas (formateo de fecha, flags de UI, nombres derivados).
- Evita tener lógica de presentación en controladores o plantillas.

## Middlewares
- `auth.js` protege rutas.
- `requestContext.js` agrega `req.context` / `res.locals.context` con datos del usuario (rol, doctorId, ruta actual) para compartirlos entre capas.
- `validate.js` centraliza el manejo de errores de `express-validator`.

## Configuración (`src/config/`)
- `users.js` define el catálogo de usuarios soportados y cómo leerlos desde variables de entorno.
- Centralizar config evita duplicar datos en controladores/servicios.

## Validaciones (`src/validators/`)
- Cada archivo define reglas por recurso (ej. `pacienteValidator` para altas/ediciones).
- Se combinan con `validate` para responder errores consistentes.

## Logging (`src/logger/`)
- `logger` formatea mensajes con timestamp y niveles (`info`, `warn`, `error`, `debug`).
- Reemplaza `console.*` para tener trazas homogéneas y facilitar integrar proveedores externos en el futuro.

## Manejo de Imágenes (`src/utils/imageHandler.js`)
- Helpers para construir rutas públicas, guardar imágenes en Base64 y eliminarlas con control de errores.
- Aún no se usan en producción, pero sirven como punto único cuando se agreguen avatares/documentos.

## Flujo resumido
1. La ruta recibe la petición y ejecuta validaciones + `attachRequestContext`.
2. El controlador delega en el servicio correspondiente.
3. El servicio usa repositorios para acceder a datos y DTOs para preparar la respuesta.
4. El controlador renderiza la vista o retorna JSON.

> Para contribuir, mantené cada cambio dentro de la capa adecuada: lógica de negocio en servicios, acceso a datos en repositorios, detalles de UI en DTOs/vistas.
