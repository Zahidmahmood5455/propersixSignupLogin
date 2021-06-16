const express = require('express');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

app.use(express.json());

app.use('/users', userRouter);

app.use(globalErrorHandler);

module.exports = app;