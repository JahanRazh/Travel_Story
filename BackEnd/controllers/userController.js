const User = require("../models/user.model");

// Get user details
const getUser = async (req, res) => {
  try {
    const { userId } = req.user;

    // Find the user by userId in the database
    const isUser = await User.findOne({ _id: userId });

    // If the user is not found, return a 401 Unauthorized status
    if (!isUser) {
      return res.sendStatus(401);
    }

    // Return the user details in the response
    return res.json({
      user: isUser,
      message: "",
    });
  } catch (err) {
    console.error("Error fetching user:", err.message);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
};

module.exports = {
  getUser
};