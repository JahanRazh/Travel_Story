const express = require("express");
const router = express.Router();
const travelStoryController = require("../controllers/travelStoryController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Travel story routes
router.post("/add-travel-story", authenticateToken, travelStoryController.addTravelStory);
router.get("/get-all-travel-stories", authenticateToken, travelStoryController.getAllTravelStories);
router.put("/edit-travel-story/:id", authenticateToken, travelStoryController.editTravelStory);
router.delete("/delete-travel-story/:id", authenticateToken, travelStoryController.deleteTravelStory);
router.put("/update-favourite/:id", authenticateToken, travelStoryController.updateFavorite);
router.get("/search-travel-stories", authenticateToken, travelStoryController.searchTravelStories);
router.get("/filter-travel-stories", authenticateToken, travelStoryController.filterTravelStories);

module.exports = router;