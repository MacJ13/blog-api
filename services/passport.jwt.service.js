const passport = require("passport");
const { JWT_OPTIONS } = require("../configs/jwt.config");
const JwtStrategy = require("passport-jwt").Strategy;

const User = require("../models/user.model");

const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

const jwt_strategy = new JwtStrategy(JWT_OPTIONS, async (payload, done) => {
  console.log("PassportJwt Strategy being processed");
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

dotenv.config();

// const checkAuth = passport.authenticate("jwt", { session: false });

const checkAuth = (req, res, next) => {
  return passport.authenticate(
    "jwt",
    { session: false },
    (error, user, info, status) => {
      // console.log({ error, user });
      // get authorization property from request headers
      const authHeader = req.headers["authorization"];

      // console.log({ headers: req.headers, authHeader });

      // check if property authorization exists
      if (!authHeader)
        return res
          .status(401)
          .json({ msg: "Token doesn't exist! Unauthorized message!" });

      // extract token from authorization header requuest
      const token = authHeader.split(" ")[1];

      // verify token validtion
      jwt.verify(
        token,
        process.env.JWT_SECRET_KEY,
        // { ignoreExpiration: true },
        function (err, decoded) {
          if (err) {
            return res.status(401).json({ msg: "Unauthorized message!" });
          }

          req.userAuth = decoded;

          // console.log("Date now => ", Date.now() / 1000);
          // console.log("result: ", decoded.exp - Date.now() / 1000);

          return next();
        }
      );
    }
  )(req, res, next);
};

module.exports = {
  jwt_strategy,
  checkAuth,
};
