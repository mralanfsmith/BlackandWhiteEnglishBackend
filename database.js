const knex = require("knex");

const database = knex({
  client: "pg", // pg is the database library for postgreSQL on knexjs
  connection: {
    host: "127.0.0.1", // Your local host IP
    user: "wom", // Your postgres user name
    password: "2018", // Your postrgres user password
    database: "womdata" // Your database name
  }
});

module.exports = database;