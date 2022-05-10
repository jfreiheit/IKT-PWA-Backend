	const express = require('express');
	const upload = require('../middleware/upload');
	const Post = require('../models/posts');
	const router = express.Router();
    require('dotenv').config();

	router.post('/', upload.single('file'), async(req, res) => {
	    // req.file is the `file` file
	    if (req.file === undefined) {

	        return res.send({
	            "message": "no file selected"
	        });
	    } else {
			console.log('req.body', req.body);
			const newPost = new Post({
				title: req.body.title,
				location: req.body.location,
				image_id: req.file.filename
			})
			await newPost.save();
			return res.send(newPost);
	    }
	})

	module.exports = router;