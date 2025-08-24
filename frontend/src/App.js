import React, { useState, useEffect } from 'react';
import './App.css';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import DebugPanel from './components/DebugPanel';
import { loadChats, loadMessages, saveOutgoingMessage } from './config/supabase';
import { normalizePhoneNumber } from './utils/phoneUtils';
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
      
      // Reproducir sonido de notificación (solo si no es un mensaje tuyo)
      if (normalizePhoneNumber(message.from_number) !== normalizePhoneNumber('776732452191426')) {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.7;
        audio.play().catch(e => {
          // Si falla el sonido local, usar uno de respaldo
          const fallbackAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUqzn1');
          fallbackAudio.volume = 0.7;
          fallbackAudio.play().catch(() => console.log('No se pudo reproducir sonido'));
        });
      }
      
      // Actualizar la lista de chats inmediatamente
      const normalizedFrom = normalizePhoneNumber(message.from_number);
      const normalizedTo = normalizePhoneNumber(message.to_number);
      const myNumberNormalized = normalizePhoneNumber('776732452191426');
      
      // Determinar el número del contacto
      let contactNumber;
      if (normalizedFrom === myNumberNormalized) {
        contactNumber = normalizedTo;
      } else {
        contactNumber = normalizedFrom;
      }
      
      // Actualizar el chat en la lista
      setChats(prevChats => {
        const existingChatIndex = prevChats.findIndex(chat => 
          normalizePhoneNumber(chat.id) === contactNumber
        );
        
        if (existingChatIndex !== -1) {
          // Actualizar chat existente
          const updatedChats = [...prevChats];
          const existingChat = updatedChats[existingChatIndex];
          
          // Actualizar el último mensaje y timestamp
          existingChat.lastMessage = message.body || '';
          existingChat.timestamp = message.timestamp;
          
          // Incrementar contador solo si es un mensaje recibido y no es el chat actual
          if (normalizedFrom !== myNumberNormalized && 
              (!selectedChat || normalizePhoneNumber(selectedChat.id) !== contactNumber)) {
            existingChat.unread = (existingChat.unread || 0) + 1;
          }
          
          // Mover el chat al principio de la lista
          updatedChats.splice(existingChatIndex, 1);
          updatedChats.unshift(existingChat);
          
          return updatedChats;
        } else {
          // Crear nuevo chat
          const newChat = {
            id: contactNumber,
            name: contactNumber,
            lastMessage: message.body || '',
            timestamp: message.timestamp,
            unread: normalizedFrom !== myNumberNormalized ? 1 : 0
          };
          return [newChat, ...prevChats];
        }
      });
      
      // Si el mensaje es del chat actual, actualizar mensajes inmediatamente
      if (selectedChat) {
        const normalizedSelected = normalizePhoneNumber(selectedChat.id);
        
        // Verificar si el mensaje pertenece al chat actual
        let shouldAddMessage = false;
        if (normalizedFrom === myNumberNormalized && normalizedTo === normalizedSelected) {
          // Mensaje enviado por mí al contacto actual
          shouldAddMessage = true;
        } else if (normalizedFrom === normalizedSelected && normalizedTo === myNumberNormalized) {
          // Mensaje recibido del contacto actual
          shouldAddMessage = true;
        }
        
        if (shouldAddMessage) {
          // Agregar el mensaje directamente sin recargar todo
          const newMsg = {
            id: message.id || Date.now(),
            text: message.body || '',
            type: message.type,
            mediaUrl: message.media_url,
            stickerUrl: message.sticker_url,
            caption: message.caption,
            timestamp: new Date(message.timestamp).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            isOutgoing: normalizedFrom === myNumberNormalized,
            status: message.status
          };
          setMessages(prev => [...prev, newMsg]);
        }
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
  }, []); // Quitar selectedChat de las dependencias para evitar reconexiones

  const selectChat = async (chat) => {
    try {
      setSelectedChat(chat);
      setLoading(true);
      
      // Cargar mensajes del chat seleccionado
      const messagesData = await loadMessages(chat.id);
      setMessages(messagesData);
      
      // Marcar el chat como leído (resetear contador)
      setChats(prevChats => 
        prevChats.map(c => 
          c.id === chat.id ? { ...c, unread: 0 } : c
        )
      );
      
      // Marcar mensajes como leídos en la base de datos
      try {
        await axios.post('http://localhost:3000/mark-as-read', {
          contactNumber: chat.id
        });
      } catch (error) {
        console.error('Error marcando mensajes como leídos:', error);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactUpdate = async (phoneNumber, newName) => {
    // Actualizar el nombre en la lista de chats
    setChats(prevChats => 
      prevChats.map(chat => 
        chat.id === phoneNumber ? { ...chat, name: newName } : chat
      )
    );
    
    // Actualizar el chat seleccionado si es el mismo
    if (selectedChat && selectedChat.id === phoneNumber) {
      setSelectedChat(prev => ({ ...prev, name: newName }));
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
          onContactUpdate={handleContactUpdate}
        />
      </div>
      <DebugPanel />
    </div>
  );
}

export default App;