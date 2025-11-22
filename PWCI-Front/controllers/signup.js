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
    const inputs = [
        nombreInput,
        apellidoInput,
        emailInput,
        passwordInput,
        fechaNacimientoInput,
        generoInput,
        paisNacimientoInput,
        nacionalidadInput
    ];
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', clearError);
            input.addEventListener('change', clearError);
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

    const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;

    const validationError = validateForm({
        nombre,
        apellido,
        nombreCompleto,
        email,
        password,
        fechaNacimiento,
        genero,
        paisNacimiento,
        nacionalidad,
        acceptTerms
    });

    if (validationError) {
        showError(validationError);
        return;
    }

    if (!validateFormReferences()) {
        return;
    }
    
    // Deshabilitar botón mientras se procesa
    setLoading(true);
    
    try {
        const payload = {
            nombreCompleto: nombreCompleto,
            correoElectronico: email,
            contrasena: password,
            fechaNacimiento: fechaNacimiento || new Date().toISOString().split('T')[0],
            genero: genero || null,
            paisNacimiento: paisNacimiento || null,
            nacionalidad: nacionalidad || null
        };

        if (error instanceof APIError) {
            showError(error.message || 'No se pudo completar el registro');
        } else {
            console.error('Error en registro:', error);
            showError('Error de conexión. Por favor, verifica tu conexión a internet.');
        }
    } finally {
        setLoading(false);
    }
}

/**
 * Validar formulario de registro
 */
function validateForm({ nombre, apellido, nombreCompleto, email, password, fechaNacimiento, genero, paisNacimiento, nacionalidad, acceptTerms }) {
    const failValidation = (field, message) => {
        if (field && typeof field.focus === 'function') {
            field.focus();
        }
        return message;
    };

    if (!nombreCompleto || nombreCompleto.length < 3) {
        return failValidation(nombreInput, 'Por favor, ingresa tu nombre completo (mínimo 3 caracteres).');
    }
    if (nombreCompleto.length > 120) {
        return failValidation(nombreInput, 'El nombre completo no puede superar los 120 caracteres.');
    }
    if (nombre && nombre.length > 60) {
        return failValidation(nombreInput, 'El nombre no puede superar los 60 caracteres.');
    }
    if (apellido && apellido.length > 60) {
        return failValidation(apellidoInput, 'El apellido no puede superar los 60 caracteres.');
    }
    if (!isAlphaWithSpaces(nombreCompleto)) {
        return failValidation(nombreInput, 'El nombre solo puede contener letras y espacios.');
    }
    if (!email) {
        return failValidation(emailInput, 'Por favor, ingresa tu correo electrónico.');
    }
    if (email.length > 150) {
        return failValidation(emailInput, 'El correo electrónico no puede superar los 150 caracteres.');
    }
    if (!isValidEmail(email)) {
        return failValidation(emailInput, 'Por favor, ingresa un correo electrónico válido.');
    }
    if (!password) {
        return failValidation(passwordInput, 'Por favor, ingresa una contraseña.');
    }
    if (!isStrongPassword(password)) {
        return failValidation(passwordInput, 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.');
    }
    if (fechaNacimientoInput && !fechaNacimiento) {
        return failValidation(fechaNacimientoInput, 'Por favor, ingresa tu fecha de nacimiento.');
    }
    if (fechaNacimiento && !isValidAge(fechaNacimiento)) {
        return failValidation(fechaNacimientoInput, 'Debes ser mayor de 12 años y menor de 120 años para registrarte.');
    }
    if (paisNacimiento && !isAlphaNumericWithSpaces(paisNacimiento)) {
        return failValidation(paisNacimientoInput, 'El país de nacimiento solo puede contener letras, números y espacios.');
    }
    if (paisNacimiento && paisNacimiento.length > 100) {
        return failValidation(paisNacimientoInput, 'El país de nacimiento no puede superar los 100 caracteres.');
    }
    if (nacionalidad && !isAlphaNumericWithSpaces(nacionalidad)) {
        return failValidation(nacionalidadInput, 'La nacionalidad solo puede contener letras, números y espacios.');
    }
    if (nacionalidad && nacionalidad.length > 100) {
        return failValidation(nacionalidadInput, 'La nacionalidad no puede superar los 100 caracteres.');
    }
    if (genero && !['Masculino', 'Femenino', 'No especificado', 'Otro'].includes(genero)) {
        return failValidation(generoInput, 'Selecciona un género válido.');
    }
    if (termsCheckbox && !acceptTerms) {
        return failValidation(termsCheckbox, 'Debes aceptar los términos y condiciones.');
    }
    return null;
}

function validateFormReferences() {

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
    if (password.length < 8 || password.length > 64) {
        return false;
    }
    if (password.includes(' ')) {
        return false;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpper && hasLower && hasNumber;
}

/**
 * Validar edad mínima (12 años)
 */
function isValidAge(fechaNacimiento) {
    const today = new Date();
    const birthDate = new Date(fechaNacimiento);
    if (Number.isNaN(birthDate.getTime())) {
        return false;
    }
    if (birthDate > today) {
        return false;
    }
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
    }
    return age >= 12 && age <= 120;
}

function isAlphaWithSpaces(value) {
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'\-\. ]+$/.test(value);
}

function isAlphaNumericWithSpaces(value) {
    return /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ,.()'-]+$/.test(value);
}

/**
 * Manejar registro exitoso
 */
function handleSignupSuccess(data) {
    if (!data || !data.user || !data.token) {
        showError('Respuesta de registro inválida. Intenta nuevamente.');
        return;
    }

    const user = data.user;
    const userData = {
        idUsuario: user.idUsuario,
        nombreCompleto: user.nombreCompleto,
        correoElectronico: user.correoElectronico,
        fechaNacimiento: user.fechaNacimiento,
        genero: user.genero,
        paisNacimiento: user.paisNacimiento,
        nacionalidad: user.nacionalidad,
        rol: user.rol || 'usuario',
        foto: user.foto || null
    };

    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('loginTime', new Date().toISOString());

    showSuccess('Registro exitoso. Redirigiendo...');

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
