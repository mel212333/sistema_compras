const express = require("express");
const router = express.Router();

// ⚠️ IMPORTANTE: destructuring
const { login } = require("../controllers/authController");

router.post("/login", login);


module.exports = router;
