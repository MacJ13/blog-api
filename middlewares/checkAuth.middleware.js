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
      // console.log(req.headers);
      // console.log(authHeader);
      // check if property authorization exists
      if (!authHeader)
        return res.status(403).json({
          msg: "Unauthorized action. No token",
          status: "error",
          code: 403,
        });
      // {error: "Token doesn't exist! Unathorized message!" }

      // extract token from authorization header request
      const token = authHeader.split(" ")[1];

      // verify token validation
      jwt.verify(
        token,
        process.env.JWT_SECRET_KEY,
        // {igonreExpiration: true},
        function (err, decoded) {
          if (err) {
            return res.status(401).json({
              msg: "Unauthorized message.",
              status: "error",
              code: 403,
            });

            // return res.status(401).json({ error: "Unauthorized message!" });
          }
          // create request userAuth object
          req.userAuth = decoded;

          return next();
        }
      );
    }
  )(req, res, next);
};
