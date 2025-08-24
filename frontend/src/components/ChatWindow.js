import React, { useState, useEffect, useRef } from 'react';
import './ChatWindow.css';
import ContactModal from './ContactModal';

const ChatWindow = ({ selectedChat, messages, onSendMessage, loading, onContactUpdate }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && onSendMessage) {
      onSendMessage(inputMessage);
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
            {selectedChat.profilePicture ? (
              <img 
                src={selectedChat.profilePicture} 
                alt={selectedChat.name}
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                {selectedChat.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="chat-details">
            <h3>{selectedChat.name}</h3>
            <span className="chat-status">En línea</span>
          </div>
        </div>
        <div className="chat-actions">
          <button 
            className="edit-contact-button" 
            onClick={() => setShowContactModal(true)}
            title="Editar nombre del contacto"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando mensajes...</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="empty-messages">
                <p>No hay mensajes en esta conversación</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.isOutgoing ? 'outgoing' : 'incoming'}`}
                >
                                <div className="message-bubble">
                {message.type === 'sticker' || message.mediaUrl ? (
                  <div className="message-media">
                    {message.type === 'sticker' && (
                      <img 
                        src={message.mediaUrl || message.stickerUrl} 
                        alt="Sticker" 
                        className="message-sticker"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150?text=Sticker';
                        }}
                      />
                    )}
                    {message.type === 'image' && (
                      <img 
                        src={message.mediaUrl} 
                        alt="Imagen" 
                        className="message-image"
                      />
                    )}
                    {message.caption && <div className="message-caption">{message.caption}</div>}
                  </div>
                ) : (
                  <div className="message-text">{message.text}</div>
                )}
                <div className="message-time">
                  {message.timestamp}
                  {message.isOutgoing && (
                    <span className="message-status">
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && '✓✓'}
                    </span>
                  )}
                </div>
              </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
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
            disabled={loading}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <ContactModal 
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        phoneNumber={selectedChat?.id}
        onSave={(phoneNumber, name) => {
          onContactUpdate && onContactUpdate(phoneNumber, name);
          setShowContactModal(false);
        }}
      />
    </div>
  );
};

export default ChatWindow;
