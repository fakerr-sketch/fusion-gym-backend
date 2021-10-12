const jwt = require("jsonwebtoken")
const {secret} = require("./config/auth.json")

const verifyClientToken = req =>  {
     
     typeof req.authorization === "undefined" && "jwt token must be provided."

     // const [, isValidToken] = authorization.split(" ")
     // /[a-z]./\d/.test(isValidToken) && jwt.verify(isValidToken, secret)


}

process.once("message", verifyClientToken)