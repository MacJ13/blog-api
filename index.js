const express = require("express");
const createError = require("http-errors");

const app = express();

const { PORT } = require("./configs/main.config");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", function (req, res) {
  res.status(200).json({ message: "Hello world" });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.errors = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(PORT, () => {
  console.log(`run server on local host: ${3000}`);
});
