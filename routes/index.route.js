const express = require("express");

const router = express.Router();

const postController = require("../controllers/post.controller");

const userController = require("../controllers/user.controller");
const {
  handleRefreshToken,
  //   handleLogout,
} = require("../services/passport.jwt.service");

router.get("/", postController.post_index);

router.get("/refresh", handleRefreshToken);

router.get("/logout", userController.user_logout);

router.post("/register", userController.user_register);

router.post("/login", userController.login_user);

module.exports = router;
