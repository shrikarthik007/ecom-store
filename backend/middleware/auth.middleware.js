import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({ error: "You need to be logged in" });
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const adminRoute = async (req, res, next) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    next();
  } catch (error) {
    console.log(error, "error in adminRoute");
    return res.status(500).json({ error: error.message });
  }
};
