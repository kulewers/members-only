const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    creator: { type: Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date, required: true },
});

module.exports = mongoose.model("Post", PostSchema);
