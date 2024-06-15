const passport = require("passport");
const { JWT_OPTIONS } = require("../configs/jwt.config");
const JwtStrategy = require("passport-jwt").Strategy;

const User = require("../models/user.model");

const jwt_strategy = new JwtStrategy(JWT_OPTIONS, async (payload, done) => {
  try {
    const user = await User.findOne({ email: payload.email });

    console.log("in jwt strategy!!!");
    if (user) return done(null, user);
    else return done(null, false);
  } catch (error) {
    return done(error);
  }
});

const checkAuth = passport.authenticate("jwt", { session: false });

module.exports = { jwt_strategy, checkAuth };
