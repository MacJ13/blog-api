const User = require("../models/user.model");

const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

const {
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
  COOKIE_SETTINGS,
} = require("../configs/jwt.config");

dotenv.config();

exports.refresh_token = async (req, res) => {
  // get cookies from request cookies;
  const cookies = req.cookies;

  // check if coookies with jwt exists
  if (!cookies?.jwt)
    return res.status(401).json({ err: "Unathorized message" });

  // assign cookies jwt as refresh token
  const refreshToken = cookies.jwt;

  // find user from db with refreshToken
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

        const hackedUser = await User.findById(id).exec();

        // check if user exists even if logged user doesn't exist
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

        await foundUser.save();
      }

      if (err || foundUser.nickname !== decoded.nickname) {
        return res.status(403).json({ err: "Forbidden user!" });
      }

      // referring token is still valid
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

      // set refresh token in respond cookie
      res.cookie("jwt", newRefreshToken, COOKIE_SETTINGS);

      res.json({ accessToken });
    }
  );
};
