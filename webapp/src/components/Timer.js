import React, { useState, useEffect, useRef } from 'react';
import "./Timer.css";

function Timer({ onTimeOut, resetTimer, initialTime, difficulty }) {
    const [timeLeft, setTimeLeft] = useState(initialTime);
    const [initialTimeCopy, setInitialTimeCopy] = useState(difficulty === 2 ? 45 : 60);
    const [timerActive, setTimerActive] = useState(true);
    const startTimeRef = useRef(Date.now());
    const animationFrameRef = useRef(null);
    const radius = 35;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        setInitialTimeCopy(difficulty === 2 ? 45 : 60);
    }, [difficulty]);

    useEffect(() => {
        startTimeRef.current = Date.now();
        setTimeLeft(initialTime);
        setTimerActive(true);

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        const updateTimer = () => {
            const currentTime = Date.now();
            const elapsedTime = Math.floor((currentTime - startTimeRef.current) / 1000);
            const remainingTime = Math.max(initialTime - elapsedTime, 0);

            setTimeLeft(remainingTime);

            if (remainingTime > 0) {
                animationFrameRef.current = requestAnimationFrame(updateTimer);
            } else if (timerActive) {
                setTimerActive(false);
                onTimeOut();
            }
        };

        animationFrameRef.current = requestAnimationFrame(updateTimer);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [initialTime, resetTimer]);

    let timeLeftCopy = timeLeft;
    if (timeLeft > initialTimeCopy) {
        timeLeftCopy = initialTimeCopy;
    }
    const progress = (timeLeftCopy / initialTimeCopy) * circumference;

    return (
        <div className="timer-container">
            <svg className="timer-svg" width="100" height="100" viewBox="0 0 100 100">
                <circle className="timer-background" cx="50" cy="50" r={radius} />
                <circle
                    className="timer-circle"
                    cx="50" cy="50"
                    r={radius}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                />
                {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x1 = 50 + Math.cos(angle) * 35;
                    const y1 = 50 + Math.sin(angle) * 35;
                    const x2 = 50 + Math.cos(angle) * 30;
                    const y2 = 50 + Math.sin(angle) * 30;
                    const isQuarter = i % 3 === 0;
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={`timer-mark ${isQuarter ? 'timer-mark-quarter' : ''}`} />;
                })}
                {timeLeft > 0 ? (
                    <text x="50" y="55" textAnchor="middle" className="timer-text" transform="rotate(90, 50, 50)">
                        {timeLeft}s
                    </text>
                ) : (
                    <text x="50" y="55" textAnchor="middle" className="timer-text" transform="rotate(90, 50, 50)">
                        0s
                    </text>
                )}
            </svg>
        </div>
    );
}

export default Timer;
