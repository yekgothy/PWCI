/**
 * Obtener datos del usuario desde localStorage
 */
function getUserData() {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return null;
  }
}

/**
 * Verificar si el usuario está autenticado
 */
function isAuthenticated() {
  const userData = getUserData();
  const token = localStorage.getItem('authToken');
  return userData !== null && token !== null;
}

/**
 * Cerrar sesión
 */
function logout() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('loginTime');
    window.location.href = '../pages/login.html';
  }
}

/**
 * Inicializar información del usuario en el navbar
 */
function initUserInfo() {
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  const navUserName = document.getElementById('navUserName');
  const logoutButton = document.getElementById('logoutButton');
  
  if (isAuthenticated()) {
    const userData = getUserData();
    
    // Ocultar botones de login/signup
    if (authButtons) {
      authButtons.classList.add('hidden');
    }
    
    // Mostrar menú de usuario
    if (userMenu) {
      userMenu.classList.remove('hidden');
      userMenu.classList.add('flex');
    }
    
    // Mostrar nombre del usuario
    if (navUserName && userData) {
      navUserName.textContent = userData.nombreCompleto || 'Usuario';
    }
    
    // Agregar evento al botón de logout
    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }
  } else {
    // Mostrar botones de login/signup
    if (authButtons) {
      authButtons.classList.remove('hidden');
    }
    
    // Ocultar menú de usuario
    if (userMenu) {
      userMenu.classList.add('hidden');
    }
  }
}

// Navbar menu functionality
function initNavbar() {
  const menuButton = document.getElementById('menuButton');
  const sidebarMenu = document.getElementById('sidebarMenu');
  const closeMenuButton = document.getElementById('closeMenuButton');
  const menuOverlay = document.getElementById('menuOverlay');
  
  // Inicializar información del usuario
  initUserInfo();
  
  if (menuButton && sidebarMenu) {
    // Open menu
    menuButton.addEventListener('click', function() {
      console.log('Menu button clicked'); // Debug
      sidebarMenu.classList.remove('hidden');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
    
    // Close menu function
    function closeMenu() {
      console.log('Closing menu'); // Debug
      sidebarMenu.classList.add('hidden');
      document.body.style.overflow = 'auto'; // Restore scrolling
    }
    
    // Close menu events
    if (closeMenuButton) {
      closeMenuButton.addEventListener('click', closeMenu);
    }
    
    if (menuOverlay) {
      menuOverlay.addEventListener('click', closeMenu);
    }
    
    // Close menu with Escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  } else {
    console.log('Menu elements not found'); // Debug
  }
}
