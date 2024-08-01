const { validationResult } = require("express-validator");

module.exports = (req, res, next) => {
  const result = validationResult(req);

  // get validation errors if exists
  // validate request body data
  if (!result.isEmpty()) {
    const errors = result.errors.map((err) => err.msg);

    return res.status(400).json({ err: errors });
  }

  next();
};
