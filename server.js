const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('./db/mongoose')
const userRouter = require('./routes/user')
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(userRouter)
app.use(bodyParser.json())

app.use((req,res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    next()
})

app.listen(port, ()=>{
    console.log('port working at '+ port)
})

