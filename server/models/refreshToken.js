import mongoose from "mongoose"
const refreshTokenSchema = new mongoose.Schema({
    token:{
        type: String,
        required: true,
        unique: true
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        requried: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    
}, {timestamps: true})

refreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0})

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
