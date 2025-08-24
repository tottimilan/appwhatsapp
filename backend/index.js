require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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

app.post('/webhook', async (req, res) => {
  const payload = req.body;
  if (payload.object === 'whatsapp_business_account' && payload.entry) {
    const change = payload.entry[0].changes[0].value;
    if (change.messages) {
      const msg = change.messages[0];
      const { error } = await supabase.from('messages').insert({
        from_number: msg.from,
        to_number: change.metadata.phone_number_id,
        message_id: msg.id,
        body: msg.type === 'text' ? msg.text.body : '',
        type: msg.type,
        timestamp: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
        status: 'received'
      });
      console.log('Supabase insert error:', error ? error : 'null');  // Log para test
    }
  }
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Backend running on 3000'));