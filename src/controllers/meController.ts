import { Request, Response } from "express";
import { getCurrentUserById } from "../services/user.service.js";

export const getCurrentUser = async (req: Request, res: Response) => {
  const id = Number(req.user?.userId);

  try {
    const user = await getCurrentUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: "User not found" });
  }
};
