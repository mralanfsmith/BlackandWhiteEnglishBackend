// WordOfMouthAPI/api/routes/sentences.js
// Include express
const express = require("express");

// Include express router middleware
const sentencesRouter = express.Router();
const database = require("../../database");

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
    .select('sentences.id', 'sentences.lang', 'sentences.text','sentences.difficulty','audios.username','audios.licence','audios.attribution', 'favorites.sentenceid as favorite')
    .from('sentences')
    .innerJoin('audios','sentences.id','audios.sentenceid')
    .leftJoin('favorites','sentences.id','favorites.sentenceid')
    .where({'sentences.lang': lang})
    .whereIn('sentences.difficulty', difficulty)
    .limit(limit)
    .offset(offset)
    .orderBy('sentences.id')
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
    .select('sentences.id', 'sentences.lang', 'sentences.text','sentences.difficulty','audios.username','audios.licence','audios.attribution', 'favorites.sentenceid as favorite')
    .from('sentences')
    .innerJoin('audios','sentences.id','audios.sentenceid')
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

// Add translation to sentence
favoritesRouter.post("/translations", middleware.checkToken, (req, res) => {
  const sentenceData = {};
  let linksDataLang1 = {};
  let linksDataLang2 = {};
  // var verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
  if(req.body.sentenceId){
    linksDataLang1.sentenceid = req.body.sentenceId;
    linksDataLang2.translationid = req.body.sentenceId;
  }else{
    res.status(400)
        .json({
            status: 'failure',
            message:'sentenceid required.'});
  }

  if(req.body.translatedLang){
    sentenceData.lang = req.body.translatedLang;
  }else{
    res.status(400)
        .json({
            status: 'failure',
            message:'translated Language required.'});
  }

  if(req.body.translationText){
    sentenceData.text = req.body.translationText;
  }else{
    res.status(400)
        .json({
            status: 'failure',
            message:'translation Text required.'});
  }

  sentenceData.difficulty = getSentenceDifficulty(sentenceData.text);

  var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
  var time = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
  sentenceData.created = time.replace("T", " ");
  // sentenceData.modified =  sentenceData.created;

  database('sentences')
  .insert(sentenceData)
  .then(function (data) {
    linksDataLang1.translationid = data.sentenceid;
    linksDataLang2.sentenceid = data.sentenceid;
    return database('links')
      .insert([linksDataLang1, linksDataLang2])
      .then(function (data) {
          res.status(200)
      .json({
          status: 'success',
          message: 'Translation added successfully.'
          });
      })
      .catch(function (err) {
          res.status(400)
          .json({
              status: 'failure',
              data:err,
              message: 'Add translation error!.'});
      });
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

// Exports the router object
module.exports = sentencesRouter;
