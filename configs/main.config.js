require("dotenv").config();

const PORT = process.env.PORT || 3000;

const POST_TITLE_LENGTH = 4;

const POST_BODY_LENGTH = 8;

module.exports = { PORT, POST_TITLE_LENGTH, POST_BODY_LENGTH };
