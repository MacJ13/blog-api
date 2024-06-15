const ExtractJwt = require("passport-jwt").ExtractJwt;

require("dotenv").config();

const secretKey = process.env.JWT_SECRET_KEY;

const JWT_OPTIONS = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretKey,
};

module.exports = { JWT_OPTIONS };
