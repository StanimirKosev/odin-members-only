const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = mongoose.model(
  "messageSchema",
  new Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: String,
    author: String,
  })
);

module.exports = messageSchema;
