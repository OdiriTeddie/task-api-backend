import { Request, Response } from "express";
import prisma from "../../prismaClient.js";

// interface AuthRequest extends Request {
//   user: {
//     userId: string | number;
//     email: string;
//   };
// }

export const getCurrentUser = async (req: Request, res: Response) => {
  const id = Number(req.user?.userId);
  const email = req.user?.email;

  try {
    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, email: true, createdAt: true },
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: "User not found" });
  }
};
