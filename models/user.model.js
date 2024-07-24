const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true, minLength: 8 },
  nickname: { type: String, required: true, minLength: 3 },
  password: { type: String, required: true },
  favorites: [{ type: Schema.Types.ObjectId, ref: "post" }],
  refreshToken: [{ type: String }],
});

module.exports = mongoose.model("user", userSchema);
