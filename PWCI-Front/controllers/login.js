let loginForm, emailInput, passwordInput, loginButton, errorMessage, togglePasswordBtn;

document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    
    loginForm = document.getElementById('loginForm');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    loginButton = document.getElementById('loginButton');
    errorMessage = document.getElementById('errorMessage');
    togglePasswordBtn = document.getElementById('togglePassword');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', clearError);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', clearError);
    }
});

function checkExistingSession() {
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    
    if (userData && token) {
        window.location.href = 'feed.html';
    }
}

async function handleLogin(event) {
    event.preventDefault();
    clearError();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    if (!validateForm(email, password)) {
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    setLoading(true);
    
    try {
        const response = await AuthAPI.login(email, password);
        handleLoginSuccess(response.data);
    } catch (error) {
        if (error instanceof APIError) {
            showError(error.message || 'Credenciales inválidas');
        } else {
            console.error('Error en login:', error);
            showError('Error de conexión. Por favor, verifica tu conexión a internet.');
        }
    } finally {
        setLoading(false);
    }
}

function validateForm(email, password) {
    if (!email) {
        showError('Por favor, ingresa tu correo electrónico');
        emailInput.focus();
        return false;
    }
    
    if (!isValidEmail(email)) {
        showError('Por favor, ingresa un correo electrónico válido');
        emailInput.focus();
        return false;
    }
    
    if (!password) {
        showError('Por favor, ingresa tu contraseña');
        passwordInput.focus();
        return false;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        passwordInput.focus();
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function handleLoginSuccess(data) {
    localStorage.setItem('userData', JSON.stringify(data.user));
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('loginTime', new Date().toISOString());
    
    showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
    
    setTimeout(() => {
        window.location.href = 'feed.html';
    }, 1000);
}

function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.className = 'text-red-500 text-sm mt-2 block';
        errorMessage.style.display = 'block';
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.className = 'text-green-500 text-sm mt-2 block';
        errorMessage.style.display = 'block';
    }
}

function clearError() {
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }
}

function setLoading(isLoading) {
    if (loginButton) {
        loginButton.disabled = isLoading;
        loginButton.textContent = isLoading ? 'Iniciando sesión...' : 'Sign in';
        loginButton.style.opacity = isLoading ? '0.7' : '1';
        loginButton.style.cursor = isLoading ? 'not-allowed' : 'pointer';
    }
}

function togglePasswordVisibility() {
    if (passwordInput) {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        if (togglePasswordBtn) {
            const icon = togglePasswordBtn.querySelector('svg');
            if (icon) {
                // Aquí puedes cambiar el icono si lo deseas
            }
        }
    }
}

/**
 * Cerrar sesión (función auxiliar para usar en otras páginas)
 */
function logout() {
    localStorage.removeItem('userData');
    localStorage.removeItem('authToken');
    localStorage.removeItem('loginTime');
    window.location.href = 'login.html';
}

// Exportar funciones para usar en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { logout };
}
