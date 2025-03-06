import React, {useEffect, useState} from 'react';
import { TextField, Button, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import {useNavigate} from "react-router-dom";
import { Link } from "react-router-dom";
const url = 'http://localhost:8000/adduser';

function AddUser() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
            const response = await axios.post(url, {username,password});
            setTimeout(() => {
                    navigate('/login');
                },1000)
        } catch (err) {
            console.error('Registration error:', err);
            if (err.response) {
                setError(err.response.data?.error || 'Registration failed: Server error');
            } else if (err.request) {
                setError('Registration failed: No response from server. Please try again.');
            } else {
                setError(`Registration failed: ${err.message}`);
            }
            setSuccess('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
            <Typography variant="h5" component="h1" gutterBottom>
                Register
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
                    helperText="Password must be at least 6 characters long"
                />
                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
                {success && (
                    <Typography color="primary" sx={{ mt: 2 }}>
                        {success}
                    </Typography>
                )}
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Register'}
                </Button>
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2">
                        Already have an account?{' '}
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            Login here
                        </Link>
                    </Typography>
                </Box>
            </form>
        </Box>
    );
}

export default AddUser;