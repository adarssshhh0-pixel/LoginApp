const express    = require("express");
const router     = express.Router();
const controller = require("../../controllers/employee.controller");
const auth       = require("../../../middleware/auth");
const roleMiddle = require("../../../middleware/role");
const { validateCreate, validateUpdate } = require("../../validators/employee.validator");

router.get("/",            auth, controller.getAll);
router.get("/:id",         auth, controller.getOne);
router.post("/",           auth, roleMiddle("admin","hr"), validateCreate, controller.create);
router.put("/:id",         auth, roleMiddle("admin","hr"), validateUpdate, controller.update);
router.delete("/:id",      auth, roleMiddle("admin","hr"), controller.remove);

module.exports = router;