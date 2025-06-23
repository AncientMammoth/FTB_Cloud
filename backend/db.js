const { Pool } = require('pg');
require('dotenv').config();

// The pool will use the DATABASE_URL from your .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = {
  // We export a query function that will be used throughout the app
  query: (text, params) => pool.query(text, params),
};