import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";

function AddUser() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/home');
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
            const response = await axios.post('http://localhost:8000/login', { username, password });
            console.log('Login response:', response.data);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);
            setIsLoggedIn(true);
        } catch (err) {
            console.error('Login error:', err);
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
        <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
            <Typography variant="h5" component="h1" gutterBottom>
                Login
            </Typography>
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
        </Box>
    );
}

export default AddUser;
