require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const port = process.env.PORT;
const router = require('./routes');

const app = express();

app.use(cors());
app.use(logger('combined'));
app.use(router);

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
