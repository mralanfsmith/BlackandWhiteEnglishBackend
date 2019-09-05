// WordOfMouthAPI/api/routes/favorites.js
// Include express
const express = require("express");

// Include express router middleware
const favoritesRouter = express.Router();
const jwt = require('jsonwebtoken');
const database = require("../../database");
const middleware = require("../auth/jwt-check");
const configData = require("../config/auth-constants");

// Add a sentence to favorites
favoritesRouter.post("/add", middleware.checkToken, (req, res) => {
    const saveData = {};
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

    database('favorites')
    .where('userid', verifiedJwt.userId)
    .andWhere('sentenceid', saveData.sentenceid)
    .first()
    .then(function (data) {
        if (data && typeof data !== "undefined") {
            return res.status(200)
                .json({
                status: 'success',
                message: 'Already added to favorite.'
            });
        }else{
            return database('favorites')
            .insert(saveData)
            .then(function (data) {
                res.status(200)
            .json({
                status: 'success',
                message: 'favorites added successfully.'
                });
            })
            .catch(function (err) {
                res.status(400)
                .json({
                    status: 'failure',
                    data:err,
                    message: 'Add favorites error!.'});
            });
        }
    });
    
 });

 // Remove a sentence from favorites
 favoritesRouter.delete("/remove", middleware.checkToken, (req, res) => {
    const deleteData = {};
    var verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
    if(req.body.sentenceid){
        deleteData.sentenceid = req.body.sentenceid;
    }else{
        res.status(400)
            .json({
                status: 'failure',
                message:'sentenceid required.'});
    }
    console.log(deleteData.sentenceid);
    database('favorites')
    .where('userid', verifiedJwt.userId)
    .andWhere('sentenceid', deleteData.sentenceid)
    .del()
    .then(function (data) {
        if (data === null || data === '' || data === 0) {
                return res.status(200)
                  .json({
                      status: 'failure',
                      message: 'Data does not exists'
                  });
              }
              else {
                return res.status(200)
                  .json({
                    status: 'success',
                    data
                });
              }
            })
            .catch(function (err) {
              res.status(500)
                .json({
                  status: 'failure',
                  data:err,
                  message:'Internal Server Error !'});
            });
    
 });

// Retrieve list of favorite sentences for user
favoritesRouter.get("/list",  middleware.checkToken, (req, res) => {
    var verifiedJwt = jwt.verify(req.headers.authorization, configData.user.secret);
    console.log(verifiedJwt);
    return database('favorites')
    .select(['favorites.created as created', 'userid', 'sentenceid', 'text', 'viewed'])
    .where('userid', verifiedJwt.userId)
    .innerJoin('sentences','favorites.sentenceid','sentences.id')
    .then(function (data) {
        res.status(200)
        .json({
            status: 'success',
            data: data
            });
        }).catch(function (err) {
        res.status(400)
        .json({
            status: 'failure',
            data:err,
            message: 'List favorites error!.'});
    });
 });

// Retrieve card for single favorite sentence


// Exports the router object
module.exports = favoritesRouter;