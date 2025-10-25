# Sistema de Navegación Activa

Este documento explica cómo funciona el sistema de navegación activa que marca automáticamente el elemento del menú correspondiente a la página actual.

## Componentes

### 1. Script JavaScript (`public/js/main.js`)

Al final del archivo `main.js` se agregó la función `setActiveMenuItem()`:

```javascript
function setActiveMenuItem() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('#navmenu a');
  
  navLinks.forEach(link => {
    // Remover clase active de todos los links
    link.classList.remove('active');
    
    const linkPath = new URL(link.href).pathname;
    
    // Comparación exacta o por prefijo
    if (currentPath === linkPath) {
      link.classList.add('active');
    } else if (currentPath.startsWith(linkPath) && linkPath !== '/dashboard' && linkPath.length > 1) {
      link.classList.add('active');
    }
    
    // Caso especial para dashboard
    if (currentPath === '/' || currentPath === '/dashboard') {
      if (linkPath === '/dashboard') {
        link.classList.add('active');
      }
    }
  });
}
```

**Funcionamiento:**
1. Obtiene la ruta actual del navegador (`window.location.pathname`)
2. Selecciona todos los enlaces del menú de navegación
3. Remueve la clase `active` de todos los enlaces
4. Compara cada enlace con la ruta actual
5. Agrega la clase `active` al enlace que coincida

**Eventos:**
- `DOMContentLoaded`: Se ejecuta cuando la página carga
- `popstate`: Se ejecuta cuando se navega con los botones adelante/atrás del navegador

### 2. Header sin clases hardcodeadas (`src/views/partials/header.hbs`)

El header ya no tiene la clase `active` hardcodeada:

```handlebars
<nav id="navmenu" class="navmenu">
  <ul>
    <li><a href="/dashboard">Dashboard</a></li>
    <li><a href="/pacientes">Pacientes</a></li>
    <li><a href="/turnos">Turnos</a></li>
    <li><a href="/obras-sociales">Obras Sociales</a></li>
  </ul>
</nav>
```

### 3. Middleware Express (`src/app.js`)

Se agregó `currentPath` al middleware que pasa datos a las vistas:

```javascript
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAuthenticated = !!req.session.user;
  res.locals.currentPath = req.path;  // ✅ Ruta actual disponible en vistas
  next();
});
```

Esto permite usar `{{currentPath}}` en cualquier vista Handlebars si es necesario.

## Rutas soportadas

| Ruta | Elemento activo |
|------|----------------|
| `/` | Dashboard |
| `/dashboard` | Dashboard |
| `/pacientes` | Pacientes |
| `/pacientes/123` | Pacientes |
| `/turnos` | Turnos |
| `/turnos/123` | Turnos |
| `/obras-sociales` | Obras Sociales |
| `/obras-sociales/123` | Obras Sociales |

## Lógica de coincidencia

1. **Coincidencia exacta**: Si la ruta coincide exactamente, se marca como activa
2. **Coincidencia por prefijo**: Si la ruta actual comienza con la ruta del enlace (excepto `/dashboard`), se marca como activa
3. **Caso especial dashboard**: `/` y `/dashboard` ambos activan el enlace de Dashboard

## Agregar nuevas rutas

Para agregar un nuevo elemento al menú:

1. Agregar el enlace en `src/views/partials/header.hbs`:
```handlebars
<li><a href="/nueva-ruta">Nueva Sección</a></li>
```

2. El script automáticamente manejará la clase `active` sin necesidad de modificaciones adicionales

## Estilos CSS

La clase `.active` está definida en el template MediTrust (`public/css/main.css`) y aplica estilos visuales para indicar el elemento activo del menú.

## Debugging

Para verificar que funciona correctamente, abre la consola del navegador y ejecuta:

```javascript
// Ver ruta actual
console.log(window.location.pathname);

// Ver enlaces del menú
document.querySelectorAll('#navmenu a').forEach(link => {
  console.log(link.href, link.classList.contains('active'));
});
```

## Notas importantes

- ✅ No requiere recarga de página
- ✅ Funciona con navegación por botones del navegador
- ✅ Soporta rutas con parámetros (ej: `/pacientes/123`)
- ✅ Pure JavaScript vanilla (sin dependencias)
- ✅ Compatible con el template MediTrust
