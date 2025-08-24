import { createClient } from '@supabase/supabase-js';
import { normalizePhoneNumber } from '../utils/phoneUtils';
import { MY_WHATSAPP_NUMBER } from './constants';
import { getContactsMap } from './contacts';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://apcwtphcxwqvawnpxajn.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para cargar chats únicos
export const loadChats = async () => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('from_number, to_number, body, timestamp, status')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error cargando chats:', error);
      return [];
    }

    // Obtener mapa de contactos
    const contactsMap = await getContactsMap();

    const myNumberNormalized = normalizePhoneNumber(MY_WHATSAPP_NUMBER);
    
    console.log('Mi número normalizado:', myNumberNormalized);

    // Agrupar por el número del contacto (no tu propio número)
    const chatMap = new Map();
    data.forEach(message => {
      const fromNormalized = normalizePhoneNumber(message.from_number);
      const toNormalized = normalizePhoneNumber(message.to_number);
      
      console.log('Mensaje:', {
        from_original: message.from_number,
        from_normalized: fromNormalized,
        to_original: message.to_number,
        to_normalized: toNormalized
      });
      
      // Determinar cuál es el número del contacto
      let contactNumber;
      if (fromNormalized === myNumberNormalized) {
        // Mensaje enviado por ti, el contacto es 'to'
        contactNumber = toNormalized;
        console.log('Mensaje enviado por ti a:', contactNumber);
      } else {
        // Mensaje recibido, el contacto es 'from'
        contactNumber = fromNormalized;
        console.log('Mensaje recibido de:', contactNumber);
      }
      
      // No crear chats con tu propio número
      if (contactNumber === myNumberNormalized) {
        console.log('Ignorando chat con tu propio número');
        return;
      }
      
      if (!chatMap.has(contactNumber)) {
        // Buscar el nombre del contacto
        const contact = contactsMap.get(contactNumber);
        const displayName = contact ? contact.name : contactNumber;
        
        chatMap.set(contactNumber, {
          id: contactNumber,
          name: displayName,
          profilePicture: contact?.profile_picture_url || null,
          lastMessage: message.body,
          timestamp: message.timestamp,
          unread: 0 // Se calculará después
        });
      } else {
        // Actualizar el último mensaje si es más reciente
        const existingChat = chatMap.get(contactNumber);
        if (new Date(message.timestamp) > new Date(existingChat.timestamp)) {
          existingChat.lastMessage = message.body;
          existingChat.timestamp = message.timestamp;
          chatMap.set(contactNumber, existingChat);
        }
      }
    });

    // Ahora contar mensajes no leídos para cada chat
    for (const [contactNumber, chat] of chatMap) {
      // Contar mensajes recibidos no leídos de este contacto
      const unreadCount = data.filter(msg => {
        const fromNormalized = normalizePhoneNumber(msg.from_number);
        const toNormalized = normalizePhoneNumber(msg.to_number);
        
        return fromNormalized === contactNumber && 
               toNormalized === myNumberNormalized && 
               msg.status === 'received';
      }).length;
      
      chat.unread = unreadCount;
    }

    return Array.from(chatMap.values());
  } catch (error) {
    console.error('Error en loadChats:', error);
    return [];
  }
};

// Función para cargar mensajes de un chat específico
export const loadMessages = async (fromNumber) => {
  try {
    console.log('Cargando mensajes para:', fromNumber);
    
    // Obtener todos los mensajes y filtrar en el cliente
    const { data: allMessagesFromDB, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: true });
      
    if (error) {
      console.error('Error cargando mensajes:', error);
      return [];
    }
    
    // Normalizar el número buscado
    const searchNumber = normalizePhoneNumber(fromNumber);
    const myNumberNormalized = normalizePhoneNumber(MY_WHATSAPP_NUMBER);
    
    // Filtrar mensajes donde el número aparezca como from o to
    const data = allMessagesFromDB.filter(message => {
      const fromNormalized = normalizePhoneNumber(message.from_number);
      const toNormalized = normalizePhoneNumber(message.to_number);
      
      // Para mensajes enviados por ti: from es tu número y to es el contacto
      // Para mensajes recibidos: from es el contacto y to es tu número
      return (fromNormalized === searchNumber && toNormalized === myNumberNormalized) || 
             (fromNormalized === myNumberNormalized && toNormalized === searchNumber);
    });
    
    console.log('Mensajes encontrados para', searchNumber, ':', data.length);

    // Transformar los datos para el formato que espera el componente
    
    return data.map(message => ({
      id: message.id,
      text: message.body || '',
      type: message.type,
      mediaUrl: message.media_url,
      stickerUrl: message.sticker_url,
      caption: message.caption,
      timestamp: new Date(message.timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isOutgoing: normalizePhoneNumber(message.from_number) === myNumberNormalized,
      status: message.status
    }));
  } catch (error) {
    console.error('Error en loadMessages:', error);
    return [];
  }
};

// Función para guardar mensaje enviado
export const saveOutgoingMessage = async (toNumber, messageBody, messageId) => {
  try {
    const normalizedToNumber = normalizePhoneNumber(toNumber);
    const myNumberNormalized = normalizePhoneNumber(MY_WHATSAPP_NUMBER);
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        from_number: myNumberNormalized,
        to_number: normalizedToNumber,
        message_id: messageId,
        body: messageBody,
        type: 'text',
        timestamp: new Date().toISOString(),
        status: 'sent'
      })
      .select()
      .single();

    if (error) {
      console.error('Error guardando mensaje enviado:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en saveOutgoingMessage:', error);
    return null;
  }
};
