const { JWT_OPTIONS } = require("../configs/jwt.config");
const JwtStrategy = require("passport-jwt").Strategy;

const User = require("../models/user.model");

const dotenv = require("dotenv");

dotenv.config();

const jwt_strategy = new JwtStrategy(JWT_OPTIONS, async (payload, done) => {
  // console.log("PassportJwt Strategy being processed");
  // console.log({ payload, done });
  try {
    const user = await User.findById(payload.id);
    // console.log({ user });
    if (!user) return done(null, false);

    const { nickname, _id, email } = user;

    return done(null, { nickname, id: _id, email });
  } catch (error) {
    return done(error);
  }
});

// move and rename handleLogout to user_logout

module.exports = {
  jwt_strategy,
};
