const ExtractJwt = require("passport-jwt").ExtractJwt;

require("dotenv").config();

const secretKey = process.env.JWT_SECRET_KEY;

const JWT_OPTIONS = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretKey,
};

const ACCESS_TOKEN_EXPIRE = { expiresIn: "1h" };

const REFRESH_TOKEN_EXPIRE = { expiresIn: "7d" };

const COOKIE_SETTINGS = {
  httpOnly: true,
  //secure: true, // to force https (if you use it)

  maxAge: 7 * 24 * 60 * 60 * 1000,
  signed: true, // if you use the secret with cookieParser
};

module.exports = {
  JWT_OPTIONS,
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
  COOKIE_SETTINGS,
};
