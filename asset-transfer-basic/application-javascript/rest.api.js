const express = require("express");
const cors = require("cors");

const createServer = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
};

module.exports = createServer;
