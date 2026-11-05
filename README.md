# Buscador de usuarios de GitHub

Ejercicio didáctico de **front-end** sobre manejo de errores con `try / catch / finally`
y peticiones asíncronas con `fetch`, consumiendo la API pública de GitHub.

Diseño **neo-brutalista en modo claro** (fondo crema, bordes negros gruesos, sombras duras
sin difuminar, colores planos y vivos). Sin frameworks, sin librerías, sin CDN y sin paso de
compilación: el código está separado en **HTML + CSS + JS**.

---

## 1. Cómo abrirlo

1. Ve a la carpeta `buscador-github/`.
2. **Doble clic en `buscador-github.html`** → se abre en tu navegador por defecto.
3. Escribe un usuario de GitHub (por ejemplo `octocat`) y pulsa **Buscar** o la tecla **Enter**.

> **Importante:** el HTML carga `css/styles.css` y `js/app.js` con rutas relativas, así que
> mueve la **carpeta `buscador-github/` completa** (no solo el HTML): si copias el HTML suelto,
> la página se abriría sin estilos ni JavaScript.
>
> No necesita servidor ni instalación (doble clic basta: `<link>` y `<script src>` clásicos
> funcionan con `file://`, aquí no se usan módulos ES). Solo necesita internet para consultar la
> API de GitHub; si no hay conexión, la página se ve bien igual y aparece el error correspondiente.

---

## 2. Qué hace la página

- Escribe un nombre de usuario de GitHub y, al hacer clic o pulsar **Enter**, muestra:
  - **Nombre** público (si no tiene, muestra su `login`)
  - **Avatar**
  - **Cantidad de repositorios públicos** (badge violeta)
  - Enlace **“Ver perfil en GitHub →”** (se abre en pestaña nueva)
- Si el usuario no existe, el texto es inválido o falla la conexión, aparece una **caja de error**
  en pantalla (nunca se rompe la aplicación ni se queda el botón deshabilitado).
- La **consola de eventos** (bloque negro estilo terminal) registra el flujo
  `try / catch / finally` paso a paso, línea a línea.

---

## 3. Estructura del proyecto

El código está **separado por capas**: HTML (estructura), CSS (estilo) y JS (lógica).

```
buscador-github/
├── buscador-github.html   ← solo HTML: estructura y IDs de la interfaz
├── css/
│   └── styles.css         ← solo CSS: tokens, layout, animaciones y responsive
├── js/
│   └── app.js             ← solo JS: log, validación, fetch y try/catch/finally
└── README.md              ← este archivo
```

Cómo se enlazan:

- En el `<head>`: `<link rel="stylesheet" href="css/styles.css" />`
- Al final del `<body>`: `<script src="js/app.js"></script>`
  (se carga al final para que el DOM exista cuando el JS pida los elementos con `getElementById`)

Orden interno del HTML: `<head>` (charset, viewport, título y `<link>`) → `<body>` con
`<main class="container">` → `<script src="js/app.js">` al final del `<body>`.

Organización del CSS, por secciones comentadas:

| Sección | Contenido |
|---|---|
| 1 | Tokens de diseño (`:root`) |
| 2 | Base y tipografía |
| 3 | Contenedor principal |
| 4 | Encabezado (franja amarilla) |
| 5 | Barra de búsqueda |
| 6 | Indicador de carga |
| 7 | Caja de error |
| 8 | Resultado (tarjeta) |
| 9 | Consola de eventos |
| 10 | Animaciones y `prefers-reduced-motion` |
| 11 | Responsive |

Organización del JS, por bloques comentados:

| Bloque | Contenido |
|---|---|
| Referencias | `getElementById` de los IDs fijos |
| 1 | `log(mensaje, tipo)` |
| 2 | `validarUsername(username)` |
| 3 | `buscarUsuario(username)` |
| 4 | `pintarUsuario(datos)` / `mostrarError(mensaje)` |
| 5 | `realizarBusqueda()` → `try / catch / finally` |
| 6 | Eventos (clic, Enter, avatar) |

Elementos fijos que usa el JavaScript:

| ID | Función |
|---|---|
| `#username` | input de texto |
| `#buscar` | botón de búsqueda |
| `#loading` | indicador de carga |
| `#error` | caja de mensajes de error |
| `#resultado` | tarjeta con los datos |
| `#avatar` | imagen del avatar |
| `#nombre` | nombre (o login) |
| `#repos` | número de repos públicos |
| `#perfil` | enlace al perfil (`target="_blank"` + `rel="noopener noreferrer"`) |
| `#log` | consola de eventos |

---

## 4. Explicación breve: el flujo `try / catch / finally`

Cada búsqueda se ejecuta dentro de una única función `async` con tres bloques:

```text
1. Se lee y limpia (trim) el input, se ocultan resultados/errores anteriores,
   se deshabilita el botón y se muestra "Cargando información...".

2. try {
       validarUsername(username)      → lanza Error si el texto es inválido (@, espacios, etc.)
       datos = await buscarUsuario(username)  → fetch a la API; lanza Error en 404 / 403 / otro código
       pintarUsuario(datos)           → avatar, nombre, repos y enlace con textContent
       log de éxito
   } catch (error) {
       // Captura CUALQUIER fallo: validación, HTTP o de red
       // (TypeError de fetch sin internet → mensaje "No se pudo conectar...")
       se muestra error.message dentro de #error
       se registra el error en la consola de eventos
   } finally {
       // Se ejecuta SIEMPRE, haya habido éxito o error
       se oculta #loading
       se vuelve a habilitar #buscar
       se escribe "Búsqueda finalizada (bloque finally ejecutado)."
   }
```

Ideas clave que demuestra el ejercicio:

- **`throw` dentro del `try`**: la validación (`validarUsername`) lanza el error *antes* de
  llamar a la API, y como ocurre dentro del `try`, es el `catch` quien lo captura y lo pinta.
  Por eso `@octocat` muestra el mensaje de la `@` sin hacer ninguna petición.
- **`catch` centraliza todos los fallos**: texto inválido, 404, 403, cualquier otro código HTTP
  y la falta de conexión (`TypeError`) se resuelven en un solo sitio.
- **`finally` garantiza que la app no se quede “colgada”**: aunque todo falle, el indicador de
  carga se oculta y el botón se reactiva siempre.

---

## 5. Cómo probarlo (casos de prueba)

| # | Entrada | Resultado esperado |
|---|---|---|
| 1 | `octocat` | Tarjeta con avatar, nombre y repos públicos |
| 2 | `torvalds` | Tarjeta con datos del usuario |
| 3 | `usuario-que-no-existe-987654` | Error: usuario no encontrado (código 404) |
| 4 | `@octocat` | Error: no debe incluir `@` (sin llamar a la API) |
| 5 | `` (vacío) | Error: “Por favor escribe un nombre de usuario.” |
| 6 | `octo cat` | Error: no puede contener espacios |
| 7 | `octo!cat` | Error: caracteres no permitidos |
| 8 | `-octocat` | Error: formato inválido de guiones |
| 9 | Sin internet + `octocat` | Error de conexión; el botón vuelve a estar activo |

Comprobaciones adicionales:

- Pulsa **Enter** en el input → dispara la búsqueda.
- Observa la **consola de eventos**: siempre aparece el inicio del `try`, el resultado
  (éxito o error capturado) y la línea *“Búsqueda finalizada (bloque finally ejecutado).”*.
- El botón se griscea durante la carga y **siempre** vuelve a su estado activo.
- Redimensiona la ventana a 320 px → la barra de búsqueda se apila (input arriba, botón abajo).

---

## 6. API utilizada

- Endpoint: `GET https://api.github.com/users/{username}` (sin autenticación ni API key).
- Campos usados de la respuesta: `login`, `name`, `avatar_url`, `public_repos`, `html_url`.
- Respuestas contempladas:
  - `200` → usuario encontrado.
  - `404` → usuario no existe → `Usuario "X" no encontrado (código 404)`.
  - `403` → límite de peticiones sin autenticación → mensaje específico (código 403).
  - Error de red → `fetch` lanza `TypeError` → *“No se pudo conectar. Revisa tu conexión a internet.”*

---

## 7. Decisiones de diseño y supuestos

- **Tema neo-brutalista claro** con los tokens `--bg`, `--surface`, `--ink`, `--accent`,
  `--accent-2`, `--ok`, `--danger`, `--terminal`, sombras duras (`6px 6px 0`) y bordes de 3 px.
- **Tipografías solo del sistema** (`Arial Black` para títulos, `system-ui` para texto,
  `ui-monospace` para la consola): el proyecto no depende de internet para su estilo.
- La caja de error usa el **ícono ⚠️ mediante CSS (`::before`)** para que el mensaje se escriba
  directamente dentro de `#error` con `textContent`.
- El avatar se envuelve en un `div.avatar-marco` para poder darle borde, esquinas redondeadas
  y un **fondo de respaldo** si la imagen no carga (`onerror` → se muestra un emoji 👤).
- `white-space: pre-wrap` en la consola para que las URLs largas no desborden;
  `max-height: 140px` con scroll interno.
- Se añade una guarda (`if (botonBuscar.disabled) return;`) para evitar búsquedas simultáneas
  mientras el botón está deshabilitado; no cambia el comportamiento pedido, solo lo hace robusto.
