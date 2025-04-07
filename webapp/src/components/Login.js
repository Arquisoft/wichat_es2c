import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import "./LoginRegister.css";
import AuthForm from "./AuthForm";

function Login() {

    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            window.location.href = '/home';
        }
    }, [isLoggedIn]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${apiEndpoint}/login`, { username, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);
            setIsLoggedIn(true);
        } catch (err) {
            if (err.response) {
                setError(err.response.data?.error || 'Login failed: Server error');
            } else if (err.request) {
                setError('Login failed: No response from server. Please try again.');
            } else {
                setError(`Login failed: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const particlesOptions = {
        background: {
            color: {
                value: "transparent"
            }
        },
        fpsLimit: 60,
        particles: {
            color: {
                value: "#8590AA"
            },
            links: {
                color: "#8590AA",
                distance: 150,
                enable: true,
                opacity: 0.7,
                width: 2.5
            },
            move: {
                enable: true,
                direction: "none",
                outModes: {
                    default: "bounce"
                },
                random: false,
                speed: 1,
                straight: false
            },
            number: {
                density: {
                    enable: true,
                    area: 800
                },
                value: 80
            },
            opacity: {
                value: 0.8
            },
            shape: {
                type: "circle"
            },
            size: {
                value: { min: 3, max: 6 }
            }
        },
        detectRetina: true
    };

    return (
        <AuthForm
            title="Login"
            onSubmit={handleSubmit}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            success={false}
            buttonText="Login"
            linkText="Don't have an account?"
            linkHref="/signup"
            disabled={loading}
        />
    );
}

export default Login;
