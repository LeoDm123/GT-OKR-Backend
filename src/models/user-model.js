const { Schema, model } = require("mongoose");

const userSchema = Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String, required: false },
  resetToken: { type: String, required: false },
  resetTokenExpiration: { type: Number, required: false },
  personalData: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
  role: {
    type: String,
    default: "user",
  },
  imagen: { type: String, required: false },
});

module.exports = model("User", userSchema);
