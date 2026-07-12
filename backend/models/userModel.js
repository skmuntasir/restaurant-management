const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message: "Email must be in valid format!"
        }
    },
    phone: {
        type: String,
        required: true,
        validate: {
            // Bangladeshi mobile numbers: 11 digits, starting with 01
            validator: function (v) {
                return /^01\d{9}$/.test(v);
            },
            message: "Phone number must be a valid 11-digit Bangladeshi mobile number (e.g. 01712345678)!"
        }
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'cashier', 'Admin', 'Cashier']
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("User", userSchema);
