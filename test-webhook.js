const express = require('express');
const app = express();
app.use(express.json());

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'mywhatsappverify2025') {
    console.log('Verificación exitosa! Challenge:', challenge);
    res.status(200).send(challenge);
  } else {
    console.log('Verificación fallida - Token incorrecto');
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  console.log('Incoming webhook payload:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on port 3000. Esperando webhooks...'));