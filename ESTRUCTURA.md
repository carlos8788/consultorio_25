# Estructura del Proyecto

## Carpetas Principales

```
CONSULTORIO_25/
├── HTML/                    # Template original (MediTrust) - SOLO REFERENCIA
├── public/                  # ✅ ÚNICA CARPETA DE ARCHIVOS ESTÁTICOS
│   ├── css/
│   │   └── main.css        # Estilos principales del template
│   ├── js/
│   │   └── main.js         # JavaScript principal del template
│   ├── img/                # Imágenes del template
│   ├── scss/               # Archivos SCSS del template
│   └── vendor/             # Librerías de terceros
│       ├── bootstrap/
│       ├── bootstrap-icons/
│       ├── aos/
│       ├── fontawesome-free/
│       ├── swiper/
│       ├── glightbox/
│       └── ...
└── src/
    ├── config/
    ├── models/
    ├── controllers/
    ├── routes/
    ├── middlewares/
    ├── validators/
    ├── views/
    │   ├── layouts/
    │   │   ├── main.hbs    # Layout principal con template MediTrust
    │   │   └── auth.hbs    # Layout de login
    │   ├── partials/
    │   │   ├── header.hbs  # Header del template
    │   │   └── footer.hbs  # Footer del template
    │   └── pages/
    │       ├── login.hbs
    │       ├── dashboard.hbs
    │       ├── pacientes.hbs
    │       ├── turnos.hbs
    │       ├── obrasSociales.hbs
    │       └── error.hbs
    └── app.js
```

## Archivos Estáticos

### ✅ CORRECTO - Una sola carpeta public en la raíz

```
public/
├── css/main.css           → /css/main.css
├── js/main.js             → /js/main.js
├── img/                   → /img/...
├── vendor/bootstrap/      → /vendor/bootstrap/...
└── vendor/...
```

### ❌ INCORRECTO - No usar estas ubicaciones

- ~~src/public/~~ (ELIMINADA)
- ~~HTML/assets/~~ (Solo referencia, no se usa en producción)

## Rutas en las vistas

En los archivos `.hbs` usar rutas absolutas desde `/`:

```html
<!-- CSS -->
<link href="/css/main.css" rel="stylesheet">
<link href="/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet">

<!-- JavaScript -->
<script src="/js/main.js"></script>
<script src="/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>

<!-- Imágenes -->
<img src="/img/logo.webp" alt="Logo">
```

## Template MediTrust

El proyecto usa el template **MediTrust** de BootstrapMade, un template profesional para consultorios médicos que incluye:

- ✅ Bootstrap 5
- ✅ Bootstrap Icons
- ✅ FontAwesome
- ✅ AOS (Animate On Scroll)
- ✅ Swiper (Carruseles)
- ✅ GLightbox (Lightbox/Galería)
- ✅ Diseño responsive
- ✅ Animaciones suaves
- ✅ Estilos médicos profesionales

## Layouts

### main.hbs
Layout principal para páginas autenticadas. Incluye:
- Header con navegación
- Footer
- Scripts del template
- Estilos del template

### auth.hbs
Layout para páginas de autenticación (login). Incluye:
- Fondo degradado
- Estilos minimalistas
- Sin header/footer

## Partials

### header.hbs
- Logo del consultorio
- Navegación principal
- Menú de usuario
- Botón de nuevo turno

### footer.hbs
- Información de contacto
- Enlaces útiles
- Horarios de atención
- Copyright

## Notas Importantes

1. **NO** modificar archivos en `HTML/` - es solo referencia
2. **SÍ** usar archivos de `public/` - es la única carpeta servida
3. Todos los assets están copiados de `HTML/assets/` a `public/`
4. Las rutas en las vistas usan `/` como raíz
5. Express sirve `public/` como estático en la línea: `app.use(express.static(path.join(__dirname, '../public')));`
