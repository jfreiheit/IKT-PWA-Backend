	const express = require('express');
	const router = express.Router();
	const mongoose = require('mongoose');
	const upload = require('../middleware/upload');
    const Post = require('../models/posts');

	const connect = mongoose.createConnection(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
	const collectionFiles = connect.collection('posts.files');
	const collectionChunks = connect.collection('posts.chunks');

	// GET all posts
	router.get('/', async(req, res) => {
		
		getAllPosts()
		.then( (posts) => {
			res.send(posts);
		})
		.catch( () => {
			res.status(404);
	        res.send({
	            error: "Post do not exist!"
	        });
		})
	});

	function getOnePost(id) {
		return new Promise( async(resolve, reject) => {
			try {
				const post = await Post.findOne({ _id: id });
				// console.log('post.image_id', post.image_id);
				let fileName = post.image_id;

				collectionFiles.find({filename: fileName}).toArray( async(err, docs) => {
					// console.log('docs', docs)

					collectionChunks.find({files_id : docs[0]._id}).sort({n: 1}).toArray( (err, chunks) => {
						

						const fileData = [];
						for(let chunk of chunks)
						{
							// console.log('chunk._id', chunk._id)
							fileData.push(chunk.data.toString('base64'));
						}

						let base64file = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
						let getPost = new Post({
							"title": post.title,
							"location": post.location, 
							"image_id": base64file
						});
						//console.log('getPost', getPost)
						resolve(getPost)
					})

				}) // toArray find filename

			} catch {
	        	reject(new Error("Post does not exist!"));
	        }
		})
	}

	function getAllPosts() {
		return new Promise( async(resolve, reject) => {
			const sendAllPosts = [];
			const allPosts = await Post.find();
			try {
				for(const post of allPosts) {
					console.log('post', post)
					const onePost = await getOnePost(post._id);
					sendAllPosts.push(onePost);
				}
				console.log('sendAllPosts', sendAllPosts)
				resolve(sendAllPosts)
			} catch {
					reject(new Error("Posts do not exist!"));
	        }
		});
	}

    // POST one post
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

    // GET one post via id
	router.get('/:id', async(req, res) => {
		getOnePost(req.params.id)
		.then( (post) => {
			console.log('post', post);
			res.send(post);
		})
		.catch( () => {
			res.status(404);
	        res.send({
	            error: "Post does not exist!"
	        });
		})
	});

    // PATCH (update) one post
	router.patch('/:id', async(req, res) => {
	    try {
	        const post = await Post.findOne({ _id: req.params.id })

	        if (req.body.title) {
	            post.title = req.body.title
	        }

	        if (req.body.location) {
	            post.location = req.body.location
	        }

	        if (req.body.image_id) {
	            post.image_id = req.body.image_id
	        }

	        await Post.updateOne({ _id: req.params.id }, post);
	        res.send(post)
	    } catch {
	        res.status(404)
	        res.send({ error: "Post does not exist!" })
	    }
	});

	// DELETE one post via id
	router.delete('/:id', async(req, res) => {
	    try {
	        await Post.deleteOne({ _id: req.params.id })
	        res.status(204).send()
	    } catch {
	        res.status(404)
	        res.send({ error: "Post does not exist!" })
	    }
	});

	module.exports = router;