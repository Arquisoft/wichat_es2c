import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import "./LoginRegister.css";
import ParticlesBackground from './ParticlesBackground'; // ✅ Importa el nuevo componente

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
        <>
            <ParticlesBackground />

            <Box className="boxContainer" sx={{ maxWidth: 400, mx: 'auto', p: 2, position: 'relative', zIndex: 1 }}>
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
                        Login
                    </Typography>

                    <div className="divider"></div>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            name="username"
                            label="Username"
                            fullWidth
                            margin="normal"
                            disabled={loading}
                            required
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <TextField
                            name="password"
                            label="Password"
                            type="password"
                            fullWidth
                            margin="normal"
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
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
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>

                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2">
                                Don't have an account?{' '}
                                <a href="/signup" style={{ textDecoration: 'none' }}>
                                    Register here
                                </a>
                            </Typography>
                        </Box>
                    </form>
                </div>
            </Box>
        </>
    );
}

export default Login;