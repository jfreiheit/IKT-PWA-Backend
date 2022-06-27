	const express = require('express');
	const router = express.Router();
	const mongoose = require('mongoose');
	const upload = require('../middleware/upload');
    const Post = require('../models/posts');
	const webpush = require('web-push');

	const connect = mongoose.createConnection(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
	const collectionFiles = connect.collection('posts.files');
	const collectionChunks = connect.collection('posts.chunks');

	const publicVapidKey = 'BLp3BGxSyYIv3rfy07KC-saKtiCVI073LWw5Eh24gHoRGV7hhT1kVwo6gnhjrUszZguRy8b9lGroKNRy9iCUcCI';
	const privateVapidKey = '9HPDFyx8Xd3lu2ctDHGdf3TNSjDUU2nsAuwwLe2d_6A';
	const pushSubscription = {
		endpoint: 'https://fcm.googleapis.com/fcm/send/cZOypgW2mmM:APA91bGuq9U8jV9iK6iQT-nIx3baQNz_I68Kk07siPdL5dqLA4fiGEx1EA7dPRmxpX0Bp6vdBSiZughw6sJU_mRH5EXrDIV4NvEzf_9tdpAw6s011Y2og34yRtWjJJAhJl_7SrE3EKbh',
		keys: {
			auth: 's7NkHUqfuIL_uiRCzEV08Q',
			p256dh: 'BKMb3KV-ajWpAJQ8r2yVOI1A9KvfJhvGt-pRBTRQtap9if-GHyM77tSns2Qk-UXZ8HXicRCpOd1LIeRAneOIkhk',
		}
	};

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
				console.log('fileName', fileName);
				collectionFiles.find({filename: fileName}).toArray( async(err, docs) => {
					console.log('docs', docs)
					if(docs.length > 0) {
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
				}
				else {
					reject({ 'message' : ' no file '})
				}

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
				// console.log('sendAllPosts', sendAllPosts)
				resolve(sendAllPosts)
			} catch {
					reject(new Error("Posts do not exist!"));
	        }
		});
	}

	function sendNotification() {
		webpush.setVapidDetails('mailto:freiheit@htw-berlin.de', publicVapidKey, privateVapidKey);
		const payload = JSON.stringify({
			title: 'New Push Notification',
			content: 'New data in database!'
		});
		webpush.sendNotification(pushSubscription,payload)
			.catch(err => console.error(err));
		console.log('push notification sent');
		// res.status(201).json({ message: 'push notification sent'});
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
			console.log('req.file', req.file);
			const newPost = new Post({
				title: req.body.title,
				location: req.body.location,
				image_id: req.file.filename
			})
			await newPost.save();
			sendNotification();
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
			const post = await Post.findOne({ _id: req.params.id })
			let fileName = post.image_id;
	        await Post.deleteOne({ _id: req.params.id });
			await collectionFiles.find({filename: fileName}).toArray( async(err, docs) => {
				console.log('docs', docs)
				await collectionChunks.deleteMany({files_id : docs[0]._id});
			})
			await collectionFiles.deleteOne({filename: fileName});
	        res.status(204).send()
	    } catch {
	        res.status(404)
	        res.send({ error: "Post does not exist!" })
	    }
	});

	module.exports = router;