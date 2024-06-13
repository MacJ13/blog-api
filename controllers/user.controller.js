const { SALT_ROUNDS } = require("../configs/bcrypt.config");
const User = require("../models/user.model");

const bcrypt = require("bcrypt");

// exports.login_user = async(req, res) => {
//     const
// }

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

  // bcrypt.hash(req.body.password, SALT_ROUNDS).then(async function (result) {
  //   const newUser = new User({
  //     nickname: req.body.nickname,
  //     email: req.body.email,
  //     password: req.body.password,
  //     favorites: [],
  //   });

  //   await newUser.save();

  //   return res.status(200).json({ message: "user sign in" });
  // });
};

exports.login_user = async (req, res) => {
  const existUser = await User.findOne({ email: req.body.email }).exec();

  if (!existUser)
    return res.status(400).json({ message: "user does not exist" });

  const match = await bcrypt.compare(req.body.password, existUser.password);

  if (!match) return res.status(400).json({ message: "incorrect password" });

  return res
    .status(200)
    .json({ user: existUser, message: "you're logged in!" });
};
