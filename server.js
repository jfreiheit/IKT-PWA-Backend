	const express = require('express');
	const postRoutes = require('./routes/post.routes');
	const cors = require('cors')
	const app = express();
	const PORT = 3000;

	app.use(express.json());
	// enable cors for all requests
	app.use(cors());
	app.use('/posts', postRoutes);

	app.listen(PORT, (error) => {
	    if (error) {
	        console.log(error);
	    } else {
	        console.log(`server running on http://localhost:${PORT}`);
	    }
	});