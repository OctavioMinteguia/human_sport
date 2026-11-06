require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database/humansport.db')
    },
    migrations: {
      directory: path.resolve(__dirname, 'database/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'database/seeds')
    },
    useNullAsDefault: true
  },
  // Throwaway database for automated tests (path set by the test runner).
  test: {
    client: 'better-sqlite3',
    connection: {
      filename: process.env.TEST_DB_FILE || ':memory:'
    },
    migrations: {
      directory: path.resolve(__dirname, 'database/migrations')
    },
    useNullAsDefault: true
  },
  production: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'data/humansport.db')
    },
    migrations: {
      directory: path.resolve(__dirname, 'database/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, 'database/seeds')
    },
    useNullAsDefault: true
  }
};
