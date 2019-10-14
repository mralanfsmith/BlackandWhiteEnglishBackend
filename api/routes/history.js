const express = require("express");
// Include express router middleware
const historyRouter = express.Router();
const jwt = require('jsonwebtoken');
const database = require("../../database");

const configData = require("../config/auth-constants");
// Add history to database

historyRouter.post("/add", (req, res) => {
    const saveData = {};
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' });
    }
    var verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
    if(req.body.sentenceid){
        saveData.sentenceid = req.body.sentenceid;
    }else{
        res.status(400)
            .json({
                status: 'failure',
                message:'sentenceid required.'});
    }
    saveData.userid = verifiedJwt.userId;
    saveData.viewed = 0;
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    var time = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
    saveData.created = time.replace("T", " ");

    database('history')
    .where('userid', verifiedJwt.userId)
    .andWhere('sentenceid', saveData.sentenceid)
    .first()
    .then(function (data) {
        if (data && typeof data !== "undefined") {
            console.log(data)
            saveData.viewed = data.viewed + 1;
            database('history')
            .where('historyid', data.historyid)
            .update(saveData)
            .then(function (data) {
              if (data === null || data === '' || data === 0) {
                return res.status(200)
                  .json({
                      status: 'Failure',
                      message: 'Update fail'
                  });
              }
              else {
                return res.status(200)
                  .json({
                    status: 'Success',
                    data
                });
              }
            })
            .catch(function (err) {
              res.status(400)
                .json({
                  status: 'failure',
                  data:err,
                  message:'Fialed to update user profile.'});
            });
        }else{
            return database('history')
                .insert(saveData)
                .then(function (data) {
                    res.status(200)
                .json({
                    status: 'success',
                    message: 'History added successfully.'
                    });
                })
                .catch(function (err) {
                    res.status(400)
                    .json({
                        status: 'failure',
                        data:err,
                        message: 'Add History error!.'});
                });
        }
    });

 });

 // Get History and fav total Count
 historyRouter.get("/count/", async (req, res, next) => { 
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No credentials sent!' });
  }
  var verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
  
  try {
    const historyCount = await database('history').where('userid', verifiedJwt.userId).count('historyid')
    const favCount = await database('favorites').where('userid', verifiedJwt.userId).count('favoriteid')
    const countData = {
      historyCount : historyCount[0].count,
      favoriteCount: favCount[0].count
    }
    return res.status(200)
      .json({
        status: 'success',
        data: countData,
        message: 'Retrieved Count'
      });
  } catch(err) {
    return res.status(400)
      .json({
        status: 'Failure',
        data:err,
        message:'Error occurring'});
  }
});

 // list user history
 historyRouter.get("/list", (req, res) => {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' });
    }
    var verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
    
    let page = req.query.pg;
    if (!page || page < 1) page = 1;
    let limit = req.query.limit;
    if (!limit || limit < 1) limit = 10;
    else if(limit > 100) limit = 100
    const offset = (page - 1) * limit;

    return database
      .select('history.historyid','history.sentenceid', 'sentences.text', 'favorites.favoriteid', 'history.created', 'history.viewed', 'history.userid')
      .from('history')
      .innerJoin('sentences','history.sentenceid','sentences.id')
      .leftJoin('favorites','history.sentenceid','favorites.sentenceid')
      .where('history.userid', verifiedJwt.userId)
      .limit(limit)
      .offset(offset)
      .orderBy('history.historyid', 'desc')
      .then(function (data) {
        return res.status(200)
            .json({
              status: 'Success',
              data
        });
      }).catch(function (err) {
      return res.status(400)
        .json({
            status: 'failure',
            data:err,
            message: 'Add History error!.'});
    });
    
 });

// Exports the router object
module.exports = historyRouter;