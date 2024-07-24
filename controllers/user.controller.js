const { SALT_ROUNDS } = require("../configs/bcrypt.config");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");

const bcrypt = require("bcrypt");

const dotenv = require("dotenv");

const jwt = require("jsonwebtoken");

// exports.login_user = async(req, res) => {
//     const
// }

dotenv.config();

exports.signup_user = async (req, res) => {
  if (!req.body.email || !req.body.nickname || !req.body.password)
    return res.status(400).json({ message: "enter the email and nickname" });

  const existUser = await User.findOne({ email: req.body.email }).exec();

  if (existUser) return res.status(400).json({ message: "user exists!" });

  bcrypt.hash(req.body.password, SALT_ROUNDS, async function (err, hash) {
    if (err) return res.status(400).json({ err });

    const newUser = new User({
      nickname: req.body.nickname,
      email: req.body.email,
      password: hash,
      favorites: [],
    });

    await newUser.save();

    return res.status(200).json({ message: "user sign in" });
  });
};

exports.login_user = async (req, res) => {
  // get cookies from requrest
  const cookies = req.cookies;

  // find existing user in database
  const existUser = await User.findOne({ email: req.body.email }).exec();

  if (!existUser) return res.status(404).json({ msg: "User does not exist!" });

  // check password correction
  const match = await bcrypt.compare(req.body.password, existUser.password);

  if (!match) return res.status(401).json({ msg: "Incorrect password" });

  // email, nickname and id of Existing user
  const userData = {
    email: existUser.email,
    nickname: existUser.nickname,
    id: existUser._id,
  };

  // create the JSonWbebToken  as string
  const accessToken = jwt.sign(userData, process.env.JWT_SECRET_KEY, {
    expiresIn: "300s",
  });

  const newRefreshToken = jwt.sign(userData, process.env.JWT_REFRESH_KEY, {
    expiresIn: "1d",
  });

  const newRefreshTokenArray = !cookies?.jwt
    ? existUser.refreshToken
    : existUser.refreshToken.filter((rt) => rt !== cookies.jwt);

  if (cookies?.jwt)
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

  // saving Refresh token with current user
  existUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];

  // update current user
  await existUser.save();

  res.cookie("jwt", newRefreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  });
  return res.status(200).json({
    accessToken,

    user: userData,

    message: "you're logged in!",
  });
};

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

  res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

  if (!foundUser) {
    return res.status(204).json({ msg: "No content!" });
  }

  // clear array of refreshTokens and save it in DB
  foundUser.refreshToken = [];
  await foundUser.save();

  // secure: true - only serves on https

  res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
  return res.status(204).json({ msg: "No content! User log out" });
};

exports.user_delete = async (req, res) => {
  try {
    const [
      user,
      posts,
      // comments
    ] = await Promise.all([
      User.findById(req.params.userId, "id"),
      Post.find({ author: req.params.userId }, "id"),
    ]);

    if (!user) return res.status(404).json({ msg: "user doesn't exist" });

    if (req.userAuth.id !== user._id.toString())
      return res.status(403).json({ msg: "you cannot remove other user!" });
    // get only all post Ids
    const postIds = posts.map((post) => post.id);

    // remove User and all posts and comments associated with user
    await Promise.all([
      User.deleteOne({ _id: req.params.userId }),
      Post.deleteMany({ author: req.params.userId }),
      Comment.deleteMany({ post: { $in: postIds } }),
    ]);

    // remove jwt cookie
    res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res.status(204).json({ msg: "User has been removed!" });
  } catch (err) {
    res.status(404).json({ msg: "user doesn't exist" });
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

  if (!user) return res.status(404).json({ message: "User doesn't exist!" });

  return res
    .status(200)
    .json({ user, posts: postsByUser, message: "You are logged in!" });
};
