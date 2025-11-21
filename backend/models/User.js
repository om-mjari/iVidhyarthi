const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Minimal User Schema per requirement
// Fields: User_Id [PK], Email [Unique], Password_Hash, Role, Date_Joined
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    role: {
      type: String,
      enum: ["student", "instructor", "registrar", "admin"],
      default: "student",
    },
    dateJoined: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
  }
);

// Alias virtual for User_Id
userSchema.virtual("User_Id").get(function () {
  return this._id;
});

// Backwards compatibility virtual to accept `password` assignments from existing code
userSchema
  .virtual("password")
  .set(function (plain) {
    this._plainPassword = plain;
  })
  .get(function () {
    return undefined;
  });

// Hash plain password into passwordHash when `password` virtual used or when passwordHash modified
// Ensure passwordHash is set BEFORE validation runs
userSchema.pre("validate", async function (next) {
  try {
    // Case 1: plain password provided via virtual
    if (this._plainPassword) {
      this.passwordHash = await bcrypt.hash(this._plainPassword, 12);
      this._plainPassword = undefined;
      return next();
    }
    // Case 2: API set legacy `password` field (already hashed or plain)
    const legacyPassword = this._doc && this._doc.password;
    if (!this.passwordHash && legacyPassword) {
      if (typeof legacyPassword === "string" && legacyPassword.startsWith("$2")) {
        // Looks like bcrypt hash, accept as-is
        this.passwordHash = legacyPassword;
      } else if (typeof legacyPassword === "string" && legacyPassword.length > 0) {
        // Hash plain legacy password
        this.passwordHash = await bcrypt.hash(legacyPassword, 12);
      }
      delete this._doc.password;
      return next();
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove sensitive fields from output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
