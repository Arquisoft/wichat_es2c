import React, { useState } from 'react';
import { AwesomeButton } from 'react-awesome-button';
import 'react-awesome-button/dist/styles.css';
import styles from './Game.module.css';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';

function Game() {
  const questions = [
    {
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      correctAnswer: 2
    }
  ];

  const [open, setOpen] = useState(false);

  const handleButtonClick = (index) => {
    setTimeout(() => {
      setOpen(true);
    }, 2000);
  };

  const handleClose = () => setOpen(false);

  return (
    <div>
      <img src={`${process.env.PUBLIC_URL}/photo.jpg`} alt="Game" style={{ width: '100%', marginTop: '20px' }} />
      <div style={{ marginTop: '20px' }}>
        {questions[0].options.map((option, index) => (
          <AwesomeButton
            key={index}
            type="secondary"
            active={true}
            className={`${styles.awsBtn} ${questions[0].correctAnswer === index ? styles.buttonActive : styles.buttonInactive}`}
            onPress={() => handleButtonClick(index)}
          >
            {option}
          </AwesomeButton>
        ))}
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        closeAfterTransition
        slots={{ backdrop: Fade }}
        slotProps={{
          backdrop: {
            timeout: 500,
            onClick: (e) => e.stopPropagation()
          }
        }}
      >
        <Fade in={open}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4 }}>
            <h2 id="modal-title">Modal Title</h2>
            <p id="modal-description">This is the content of the modal.</p>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}

export default Game;