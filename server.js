const express = require("express");
const app = express(); //Express loaded
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3'); //Multer to handle uploads . AWS SDK to handle server space config

const cors = require('cors'); //Cors to handle cross-site issues
app.use(cors());

const bodyParser = require("body-parser"); //Body parser to process values received 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

const sentenceRoutes = require("./api/routes/sentences"); //Sentence route
const videoRoutes = require("./api/routes/videos"); //Video route
const userRoutes = require("./api/routes/users"); //Users route
const historyRoutes = require("./api/routes/history"); //History route
const favoriteRoutes = require("./api/routes/favorites"); //Favorites route
const profileRoutes = require("./api/routes/profiles"); //User profile route

// Use routes
app.use("/v1/sentences", sentenceRoutes);
app.use("/v1/videos", videoRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/history", historyRoutes);
app.use("/v1/favorites", favoriteRoutes);
app.use("/v1/profiles", profileRoutes);

const port = process.env.PORT || 3001;
app.listen(port); //Set port for express to listen on.