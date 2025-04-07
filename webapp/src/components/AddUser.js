import React, { useEffect, useState, useCallback } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
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
