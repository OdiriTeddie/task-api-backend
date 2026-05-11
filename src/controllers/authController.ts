import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../prismaClient.js";
const JWT_SECRET = process.env.JWT_SECRET as string;

const saltRounds = 10;

// User Auth Endpoint

export const authRegister = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Credentials Required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User Already Exist" });
    }
    const hashPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.create({
      data: {
        email: email,
        password: hashPassword,
      },
    });
    res.status(201).json({ message: "User created!" });
  } catch (error) {
    res.status(400).json({ error: "User already exists or database error" });
  }
};

export const authLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ message: "Invalid Credentials" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
