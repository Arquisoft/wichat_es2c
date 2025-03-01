import React, { useState } from 'react';

function ChatBot() {

    const [messages, setMessages] = useState([]);

    const [userInput, setUserInput] = useState("");

    //funcion de enviar un mensaje/input
    const handleUserSubmit = (e) => {
        e.preventDefault(); // Prevenir el comportamiento predeterminado del formulario
        const newMessages = [...messages, { user: "User", text: userInput }]; // Añade el nuevo input
        setMessages(newMessages); // Actualiza la lista de mensajes
        setUserInput(""); // Limpia el input del usuario
    }

    //funcion cambio mensaje
    const handleUserInput = (e) => {
        setUserInput(e.target.value);
    };


    return (
        <div className='chatbot'>
            <h1>ChatBot</h1>
            <div className={"chat"}>
                {messages.map((message, index) => (
                    <div key={index}>
                        <div>{message.user}</div>
                        <div>{message.text}</div>
                    </div>
                ))}
            </div>

            
            <form className='chat-form' onSubmit={handleUserSubmit}>
                <input type="text" value={userInput} placeholder='Text your message...' onChange={handleUserInput} />
                <button type='submit'>Send</button>   
            </form>
        </div>
    );

}
export default ChatBot;