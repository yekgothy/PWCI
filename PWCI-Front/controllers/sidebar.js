/**
 * Controlador para el sidebar izquierdo (sidebarFeed1)
 * Delegamos la renderización en el módulo de sesión compartido
 */

function initSidebarUserInfo() {
  if (window.PWCI && window.PWCI.session) {
    window.PWCI.session.refreshUI();
  }
}

function initSidebar() {
  initSidebarUserInfo();
  if (window.PWCI && window.PWCI.countdown) {
    window.PWCI.countdown.init();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}
