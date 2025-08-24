import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://apcwtphcxwqvawnpxajn.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para cargar chats únicos
export const loadChats = async () => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('from_number, body, timestamp, status')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error cargando chats:', error);
      return [];
    }

    // Agrupar por from_number y obtener el último mensaje de cada chat
    const chatMap = new Map();
    data.forEach(message => {
      if (!chatMap.has(message.from_number)) {
        chatMap.set(message.from_number, {
          id: message.from_number,
          name: message.from_number, // Por ahora usamos el número, después podemos agregar nombres
          lastMessage: message.body,
          timestamp: message.timestamp,
          unread: message.status === 'sent' ? 1 : 0 // Simplificado por ahora
        });
      }
    });

    return Array.from(chatMap.values());
  } catch (error) {
    console.error('Error en loadChats:', error);
    return [];
  }
};

// Función para cargar mensajes de un chat específico
export const loadMessages = async (fromNumber) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('from_number', fromNumber)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error cargando mensajes:', error);
      return [];
    }

    // Transformar los datos para el formato que espera el componente
    return data.map(message => ({
      id: message.id,
      text: message.body,
      timestamp: new Date(message.timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isOutgoing: message.to_number === fromNumber, // Simplificado: si to_number es igual a from_number, es saliente
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
    const { data, error } = await supabase
      .from('messages')
      .insert({
        from_number: '776732452191426', // Tu número de WhatsApp Business
        to_number: toNumber,
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
