const { validationResult } = require("express-validator");

module.exports = (req, res, next) => {
  const result = validationResult(req);

  // get validation errors if exists
  // validate request body data
  if (!result.isEmpty()) {
    const errorObject = {};

    result.errors.forEach((err) => {
      errorObject[err.path] = {
        msg: err.msg,
        value: err.value,
        path: err.path,
      };
    });

    // const errors = result.errors.map((err) => ({
    //   value: err.value,
    //   path: err.path,
    //   msg: err.msg,
    // }));

    return res
      .status(409)
      .json({ error: errorObject, status: "error", code: 409 });
  }

  next();
};
