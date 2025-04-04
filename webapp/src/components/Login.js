import React, { useState, useEffect, useCallback } from 'react';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import "./LoginRegister.css";

function Login() {

    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    //Inicializar tsparticles
    const particlesInit = useCallback(async (engine) => {
        await loadSlim(engine);
    }, []);

    useEffect(() => {
        if (isLoggedIn) {
            window.location.href = '/home';
        }
    }, [isLoggedIn, navigate]);


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

    //Configuración de las partículas del fondo
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
        <>
            <Particles
                id="tsparticles"
                init={particlesInit}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    zIndex: -1
                }}
                options={particlesOptions}
            />

           
            <Box className="boxContainer" sx={{ maxWidth: 400, mx: 'auto', p: 2, position: 'relative', zIndex: 1  }}>
                
                <Link to="/home">
                    <img src="/wiChatLogos/LogoWichat2_512.png" alt="Logo" className="logoAplicacion" />
                </Link>
                
                <div className="mainContent">
                    <Typography variant="h5" component="h1" gutterBottom>
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
                            sx={{ mt: 3 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Login'}
                        </Button>
                        
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Typography variant="body2">
                                Don't have an account?{' '}
                                <Link to="/signup" style={{ textDecoration: 'none' }}>
                                    Register here
                                </Link>
                            </Typography>
                        </Box>
                    </form>
                </div>
            </Box>
        </>
    );
}

export default Login;