	const express = require('express');
	const mongoose = require('mongoose');
	const Grid = require("gridfs-stream");
    const multer = require('multer');
	const router = express.Router();
    const { GridFsStorage } = require('multer-gridfs-storage')
    const { MongoClient, ObjectId } = require('mongodb');
    const fs  = require('fs');
    require('dotenv').config();

	const connect = mongoose.createConnection(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
    const dbName = "posts";

	let gfs, gfsb;
	connect.once('open', () => {
	    // initialize stream
	    gfsb = new mongoose.mongo.GridFSBucket(connect.db, {
	        bucketName: "posts"
	    });

	    gfs = Grid(connect.db, mongoose.mongo);
	    // gfs.collection('file');
	});

	router.get('/show/:filename', async(req, res) => {
 	    try {
	        const cursor = await gfs.collection('posts').find({ filename: req.params.filename });
	        cursor.forEach(doc => {
	            console.log('doc', doc);
                const id = doc._id.valueOf();
                console.log('doc._id', id);
	            gfsb.openDownloadStream(doc._id).pipe(res);
	        })
	    } catch (error) {
	        console.log('error', error);
	        res.send("not found");
	    }
	});

	router.get('/send/:filename', async(req, res) => {
        //Accepting user input directly is very insecure and should 
        //never be allowed in a production app. Sanitize the input.
        let fileName = req.params.filename;
        //Connect to the MongoDB client
        MongoClient.connect(process.env.DB_CONNECTION, (err, client) => {

            if(err){
                return res.send({title: 'Uploaded Error', message: 'MongoClient Connection error', error: err.errMsg});
            }
            const db = client.db(dbName);
            const collection = db.collection('posts.files');
            const collectionChunks = db.collection('posts.chunks');

            collection.find({filename: fileName}).toArray( (err, docs) => {
                if(err){
                    return res.send({title: 'File error', message: 'Error finding file', error: err.errMsg});
                }
        
                if(!docs || docs.length === 0){
                    return res.send({title: 'Download Error', message: 'No file found'});
                } else {

                    collectionChunks.find({files_id : docs[0]._id}).sort({n: 1}).toArray( (err, chunks) => {
                        if(err){
                            return res.send({title: 'Download Error', message: 'Error retrieving chunks', error: err.errmsg});
                        }
                        if(!chunks || chunks.length === 0){
                            //No data found
                            return res.send({title: 'Download Error', message: 'No data found'});
                        }
                        console.log('chunks.length', chunks.length)
                        //Append Chunks
                        const fileData = [];
                        for(let chunk of chunks){
                            // console.log('chunk', chunk)
                            //This is in Binary JSON or BSON format, which is stored
                            //in fileData array in base64 endocoded string format
                            fileData.push(chunk.data.toString('base64'));
                        }

                        //Display the chunks using the data URI format
                        let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
                        console.log('finalFile', finalFile)
                        res.send({title: 'Image File', message: 'Image loaded from MongoDB GridFS', imgurl: finalFile});
                    }) // toArray 
                } // else
            }) // toArray
        }) // connect
    }) // get


	router.get('/stream/:filename', async(req, res) => {
        let fileName = req.params.filename;

        MongoClient.connect(process.env.DB_CONNECTION, (err, client) => {
            const db = client.db(dbName);
            const collection = db.collection('posts.files');
            const collectionChunks = db.collection('posts.chunks');

            collection.find({filename: fileName}).toArray( (err, docs) => {

                    // temporary variable to hold image
                    var data = [];

                    // create the download stream
                    let downloadStream = gfsb.openDownloadStream(docs[0]._id);
                    downloadStream.on('data', (chunk) => {
                        data.push(chunk);
                    });

                    downloadStream.on('error', async (error) => {
                        console.error('error', error);
                    });

                    downloadStream.on('end', async () => {
                        // convert from base64 and write to file system
                        let bufferBase64 = Buffer.concat(data)
                        let bufferDecoded = Buffer.from(bufferBase64.toString(), 'base64');
                        // fs.writeFileSync(fileName, bufferDecoded, 'binary');
                        console.log('bufferDecoded', bufferDecoded);
                    }); // on
            }); // find filename
        }); // connect
	}); // get

	module.exports = router;