import React, { useState, useEffect, setTimeLeft } from 'react';
import "./Timer.css"; // Archivo de estilos para el reloj

function Timer({ timeLeft, setTimeLeft, onTimeOut, resetTimer }) {
    const [timerActive, setTimerActive] = useState(true); // Nuevo estado para controlar si el timer está activo

    const totalTime = 60; // Duración total en segundos
    const radius = 35; // Radio del círculo
    const circumference = 2 * Math.PI * radius; // Circunferencia del círculo

    // Reinicia el tiempo cuando el usuario pulsa Replay
    useEffect(() => {
        if (resetTimer) {
            setTimeLeft(60);
            setTimerActive(true);  // Reactiva el temporizador
        }
    }, [resetTimer]);

    useEffect(() => {
        if (timeLeft > 0 && timerActive) {
            const timer = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);

            return () => clearInterval(timer); // Limpiar el intervalo cuando el componente se desmonte
        } else if (timeLeft === 0 && timerActive) {
            setTimerActive(false);  // Desactiva el temporizador para evitar múltiples llamadas
            onTimeOut(); // Llamar a la función cuando el tiempo se haya agotado
        }
    }, [timeLeft, onTimeOut]);

    const progress = ((timeLeft) / totalTime) * circumference;

    return (
        <div className="timer-container">
            <svg className="timer-svg" width="100" height="100" viewBox="0 0 100 100">
                {/* Círculo de fondo con marcas del reloj */}
                <circle className="timer-background" cx="50" cy="50" r={radius} />
                
                {/* Círculo de progreso en rojo */}
                <circle
                    className="timer-circle"
                    cx="50" cy="50"
                    r={radius}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress} // Invertir el sentido de la barra
                />

                {/* Marcas del reloj */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x1 = 50 + Math.cos(angle) * 35;
                    const y1 = 50 + Math.sin(angle) * 35;
                    const x2 = 50 + Math.cos(angle) * 30;
                    const y2 = 50 + Math.sin(angle) * 30;
                    const isQuarter = i % 3 === 0;
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={`timer-mark ${isQuarter ? 'timer-mark-quarter' : ''}`} />;
                })}

                {/* Texto del tiempo restante */}
                <text x="50" y="55" textAnchor="middle" className="timer-text" transform="rotate(90, 50, 50)">
                    {timeLeft}s
                </text>
            </svg>
        </div>
    );
}

export default Timer;