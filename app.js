// Load environment configuration 🌳
require('dotenv').config();

// Initialize Models 🚀
require('./models/initializeModels');

// Configure server 🛠
const Koa = require('koa');
const app = new Koa();
const router = require('./router.js');
const bodyParser = require('koa-body-parser');
const cors = require('koa-cors');

const options = {
  origin: process.env.CLIENT_URL
};

app
  .use(bodyParser())
  .use(cors(options))
  .use(router.routes())
  .use(router.allowedMethods());

// Start server 🔥
app.listen(process.env.PORT);
