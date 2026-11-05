/* ==========================================================
   REFERENCIAS A LOS ELEMENTOS DEL DOM
   ========================================================== */
const inputUsername    = document.getElementById("username");
const botonBuscar      = document.getElementById("buscar");
const indicadorCarga   = document.getElementById("loading");
const cajaError        = document.getElementById("error");
const contenedorResult = document.getElementById("resultado");
const imgAvatar        = document.getElementById("avatar");
const marcoAvatar      = document.querySelector(".avatar-marco");
const textoNombre      = document.getElementById("nombre");
const textoRepos       = document.getElementById("repos");
const enlacePerfil     = document.getElementById("perfil");
const consolaEventos   = document.getElementById("log");

/* ==========================================================
   1. log(mensaje, tipo)
   Escribe una línea en la consola de eventos de la interfaz.
   tipo: "info" | "ok" | "error"
   ========================================================== */
let consolaVacia = true;   // para quitar el texto inicial en el 1.er log

function log(mensaje, tipo = "info") {
  if (consolaVacia) {
    consolaEventos.textContent = "";   // borra el mensaje de bienvenida
    consolaVacia = false;
  }

  const linea = document.createElement("p");
  linea.className = "log-linea " + tipo;
  linea.textContent = "> " + mensaje;  // textContent: nunca innerHTML
  consolaEventos.appendChild(linea);

  // Mantenemos siempre visible la última línea
  consolaEventos.scrollTop = consolaEventos.scrollHeight;
}

/* ==========================================================
   2. validarUsername(username)
   Valida el texto ANTES de llamar a la API.
   Lanza Error (throw) si el texto no es válido: como la
   validación ocurre dentro del "try", el "catch" la captura
   y la muestra en pantalla.
   ========================================================== */
function validarUsername(username) {
  // a) Campo vacío
  if (!username) {
    throw new Error("Por favor escribe un nombre de usuario.");
  }

  // b) Elemento adicional: arroba "@" (ej. @octocat)
  if (username.includes("@")) {
    const sugerencia = username.replace(/@/g, "") || "octocat";
    throw new Error('El nombre de usuario no debe incluir "@". Escribe solo: ' + sugerencia);
  }

  // c) Espacios en el medio (ej. "octo cat")
  if (/\s/.test(username)) {
    throw new Error("El nombre de usuario no puede contener espacios.");
  }

  // d) Caracteres no permitidos (ej. "octo/cat", "octo!", "octo·cat")
  if (!/^[A-Za-z0-9-]+$/.test(username)) {
    throw new Error("El nombre de usuario contiene caracteres no permitidos.");
  }

  // e) Longitud máxima de GitHub: 39 caracteres
  if (username.length > 39) {
    throw new Error("El nombre de usuario no puede superar los 39 caracteres.");
  }

  // f) Formato de guiones: no empieza ni termina con "-" ni los tiene seguidos
  if (username.startsWith("-") || username.endsWith("-") || username.includes("--")) {
    throw new Error(
      "El nombre de usuario tiene un formato inválido: no puede empezar ni terminar con \"-\" ni tener guiones seguidos."
    );
  }
}

/* ==========================================================
   3. buscarUsuario(username)  (async)
   Hace el fetch a la API de GitHub y traduce las respuestas
   HTTP en errores comprensibles con throw.
   ========================================================== */
async function buscarUsuario(username) {
  const url = "https://api.github.com/users/" + encodeURIComponent(username);
  log("GET " + url, "info");

  // Si no hay internet, fetch lanza un TypeError que subirá al catch
  const respuesta = await fetch(url);

  // 404 → el usuario no existe
  if (respuesta.status === 404) {
    throw new Error('Usuario "' + username + '" no encontrado (código 404)');
  }

  // 403 → límite de peticiones sin autenticación alcanzado
  if (respuesta.status === 403) {
    throw new Error(
      "Límite de peticiones de GitHub alcanzado. Intenta de nuevo en unos minutos (código 403)."
    );
  }

  // Cualquier otro código distinto de 200
  if (!respuesta.ok) {
    throw new Error("GitHub respondió con el código " + respuesta.status);
  }

  // Todo bien: devolvemos los datos en formato JSON
  const datos = await respuesta.json();
  return datos;
}

/* ==========================================================
   4. Pintar resultados y mostrar errores
   ========================================================== */
function pintarUsuario(datos) {
  // Avatar con respaldo si la imagen no carga
  imgAvatar.classList.remove("oculto");
  marcoAvatar.classList.remove("sin-avatar");
  imgAvatar.src = datos.avatar_url;
  imgAvatar.alt = "Avatar de " + datos.login;   // alt con el login

  // Si no tiene nombre público mostramos el login
  textoNombre.textContent = datos.name || datos.login;

  textoRepos.textContent = String(datos.public_repos);

  enlacePerfil.href = datos.html_url;

  contenedorResult.classList.remove("oculto");
}

function mostrarError(mensaje) {
  cajaError.textContent = mensaje;   // dentro de #error (ícono por CSS)
  cajaError.classList.remove("oculto");
}

/* ==========================================================
   5. FLUJO PRINCIPAL: try / catch / finally
   ========================================================== */
async function realizarBusqueda() {
  // Evita búsquedas simultáneas mientras el botón está deshabilitado
  if (botonBuscar.disabled) return;

  // (1) Leer y limpiar el valor del input
  const username = inputUsername.value.trim();

  // (2) Reset visual: ocultar resultado y error anterior
  contenedorResult.classList.add("oculto");
  cajaError.classList.add("oculto");
  cajaError.textContent = "";

  // (3) Deshabilitar el botón y mostrar la carga
  botonBuscar.disabled = true;
  indicadorCarga.classList.remove("oculto");

  try {
    // ---------- BLOQUE TRY: todo lo que puede fallar ----------
    log("▶ Inicio del bloque try.", "info");

    // Validación local (sin tocar la API). Si falla, saltamos al catch
    validarUsername(username);
    log("Usuario validado correctamente: " + username, "ok");

    // Consulta a la API de GitHub
    log("Consultando la API de GitHub…", "info");
    const datos = await buscarUsuario(username);

    // Todo salió bien: pintamos los datos en pantalla
    pintarUsuario(datos);
    log('✔ Usuario "' + datos.login + '" encontrado. Datos pintados en pantalla.', "ok");

  } catch (error) {
    // ---------- BLOQUE CATCH: siempre se ejecuta si algo falla ----------
    // Sin conexión, fetch lanza TypeError → mostramos mensaje amigable
    const mensaje = error instanceof TypeError
      ? "No se pudo conectar. Revisa tu conexión a internet."
      : (error && error.message) || "Ha ocurrido un error inesperado.";

    mostrarError(mensaje);
    log("✖ Error capturado en el catch: " + mensaje, "error");

  } finally {
    // ---------- BLOQUE FINALLY: se ejecuta SIEMPRE ----------
    // Oculta la carga y vuelve a habilitar el botón (nunca se queda colgada)
    indicadorCarga.classList.add("oculto");
    botonBuscar.disabled = false;
    log("Búsqueda finalizada (bloque finally ejecutado).", "ok");
  }
}

/* ==========================================================
   6. EVENTOS DE INTERACCIÓN
   ========================================================== */

// Clic en el botón "Buscar"
botonBuscar.addEventListener("click", realizarBusqueda);

// Tecla Enter dentro del input
inputUsername.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    evento.preventDefault();
    realizarBusqueda();
  }
});

// Respaldo del avatar: si la imagen no carga, mostramos un fondo de respaldo
imgAvatar.addEventListener("error", function () {
  imgAvatar.classList.add("oculto");
  marcoAvatar.classList.add("sin-avatar");
});

// Si el avatar carga bien, restauramos la imagen
imgAvatar.addEventListener("load", function () {
  imgAvatar.classList.remove("oculto");
  marcoAvatar.classList.remove("sin-avatar");
});
