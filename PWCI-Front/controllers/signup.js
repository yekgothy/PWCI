// Controlador de registro de usuarios
const API_URL = 'http://localhost/PWCI/PWCI-Backend/api.php';

let signupForm, nombreInput, apellidoInput, emailInput, passwordInput;
let fechaNacimientoInput, generoInput, paisNacimientoInput, nacionalidadInput;
let termsCheckbox, signupButton, errorMessage, togglePasswordBtn;

document.addEventListener('DOMContentLoaded', function() {
    checkExistingSession();
    signupForm = document.getElementById('signupForm');
    nombreInput = document.getElementById('nombre');
    apellidoInput = document.getElementById('apellido');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    fechaNacimientoInput = document.getElementById('fechaNacimiento');
    generoInput = document.getElementById('genero');
    paisNacimientoInput = document.getElementById('paisNacimiento');
    nacionalidadInput = document.getElementById('nacionalidad');
    termsCheckbox = document.getElementById('terms');
    signupButton = document.getElementById('signupButton');
    errorMessage = document.getElementById('errorMessage');
    togglePasswordBtn = document.getElementById('togglePassword');
    
    // Agregar event listeners
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // Limpiar mensajes de error al escribir
    const inputs = [nombreInput, apellidoInput, emailInput, passwordInput, fechaNacimientoInput];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', clearError);
        }
    });
    
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', clearError);
    }
});

/**
 * Verificar si ya existe una sesión activa
 */
function checkExistingSession() {
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('authToken');
    
    if (userData && token) {
        // Usuario ya tiene sesión activa, redirigir al feed
        window.location.href = 'feed.html';
    }
}

/**
 * Manejar el evento de submit del formulario de registro
 */
async function handleSignup(event) {
    event.preventDefault();
    
    // Limpiar mensajes previos
    clearError();
    
    // Obtener valores del formulario
    const nombre = nombreInput ? nombreInput.value.trim() : '';
    const apellido = apellidoInput ? apellidoInput.value.trim() : '';
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const fechaNacimiento = fechaNacimientoInput ? fechaNacimientoInput.value : '';
    const genero = generoInput ? generoInput.value : '';
    const paisNacimiento = paisNacimientoInput ? paisNacimientoInput.value : '';
    const nacionalidad = nacionalidadInput ? nacionalidadInput.value : '';
    const acceptTerms = termsCheckbox ? termsCheckbox.checked : false;
    
    // Construir nombre completo
    const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;
    
    // Validar formulario
    if (!validateForm(nombreCompleto, email, password, fechaNacimiento, acceptTerms)) {
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    setLoading(true);
    
    try {
        // Realizar petición de registro
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombreCompleto: nombreCompleto,
                correoElectronico: email,
                contrasena: password,
                fechaNacimiento: fechaNacimiento || new Date().toISOString().split('T')[0],
                genero: genero || null,
                paisNacimiento: paisNacimiento || null,
                nacionalidad: nacionalidad || null
            })
        });
        
        const data = await response.json();
        
        if (response.ok && (data.status === 200 || data.status === 201)) {
            // Registro exitoso
            handleSignupSuccess(data.data);
        } else {
            // Error en el registro
            showError(data.message || 'Error al registrar usuario');
        }
    } catch (error) {
        console.error('Error en registro:', error);
        showError('Error de conexión. Por favor, verifica tu conexión a internet.');
    } finally {
        setLoading(false);
    }
}

/**
 * Validar formulario de registro
 */
function validateForm(nombreCompleto, email, password, fechaNacimiento, acceptTerms) {
    if (!nombreCompleto || nombreCompleto.length < 3) {
        showError('Por favor, ingresa tu nombre completo (mínimo 3 caracteres)');
        if (nombreInput) nombreInput.focus();
        return false;
    }
    
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
        showError('Por favor, ingresa una contraseña');
        passwordInput.focus();
        return false;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        passwordInput.focus();
        return false;
    }
    
    if (!isStrongPassword(password)) {
        showError('La contraseña debe contener al menos una letra y un número');
        passwordInput.focus();
        return false;
    }
    
    if (fechaNacimientoInput && !fechaNacimiento) {
        showError('Por favor, ingresa tu fecha de nacimiento');
        fechaNacimientoInput.focus();
        return false;
    }
    
    if (fechaNacimiento && !isValidAge(fechaNacimiento)) {
        showError('Debes ser mayor de 13 años para registrarte');
        if (fechaNacimientoInput) fechaNacimientoInput.focus();
        return false;
    }
    
    if (termsCheckbox && !acceptTerms) {
        showError('Debes aceptar los términos y condiciones');
        return false;
    }
    
    return true;
}

/**
 * Validar formato de email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validar fortaleza de contraseña
 */
function isStrongPassword(password) {
    // Al menos una letra y un número
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasLetter && hasNumber;
}

/**
 * Validar edad mínima (13 años)
 */
function isValidAge(fechaNacimiento) {
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 13;
    }
    
    return age >= 13;
}

/**
 * Manejar registro exitoso
 */
function handleSignupSuccess(data) {
    // Guardar datos del usuario y token en localStorage
    const userData = {
        idUsuario: data.idUsuario,
        nombreCompleto: data.nombreCompleto,
        correoElectronico: data.correoElectronico,
        rol: 'usuario'
    };
    
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('loginTime', new Date().toISOString());
    
    // Mostrar mensaje de éxito
    showSuccess('¡Registro exitoso! Redirigiendo...');
    
    // Redirigir al feed después de 1.5 segundos
    setTimeout(() => {
        window.location.href = 'feed.html';
    }, 1500);
}

/**
 * Mostrar mensaje de error
 */
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.className = 'text-red-500 text-sm mt-2 block';
        errorMessage.style.display = 'block';
    } else {
        alert(message);
    }
}

/**
 * Mostrar mensaje de éxito
 */
function showSuccess(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.className = 'text-green-500 text-sm mt-2 block';
        errorMessage.style.display = 'block';
    }
}

/**
 * Limpiar mensaje de error
 */
function clearError() {
    if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }
}

/**
 * Establecer estado de carga
 */
function setLoading(isLoading) {
    if (signupButton) {
        signupButton.disabled = isLoading;
        signupButton.textContent = isLoading ? 'Registrando...' : 'Create account';
        signupButton.style.opacity = isLoading ? '0.7' : '1';
        signupButton.style.cursor = isLoading ? 'not-allowed' : 'pointer';
    }
}

/**
 * Alternar visibilidad de la contraseña
 */
function togglePasswordVisibility() {
    if (passwordInput) {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    }
}
