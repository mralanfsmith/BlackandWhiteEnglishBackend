//USER ROUTES
const express = require("express");
const usersRouter = express.Router(); //Express middleware for user route
const database = require("../../database"); //Require database
const moment = require('moment');
const Helper = require('../../controllers/Helper');
const uuidv4 = require('uuid/v4');

//Register User
usersRouter.post("/create", (req, res) => {
  console.log(req.body.email);
  console.log(req.body.password);
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({'message': 'Some values are missing'});
  }
  if (!Helper.isValidEmail(req.body.email)) {
    return res.status(400).send({ 'message': 'Please enter a valid email address' });
  }
  const hashPassword = Helper.hashPassword(req.body.password);

  return database('users')
      .select()
      .where({'email':req.body.email})
        .then(function (data) {
            if (data[0] === undefined || data[0] === null) {
                return database('users')
                .insert({
                    userid: uuidv4(),
                    username: req.body.username,
                    email: req.body.email,
                    userpassword: hashPassword,
                    verificationstatus: true,
                    created_date: moment(new Date()),
                    modified_date: moment(new Date()),
                    totalplays: 0,
                    dailyplays: 0,
                    weeklyplays: 0,
                    monthlyplays: 0
                  })
                .then(function (data) {
                    res.status(200)
                .json({
                    status: 'success',
                    data: data,
                    message: 'Account created successfully, click login and enter your username and password.'
                    });
                })
                .catch(function (err) {
                  res.status(400)
                    .json({
                      status: 'failure',
                      data:err,
                      message:'Account creation failed, please try again later.'});
                });
            }
            else {
                return res.status(200)
                .json({
                    status: 'failure',
                    message: 'An account with that email already exists. Please proceed to login if its your account.'
                });
            }
          })
  
});

//Login
usersRouter.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({'message': 'Some values are missing'});
  }
  if (!Helper.isValidEmail(req.body.email)) {
    return res.status(400).send({ 'message': 'Please enter a valid email address' });
  }

  return database('users')
  .select()
  .where('email', req.body.email)
    .then(function (data) {
        if (data[0].email === null || data[0].email === '') {
            res.status(400)
            .json({
                status: 'Failure',
                message: 'Email or password is invalid'
            });
        }
        else if (!Helper.comparePassword(data[0].userpassword, req.body.password)) {
          res.status(400)
          .json({
              status: 'Failure',
              message: 'Email or password is invalid'
          });
        }
        else {
          const token = Helper.generateToken(data[0].userid);
          return res.status(200)
                  .json({
                    status: 'sucess',
                    message:token});
            }
          })
    .catch(function (err) {
      res.status(400)
        .json({
          status: 'failure',
          data:err,
          message:'Login failed, please try again later.'});
    });
});

//Delete
usersRouter.post("/delete", (req, res) => {
  if (!req.body.userid) {
    return res.status(400).send({'message': 'No user credentials provided.'});
  }
  database('users')
  .where('userid', req.body.userid)
  .del()
  .then(function (data) {
    if (data === null || data === '' || data === 0) {
      return res.status(200)
        .json({
            status: 'Failure',
            message: 'User not found'
        });
    }
    else {
      return res.status(200)
        .json({
          status: 'Success',
          message: 'Account deleted'
      });
    }
  })
  .catch(function (err) {
    res.status(400)
      .json({
        status: 'failure',
        data:err,
        message:'Account deletion failed.'});
  });
});

// Exports the router object
module.exports = usersRouter;
