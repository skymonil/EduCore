import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { RefreshToken } from "../models/refreshToken.js";

export const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
    },
    process.env.SECRET_KEY,
    { expiresIn: "3m" }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    // ✅ Correct model usage
    token: hashedRefreshToken,
    user: user._id,
    expiresAt,
  });

  return { accessToken, refreshToken };
};
