import React from 'react';
import './ChatList.css';

const ChatList = ({ chats, selectedChat, onSelectChat, loading }) => {
  const handleChatClick = (chat) => {
    onSelectChat(chat);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>Chats</h2>
        </div>
        <div className="chat-list-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Cargando chats...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>Chats</h2>
      </div>
      <div className="chat-list-content">
        {chats.length === 0 ? (
          <div className="empty-state">
            <p>No hay chats disponibles</p>
          </div>
        ) : (
          chats.map((chat) => (
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
                  <span className="chat-time">{formatTimestamp(chat.timestamp)}</span>
                </div>
                <div className="chat-preview">
                  <span className="last-message">{chat.lastMessage}</span>
                  {chat.unread > 0 && (
                    <span className="unread-badge">{chat.unread}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
