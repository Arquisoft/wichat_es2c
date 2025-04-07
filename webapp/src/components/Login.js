import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import "./LoginRegister.css";
import AuthForm from "./AuthForm";

function Login() {

    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

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
