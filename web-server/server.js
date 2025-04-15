require('dotenv').config();

const Express = require('express');
const BodyParser = require('body-parser');
const Path = require('path');
const Database = require('./config/database');
const Routes = require('./routes/routes');

const app = Express();
const db = Database.getInstance();

app.use(BodyParser.json())
app.use(BodyParser.urlencoded({ extended: true }))

app.use('/api', Routes);
app.use('/public', Express.static(Path.join(__dirname, 'public')));

process.on('SIGINT', async () => {
  try {
      db.close();
      console.log('Database connection closed.');
  } catch (err) {
      console.error('Error closing the database connection:', err.stack);
  } finally {
      process.exit();
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});