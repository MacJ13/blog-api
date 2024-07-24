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

const handleRefreshToken = async (req, res) => {
  // get cookies from request cookies;
  const cookies = req.cookies;

  // check if coookies with jwt exists
  if (!cookies?.jwt)
    return res.status(401).json({ msg: "Unauthorized message!" });

  // assign cokkies jwt as refresh token
  const refreshToken = cookies.jwt;

  // find user from mongoDB with refreshToken
  const foundUser = await User.findOne({
    refreshToken: { $in: [refreshToken] },
  });

  // check if user exists
  if (!foundUser) {
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_KEY,
      async (err, decoded) => {
        if (err) return res.status(403).json({ msg: "Forbidden user!" });

        const { id } = decoded;
        // console.log({ decoded });
        // const hackedUser = await User.findOne({
        //   username: decoded.nickname,
        // }).exec();
        const hackedUser = await User.findById(id).exec();
        // console.log({ hackedUser });
        if (hackedUser) {
          hackedUser.refreshToken = [];

          await hackedUser.save();
        }
      }
    );

    return res.status(403).json({ msg: "Forbidden user!" });
  }

  // filter fresh array token to remove current fresh token
  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );

  // evaluate jwt
  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_KEY,
    async (err, decoded) => {
      if (err) {
        foundUser.refreshToken = [...newRefreshTokenArray];
        // const result =
        await foundUser.save();
      }

      if (err || foundUser.nickname !== decoded.nickname) {
        return res.status(403).json({ msg: "Forbidden user!" });
      }

      // Referes token was still valid
      const userData = {
        email: foundUser.email,
        nickname: foundUser.nickname,
        id: foundUser._id,
      };

      // Create new access token and refresh toekn
      const accessToken = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
        expiresIn: "300s",
      });

      const newRefreshToken = jwt.sign(userData, process.env.JWT_REFRESH_KEY, {
        expiresIn: "1d",
      });

      // saving RefreshToken with current user
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

      await foundUser.save();

      res.cookie("jwt", newRefreshToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.json({ accessToken });
    }
  );
};

// move and rename handleLogout to user_logout

module.exports = {
  jwt_strategy,
  checkAuth,
  handleRefreshToken,
};
