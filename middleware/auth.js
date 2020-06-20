const jwt = require('jsonwebtoken')
const User = require('../models/user')
const jwt_sign = process.env.JWT_SIGNATURE

const auth = async (req,res,next) => {
   try{
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, `${jwt_sign}`)
        const user = await User.findOne({_id: decoded._id, 'tokens.token':token})

        if(!user){
            throw new Error() //it triggers catch
        }

        req.token = token
        req.user = user
        next()

   } catch(e){
    res.status(401).send({error: 'Please Authenticate'})
   }
}

module.exports = auth