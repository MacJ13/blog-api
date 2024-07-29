require("dotenv").config();

const PORT = process.env.PORT || 3000;

const POST_TITLE_LENGTH = 4;

const POST_BODY_LENGTH = 8;

const POSTS_PER_PAGE = 12;

const COMMENT_LENGTH = 3;

const NICKNAME_LENGTH = 3;

const PASSWORD_LENGTH = 5;

module.exports = {
  PORT,
  POST_TITLE_LENGTH,
  POST_BODY_LENGTH,
  POSTS_PER_PAGE,
  COMMENT_LENGTH,
  NICKNAME_LENGTH,
  PASSWORD_LENGTH,
};
