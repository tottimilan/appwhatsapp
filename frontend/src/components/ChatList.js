import React from 'react';
import './ChatList.css';

const ChatList = ({ chats, selectedChat, onSelectChat }) => {
  // Datos de ejemplo para el diseño inicial
  const mockChats = [
    { id: 1, name: 'Cliente 1', lastMessage: 'Hola, ¿cómo estás?', timestamp: '10:30', unread: 2 },
    { id: 2, name: 'Cliente 2', lastMessage: 'Gracias por la información', timestamp: '09:15', unread: 0 },
    { id: 3, name: 'Cliente 3', lastMessage: '¿Está disponible?', timestamp: 'Ayer', unread: 1 },
  ];

  const handleChatClick = (chat) => {
    onSelectChat(chat);
  };

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
      </div>
      <div className="chat-list-content">
        {mockChats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-item ${selectedChat?.id === chat.id ? 'selected' : ''}`}
            onClick={() => handleChatClick(chat)}
          >
            <div className="chat-avatar">
              <div className="avatar-placeholder">
                {chat.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="chat-info">
              <div className="chat-header">
                <span className="chat-name">{chat.name}</span>
                <span className="chat-time">{chat.timestamp}</span>
              </div>
              <div className="chat-preview">
                <span className="last-message">{chat.lastMessage}</span>
                {chat.unread > 0 && (
                  <span className="unread-badge">{chat.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
