const jwt = require("jsonwebtoken");

const authentication = (req, res, next) => {
   try {
         // accept token from cookie 'token' or Authorization header
         const authHeader = req.headers.authorization;
         let token = null;

         if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
         } else if (authHeader) {
            token = authHeader.split(" ")[1];
         }

         if (!token) {
            return res.status(401).json({ message: "Token missing" });
         }

         const data = jwt.verify(token, process.env.JWT_SECRET_KEY || "secret");
         req.id = data.userId;

      next();

   } catch (error) {
      console.log(error);
      return res.status(500).json({
         message: "Invalid JWT Token"
      });
   }
};

module.exports = authentication;