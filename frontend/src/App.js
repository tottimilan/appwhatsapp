import React, { useState, useEffect } from 'react';
import './App.css';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import { loadChats, loadMessages, saveOutgoingMessage } from './config/supabase';
import axios from 'axios';
import io from 'socket.io-client';

function App() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Cargar chats al iniciar la aplicación
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const chatsData = await loadChats();
        setChats(chatsData);
      } catch (error) {
        console.error('Error cargando chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Conectar Socket.io para actualizaciones en tiempo real
  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('Conectado a Socket.io');
    });

    newSocket.on('new_message', async (message) => {
      console.log('Nuevo mensaje recibido:', message);
      // Recargar chats
      const updatedChats = await loadChats();
      setChats(updatedChats);
      
      // Si el mensaje es del chat actual, recargar mensajes
      if (selectedChat && message.from_number === selectedChat.id) {
        const updatedMessages = await loadMessages(selectedChat.id);
        setMessages(updatedMessages);
      }
    });

    newSocket.on('update_status', ({ message_id, status }) => {
      console.log('Estado actualizado:', message_id, status);
      // Actualizar el estado del mensaje en la UI
      setMessages(prev => prev.map(msg => 
        msg.id === message_id ? { ...msg, status } : msg
      ));
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [selectedChat]);

  const selectChat = async (chat) => {
    try {
      setSelectedChat(chat);
      setLoading(true);
      
      // Cargar mensajes del chat seleccionado
      const messagesData = await loadMessages(chat.id);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!selectedChat || !messageText.trim()) return;

    try {
      // 1. Enviar al backend
      const response = await axios.post('http://localhost:3000/send', {
        to: selectedChat.id,
        message: messageText
      });

      if (response.data.success) {
        // 2. Guardar en Supabase
        const messageId = response.data.response.messages[0].id;
        const savedMessage = await saveOutgoingMessage(
          selectedChat.id,
          messageText,
          messageId
        );

        // 3. Actualizar UI inmediatamente
        if (savedMessage) {
          const newMessage = {
            id: savedMessage.id,
            text: savedMessage.body,
            timestamp: new Date(savedMessage.timestamp).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isOutgoing: true,
            status: 'sent'
          };

          setMessages(prev => [...prev, newMessage]);
        }

        // 4. Actualizar la lista de chats
        const updatedChats = await loadChats();
        setChats(updatedChats);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <ChatList 
          chats={chats} 
          selectedChat={selectedChat}
          onSelectChat={selectChat}
          loading={loading}
        />
        <ChatWindow 
          selectedChat={selectedChat}
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default App;