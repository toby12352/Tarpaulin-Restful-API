const redis = require('redis')
const redisHost = process.env.REDIS_HOST || "localhost"
const redisPort = process.env.REDIS_PORT || "6379"
const redisClient = redis.createClient({
    url: `redis://${redisHost}:${redisPort}`
})

const rateLimitWindowMillis = 60000
const rateLimitMaxRequests = 10
const correctRateLimit = 30
const correctRateLimitRefreshRate = correctRateLimit / rateLimitWindowMillis  
const rateLimitRefreshRate = rateLimitMaxRequests / rateLimitWindowMillis

exports.rateLimit = async function (req, res, next){
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null
  
    const isTokenValid = req.headers.authorization === authHeader
    const currentRateLimitMaxRequests = isTokenValid ? correctRateLimit : rateLimitMaxRequests
    const currentRateLimitRefreshRate = isTokenValid ? correctRateLimitRefreshRate : rateLimitRefreshRate
  
    let tokenBucket 
    try{
      tokenBucket = await redisClient.hGetAll(req.ip)
    }catch (e){
      next()
      return
    }
  
    tokenBucket = {
      tokens: parseFloat(tokenBucket.tokens) || currentRateLimitMaxRequests,
      last: parseInt(tokenBucket.last) || Date.now()
    }
  
    const timestamp = Date.now()
    const ellapsedMillis = timestamp - tokenBucket.last
    tokenBucket.tokens += ellapsedMillis * currentRateLimitRefreshRate
    tokenBucket.tokens = Math.min(tokenBucket.tokens, currentRateLimitMaxRequests)
    tokenBucket.last = timestamp
  
    if(tokenBucket.tokens >= 1){
      tokenBucket.tokens -= 1
      await redisClient.hSet(req.ip, [
        ["tokens", tokenBucket.tokens],
        ["last", tokenBucket.last]
      ])
      next()
    } else{
      await redisClient.hSet(req.ip, [
        ["tokens", tokenBucket.tokens],
        ["last", tokenBucket.last]
      ])
      res.status(429).send({
        error: "Too many requests per minute"
      })
    }
}

redisClient.connect()