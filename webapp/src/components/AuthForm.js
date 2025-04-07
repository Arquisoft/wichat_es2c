import React from 'react';
import { TextField, Button, Typography, Box, CircularProgress, Alert } from '@mui/material';

const AuthForm = ({
                      title,
                      onSubmit,
                      username,
                      setUsername,
                      password,
                      setPassword,
                      loading,
                      error,
                      success,
                      buttonText,
                      helperTexts,
                      successMessage,
                      linkText,
                      linkHref,
                      disabled = false,
                  }) => {
    return (
        <Box className="boxContainer" sx={{ maxWidth: 400, mx: 'auto', p: 2, position: 'relative', zIndex: 1 }}>
            <img
                src="/wiChatLogos/LogoWichat2_512.png"
                alt="Logo"
                className="logoAplicacion"
                onClick={() => window.location.href = '/home'}
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (window.location.href = '/home')}
            />
            <div className="mainContent">
                <Typography variant="h5" component="h1" gutterBottom>
                    {title}
                </Typography>

                {success && successMessage && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {successMessage}
                    </Alert>
                )}

                <div className="divider"></div>
                <form onSubmit={onSubmit}>
                    <TextField
                        name="username"
                        label="Username"
                        fullWidth
                        margin="normal"
                        disabled={disabled}
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        helperText={helperTexts?.username}
                    />
                    <TextField
                        name="password"
                        label="Password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={disabled}
                        required
                        helperText={helperTexts?.password}
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
                        disabled={disabled}
                    >
                        {loading ? <CircularProgress size={24} /> : buttonText}
                    </Button>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2">
                            {linkText}{' '}
                            <span
                                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                onClick={() => window.location.href = linkHref}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        window.location.href = linkHref;
                                    }
                                }}
                            >
                                {linkHref === '/login' ? 'Login' : 'Register here'}
                            </span>
                        </Typography>
                    </Box>
                </form>
            </div>
        </Box>
    );
};

export default AuthForm;