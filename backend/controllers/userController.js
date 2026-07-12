const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

const register = async (req, res, next) => {
    try {
        const { name, phone, email, password, role } = req.body;

        if (!name || !phone || !email || !password || !role) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email });
        if (isUserPresent) {
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }

        const user = { name, phone, email, password, role };
        const newUser = User(user);
        await newUser.save();

        const safeUser = newUser.toObject();
        delete safeUser.password;

        res.status(201).json({ success: true, message: "New user created!", data: safeUser });

    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email }).select("+password");
        if (!isUserPresent) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if (!isMatch) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const accessToken = jwt.sign({ _id: isUserPresent._id }, config.accessTokenSecret, {
            expiresIn: '30d'  // JWT itself has a 30d validity window
        });

        // No maxAge → session cookie (expires when the browser is closed).
        // The JWT inside still has a 30-day validity as a secondary safety net
        // (e.g. if another client reads the token), but the cookie itself
        // disappears the moment the browser window/application is closed.
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            secure: process.env.NODE_ENV === 'production'
        });

        const safeUser = isUserPresent.toObject();
        delete safeUser.password;

        res.status(200).json({ success: true, message: "User login successfully!", data: safeUser });

    } catch (error) {
        next(error);
    }
};

const getUserData = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        res.clearCookie('accessToken');
        res.status(200).json({ success: true, message: "User logout successfully!" });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getUserData, logout };
