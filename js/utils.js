'use strict';

// config default
var CONFIG = {
    FILAS: 8,
    COLUMNAS: 8,
    MINAS: 10
};


function obtenerIndiceAleatorio(max) {
    return Math.floor(Math.random() * max);
}

function obtenerCeldasVecinas(fila, columna) {
    var vecinas = [];
    
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            var nuevaFila = fila + i;
            var nuevaColumna = columna + j;
            
            if ((i !== 0 || j !== 0) && 
                nuevaFila >= 0 && nuevaFila < CONFIG.FILAS &&
                nuevaColumna >= 0 && nuevaColumna < CONFIG.COLUMNAS) {
                vecinas.push({fila: nuevaFila, columna: nuevaColumna});
            }
        }
    }
    
    return vecinas;
}

// format segundos ej: 5 -> 005
function formatearTiempo(segundos) {
    if (segundos < 1000) { // limite
        return segundos.toString().padStart(3, '0');
    }
    return '999';
}