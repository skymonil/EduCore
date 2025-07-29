import {User} from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokens } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { validateRegistration, validatelogin } from '../utils/validation.js';
import logger from '../utils/logger.js';


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

     res.cookie("accessToken", accessToken, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie (XSS protection)
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'Lax', // Mitigates CSRF attacks (prevents sending cookie with cross-site requests unless it's a top-level navigation)
            maxAge: 3 * 60 * 1000, // 3 minutes for access token (matches expiresIn in generateTokens)
            path: '/', // Accessible from all paths
        });

        // Set Refresh Token in a separate HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Prevents client-side JavaScript from accessing the cookie (XSS protection)
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'Lax', // Mitigates CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token (matches expiry in generateTokens)
            path: '/api/auth/refresh', // Only accessible by your refresh token endpoint (more secure)
        });

    return res.status(200).json({
      success: true,
      message: `Welcome back ${user.name}`,
      user,
    })

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

export const logout = async (_,res) => {
    try {
        logger.info('Logout endpoint Hit')
     logger.info(`Request body: ${JSON.stringify(req.body, null, 2)}`);
        return res.status(200).cookie("token", "", {maxAge:0}).json({
            message:"Logged out successfully.",
            success:true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"Failed to logout"
        }) 
    }
}
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