const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()


router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        res.status(201).send(user)
    } catch (e) {
        res.status(400).json({message: "Please check the email format"})
    }
})


router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.getAuthToken()
        res.status(200).json({user: user, token: token, expiresIn:3600})
    } catch (e) {
        res.status(400).json({message: "user not found"})
    }
})

//remove latest token
router.post('/users/logout', auth, async (req,res) => {
    try{
        req.user.tokens = req.user.tokens.filter((i) => {
            return i.token !== req.token
        })
        await req.user.save()

        res.json({message: "cleared token from db"})
       
    } catch(e){
        res.status(500).send()
    }
})


router.post('/users/logout-all', auth, async (req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch(e){
        res.status(500).send()
    }   
})

router.get('/users/current-user', auth, async (req, res) => {
   res.send(req.user)
})

module.exports = router;


