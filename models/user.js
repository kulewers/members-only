const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    membershipStatus: {
        type: String,
        enum: ["guest", "member"],
        required: true,
    },
    admin: Boolean,
});

module.exports = mongoose.model("User", UserSchema);
