const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");

const isVerifiedUser = async (req, res, next) => {
    try {
        // Cookie first (desktop / same-site). Phone browsers (iOS Safari, Chrome
        // on Android, Brave...) block the cross-site cookie set by the API host
        // when the app is served from a different domain, so the app also sends
        // the same token as `Authorization: Bearer <token>`.
        const header = req.headers.authorization || "";
        const bearer = /^Bearer\s+(.+)$/i.test(header) ? header.replace(/^Bearer\s+/i, "").trim() : null;
        const accessToken = (req.cookies && req.cookies.accessToken) || bearer;

        if (!accessToken) {
            const error = createHttpError(401, "Please provide token!");
            return next(error);
        }

        const decodeToken = jwt.verify(accessToken, config.accessTokenSecret);

        const user = await User.findById(decodeToken._id);
        if (!user) {
            const error = createHttpError(401, "User not exist!");
            return next(error);
        }

        // A sign-up that is still waiting for (or was refused) admin approval
        // can never use the API, even with a valid token.
        if (user.status === "pending" || user.status === "rejected") {
            return next(createHttpError(401, "Your account is not approved."));
        }

        req.user = user;
        next();

    } catch (error) {
        const err = createHttpError(401, "Invalid Token!");
        next(err);
    }
};

module.exports = { isVerifiedUser };
