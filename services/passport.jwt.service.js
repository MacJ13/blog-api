const {
  JWT_OPTIONS,
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
  COOKIE_SETTINGS,
} = require("../configs/jwt.config");
const JwtStrategy = require("passport-jwt").Strategy;

const User = require("../models/user.model");

const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

dotenv.config();

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

const handleRefreshToken = async (req, res) => {
  // get cookies from request cookies;
  const cookies = req.cookies;

  // check if coookies with jwt exists
  if (!cookies?.jwt)
    return res.status(401).json({ err: "Unauthorized message!" });

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

    return res.status(403).json({ err: "Forbidden user!" });
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
        return res.status(403).json({ err: "Forbidden user!" });
      }

      // Referes token was still valid
      const userData = {
        email: foundUser.email,
        nickname: foundUser.nickname,
        id: foundUser._id,
      };

      // Create new access token and refresh toekn
      const accessToken = jwt.sign(
        userData,
        process.env.JWT_SECRET_KEY,
        ACCESS_TOKEN_EXPIRE
      );

      const newRefreshToken = jwt.sign(
        userData,
        process.env.JWT_REFRESH_KEY,
        REFRESH_TOKEN_EXPIRE
      );

      // saving RefreshToken with current user
      foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

      await foundUser.save();

      res.cookie("jwt", newRefreshToken, COOKIE_SETTINGS);

      res.json({ accessToken });
    }
  );
};

// move and rename handleLogout to user_logout

module.exports = {
  jwt_strategy,
  handleRefreshToken,
};
