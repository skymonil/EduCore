import {User} from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokens } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { validateRegistration, validatelogin } from '../utils/validation.js';
import logger from '../utils/logger.js';
import { RefreshToken } from "../models/refreshToken.js";
import jwt from 'jsonwebtoken'
import { csrfSynchronisedProtection, generateToken } from "../utils/csurfConfig.js";
export const register = async (req,res) => {
    try {
         logger.info('Registration endpoint Hit')
         logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);
        
       const {error} = validateRegistration(req.body)
      
        
        if(error){
            logger.warn('Validation Error',error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }
        const {name, email, password} = req.body; // patel214
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                success:false,
                message:"User already exist with this email."
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password:hashedPassword
        });
        
        return res.status(201).json({
            success:true,
            message:"Account created successfully.",
            user
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to register"
        })
    }
}
export const login = async (req, res) => {
  try {
     logger.info('Login endpoint Hit')
     logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);
      const {error} = validatelogin(req.body)
      if(error){
            logger.warn('Validation Error',error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }

    const { email, password } = req.body;


    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
         logger.warn(`Login attempt failed for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    
     const { accessToken, refreshToken } = await generateTokens(user);
    const csrfToken = generateToken(req)
     res.cookie("accessToken", accessToken, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie (XSS protection)
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'Lax', // Mitigates CSRF attacks (prevents sending cookie with cross-site requests unless it's a top-level navigation)
            maxAge: 15 * 60 * 1000, // 3 minutes for access token (matches expiresIn in generateTokens)
            path: '/', // Accessible from all paths
        });

        // Set Refresh Token in a separate HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie (XSS protection)
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'Lax', // Mitigates CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token (matches expiry in generateTokens)
            path: '/', // Only accessible by your refresh token endpoint (more secure)
        });

    return res.status(200).json({
      success: true,
      message: `Welcome back ${user.name}`,
      user,
      csrfToken
    })

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

export const logout = async (req, res) => {
  logger.info("Logout endpoint hit");

  const accessTokenFromCookie = req.cookies.accessToken;
  const refreshTokenFromCookie = req.cookies.refreshToken;

  // Always clear cookies regardless of whether tokens were found.
  // This is the primary action for a logout.
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
  });
  
  // If no refresh token was present, the work is done.
  if (!refreshTokenFromCookie) {
    logger.info("No refresh token found, cookies cleared. Logout complete.");
    return res.status(200).json({ message: "Logged out successfully." });
  }

  // Attempt to get the userId from the accessToken, which is a JWT.
  let userId;
  try {
    const decoded = jwt.verify(accessTokenFromCookie, process.env.SECRET_KEY);
    userId = decoded.userId;
    logger.info(`Extracted userId from accessToken: ${userId}`);
  } catch (err) {
    // If the access token is invalid, we can't get the userId,
    // but the cookies are already cleared so the user is logged out.
    logger.warn("Failed to decode accessToken. User is logged out, but DB entry may remain.", err.message);
    return res.status(200).json({ message: "Logged out successfully." });
  }

  // If userId was successfully extracted, attempt to invalidate the refresh token in the DB
  if (userId) {
    try {
      // Find the refresh token entry for this specific user.
      const dbRefreshToken = await RefreshToken.findOne({ userId: userId });

      if (dbRefreshToken) {
        // Use bcrypt.compare to check if the un-hashed token from the cookie
        // matches the hashed version in the database.
        const isMatch = await bcrypt.compare(refreshTokenFromCookie, dbRefreshToken.token);

        if (isMatch) {
          // If they match, delete the entry from the database.
          await RefreshToken.deleteOne({ _id: dbRefreshToken._id });
          logger.info(`Refresh token invalidated for user ${userId} on logout.`);
        } else {
          logger.warn(`Refresh token from cookie does not match DB for user ${userId}`);
        }
      } else {
        logger.warn(`No refresh token found in DB for user ${userId}`);
      }
    } catch (dbError) {
      logger.error("Database operation failed during logout:", dbError.message);
    }
  }

  // Final success response.
  return res.status(200).json({ message: "Logged out successfully." });
};


export const getUserProfile = async (req,res) => {
    try {
        logger.info('getUserProfile endpoint Hit')
     logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);
        const userId = req.id;
        const user = await User.findById(userId).select("-password").populate("enrolledCourses");
        if(!user){
            return res.status(404).json({
                message:"Profile not found",
                success:false
            })
        }
        return res.status(200).json({
            success:true,
            user
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to load user"
        })
    }
}
export const updateProfile = async (req,res) => {
    try {
        logger.info('updateProfile endpoint Hit')
     logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);
        const userId = req.id;
        const {name} = req.body;
        const profilePhoto = req.file;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message:"User not found",
                success:false
            }) 
        }
        // extract public id of the old image from the url is it exists;
        if(user.photoUrl){
            const publicId = user.photoUrl.split("/").pop().split(".")[0]; // extract public id
            deleteMediaFromCloudinary(publicId);
        }

        // upload new photo
        const cloudResponse = await uploadMedia(profilePhoto.path);
        const photoUrl = cloudResponse.secure_url;

        const updatedData = {name, photoUrl};
        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {new:true}).select("-password");

        return res.status(200).json({
            success:true,
            user:updatedUser,
            message:"Profile updated successfully."
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to update profile"
        })
    }
}


export const refreshAccessToken = async (req, res) => {
    try {
        logger.info("Refresh token endpoint hit");
        const refreshTokenFromCookie = req.cookies.refreshToken;
        
        if (!refreshTokenFromCookie) {
            logger.warn("Refresh token missing from cookie.");
            return res.status(401).json({ message: "Refresh token missing" });
        }

        let userId;
        try {
            // Verify the JWT refresh token to get the user ID
            const decoded = jwt.verify(refreshTokenFromCookie, process.env.SECRET_KEY);
            userId = decoded.userId;
        } catch (err) {
            logger.warn("Invalid refresh token:", err.message);
            // If the token is invalid or expired, clear cookies and force a new login
            res.clearCookie("accessToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Lax", path: "/" });
            res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Lax", path: "/" });
            return res.status(403).json({ message: "Invalid or expired refresh token. Please log in again." });
        }

        // Find the user's stored refresh token in the database using the userId
        const dbRefreshToken = await RefreshToken.findOne({ userId });

        // Check if a token was found and if it matches the one from the cookie
        if (!dbRefreshToken || !(await bcrypt.compare(refreshTokenFromCookie, dbRefreshToken.token))) {
            logger.warn(`Refresh token mismatch or not found for user ${userId}. Invalidating token.`);
            // Invalidate the token from the DB to prevent replay attacks
            if (dbRefreshToken) {
                await RefreshToken.deleteOne({ _id: dbRefreshToken._id });
            }
            res.clearCookie("accessToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Lax", path: "/" });
            res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Lax", path: "/" });
            return res.status(403).json({ message: "Invalid refresh token. Please log in again." });
        }

        // Token is valid and matches the DB. Now generate new tokens.
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        
        // Generate a new access token AND a new refresh token (token rotation)
        const { accessToken, refreshToken } = await generateTokens(user);

        // Update cookies with the new tokens
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 15 * 60 * 1000,
            path: '/',
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/',
        });

        logger.info(`Access token refreshed successfully for user ${userId}.`);
        return res.status(200).json({
            success: true,
            message: "Access token refreshed",
        });

    } catch (error) {
        logger.error("Refresh token error:", error);
        return res.status(500).json({ message: "Failed to refresh token" });
    }
};