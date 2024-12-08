const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const { body } = require("express-validator");

const { SALT_ROUNDS } = require("../configs/bcrypt.config");
const { NICKNAME_LENGTH, PASSWORD_LENGTH } = require("../configs/main.config");
const validateResult = require("../middlewares/validateResult");

exports.user_register = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email must not be empty")
    .isEmail()
    .withMessage("Invalid email address")
    .custom(async (value) => {
      const existUser = await User.findOne({ email: value }).exec();

      if (existUser) {
        throw new Error(`Email (${value}) already in use`);
      }
    }),
  body("nickname")
    .trim()
    .notEmpty()
    .withMessage("Nickname must not be empty")
    .isLength(NICKNAME_LENGTH)
    .withMessage(`Nickname must contain at least ${NICKNAME_LENGTH} characters`)
    .custom(async (value) => {
      const existUser = await User.findOne({ nickname: value }).exec();

      if (existUser) {
        throw new Error(`Nickname (${value}) already in use`);
      }
    }),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password must not be empty")
    .isLength(PASSWORD_LENGTH)
    .withMessage(`Password must contain at least ${PASSWORD_LENGTH} characters`)
    .custom((value, { req }) => {
      const { confirmPassword } = req.body;
      if (confirmPassword !== value)
        throw new Error("Passwords are not matches");

      return true;
    }),
  validateResult,
  async (req, res) => {
    // hash user password
    const hash = bcrypt.hashSync(req.body.password, SALT_ROUNDS);

    // Create new user and save in db
    const newUser = new User({
      nickname: req.body.nickname,
      email: req.body.email,
      password: hash,
      favorites: [],
    });

    await newUser.save();

    return res.status(201).json({
      status: "success",
      code: 201,
      msg: "user signed in",
      redirect: "/login",
    });
  },
];
