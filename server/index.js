require('dotenv').config();

const express = require('express');

const app = express();
const port = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('AI Capsule API is running');
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});