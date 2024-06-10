require("dotenv").config();

const MONGO_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@myatlasclusteredu.5v0vras.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

module.exports = { MONGO_URI };
