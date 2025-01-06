const express = require("express");

const router = express.Router();

const registerController = require("../controllers/register.controller");
const loggerController = require("../controllers/logger.controller");
const tokenController = require("../controllers/token.controller");

router.get("/refresh", tokenController.refresh_token);

router.post("/logout", loggerController.user_logout);

router.post("/login", loggerController.user_login);

router.post("/register", registerController.user_register);

module.exports = router;
