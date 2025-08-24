require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');
const { normalizePhoneNumber } = require('./utils/phoneUtils');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(cors({ origin: '*' }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === 'mywhatsappverify2025') {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook for incoming and statuses
app.post('/webhook', async (req, res) => {
  const payload = req.body;
  if (payload.object === 'whatsapp_business_account' && payload.entry) {
    const change = payload.entry[0].changes[0].value;
    if (change.messages) {
      const msg = change.messages[0];
      // Check if message_id exists (dedup)
      const { data: existing, error: checkError } = await supabase
        .from('messages')
        .select('message_id')
        .eq('message_id', msg.id)
        .single();
      if (checkError) console.error('Check error:', checkError);
      if (!existing) {
        const { data, error } = await supabase.from('messages').insert({
          from_number: normalizePhoneNumber(msg.from),
          to_number: normalizePhoneNumber(change.metadata.phone_number_id),
          message_id: msg.id,
          body: msg.type === 'text' ? msg.text.body : '',
          type: msg.type,
          timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
          status: 'received'
        });
        if (error) console.error('Supabase error:', error);
        else io.emit('new_message', data[0]);
      } else {
        console.log('Duplicate message_id, skipping insert:', msg.id);
      }
    } else if (change.statuses) {
      const status = change.statuses[0];
      // Update status for existing message
      const { error } = await supabase
        .from('messages')
        .update({ status: status.status })
        .eq('message_id', status.id);
      if (error) console.error('Status update error:', error);
      else io.emit('update_status', { message_id: status.id, status: status.status });
    }
  }
  res.sendStatus(200);
});

// Send message endpoint
app.post('/send', async (req, res) => {
  const { to, message } = req.body;
  try {
    const response = await axios.post(
      'https://graph.facebook.com/v22.0/776732452191426/messages',
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message }
      },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_BEARER}` } }
    );
    res.json({ success: true, response: response.data });
  } catch (error) {
    console.error('Send error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para marcar mensajes como leídos
app.post('/mark-as-read', async (req, res) => {
  try {
    const { contactNumber } = req.body;
    const myNumber = normalizePhoneNumber('776732452191426');
    const normalizedContact = normalizePhoneNumber(contactNumber);
    
    // Actualizar todos los mensajes recibidos de este contacto como leídos
    const { error } = await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('from_number', normalizedContact)
      .eq('to_number', myNumber)
      .eq('status', 'received');
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

server.listen(3000, () => console.log('Backend with Socket.io on 3000'));