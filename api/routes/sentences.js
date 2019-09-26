// WordOfMouthAPI/api/routes/sentences.js
// Include express
const express = require("express");

// Include express router middleware
const sentencesRouter = express.Router();
const database = require("../../database");
const middleware = require("../auth/jwt-check");
const jwt = require('jsonwebtoken');
const configData = require("../config/auth-constants");

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
sentencesRouter.get("/", (req, res, next) => { 
  const limit = 1;
  let page = req.query.pg;
  if (page < 1 || !page) page = 1;
  const offset = (page - 1) * limit;
  const lang = req.query.lang;
  const difficulty = req.query.difficulty ? JSON.parse(req.query.difficulty) : [1,2,3,4,5];

  database
    .select('sentences.id', 'sentences.lang', 'sentences.text','sentences.difficulty','sentences.usercreated','audios.userid','audios.licence','audios.attribution','audios.audiourl', 'favorites.sentenceid as favorite')
    .from('sentences')
    .leftJoin('audios','sentences.id','audios.sentenceid')
    .leftJoin('favorites','sentences.id','favorites.sentenceid')
    .where({'sentences.lang': lang})
    .whereIn('sentences.difficulty', difficulty)
    .limit(limit)
    .offset(offset)
    .orderBy('sentences.id', 'desc')
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

// Get Sentence by id
sentencesRouter.get("/:id", (req, res, next) => {
  let sentenceId = req.params.id;

  database
    .select('sentences.id', 'sentences.lang', 'sentences.text','sentences.difficulty','sentences.usercreated','audios.userid','audios.licence','audios.attribution', 'audios.audiourl', 'favorites.sentenceid as favorite')
    .from('sentences')
    .leftJoin('audios','sentences.id','audios.sentenceid')
    .leftJoin('favorites','sentences.id','favorites.sentenceid')
    .where('sentences.id', sentenceId)
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

// Get Translations for each sentence
 sentencesRouter.get("/translations/:id", (req, res, next) => { 
  let translationsId = req.params.id;
  let translation0 = req.query.translation0;
  if (translation0 == null || !translation0) translation0 = 'none';
  let translation1 = req.query.translation1;
  if (translation1 == null || !translation1) translation1 = 'none';
  let translation2 = req.query.translation2;
  if (translation2 == null || !translation2) translation2 = 'none';
  
database
  .select('sentences.id', 'sentences.lang', 'sentences.text', 'links.translationid')
  .from('sentences')
  .innerJoin('links','sentences.id','links.sentenceid')
  .where({'links.translationid':translationsId})
  .whereIn('sentences.lang', [translation0, translation1, translation2])
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

function getSentenceDifficulty(sentence) {
  let difficulty = 1;
  const numOfWords = sentence.split(' ').length;
  if(numOfWords <= 3) {
    difficulty = 1;
  } else if(numOfWords > 3 && numOfWords <= 6) {
    difficulty = 2;
  } else if(numOfWords > 6 && numOfWords <= 9) {
    difficulty = 3;
  } else if(numOfWords > 9 && numOfWords <= 12) {
    difficulty = 4;
  } else if(numOfWords > 12) {
    difficulty = 5;
  }
  return difficulty
}

// Add cart detail that contains new sentence and
sentencesRouter.post("/add-card", middleware.checkToken, async (req, res) => {
  const verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
  
  const sentenceData = {};
  
  if(!req.body.langText){
    res.status(400)
        .json({
            status: 'failure',
            message:'Sentence text required.'});
  }

  if(!req.body.lang) {
    res.status(400)
    .json({
        status: 'failure',
        message:'Sentence tanguage required.'});
  }
  sentenceData.text = req.body.langText;
  sentenceData.lang = req.body.lang;
  try {
    sentenceData.difficulty = getSentenceDifficulty(sentenceData.text);
    sentenceData.created = getCurrentTime();
    sentenceData.modified =  sentenceData.created;
    sentenceData.status = 'pending'
    sentenceData.usercreated = true;
    const newSentenceId = await database('sentences').insert(sentenceData).returning("id")
    try {
      await updateCard(req, newSentenceId[0], verifiedJwt.userId);
    } catch(err) {
      // await database('sentences').where('sentenceid', id).del()
      return res.status(500)
      .json({
        status: 'Failure',
        data:err,
        message:'Error occurred while updating card'});
    }
    res.status(200)
        .json({
            status: 'success',
            message: 'Card added successfully.'
            });
  } catch(err) {
    return res.status(500)
    .json({
      status: 'Failure',
      data:err,
      message:'Error occurred while saving sentence'});
  }
});

// Add cart detail that contains new sentence and
sentencesRouter.post("/update-card", middleware.checkToken, async (req, res) => {
  const verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
  if(req.body.sentenceId){
    try {
      await updateCard(req, req.body.sentenceId, verifiedJwt.userId);
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
  } else {
    res.status(400)
        .json({
            status: 'failure',
            message:'Sentence id required.'});
  }
})

// Get Sentence by id
sentencesRouter.post("/check-sentence", (req, res, next) => {
  if(!req.body.text){
    res.status(400)
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

function getCurrentTime() {
  var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
  var time = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
  return time.replace("T", " ");
}

async function updateCard (req , sentenceId, userId) {
  let transalationId = sentenceId;
  if(req.body.translatedText && req.body.translatedLang) {
    const transSentenceData = {};
    transSentenceData.lang = req.body.translatedLang
    transSentenceData.text = req.body.translatedText
    transSentenceData.difficulty = getSentenceDifficulty(transSentenceData.text);
    transSentenceData.created = getCurrentTime();
    transSentenceData.modified =  transSentenceData.created;
    transSentenceData.usercreated = true;
    transSentenceData.status = 'pending'
    const newId = await database('sentences').insert(transSentenceData).returning("id")
    transalationId = newId[0]
    await createLinks(sentenceId, transalationId);
  }
  if(req.body.audioURL) {
    const audio = {
      sentenceid: sentenceId,
      userid: userId,
      audiourl: req.body.audioURL,
      status : 'pending',
      created : getCurrentTime()
    }
    await database('audios').insert(audio)
  }
  if(req.body.videoURL) {
    const video = {
      sentenceid: sentenceId,
      userid: userId,
      videourl: req.body.videoURL,
      status : 'pending',
      created : getCurrentTime()
    }
    await database('videos').insert(video)
  }
  if(req.body.transalatedAudioURL) {
    const audio = {
      sentenceid: transalationId,
      userid: userId,
      audiourl: req.body.transalatedAudioURL,
      status : 'pending',
      created : getCurrentTime()
    }
    await database('audios').insert(audio)
  }
  if(req.body.transalatedVedioURL) {
    const video = {
      sentenceid: transalationId,
      userid: userId,
      videourl: req.body.transalatedVedioURL,
      status : 'pending',
      created : getCurrentTime()
    }
    await database('videos').insert(video)
  }
}

async function createLinks(sourceId, targetId) {
  const linksSourceLang = {
    sentenceid: sourceId,
    translationid: targetId
  }
  const linksTransaltionLang = {
    sentenceid: targetId,
    translationid: sourceId
  }
  await database('links').insert([linksSourceLang, linksTransaltionLang])
}

// Exports the router object
module.exports = sentencesRouter;
