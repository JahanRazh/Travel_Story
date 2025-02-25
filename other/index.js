// Import necessary packages and modules
require("dotenv").config(); // Load environment variables from .env file
const mongoose = require("mongoose"); // MongoDB ODM (Object Data Modeling) library
const config = require("../BackEnd/config.json"); // Configuration file containing database connection string
const bcrypt = require("bcrypt"); // Library for hashing passwords
const express = require("express"); // Web framework for Node.js
const cors = require("cors"); // Middleware to enable CORS (Cross-Origin Resource Sharing)
const jwt = require("jsonwebtoken"); // Library for creating and verifying JSON Web Tokens (JWT)

const upload = require("../BackEnd/multer"); // Import the multer instance
const fs = require("fs"); // File system module to interact with the file system
const path = require("path"); // Module to work with file paths

const User = require("../BackEnd/models/user.model"); // Import the User model
const TravelStory = require("../BackEnd/models/travelStory.model"); // Import the TravelStory model
const { authenticateToken } = require("../BackEnd/utilities"); // Import the authentication middleware

// Connect to the MongoDB database using the connection string from config.json
mongoose.connect(config.connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

// Initialize the Express application
const app = express();
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cors({ origin: "*" })); // Enable CORS for all origins

// Route to create a new user account
app.post("/create-account", async (req, res) => {
  try {
    const { fullName, email, password } = req.body; // Extract user details from the request body

    // Validate that all required fields are provided
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: true, message: "All fields are required" });
    }

    // Check if a user with the same email already exists
    const isUser = await User.findOne({ email });
    if (isUser) {
      return res.status(400).json({ error: true, message: "User already exists" });
    }

    // Hash the password using bcrypt with a salt factor of 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance with the provided details
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    // Save the new user to the database
    await user.save();

    // Generate a JWT access token for the new user
    const accessToken = jwt.sign(
      { userId: user._id }, // Payload containing the user's ID
      process.env.ACCESS_TOKEN_SECRET, // Secret key for signing the token
      { expiresIn: "72h" } // Token expiration time
    );

    // Return a success response with the user details and access token
    return res.status(201).json({
      error: false,
      user: { fullName: user.fullName, email: user.email },
      accessToken,
      message: "Account created successfully",
    });
  } catch (err) {
    // Handle any errors that occur during account creation
    console.error("Error during account creation:", err.message);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

// Route to handle user login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body; // Extract email and password from the request body

    // Validate that both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: true, message: "All fields are required" });
    }

    // Find the user by email in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: true, message: "User does not exist" });
    }

    // Compare the provided password with the hashed password in the database
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: true, message: "Invalid password" });
    }

    // Generate a JWT access token for the authenticated user
    const accessToken = jwt.sign(
      { userId: user._id }, // Payload containing the user's ID
      process.env.ACCESS_TOKEN_SECRET, // Secret key for signing the token
      { expiresIn: "72h" } // Token expiration time
    );

    // Return a success response with the user details and access token
    return res.status(200).json({
      error: false,
      user: { fullName: user.fullName, email: user.email },
      accessToken,
      message: "Login successful",
    });
  } catch (err) {
    // Handle any errors that occur during login
    console.error("Error during login:", err.message);
    return res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

// Route to get user details (requires authentication)
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user; // Extract userId from the authenticated user's token payload

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
});



//Router to handle image upload you must instral multer command in terminal

app.post("/image-upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: "No file uploaded" });
    } 
    const image = req.file;
    const imageUrl = `http://localhost:3000/uploads/${image.filename}`;

    res.status(201).json({ imageUrl, message: "Image uploaded successfully" });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

//Delete an  image from uploads directory
app.delete("/delete-image", async (req, res) => {
  const { imageUrl } = req.query;
  if (!imageUrl) {
    return res.status(400).json({ error: true, message: "ImageUrl parameter is required" });
  }
  try {
    // Extract the filename from the imageUrl
    const filename = path.basename(imageUrl);
     // Define the file path
    const filePath = path.join(__dirname, "uploads", filename);
    // Check if the file exists
    if (fs.existsSync(filePath)){
      fs.unlinkSync(filePath);// Delete the file
      res.status(200).json({ message: "Image deleted successfully" });
    } else {
      res.status(404).json({ error: true, message: "Image not found" });
    }
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//server static files from the uploads and assets directory

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

//add  Travel Story
app.post("/add-travel-story", authenticateToken, async (req, res) => {
  const { title,story,visitedLocations,ImageUrl,visitedDate } = req.body; // Extract user details from the request body

  const { userId } = req.user; // Extract userId from the authenticated user's token payload
  
  // Validate that all required fields are provided
  if (!title || !story || !visitedLocations || !ImageUrl || !visitedDate) {
    return res.status(400).json({ error: true, message: "All fields are required" });
  }
 
  //convert visitedDate from milliseconds to Date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));
  
  try {
    const travelStory = new TravelStory({
      title,
      story,
      visitedLocations,
      userId,
      ImageUrl,
      visitedDate: parsedVisitedDate,
    });
    await travelStory.save();
    res.status(201).json({ story: travelStory, message: "Travel story added successfully" });
  } catch (error) {
    res.status(400).json({ error: true, message:error.message });
  }
  // Create a new travel story instance with the provided details
});

//Get all travel stories

app.get("/get-all-travel-stories", authenticateToken, async (req, res) => {
  const { userId } = req.user; // Extract userId from the authenticated user's token payload
  try {
    const travelStories = await TravelStory.find({ userId: userId }).sort({ isFavourite: -1 });
    res.status(201).json({ travelStories, message: "Travel stories fetched successfully" });
  } catch (error) {
    res.status(400).json({ error: true, message: error.message });
  }
});

//edit Travel Story
app.put("/edit-travel-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title,story,visitedLocations,ImageUrl,visitedDate } = req.body; // Extract user details from the request body
  const { userId } = req.user; // Extract userId from the authenticated user's token payload
  
  // Validate that all required fields are provided
  if (!title || !story || !visitedLocations || !ImageUrl || !visitedDate) {
    return res.status(400).json({ error: true, message: "All fields are required" });
  }
  //convert visitedDate from milliseconds to Date object
  const parsedVisitedDate = new Date(parseInt(visitedDate));
  try {
    // Find the travel story by id and userId and ensure it belongs to the authenticated user
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
    
    if (!travelStory) {
      return res.status(404).json({ error: true, message: "Travel story not found" });
    }
    const placeholderImageUrl = "http://localhost:3000/assets/logo.png";

    travelStory.title = title;
    travelStory.story = story;
    travelStory.visitedLocations = visitedLocations;
    travelStory.ImageUrl = ImageUrl || placeholderImageUrl;
    travelStory.visitedDate = parsedVisitedDate;

    await travelStory.save();
    res.status(201).json({ story: travelStory, message: "Travel story updated successfully" });
  } catch (error) {
    res.status(400).json({ error: true, message:error.message });
  }
  // Create a new travel story instance with the provided details
});

//delete Travel Story
app.delete("/delete-travel-story/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user; // Extract userId from the authenticated user's token payload

  try {
    // Find the travel story by id and userId and ensure it belongs to the authenticated user
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
    if (!travelStory) {
      return res.status(404).json({ error: true, message: "Travel story not found" });
    }

    // Extract the filename from the imageUrl
    const ImageUrl = travelStory.ImageUrl;
    const filename = path.basename(travelStory.ImageUrl);
    const filePath = path.join(__dirname, "uploads", filename);

    // Delete the travel story from the database
    await travelStory.deleteOne();

    // Delete the image from the uploads folder/directory
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Send a single response after all operations are completed
    res.status(200).json({ message: "Travel story deleted successfully" });
  } catch (error) {
    console.error("Error deleting travel story:", error.message);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

//update isFavourite status of a travel story
app.put("/update-favourite/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;// Extract id from the request parameters
  const { isFavourite } = req.body; // Extract isFavourite status from the request body
  const { userId } = req.user; // Extract userId from the authenticated user's token payload
  try {
    // Find the travel story by id and userId and ensure it belongs to the authenticated user
    const travelStory = await TravelStory.findOne({ _id: id, userId: userId });
    if (!travelStory) {
      return res.status(404).json({ error: true, message: "Travel story not found" });
    }
    travelStory.isFavourite = isFavourite;
    await travelStory.save();
    res.status(200).json({ message: "Favourite status updated successfully" });
  }catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

//Search travel stories
app.get("/search-travel-stories", authenticateToken, async (req, res) => {
  const { userId } = req.user; // Extract userId from the authenticated user's token payload
  const { query } = req.query; // Extract the search query from the request query parameters

  if (!query) {
    return res.status(400).json({ error: true, message: "Search query is required" });
  } 

  try {
    // Find travel stories that match the search query and belong to the authenticated user
    const searchResults = await TravelStory.find({
      userId: userId,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { story: { $regex: query, $options: "i" } },
        { visitedLocations: { $regex: query, $options: "i" } },
      ],
    }).sort({ isFavourite: -1 });

    res.status(200).json({ searchResults, message: "Search results fetched successfully" });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// Filter travel stories by visited date
app.get("/filter-travel-stories", authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query; // Extract startDate and endDate from query parameters
  const { userId } = req.user; // Extract userId from the authenticated user's token payload

  try {
    // Validate that startDate and endDate are provided and are valid numbers
    if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
      return res.status(400).json({ error: true, message: "Invalid startDate or endDate" });
    }

    // Convert startDate and endDate from milliseconds to Date objects
    const start = new Date(parseInt(startDate));
    const end = new Date(parseInt(endDate));

    // Validate that the dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: true, message: "Invalid startDate or endDate" });
    }

    // Ensure startDate is before endDate
    if (start > end) {
      return res.status(400).json({ error: true, message: "startDate must be before endDate" });
    }

    // Log the dates for debugging purposes
    console.log("Start Date:", start);
    console.log("End Date:", end);

    // Find travel stories that belong to the authenticated user and have visitedDate between startDate and endDate
    const filteredResults = await TravelStory.find({
      userId: userId, // Ensure the story belongs to the authenticated user
      visitedDate: { $gte: start, $lte: end }, // Filter by visitedDate range
    }).sort({ isFavourite: -1 }); // Sort by isFavourite in descending order

    // Return the filtered results
    res.status(200).json({ stories: filteredResults, message: "Travel stories filtered successfully" });
  } catch (error) {
    console.error("Error filtering travel stories:", error.message);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});
// Start the server and listen on the specified port
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the Express app for use in other modules (e.g., testing)
module.exports = app;