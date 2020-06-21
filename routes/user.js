const express = require('express')
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.NODE_EMAIL,
        pass: process.env.NODE_PASSWORD
    }
})

let mailOptions = {
    from: process.env.NODE_EMAIL,
    to: '',
    subject: 'Email Verification',
    html: `<p>Hola</p>`
}



router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {

        if(!user.isVerified){

            let buf = crypto.randomBytes(32);
            let emailToken = buf.toString("hex");
            user.emailToken = emailToken;
            mailOptions.to = user.email;
            mailOptions.html = `<html>
            <body>
            <h3>Click the link below to verify the account</h3>
            <button> <a href="http://localhost:3000/verifyaccount/${emailToken}/${user.email}">localhost:3000/verifyaccount/${emailToken}/${user.email}</a></button><br>
            <h3>Link is valid for 1 day</h3>
            </body>
            </html>`
            transporter.sendMail(mailOptions, function(err, data){
                if (err){
                    console.log(err)
                }
                else{
                    console.log("Email Sent!")
                }
            })
            user.createdTime = new Date();
            user.expirationTime = 24*60*60*1000; //in milliseconds ---- 1 day
           await user.save()
           res.status(201).send(user)    

        }

     res.status(400).json({message: "Email was already verified"})
    } catch (e) {
        res.status(400).json({message: "Please check the email format"})
    }
})



router.get('/verifyaccount/:emailToken/:email', async (req, res) => {
    try{
        let emailToken = req.params.emailToken;
        let email = req.params.email;
        const user = await User.findOne({ email: email, emailToken:emailToken })

        if(user){
            let createdTime = new Date(user.createdTime)
            let currentTime = new Date()
            let timeDifference =  Math.abs(createdTime.valueOf() - currentTime.valueOf())
            // console.log(createdTime)
            // console.log(user.expirationTime)
            // console.log(currentTime)
            // console.log(timeDifference)

            if(timeDifference > parseInt(user.expirationTime)){
                user.emailToken = undefined
                res.status(200).json({
                    message: "Link has been expired!"
                })
                user.save()
            }
            else{
                user.isVerified = true;
                await user.save()
                res.status(201).send(`<html>
                <div style = "text-align: center;">
        
                <h1>Verification Successful</h1>
                <h3><a href = "http://localhost:4200">Click here to continue</a></h3>
                
                </div>
               
                </html>`)  
            }
      
        }
    } catch(e){
        res.status(400).json({message: "Please verify email"})
    }
   
})

router.post('/resend-mail', async (req, res) => {
    let email = req.body.email
    const user = await User.findOne({ email: email})
    try{
        if ((user.emailToken == undefined || !user.isVerified) && user){
            let buf = crypto.randomBytes(32);
            let emailToken = buf.toString("hex");
            user.emailToken = emailToken;
            mailOptions.to = user.email;
            mailOptions.html = `<html>
            <body>
            <h3>Click the link below to verify the account</h3>
            <button> <a href="http://localhost:3000/verifyaccount/${emailToken}/${user.email}">localhost:3000/verifyaccount/${emailToken}/${user.email}</a></button><br>
            <h3>Link is valid for 1 day</h3>
            </body>
            </html>`
            transporter.sendMail(mailOptions, function(err, data){
                if (err){
                    console.log(err)
                }
                else{
                    console.log("Email Sent!")
                }
            })
            user.createdTime = new Date();
            user.expirationTime = 24*60*60*1000; //in milliseconds ---- 1 day
           await user.save()
           res.status(201).send(user)    
        }
        else{
            res.status(201).json({message: "Email Verification is not expired or is already verified"})
        }

    } catch(e){
        res.status(400).json({message: "User not Found, please create one"})
    }
  

})


router.post('/forgot-pass', async(req, res) => {
    let email = req.body.email
    console.log(email)
    const user = await User.findOne({ email: email})
    try{
        
            let buf = crypto.randomBytes(32);
            let forgotToken = buf.toString("hex");
            user.forgotToken = forgotToken;
            mailOptions.to = user.email;
            mailOptions.html = `<html>
            <body>
            <h3>Click the link below to reset your Password</h3>
            <button> <a href="http://localhost:4200/pass-reset/${forgotToken}/${user.email}">Reset Password Link</a></button><br>
            <h3>Link is valid for 1 day</h3>
            </body>
            </html>`
            transporter.sendMail(mailOptions, function(err, data){
                if (err){
                    console.log(err)
                }
                else{
                    console.log("Email Sent!")
                }
            })
            user.createdTime = new Date();
            user.expirationTime = 24*60*60*1000; //in milliseconds ---- 1 day
           await user.save()
           res.status(201).send(user)    
        

    } catch(e){
        res.status(400).json({message: "User not Found, please create one"})
    }
  

})



router.get('/verify-pass-reset/:forgotToken/:email', async (req,res) => {
    try{
        let forgotToken = req.params.forgotToken;
        let email = req.params.email;
        const user = await User.findOne({ email: email, forgotToken:forgotToken })

        if(user){
           res.status(200).json(user)
        }
    } catch(e){
        res.status(400).json({message: "Please verify email"})
    }

})


router.post('/reset-pass', async (req,res) => {
    try{

        let forgotToken = req.body.forgotToken
        const user = await User.findOne({ forgotToken:forgotToken })
    
        if(user){
            user.password = req.body.password
            user.forgotToken = undefined
            user.save()
        }
    }
    catch(e){
        res.status(400).json({message: "Please check user"})
    }
  
})




router.post('/users/login', async (req, res) => {
     
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.getAuthToken()
        if (user.isVerified){
            res.status(200).json({user: user, token: token, expiresIn:3600})
        }
        res.status(400).json({message: "Make sure email is Verified"})

    } catch (e) {
        res.status(400).json({message: "Make sure email is created"})
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


