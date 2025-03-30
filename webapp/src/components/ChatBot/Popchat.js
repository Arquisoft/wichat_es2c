import React, { useState, useRef, useEffect } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';
import './Popchat.css';

export const PopChat = (props) => {
  // Estilos
  const hide = { display: 'none' };
  const show = { display: 'block' };
  
  // Referencias y props
  const textRef = useRef(null);
  const { messages = [], getMessage, questionData, onNewMessage, onBotResponse } = props;
  const msgAreaRef = useRef(null);
  
  // Estados
  const [chatopen, setChatopen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Efecto para desplazarse al último mensaje
  useEffect(() => {
    if (msgAreaRef.current) {
      msgAreaRef.current.scrollTop = msgAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  const toggle = () => {
    setChatopen(!chatopen);
  };

  const handleSend = async () => {
    const userMessage = textRef.current.value.trim();
    
    // No enviar mensajes vacíos
    if (!userMessage) return;
    
    try {
      // Actualizar el estado para mostrar el mensaje del usuario
      props.onNewMessage(userMessage);
      
      // Limpiar el campo de entrada
      textRef.current.value = '';
      
      // Indicar que estamos esperando respuesta
      setIsLoading(true);
      
      // Obtener respuesta del LLM
      const response = await getMessage(userMessage);
      
      // Actualizar el estado con la respuesta del bot
      props.onBotResponse(response);
    } catch (error) {
      console.error("Error al obtener respuesta del chatbot:", error);
      // Agregar mensaje de error como respuesta del bot
      props.onBotResponse("Lo siento, no puedo ayudarte en este momento.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar la tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div id="chatCon">
      <div className="chat-box" style={chatopen ? show : hide}>
        <div className="header">Hint Chatbot</div>
        <div className="msg-area" ref={msgAreaRef}>
          {messages.map((msg, i) => (
            <p key={i} className={i % 2 ? "right" : "left"}>
              <span>{msg}</span>
            </p>
          ))}
          {isLoading && (
            <p className="left">
              <span className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </p>
          )}
        </div>
        <div className="footer">
        <input 
          type="text" 
          ref={textRef} 
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          placeholder="Escribe tu pregunta..."
        />
          <button 
            onClick={handleSend} 
            disabled={isLoading}
          >
            {isLoading ? '...' : '>'}
          </button>
        </div>
      </div>
      <div className="pop">
        <p>
          <img 
            onClick={toggle} 
            src={`${process.env.PUBLIC_URL}/iconoChatBot.png`} 
            alt="Chat Icon" 
          />
        </p>
      </div>
    </div>
  );
};

export default PopChat;