const express = require("express");

const router = express.Router();

const userController = require("../../controllers/user.controller");
const { checkAuth } = require("../../services/passport.jwt.service");

router.get("/:userId", checkAuth, userController.user_index);

module.exports = router;
