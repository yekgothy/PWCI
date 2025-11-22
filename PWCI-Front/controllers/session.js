(function() {
    const avatarUtils = window.PWCI && window.PWCI.avatar ? window.PWCI.avatar : null;

    function getUserData() {
        try {
            const raw = localStorage.getItem('userData');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.tieneFotoBlob === undefined) {
                parsed.tieneFotoBlob = 0;
            }
            return parsed;
        } catch (error) {
            console.error('Error parsing userData from storage:', error);
            return null;
        }
    }

    function getAuthToken() {
        return localStorage.getItem('authToken');
    }

    function isAuthenticated() {
        return Boolean(getAuthToken() && getUserData());
    }

    function setUserData(userData, options = {}) {
        try {
            if (userData) {
                localStorage.setItem('userData', JSON.stringify(userData));
            } else {
                localStorage.removeItem('userData');
            }
        } catch (error) {
            console.error('Error storing user data:', error);
        }
        refreshUI(options);
    }

    function logout({ confirmMessage = '¿Estás seguro de que quieres cerrar sesión?' } = {}) {
        if (!confirm(confirmMessage)) {
            return;
        }
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        localStorage.removeItem('loginTime');
        window.location.href = '../pages/login.html';
    }

    function computeInitials(nombreCompleto) {
        if (!nombreCompleto || typeof nombreCompleto !== 'string') {
            return '??';
        }
        const words = nombreCompleto.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return '??';
        if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    function applyAvatarUI({ imgElement, fallbackElement, initialsElement, avatarInfo, options = {} }) {
        if (!imgElement || !fallbackElement) {
            return;
        }
        if (initialsElement) {
            initialsElement.textContent = computeInitials(avatarInfo && avatarInfo.nombre);
        }
        if (avatarUtils) {
            const avatarUrl = avatarUtils.getAvatarUrl({
                id: avatarInfo ? avatarInfo.id : null,
                foto: avatarInfo ? avatarInfo.foto : null,
                hasBlob: avatarInfo ? avatarInfo.hasBlob : null
            }, { cacheBust: options.cacheBust });
            avatarUtils.applyAvatar(imgElement, fallbackElement, avatarUrl);
        } else {
            fallbackElement.classList.remove('hidden');
            imgElement.classList.add('hidden');
        }
    }

    function updateNavbar(user, options = {}) {
        const authButtons = document.getElementById('authButtons');
        const userMenu = document.getElementById('userMenu');
        const navUserName = document.getElementById('navUserName');
        const logoutButton = document.getElementById('logoutButton');
        const navUserAvatar = document.getElementById('navUserAvatar');
        const navUserAvatarFallback = document.getElementById('navUserAvatarFallback');
        const navUserInitials = document.getElementById('navUserInitials');

        if (!user) {
            if (authButtons) authButtons.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
            if (navUserAvatar) {
                navUserAvatar.classList.add('hidden');
                navUserAvatar.removeAttribute('src');
            }
            if (navUserAvatarFallback) {
                navUserAvatarFallback.classList.remove('hidden');
            }
            if (navUserInitials) {
                navUserInitials.textContent = '??';
            }
            return;
        }

        if (authButtons) authButtons.classList.add('hidden');
        if (userMenu) {
            userMenu.classList.remove('hidden');
            userMenu.classList.add('flex');
        }
        if (navUserName) {
            navUserName.textContent = user.nombreCompleto || 'Usuario';
        }
        if (logoutButton) {
            logoutButton.onclick = () => logout();
        }
        applyAvatarUI({
            imgElement: navUserAvatar,
            fallbackElement: navUserAvatarFallback,
            initialsElement: navUserInitials,
            avatarInfo: {
                id: user.idUsuario,
                foto: user.foto,
                hasBlob: user.tieneFotoBlob,
                nombre: user.nombreCompleto
            },
            options
        });
    }

    function updateSidebar(user, options = {}) {
        const sidebarUserName = document.getElementById('sidebarUserName');
        const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
        const sidebarUserAvatarFallback = document.getElementById('sidebarUserAvatarFallback');
        const sidebarUserInitials = document.getElementById('sidebarUserInitials');
        const sidebarLogoutButton = document.getElementById('sidebarLogoutButton');
        const adminPanelItem = document.getElementById('adminPanelItem');

        if (!user) {
            if (sidebarUserName) sidebarUserName.textContent = 'Mi Perfil';
            if (sidebarUserInitials) sidebarUserInitials.textContent = '?';
            if (sidebarLogoutButton) sidebarLogoutButton.onclick = () => logout();
            if (sidebarUserAvatar) {
                sidebarUserAvatar.classList.add('hidden');
                sidebarUserAvatar.removeAttribute('src');
            }
            if (sidebarUserAvatarFallback) {
                sidebarUserAvatarFallback.classList.remove('hidden');
            }
            if (adminPanelItem) {
                adminPanelItem.classList.add('hidden');
            }
            return;
        }

        if (sidebarUserName) sidebarUserName.textContent = user.nombreCompleto || 'Usuario';
        if (sidebarLogoutButton) sidebarLogoutButton.onclick = () => logout();

        if (adminPanelItem) {
            if (user.rol === 'admin') {
                adminPanelItem.classList.remove('hidden');
            } else {
                adminPanelItem.classList.add('hidden');
            }
        }

        applyAvatarUI({
            imgElement: sidebarUserAvatar,
            fallbackElement: sidebarUserAvatarFallback,
            initialsElement: sidebarUserInitials,
            avatarInfo: {
                id: user.idUsuario,
                foto: user.foto,
                hasBlob: user.tieneFotoBlob,
                nombre: user.nombreCompleto
            },
            options
        });
    }

    function refreshUI(options = {}) {
        const user = isAuthenticated() ? getUserData() : null;
        updateNavbar(user, options);
        updateSidebar(user, options);
    }

    window.PWCI = window.PWCI || {};
    window.PWCI.session = {
        getUserData,
        setUserData,
        isAuthenticated,
        getAuthToken,
        refreshUI,
        logout,
        computeInitials
    };

    document.addEventListener('DOMContentLoaded', () => {
        refreshUI();
    });
})();
