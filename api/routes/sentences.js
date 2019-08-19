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
  const page = req.query.pg;
  if (page < 1 || !page) page = 1;
  const offset = (page - 1) * limit;
  const lang = req.query.lang;

  database
    .select('sentences.id', 'sentences.lang', 'sentences.text','audios.username','audios.licence','audios.attribution')
    .from('sentences')
    .innerJoin('audios','sentences.id','audios.sentenceid')
    .where('sentences.lang', lang)
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

// Exports the router object
module.exports = sentencesRouter;
