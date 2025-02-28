import React, { useState } from 'react';
import AddUser from './components/AddUser';
import Login from './components/Login';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

type Message = {
  text: string;
};

function App() {
  const [showLogin, setShowLogin] = useState(true);

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  const message: Message = { text: "Hoste es un mensaje desde TypeScript!" };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Typography component="div">
        {message.text}
      </Typography>
      <Link href="#" onClick={handleToggleView}>
        {showLogin ? 'Create an account' : 'Back to login'}
      </Link>
    </Container>
  );
}

export default App;
