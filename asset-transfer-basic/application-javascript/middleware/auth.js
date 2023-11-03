const Jwt = require("../jwt.js");

const jwtAuth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization || req.headers.Authorization;
    if (!bearer || !bearer.startsWith("Bearer ")) {
      throw new BadRequestError("token not found");
    }
    const token = bearer.split("Bearer ")[1].trim();
    const payload = await Jwt.verifyAccessToken(token);
    if (!payload) throw new Error("unauthorized");
    console.log("payload", payload);
    req.user = { userId: payload.userId };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = jwtAuth;
