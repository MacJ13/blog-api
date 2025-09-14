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

  // console.log("REQ COOKIES >>>", req.cookies);

  // check if coookies with jwt exists
  if (!cookies?.jwt) {
    return res
      .status(401)
      .json({ error: "unauthorized message", status: "error", code: 401 });
  }

  // assign cookies jwt as refresh token
  const refreshToken = cookies.jwt;

  // find user from db by refreshToken
  const foundUser = await User.findOne({
    refreshToken: { $in: [refreshToken] },
  });

  // check if user exists
  if (!foundUser) {
    // jwt.verify(
    //   refreshToken,
    //   process.env.JWT_REFRESH_KEY,
    //   async (err, decoded) => {
    //     if (err)
    //       return res
    //         .status(403)
    //         .json({ error: "forbidden user", status: "error", code: 403 });

    //     // const { id } = decoded;

    //     // const hackedUser = await User.findById(id).exec();

    //     // // check if user exists even if logged user doesn't exist
    //     // if (hackedUser) {
    //     //   hackedUser.refreshToken = [];

    //     //   await hackedUser.save();
    //     // }
    //   }
    // );
    return res.status(403).json({
      error: "forbidden user no user found",
      status: "error",
      code: 403,
    });
  }

  // evaluate jwt
  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_KEY,
    async (err, decoded) => {
      if (err || foundUser.nickname !== decoded.nickname) {
        // filter fresh array token to remove current fresh token
        foundUser.refreshToken = foundUser.refreshToken.filter(
          (rt) => rt !== refreshToken
        );

        await foundUser.save();
        return res
          .status(403)
          .json({ error: "forbidden user", status: "error", code: 403 });
      }

      // referring token is still valid
      const userData = {
        email: decoded.email,
        nickname: decoded.nickname,
        id: decoded.id,
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

      // filter fresh array token to remove current fresh token
      foundUser.refreshToken = foundUser.refreshToken.filter(
        (rt) => rt !== refreshToken
      );

      // saving RefreshToken with current user
      foundUser.refreshToken.push(newRefreshToken);

      // save yser wuth new data in db
      await foundUser.save();

      res.clearCookie("jwt", { path: "/" });

      // set refresh token in respond cookie
      res.cookie("jwt", newRefreshToken, COOKIE_SETTINGS);

      return res
        .status(200)
        .json({ status: "success", code: 200, accessToken });
    }
  );
};

exports.renew_user_token = async (req, res, next) => {
  // get refresh token from jwt
  const refreshToken = req.cookies.jwt;

  //if token doesn't exist send 403
  if (!refreshToken) {
    return res
      .status(403)
      .json({ msg: "unauthorized user", status: "error", code: 403 });
  }

  // verify is token valid
  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_KEY,
    //if token expire send 403
    async (err, decoded) => {
      if (err)
        return res
          .status(403)
          .json({ error: "forbidden user", status: "error", code: 403 });

      // assign user data from decoded token
      req.userAuth = decoded;
    }
  );

  // get user from db by refresh token
  const user = await User.findOne({
    refreshToken: { $in: [refreshToken] },
  })
    .lean()
    .exec();

  // check if user exists
  if (!user) {
    return res.status(404).json({
      msg: "user not found. token is invalid",
      status: "error",
      code: 404,
    });
  }
  // get user data to add to repones
  const existUser = {
    email: user.email,
    nickname: user.nickname,
    id: user._id,
    favorites: user.favorites,
  };

  // create accessToken
  const accessToken = jwt.sign(
    existUser,
    process.env.JWT_SECRET_KEY,
    ACCESS_TOKEN_EXPIRE
  );

  // console.log({ accessToken });

  return res.status(200).json({
    msg: "Renew login is successful! You're again logged in",
    status: "success",
    code: 200,
    user: existUser,
    accessToken,
  });
};
