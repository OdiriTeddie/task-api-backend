import { Request, Response } from "express";
import { sendError, sendSuccess } from "../lib/httpResponse.js";
import { getCurrentUserById } from "../services/user.service.js";

export const getCurrentUser = async (req: Request, res: Response) => {
  const id = Number(req.user?.userId);

  try {
    const user = await getCurrentUserById(id);

    if (!user) {
      return sendError({
        res,
        statusCode: 404,
        message: "User not found",
      });
    }

    return sendSuccess({
      res,
      message: "Current user retrieved successfully",
      data: user,
    });
  } catch (error) {
    return sendError({
      res,
      statusCode: 400,
      message: "User not found",
    });
  }
};
