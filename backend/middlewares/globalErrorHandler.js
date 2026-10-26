const config = require("../config/config");

/**
 * Normalises every error into { status, message }.
 *  - Mongoose validation / cast errors are the CLIENT's fault → 400, not 500
 *  - CORS rejections → 403
 *  - Unexpected 5xx messages are hidden in production so internals don't leak
 */
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message;

    if (err.name === "ValidationError" && err.errors) {
        statusCode = 400;
        message = Object.values(err.errors).map((e) => e.message).join(" ");
    } else if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid value for "${err.path}".`;
    } else if (err.code === 11000) {
        statusCode = 400;
        message = "A record with these details already exists.";
    } else if (typeof message === "string" && message.startsWith("CORS:")) {
        statusCode = 403;
    }

    if (statusCode >= 500) {
        console.error(err);
        if (config.nodeEnv === "production") message = "Something went wrong on the server.";
    }

    return res.status(statusCode).json({
        status: statusCode,
        message,
        errorStack: config.nodeEnv === "development" ? err.stack : ""
    });
};

module.exports = globalErrorHandler;
