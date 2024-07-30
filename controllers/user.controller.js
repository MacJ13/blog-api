const { SALT_ROUNDS } = require("../configs/bcrypt.config");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");

const { body, validationResult } = require("express-validator");

const bcrypt = require("bcrypt");

const dotenv = require("dotenv");

const jwt = require("jsonwebtoken");
const {
  REFRESH_TOKEN_EXPIRE,
  ACCESS_TOKEN_EXPIRE,
  COOKIE_SETTINGS,
} = require("../configs/jwt.config");
// const { PASSWORD_LENGTH } = require("../configs/main.config");
const { PASSWORD_LENGTH } = require("../configs/main.config");
dotenv.config();

// exports.user_register = [
//   body("email")
//     .trim()
//     .notEmpty()
//     .withMessage("Email must not be empty")
//     .isEmail()
//     .withMessage("Invalid email address")
//     .custom(async (value) => {
//       const existUser = await User.findOne({ email: value }).exec();

//       if (existUser) {
//         throw new Error("Email already in use");
//       }
//     }),
//   body("nickname")
//     .trim()
//     .notEmpty()
//     .withMessage("Nickname must not be empty")
//     .isLength(NICKNAME_LENGTH)
//     .withMessage(`Nickname must contain at least ${NICKNAME_LENGTH} characters`)
//     .custom(async (value) => {
//       const existUser = await User.findOne({ nickname: value }).exec();

//       if (existUser) {
//         throw new Error("Nickname already in use");
//       }
//     }),
//   body("password")
//     .trim()
//     .notEmpty()
//     .withMessage("Password must not be empty")
//     .isLength(PASSWORD_LENGTH)
//     .withMessage(`Password must contain at least ${PASSWORD_LENGTH} characters`)
//     .custom((value, { req }) => {
//       const { confirmPassword } = req.body;
//       if (confirmPassword !== value)
//         throw new Error("Passwords are not matches");

//       return true;
//     }),

//   async (req, res) => {
//     const result = validationResult(req);

//     if (!result.isEmpty()) {
//       const msgErrors = result.errors.map((err) => err.msg);
//       return res.status(400).json({ err: msgErrors });
//     }

//     const hash = bcrypt.hashSync(req.body.password, SALT_ROUNDS);

//     const newUser = new User({
//       nickname: req.body.nickname,
//       email: req.body.email,
//       password: hash,
//       favorites: [],
//     });

//     await newUser.save();

//     return res.status(200).json({ msg: "user signed in" });
//   },
// ];

// exports.user_login = [
//   body("email")
//     .trim()
//     .notEmpty()
//     .withMessage("Email must not be empty")
//     .isEmail()
//     .withMessage("Invalid email address"),
//   body("password")
//     .trim()
//     .notEmpty()
//     .withMessage("Password must not be empty")
//     .isLength(PASSWORD_LENGTH)
//     .withMessage(
//       `Password must contain at least ${PASSWORD_LENGTH} characters`
//     ),
//   async (req, res) => {
//     // validate request body data (email and password)
//     const result = validationResult(req);

//     if (!result.isEmpty()) {
//       const msgErrors = result.errors.map((err) => err.msg);
//       return res.status(400).json({ err: msgErrors });
//     }

//     // get cookies from requrest
//     const cookies = req.cookies;

//     // find existing user in database
//     const existUser = await User.findOne({ email: req.body.email }).exec();

//     if (!existUser)
//       return res.status(404).json({ err: "User does not exist!" });

//     // check password correction
//     const match = await bcrypt.compare(req.body.password, existUser.password);

//     if (!match) return res.status(400).json({ err: "Incorrect password" });

//     // email, nickname and id of Existing user
//     const userData = {
//       email: existUser.email,
//       nickname: existUser.nickname,
//       id: existUser._id,
//     };

//     // create the JSonWbebToken  as string
//     const accessToken = jwt.sign(
//       userData,
//       process.env.JWT_SECRET_KEY,
//       ACCESS_TOKEN_EXPIRE
//     );

//     const newRefreshToken = jwt.sign(
//       userData,
//       process.env.JWT_REFRESH_KEY,
//       REFRESH_TOKEN_EXPIRE
//     );

//     const newRefreshTokenArray = !cookies?.jwt
//       ? existUser.refreshToken
//       : existUser.refreshToken.filter((rt) => rt !== cookies.jwt);

//     if (cookies?.jwt) res.cookie("jwt", newRefreshToken, COOKIE_SETTINGS);

//     // saving Refresh token with current user
//     existUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

//     // update current user
//     await existUser.save();

//     res.cookie("jwt", newRefreshToken, COOKIE_SETTINGS);
//     return res.status(200).json({
//       accessToken,

//       user: userData,

//       msg: "you're logged in!",
//     });
//   },
// ];

// exports.user_logout = async (req, res) => {
//   // On client, also delete the accessToken

//   // get cookies from request
//   const cookies = req.cookies;

//   if (!cookies?.jwt) {
//     res.statusCode = 204;
//     return res.json({ msg: "No content cookie!" });
//   }

//   const refreshToken = cookies.jwt;

//   // check if refreshToken is in db
//   const foundUser = await User.findOne({
//     refreshToken: { $in: [refreshToken] },
//   });

//   res.clearCookie("jwt", COOKIE_SETTINGS);

//   if (!foundUser) {
//     return res.status(204).json({ msg: "No content!" });
//   }

//   // clear array of refreshTokens and save it in DB
//   foundUser.refreshToken = [];
//   await foundUser.save();

//   // secure: true - only serves on https

//   res.clearCookie("jwt", COOKIE_SETTINGS);
//   return res.status(204).json({ msg: "No content! User log out" });
// };

exports.user_delete = async (req, res) => {
  try {
    console.log(req.userAuth);

    if (!req.userAuth?.id)
      return res.status(404).json({ err: "unauthorized user" });

    const { id } = req.userAuth;

    const [user, postIds] = await Promise.all([
      User.findById(id, "id"),
      // Post.find({ author: id }, "id"),
      // only id from posts by logged author
      Post.find({ author: id }, "id").distinct("_id"),
    ]);

    if (!user) return res.status(404).json({ err: "user doesn't exist" });

    // remove User and all posts and comments associated with user
    await Promise.all([
      User.deleteOne({ _id: id }),
      Post.deleteMany({ author: id }),
      Comment.deleteMany({ post: { $in: postIds } }),
    ]);

    // // remove jwt cookie
    res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(204).json({ msg: "User has been removed!" });
  } catch (err) {
    res.status(404).json({ err: "user doesn't exist" });
  }
};

exports.user_detail = async (req, res) => {
  // const user = await User.findById(req.params.userId).exec();

  const [user, postsByUser] = await Promise.all([
    User.findById(req.params.userId, "nickname"),
    Post.find(
      { author: req.params.userId, hidden: false },
      "title author timeStamp"
    ),
  ]);

  if (!user) return res.status(404).json({ err: "User doesn't exist!" });

  return res.status(200).json({ user, posts: postsByUser });
};

exports.user_change_password = [
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

  async (req, res) => {
    // validate request body data (email and password)
    const result = validationResult(req);

    // get validation errors if exists
    if (!result.isEmpty()) {
      const msgErrors = result.errors.map((err) => err.msg);
      return res.status(400).json({ err: msgErrors });
    }

    if (!req.userAuth)
      return res.status(401).json({ err: "unauthorized user" });

    // get auth user id
    const id = req.userAuth.id;

    // get logged user from db
    const user = await User.findById(id).exec();

    if (!user) return res.status(404).json({ err: "user doesn't exist" });

    // hash new password
    const hash = bcrypt.hashSync(req.body.password, SALT_ROUNDS);

    // assign new hash password to user and save user in db
    user.password = hash;
    await user.save();

    return res.status(200).json({ msg: "password has changed" });
  },
];
