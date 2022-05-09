const express = require('express');
const cors = require('cors');
const postsRoutes = require('./routes/posts.routes');
const uploadRoutes = require('./routes/upload.routes');
const downloadRoute = require('./routes/download.routes');
const deleteRoute = require('./routes/delete.routes');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/posts', postsRoutes);
app.use('/image', uploadRoutes);
app.use('/download', downloadRoute);
app.use('/delete', deleteRoute);

app.listen(process.env.PORT, (error) => {
	if (error) {
		console.log(error);
	} else {
		console.log(`server running on http://localhost:${process.env.PORT}`);
	}
});

// connect to mongoDB
mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
	console.log('connected to DB');
});