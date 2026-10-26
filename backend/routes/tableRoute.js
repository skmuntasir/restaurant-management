const express = require("express");
const { addTable, getTables, updateTable, deleteTable, mergeTables, releaseMergedTable } = require("../controllers/tableController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const requireRole = require("../middlewares/requireRole");
const router = express.Router();

// Any logged-in staff can view tables and create orders against them.
// Direct table mutation (status/currentOrder overrides), merging, and
// releasing merged tables are admin-only — these affect order integrity.
router.route("/").post(isVerifiedUser, requireRole(["admin"]), addTable).get(isVerifiedUser, getTables);

// Specific paths registered before the generic "/:id" pattern.
router.route("/merge").post(isVerifiedUser, requireRole(["admin"]), mergeTables);
router.route("/:id/release-merge").post(isVerifiedUser, requireRole(["admin"]), releaseMergedTable);

router.route("/:id").put(isVerifiedUser, requireRole(["admin"]), updateTable)
  .delete(isVerifiedUser, requireRole(["admin"]), deleteTable);

module.exports = router;
