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
    const [questionQueue, setQuestionQueue] = useState([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const categoryOptions = [
        { key: "birds", label: "Birds", image: "/birds.png" },
        { key: "cartoons", label: "Cartoons", image: "/cartoon.png" },
        { key: "capitals", label: "Capitals", image: "/capitals.png" },
        { key: "sports", label: "Sports", image: "/sports.png" },
    ];


    useEffect(() => {
        if (showDifficultyModal) {
            setTimeout(() => {
                setDifficultyModalFadeIn(true);
            }, 100);
        }
    }, []);

    const preloadQuestions = async (category,count = 5) => {
        try {
            const questions = await Promise.all(
                Array(count).fill().map(() =>
                    axios.get(`${apiEndpointWiki}/getQuestion?category=${category}`)
                )
            );

            const processedQuestions = questions.map(response => ({
                question: response.data.question,
                image: response.data.image || null,
                choices: response.data.choices || [],
                correctAnswer: response.data.answer,
            }));

            setQuestionQueue(processedQuestions);
        } catch (error) {
            console.error("Error preloading questions:", error);
        }
    };

   // useEffect(() => {
     //   preloadQuestions();
    //}, []);

    useEffect(() => {
        if (questionData && questionData.image) {
            const img = new Image();
            img.src = questionData.image;
            img.onload = () => {
            };
        }
    }, [questionData?.image]);

    const handleDifficultySelect = (level, category) => {
        setDifficulty(level);
        setTimeLeft(level === 1 ? 60 : 45); // 60s en Normal, 45s en dificil
        setDifficultyModalFadeIn(false);
        setTimeout(() => {
            setShowDifficultyModal(false);
            addMatch(level);
            setGameStartTime(Date.now());
            setTotalTime(0);
            fetchNewQuestion(category); // 👈 también aquí
        }, 300);
    };


    const addMatch = async (diffLevel) => {
        try {
            const response = await axios.post(`${apiEndpointGame}/addMatch`, {
                username: localStorage.getItem("username"),
                difficulty: diffLevel,
            });
            //console.log(response)
        } catch (error) {
            console.error("Error al añadir el match:", error);
        }
    };



    const getMessage = (msg) => {
        //msgs.push(msg);
        setMsgs((prevMsgs) => [...prevMsgs, msg]);
    };



    const handleButtonClick = async (index, category) => {
        if (!questionData) return;

        setButtonsActive(false);

        const selectedOption = questionData.choices[index];
        setSelectedAnswer(selectedOption);


        const isAnswerCorrect = selectedOption === questionData.correctAnswer;


        const apiRequest = axios.post(`${apiEndpointGame}/addQuestion`, {
            username: localStorage.getItem("username"),
            question: questionData.choices,
            correctAnswer: questionData.choices.indexOf(questionData.correctAnswer),
            answers: questionData.choices,
            selectedAnswer: selectedOption,
        }).catch(error => {
            console.error("Error submitting answer:", error);
        });


        if (isAnswerCorrect) {
            setIsCorrect(true);
            const bonusTime = difficulty === 1 ? 6 : 3;
            setTimeLeft(prevTime => Math.min(prevTime + bonusTime, difficulty === 1 ? 60 : 45));
        } else {
            setIsCorrect(false);
            const bonusTime = difficulty === 1 ? -5 : -10;
            setTimeLeft(prevTime => Math.max(prevTime + bonusTime, 0));
        }

        await fetchNewQuestion(category);
        setButtonsActive(true);
        setTimerReset(prev => !prev);
    };

    const handleChatBotToggle = () => {
        setShowChatBot(!showChatBot);
    };

    const fetchNewQuestion = (category) => {
        if (questionQueue.length > 0) {
            const [nextQuestion, ...remainingQuestions] = questionQueue;
            setQuestionData(nextQuestion);
            setQuestionQueue(remainingQuestions);

            if (remainingQuestions.length < 2) {
                preloadQuestions(category);
            }
        } else {
            fetchNewQuestionOG(category);
        }
    };
    const fetchNewQuestionOG = async (category) => {
        try {
            const response = await axios.get(`${apiEndpointWiki}/getQuestion?category=${category}`)

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


    //useEffect(() => {
      //  fetchNewQuestion();
    ///}, [apiEndpointWiki]);

    const handleHomeClick = () => navigate('/');
    const handleReplayClick = () => {
        setTimeOut(false);
        setShowTimeOutModal(false);
        setButtonsActive(true);
        setFinished(false);
        addMatch(difficulty);
        const newInitialTime = difficulty === 1 ? 60 : 45;
        setTimeLeft(newInitialTime);
        fetchNewQuestion(selectedCategory);
        setGameStartTime(Date.now());
        setTotalTime(0);
        setTimerReset(prev => !prev);
    };



    const handleTimeOut = () => {
        if(!finished) {
            setFinished(true);
            let gameTime = 0;
            if (gameStartTime) {
                const gameEndTime = Date.now();
                gameTime = Math.floor((gameEndTime - gameStartTime) / 1000);
                setTotalTime(gameTime);
            }
            setTimeOut(true);
            setShowTimeOutModal(true);
            axios.post(`${apiEndpointGame}/endMatch`, {
                username: localStorage.getItem("username"),
                time: gameTime,
            })
                .then(response => {
                    //console.log("Game ended successfully:", response.data);
                })
                .catch(error => {
                    console.error("Error ending the game:", error);
                });
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
                    <h1 className={styles.winnerTitle}>Select difficulty level</h1>

                    {/* Dificultad */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '20px',
                        margin: '20px 0'
                    }}>
                        <AwesomeButton
                            type={selectedDifficulty === 1 ? "primary" : "secondary"}
                            size="large"
                            onPress={() => setSelectedDifficulty(1)}
                            style={{
                                minWidth: '150px',
                                fontSize: '1.2rem',
                                opacity: selectedDifficulty === 1 ? 1 : 0.6,
                            }}
                        >
                            Normal
                        </AwesomeButton>
                        <AwesomeButton
                            type={selectedDifficulty === 2 ? "primary" : "secondary"}
                            size="large"
                            onPress={() => setSelectedDifficulty(2)}
                            style={{
                                minWidth: '150px',
                                fontSize: '1.2rem',
                                opacity: selectedDifficulty === 2 ? 1 : 0.6,
                            }}
                        >
                            Hard
                        </AwesomeButton>
                    </div>
                    <h1 className={styles.winnerTitle} style={{ marginTop: '10px' }}>Select category</h1>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '20px',
                        margin: '20px 0'
                    }}>
                        {categoryOptions.map(({ key, label, image }) => (
                            <div
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: '50%',
                                    border: selectedCategory === key ? '4px solid #00bcd4' : '2px solid #ddd',
                                    background: selectedCategory === key
                                        ? 'linear-gradient(145deg, #e0f7fa, #ffffff)'
                                        : 'linear-gradient(145deg, #f0f0f0, #ffffff)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: selectedCategory === key
                                        ? '0 4px 15px rgba(0, 188, 212, 0.5)'
                                        : '0 2px 10px rgba(0, 0, 0, 0.1)',
                                    position: 'relative',
                                    transform: selectedCategory === key ? 'scale(1.05)' : 'scale(1)',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = selectedCategory === key ? 'scale(1.05)' : 'scale(1)'}
                            >
                                <img
                                    src={image}
                                    alt={label}
                                    style={{
                                        width: '60%',
                                        height: '60%',
                                        objectFit: 'contain',
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: -25,
                                    textAlign: 'center',
                                    width: '100%',
                                    fontSize: '0.9rem',
                                    color: selectedCategory === key ? '#007BFF' : '#333'
                                }}>
                                    {label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Botón aceptar */}
                    <AwesomeButton
                        type="primary"
                        size="medium"
                        disabled={selectedDifficulty === null || selectedCategory === null}
                        onPress={() => {
                            if (selectedDifficulty !== null && selectedCategory !== null) {
                                handleDifficultySelect(selectedDifficulty, selectedCategory);
                            }
                        }}
                        style={{ marginTop: '10px', fontSize: '1rem', minWidth: '120px' }}
                    >
                        Accept
                    </AwesomeButton>
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

            <div className={styles.contentContainer}>
                {questionData && (
                    <div className={styles.questionContainer}>
                        {questionData.question}
                        {!showDifficultyModal && (
                            <Timer
                                key={`timer-${timerReset}`}
                                onTimeOut={handleTimeOut}
                                resetTimer={timerReset}
                                initialTime={timeLeft}
                                difficulty={difficulty}
                            />
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
                                onPress={() => handleButtonClick(index, selectedCategory)}
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