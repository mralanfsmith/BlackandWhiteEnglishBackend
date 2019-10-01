// Black&WhiteAPI/api/routes/admin.js
// Include express
const express = require("express");

// Include express router middleware
const admin = express.Router();
const jwt = require('jsonwebtoken');
const database = require("../../database");
const middleware = require("../auth/jwt-check");
const configData = require("../config/auth-constants");
const dbHelper = require("../helpers/dbhelper");
const lib = require("../helpers/lib");

// Get all unapporved setences
admin.get("/pending-sentences", middleware.checkToken, (req, res) => {
    const limit = 10;
    let page = req.query.pg;
    if (page < 1 || !page) page = 1;
    const offset = (page - 1) * limit;

    database
    .select('sentences.id', 'sentences.lang', 'sentences.text','sentences.difficulty', 'sentences.usercreated','audios.audioid', 'audios.userid','audios.audiourl', 'videos.videoid','videos.userid','videos.videourl')
    .from('sentences')
    .leftJoin('audios','sentences.id','audios.sentenceid')
    .leftJoin('videos','sentences.id','videos.sentenceid')
    .where({'sentences.status': lib.Status.PENDING})
    .limit(limit)
    .offset(offset)
    .orderBy('sentences.id')
    .then((data) => {
        res.status(200)
          .json({
            status: 'success',
            data: data,
            message: 'Retrieved pending sentences'
          });
      })
      .catch((err) => {
        res.status(500)
          .json({
            status: 'Failure',
            data:err,
            message:'Error occurred'});
      });
 });

 // Update sentence status to approved/disapproved
 admin.post("/update-status", middleware.checkToken, async (req, res) => {
    
    if(!req.body.sentences && !req.body.audios) {
      return res.status(400)
      .json({
          status: 'failure',
          message:'Please provide sentences/audios to be updated.'});
    }
  
    if(req.body.sentences) {
      if(!req.body.sentences.idList || req.body.sentences.idList.length === 0){
        return res.status(400)
            .json({
                status: 'failure',
                message:'Sentences idList required.'});
      }
      if(!req.body.sentences.status || !(req.body.sentences.status === lib.Status.APPROVED || req.body.sentences.status === lib.Status.REJECTED)) {
        return res.status(400)
            .json({
                status: 'failure',
                message:'Sentences status approved/rejected required.'});
      }
    }

    if(req.body.audios) {
      if(!req.body.audios.idList || req.body.audios.idList.length === 0){
        return res.status(400)
            .json({
                status: 'failure',
                message:'Audios idList required.'});
      }
      if(!req.body.audios.status || !(req.body.audios.status === lib.Status.APPROVED || req.body.audios.status === lib.Status.REJECTED)) {
        return res.status(400)
            .json({
                status: 'failure',
                message:'Audios status approved/rejected required.'});
      }
    }
    try {
      if(req.body.sentences) {
        await dbHelper.updateSentencesStatus(req.body.sentences.idList, req.body.sentences.status)
      }
      if(req.body.audios) {
        await dbHelper.updateAudiosStatus(req.body.audios.idList, req.body.audios.status)
      }
      return res.status(200)
          .json({
            status: 'Success',
            message: 'Succesfully updated status of sentences/audios.'
          });
    } catch(err) {
      res.status(500)
      .json({
        status: 'Failure',
        data:err,
        message:'Error occurred while updating status'});
    }
 });

 // Add cart detail that contains new sentence
 admin.post("/add-card", middleware.checkToken, async (req, res) => {
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
    sentenceData.status = lib.Status.APPROVED
    const newSentenceId = await dbHelper.createSentence(sentenceData);
    await dbHelper.updateCard(req, newSentenceId[0], verifiedJwt.userId, lib.Status.APPROVED);
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
admin.post("/update-card", middleware.checkToken, async (req, res) => {
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
    await dbHelper.updateCard(req, req.body.sentenceId, verifiedJwt.userId, lib.Status.APPROVED);
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

// Exports the router object
module.exports = admin;