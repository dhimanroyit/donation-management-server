const Jwt = require("jsonwebtoken");
const config = require("./config.js");

const generateAccessToken = (payload) => {
  return Jwt.sign(payload, config.jwtAccessSecretKey, {
    expiresIn: "365d",
  });
};

const verifyAccessToken = (token) => {
  return new Promise((resolve, reject) => {
    Jwt.verify(token, config.jwtAccessSecretKey, (err, payload) => {
      if (err) {
        return reject(err);
      }
      resolve(payload);
    });
  });
};

module.exports = {
  generateAccessToken,
  verifyAccessToken,
};
