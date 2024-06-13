const express = require("express");

const router = express.Router();

const postController = require("../controllers/post.controller");

const userController = require("../controllers/user.controller");

router.get("/", postController.post_list);

router.post("/signup", userController.signup_user);

router.post("/login", userController.login_user);

module.exports = router;
