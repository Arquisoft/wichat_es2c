import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link as RouterLink } from 'react-router-dom';
import AddUser from './components/AddUser';
import Login from './components/Login';
import Game from './components/Game';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

function App() {
  const [showLogin, setShowLogin] = useState(true);

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  return (
    <Router>
      <Container component="main" maxWidth={false}>{/* maxWidth="xs"  sx={{ maxWidth: '100% !important' }} */}
        <CssBaseline />
        <Typography component="h1" variant="h5" align="center" sx={{ marginTop: 2 }}>
          Welcome to the 2025 edition of the Software Architecture course
        </Typography>
        <Routes>
          <Route path="/" element={showLogin ? <Login /> : <AddUser />} />
          <Route path="/game" element={<Game />} />
        </Routes>
        <Typography component="div" align="center" sx={{ marginTop: 2 }}>
          {showLogin ? (
            <Link name="gotoregister" component="button" variant="body2" onClick={handleToggleView}>
              Don't have an account? Register here.
            </Link>
          ) : (
            <Link component="button" variant="body2" onClick={handleToggleView}>
              Already have an account? Login here.
            </Link>
          )}
          <Link component={RouterLink} to="/game" variant="body2" sx={{ display: 'block', marginTop: 2 }}>
            Go to Game
          </Link>
        </Typography>
      </Container>
    </Router>
  );
}

export default App;