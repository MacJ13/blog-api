const ExtractJwt = require("passport-jwt").ExtractJwt;

require("dotenv").config();

const secretKey = process.env.JWT_SECRET_KEY;

const JWT_OPTIONS = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: secretKey,
};

const ACCESS_TOKEN_EXPIRE = { expiresIn: "15m" };

const REFRESH_TOKEN_EXPIRE = { expiresIn: "7d" };

const COOKIE_SETTINGS = {
  httpOnly: true,
  secure: true, // to force https (if you use it)
  sameSite: "none",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

module.exports = {
  JWT_OPTIONS,
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
  COOKIE_SETTINGS,
};
