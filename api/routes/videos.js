// WordOfMouthAPI/api/routes/sentences.js
// Include express
const aws = require('aws-sdk');
const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Include express router middleware
const videosRouter = express.Router();
const database = require("../../database");

// AWS configuration
aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || '',
    region: process.env.AWS_REGION || ''
});

// Set S3 endpoint to DigitalOcean Spaces
/*
const spacesEndpoint = new aws.Endpoint('sfo2.digitaloceanspaces.com');
const s3 = new aws.S3({
    endpoint: spacesEndpoint,
    accessKeyId: process.env.AWS_ACCESS_KEY || 'RTDE7OTZHS7QBDJVDC54',
    secretAccessKey: process.env.AWS_SECRET_KEY ||  'PdhyHIxCYzddrFQKdkVoXAD4OiPcq2I/2NVIa1Tr4AE'
});
*/

// Set S3 endpoint to AWS
const s3 = new aws.S3();
let s3Bucket = process.env.S3_BUCKET_BLACKANDWHITE || 'womcdn';

// Change bucket property to your Space name
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: s3Bucket,
    acl: 'public-read',
    key: function (request, file, cb) {
      console.log(file);
      cb(null, file.originalname);
    }
  })
}).array('video', 1);

// Upload videos for sentences
 videosRouter.post('/', function (request, response, next) {
  console.log('Interesting 1:' + request.body.sentenceId);
  upload(request, response, function (error) {
  console.log('Interesting 2:'+ request.body.sentenceId);
    if (error) {
      console.log(error);
      return response.status(400)
                .json({
                  status: 'Failure',
                  data:err,
                  message:'Error occurring'});
    }

    else {
    return database('videos')
      .insert({
        sentenceid: request.body.sentenceId,
        userid: request.body.userId,
        videourl: request.body.videoUrl,
        status: 'approved'
      })
      .then(function (data) {
      response.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Video uploaded successfully'
        });
    })
    .catch(function (err) {
      response.status(400)
        .json({
          status: 'failure',
          data:err,
          message:'Failed to upload video'});
    });
    }
  });
});

 //Get video count
 videosRouter.get("/count/", (req, res, next) => { 
  const sentenceid = req.query.sentence;
  database('videos').where('sentenceid', sentenceid).count('videoid')
  .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved Count'
        });
    })
    .catch(function (err) {
      res.status(400)
        .json({
          status: 'Failure',
          data:err,
          message:'Error occurring'});
    });
});

 //Get videos associated to sentence
 videosRouter.get("/", (req, res, next) => { 
  const sentenceid = req.query.sentence;

  database
    .select()
    .from('videos')
    .where('sentenceid', sentenceid)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved sentence'
        });
    })
    .catch(function (err) {
      res.status(400)
        .json({
          status: 'Failure',
          data:err,
          message:'Error occurring'});
    });
});


// Exports the router object
module.exports = videosRouter;
