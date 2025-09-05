const passport = require("passport");

const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

module.exports = (req, res, next) => {
  return passport.authenticate(
    "jwt",
    { session: false },
    (error, user, info, status) => {
      // get authorization property from request headers
      const authHeader = req.headers["authorization"];

      // check if property authorization exists

      if (!authHeader) {
        // console.log("unauthorized no req headers !!!");
        return res.status(403).json({
          msg: "Unauthorized action. No token",
          status: "error",
          code: 403,
        });
      }

      // extract token from authorization header request
      const token = authHeader.split(" ")[1];

      // verify token validation
      jwt.verify(token, process.env.JWT_SECRET_KEY, function (err, decoded) {
        if (err) {
          // if token expires send 401
          return res.status(401).json({
            msg: "Unauthorized message.",
            status: "error",
            code: 401,
          });
        }
        // create request userAuth object
        req.userAuth = decoded;

        return next();
      });
    }
  )(req, res, next);
};
