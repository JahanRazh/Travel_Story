// Import necessary packages and modules
require("dotenv").config();
const mongoose = require("mongoose");
const config = require("./config/config.json");
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import routes
const userRoutes = require("./routes/userRoutes");
const travelStoryRoutes = require("./routes/travelStoryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// Connect to the MongoDB database
mongoose.connect(config.connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Initialize the Express application
const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// Static file directories
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/stories", travelStoryRoutes);
app.use("/api/uploads", uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: true, message: "Internal Server Error" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the Express app for use in other modules (e.g., testing)
module.exports = app;