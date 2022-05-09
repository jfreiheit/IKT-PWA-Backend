	const express = require('express');
	const mongoose = require('mongoose');
	const Grid = require("gridfs-stream");
	const router = express.Router();

	const connect = mongoose.createConnection(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });

	let gfs, gfsb;
	connect.once('open', () => {
	    // initialize stream
	    gfsb = new mongoose.mongo.GridFSBucket(connect.db, {
	        bucketName: "posts"
	    });

	    gfs = Grid(connect.db, mongoose.mongo);
	    gfs.collection('fileupload');
	});

	router.get('/:filename', async(req, res) => {
	    try {
	        const cursor = await gfs.collection('posts').find({ filename: req.params.filename });
	        cursor.forEach(doc => {
	            console.log('doc', doc);
	            gfsb.openDownloadStream(doc._id).pipe(res);
	        })
	    } catch (error) {
	        console.log('error', error);
	        res.send("not found");
	    }
	});

	module.exports = router;