import React, { useState, useEffect, useRef } from 'react';
import { AwesomeButton } from 'react-awesome-button';
import 'react-awesome-button/dist/styles.css';
import styles from './Game.module.css';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { HomeButton, ReplayButton, ChartButton, ButtonContainer } from './ModelButtons';
import Nav from './Nav';
import PopChat from './ChatBot/Popchat';
import CountdownTimer from './CountdownTimer';
import axios from "axios";
import { CircularProgress } from "@mui/material";

function Game() {
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

    const [difficulty, setDifficulty] = useState(1);
    const [showDifficultyModal, setShowDifficultyModal] = useState(true);
    const [difficultyModalFadeIn, setDifficultyModalFadeIn] = useState(true);
    const [questionData, setQuestionData] = useState(null); // Estado para la pregunta actual
    const [selectedAnswer, setSelectedAnswer] = useState(null); // Estado para la respuesta seleccionada
    const [isCorrect, setIsCorrect] = useState(false); // Estado para saber si la respuesta es correcta
    const [msgs, setMsgs] = useState(["Ask me anything"]); // Mensajes del chatbot
    const [open, setOpen] = useState(false);
    const [buttonsActive, setButtonsActive] = useState(true);
    const [timeOut, setTimeOut] = useState(false); // Estado para controlar el tiempo
    const [showTimeOutModal, setShowTimeOutModal] = useState(false); // Modal para el tiempo agotado
    const [fadeIn, setFadeIn] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60); // Tiempo inicial
    const [gameStartTime, setGameStartTime] = useState(null); // Nuevo estado para registrar cuando inicia la partida
    const [finished, setFinished] = useState(false);
    const [questionQueue, setQuestionQueue] = useState([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const categoryOptions = [
        { key: "birds", label: "Birds", image: "/birds.png" },
        { key: "cartoons", label: "Cartoons", image: "/cartoon.png" },
        { key: "capitals", label: "Capitals", image: "/capitals.png" },
        { key: "sports", label: "Sports", image: "/sports.png" },
    ];
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const timerComponent = useRef(null); // Referencia al componente del temporizador
    const [gameQuestions, setGameQuestions] = useState([]);
    const [score,setScore] = useState(0);
    const isCooldown = useRef(false);

    useEffect(() => {
        if (showDifficultyModal) {
            setTimeout(() => {
                setDifficultyModalFadeIn(true);
            }, 100);
        }
    }, []);

    const preloadQuestions = async (category, count = 5) => {
        setIsLoadingQuestions(true);
        try {
            const questions = await Promise.all(
                Array(count).fill().map(() =>
                    axios.get(`${apiEndpoint}/getQuestion?category=${category}`)
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
        } finally {
            setIsLoadingQuestions(false); // Desactivar loading
        }
    };

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
        setDifficultyModalFadeIn(false);
        setTimeout(() => {
            setShowDifficultyModal(false);
            setGameQuestions([]);
            setGameStartTime(Date.now());
            fetchNewQuestion(category);
        }, 300);
    };

    const getMessage = async (userMsg) => {
        try {
            // Verificar que tenemos datos de la pregunta actual
            if (!questionData) {
                return "No hay una pregunta activa en este momento.";
            }

            const response = await axios.post(`${apiEndpoint}/askllm`, {
                userQuestion: userMsg,
                gameQuestion: questionData.question,
                answers: questionData.choices,
                correctAnswer: questionData.correctAnswer
            });

            return response.data.answer;
        } catch (error) {
            console.error("Error al obtener respuesta del LLM:", error);
            return "Sorry, I can't give you a hint right now.";
        }
    };

    const handleNewMessage = (message) => {
        setMsgs(prevMsgs => [...prevMsgs, message]);
    };

    const handleBotResponse = (response) => {
        setMsgs(prevMsgs => [...prevMsgs, response]);
    };

    //Al responder pregunta o acabarse el juego, se limpia el chat para que no se acumule info entre preguntas diferentes
    const clearChat = () => {
        setMsgs(["Ask me anything"]);
    };

    const handleButtonClick = async (index, category) => {
        if (isCooldown.current) return;
        if (!questionData) return;

        isCooldown.current = true;

        //Limpio el chatbot
        clearChat();

        setButtonsActive(false);

        const selectedOption = questionData.choices[index];
        setSelectedAnswer(selectedOption);
        const isAnswerCorrect = selectedOption === questionData.correctAnswer;

        // Store question data locally instead of sending to API immediately
        const newQuestion = {
            text: questionData.question,
            answers: questionData.choices.map((option, i) => ({
                text: option,
                selected: i === index,
                correct: option === questionData.correctAnswer,
            }))
        };

        setGameQuestions(prevQuestions => [...prevQuestions, newQuestion]);

        if (isAnswerCorrect) {
            setIsCorrect(true);
            const bonusTime = difficulty === 1 ? 6 : 3;
            timerComponent.current.addTime(bonusTime);
        } else {
            setIsCorrect(false);
            const bonusTime = difficulty === 1 ? 8 : 12;
            timerComponent.current.restTime(bonusTime);
        }
        setTimeout(() => {
            isCooldown.current = false; // Liberar cooldown después de 300ms
        }, 300);

        await fetchNewQuestion(category);
        setButtonsActive(true);
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
        if (initialLoad) {
            setIsLoadingQuestions(true); // Solo mostrar loading en carga inicial
        }

        try {
            const response = await axios.get(`${apiEndpoint}/getQuestion?category=${category}`);

            setQuestionData({
                question: response.data.question,
                image: response.data.image || null,
                choices: response.data.choices || [],
                correctAnswer: response.data.answer,
            });

        } catch (error) {
            console.error("Error fetching question:", error);
        } finally {
            if (initialLoad) {
                setInitialLoad(false);
                setIsLoadingQuestions(false);
            }
        }
    };

    useEffect(() => {
        if (open) {
            setTimeout(() => setFadeIn(true), 250);
        } else {
            setFadeIn(false);
        }
    }, [open]);

    const handleHomeClick = () => {
        window.location.href = '/home';
    };

    const handleChartClick = () => {
        window.location.href = '/history';
    };

    const handleReplayClick = () => {
        setGameQuestions([]);
        setTimeOut(false);
        setShowTimeOutModal(false);
        setButtonsActive(true);
        setFinished(false);
        fetchNewQuestion(selectedCategory);
        setGameStartTime(Date.now());
        timerComponent.current.reset();
    };

    const saveGame = async (gameTime,gameEndTime) => {
        try {
            const totalQuestions = gameQuestions.length;
            const correctAnswers = gameQuestions.filter(q =>
                q.answers.find(a => a.correct && a.selected)
            ).length;
            const incorrectAnswers = gameQuestions.filter(q =>
                q.answers.find(a => !a.correct && a.selected)
            ).length;
            let finalScore = (difficulty * (correctAnswers * 25)) - (incorrectAnswers * 5); //calculated in the database again to make sure users cant edit it
            if(finalScore < 0) finalScore = 0;
            setScore(finalScore);
            for (let i = 0; i < totalQuestions; i++) {
                const question = gameQuestions[i];
                await axios.post(`${apiEndpoint}/addMatch`, {
                    username: localStorage.getItem("username"),
                    difficulty: difficulty,
                    question: question.text,
                    correctAnswer: question.answers.findIndex(a => a.correct),
                    answers: question.answers.map(a => a.text),
                    selectedAnswer: question.answers.find(a => a.selected).text,
                    time: gameTime,
                    endTime: gameEndTime,
                    isLastQuestion: i === totalQuestions - 1
                });
            }
        } catch (error) {
            console.error("Error saving game:", error);
        }
    };

    const handleTimeOut = () => {
        if (!finished) {
            setFinished(true);
            let gameTime;
            let gameEndTime
            if (gameStartTime) {
                gameEndTime = Date.now();
                gameTime = Math.floor((gameEndTime - gameStartTime) / 1000);
            }
            if (gameQuestions.length > 0) {
                saveGame(gameTime,gameEndTime);
            }
            setTimeOut(true);
            setShowTimeOutModal(true);
        }
    };

    return (
        <>
            <Nav />
            <div className={styles.containerLayout}>

                {isLoadingQuestions && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.loadingContent}>
                            <CircularProgress color="primary" size={60} />
                            <p className={styles.loadingText}>Loading Questions</p>
                        </div>
                    </div>
                )}
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            setSelectedCategory(key);
                                        }
                                    }}
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
                            <p>{questionData.question}</p>
                            <CountdownTimer
                                ref={timerComponent}
                                maxTime={difficulty === 1 ? 60 : 45}
                                onTimeOut={handleTimeOut}
                            ></CountdownTimer>
                        </div>
                    )}


                    {/* Opciones en Grid */}
                    {questionData && (
                        <div className={styles.optionsGrid}>
                            {questionData.choices.map((option, index) => (
                                <AwesomeButton
                                    key={index}
                                    type="secondary"
                                    //active={buttonsActive && !timeOut} // Desactivar botones si el tiempo se acaba o están deshabilitados
                                    className={`${styles.awsBtn} ${
                                        option === questionData.correctAnswer
                                            ? styles.buttonActive// Estilo para respuesta correcta
                                            : styles.buttonInactive // Estilo para respuesta incorrecta

                                    }`}
                                    onPress={() => handleButtonClick(index, selectedCategory)}
                                    onMouseDown={() => handleButtonClick(index, selectedCategory)}
                                >
                                    {option}
                                </AwesomeButton>
                            ))}
                        </div>
                    )}

                    {/* Sección para mostrar el chatbot */}
                    <div className={styles.chatContainer}>
                        <PopChat
                            messages={msgs}
                            getMessage={getMessage}
                            questionData={questionData}
                            onNewMessage={handleNewMessage}
                            onBotResponse={handleBotResponse}
                        />
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
                            <h2>⏳ ¡Time is out!</h2>
                            <h2>Your score: {score}</h2>
                            <h2>Do you want to try again?</h2>
                            <ButtonContainer>
                                <HomeButton onClick={handleHomeClick}></HomeButton>
                                <ChartButton onClick={handleChartClick}></ChartButton>
                                <ReplayButton onClick={handleReplayClick}></ReplayButton>
                            </ButtonContainer>
                        </Box>
                    </Modal>
                </div>
            </div>
        </>
    );
}

export default Game;