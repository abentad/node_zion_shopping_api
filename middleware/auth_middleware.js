const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers["x-access-token"];
  
    if (!token) {
    //   console.log('token is required');
      return res.status(403).json({error: "A token is required for authentication."});
    } else {
        // console.log('token is found');
        jwt.verify(token, 'key to hash the jwt with', (err, decodedToken)=>{
            if(err){
                console.log(err.message);
                res.status(401).json({error: "invalid token"});
            }else{
                req.userId = decodedToken['id'];
                next();
            }
        });
    }    
};
  
  module.exports = { requireAuth };