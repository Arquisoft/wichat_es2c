import React, { useState, useRef, useEffect } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';
import './Popchat.css';

export const PopChat = (props) => {
 
  const hide = { display: 'none' };
  const show = { display: 'block' };
  
  const textRef = useRef(null);
  const { messages = [], getMessage, questionData, onNewMessage, onBotResponse } = props;
  const scrollRef = useRef(null);
  
  const [chatopen, setChatopen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  //para que cuando salgan nuevos mensajes se desplace el scroll hacia abajo
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToBottom();
    }
  }, [messages]);

  
  
  const toggle = () => {
    setChatopen(!chatopen);
  };

  const handleSend = async () => {
    const userMessage = textRef.current.value.trim();
    
    if (!userMessage) return;
    
    try {
      // Actualizar el estado para mostrar el mensaje del usuario
      props.onNewMessage(userMessage);
      
      textRef.current.value = '';

      setIsLoading(true);
      
      const response = await getMessage(userMessage);
      
      props.onBotResponse(response);
    } catch (error) {
      console.error("Error al obtener respuesta del chatbot:", error);
      props.onBotResponse("I'm sorry, I can't help you at the moment.");
    } finally {
      setIsLoading(false);
    }
  };
  
  //para ue se le pueda dar por teclado con Enter
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
        <Scrollbars autoHide ref={scrollRef} className="msg-area" style={{ height: '350px' }}>
          <div className="msg-content">
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
        </Scrollbars>
        <div className="footer">
        <input 
          type="text" 
          ref={textRef} 
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          placeholder="Type your question..."
        />
          <button 
            onClick={handleSend} 
            disabled={isLoading}
          >
            {isLoading ? '...' : '-Send-'}
          </button>
        </div>
      </div>
      <div className="pop">
        <p>
        <img 
          onClick={toggle}
          onKeyDown={(e) => {
            //Enter o Espacio
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
          tabIndex="0"
          src={`${process.env.PUBLIC_URL}/iconoChatBot.png`} 
          alt="Chat Icon - Click to toggle chat"
          style={{ cursor: 'pointer' }}
          role="button"
          aria-label="Toggle chat window"
        />
        </p>
      </div>
    </div>
  );
};

export default PopChat;