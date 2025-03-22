import React, { useState, useEffect } from 'react';

function Timer({ onTimeOut, resetTimer, initialTime = 60 }) {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [timerActive, setTimerActive] = useState(true);

    // Update timeLeft when initialTime changes
    useEffect(() => {
        setTimeLeft(initialTime);
        setTimerActive(true);
    }, [initialTime]);

    // Reset timer when resetTimer changes
    useEffect(() => {
        if (resetTimer) {
            setTimeLeft(initialTime);
            setTimerActive(true);
        }
    }, [resetTimer, initialTime]);

    // Handle countdown
    useEffect(() => {
        let timer;
        if (timeLeft > 0 && timerActive) {
            timer = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft <= 0 && timerActive) {
            setTimerActive(false);
            onTimeOut();
        }

        return () => clearInterval(timer);
    }, [timeLeft, timerActive, onTimeOut]);

    return (
        <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {timeLeft > 0 ? `Time left: ${timeLeft}s` : "Time's up!"}
        </div>
    );
}

export default Timer;