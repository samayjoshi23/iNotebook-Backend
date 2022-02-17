const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const JWT_SECRET = 'Hellobrosamayhere'

const fetchUser = require('../middleware/fetchUser');


// Create a User using POST "/api/auth". Doesn't require Auth - No login required
// ROUTE - 1
router.post('/createuser',[
    body('name','Enter a valid Name').isLength({min:3}),
    body('email','Enter a valid Email').isEmail(),
    body('password','Enter a valid Password').isLength({min:5})
], async (req,res)=> {

    // If there are errros, return bad requests and errors
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array() });
    }

    // Check whether the user email exists already
    try{
        let user = await User.findOne({email: req.body.email});
        if(user){
            return res.status(400).json({error: "Sorry the user with this email already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const secPass = await bcrypt.hash(req.body.password,salt);

        // Create a new User
        user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: secPass,
        })

        const data = {
            user:{
                id: user.id
            }
        }
        const authToken = jwt.sign(data, JWT_SECRET);
        res.json({authToken: authToken});

    }catch(error){
        console.log(error.message);
        res.status(500).send("Internal server errors occured...")
    }
})


// Authenticate a User using : POST "/api/auth/login". No Login required
// ROUTE - 2
router.post('/login',[
            body('email','Enter a valid Email').isEmail(),
            body('password','Enter a valid Password').isLength({min:5}).exists()
        ], async (req,res)=>{

            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors: errors.array() });
            }
        
            const {email, password} = req.body;
            try{
                let user = await User.findOne({email});
                if(!user){
                    return res.status(400).json({error: "Wrong credentials, Re-enter the correct one"});
                }

                const passwordCompare = await bcrypt.compare(password, user.password);
                if(!passwordCompare){
                    return res.status(400).json({error: "Wrong credentials, Re-enter the correct one"});
                }

                const data = {
                    user: {
                        id: user.id
                    }
                };

                const authToken = jwt.sign(data, JWT_SECRET);
                res.json({authToken: authToken});

            }catch(error){
                console.log(error.message);
                res.status(500).send("Internal server errors occured...")
            }
});


// Get logged in User Details using: POST: "/api/auth/getuser". Login Required
// ROUTE - 3
router.post('/getuser',fetchUser, async (req,res)=>{


    try{
        let userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    }catch(error){
        console.log(error.message);
        res.status(500).send("Internal server errors occured...")
    }
});


module.exports = router;