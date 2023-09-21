require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const router = require('./routes');

const app = express();

// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

app.use(cors());
app.use(logger('combined'));
app.use(router);

const port = process.env.PORT;

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
