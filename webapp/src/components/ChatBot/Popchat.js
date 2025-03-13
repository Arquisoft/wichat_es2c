import React, { useState } from 'react';
import './Popchat.css';

export const PopChat = (props) => {
  let hide = {
    display: 'none',
  };
  let show = {
    display: 'block',
  };
  let textRef = React.createRef();
  const { messages = [] } = props; // Asegúrate de que messages tenga un valor por defecto

  const [chatopen, setChatopen] = useState(false);
  
  const toggle = (e) => {
    setChatopen(!chatopen);
  };

  const handleSend = (e) => {
    const get = props.getMessage;
    get(textRef.current.value);
  };

  return (
    <div id="chatCon">
      <div className="chat-box" style={chatopen ? show : hide}>
        <div className="header">Hint Chatbot</div>
        <div className="msg-area">
          {messages.map((msg, i) => (
            i % 2 ? (
              <p key={i} className="right"><span>{msg}</span></p>
            ) : (
              <p key={i} className="left"><span>{msg}</span></p>
            )
          ))}
        </div>
        <div className="footer">
          <input type="text" ref={textRef} />
          <button onClick={handleSend}>{'>'}</button>
        </div>
      </div>
      <div className="pop">
        <p><img onClick={toggle} src={`${process.env.PUBLIC_URL}/iconoChatBot.png`}  alt="" /></p>
      </div>
    </div>
  );
};

export default PopChat;