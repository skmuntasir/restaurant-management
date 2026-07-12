const createHttpError = require("http-errors");

/**
 * Role-based access control middleware.
 * Must run AFTER isVerifiedUser (relies on req.user being populated).
 *
 * Usage: router.post("/", isVerifiedUser, requireRole(["admin"]), addTable)
 *
 * Roles are stored case-sensitively in the User model (e.g. "Admin", "admin"),
 * so comparisons are normalized to lowercase to avoid silent bypass.
 */
const requireRole = (allowedRoles = []) => {
  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(createHttpError(401, "Authentication required!"));
    }

    const userRole = String(req.user.role).toLowerCase();

    if (!normalizedAllowed.includes(userRole)) {
      return next(
        createHttpError(403, "You do not have permission to perform this action!")
      );
    }

    next();
  };
};

module.exports = requireRole;
