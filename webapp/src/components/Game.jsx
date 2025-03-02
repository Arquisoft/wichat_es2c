import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AwesomeButton } from 'react-awesome-button';
import 'react-awesome-button/dist/styles.css';
import styles from './Game.module.css';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { HomeButton, ChartButton, ReplayButton, ButtonContainer } from './ModelButtons';

import PopChat from './ChatBot/Popchat';


function Game() {
  const navigate = useNavigate();
  
  const questions = [
    {
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      correctAnswer: 2
    }
  ];

  //Mensajes del chatbot
  const [msgs, setMsgs] = useState(["Guayaba"]); //de esta manera uso el estado y se muestran los cambios de mensajes en el chat
  const getMessage = (msg) => {
    //msgs.push(msg);
    setMsgs((prevMsgs) => [...prevMsgs, msg]);
  };

  const [open, setOpen] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [buttonsActive, setButtonsActive] = useState(true);
  const [showChatBot, setShowChatBot] = useState(false);

  const handleButtonClick = (index) => {
    setTimeout(() => {
      setOpen(true);
    }, 0);
  };

  const handleChatBotToggle = () => {
    setShowChatBot(!showChatBot);
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
    <div className={styles.containerLayout}>
    {/* Sección de la imagen */}
    <div className={styles.imageContainer}>
      <img 
        src={`${process.env.PUBLIC_URL}/photo.jpg`} 
        alt="Game" 
      />
    </div>

    {/* Sección de contenido */}
    <div className={styles.contentContainer}>

      {/* Pregunta */}
      <div className={styles.questionContainer}>
        {questions[0].question}
      </div>

      {/* Opciones en Grid */}
      <div className={styles.optionsGrid}>
        {questions[0].options.map((option, index) => (
          <AwesomeButton
            key={index}
            type="secondary"
            active={buttonsActive}
            className={`${styles.awsBtn} ${
              questions[0].correctAnswer === index ? styles.buttonActive : styles.buttonInactive
            }`}
            onPress={() => handleButtonClick(index)}
          >
            {option}
          </AwesomeButton>
        ))}
      </div>

      {/* Seccion para mostrar el chatbot */}
      <div className={styles.chatContainer}>
        <PopChat messages={msgs} getMessage={getMessage}/>
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
    </div>
  );
}

export default Game;