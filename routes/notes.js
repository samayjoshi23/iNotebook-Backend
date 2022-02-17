const express = require("express");
const Note = require("../models/Note");
const fetchuser = require("../middleware/fetchUser");
const { body, validationResult } = require("express-validator");
const router = express.Router();

// ROUTE 1 = get all the notes: GET "/api/notes/fetchallnotes" - Login required
router.get("/fetchallnotes", fetchuser, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id });
        res.json(notes);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server errors occured...")
    }
});

// ROUTE 2 = Add a new note Using POST "/api/auth/addnote" - Login required
router.post("/addnote",fetchuser, [
    body("title", "Title cannot be blank").isLength({ min: 3 }),
    body("description", "Description must be atleast 5 characters").isLength({min: 5}),
  ], async (req, res) => {

      try {

        const {title, description, tag} = req.body;
         // If there are errros, return bad requests and errors
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array() });
        }
        const note = new Note({
            title, description, tag, user: req.user.id
        })

        const savedNote = await note.save();
        res.json(savedNote);

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server errors occured...")
    }
   
  }
);


// ROUTE 3 = Update a existing note Using PUT "/api/auth/updatenote" - Login required
router.put("/updatenote/:id",fetchuser, async (req, res) => {

      try {
        const {title, description, tag} = req.body;
        
        // If there are errros, return bad requests and errors
        const newNote = {};
        if(title){newNote.title = title}
        if(description){newNote.description = description}
        if(tag){newNote.tag = tag}
        
        // Find the node to be updated and Update it
        let note = await Note.findById(req.params.id);        
        if(!note) {return res.status(404).send("Not Found!!!");}

        if(note.user.toString() !== req.user.id){
            return res.status(401).send("Not allowed to Change");
        }

        note = await Note.findByIdAndUpdate(req.params.id, {$set: newNote}, {new:true})
        res.json({note});

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server errors occured...")
    }
   
  }
);



// ROUTE 4 = Delete a existing note Using DELETE "/api/auth/updatenote" - Login required
router.delete("/deletenote/:id",fetchuser, async (req, res) => {

      try {
        
        // Find the node to be updated and Update it
        let note = await Note.findById(req.params.id);        
        if(!note) {return res.status(404).send("Not Found!!!");}
        
        // Allow deletion only if user ons this Note
        if(note.user.toString() !== req.user.id){
            return res.status(401).send("Not allowed to Change");
        }

        note = await Note.findByIdAndDelete(req.params.id);
        res.json({"Success": "Note has been deleted"});

    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal server errors occured...")
    }
   
  }
);

module.exports = router;
