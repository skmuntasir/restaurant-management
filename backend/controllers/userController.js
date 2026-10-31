const mongoose = require("mongoose");
const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

// Roles are stored title-cased for new accounts; older accounts may be stored
// lowercase, so every lookup below matches case-insensitively.
const ROLE_ADMIN = "Admin";
const ROLE_CASHIER = "Cashier";
const ADMIN_FILTER = { role: { $regex: /^admin$/i } };
const MIN_PASSWORD_LENGTH = 6;

// Sign-up approval states (accounts without a stored status count as approved).
const STATUS_PENDING = "pending";
const STATUS_APPROVED = "approved";
const STATUS_REJECTED = "rejected";
const PENDING_FILTER = { status: STATUS_PENDING };

// Case-insensitive email matching ("Rian@x.com" and "rian@x.com" are the same
// person) without needing to migrate existing user documents.
const EMAIL_COLLATION = { locale: "en", strength: 2 };

/**
 * Cookie flags that work both locally and when the frontend (Vercel) and
 * backend (Render) live on different domains.
 *  - cross-site cookies REQUIRE `SameSite=None; Secure`
 *  - we detect HTTPS from the request itself (trust proxy is on in app.js),
 *    so it keeps working even if NODE_ENV isn't set to "production" on the host.
 * The same options must be used when clearing the cookie, otherwise the
 * browser ignores the deletion in cross-site setups.
 */
const cookieOptions = (req) => {
  const secure = req.secure || config.nodeEnv === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
  };
};

// Tells the sign-up screen whether this will be the very first (main admin)
// account. (Also doubles as a cheap "wake up the server" ping for free-tier hosting.)
const registerConfig = async (req, res, next) => {
  try {
    const hasUsers = Boolean(await User.exists({}));
    res.status(200).json({ success: true, data: { firstUser: !hasUsers } });
  } catch (error) {
    next(error);
  }
};

// Atomically claims the "first account" slot so two simultaneous sign-ups on
// an empty database can't both become main admin. Returns true if we got it.
const claimFirstAdminSlot = async () => {
  const locks = mongoose.connection.collection("system_locks");
  const result = await locks.findOneAndUpdate(
    { _id: "first-admin-claim" },
    { $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: "before" }
  );
  // Driver versions differ: v6+ returns the doc (or null), older ones { value }.
  const previous = result && Object.prototype.hasOwnProperty.call(result, "value") ? result.value : result;
  return !previous;
};

const releaseFirstAdminSlot = async () => {
  try {
    await mongoose.connection.collection("system_locks").deleteOne({ _id: "first-admin-claim" });
  } catch (_) { /* best effort */ }
};

const register = async (req, res, next) => {
    let claimedFirstSlot = false;
    try {
        // NOTE: any `role` / `adminCode` sent by the client is deliberately ignored.
        // The server alone decides the role (see below).
        const { name, phone, password } = req.body;
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : req.body.email;

        if (!name || !phone || !email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            return next(createHttpError(400, "Email must be in valid format!"));
        }

        if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
            return next(createHttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters long!`));
        }

        const isUserPresent = await User.findOne({ email }).collation(EMAIL_COLLATION).select("+password");
        if (isUserPresent) {
            if (isUserPresent.status === STATUS_PENDING) {
                return next(createHttpError(400, "A sign-up request for this email is already waiting for admin approval."));
            }
            if (isUserPresent.status === STATUS_REJECTED) {
                // A declined request can be re-submitted: refresh the details
                // and put it back in the admin's queue.
                isUserPresent.name = String(name).trim();
                isUserPresent.phone = phone;
                isUserPresent.password = password; // re-hashed by the pre-save hook
                isUserPresent.status = STATUS_PENDING;
                await isUserPresent.save();

                const resubmitted = isUserPresent.toObject();
                delete resubmitted.password;
                return res.status(201).json({
                    success: true,
                    message: "Request sent! An admin will review it shortly.",
                    data: resubmitted,
                });
            }
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }

        // First account ever → main admin (approved straight away).
        // Everyone after → cashier, but only once an admin approves them.
        let role = ROLE_CASHIER;
        let status = STATUS_PENDING;
        if (!(await User.exists({}))) {
            claimedFirstSlot = await claimFirstAdminSlot();
            if (claimedFirstSlot) {
                role = ROLE_ADMIN;
                status = STATUS_APPROVED;
            }
        }

        const user = { name: String(name).trim(), phone, email, password, role, status };
        const newUser = User(user);
        await newUser.save();

        const safeUser = newUser.toObject();
        delete safeUser.password;

        res.status(201).json({
            success: true,
            message: status === STATUS_PENDING
                ? "Request sent! An admin will review it shortly."
                : "Main admin account created!",
            data: safeUser,
        });

    } catch (error) {
        // If the very first account failed to save, free the slot so a retry works.
        if (claimedFirstSlot) await releaseFirstAdminSlot();
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { password } = req.body;
        const email = typeof req.body.email === "string" ? req.body.email.trim() : req.body.email;

        if (!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email }).collation(EMAIL_COLLATION).select("+password");
        if (!isUserPresent) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if (!isMatch) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        // Password is right, but the account may still be waiting for an admin.
        // (Checked after the password so the status isn't revealed to strangers.)
        if (isUserPresent.status === STATUS_PENDING) {
            return next(createHttpError(403, "Your sign-up is still waiting for admin approval. Please try again once it's approved."));
        }
        if (isUserPresent.status === STATUS_REJECTED) {
            return next(createHttpError(403, "Your sign-up request was declined. Please contact an admin."));
        }

        const accessToken = jwt.sign({ _id: isUserPresent._id }, config.accessTokenSecret, {
            expiresIn: '30d'  // JWT itself has a 30d validity window
        });

        // No maxAge → session cookie (expires when the browser is closed).
        // The JWT inside still has a 30-day validity as a secondary safety net
        // (e.g. if another client reads the token), but the cookie itself
        // disappears the moment the browser window/application is closed.
        res.cookie('accessToken', accessToken, cookieOptions(req));

        const safeUser = isUserPresent.toObject();
        delete safeUser.password;

        // `token` lets the frontend authenticate via an Authorization header on
        // browsers that refuse the cross-site cookie (all phones, effectively).
        res.status(200).json({ success: true, message: "User login successfully!", data: safeUser, token: accessToken });

    } catch (error) {
        next(error);
    }
};

const getUserData = async (req, res, next) => {
    try {
        // isVerifiedUser already loaded this user — no second DB round-trip needed.
        res.status(200).json({ success: true, data: req.user });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        res.clearCookie('accessToken', cookieOptions(req));
        res.status(200).json({ success: true, message: "User logout successfully!" });
    } catch (error) {
        next(error);
    }
};


// ───────── Team management (admin only — enforced by requireRole on the routes) ─────────

const isAdminRole = (role) => String(role || "").toLowerCase() === "admin";

const countAdmins = () => User.countDocuments(ADMIN_FILTER);

const listUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select("name email phone role status createdAt").sort({ createdAt: 1 });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

const updateUserRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return next(createHttpError(400, "Invalid user id!"));

        const requested = String(req.body.role || "").toLowerCase();
        if (!["admin", "cashier"].includes(requested)) {
            return next(createHttpError(400, "Role must be either Admin or Cashier!"));
        }
        const newRole = requested === "admin" ? ROLE_ADMIN : ROLE_CASHIER;

        const target = await User.findById(id);
        if (!target) return next(createHttpError(404, "User not found!"));

        if (target.status === STATUS_PENDING || target.status === STATUS_REJECTED) {
            return next(createHttpError(400, "Approve this sign-up before changing their role."));
        }

        // Safeguard: the last remaining admin can never be demoted.
        if (isAdminRole(target.role) && newRole === ROLE_CASHIER && (await countAdmins()) <= 1) {
            return next(createHttpError(400, "You can't demote the last remaining admin."));
        }

        target.role = newRole;
        await target.save();

        // Re-check after the write: if a concurrent request just removed the
        // other admin(s), undo this demotion rather than leave zero admins.
        if (newRole === ROLE_CASHIER && (await countAdmins()) === 0) {
            target.role = ROLE_ADMIN;
            await target.save();
            return next(createHttpError(400, "You can't demote the last remaining admin."));
        }

        res.status(200).json({ success: true, message: `${target.name} is now ${newRole === ROLE_ADMIN ? "an Admin" : "a Cashier"}.`, data: target });
    } catch (error) {
        next(error);
    }
};

// Sign-up requests waiting for a decision (drives the admin's badge + queue).
const listPendingSignups = async (req, res, next) => {
    try {
        const users = await User.find(PENDING_FILTER).select("name email phone createdAt").sort({ createdAt: 1 });
        res.status(200).json({ success: true, data: { count: users.length, users } });
    } catch (error) {
        next(error);
    }
};

const approveSignup = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return next(createHttpError(400, "Invalid user id!"));

        const target = await User.findById(id);
        if (!target) return next(createHttpError(404, "User not found!"));

        if (target.status !== STATUS_PENDING && target.status !== STATUS_REJECTED) {
            return next(createHttpError(400, `${target.name} is already approved.`));
        }

        target.status = STATUS_APPROVED;
        target.role = ROLE_CASHIER; // new staff always start as Cashier; promote later from Team
        await target.save();

        res.status(200).json({ success: true, message: `${target.name} was approved as a Cashier.`, data: target });
    } catch (error) {
        next(error);
    }
};

const rejectSignup = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return next(createHttpError(400, "Invalid user id!"));

        const target = await User.findById(id);
        if (!target) return next(createHttpError(404, "User not found!"));

        if (target.status !== STATUS_PENDING) {
            return next(createHttpError(400, target.status === STATUS_REJECTED
                ? `${target.name}'s request was already declined.`
                : `${target.name} is already an active user. Use Remove instead.`));
        }

        target.status = STATUS_REJECTED;
        await target.save();

        res.status(200).json({ success: true, message: `${target.name}'s request was declined.`, data: target });
    } catch (error) {
        next(error);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return next(createHttpError(400, "Invalid user id!"));

        const target = await User.findById(id);
        if (!target) return next(createHttpError(404, "User not found!"));

        // Safeguard: the last remaining admin can never be removed.
        if (isAdminRole(target.role) && (await countAdmins()) <= 1) {
            return next(createHttpError(400, "You can't remove the last remaining admin."));
        }

        await User.deleteOne({ _id: target._id });

        if (isAdminRole(target.role) && (await countAdmins()) === 0) {
            // A concurrent removal beat us to it — restore this admin.
            await User.collection.insertOne(target.toObject());
            return next(createHttpError(400, "You can't remove the last remaining admin."));
        }

        res.status(200).json({ success: true, message: `${target.name} was removed.` });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, getUserData, logout, registerConfig, listUsers, listPendingSignups, approveSignup, rejectSignup, updateUserRole, deleteUser };
