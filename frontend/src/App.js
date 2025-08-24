import React, { useState, useEffect } from 'react';
import './App.css';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';

function App() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);

  const selectChat = (chat) => {
    setSelectedChat(chat);
    // TODO: Cargar mensajes del chat seleccionado
    console.log('Chat seleccionado:', chat);
  };

  return (
    <div className="app">
      <div className="chat-container">
        <ChatList 
          chats={chats} 
          selectedChat={selectedChat}
          onSelectChat={selectChat}
        />
        <ChatWindow 
          selectedChat={selectedChat}
          messages={messages}
        />
      </div>
    </div>
  );
}

export default App;
