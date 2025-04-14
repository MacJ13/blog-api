const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  comment: { type: String, required: true, minLength: 3 },
  post: { type: Schema.Types.ObjectId, ref: "post", required: true },
  author: { type: Schema.Types.ObjectId, ref: "user", required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("comment", commentSchema);
