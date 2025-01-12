const { SALT_ROUNDS } = require("../configs/bcrypt.config");
const User = require("../models/user.model");
const Post = require("../models/post.model");
const Comment = require("../models/comment.model");

const { body } = require("express-validator");

const bcrypt = require("bcrypt");

const dotenv = require("dotenv");

const { PASSWORD_LENGTH } = require("../configs/main.config");
const validateResult = require("../middlewares/validateResult");

dotenv.config();

exports.user_delete = async (req, res) => {
  try {
    console.log(req.userAuth);

    if (!req.userAuth?.id)
      return res
        .status(403)
        .json({ msg: "unauthorized user", status: "error", code: 403 });

    const { id } = req.userAuth;

    const [user, postIds] = await Promise.all([
      User.findById(id, "id"),
      // Post.find({ author: id }, "id"),
      // only id from posts by logged author
      Post.find({ author: id }, "id").distinct("_id"),
    ]);

    if (!user)
      return res
        .status(404)
        .json({ msg: "user doesn't exist", status: "error", code: 403 });

    // remove User and all posts and comments associated with user
    await Promise.all([
      User.deleteOne({ _id: id }),
      Post.deleteMany({ author: id }),
      Comment.deleteMany({ post: { $in: postIds } }),
    ]);

    // // remove jwt cookie
    res.clearCookie("jwt", { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    return res
      .status(200)
      .json({ msg: "user has been  removed", status: "success", code: 200 });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "internal server error", status: "error", code: 500 });
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

  if (!user) return res.status(404).json({ error: "User doesn't exist!" });

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
  validateResult,
  async (req, res) => {
    if (!req.userAuth)
      return res.status(401).json({ error: "unauthorized user" });

    // get auth user id
    const id = req.userAuth.id;

    // get logged user from db
    const user = await User.findById(id).exec();

    if (!user) return res.status(404).json({ error: "user doesn't exist" });

    // hash new password
    const hash = bcrypt.hashSync(req.body.password, SALT_ROUNDS);

    // assign new hash password to user and save user in db
    user.password = hash;
    await user.save();

    return res.status(200).json({ msg: "password has changed" });
  },
];
