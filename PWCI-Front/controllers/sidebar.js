/**
 * Controlador para el sidebar izquierdo (sidebarFeed1)
 * Maneja la visualización del perfil del usuario y la funcionalidad de logout
 */

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
 * Obtener iniciales del nombre del usuario
 */
function getUserInitials(nombreCompleto) {
  if (!nombreCompleto) return '??';
  
  const words = nombreCompleto.trim().split(' ');
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
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
 * Inicializar información del usuario en el sidebar
 */
function initSidebarUserInfo() {
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserInitials = document.getElementById('sidebarUserInitials');
  const sidebarLogoutButton = document.getElementById('sidebarLogoutButton');
  
  if (isAuthenticated()) {
    const userData = getUserData();
    
    if (userData) {
      // Actualizar nombre del usuario
      if (sidebarUserName) {
        sidebarUserName.textContent = userData.nombreCompleto || 'Usuario';
      }
      
      // Actualizar iniciales
      if (sidebarUserInitials) {
        sidebarUserInitials.textContent = getUserInitials(userData.nombreCompleto);
      }
    }
    
    // Agregar evento al botón de logout del sidebar
    if (sidebarLogoutButton) {
      sidebarLogoutButton.addEventListener('click', logout);
    }
  } else {
    // Si no hay usuario autenticado, mantener el texto por defecto
    if (sidebarUserName) {
      sidebarUserName.textContent = 'Mi Perfil';
    }
    if (sidebarUserInitials) {
      sidebarUserInitials.textContent = '?';
    }
  }
}

/**
 * Inicializar sidebar completo
 */
function initSidebar() {
  initSidebarUserInfo();
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}
