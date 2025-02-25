const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const upload = require("../utilities/multer");

// Upload routes
router.post("/image-upload", upload.single("image"), uploadController.uploadImage);
router.delete("/delete-image", uploadController.deleteImage);

module.exports = router;