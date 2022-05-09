	const mongoose = require('mongoose');

	const schema = new mongoose.Schema({
	    title: String,
	    location: String,
	    image_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
	});

	module.exports = mongoose.model('Post', schema);