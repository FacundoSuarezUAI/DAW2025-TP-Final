'use strict';

// -*-*-*-*- variables globales
var tablero;
var juegoIniciado;
var juegoTerminado;
var tiempoInicio;
var intervalTimer;
var minasRestantes;
var nombreJugador = '';

document.addEventListener('DOMContentLoaded', function() {
    pedirNombreJugador(function(nombre) {
        nombreJugador = nombre;
        mostrarNombreJugador(nombreJugador);

        var selector = document.getElementById('selector-dificultad');
        
        function iniciarConDificultad() {
            var valor = selector.value;
            var filas, columnas, minas;
            if (valor === 'facil') {
                filas = 8; columnas = 8; minas = 10;
            } else if (valor === 'media') {
                filas = 12; columnas = 12; minas = 25;
            } else if (valor === 'dificil') {
                filas = 16; columnas = 16; minas = 50;
            } else {
                // valores por defecto
                filas = CONFIG.FILAS; columnas = CONFIG.COLUMNAS; minas = CONFIG.MINAS;
            }
            CONFIG.FILAS = filas;
            CONFIG.COLUMNAS = columnas;
            CONFIG.MINAS = minas;
            inicializarJuego(filas, columnas, minas);
        }

        selector.addEventListener('change', iniciarConDificultad);
        iniciarConDificultad();
    });
});


function inicializarJuego(filas, columnas, minas) {
    // validador preventivo
    if (!configuracionValida(filas, columnas, minas)) {
        mostrarModalMensaje('modal-error-config', 'Configuración inválida', 'El número de minas debe ser menor que la cantidad de celdas (' + (filas * columnas) + ').');
        return;
    }

    CONFIG.FILAS = filas;
    CONFIG.COLUMNAS = columnas;
    CONFIG.MINAS = minas;

    tablero = [];
    juegoIniciado = false;
    juegoTerminado = false;
    tiempoInicio = null;
    minasRestantes = minas;

    if (intervalTimer) {
        clearInterval(intervalTimer);
    }

    inicializarElementosDOM();
    btnReiniciar.textContent = '🙂';
    crearTableroVacio(CONFIG.FILAS, CONFIG.COLUMNAS);
    crearTableroHTML(CONFIG.FILAS, CONFIG.COLUMNAS);
    configurarEventos();
    actualizarContadorMinas(minasRestantes);
    actualizarTemporizador(0);
}


// -*-*-*-*- eventos

function configurarEventos() {
    btnReiniciar.addEventListener('click', function() {
        inicializarJuego(CONFIG.FILAS, CONFIG.COLUMNAS, CONFIG.MINAS);
    });
    configurarEventosCeldas();
}

function configurarEventosCeldas() {
    var celdas = document.querySelectorAll('.celda');
    for (var i = 0; i < celdas.length; i++) {
        var celda = celdas[i];
        
        // click izq
        celda.addEventListener('click', function(e) {
            if (juegoTerminado) return;
            var fila = parseInt(e.target.getAttribute('data-fila'));
            var columna = parseInt(e.target.getAttribute('data-columna'));
            manejarClickIzquierdo(fila, columna);
        });
        
        // click der
        celda.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            if (juegoTerminado) return;
            var fila = parseInt(e.target.getAttribute('data-fila'));
            var columna = parseInt(e.target.getAttribute('data-columna'));
            manejarClickDerecho(fila, columna);
        });
    }
}

// reiniciar con espacio
document.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.key === ' ') {
        // validar si hay modal abierto
        var modalAbierto = document.querySelector('.modal[style*="display: flex"]');
        if (!modalAbierto) {
            inicializarJuego(CONFIG.FILAS, CONFIG.COLUMNAS, CONFIG.MINAS);
        }
    }
});


// logica principal

function manejarClickIzquierdo(fila, columna) {
    var celda = tablero[fila][columna];
    
    // chording
    if (celda.revelada && celda.minasVecinas > 0) {
        manejarChording(fila, columna);
        return;
    }
    
    if (celda.marcada || celda.revelada) return;
    
    // primer click
    if (!juegoIniciado) {
        iniciarPartida(fila, columna);
    }
    
    revelarCelda(fila, columna);
}

function manejarClickDerecho(fila, columna) {
    var celda = tablero[fila][columna];
    if (celda.revelada) return;
    
    celda.marcada = !celda.marcada;
    
    if (celda.marcada) {
        minasRestantes--;
    } else {
        minasRestantes++;
    }
    
    actualizarContadorMinas(minasRestantes);
    actualizarCeldaHTML(fila, columna);
}

// chording (revelar celdas vecinas)
function manejarChording(fila, columna) {
    var celda = tablero[fila][columna];
    var celdasVecinas = obtenerCeldasVecinas(fila, columna);
    var banderasContadas = 0;

    for (var i = 0; i < celdasVecinas.length; i++) {
        var vecina = celdasVecinas[i];
        if (tablero[vecina.fila][vecina.columna].marcada) {
            banderasContadas++;
        }
    }

    if (banderasContadas === celda.minasVecinas) {
        for (var j = 0; j < celdasVecinas.length; j++) {
            var vecinaParaRevelar = celdasVecinas[j];
            if (!tablero[vecinaParaRevelar.fila][vecinaParaRevelar.columna].marcada) {
                revelarCelda(vecinaParaRevelar.fila, vecinaParaRevelar.columna);
            }
        }
    }
}

function revelarCelda(fila, columna) {
    var celda = tablero[fila][columna];
    if (celda.revelada) return;
    
    celda.revelada = true;
    
    if (celda.esMina) {
        manejarDerrota();
        return;
    }
    
    actualizarCeldaHTML(fila, columna);
    
    if (celda.minasVecinas === 0) {
        expandirCeldasVacias(fila, columna);
    }
    
    verificarVictoria();
}

function expandirCeldasVacias(fila, columna) {
    var celdasVecinas = obtenerCeldasVecinas(fila, columna);
    
    for (var i = 0; i < celdasVecinas.length; i++) {
        var vecina = celdasVecinas[i];
        revelarCelda(vecina.fila, vecina.columna);
    }
}

// evitar generar mina donde se clickeó x primera vez
function iniciarPartida(filaInicial, columnaInicial) {
    juegoIniciado = true;
    tiempoInicio = Date.now();
    
    generarMinas(filaInicial, columnaInicial);
    
    intervalTimer = setInterval(function() {
        var tiempoTranscurrido = Math.floor((Date.now() - tiempoInicio) / 1000);
        actualizarTemporizador(tiempoTranscurrido);
    }, 1000);
}

function generarMinas(filaSegura, columnaSegura) {
    var minasColocadas = 0;
    while (minasColocadas < CONFIG.MINAS) {
        var fila = obtenerIndiceAleatorio(CONFIG.FILAS);
        var columna = obtenerIndiceAleatorio(CONFIG.COLUMNAS);
        
        if ((fila === filaSegura && columna === columnaSegura) || tablero[fila][columna].esMina) {
            continue;
        }
        
        tablero[fila][columna].esMina = true;
        minasColocadas++;
    }
    calcularNumerosAdyacentes();
}

function calcularNumerosAdyacentes() {
    for (var i = 0; i < CONFIG.FILAS; i++) {
        for (var j = 0; j < CONFIG.COLUMNAS; j++) {
            if (!tablero[i][j].esMina) {
                var vecinas = obtenerCeldasVecinas(i, j);
                var contador = 0;
                for (var k = 0; k < vecinas.length; k++) {
                    var vecina = vecinas[k];
                    if (tablero[vecina.fila][vecina.columna].esMina) {
                        contador++;
                    }
                }
                tablero[i][j].minasVecinas = contador;
            }
        }
    }
}


// ver si quedaron celdas seguras
function verificarVictoria() {
    var celdasPorRevelar = 0;
    for (var i = 0; i < CONFIG.FILAS; i++) {
        for (var j = 0; j < CONFIG.COLUMNAS; j++) {
            if (!tablero[i][j].esMina && !tablero[i][j].revelada) {
                celdasPorRevelar++;
            }
        }
    }
    
    if (celdasPorRevelar === 0) {
        manejarVictoria();
    }
}

function manejarVictoria() {
    juegoTerminado = true;
    if (intervalTimer) clearInterval(intervalTimer);
    btnReiniciar.textContent = '😎';
    
    setTimeout(function() {
        mostrarModalMensaje('modal-victoria', '¡Felicitaciones!', '¡Ganaste la partida!');
    }, 100);
}

function manejarDerrota() {
    juegoTerminado = true;
    if (intervalTimer) clearInterval(intervalTimer);
    
    revelarTodasLasMinas();
    btnReiniciar.textContent = '😵';
    
    setTimeout(function() {
        mostrarModalMensaje('modal-derrota', '¡Perdiste!', 'Hacé click en el botón con el emoji para jugar de vuelta.');
    }, 100);
}

function revelarTodasLasMinas() {
    for (var i = 0; i < CONFIG.FILAS; i++) {
        for (var j = 0; j < CONFIG.COLUMNAS; j++) {
            if (tablero[i][j].esMina) {
                tablero[i][j].revelada = true;
                actualizarCeldaHTML(i, j);
            }
        }
    }
}


// -*-*-*-*- creacion y actualizacion tablero

// estructura de datos
function crearTableroVacio(filas, columnas) {
    tablero = [];
    for (var i = 0; i < filas; i++) {
        tablero[i] = [];
        for (var j = 0; j < columnas; j++) {
            tablero[i][j] = {
                esMina: false,
                revelada: false,
                marcada: false,
                minasVecinas: 0
            };
        }
    }
}

// dibujar el tablero
function crearTableroHTML(filas, columnas) {
    var tableroDiv = document.createElement('div');
    tableroDiv.className = 'tablero';

    if (columnas === 8) {
        tableroDiv.classList.add('tablero-facil');
    } else if (columnas === 12) {
        tableroDiv.classList.add('tablero-media');
    } else if (columnas === 16) {
        tableroDiv.classList.add('tablero-dificil');
    }

    for (var i = 0; i < filas; i++) {
        for (var j = 0; j < columnas; j++) {
            var celda = document.createElement('button');
            celda.className = 'celda';
            celda.setAttribute('data-fila', i);
            celda.setAttribute('data-columna', j);
            tableroDiv.appendChild(celda);
        }
    }
    tableroContainer.innerHTML = '';
    tableroContainer.appendChild(tableroDiv);
}

// apariencia celda segun estado (numero, bomba, bandera).
function actualizarCeldaHTML(fila, columna) {
    var celdaElement = document.querySelector('[data-fila="' + fila + '"][data-columna="' + columna + '"]');
    var celda = tablero[fila][columna];
    
    if (celda.marcada && !celda.revelada) {
        celdaElement.textContent = '🚩';
        celdaElement.classList.add('marcada');
    } else {
        celdaElement.classList.remove('marcada');
        
        if (celda.revelada) {
            celdaElement.classList.add('revelada');
            
            if (celda.esMina) {
                celdaElement.textContent = '💣';
                celdaElement.classList.add('mina');
            } else if (celda.minasVecinas > 0) {
                celdaElement.textContent = celda.minasVecinas;
            } else {
                celdaElement.textContent = '';
            }
        } else {
            celdaElement.textContent = '';
        }
    }
}


function configuracionValida(filas, columnas, minas) {
    var totalCeldas = filas * columnas;
    return minas > 0 && minas < totalCeldas;
}