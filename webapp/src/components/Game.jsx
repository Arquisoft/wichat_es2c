import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AwesomeButton } from 'react-awesome-button';
import 'react-awesome-button/dist/styles.css';
import styles from './Game.module.css';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { HomeButton, ChartButton, ReplayButton, ButtonContainer } from './ModelButtons';

function Game() {
  const navigate = useNavigate();
  
  const questions = [
    {
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      correctAnswer: 2
    }
  ];

  const [open, setOpen] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [buttonsActive, setButtonsActive] = useState(true);

  const handleButtonClick = (index) => {
    setTimeout(() => {
      setOpen(true);
    }, 0);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => setFadeIn(true), 250);
    } else {
      setFadeIn(false);
    }
  }, [open]);

  const handleHomeClick = () => navigate('/');
  const handleHistoryClick = () => navigate('/history');
  const handleReplayClick = () => {
    setOpen(false);
    setButtonsActive(false);
    setTimeout(() => setButtonsActive(true), 50);
  };

  return (
    <div>
      <img src={`${process.env.PUBLIC_URL}/photo.jpg`} alt="Game" style={{ width: '100%', marginTop: '20px' }} />
      <div style={{ marginTop: '20px' }}>
        {questions[0].options.map((option, index) => (
          <AwesomeButton
            key={index}
            type="secondary"
            active={buttonsActive} // Usa el estado en lugar de hardcodear true
            className={`${styles.awsBtn} ${questions[0].correctAnswer === index ? styles.buttonActive : styles.buttonInactive}`}
            onPress={() => handleButtonClick(index)}
          >
            {option}
          </AwesomeButton>
        ))}
      </div>
      <Modal
        disableEnforceFocus={true}
        open={open}
        onClose={null}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        closeAfterTransition
        slotProps={{
          backdrop: {
            timeout: 800
          },
        }}
      >
        <Box
          className={fadeIn ? styles.fadeIn : styles.fadeOut}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 600,
            minHeight: 400,
            bgcolor: 'background.paper',
            border: '2px solid #000',
            borderRadius: 4,
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1 id="modal-title" className={styles.winnerTitle}>tonto quien lo lea jiji</h1>
          <div className={styles.scoreContainer}>
            <h2 className={styles.scoreText}>Puntuación: NO 😡😡😡</h2>
          </div>

          <ButtonContainer>
            <HomeButton onClick={handleHomeClick} />
            <ChartButton onClick={handleHistoryClick} />
            <ReplayButton onClick={handleReplayClick} />
          </ButtonContainer>
        </Box>
      </Modal>
    </div>
  );
}

export default Game;