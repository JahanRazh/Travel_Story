const jwt = require("jsonwebtoken");

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(401);
        req.user = user; // Ensure the payload is assigned to req.user
        next();
    });
}

module.exports = {
    authenticateToken,
};