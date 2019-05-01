var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    password:String,
    email: {type: String, unique: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date, 
    isAdmin: {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);