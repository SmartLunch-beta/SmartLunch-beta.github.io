const STORAGE_KEYS = {
  users: 'smartLunchUsers',
  currentUser: 'smartLunchCurrentUser',
  products: 'smartLunchProducts',
  pedidos: 'smartLunchPedidos',
  carrito: 'smartLunchCarrito',
  tema: 'smartLunchTema'
};

const seedUsers = [
  { id: 1, username: 'administrador', passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', nombre: 'Administrador', email: 'admin@smartlunch.com', rol: 'administrador', grado: 'Admin', correo: 'admin@smartlunch.com', favoritos: [] },
  { id: 2, username: 'usuario', passwordHash: 'dfa7a2273567dcd1efffb9a46308e91c20fa13c44c3441bc69cd6a7869b3f7fd', nombre: 'Usuario Demo', email: 'usuario@smartlunch.com', rol: 'usuario', grado: '5° Secundaria A', correo: 'usuario@smartlunch.com', favoritos: [] }
];

const seedProducts = [
  { id: 1, nombre: 'Sándwich de pollo', precio: 6, categoria: 'sandwich', stock: 20, imagen: './imagenes/Sandwitch1.jpg', estado: 'activo', activo: true },
  { id: 2, nombre: 'Sándwich Mixto', precio: 5, categoria: 'sandwich', stock: 15, imagen: './imagenes/SandwitchMixto.jpg', estado: 'activo', activo: true },
  { id: 3, nombre: 'Jugo de naranja', precio: 3, categoria: 'bebida', stock: 25, imagen: './imagenes/jugonaranja.jpg', estado: 'activo', activo: true },
  { id: 4, nombre: 'Gaseosa', precio: 3.5, categoria: 'bebida', stock: 18, imagen: './imagenes/gaseosas2.jpg', estado: 'activo', activo: true },
  { id: 5, nombre: 'Yogurt', precio: 3, categoria: 'bebida', stock: 12, imagen: './imagenes/yogurt.jpg', estado: 'activo', activo: true },
  { id: 6, nombre: 'Pizza personal', precio: 5, categoria: 'snack', stock: 10, imagen: './imagenes/pizza.jpg', estado: 'activo', activo: true },
  { id: 7, nombre: 'Empanada', precio: 4, categoria: 'snack', stock: 14, imagen: './imagenes/empanadas.jpg', estado: 'activo', activo: true },
  { id: 8, nombre: 'Galletas', precio: 2.5, categoria: 'snack', stock: 30, imagen: './imagenes/Galletas.jpg', estado: 'activo', activo: true },
  { id: 9, nombre: 'Manzana', precio: 1, categoria: 'fruta', stock: 40, imagen: './imagenes/manzana.jpg', estado: 'activo', activo: true },
  { id: 10, nombre: 'Platano', precio: 0.5, categoria: 'fruta', stock: 35, imagen: './imagenes/platano.jpg', estado: 'activo', activo: true },
  { id: 11, nombre: 'Granadilla', precio: 0.75, categoria: 'fruta', stock: 22, imagen: './imagenes/granadilla.jpg', estado: 'activo', activo: true }
];

let carrito = [];
let categoriaActual = 'todos';
let busquedaActual = '';
let ordenActual = 'relevancia';
let precioMin = 0;
let precioMax = 9999;

function getPageName() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.currentUser);
  return raw ? JSON.parse(raw) : null;
}

function saveCurrentUser(user) {
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
  localStorage.setItem('usuarioActual', user.username);
  localStorage.setItem('tipoUsuario', user.rol);
}

function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  localStorage.removeItem('usuarioActual');
  localStorage.removeItem('tipoUsuario');
}

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000;
let inactivityTimerId = null;
let inactivityPopupShown = false;

function resetInactivityTimer() {
  clearTimeout(inactivityTimerId);
  if (!getCurrentUser() || getPageName() === 'login.html') return;
  inactivityTimerId = setTimeout(() => {
    showInactivityPopup();
  }, INACTIVITY_TIMEOUT_MS);
}

function handleUserActivity() {
  if (inactivityPopupShown) return;
  resetInactivityTimer();
}

function showInactivityPopup() {
  if (inactivityPopupShown) return;
  inactivityPopupShown = true;

  const overlay = document.createElement('div');
  overlay.id = 'popup-inactividad';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <h3>Sesión cerrada</h3>
      <p>Tu sesión se cerró por inactividad.</p>
      <div class="btn-row">
        <button class="btn-primary" type="button">Aceptar</button>
      </div>
    </div>
  `;

  const button = overlay.querySelector('button');
  button.addEventListener('click', () => {
    overlay.remove();
    cerrarSesion();
  });

  document.body.appendChild(overlay);
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      overlay.remove();
    }
    cerrarSesion();
  }, 3000);
}

function initializeInactivityMonitor() {
  const user = getCurrentUser();
  if (!user || getPageName() === 'login.html') return;

  ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, handleUserActivity, true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      handleUserActivity();
    }
  });

  resetInactivityTimer();
}

function getUsers() {
  const raw = localStorage.getItem(STORAGE_KEYS.users);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

function normalizarProducto(producto) {
  const activo = producto.activo ?? (producto.estado !== 'disable');
  return {
    ...producto,
    activo,
    estado: producto.estado || (activo ? 'activo' : 'disable')
  };
}

function getProducts() {
  const raw = localStorage.getItem(STORAGE_KEYS.products);
  const products = raw ? JSON.parse(raw) : [];
  const normalized = products.map(normalizarProducto);
  if (JSON.stringify(normalized) !== JSON.stringify(products)) {
    saveProducts(normalized);
  }
  return normalized;
}

function saveProducts(products) {
  const normalized = (products || []).map(normalizarProducto);
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(normalized));
}

function getPedidos() {
  const raw = localStorage.getItem(STORAGE_KEYS.pedidos);
  return raw ? JSON.parse(raw) : [];
}

function savePedidos(pedidos) {
  localStorage.setItem(STORAGE_KEYS.pedidos, JSON.stringify(pedidos));
}

async function loadJsonWithFallback(url, fallback) {
  if (window.location.protocol === 'file:') {
    return fallback;
  }

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo cargar el archivo');
    const data = await response.json();
    return Array.isArray(data) ? data : fallback;
  } catch (error) {
    return fallback;
  }
}

async function loadSeedData() {
  const usersFromStorage = getUsers();
  const productsFromStorage = getProducts();

  const usuarios = await loadJsonWithFallback('./database/usuarios.json', seedUsers);
  const productos = await loadJsonWithFallback('./database/productos.json', seedProducts);

  if (!usersFromStorage.length) {
    saveUsers(usuarios);
  }

  if (!productsFromStorage.length) {
    saveProducts(productos);
  }

  const users = getUsers();
  if (!users.some(user => user.username === 'administrador')) {
    saveUsers([...users, { id: Date.now(), username: 'administrador', passwordHash: await hashPassword('admin123'), nombre: 'Administrador', email: 'admin@smartlunch.com', rol: 'administrador', grado: 'Admin', correo: 'admin@smartlunch.com', favoritos: [] }]);
  }

  const products = getProducts();
  if (!products.length) {
    saveProducts(productos);
  }
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function cambiarTema(modo) {
  const isDark = modo === 'oscuro';
  document.documentElement.classList.toggle('theme-dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  document.documentElement.style.backgroundColor = isDark ? '#020617' : '#f3f4f6';
  document.body.classList.toggle('dark-mode', isDark);
  document.body.style.backgroundColor = isDark ? '#020617' : '#f3f4f6';
  document.body.style.transition = 'none';
  localStorage.setItem(STORAGE_KEYS.tema, modo);
}

function aplicarTema() {
  const modo = localStorage.getItem(STORAGE_KEYS.tema) || 'claro';
  const isDark = modo === 'oscuro';
  document.documentElement.classList.toggle('theme-dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  document.documentElement.style.backgroundColor = isDark ? '#020617' : '#f3f4f6';
  document.body.classList.toggle('dark-mode', isDark);
  document.body.style.backgroundColor = isDark ? '#020617' : '#f3f4f6';
  document.body.style.transition = 'none';
}

function actualizarEstadoAdmin() {
  const user = getCurrentUser();
  const page = getPageName();
  const esAdmin = user?.rol === 'administrador' && ['intranet.html', 'quiosco.html'].includes(page);
  document.body.classList.toggle('admin-page', esAdmin);
}

function redirectIfNeeded() {
  const page = getPageName();
  const user = getCurrentUser();
  const protectedPages = ['index.html', 'favoritos.html', 'historial.html', 'configuracion.html', 'intranet.html', 'quiosco.html'];
  const adminPages = ['intranet.html', 'quiosco.html'];

  if (page === 'login.html') {
    if (user) {
      window.location.href = user.rol === 'administrador' ? './intranet.html' : './index.html';
    }
    return;
  }

  if (!user && protectedPages.includes(page)) {
    window.location.href = './login.html';
    return;
  }

  if (adminPages.includes(page) && user?.rol !== 'administrador') {
    window.location.href = './index.html';
  }
}

function llenarSidebar() {
  const currentUser = getCurrentUser();
  const config = window.APP_CONFIG || {};
  document.querySelectorAll('.sidebar ul').forEach(ul => {
    const intranetItem = ul.querySelector('a[href="./intranet.html"]')?.closest('li');
    if (intranetItem) {
      intranetItem.style.display = currentUser?.rol === 'administrador' ? '' : 'none';
    }

    const links = ul.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === './index.html') {
        link.innerHTML = `${config.modules?.find(m => m.key === 'inicio')?.icon || '🏠'} ${config.modules?.find(m => m.key === 'inicio')?.label || 'Inicio'}`;
      } else if (href === './favoritos.html') {
        link.innerHTML = `${config.modules?.find(m => m.key === 'favoritos')?.icon || '⭐'} ${config.modules?.find(m => m.key === 'favoritos')?.label || 'Favoritos'}`;
      } else if (href === './historial.html') {
        link.innerHTML = `${config.modules?.find(m => m.key === 'historial')?.icon || '📋'} ${config.modules?.find(m => m.key === 'historial')?.label || 'Historial'}`;
      } else if (href === './configuracion.html') {
        link.innerHTML = `${config.modules?.find(m => m.key === 'configuracion')?.icon || '⚙️'} ${config.modules?.find(m => m.key === 'configuracion')?.label || 'Configuración'}`;
      } else if (href === './intranet.html') {
        link.innerHTML = `${config.modules?.find(m => m.key === 'intranet')?.icon || '🧑‍💼'} ${config.modules?.find(m => m.key === 'intranet')?.label || 'Intranet'}`;
      } else if (href === '#' && link.textContent.includes('Cerrar')) {
        link.innerHTML = `🚪 ${config.cerrarSesionLabel || 'Cerrar sesión'}`;
      }
    });
  });
}

async function manejarAccion() {
  const username = document.getElementById('usuario')?.value.trim();
  const password = document.getElementById('clave')?.value.trim();
  const email = document.getElementById('correo')?.value.trim();
  const registro = document.getElementById('registro-extra')?.style.display === 'block';

  if (!username || !password) {
    alert('Completa usuario y contraseña.');
    return;
  }

  if (registro) {
    if (!email) {
      alert('Ingresa un correo para crear la cuenta.');
      return;
    }
    await registrarUsuario(username, password, email);
    return;
  }

  await iniciarSesion(username, password);
}

function getUserByCredentials(users, username, passwordHash) {
  return users.find(user => {
    const usernameMatch = user.username?.toLowerCase() === username.toLowerCase() || user.email?.toLowerCase() === username.toLowerCase() || user.correo?.toLowerCase() === username.toLowerCase();
    const passwordMatch = user.passwordHash === passwordHash || user.password === passwordHash || user.password === passwordHash;
    return usernameMatch && passwordMatch;
  });
}

async function iniciarSesion(username, password) {
  const users = getUsers();
  const passwordHash = await hashPassword(password);
  const match = getUserByCredentials(users, username, passwordHash);

  if (!match) {
    alert('Usuario o contraseña incorrectos.');
    return;
  }

  saveCurrentUser(match);
  window.location.href = match.rol === 'administrador' ? './intranet.html' : './index.html';
}

async function registrarUsuario(username, password, email) {
  const users = getUsers();
  if (users.some(user => user.username?.toLowerCase() === username.toLowerCase() || user.email?.toLowerCase() === email.toLowerCase() || user.correo?.toLowerCase() === email.toLowerCase())) {
    alert('Ese usuario o correo ya existe.');
    return;
  }
  const nuevoUsuario = {
    id: Date.now(),
    username,
    passwordHash: await hashPassword(password),
    nombre: username,
    email,
    rol: 'usuario',
    grado: 'Sin definir',
    correo: email,
    favoritos: []
  };
  users.push(nuevoUsuario);
  saveUsers(users);
  saveCurrentUser(nuevoUsuario);
  window.location.href = './index.html';
}

function cambiarModoRegistro(e) {
  if (e) e.preventDefault();
  const extra = document.getElementById('registro-extra');
  extra.style.display = 'block';
  document.getElementById('login-title').textContent = 'Crea tu cuenta';
  document.getElementById('login-subtitle').textContent = 'Regístrate para acceder a tus pedidos y favoritos.';
  document.getElementById('btn-principal').textContent = 'Registrarse';
  document.getElementById('login-footer').innerHTML = '<p>¿Ya tienes cuenta?</p><a href="#" onclick="cambiarModoLogin(event)">Volver al inicio de sesión</a>';
}

function cambiarModoLogin(e) {
  if (e) e.preventDefault();
  const extra = document.getElementById('registro-extra');
  extra.style.display = 'none';
  document.getElementById('login-title').textContent = 'Bienvenido a SmartLunch';
  document.getElementById('login-subtitle').textContent = 'Inicia sesión para pedir, guardar favoritos y gestionar tus compras.';
  document.getElementById('btn-principal').textContent = 'Iniciar sesión';
  document.getElementById('login-footer').innerHTML = '<p>¿Nuevo en SmartLunch?</p><a href="#" onclick="cambiarModoRegistro(event)">Crear una cuenta</a>';
}

function cargarCarrito() {
  const raw = localStorage.getItem(STORAGE_KEYS.carrito);
  carrito = raw ? JSON.parse(raw) : [];
}

function guardarCarrito() {
  localStorage.setItem(STORAGE_KEYS.carrito, JSON.stringify(carrito));
}

function agregarProducto(nombre, precio) {
  const productos = getProducts();
  const producto = productos.find(item => item.nombre === nombre);
  if (!producto) return;
  if (producto.estado === 'disable' || producto.activo === false) {
    alert('⚠️ Este producto está deshabilitado temporalmente.');
    return;
  }
  if (producto.stock <= 0) {
    alert('⚠️ No hay stock disponible de este producto.');
    return;
  }
  const existente = carrito.find(item => item.nombre === nombre);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ nombre, precio: Number(precio), cantidad: 1 });
  }
  guardarCarrito();
  actualizarCarrito();
}

function restarProducto(nombre) {
  const existente = carrito.find(item => item.nombre === nombre);
  if (!existente) return;
  existente.cantidad -= 1;
  if (existente.cantidad <= 0) {
    carrito = carrito.filter(item => item.nombre !== nombre);
  }
  guardarCarrito();
  actualizarCarrito();
}

function eliminarProductoCarrito(nombre) {
  carrito = carrito.filter(item => item.nombre !== nombre);
  guardarCarrito();
  actualizarCarrito();
}

function vaciarCarrito() {
  carrito = [];
  guardarCarrito();
  actualizarCarrito();
}

function actualizarCarrito() {
  const lista = document.getElementById('listaPedidos');
  const total = document.getElementById('total');
  // actualizar el total si existe el elemento
  if (total) {
    const totalCalculado = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    total.textContent = totalCalculado.toFixed(2);
  }

  // si la lista está presente (página del carrito o panel), rellenarla
  if (lista) {
    lista.innerHTML = '';
    if (!carrito.length) {
      lista.innerHTML = '<li>Tu carrito está vacío.</li>';
    } else {
      carrito.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<div><strong>${item.nombre}</strong><br><small>${item.cantidad} x S/ ${item.precio.toFixed(2)}</small></div><div class="btn-row"><button class="btn-secondary" onclick="restarProducto('${item.nombre}')">-</button><button class="btn-primary" onclick="agregarProducto('${item.nombre}', ${item.precio})">+</button><button class="btn-secondary" onclick="eliminarProductoCarrito('${item.nombre}')">✕</button></div>`;
        lista.appendChild(li);
      });
    }
  }

  // Siempre actualizar el badge aunque no exista la lista en esta página
  actualizarCarritoBadge();

  // Si el modal del carrito está abierto, re-renderizar su contenido
  if (document.getElementById('modal-cart-items')) {
    renderizarCarritoModal();
  }
}

function actualizarCarritoBadge() {
  const badge = document.getElementById('cart-count');
  const count = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  if (!badge) return;
  badge.textContent = count;
  // Mostrar siempre el badge (incluso con 0) para indicar el estado del carrito
  badge.style.display = 'inline-flex';
}

function renderizarCarritoModal() {
  const contenedor = document.getElementById('modal-cart-items');
  const total = document.getElementById('modal-cart-total');
  if (!contenedor || !total) return;

  contenedor.innerHTML = '';
  const totalCalculado = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  total.textContent = totalCalculado.toFixed(2);

  if (!carrito.length) {
    contenedor.innerHTML = '<div class="empty-state">Aún no tienes productos en el carrito.</div>';
    return;
  }

  carrito.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cart-item';
    // compact layout: image + name on left, controls center, price + remove on right
    const imagen = (getProducts().find(p => p.nombre === item.nombre) || {}).imagen || './img/LOGO.png';
    card.innerHTML = `
      <div class="cart-item-main">
        <img src="${imagen}" alt="${item.nombre}">
        <div>
          <h3 style="margin:0">${item.nombre}</h3>
          <p class="muted-text" style="margin:0">S/ ${item.precio.toFixed(2)} por unidad</p>
        </div>
      </div>
      <div class="cart-item-controls">
        <button class="btn-secondary" onclick="restarProducto('${item.nombre}')">-</button>
        <div style="min-width:28px;text-align:center;font-weight:700">${item.cantidad}</div>
        <button class="btn-secondary" onclick="agregarProducto('${item.nombre}', ${item.precio})">+</button>
        <button type="button" class="btn-remove" title="Eliminar" onclick="eliminarProductoCarrito('${item.nombre}')">×</button>
      </div>
      <div class="cart-item-meta">
        <span style="font-size:0.9rem;color:#64748b">Total</span>
        <strong>S/ ${(item.precio * item.cantidad).toFixed(2)}</strong>
      </div>`;
    contenedor.appendChild(card);
  });
}

function mostrarCarritoModal() {
  const overlay = document.createElement('div');
  overlay.className = 'popup-dialog';
  overlay.innerHTML = `
    <div class="popup-card">
      <div class="modal-header">
        <div>
          <p class="eyebrow">Carrito</p>
          <h3>Revisa tu pedido</h3>
        </div>
        <button type="button" class="modal-close" aria-label="Cerrar carrito">×</button>
      </div>
      <div id="modal-cart-items" class="cart-list"></div>
      <div class="checkout-summary">
        <div class="summary-left">
          <span>Total</span>
          <strong>S/ <span id="modal-cart-total">0.00</span></strong>
        </div>
        <div class="summary-right">
          <button class="btn-primary" id="modal-checkout-button" type="button">Continuar al pago</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', event => {
    if (event.target === overlay) overlay.remove();
  });
  renderizarCarritoModal();
  document.getElementById('modal-checkout-button')?.addEventListener('click', iniciarCheckout);
}

function iniciarCheckout() {
  if (!carrito.length) {
    alert('Agrega productos antes de pagar.');
    return;
  }

  const productos = getProducts();
  const faltante = carrito.some(item => {
    const producto = productos.find(p => p.nombre === item.nombre);
    return producto && producto.stock < item.cantidad;
  });

  if (faltante) {
    alert('⚠️ Uno o más productos no tienen suficiente stock para esta compra.');
    return;
  }

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const user = getCurrentUser();
  const overlay = document.createElement('div');
  overlay.className = 'popup-dialog';
  overlay.innerHTML = `
    <div class="popup-card">
      <div class="modal-header">
        <div>
          <p class="eyebrow">Pago</p>
          <h3>Pago seguro</h3>
        </div>
        <button type="button" class="modal-close" aria-label="Cerrar pago">×</button>
      </div>
      <p>Elige un método de pago y confirma la compra.</p>
      <div class="payment-methods">
        <button class="payment-option selected" type="button" data-method="QR">
          <span class="payment-icon">QR</span>
          <span>Pago QR</span>
        </button>
        <button class="payment-option" type="button" data-method="Yape">
          <span class="payment-icon">Yape</span>
          <span>Yape</span>
        </button>
        <button class="payment-option" type="button" data-method="Plin">
          <span class="payment-icon">Plin</span>
          <span>Plin</span>
        </button>
        <button class="payment-option" type="button" data-method="Tarjeta">
          <span class="payment-icon">Tarjeta</span>
          <span>Tarjeta</span>
        </button>
      </div>
      <div class="card-fields" style="display:none;margin-top:12px">
        <input type="text" id="card-number" placeholder="Número de tarjeta" maxlength="19" pattern="[0-9 ]*">
        <div style="display:flex;gap:8px;margin-top:8px">
          <input type="text" id="card-name" placeholder="Nombre en tarjeta" style="flex:1">
          <input type="text" id="card-expiry" placeholder="MM/AA" style="width:90px">
          <input type="text" id="card-cvc" placeholder="CVC" style="width:80px">
        </div>
      </div>
      <form class="form-stack" id="checkout-form">
        <input type="email" id="correo-boleta" placeholder="Correo para enviar la boleta" value="${user?.correo || user?.email || ''}">
        <div class="payment-summary"><strong>Total:</strong> <span>S/ ${total.toFixed(2)}</span></div>
        <p class="muted-text">No se aceptan cambios ni devoluciones una vez confirmado el pago.</p>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
          <button class="btn-secondary" type="button" id="checkout-cancel-button">Cancelar</button>
          <button class="btn-primary" type="submit">Confirmar pago</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  // allow closing the payment modal without altering the cart
  overlay.querySelector('.modal-close')?.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', event => { if (event.target === overlay) overlay.remove(); });

  overlay.querySelectorAll('.payment-option').forEach(button => {
    button.addEventListener('click', () => {
      overlay.querySelectorAll('.payment-option').forEach(item => item.classList.remove('selected'));
      button.classList.add('selected');
      // show/hide card fields when Tarjeta selected
      const metodo = button.dataset.method;
      const cardFields = overlay.querySelector('.card-fields');
      if (cardFields) cardFields.style.display = metodo === 'Tarjeta' ? 'block' : 'none';
    });
  });
  overlay.querySelector('#checkout-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const metodo = overlay.querySelector('.payment-option.selected')?.dataset.method || 'QR';
    const correo = (overlay.querySelector('#correo-boleta')?.value || '').trim();

    if (metodo === 'Tarjeta') {
      const cardNumberRaw = (overlay.querySelector('#card-number')?.value || '').replace(/\s+/g, '');
      const cardName = overlay.querySelector('#card-name')?.value || '';
      const cardExpiry = overlay.querySelector('#card-expiry')?.value || '';
      const cardCvc = overlay.querySelector('#card-cvc')?.value || '';
      if (!cardNumberRaw || cardNumberRaw.length < 12) {
        alert('Por favor ingresa un número de tarjeta válido.');
        return;
      }
      // mask card number (keep last 4)
      const last4 = cardNumberRaw.slice(-4);
      const masked = '**** **** **** ' + last4;
      const cardInfo = { masked, last4 };
      procesarPago(total, overlay, metodo, correo, cardInfo);
    } else {
      procesarPago(total, overlay, metodo, correo);
    }
  });
  // Cancel button should close all open modal overlays (payment + cart)
  overlay.querySelector('#checkout-cancel-button')?.addEventListener('click', () => {
    document.querySelectorAll('.popup-dialog').forEach(el => el.remove());
  });
}

function obtenerContenidoProcesamientoPago(metodoPago, total) {
  const monto = `S/ ${Number(total).toFixed(2)}`;

  if (metodoPago === 'QR') {
    return `
      <div class="payment-processing">
        <div class="payment-visual payment-visual-qr">
          <div class="qr-simulator" aria-label="Código QR simulado">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            <span></span><span class="qr-block"></span><span class="qr-block"></span><span class="qr-block"></span><span></span><span></span><span></span>
            <span></span><span class="qr-block"></span><span class="qr-block"></span><span class="qr-block"></span><span></span><span></span><span></span>
            <span></span><span class="qr-block"></span><span class="qr-block"></span><span class="qr-block"></span><span></span><span></span><span></span>
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <div class="payment-visual-caption">Escaneando QR para confirmar el pago</div>
          <div class="payment-amount-pill">${monto}</div>
        </div>
      </div>`;
  }

  if (metodoPago === 'Yape' || metodoPago === 'Plin') {
    return `
      <div class="payment-processing">
        <div class="payment-visual payment-visual-app">
          <div class="payment-app-phone">
            <div class="payment-app-top">${metodoPago}</div>
            <div class="payment-app-body">
              <div class="payment-app-amount">${monto}</div>
              <div class="payment-app-user">Enviando pago desde ${metodoPago}…</div>
            </div>
          </div>
          <div class="payment-visual-caption">Tu app está validando la transacción</div>
        </div>
      </div>`;
  }

  return `
    <div class="payment-processing">
      <div class="payment-visual payment-visual-card">
        <div class="payment-card-sim">
          <div class="payment-card-chip"></div>
          <div class="payment-card-line"></div>
          <div class="payment-card-line short"></div>
        </div>
        <div class="payment-visual-caption">Validando datos y autorizando la tarjeta</div>
        <div class="payment-amount-pill">${monto}</div>
      </div>
    </div>`;
}

function renderizarEstadoProcesandoPago(overlay, metodoPago, total) {
  const titulo = metodoPago === 'QR'
    ? 'Pago QR en curso'
    : metodoPago === 'Tarjeta'
      ? 'Validando tarjeta'
      : `Pago con ${metodoPago} en curso`;

  const mensaje = metodoPago === 'QR'
    ? 'El código QR está siendo escaneado de forma simulada.'
    : metodoPago === 'Tarjeta'
      ? 'Tu tarjeta está siendo verificada de forma segura.'
      : 'La app está confirmando la transferencia en segundos.';

  overlay.querySelector('.popup-card').innerHTML = `
    <div class="modal-header">
      <div>
        <p class="eyebrow">Procesando</p>
        <h3>${titulo}</h3>
      </div>
    </div>
    <div class="payment-processing-panel">
      ${obtenerContenidoProcesamientoPago(metodoPago, total)}
      <div class="payment-processing-status">
        <span class="payment-processing-spinner"></span>
        <span>${mensaje}</span>
      </div>
    </div>`;
}

function procesarPago(total, overlay, metodoPago, correoDestino, cardInfo) {
  if (!window.confirm('Al confirmar el pago, no se aceptan cambios ni devoluciones. ¿Deseas continuar?')) {
    return;
  }

  renderizarEstadoProcesandoPago(overlay, metodoPago, total);

  const demoraMs = Math.floor(Math.random() * 2001) + 3000;

  window.setTimeout(() => {
    const user = getCurrentUser();
    const productos = getProducts();
    const pedidos = getPedidos();

    const metodoPagoTexto = metodoPago === 'Tarjeta' ? `Tarjeta • ${cardInfo?.masked || '****'}` : metodoPago;

    const pedido = {
      id: Date.now().toString(),
      usuario: user?.username || 'Invitado',
      productos: carrito.map(item => `${item.nombre} (x${item.cantidad})`),
      productosDetalles: carrito.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        imagen: getProducts().find(producto => producto.nombre === item.nombre)?.imagen || './img/SmartLunch.png'
      })),
      total: total.toFixed(2),
      fecha: new Date().toLocaleString(),
      estado: 'Pendiente',
      metodoPago: metodoPagoTexto,
      correoDestino
    };

    pedidos.push(pedido);
    savePedidos(pedidos);

    carrito.forEach(item => {
      const producto = productos.find(p => p.nombre === item.nombre);
      if (producto) producto.stock -= item.cantidad;
    });
    saveProducts(productos);

    carrito = [];
    guardarCarrito();
    actualizarCarrito();
    overlay.remove();

    const receipt = document.createElement('div');
    receipt.className = 'popup-dialog';
    receipt.innerHTML = `
      <div class="popup-card">
        <h3>✅ Compra confirmada</h3>
        <div class="receipt">
          <p><strong>Cliente:</strong> ${pedido.usuario}</p>
          <p><strong>Fecha:</strong> ${pedido.fecha}</p>
          <p><strong>Total:</strong> S/ ${pedido.total}</p>
          <p><strong>Método:</strong> ${pedido.metodoPago}</p>
          <p><strong>Productos:</strong> ${pedido.productos.join(', ')}</p>
        </div>
        <div class="btn-row" style="margin-top:12px;">
          <button class="btn-primary" type="button" onclick="window.print()">Imprimir boleta</button>
          <button class="btn-secondary" type="button" onclick="this.closest('.popup-dialog').remove(); window.location.href='./index.html'">Cerrar</button>
        </div>
      </div>`;
    document.body.appendChild(receipt);
  }, demoraMs);
}

function mostrarPopupInformativo(titulo, mensaje) {
  const overlay = document.createElement('div');
  overlay.className = 'popup-dialog';
  overlay.innerHTML = `
    <div class="popup-card">
      <h3>${titulo}</h3>
      <p>${mensaje}</p>
      <div class="btn-row" style="justify-content:flex-end;">
        <button class="btn-primary" type="button">Aceptar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('button').addEventListener('click', () => overlay.remove());
}

function enviarBoletaPorEmail(pedido, correoDestino) {
  const email = (correoDestino || '').trim();
  if (!email) {
    mostrarPopupInformativo('Correo requerido', 'Ingresa un correo válido para preparar la boleta.');
    return;
  }

  const asunto = `Boleta SmartLunch #${pedido.id.slice(-4)}`;
  const cuerpo = `Hola ${pedido.usuario},\n\nGracias por tu compra en SmartLunch.\n\nPedido: #${pedido.id.slice(-4)}\nFecha: ${pedido.fecha}\nMétodo de pago: ${pedido.metodoPago}\nTotal: S/ ${pedido.total}\n\nProductos:\n${(pedido.productosDetalles || []).map(item => `- ${item.nombre} x${item.cantidad}`).join('\n')}\n\nNo se aceptan cambios ni devoluciones.`;

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  const ventana = window.open(mailtoUrl, '_blank', 'noopener,noreferrer');

  let mensaje = `Se preparó el correo para ${email}. No podemos confirmar el envío desde esta página, pero el mensaje quedó listo para enviarlo.`;

  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(`${asunto}\n\n${cuerpo}`);
      mensaje += ' También se copió el contenido al portapapeles.';
    }
  } catch (error) {
    mensaje += ' Si el cliente de correo no se abre, puedes copiar el contenido manualmente.';
  }

  if (!ventana || ventana.closed) {
    mensaje += ' Si no apareció ninguna ventana, usa el contenido copiado y envíalo manualmente.';
  }

  mostrarPopupInformativo('Estado del correo', mensaje);
}

function filtrarProductos(categoria) {
  categoriaActual = categoria;
  actualizarRangoDesdeFormulario();
  renderizarProductos();
}

function cambiarOrden(orden) {
  ordenActual = orden;
  renderizarProductos();
}

function actualizarFiltroPrecio() {
  const minInput = document.getElementById('precio-min');
  const maxInput = document.getElementById('precio-max');
  const minValue = minInput?.value ? Number(minInput.value) : null;
  const maxValue = maxInput?.value ? Number(maxInput.value) : null;

  if (minValue === null && maxValue === null) {
    precioMin = 0;
    precioMax = 9999;
  } else if (minValue === null) {
    precioMin = 0;
    precioMax = Math.max(0, maxValue);
    if (minInput) minInput.value = precioMin;
  } else if (maxValue === null) {
    precioMin = minValue;
    precioMax = minValue;
    if (maxInput) maxInput.value = precioMax;
  } else {
    precioMin = minValue;
    precioMax = Math.max(minValue, maxValue);
    if (maxValue < minValue && maxInput) {
      maxInput.value = precioMax;
    }
  }

  actualizarSliderVisual();
  renderizarProductos();
}

function actualizarRangoDesdeFormulario() {
  const minInput = document.getElementById('precio-min');
  const maxInput = document.getElementById('precio-max');
  if (!minInput || !maxInput) return;
  const minValue = minInput.value ? Number(minInput.value) : null;
  const maxValue = maxInput.value ? Number(maxInput.value) : null;

  if (minValue === null && maxValue === null) {
    precioMin = 0;
    precioMax = 9999;
  } else if (minValue === null) {
    precioMin = 0;
    precioMax = Math.max(0, maxValue);
  } else if (maxValue === null) {
    precioMin = minValue;
    precioMax = minValue;
    maxInput.value = precioMax;
  } else {
    precioMin = minValue;
    precioMax = Math.max(minValue, maxValue);
    if (maxValue < minValue) {
      maxInput.value = precioMax;
    }
  }

  actualizarSliderVisual();
}

function actualizarSliderVisual() {
  const progress = document.getElementById('price-slider-progress');
  const minInput = document.getElementById('precio-min');
  const maxInput = document.getElementById('precio-max');
  if (!progress || !minInput || !maxInput) return;

  const productos = getProducts();
  const maxPrecioProducto = Math.max(100, ...productos.map(producto => Number(producto.precio) || 0), precioMin, precioMax);
  const limiteSuperior = maxPrecioProducto || 100;
  const minBase = Math.max(0, precioMin);
  const maxBase = Math.max(minBase, precioMax);
  const left = Math.min(100, (minBase / limiteSuperior) * 100);
  const width = Math.min(100, ((maxBase - minBase) / limiteSuperior) * 100);

  progress.style.left = `${left}%`;
  progress.style.width = `${width}%`;
}

function buscarProductos(texto) {
  busquedaActual = texto.toLowerCase().trim();
  renderizarProductos();
}

function renderizarProductos() {
  const contenedor = document.getElementById('productos-grid');
  const count = document.getElementById('productos-count');
  if (!contenedor) return;

  const user = getCurrentUser();
  const favoritos = user ? user.favoritos || [] : [];
  const productos = getProducts();
  const filtrados = productos.filter(producto => {
    const activo = producto.estado !== 'disable' && producto.activo !== false;
    const coincideCategoria = categoriaActual === 'todos' || producto.categoria === categoriaActual;
    const coincideBusqueda = !busquedaActual || producto.nombre.toLowerCase().includes(busquedaActual) || producto.categoria.toLowerCase().includes(busquedaActual);
    const precioValido = Number(producto.precio) >= precioMin && Number(producto.precio) <= precioMax;
    return activo && coincideCategoria && coincideBusqueda && precioValido;
  });

  if (ordenActual === 'precioAsc') {
    filtrados.sort((a, b) => a.precio - b.precio);
  } else if (ordenActual === 'precioDesc') {
    filtrados.sort((a, b) => b.precio - a.precio);
  }

  contenedor.innerHTML = '';
  count.textContent = `${filtrados.length} productos`;

  if (!filtrados.length) {
    contenedor.innerHTML = '<div class="empty-state">No hay productos disponibles en este momento.</div>';
    return;
  }

  filtrados.forEach(producto => {
    const esFavorito = favoritos.includes(producto.nombre);
    const card = document.createElement('article');
    card.className = 'card product-card';
    card.innerHTML = `
      <div class="estrella ${esFavorito ? 'active' : ''}" onclick="agregarFavorito('${producto.nombre}')" title="${esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}">${esFavorito ? '★' : '☆'}</div>
      <img src="${producto.imagen}" alt="${producto.nombre}">
      <div class="meta">
        <h3>${producto.nombre}</h3>
        <span class="price">S/ ${Number(producto.precio).toFixed(2)}</span>
      </div>
      <div class="meta">
        <span class="stock">Stock: ${producto.stock}</span>
        <button class="btn-primary" onclick="agregarProducto('${producto.nombre}', ${producto.precio})">Agregar</button>
      </div>`;
    contenedor.appendChild(card);
  });
}

function agregarFavorito(nombre) {
  const user = getCurrentUser();
  if (!user) {
    alert('Debes iniciar sesión para guardar favoritos.');
    return;
  }
  const users = getUsers();
  const index = users.findIndex(item => item.username === user.username);
  if (index === -1) return;

  const favoritos = users[index].favoritos || [];
  const yaExiste = favoritos.includes(nombre);

  if (yaExiste) {
    users[index].favoritos = favoritos.filter(item => item !== nombre);
    saveUsers(users);
    saveCurrentUser(users[index]);
    alert(`⭐ ${nombre} eliminado de favoritos.`);
  } else {
    users[index].favoritos.push(nombre);
    saveUsers(users);
    saveCurrentUser(users[index]);
    alert(`⭐ ${nombre} agregado a favoritos.`);
  }

  if (document.getElementById('productos-grid')) {
    renderizarProductos();
  }
  if (document.getElementById('favoritos-grid')) {
    renderizarFavoritos();
  }
}

function renderizarFavoritos() {
  const contenedor = document.getElementById('favoritos-grid');
  const empty = document.getElementById('fav-vacio');
  if (!contenedor) return;

  const user = getCurrentUser();
  const productos = getProducts();
  const favoritos = user ? user.favoritos || [] : [];
  contenedor.innerHTML = '';
  if (!favoritos.length) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  favoritos.forEach(nombre => {
    const producto = productos.find(item => item.nombre === nombre);
    if (!producto || producto.estado === 'disable' || producto.activo === false) return;
    const card = document.createElement('article');
    card.className = 'card product-card';
    card.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}">
      <div class="meta">
        <h3>${producto.nombre}</h3>
        <span class="price">S/ ${Number(producto.precio).toFixed(2)}</span>
      </div>
      <div class="meta">
        <span class="stock">Disponible</span>
        <button class="btn-primary" onclick="agregarProducto('${producto.nombre}', ${producto.precio})">Agregar</button>
      </div>`;
    contenedor.appendChild(card);
  });
}

function renderizarHistorial() {
  const lista = document.getElementById('historialPedidos');
  if (!lista) return;
  const user = getCurrentUser();
  const pedidos = getPedidos().filter(pedido => pedido.usuario === user?.username);
  lista.innerHTML = '';
  if (!pedidos.length) {
    lista.innerHTML = '<li class="empty-state">Aún no has realizado pedidos.</li>';
    return;
  }
  pedidos.reverse().forEach(pedido => {
    const li = document.createElement('li');
    li.className = 'history-card';
    const productos = Array.isArray(pedido.productosDetalles) ? pedido.productosDetalles : [];
    const estadoClase = pedido.estado === 'Aceptado' ? 'approved' : 'pending';
    const estadoTexto = pedido.estado === 'Aceptado' ? 'Aprobado' : 'Pendiente';
    li.innerHTML = `
      <div class="history-top">
        <strong>#${pedido.id.slice(-4)}</strong>
        <span class="history-status ${estadoClase}">${estadoTexto}</span>
      </div>
      <div class="history-meta">
        <span>${pedido.fecha}</span>
        <span>Total: S/ ${Number(pedido.total).toFixed(2)}</span>
      </div>
      <div class="history-products">
        ${productos.length ? productos.map(item => `<span class="history-product-chip"><img src="${item.imagen}" alt="${item.nombre}">${item.nombre}</span>`).join('') : pedido.productos.map(item => `<span class="history-product-chip">${item}</span>`).join('')}
      </div>
      <div class="history-details">
        <span>${pedido.productos.length} producto(s)</span>
        <span>Ver detalles →</span>
      </div>`;
    li.onclick = () => abrirDetallePedido(pedido);
    lista.appendChild(li);
  });
}

function abrirDetallePedido(pedido) {
  const productos = Array.isArray(pedido.productosDetalles) ? pedido.productosDetalles : [];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card" style="width:min(620px,100%)">
      <div class="history-top">
        <h3>Detalle del pedido</h3>
        <span class="history-status ${pedido.estado === 'Aceptado' ? 'approved' : 'pending'}">${pedido.estado === 'Aceptado' ? 'Aprobado' : 'Pendiente'}</span>
      </div>
      <p class="muted-text">${pedido.fecha}</p>
      <div class="history-meta">
        <span><strong>Total:</strong> S/ ${Number(pedido.total).toFixed(2)}</span>
        <span><strong>Pedido:</strong> #${pedido.id.slice(-4)}</span>
      </div>
      <div class="history-products" style="margin-top:10px;">
        ${productos.length ? productos.map(item => `
          <div class="history-product-chip" style="width:100%;justify-content:space-between;padding:10px 12px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <img src="${item.imagen}" alt="${item.nombre}">
              <span>${item.nombre}</span>
            </div>
            <span>x${item.cantidad}</span>
          </div>`).join('') : '<span class="empty-state" style="width:100%">No hay productos detallados para este pedido.</span>'}
      </div>
      <div class="btn-row" style="margin-top:14px;justify-content:flex-end;">
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cerrar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function renderizarConfiguracion() {
  const user = getCurrentUser();
  if (!user) return;
  document.getElementById('perfil-nombre').textContent = user.nombre || user.username;
  document.getElementById('perfil-rol').textContent = user.rol === 'administrador' ? 'Administrador' : 'Usuario';
  document.getElementById('perfil-correo').textContent = user.correo || user.email || '-';
  const avatar = document.getElementById('avatar-inicial');
  if (avatar) {
    avatar.textContent = (user.nombre || user.username || 'U').charAt(0).toUpperCase();
  }
  const correoInput = document.getElementById('nuevo-email');
  if (correoInput && !correoInput.value) {
    correoInput.value = user.correo || user.email || '';
  }
}

async function actualizarCorreo(event) {
  event.preventDefault();
  const user = getCurrentUser();
  const nuevoCorreo = document.getElementById('nuevo-email').value.trim();
  const users = getUsers();
  if (!nuevoCorreo) {
    alert('Ingresa un correo válido.');
    return;
  }

  const duplicado = users.some(item => {
    if (item.username === user?.username) return false;
    return (item.email && item.email.toLowerCase() === nuevoCorreo.toLowerCase()) || (item.correo && item.correo.toLowerCase() === nuevoCorreo.toLowerCase());
  });

  if (duplicado) {
    alert('Ese correo ya está siendo usado por otro usuario.');
    return;
  }

  const index = users.findIndex(item => item.username === user?.username);
  if (index === -1) return;

  users[index].email = nuevoCorreo;
  users[index].correo = nuevoCorreo;
  saveUsers(users);
  const updatedUser = { ...user, email: nuevoCorreo, correo: nuevoCorreo };
  saveCurrentUser(updatedUser);
  renderizarConfiguracion();
  alert('Correo actualizado correctamente.');
}

async function actualizarPassword(event) {
  event.preventDefault();
  const user = getCurrentUser();
  const actual = document.getElementById('password-actual').value;
  const nueva = document.getElementById('password-nueva').value;
  const confirmar = document.getElementById('password-confirmar').value;

  if (!actual || !nueva || !confirmar) {
    alert('Completa todos los campos de seguridad.');
    return;
  }

  if (nueva.length < 6) {
    alert('La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  if (nueva !== confirmar) {
    alert('La nueva contraseña no coincide con la confirmación.');
    return;
  }

  const users = getUsers();
  const index = users.findIndex(item => item.username === user?.username);
  if (index === -1) return;

  const actualHash = await hashPassword(actual);
  const esActualCorrecta = users[index].passwordHash === actualHash || users[index].password === actual || users[index].passwordHash === actual;

  if (!esActualCorrecta) {
    alert('La contraseña actual no es correcta.');
    return;
  }

  const nuevaHash = await hashPassword(nueva);
  users[index].passwordHash = nuevaHash;
  saveUsers(users);
  const updatedUser = { ...user, passwordHash: nuevaHash };
  saveCurrentUser(updatedUser);
  document.getElementById('form-cambiar-password').reset();
  alert('Contraseña actualizada correctamente.');
}

function renderizarIntranet() {
  const user = getCurrentUser();
  if (user?.rol !== 'administrador') {
    document.querySelector('.panel')?.classList.add('hidden');
    return;
  }
  document.querySelector('.panel')?.classList.remove('hidden');

  const pedidos = getPedidos();
  const productos = getProducts();
  const users = getUsers();
  document.getElementById('stats-pendientes').textContent = pedidos.filter(p => p.estado === 'Pendiente').length;
  document.getElementById('stats-productos').textContent = productos.length;
  document.getElementById('stats-usuarios').textContent = users.length;

  const lista = document.getElementById('pedidos-lista');
  if (lista) {
    lista.innerHTML = '';
    pedidos.filter(p => p.estado === 'Pendiente').slice().reverse().forEach(pedido => {
      const li = document.createElement('li');
      li.className = 'order-item';
      li.innerHTML = `
        <div class="order-item-main">
          <div class="section-header" style="margin-bottom:0;">
            <strong>${pedido.usuario}</strong>
            <span class="pill">${pedido.estado}</span>
          </div>
          <div class="order-item-badges">
            <span class="pill-muted">${pedido.productos.length} producto(s)</span>
            <span class="pill-muted">S/ ${Number(pedido.total).toFixed(2)}</span>
          </div>
          <small>${pedido.fecha}</small>
          <div>${pedido.productos.join(', ')}</div>
        </div>
        <div class="btn-row"><button class="btn-primary" onclick="aceptarPedido('${pedido.id}')">Aceptar</button></div>`;
      lista.appendChild(li);
    });
  }

  const historial = document.getElementById('historial-intranet');
  if (historial) {
    historial.innerHTML = '';
    pedidos.slice().reverse().forEach(pedido => {
      const li = document.createElement('li');
      li.className = 'order-item';
      li.innerHTML = `
        <div class="order-item-main">
          <div class="section-header" style="margin-bottom:0;">
            <strong>${pedido.usuario}</strong>
            <span class="pill">${pedido.estado}</span>
          </div>
          <div class="order-item-badges">
            <span class="pill-muted">${pedido.productos.length} producto(s)</span>
            <span class="pill-muted">S/ ${Number(pedido.total).toFixed(2)}</span>
          </div>
          <small>${pedido.fecha}</small>
          <div>${pedido.productos.join(', ')}</div>
        </div>`;
      historial.appendChild(li);
    });
  }

  const inventario = document.getElementById('inventario-lista');
  if (inventario) {
    inventario.innerHTML = '';
    productos.forEach(producto => {
      const item = document.createElement('div');
      item.className = 'inventory-item';
      const estadoTexto = producto.estado === 'disable' || producto.activo === false ? 'Desactivado' : 'Activo';
      item.innerHTML = `<div><strong>${producto.nombre}</strong><br><span class="pill">Stock: ${producto.stock}</span><br><span class="pill-muted">${estadoTexto}</span></div><div class="btn-row stock-control"><input type="number" id="stock-${producto.id}" value="${producto.stock}"><button class="btn-primary" onclick="actualizarStock(${producto.id})">Actualizar</button><button class="btn-secondary" onclick="toggleProductoEstado(${producto.id})">${producto.estado === 'disable' || producto.activo === false ? 'Activar' : 'Desactivar'}</button></div>`;
      inventario.appendChild(item);
    });
  }

  const usuarios = document.getElementById('usuarios-lista');
  if (usuarios) {
    usuarios.innerHTML = '';
    users.forEach(user => {
      const item = document.createElement('div');
      item.className = 'inventory-item';
      item.innerHTML = `<div><strong>${user.username}</strong><br><span class="pill">${user.rol}</span><br><small>${user.email || user.correo || ''}</small></div><div class="btn-row"><button class="btn-secondary" onclick="cambiarRol('${user.username}')">${user.rol === 'administrador' ? 'Quitar admin' : 'Hacer admin'}</button></div>`;
      usuarios.appendChild(item);
    });
  }
}

function toggleProductoEstado(id) {
  const productos = getProducts();
  const producto = productos.find(item => item.id === id);
  if (!producto) return;
  producto.estado = producto.estado === 'disable' || producto.activo === false ? 'activo' : 'disable';
  producto.activo = producto.estado === 'activo';
  saveProducts(productos);
  renderizarIntranet();
  if (document.getElementById('productos-grid')) {
    renderizarProductos();
  }
}

function aceptarPedido(id) {
  const pedidos = getPedidos();
  const pedido = pedidos.find(item => item.id === id);
  if (pedido) {
    pedido.estado = 'Aceptado';
    savePedidos(pedidos);
    renderizarIntranet();
  }
}

function actualizarStock(id) {
  const productos = getProducts();
  const producto = productos.find(item => item.id === id);
  if (!producto) return;
  const input = document.getElementById(`stock-${id}`);
  producto.stock = Number(input.value);
  saveProducts(productos);
  renderizarIntranet();
}

function cambiarRol(username) {
  const users = getUsers();
  const user = users.find(item => item.username === username);
  if (!user) return;
  user.rol = user.rol === 'administrador' ? 'usuario' : 'administrador';
  saveUsers(users);
  renderizarIntranet();
}

async function crearUsuarioAdmin(event) {
  event.preventDefault();
  const username = document.getElementById('nuevoUsuario').value.trim();
  const email = document.getElementById('nuevoCorreo').value.trim();
  const password = document.getElementById('nuevaClave').value;
  const rol = document.getElementById('nuevoRol').value;
  const users = getUsers();

  if (!username || !email || !password) {
    alert('Completa todos los campos.');
    return;
  }

  if (users.some(user => user.username.toLowerCase() === username.toLowerCase() || user.email?.toLowerCase() === email.toLowerCase() || user.correo?.toLowerCase() === email.toLowerCase())) {
    alert('Ese usuario o correo ya existe.');
    return;
  }

  users.push({ id: Date.now(), username, passwordHash: await hashPassword(password), nombre: username, email, rol, correo: email, favoritos: [] });
  saveUsers(users);
  document.getElementById('usuario-form').reset();
  cerrarModalUsuario();
  renderizarIntranet();
}

function abrirModalProducto() {
  document.getElementById('modal-producto').style.display = 'grid';
}

function cerrarModalProducto() {
  document.getElementById('modal-producto').style.display = 'none';
}

function abrirModalUsuario() {
  document.getElementById('modal-usuario').style.display = 'grid';
}

function cerrarModalUsuario() {
  document.getElementById('modal-usuario').style.display = 'none';
}

function agregarProductoAdmin(event) {
  event.preventDefault();
  const name = document.getElementById('nuevoNombre').value.trim();
  const price = Number(document.getElementById('nuevoPrecio').value);
  const category = document.getElementById('nuevaCategoria').value;
  const stock = Number(document.getElementById('nuevoStock').value);
  const fileInput = document.getElementById('nuevaImagen');
  const products = getProducts();

  if (!name || !price || !stock) {
    alert('Completa nombre, precio y stock.');
    return;
  }

  const newProduct = {
    id: Date.now(),
    nombre: name,
    precio: price,
    categoria: category,
    stock,
    imagen: './img/LOGO.png'
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function () {
      newProduct.imagen = reader.result;
      products.push(newProduct);
      saveProducts(products);
      renderizarIntranet();
      document.getElementById('producto-form').reset();
      cerrarModalProducto();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    products.push(newProduct);
    saveProducts(products);
    renderizarIntranet();
    document.getElementById('producto-form').reset();
    cerrarModalProducto();
  }
}

function cerrarSesion() {
  clearCurrentUser();
  clearTimeout(inactivityTimerId);
  inactivityPopupShown = false;
  window.location.href = './login.html';
}

function aplicarConfiguracionGlobal() {
  const config = window.APP_CONFIG || {};

  document.querySelectorAll('[data-config="footerVersion"]').forEach(element => {
    element.textContent = config.footerVersion || 'v1.0.0';
  });

  document.querySelectorAll('[data-config="siteName"]').forEach(element => {
    element.textContent = config.siteName || 'SmartLunch';
  });

  document.querySelectorAll('.footer-logo').forEach(img => {
    img.src = config.footerLogoUrl || './img/SmartLunch.png';
    img.alt = config.siteName || 'SmartLunch';
  });

  document.querySelectorAll('a[data-module]').forEach(link => {
    const moduleKey = link.getAttribute('data-module');
    const module = (config.modules || []).find(item => item.key === moduleKey);
    if (module) {
      link.textContent = module.label || '';
    }
  });

  document.querySelectorAll('a[data-action="logout"]').forEach(link => {
    link.textContent = config.cerrarSesionLabel || 'Cerrar sesión';
  });
}

function inicializarApp() {
  cargarCarrito();
  aplicarTema();
  aplicarConfiguracionGlobal();
  llenarSidebar();
  actualizarEstadoAdmin();
  redirectIfNeeded();
  const page = getPageName();
  if (page === 'login.html') {
    document.getElementById('login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await manejarAccion();
    });
    return;
  }

  if (page === 'index.html') {
    renderizarProductos();
    actualizarCarrito();
    const buscador = document.getElementById('buscador');
    if (buscador) {
      buscador.addEventListener('input', (event) => buscarProductos(event.target.value));
    }
    const categoriaSelect = document.getElementById('categoria-select');
    const ordenSelect = document.getElementById('orden-select');
    const precioMinInput = document.getElementById('precio-min');
    const precioMaxInput = document.getElementById('precio-max');
    if (categoriaSelect) {
      categoriaSelect.addEventListener('change', (event) => {
        filtrarProductos(event.target.value);
      });
    }
    if (ordenSelect) {
      ordenSelect.addEventListener('change', (event) => {
        cambiarOrden(event.target.value);
      });
    }
    if (precioMinInput) {
      precioMinInput.addEventListener('input', actualizarSliderVisual);
      precioMinInput.addEventListener('change', actualizarFiltroPrecio);
    }
    if (precioMaxInput) {
      precioMaxInput.addEventListener('input', actualizarSliderVisual);
      precioMaxInput.addEventListener('change', actualizarFiltroPrecio);
    }

    const openCartButton = document.getElementById('open-cart');
    if (openCartButton) {
      openCartButton.addEventListener('click', mostrarCarritoModal);
    }
  }

  if (page === 'favoritos.html') {
    renderizarFavoritos();
    return;
  }

  if (page === 'historial.html') {
    renderizarHistorial();
    return;
  }

  if (page === 'configuracion.html') {
    renderizarConfiguracion();
    document.getElementById('form-cambiar-correo')?.addEventListener('submit', actualizarCorreo);
    document.getElementById('form-cambiar-password')?.addEventListener('submit', actualizarPassword);
    return;
  }

  if (page === 'intranet.html' || page === 'quiosco.html') {
    renderizarIntranet();
    document.querySelectorAll('.tab-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(panel => panel.style.display = 'none');
        document.getElementById(`tab-${button.dataset.tab}`).style.display = 'block';
      });
    });
    document.querySelectorAll('.subtab-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        document.querySelectorAll('.subtab-panel').forEach(panel => panel.style.display = 'none');
        document.getElementById(`subtab-${button.dataset.subtab}`).style.display = 'block';
      });
    });
    document.getElementById('producto-form')?.addEventListener('submit', agregarProductoAdmin);
    document.getElementById('usuario-form')?.addEventListener('submit', crearUsuarioAdmin);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await loadSeedData();
  inicializarApp();
  initializeInactivityMonitor();
});

window.cerrarSesion = cerrarSesion;
window.iniciarCheckout = iniciarCheckout;
window.vaciarCarrito = vaciarCarrito;
window.agregarProducto = agregarProducto;
window.restarProducto = restarProducto;
window.eliminarProductoCarrito = eliminarProductoCarrito;
window.agregarFavorito = agregarFavorito;
window.cambiarTema = cambiarTema;
window.manejarAccion = manejarAccion;
window.cambiarModoRegistro = cambiarModoRegistro;
window.cambiarModoLogin = cambiarModoLogin;
window.actualizarStock = actualizarStock;
window.cambiarRol = cambiarRol;
window.toggleProductoEstado = toggleProductoEstado;
window.aceptarPedido = aceptarPedido;
window.enviarBoletaPorEmail = enviarBoletaPorEmail;
window.abrirModalProducto = abrirModalProducto;
window.cerrarModalProducto = cerrarModalProducto;
window.abrirModalUsuario = abrirModalUsuario;
window.cerrarModalUsuario = cerrarModalUsuario;