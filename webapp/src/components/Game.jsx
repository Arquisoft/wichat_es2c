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
    const apiEndpointGame = process.env.GAME_SERVICE_API_ENDPOINT || 'http://localhost:8004';
    const apiEndpointWiki = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3005';
    const [difficulty, setDifficulty] = useState(1);
    const [showDifficultyModal, setShowDifficultyModal] = useState(true);
    const [difficultyModalFadeIn, setDifficultyModalFadeIn] = useState(true);
    const [questionData, setQuestionData] = useState(null); // Estado para la pregunta actual
    const [selectedAnswer, setSelectedAnswer] = useState(null); // Estado para la respuesta seleccionada
    const [isCorrect, setIsCorrect] = useState(false); // Estado para saber si la respuesta es correcta
    const [msgs, setMsgs] = useState(["Guayaba"]); // Mensajes del chatbot
    const [open, setOpen] = useState(false);
    const [buttonsActive, setButtonsActive] = useState(true);
    const [timeOut, setTimeOut] = useState(false); // Estado para controlar el tiempo
    const [showTimeOutModal, setShowTimeOutModal] = useState(false); // Modal para el tiempo agotado
    const [timerReset, setTimerReset] = useState(false); // Estado para reiniciar el contador
    const [showChatBot, setShowChatBot] = useState(false);
    const [fadeIn, setFadeIn] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60); // Tiempo inicial
    const [reset, setReset] = useState(false);
    const [totalTime, setTotalTime] = useState(0); // Nuevo estado para el tiempo total de la partida
    const [gameStartTime, setGameStartTime] = useState(null); // Nuevo estado para registrar cuando inicia la partida
    const [finished,setFinished] = useState(false);

    useEffect(() => {
        if (showDifficultyModal) {
            setTimeout(() => {
                setDifficultyModalFadeIn(true);
            }, 100);
        }
    }, []);

    useEffect(() => {
        if (questionData && questionData.image) {
            const img = new Image();
            img.src = questionData.image;
            img.onload = () => {
            };
        }
    }, [questionData?.image]);

    const handleDifficultySelect = (level) => {
        setDifficulty(level);
        setTimeLeft(level === 1 ? 60 : 45); // 60s en Normal, 45s en dificil
        setDifficultyModalFadeIn(false);
        setTimeout(() => {
            setShowDifficultyModal(false);
            addMatch(level);
            setGameStartTime(Date.now());
            setTotalTime(0);
        }, 300);
    };


    const addMatch = async (diffLevel) => {
        try {
            const response = await axios.post(`${apiEndpointGame}/addMatch`, {
                username: localStorage.getItem("username"),
                difficulty: diffLevel,
            });
            console.log(response)
        } catch (error) {
            console.error("Error al añadir el match:", error);
        }
    };



    const getMessage = (msg) => {
        //msgs.push(msg);
        setMsgs((prevMsgs) => [...prevMsgs, msg]);
    };



    const handleButtonClick = async (index) => {
        if (!questionData) return;

        // Deshabilitar los botones temporalmente
        setButtonsActive(false);

        const selectedOption = questionData.choices[index];
        setSelectedAnswer(selectedOption);

        const questionText = questionData.choices;
        
        try {
            const response = await axios.post(`${apiEndpointGame}/addQuestion`, {
                username: localStorage.getItem("username"),
                question: questionText,
                //correctAnswer: questionData.correctAnswer,
                correctAnswer: questionData.choices.indexOf(questionData.correctAnswer),
                answers: questionData.choices,
                selectedAnswer: selectedOption,
            });
            console.log(response);
        } catch (error) {
            console.error(error);
        }

        setTimeout(() => {
            setOpen(true);
        }, 0);

        // Verificar si la respuesta es correcta
        if (selectedOption === questionData.correctAnswer) {
            setIsCorrect(true);
            const bonusTime = difficulty === 1 ? 6 : 3;
            setTimeLeft(prevTime => prevTime + bonusTime);

            setTimerReset(true);

            // Esperar 1 segundo antes de cargar una nueva pregunta
            setTimeout(() => {
                fetchNewQuestion(); // Cargar una nueva pregunta
                setButtonsActive(true); // Reactivar los botones
                setTimerReset(false); // Desactivar el reinicio del contador
            }, 200); // Esperar 1 segundo
        } else {
            setIsCorrect(false); // Marcar como incorrecta
            const bonusTime = difficulty === 1 ? -5 : -10;
            setTimeLeft(prevTime => prevTime + bonusTime);
            setTimerReset(true);
            setTimeout(() => {
                fetchNewQuestion(); // Cargar una nueva pregunta
                setButtonsActive(true); // Reactivar los botones
                setTimerReset(false); // Desactivar el reinicio del contador
            }, 200); // Esperar 1 segundo

        }
    };

    const handleChatBotToggle = () => {
        setShowChatBot(!showChatBot);
    };
    const fetchNewQuestion = async () => {
        try {
            const response = await axios.get(`${apiEndpointWiki}/getQuestion`);
            if (!response.data) {
                console.error('No data received from getQuestion endpoint');
                return;
            }
            setQuestionData({
                question: response.data.question,
                image: response.data.image || null,
                choices: response.data.choices || [],
                correctAnswer: response.data.answer,
            });
            setSelectedAnswer(null);
            setIsCorrect(false);
            setTimerReset(true);
        } catch (error) {
            console.error("Error fetching question:", error.response ? error.response.data : error.message);
        }
    };

    useEffect(() => {
        if (open) {
            setTimeout(() => setFadeIn(true), 250);
        } else {
            setFadeIn(false);
        }
    }, [open]);

    // Cargar la primera pregunta cuando el componente se monta
    useEffect(() => {
        fetchNewQuestion();
    }, [apiEndpointWiki]);

    const handleHomeClick = () => navigate('/');
    const handleReplayClick = () => {
        setTimeOut(false);
        setShowTimeOutModal(false);
        setButtonsActive(false);
        setFinished(false);
        setTimerReset(true);
        setTimeout(() => {
            setTimerReset(false);
        }, 100);

        fetchNewQuestion();

        setTimeLeft(difficulty === 1 ? 60 : 45);

        setGameStartTime(Date.now());
        setTotalTime(0);
        setTimeout(() => {
            setButtonsActive(true);
        }, 50);
    };


    const handleTimeOut = async () => {
        if(!finished) {
            setFinished(true);
            let gameTime = 0;
            if (gameStartTime) {
                const gameEndTime = Date.now();
                gameTime = Math.floor((gameEndTime - gameStartTime) / 1000);
                setTotalTime(gameTime);
            }

            try {
                const response = await axios.post(`${apiEndpointGame}/endMatch`, {
                    username: localStorage.getItem("username"),
                    time: gameTime,
                });
                console.log(response);
            } catch (error) {
                console.error("Error al enviar la información de fin de partida:", error);
            }

            setTimeOut(true);
            setShowTimeOutModal(true); // Mostrar modal de tiempo agotado
        }
    };


    return (

        <div className={styles.containerLayout}>
            <Modal
                disableEnforceFocus={true}
                open={showDifficultyModal}
                onClose={null}
                disableEscapeKeyDown
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
                            style={{minWidth: '150px', fontSize: '1.2rem'}}
                        >
                            Normal
                        </AwesomeButton>
                        <AwesomeButton
                            type="secondary"
                            size="large"
                            onPress={() => handleDifficultySelect(2)}
                            style={{minWidth: '150px', fontSize: '1.2rem'}}
                        >
                            Hard
                        </AwesomeButton>
                    </div>
                </Box>
            </Modal>
            {/* Sección de la imagen */}
            {questionData && questionData.image && (
                <div className={styles.imageContainer}>
                    <img
                        src={questionData.image} // Usa la URL de la imagen desde la API
                        alt="Game"
                        onError={(e) => {
                            e.target.src = `${process.env.PUBLIC_URL}/imagen_por_defecto.jpg`; // Imagen por defecto si falla
                        }}
                    />
                </div>
            )}

            {/* Sección de contenido */}
            <div className={styles.contentContainer}>
                {/* Pregunta */}
                {questionData && (
                    <div className={styles.questionContainer}>
                        {questionData.question}
                        {!showDifficultyModal && (
                      <Timer
                        onTimeOut={handleTimeOut}
                        resetTimer={timerReset}
                        initialTime={timeLeft}
                      />
                      )}


                      {timeOut && (
                          <div className={styles.timeOutMessage}>
                              <h2>¡El tiempo se ha acabado!</h2>
                          </div>
                      )}
                          </div>
                      )}


                {/* Opciones en Grid */}
                {questionData && (
                    <div className={styles.optionsGrid}>
                        {questionData.choices.map((option, index) => (
                            <AwesomeButton
                                key={index}
                                type="secondary"
                                active={buttonsActive && !timeOut} // Desactivar botones si el tiempo se acaba o están deshabilitados
                                className={`${styles.awsBtn} 
                                    selectedAnswer === option
                                        ? isCorrect
                                            ? styles.buttonActive// Estilo para respuesta correcta
                                            : styles.buttonInactive // Estilo para respuesta incorrecta
                                        : ""
                                        
                                     */
                                }`}
                                onPress={() => handleButtonClick(index)}
                            >
                                {option}
                            </AwesomeButton>
                        ))}
                    </div>
                )}

                

                {/* Sección para mostrar el chatbot */}
                <div className={styles.chatContainer}>
                    <PopChat messages={msgs} getMessage={getMessage}/>
                </div>

                {/* Modal para el tiempo agotado */}
                <Modal
                    open={showTimeOutModal}
                    onClose={null}
                    disableEscapeKeyDown
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
            </div>
        </div>
    );
}

export default Game;