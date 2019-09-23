// WordOfMouthAPI/api/routes/sentences.js
// Include express
const express = require("express");

// Include express router middleware
const sentencesRouter = express.Router();
const database = require("../../database");

const MAX_TATOEBA_RECORDS = 8045483;

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

// Add cart detail that contains new sentence and
sentencesRouter.post("/add-card", (req, res) => {
  const sentenceData = {};
  
  if(req.body.langText){
    sentenceData.text = req.body.langText;
  } else {
    res.status(400)
        .json({
            status: 'failure',
            message:'Sentence text required.'});
  }

  if(req.body.lang) {
    sentenceData.lang = req.body.lang;
  } else {
    res.status(400)
        .json({
            status: 'failure',
            message:'Sentence tanguage required.'});
  }

  return database('sentences').max('sentences.id')
  .then(function (data) {
    let id = MAX_TATOEBA_RECORDS + 1 
    if(data[0].max > MAX_TATOEBA_RECORDS) {
      id = data[0].max + 1;
    }
    sentenceData.id = id;
    sentenceData.difficulty = getSentenceDifficulty(sentenceData.text);
    sentenceData.created = getCurrentTime();
    sentenceData.modified =  sentenceData.created;

    return database('sentences')
    .insert(sentenceData)
    .then(function (data) {
      if(req.body.translatedText && req.body.translatedLang) {
        const transSentenceData = {};
        transSentenceData.id = id + 1;
        transSentenceData.lang = req.body.translatedLang
        transSentenceData.text = req.body.translatedText
        transSentenceData.difficulty = getSentenceDifficulty(transSentenceData.text);
        transSentenceData.created = getCurrentTime();
        transSentenceData.modified =  transSentenceData.created;
        return database('sentences')
        .insert(transSentenceData)
        .then(function (data) {
          const linksSourceLang = {
            sentenceid: id,
            translationid: transSentenceData.id
          }
          const linksTransaltionLang = {
            sentenceid: transSentenceData.id,
            translationid: id
          }
          return database('links')
            .insert([linksSourceLang, linksTransaltionLang])
            .then(function (data) {
                res.status(200)
                .json({
                    status: 'success',
                    message: 'Translation added successfully.'
                    });
            })
            .catch(function (err) {
                res.status(500)
                .json({
                    status: 'failure',
                    data:err,
                    message: 'Add translation error!33.'});
            });
        }).catch(function (err) {
          res.status(500)
          .json({
              status: 'failure',
              data:err,
              message: 'Add translation error!22.'});
          });
      } else {
        res.status(200)
        .json({
            status: 'success',
            message: 'sentence added successfully.'
            });
      }
    }).catch(function (err) {
      return res.status(500)
      .json({
          status: 'Failure',
          data:err,
          message: 'Add error error!11.'});
    });
  })
  .catch(function (err) {
    return res.status(500)
      .json({
        status: 'Failure',
        data:err,
        message:'Error occurring'});
  });
});

// Add translation to sentence
sentencesRouter.post("/add-translation", (req, res) => {
  if(!req.body.translatedText){
    res.status(400)
        .json({
            status: 'failure',
            message:'Translated text required.'});
  }

  if(!req.body.translatedLang) {
    res.status(400)
        .json({
            status: 'failure',
            message:'Translated language required.'});
  }

  return database('sentences').max('sentences.id')
  .then(function (data) {
    let id = MAX_TATOEBA_RECORDS + 1 
    if(data[0].max > MAX_TATOEBA_RECORDS) {
      id = data[0].max + 1;
    }
    const transSentenceData = {};
    transSentenceData.id = id;
    const sentenceId = req.body.sentenceId
    transSentenceData.lang = req.body.translatedLang
    transSentenceData.text = req.body.translatedText
    transSentenceData.difficulty = getSentenceDifficulty(transSentenceData.text);
    transSentenceData.created = getCurrentTime();
    transSentenceData.modified =  transSentenceData.created;
    return database('sentences')
    .insert(transSentenceData)
    .then(function (data) {
      const linksSourceLang = {
        sentenceid: sentenceId,
        translationid: transSentenceData.id
      }
      const linksTransaltionLang = {
        sentenceid: transSentenceData.id,
        translationid: sentenceId
      }
      return database('links')
        .insert([linksSourceLang, linksTransaltionLang])
        .then(function (data) {
            res.status(200)
            .json({
                status: 'success',
                message: 'Translation added successfully.'
                });
        })
        .catch(function (err) {
          console.log(JSON.stringify(err))
            res.status(500)
            .json({
                status: 'failure',
                data:err,
                message: 'Add translation error!33.'});
        });
    }).catch(function (err) {
      return res.status(500)
      .json({
          status: 'failure',
          data:err,
          message: 'Add translation error!22.'});
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

function getCurrentTime() {
  var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
  var time = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
  return time.replace("T", " ");
}

// Exports the router object
module.exports = sentencesRouter;
