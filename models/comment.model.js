const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  description: { type: String, required: true, minLength: 3 },
  post: { type: Schema.Types.ObjectId, ref: "post" },
  author: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
