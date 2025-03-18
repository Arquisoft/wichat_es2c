import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AwesomeButton } from 'react-awesome-button';
import 'react-awesome-button/dist/styles.css';
import styles from './Game.module.css';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { HomeButton, ChartButton, ReplayButton, ButtonContainer } from './ModelButtons';

import PopChat from './ChatBot/Popchat';
import Timer from './Timer';
import axios from "axios";

function Game() {
    const navigate = useNavigate();
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8004';
    const [difficulty, setDifficulty] = useState(1);
    const [showDifficultyModal, setShowDifficultyModal] = useState(true);
    const [difficultyModalFadeIn, setDifficultyModalFadeIn] = useState(true);


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
    const [showChatBot, setShowChatBot] = useState(false);
    const [timeOut, setTimeOut] = useState(false);
    const [showTimeOutModal, setShowTimeOutModal] = useState(false);
    const [msgs, setMsgs] = useState(["Guayaba"]);
    const [timeLeft, setTimeLeft] = useState(10);
    const [reset, setReset] = useState(false);


    useEffect(() => {
        if (showDifficultyModal) {
            setTimeout(() => {
                setDifficultyModalFadeIn(true);
            }, 100);
        }
    }, []);

    const getMessage = (msg) => {
        setMsgs((prevMsgs) => [...prevMsgs, msg]);
    };

    const changeTime = (newTime) => {
        setTimeLeft(newTime);
        setReset(true);
    };

    const handleDifficultySelect = (level) => {
        setDifficulty(level);
        changeTime(60);
        setDifficultyModalFadeIn(false);
        setTimeout(() => {
            setShowDifficultyModal(false);
            addMatch(level);
        }, 300);
    };

    const addMatch = async (diffLevel) => {
        try {
            const response = await axios.post(`${apiEndpoint}/addMatch`, {
                username: localStorage.getItem("username"),
                difficulty: diffLevel,
            });
        } catch (error) {
            console.error("Error al añadir el match:", error);
        }
    };

    useEffect(() => {
        if (open) {
            setTimeout(() => setFadeIn(true), 250);
        } else {
            setFadeIn(false);
        }
    }, [open]);

    const handleButtonClick = async (index) => {
        const selectedOption = questions[0].options[index];
        const questionText = questions[0].question;

        try {
            const response = await axios.post(`${apiEndpoint}/addQuestion`, {
                username: localStorage.getItem("username"),
                question: questionText,
                questions: [questions[0]],
                answers: questions[0].options,
                selectedAnswer: selectedOption,
            });
        } catch (error) {
            console.error(error);
        }

        setTimeout(() => {
            setOpen(true);
        }, 0);
    };

    const handleChatBotToggle = () => {
        setShowChatBot(!showChatBot);
    };

    const handleHomeClick = () => navigate('/');
    const handleHistoryClick = () => navigate('/history');
    const handleReplayClick = () => {
        setTimeOut(false);
        setShowTimeOutModal(false);
        setButtonsActive(false);
        setTimeout(() => {
            setButtonsActive(true);
        }, 50);
    };

    const handleTimeOut = async () => {
        try {
            const response = await axios.post(`${apiEndpoint}/endMatch`, {
                username: localStorage.getItem("username"),
                time: timeLeft,
            });
        } catch (error) {
            console.error("Error al enviar la pregunta:", error);
        }
        setTimeOut(true);
        setShowTimeOutModal(true);
    };

    return (
        <div className={styles.containerLayout}>
            {/* Difficulty selection modal */}
            <Modal
                disableEnforceFocus={true}
                open={showDifficultyModal}
                onClose={null}
                aria-labelledby="difficulty-modal-title"
                aria-describedby="difficulty-modal-description"
            >
                <Box
                    className={difficultyModalFadeIn ? styles.fadeIn : styles.fadeOut}
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        maxWidth: 600,
                        minHeight: 300,
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
                    <h1 className={styles.winnerTitle}>Select difficulty level</h1>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '20px',
                        margin: '30px 0'
                    }}>
                        <AwesomeButton
                            type="primary"
                            size="large"
                            onPress={() => handleDifficultySelect(1)}
                            style={{ minWidth: '150px', fontSize: '1.2rem' }}
                        >
                            Normal
                        </AwesomeButton>
                        <AwesomeButton
                            type="secondary"
                            size="large"
                            onPress={() => handleDifficultySelect(2)}
                            style={{ minWidth: '150px', fontSize: '1.2rem' }}
                        >
                            Hard
                        </AwesomeButton>
                    </div>
                </Box>
            </Modal>

            {/* Image section */}
            <div className={styles.imageContainer}>
                <img
                    src={`${process.env.PUBLIC_URL}/photo.jpg`}
                    alt="Game"
                />
            </div>

            {/* Content section */}
            <div className={styles.contentContainer}>
                {/* Question */}
                <div className={styles.questionContainer}>
                    {questions[0].question}
                </div>

                {/* Options in Grid */}
                <div className={styles.optionsGrid}>
                    {questions[0].options.map((option, index) => (
                        <AwesomeButton
                            key={index}
                            type="secondary"
                            active={buttonsActive && !timeOut}
                            className={`${styles.awsBtn} ${
                                questions[0].correctAnswer === index ? styles.buttonActive : styles.buttonInactive
                            }`}
                            onPress={() => handleButtonClick(index)}
                        >
                            {option}
                        </AwesomeButton>
                    ))}
                </div>

                {/* Timer component */}
                <Timer onTimeOut={handleTimeOut} resetTimer={!timeOut} />

                {timeOut && (
                    <div className={styles.timeOutMessage}>
                        <h2>¡El tiempo se ha acabado!</h2>
                    </div>
                )}

                {/* Chatbot section */}
                <div className={styles.chatContainer}>
                    <PopChat messages={msgs} getMessage={getMessage} />
                </div>

                {/* Timeout modal */}
                <Modal
                    open={showTimeOutModal}
                    onClose={() => setShowTimeOutModal(false)}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 400,
                            bgcolor: 'background.paper',
                            borderRadius: '10px',
                            boxShadow: 24,
                            p: 4,
                            textAlign: 'center',
                        }}
                    >
                        <h2>⏳ ¡El tiempo se ha acabado!</h2>
                        <p>¿Quieres intentarlo de nuevo?</p>
                        <ButtonContainer>
                            <ReplayButton onClick={handleReplayClick}>🔄 Reintentar</ReplayButton>
                            <HomeButton onClick={handleHomeClick}>🏠 Volver a Inicio</HomeButton>
                        </ButtonContainer>
                    </Box>
                </Modal>

                {/* Results modal */}
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
                        {timeOut ? (
                            <h1 className={styles.winnerTitle}>¡El tiempo se ha acabado! ⏳</h1>
                        ) : (
                            <h1 className={styles.winnerTitle}>tonto quien lo lea jiji</h1>
                        )}

                        <div className={styles.scoreContainer}>
                            {timeOut ? (
                                <h2 className={styles.scoreText}>Se acabó el tiempo 😡</h2>
                            ) : (
                                <h2 className={styles.scoreText}>Puntuación: NO 😡😡😡</h2>
                            )}
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