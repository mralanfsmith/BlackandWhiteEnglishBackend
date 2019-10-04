// WordOfMouthAPI/api/routes/sentences.js
// Include express
const express = require("express");

// Include express router middleware
const sentencesRouter = express.Router();
const database = require("../../database");
const middleware = require("../auth/jwt-check");
const jwt = require('jsonwebtoken');
const configData = require("../config/auth-constants");
const dbHelper = require("../helpers/dbhelper");
const lib = require("../helpers/lib");
const awsHelper = require("../helpers/awsHelper");

// Get Sentence Count
sentencesRouter.get("/count/", (req, res, next) => { 
  const lang = req.query.lang;
  database('sentences').where('lang', lang).count('id')
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

// Get Sentences for specific language
sentencesRouter.get("/", async (req, res, next) => { 
  const limit = 1;
  let page = req.query.pg;
  if (page < 1 || !page) page = 1;
  const offset = (page - 1) * limit;
  const lang = req.query.lang;
  const difficulty = req.query.difficulty ? JSON.parse(req.query.difficulty) : [1,2,3,4,5];
  
  try {
    const sentenceData = await database
      .select('sentences.id', 'sentences.lang', 'sentences.text','sentences.difficulty','sentences.usercreated','audios.audioid','audios.status as audiostatus','audios.userid','audios.licence','audios.attribution','audios.audiourl', 'favorites.sentenceid as favorite')
      .from('sentences')
      .leftJoin('audios','sentences.id','audios.sentenceid')
      .leftJoin('favorites','sentences.id','favorites.sentenceid')
      .where({'sentences.lang': lang})
      .whereIn('sentences.difficulty', difficulty)
      .limit(limit)
      .offset(offset)
      .orderBy('sentences.id', 'desc')

    if(sentenceData && sentenceData.length > 0) {
      for (i in sentenceData) {
        const sentence = sentenceData[i];
        if(!sentence.usercreated && !sentence.audiourl && sentence.audiostatus !== lib.Status.DOWNLOADED) {
          let lang;
          if(sentence.lang === 'eng-whiteenglish') {
            lang = 'eng'
          }
          const uploadedData = await awsHelper.uploadAudio(sentence.id, lang);
          if(uploadedData && uploadedData != 404) {
            sentence.audiourl = uploadedData.Location
            if(!sentence.audioid) {
              const newAudio = await dbHelper.insertAudio(sentence.id, null, uploadedData.Location, lib.Status.APPROVED)
              sentence.audioid = newAudio[0].audioid
            } else {
              await dbHelper.updateAudiosUrl(sentence.audioid, uploadedData.Location)
            }
          } else if(uploadedData === 404) {
            if(!sentence.audioid) {
              await dbHelper.insertAudio(sentence.id, null, null, lib.Status.DOWNLOADED)
            } else {
              await dbHelper.updateAudiosDownloadCheck(sentence.audioid, lib.Status.DOWNLOADED)
            }
          }
        }
      }
    }
    res.status(200)
      .json({
        status: 'success',
        data: sentenceData,
        message: 'Retrieved sentence'
      }); 
    } catch(err) {
      res.status(400)
        .json({
          status: 'Failure',
          data:err,
          message:'Error occurring'});
    };
});

// Get Sentence by id
sentencesRouter.get("/:id", async (req, res) => {

  if(!req.params.id){
    return res.status(400)
        .json({
            status: 'failure',
            message:'Sentence id required.'});
  }

  try {
    const sentenceData = await dbHelper.getSentenceById(req.params.id)

    if(sentenceData && sentenceData.length > 0) {
      for (i in sentenceData) {
        const sentence = sentenceData[i];
        if(!sentence.usercreated && !sentence.audiourl && sentence.audiostatus !== lib.Status.DOWNLOADED) {
          let lang;
          if(sentence.lang === 'eng-whiteenglish') {
            lang = 'eng'
          }
          const uploadedData = await awsHelper.uploadAudio(sentence.id, lang);
          if(uploadedData && uploadedData != 404) {
            sentence.audiourl = uploadedData.Location
            if(!sentence.audioid) {
              const newAudio = await dbHelper.insertAudio(sentence.id, null, uploadedData.Location, lib.Status.APPROVED)
              sentence.audioid = newAudio[0].audioid
            } else {
              await dbHelper.updateAudiosUrl(sentence.audioid, uploadedData.Location)
            }
          } else if(uploadedData === 404) {
            if(!sentence.audioid) {
              await dbHelper.insertAudio(sentence.id, null, null, lib.Status.DOWNLOADED)
            } else {
              await dbHelper.updateAudiosDownloadCheck(sentence.audioid, lib.Status.DOWNLOADED)
            }
          }
        }
      }
    }
    res.status(200)
      .json({
        status: 'success',
        data: sentenceData,
        message: 'Retrieved sentence'
      });
  } catch(err) {
      res.status(400)
        .json({
          status: 'Failure',
          data:err,
          message:'Error occurring'});
    };
});

// Get Translations for each sentence
sentencesRouter.get("/translations/:id", (req, res, next) => { 
  const translationsId = req.params.id;

  let translatedLanguages = req.query.translatedLanguages;
  if(req.query.translatedLanguages) {
    translatedLanguages = JSON.parse(req.query.translatedLanguages)
  }

  database
    .select('sentences.id', 'sentences.lang', 'sentences.text', 'links.translationid','audios.userid','audios.licence','audios.attribution', 'audios.audiourl')
    .from('sentences')
    .innerJoin('links','sentences.id','links.sentenceid')
    .leftJoin('audios','sentences.id','audios.sentenceid')
    .where({'links.translationid':translationsId})
    .whereIn('sentences.lang', translatedLanguages)
    .orderBy('sentences.lang')
    .then(function (data) {
        res.status(200)
          .json({
            status: 'success',
            data: data,
            message: 'Retrieved sentences'
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

 // Add cart detail that contains new sentence and
 sentencesRouter.post("/add-card", middleware.checkToken, async (req, res) => {
  const verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
  
  if(!req.body.langText){
    return res.status(400)
        .json({
            status: 'failure',
            message:'Sentence text required.'});
  }

  if(!req.body.lang) {
    return res.status(400)
    .json({
        status: 'failure',
        message:'Sentence language required.'});
  }

  const checkSentence = await dbHelper.checkSentence(req.body.langText, req.body.lang)
  if(checkSentence && checkSentence.length > 0) {
    return res.status(400)
        .json({
            status: 'failure',
            message:'This Sentence is already present in databse for given language.'});
  }

  if(req.body.translatedText && req.body.translatedLang) {
    const checkSentence = await dbHelper.checkSentence(req.body.translatedText, req.body.translatedLang)
    if(checkSentence && checkSentence.length > 0) {
      return res.status(400)
          .json({
              status: 'failure',
              message:'This Transaltion is already present in databse for given language.'});
    }
  }

  try {
    const sentenceData = {};
    sentenceData.text = req.body.langText;
    sentenceData.lang = req.body.lang;
    sentenceData.status = lib.Status.PENDING
    const newSentenceId = await dbHelper.createSentence(sentenceData);
    await dbHelper.updateCard(req, newSentenceId[0], verifiedJwt.userId, lib.Status.PENDING);
    res.status(200)
        .json({
            status: 'success',
            message: 'Card added successfully.'
            });
  } catch(err) {
    res.status(500)
    .json({
      status: 'Failure',
      data:err,
      message:'Error occurred while saving sentence'});
  }
});

// Update cart detail : add translation/audio/vedio
sentencesRouter.post("/update-card", middleware.checkToken, async (req, res) => {
  const verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
  if(!req.body.sentenceId){
    return res.status(400)
        .json({
            status: 'failure',
            message:'Sentence id required.'});
  }

  const checkSentenceId = await dbHelper.checkSentenceId(req.body.sentenceId)
  if(!(checkSentenceId && checkSentenceId.length > 0)) {
    return res.status(400)
        .json({
            status: 'failure',
            message:'Given sentence id does not exist in database.'});
  }

  if(req.body.translatedText && req.body.translatedLang) {
    const checkSentence = await dbHelper.checkSentence(req.body.translatedText, req.body.translatedLang)
    if(checkSentence && checkSentence.length > 0) {
      return res.status(400)
          .json({
              status: 'failure',
              message:'This Transaltion is already present in databse for given language.'});
    }
  }

  try {
    await dbHelper.updateCard(req, req.body.sentenceId, verifiedJwt.userId, lib.Status.PENDING);
    res.status(200)
      .json({
          status: 'success',
          message: 'Card updated successfully.'
          });
  } catch(err) {
    return res.status(500)
    .json({
      status: 'Failure',
      data:err,
      message:'Error occurred while updating card'});
  }
})

// Get Sentence by id
sentencesRouter.post("/check-sentence", (req, res, next) => {
  if(!req.body.text){
    return res.status(400)
        .json({
            status: 'failure',
            message:'Sentence text required.'});
  }

  database
    .select('sentences.id', 'sentences.lang', 'sentences.text')
    .from('sentences')
    .where('sentences.text', req.body.text)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Found sentence'
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
module.exports = sentencesRouter;
