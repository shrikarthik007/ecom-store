import express from "express";
import {
  signup,
  login,
  logout,
  refreshToken,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", logout);
router.post("/refresh-token", refreshToken);

export default router;

// fABpwMxeYDTwzrZJ
