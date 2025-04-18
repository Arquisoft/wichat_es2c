import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const CountdownTimer = forwardRef(({ maxTime = 60, size = 100, onTimeOut}, ref) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const initialRotation = 225;

  const [timeLeft, setTimeLeft] = useState(maxTime);
  const [rotation, setRotation] = useState(initialRotation);
  const [intervalId, setIntervalId] = useState(null);

  useImperativeHandle(ref, () => ({
    addTime: (amount) => {
      setTimeLeft((prev) => Math.min(maxTime, prev + amount));
    },
    restTime: (amount) => {
      setTimeLeft((prev) => Math.max(0, prev - amount));
    },
    reset: () => {
      setTimeLeft(maxTime);
      clearInterval(intervalId);
      setRotation(initialRotation);
      startTimer();
    }
  }));

  const startTimer = () => {
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 0.05;
      });
    }, 50);
    setIntervalId(id);
  };

  const timeoutRef = React.useRef(false);

  useEffect(() => {
    if (timeLeft <= 0 && onTimeOut && typeof onTimeOut === 'function' && !timeoutRef.current) {
      timeoutRef.current = true;
      onTimeOut();
    } else if (timeLeft > 0) {
      timeoutRef.current = false;
    }
  }, [timeLeft, onTimeOut]);

  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalId);
  }, [maxTime]);

  useEffect(() => {
    setRotation(initialRotation + (timeLeft / maxTime) * 360);
  }, [timeLeft, maxTime]);

  const progress = timeLeft / maxTime;
  const offset = -circumference * progress;

  return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        aria-hidden="true"
        role="img"
        className="iconify iconify--emojione"
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx="32" cy="39" r={radius} fill="#ed4c5c">
        </circle>

        <circle
          cx="32"
          cy="39"
          r={radius}
          fill="none"
          stroke="#f8f8f8"
          strokeWidth={radius * 2}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 32 39)"
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
        <path
          d="M32 0c-3.3 0-6 2.7-6 6s2.7 6 6 6s6-2.7 6-6s-2.7-6-6-6m0 10.3c-2.4 0-4.3-1.9-4.3-4.3s1.9-4.3 4.3-4.3s4.3 1.9 4.3 4.3s-1.9 4.3-4.3 4.3"
          fill="#d0d0d0"
        ></path>

        <path fill="#4e5c66" d="M30.5 8.6h3v6.5h-3z"></path>

        <path d="M34.5 11.6h-5V5.9c0-1.5 5-1.5 5 0v5.7" fill="#647a87"></path>

        <path
          fill="#4e5c66"
          d="M10.737 20.686l2.969-2.97l2.97 2.969l-2.968 2.97z"
        ></path>

        <path
          d="M15.6 17.6l-5 5l-3.1-3.1c-.6-.6-.6-1.6 0-2.2l2.8-2.8c.6-.6 1.6-.6 2.2 0l3.1 3.1"
          fill="#647a87"
        ></path>

        <path
          fill="#4e5c66"
          d="M47.344 20.705l2.97-2.97l2.97 2.97l-2.97 2.97z"
        ></path>

        <g fill="#647a87">
          <path d="M53.4 22.6l-5-5l3.1-3.1c.6-.6 1.6-.6 2.2 0l2.8 2.8c.6.6.6 1.6 0 2.2l-3.1 3.1"></path>

          <circle
            cx="32"
            cy="39"
            r="23"
            fill="none"
            stroke="#647a87"
            strokeWidth="4"
          ></circle>
        </g>

        <circle
          cx="32"
          cy="39"
          r="20.85"
          fill="none"
          stroke="#d2d3d5"
          strokeWidth="1.8"
        ></circle>

        <g fill="#3e4347">
          <path d="M31.3 20.7h1.4v5.6h-1.4z"></path>
          <path d="M31.3 51.7h1.4v5.6h-1.4z"></path>
          <path d="M13.7 38.3h5.6v1.4h-5.6z"></path>
          <path d="M44.7 38.3h5.6v1.4h-5.6z"></path>
          <path d="M22.178 23.463l1.213-.7l1.4 2.425l-1.213.7z"></path>
          <path d="M15.728 30.463l.7-1.212l2.425 1.4l-.7 1.213z"></path>
          <path d="M15.761 47.612l2.424-1.402l.7 1.212l-2.423 1.402z"></path>
          <path d="M22.252 54.576l1.4-2.425l1.212.7l-1.4 2.425z"></path>
          <path d="M39.158 52.726l1.212-.7l1.4 2.425l-1.211.7z"></path>
          <path d="M45.1 47.43l.7-1.213l2.425 1.401l-.7 1.213z"></path>
          <path d="M45.026 30.628l2.424-1.4l.7 1.212l-2.424 1.4z"></path>
          <path d="M39.136 25.15l1.401-2.424l1.212.7l-1.4 2.425z"></path>
          <circle cx="32" cy="39" r="2.8"></circle>
          <path
            d={`M43.5 50.4L33.3 38.3l-2 2z`}
            transform={`rotate(${rotation} 32 39)`}
            style={{ transition: 'transform 0.05s linear' }}
          ></path>
        </g>
      </svg>
  );
});
export default CountdownTimer;