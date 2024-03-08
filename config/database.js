const mongoose = require("mongoose");
const express = require("express");
const app = express();

//database connection
const uri = process.env.DB_URI;
const dbConnection = () => {
  mongoose.connect(uri).then((conn) => {
    console.log("Database Connected");
  });
};

module.exports = dbConnection;
