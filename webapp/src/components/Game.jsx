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
import axios from "axios"; // Importamos el componente Timer


function Game() {
  const navigate = useNavigate();
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8004';
  const questions = [
    {
      question: "What is the capital of France?",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
      correctAnswer: 2
    }
  ];

    useEffect(() => {
        const addMatch = async () => {
            //si no pones esto se llama dos veces ns por que
            const matchAdded = localStorage.getItem("matchAdded");
            if (matchAdded) return;
            try {
                const response = await axios.post(`${apiEndpoint}/addMatch`, {
                    username: localStorage.getItem("username"),
                });
                localStorage.setItem("matchAdded", "true");
                //console.log("Match añadido con éxito:", response.data);
            } catch (error) {
                console.error("Error al añadir el match:", error);
            }
        };

        addMatch();

        return () => {
            localStorage.removeItem("matchAdded");
        };
    }, [apiEndpoint]);


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
  const [timeOut, setTimeOut] = useState(false); // Contador
  const [showTimeOutModal, setShowTimeOutModal] = useState(false); // Nuevo estado para el dialogo modal que aparece cuando se acaba el tiempo

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
    setTimeOut(false);
    setShowTimeOutModal(false);
    setButtonsActive(false);
    setTimeout(() => {
      setButtonsActive(true);  // Habilitar los botones
    }, 50);
  };

  // Función que se llama cuando el tiempo se ha agotado
    const handleTimeOut = async () => {
        try {
            // Add 'await' here to wait for the response
            const response = await axios.post(`${apiEndpoint}/endMatch`, {
                username: localStorage.getItem("username"),
                time: 60, //no se donde se guarda el tiempo asi que pongo 60
            });
            //console.log("Match actualizado", response.data);
        } catch (error) {
            console.error("Error al enviar la pregunta:", error);
        }
        setTimeOut(true);
        setShowTimeOutModal(true);  // Muestra el modal de tiempo agotado
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
              active={buttonsActive && !timeOut} // Cuando el tiempo se acaba se desactivan los botones.
              className={`${styles.awsBtn} ${questions[0].correctAnswer === index ? styles.buttonActive : styles.buttonInactive
                }`}
              onPress={() => handleButtonClick(index)}
            >
              {option}
            </AwesomeButton>
          ))}
        </div>

        {/* Usamos el componente Timer */}
        <Timer onTimeOut={handleTimeOut} resetTimer={!timeOut} />

        {timeOut && (
          <div className={styles.timeOutMessage}>
            <h2>¡El tiempo se ha acabado!</h2>
          </div>
        )}

        {/* Seccion para mostrar el chatbot */}
        <div className={styles.chatContainer}>
          <PopChat messages={msgs} getMessage={getMessage} />
        </div>

        {/* Modal para el tiempo agotado */}
        <Modal
          open={showTimeOutModal}  // Este estado controlará la visibilidad del modal
          onClose={() => setShowTimeOutModal(false)}  // Permite que el modal se cierre cuando se haga clic fuera
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


const navigate = useNavigate();
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:3005';

const [questionData, setQuestionData] = useState(null); // Estado para la pregunta actual
const [selectedAnswer, setSelectedAnswer] = useState(null); // Estado para la respuesta seleccionada
const [isCorrect, setIsCorrect] = useState(false); // Estado para saber si la respuesta es correcta
const [msgs, setMsgs] = useState(["Guayaba"]); // Mensajes del chatbot

const [showFailModal, setShowFailModal] = useState(false); // Estado para el modal de fallo
const [buttonsActive, setButtonsActive] = useState(true);
const [timeOut, setTimeOut] = useState(false); // Estado para controlar el tiempo
const [showTimeOutModal, setShowTimeOutModal] = useState(false); // Modal para el tiempo agotado
const [timerReset, setTimerReset] = useState(false); // Estado para reiniciar el contador

// Cargar la primera pregunta cuando el componente se monta
useEffect(() => {
    fetchNewQuestion();
}, [apiEndpoint]);

// Función para obtener una nueva pregunta de la API
const fetchNewQuestion = async () => {
    try {
        const response = await axios.get(`${apiEndpoint}/question`);
        const data = response.data;

        setQuestionData({
            question: data.question,
            image: data.image, // Asegúrate de que la API devuelva esta propiedad
            choices: data.choices,
            correctAnswer: data.answer, // Respuesta correcta
        });

        // Reiniciar los estados de la respuesta seleccionada y si es correcta
        setSelectedAnswer(null);
        setIsCorrect(false);
        setTimerReset(true); // Activar el reinicio del contador
    } catch (error) {
        console.error("Error fetching question:", error);
    }
};

// Función para manejar el clic en las opciones
const handleButtonClick = async (index) => {
    if (!questionData) return;

    // Deshabilitar los botones temporalmente
    setButtonsActive(false);

    const selectedOption = questionData.choices[index];
    setSelectedAnswer(selectedOption); // Guardar la respuesta seleccionada

    // Verificar si la respuesta es correcta
    if (selectedOption === questionData.correctAnswer) {
        setIsCorrect(true); // Marcar como correcta
        setTimerReset(true); // Activar el reinicio del contador

        // Esperar 1 segundo antes de cargar una nueva pregunta
        setTimeout(() => {
            fetchNewQuestion(); // Cargar una nueva pregunta
            setButtonsActive(true); // Reactivar los botones
            setTimerReset(false); // Desactivar el reinicio del contador
        }, 200); // Esperar 1 segundo
    } else {
        setIsCorrect(false); // Marcar como incorrecta
        setTimeOut(true); // Detener el contador
        setShowFailModal(true); // Mostrar modal de fallo
        setButtonsActive(true); // Reactivar los botones
    }
};

// Función para manejar los mensajes del chatbot
const getMessage = (msg) => {
    setMsgs((prevMsgs) => [...prevMsgs, msg]);
};

const handleRestartGame = () => {
    setShowFailModal(false); // Ocultar el modal de fallo
    setTimeOut(false); // Reiniciar el estado de tiempo agotado
    setButtonsActive(true); // Reactivar los botones
    setTimerReset(true); // Reiniciar el contador
    fetchNewQuestion(); // Cargar una nueva pregunta
};

// Funciones de navegación
const handleHomeClick = () => navigate('/');
const handleHistoryClick = () => navigate('/history');
const handleReplayClick = () => {
    setTimeOut(false);
    setShowTimeOutModal(false);
    setButtonsActive(false);
    setTimeout(() => {
        setButtonsActive(true); // Habilitar los botones después de un corto tiempo
    }, 50);
    fetchNewQuestion(); // Cargar una nueva pregunta
};

// Función que se llama cuando el tiempo se ha agotado
const handleTimeOut = async () => {
    try {
        await axios.post(`${apiEndpoint}/endMatch`, {
            username: localStorage.getItem("username"),
            time: 60, // Tiempo hardcodeado
        });
    } catch (error) {
        console.error("Error al enviar la pregunta:", error);
    }
    setTimeOut(true);
    setShowTimeOutModal(true); // Mostrar modal de tiempo agotado
};

return (
    <div className={styles.containerLayout}>
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
                </div>
            )}

            {/* Modal para cuando el usuario falle */}
            <Modal
                open={showFailModal}
                onClose={() => setShowFailModal(false)}
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
                    <h2>❌ ¡Respuesta incorrecta!</h2>
                    <p>La respuesta correcta era: <strong>{questionData?.correctAnswer}</strong></p>
                    <ButtonContainer>
                        <ReplayButton onClick={handleRestartGame}>🔄 Reintentar</ReplayButton>
                        <HomeButton onClick={handleHomeClick}>🏠 Volver a Inicio</HomeButton>
                    </ButtonContainer>
                </Box>
            </Modal>

            {/* Opciones en Grid */}
            {questionData && (
                <div className={styles.optionsGrid}>
                    {questionData.choices.map((option, index) => (
                        <AwesomeButton
                            key={index}
                            type="secondary"
                            active={buttonsActive && !timeOut} // Desactivar botones si el tiempo se acaba o están deshabilitados
                            className={`${styles.awsBtn} ${
                                selectedAnswer === option
                                    ? isCorrect
                                        ? styles.buttonActive// Estilo para respuesta correcta
                                        : styles.buttonInactive // Estilo para respuesta incorrecta
                                    : ""
                            }`}
                            onPress={() => handleButtonClick(index)}
                        >
                            {option}
                        </AwesomeButton>
                    ))}
                </div>
            )}

            {/* Usamos el componente Timer */}
            <Timer onTimeOut={handleTimeOut} resetTimer={timerReset} />

            {timeOut && (
                <div className={styles.timeOutMessage}>
                    <h2>¡El tiempo se ha acabado!</h2>
                </div>
            )}

            {/* Sección para mostrar el chatbot */}
            <div className={styles.chatContainer}>
                <PopChat messages={msgs} getMessage={getMessage} />
            </div>

            {/* Modal para el tiempo agotado */}
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
        </div>
    </div>
);

}

export default Game;