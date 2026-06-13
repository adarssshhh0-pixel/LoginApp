const express  = require("express");
const router   = express.Router();

router.use("/employees", require("./employee.routes"));

module.exports = router;