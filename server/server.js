// Purpose: Creates the Express app, configures middleware, exposes the health check, and starts the API.
const cors = require('cors');
const express = require('express');

const { PORT, CLIENT_ORIGIN } = require('./config/environment');
const { connectDatabase } = require('./config/database');

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`EU-ARCP API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
