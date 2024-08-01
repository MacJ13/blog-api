const express = require("express");

const router = express.Router();

const registerController = require("../controllers/register.controller");

const loggerController = require("../controllers/logger.controller");

const { handleRefreshToken } = require("../services/passport.jwt.service");

router.get("/refresh", handleRefreshToken);

router.get("/logout", loggerController.user_logout);

router.post("/register", registerController.user_register);

router.post("/login", loggerController.user_login);

module.exports = router;
