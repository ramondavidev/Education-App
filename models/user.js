var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    password:String,
    info: {type: String, default: "info"},
    avatar: {type: String, default: "https://yt3.ggpht.com/a-/AN66SAxbdlkzEDb2b9NFms3EGHhxDhxZIGoUakquTQ=s900-mo-c-c0xffffffff-rj-k-no"},
    email: {type: String, unique: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date, 
    isAdmin: {type: Boolean, default: false},
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);