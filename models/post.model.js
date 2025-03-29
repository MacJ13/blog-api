const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: { type: String, required: true, minLength: 3 },
  content: { type: String, required: true, minLength: 8 },
  author: { type: Schema.Types.ObjectId, ref: "user", required: true },
  timeStamp: { type: Date, default: Date.now },
  hidden: { type: Boolean, default: false },
});

module.exports = mongoose.model("post", postSchema);
