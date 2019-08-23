const knex = require("knex");

const database = knex({
  client: "pg", // pg is the database library for postgreSQL on knexjs
  connection: {
    host: process.env.DB_HOST || "127.0.0.1", // Your local host IP
    user: process.env.DB_USER || "wom", // Your postgres user name
    password: process.env.DB_PASSWORD || "2018", // Your postrgres user password
    database: process.env.DB_NAME || "womdata" // Your database name
  }
});

module.exports = database;