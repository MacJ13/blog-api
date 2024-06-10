const mongoose = require("mongoose");
const { MONGO_URI } = require("../configs/db.configs");

async function run() {
  await mongoose.connect(MONGO_URI).catch((err) => console.log(err));

  console.log("connect database");
}

module.exports = run;
