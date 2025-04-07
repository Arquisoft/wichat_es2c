import React, { useEffect, useState, useCallback } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import "./LoginRegister.css";
import AuthForm from "./AuthForm";
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

function AddUser() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));


    useEffect(() => {
        if (isLoggedIn) {
            window.location.href = '/home';
        }
    }, [isLoggedIn]);

    const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        if (password.length < 3) {
            setError('Password must be at least 3 characters long');
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${apiEndpoint}/adduser`, { username, password });
            setError('');
            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/login';
            }, 1500);
        } catch (err) {
            console.error('Registration error:', err);
            if (err.response) {
                setError(err.response.data?.error || 'Registration failed: Server error');
            } else if (err.request) {
                setError('Registration failed: No response from server. Please try again.');
            } else {
                setError(`Registration failed: ${err.message}`);
            }
            setSuccess(false);
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
            title="Register"
            onSubmit={handleSubmit}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            success={success}
            buttonText="Register"
            helperTexts={{
                username: "Username must be at least 3 characters long",
                password: "Password must be at least 3 characters long"
            }}
            successMessage="Successfully registered! Redirecting to login page..."
            linkText="Already have an account?"
            linkHref="/login"
            disabled={loading || success}
        />
    );
}

export default AddUser;
