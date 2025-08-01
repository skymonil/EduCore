import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res.status(401).json({
        message: "Access token missing",
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY); // <-- throws error if expired
    req.userId = decode.userId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired" }); // triggers refresh
    }

    return res.status(403).json({
      message: "Invalid token",
      success: false,
    });
  }
};

export default isAuthenticated;
