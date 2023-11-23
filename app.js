require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const router = require('./routes');

const { appDataSource } = require('./models/dataSource');
const { calendarReminder } = require('./utils/scheduler');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('views'));

app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('combined'));
app.use(router);

const port = process.env.PORT;

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(port, async () => {
  console.log(`Express app is running on port ${port}`);
  await appDataSource
    .initialize()
    .then(() => {
      console.log('Data Source has been initialized!');
    })
    .catch((err) => {
      console.error('Error during Data Source initialization:', err);
    });
});

calendarReminder;
