const User = require("../models/user.model");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const dotenv = require("dotenv");
const {
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
  COOKIE_SETTINGS,
} = require("../configs/jwt.config");
const { PASSWORD_LENGTH } = require("../configs/main.config");
const validateResult = require("../middlewares/validateResult");

dotenv.config();

exports.user_login = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email must not be empty")
    .isEmail()
    .withMessage("Invalid email address"),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password must not be empty")
    .isLength(PASSWORD_LENGTH)
    .withMessage(
      `Password must contain at least ${PASSWORD_LENGTH} characters`
    ),
  validateResult,
  async (req, res) => {
    // get cookies from requrest
    const cookies = req.cookies;

    console.log(req);

    // find existing user in database
    const existUser = await User.findOne({ email: req.body.email }).exec();
    console.log({ existUser });
    if (!existUser)
      return res.status(404).json({
        code: 404,
        status: "error",
        error: {
          email: {
            msg: `User with ${req.body.email} does not exist!`,
            value: req.body.email,
            path: "email",
          },
        },
      });

    // check password correction
    const match = await bcrypt.compare(req.body.password, existUser.password);

    if (!match)
      return res.status(400).json({
        code: 400,
        status: "error",
        error: {
          password: {
            msg: "Incorrect password!",
            value: req.body.password,
            path: "password",
          },
        },
      });

    // get email, nickname and id of Existing user
    const userData = {
      email: existUser.email,
      nickname: existUser.nickname,
      id: existUser._id,
    };

    // create accessToken adn refresh Token
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

    // set refreshToken in array
    const newRefreshTokenArray = !cookies?.jwt
      ? existUser.refreshToken
      : existUser.refreshToken.filter((rt) => rt !== cookies.jwt);

    if (cookies?.jwt) res.cookie("jwt", newRefreshToken, COOKIE_SETTINGS);

    // saving Refresh token with current user
    existUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

    // save current user
    await existUser.save();

    // set new refresh token in cookie
    res.cookie("jwt", newRefreshToken, COOKIE_SETTINGS);
    return res.status(200).json({
      status: "success",
      code: 200,
      accessToken,
      user: { favorites: existUser.favorites, ...userData },
      msg: "Login is successful! You're logged in!",
    });
  },
];

exports.user_logout = async (req, res) => {
  // On client, also delete the accessToken

  // get cookies from request
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    res.statusCode = 204;
    return res.json({ msg: "No content cookie!" });
  }

  const refreshToken = cookies.jwt;

  // check if refreshToken is in db
  const foundUser = await User.findOne({
    refreshToken: { $in: [refreshToken] },
  });

  res.clearCookie("jwt", COOKIE_SETTINGS);

  if (!foundUser) {
    return res.status(204).json({ msg: "No content!" });
  }

  // clear array of refreshTokens and save it in DB
  foundUser.refreshToken = [];
  await foundUser.save();

  // secure: true - only serves on https

  res.clearCookie("jwt", COOKIE_SETTINGS);
  return res.status(204).json({ msg: "No content! User log out" });
};
