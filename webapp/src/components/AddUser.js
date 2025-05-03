import React, { useEffect, useState, useCallback } from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import "./LoginRegister.css";

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

        if (password.length < 4) {
            setError('Password must be at least 4 characters long');
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
        <>
        
            <Box className="boxContainer" sx={{maxWidth: 400, mx: 'auto', p: 2, position: 'relative', zIndex: 1}}>
                <img
                    src="/wiChatLogos/LogoWichat2_512.png"
                    alt="Logo"
                    className="logoAplicacion"
                    onClick={() => window.location.href = '/home'}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            window.location.href = '/home';
                        }
                    }}
                />

                <div className="mainContent">
                    <Typography
                        variant="h5"
                        component="h1"
                        gutterBottom
                        sx={{
                            fontFamily: '"Orbitron", sans-serif',
                            letterSpacing: '1.5px',
                            fontWeight: 500,
                            color: '#00bcd4'
                        }}
                    >
                        Register
                    </Typography>
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Successfully registered! Redirecting to login page...
                        </Alert>
                    )}
                    <div className="divider"></div>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            name="username"
                            label="Username"
                            fullWidth
                            margin="normal"
                            disabled={loading || success}
                            required
                            onChange={(e) => setUsername(e.target.value)}
                            helperText="Username must be at least 3 characters long"
                        />
                        <TextField
                            name="password"
                            label="Password"
                            type="password"
                            fullWidth
                            margin="normal"
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading || success}
                            required
                            helperText="Password must be at least 4 characters long"
                        />
                        {error && (
                            <Typography color="error" sx={{ mt: 2 }}>
                                {error}
                            </Typography>
                        )}
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{
                                mt: 3,
                                backgroundColor: '#00bcd4',
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: '#0056b3',
                                },
                            }}
                            disabled={loading || success}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Register'}
                        </Button>
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2">
                                Already have an account?{' '}
                                <span
                                    style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                    onClick={() => window.location.href = '/login'}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            window.location.href = '/login';
                                        }
                                    }}
                                >
                                    Login
                                </span>
                            </Typography>
                        </Box>
                    </form>
                </div>
            </Box>
        </>
    );
}

export default AddUser;
