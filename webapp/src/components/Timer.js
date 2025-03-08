import React, { useState, useEffect } from 'react';

function Timer({ onTimeOut, resetTimer }) {
    const [timeLeft, setTimeLeft] = useState(5); // Tiempo inicial de 15 segundos
    const [timerActive, setTimerActive] = useState(true); // Nuevo estado para controlar si el timer está activo

    // Reinicia el tiempo cuando el usuario pulsa Replay
    useEffect(() => {
        if (resetTimer) {
            setTimeLeft(5);
            setTimerActive(true);  // 🔹 Reactiva el temporizador
        }
    }, [resetTimer]);

    useEffect(() => {
        if (timeLeft > 0 && timerActive) {
            const timer = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);

            return () => clearInterval(timer); // Limpiar el intervalo cuando el componente se desmonte
        } else if (timeLeft === 0 && timerActive) {
            setTimerActive(false);  // 🔹 Desactiva el temporizador para evitar múltiples llamadas
            onTimeOut(); // Llamar a la función cuando el tiempo se haya agotado
        }
    }, [timeLeft, onTimeOut]);

    return (
        <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {timeLeft > 0 ? `Time left: ${timeLeft}s` : "Time's up!"}
        </div>
    );
}

export default Timer;
