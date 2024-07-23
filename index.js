const express = require("express");
const createError = require("http-errors");

const app = express();

const passport = require("passport");

const { PORT } = require("./configs/main.config");

const connectDB = require("./services/db.service");

// const indexRouter = require("./routes/api/index.route");
// const userRouter = require("./routes/api/user.route");
// const postRouter = require("./routes/api/post.route");

const apiRouter = require("./routes/api/api.route");

const { jwt_strategy } = require("./services/passport.jwt.service");

const cookieParser = require("cookie-parser");

connectDB();

passport.use(jwt_strategy);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use("/", indexRouter);
// app.use("/user", userRouter);
// app.use("/post", postRouter);
app.use("/api", apiRouter);

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
  console.log(`run server on local host: ${PORT}`);
});
