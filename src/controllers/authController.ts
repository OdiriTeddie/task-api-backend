import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service.js";

// User Auth Endpoint

export const authRegister = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Credentials Required" });
  }

  try {
    await registerUser(email, password);
    res.status(201).json({ message: "User created!" });
  } catch (error) {
    if (error instanceof Error && error.message === "User Already Exist") {
      return res.status(409).json({ message: error.message });
    }

    res.status(400).json({ error: "User already exists or database error" });
  }
};

export const authLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }

  try {
    const { token, user } = await loginUser(email, password);

    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid Credentials") {
      return res.status(401).json({ message: error.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
