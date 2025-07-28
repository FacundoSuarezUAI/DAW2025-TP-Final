'use strict';

// variables
var contadorMinas;
var temporizador;
var btnReiniciar;
var tableroContainer;

// funciones de inicio y actualizacion UI

function inicializarElementosDOM() {
    contadorMinas = document.getElementById('minas-restantes');
    temporizador = document.getElementById('tiempo');
    btnReiniciar = document.getElementById('btn-reiniciar');
    tableroContainer = document.getElementById('tablero-container');
}

function actualizarContadorMinas(minas) {
    if (contadorMinas) {
        contadorMinas.textContent = minas;
    }
}

function actualizarTemporizador(tiempo) {
    if (temporizador) {
        temporizador.textContent = formatearTiempo(tiempo);
    }
}

function mostrarNombreJugador(nombre) {
    var cont = document.getElementById('nombre-jugador-container');
    if (cont) {
        cont.textContent = 'Jugador: ' + nombre;
    }
}

// logica modales

function mostrarModal(modal) {
    if (modal) {
        modal.style.display = 'flex';
    }
}

function ocultarModal(modal) {
    if (modal) {
        modal.style.display = 'none';
    }
}

function crearModalMensaje(id, titulo, mensaje, callback) {
    var modal = document.createElement('div');
    modal.id = id;
    modal.className = 'modal';
    modal.innerHTML =
        '<div class="modal-content">' +
        '<h3>' + titulo + '</h3>' +
        '<div class="modal-body">' + mensaje + '</div>' +
        '<button id="btn-cerrar-' + id + '">Cerrar</button>' +
        '</div>';
    document.body.appendChild(modal);

    var btnCerrar = document.getElementById('btn-cerrar-' + id);
    btnCerrar.addEventListener('click', function() {
        ocultarModal(modal);
        modal.remove();
        if (typeof callback === 'function') callback();
    });

    return modal;
}

function mostrarModalMensaje(id, titulo, mensaje, callback) {
    var modal = crearModalMensaje(id, titulo, mensaje, callback);
    mostrarModal(modal);
}

function pedirNombreJugador(callback) {
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-nombre-jugador';
    modal.innerHTML =
        '<div class="modal-content">' +
            '<h3>Ingresa tu nombre</h3>' +
            '<input type="text" id="input-nombre-jugador" placeholder="Nombre" style="padding:0.5rem;width:90%;margin-top:10px;" autocomplete="off" maxlength="20">' +
            '<div class="error" id="error-nombre-jugador" style="min-height:1.2rem;margin-top:8px;"></div>' +
            '<button id="btn-confirmar-nombre" style="margin-top:10px;">Comenzar</button>' +
        '</div>';
    document.body.appendChild(modal);

    mostrarModal(modal);

    var inputNombre = document.getElementById('input-nombre-jugador');
    var btnConfirmar = document.getElementById('btn-confirmar-nombre');
    var errorNombre = document.getElementById('error-nombre-jugador');

    function confirmarNombre() {
        var nombre = inputNombre.value.trim();
        if (!validarNombre(nombre)) {
            errorNombre.textContent = 'El nombre debe tener al menos 3 letras';
            return;
        }
        ocultarModal(modal);
        modal.remove();
        if (typeof callback === 'function') callback(nombre);
    }

    btnConfirmar.addEventListener('click', confirmarNombre);
    inputNombre.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            confirmarNombre();
        }
    });
}


// logica form contacto

function validarNombre(nombre) {
    return nombre && nombre.trim().length >= 3;
}

function validarEmail(email) {
    var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarMensaje(mensaje) {
    return mensaje && mensaje.trim().length >= 5;
}

document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('form-contacto');
    if (!form) return; // solo para contacto.html

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var nombreInput = document.getElementById('nombre');
        var emailInput = document.getElementById('email');
        var mensajeInput = document.getElementById('mensaje');

        var errorNombre = document.getElementById('error-nombre');
        var errorEmail = document.getElementById('error-email');
        var errorMensaje = document.getElementById('error-mensaje');
        
        errorNombre.textContent = '';
        errorEmail.textContent = '';
        errorMensaje.textContent = '';

        var esValido = true;

        if (!validarNombre(nombreInput.value)) {
            errorNombre.textContent = 'El nombre debe tener por lo menos 3 caracteres.';
            esValido = false;
        }

        if (!validarEmail(emailInput.value)) {
            errorEmail.textContent = 'Ingrese un email válido.';
            esValido = false;
        }

        if (!validarMensaje(mensajeInput.value)) {
            errorMensaje.textContent = 'El mensaje debe tener por lo menos 5 caracteres.';
            esValido = false;
        }

        if (!esValido) return;

        var destinatario = 'facundo.suarez.dev@gmail.com';
        var asunto = encodeURIComponent('Contacto desde Buscaminas');
        var cuerpo = encodeURIComponent(
            'Nombre: ' + nombreInput.value.trim() + '\n' +
            'Email: ' + emailInput.value.trim() + '\n\n' +
            mensajeInput.value.trim()
        );
        window.location.href = 'mailto:' + destinatario + '?subject=' + asunto + '&body=' + cuerpo;
    });
});