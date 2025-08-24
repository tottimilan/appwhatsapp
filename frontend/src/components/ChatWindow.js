import React, { useState } from 'react';
import './ChatWindow.css';

const ChatWindow = ({ selectedChat, messages }) => {
  const [inputMessage, setInputMessage] = useState('');

  // Mensajes de ejemplo para el diseño inicial
  const mockMessages = [
    { id: 1, text: 'Hola, ¿cómo estás?', timestamp: '10:30', isOutgoing: false },
    { id: 2, text: '¡Hola! Todo bien, gracias. ¿Y tú?', timestamp: '10:32', isOutgoing: true },
    { id: 3, text: 'Muy bien, gracias por preguntar', timestamp: '10:33', isOutgoing: false },
    { id: 4, text: '¿Necesitas algo en particular?', timestamp: '10:35', isOutgoing: true },
  ];

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      console.log('Enviando mensaje:', inputMessage);
      // TODO: Implementar envío real
      setInputMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!selectedChat) {
    return (
      <div className="chat-window-empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>Selecciona un chat</h3>
          <p>Elige una conversación para empezar a chatear</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar">
            <div className="avatar-placeholder">
              {selectedChat.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="chat-details">
            <h3>{selectedChat.name}</h3>
            <span className="chat-status">En línea</span>
          </div>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {mockMessages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isOutgoing ? 'outgoing' : 'incoming'}`}
            >
              <div className="message-bubble">
                <div className="message-text">{message.text}</div>
                <div className="message-time">{message.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="message-input-container">
        <div className="message-input-wrapper">
          <input
            type="text"
            className="message-input"
            placeholder="Escribe un mensaje..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
