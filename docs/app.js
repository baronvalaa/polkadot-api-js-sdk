const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./a.json');

app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(88);

console.log('listen on http://localhost:88/');