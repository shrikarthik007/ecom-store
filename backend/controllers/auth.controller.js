import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

const generateTokens = (id) => {
  const accessToken = jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
};

export const signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        error: "User already exists",
      });
    }
    const user = await User.create({
      name,
      email,
      password,
    });

    const { accessToken, refreshToken } = user.generateTokens(user._id);

    res.status(201).json({
      user,
      message: "Signup successful",
    });
  } catch (error) {
    res.status(500).json({
      error: "Server error",
    });
  }
};

export const login = async (req, res) => {
  res.send("Hello from auth controller login");
};

export const logout = async (req, res) => {
  res.send("Hello from auth controller logout");
};
