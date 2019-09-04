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

 // list user history
 historyRouter.get("/list", (req, res) => {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: 'No credentials sent!' });
    }
    var verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
   
    return database.raw(`select history.sentenceid, sentences.text, favorites.favoriteid, history.created, history.viewed, history.userid from history inner join sentences on history.sentenceid = sentences.id left join favorites on history.sentenceid = favorites.sentenceid`)
    // .select(['history.created as created', 'userid', 'sentenceid', 'viewed', 'text'])
    // .where('userid', verifiedJwt.userId)
    // .innerJoin('sentences','history.sentenceid','sentences.id')
    .then(function (data) {
        res.status(200)
        .json({
            status: 'success',
            data: data.rows
            });
        }).catch(function (err) {
        res.status(400)
        .json({
            status: 'failure',
            data:err,
            message: 'Add History error!.'});
    });
    
 });

// Exports the router object
module.exports = historyRouter;