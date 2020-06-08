//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const dateFormat = require('dateformat');

const homeContent = "Welcome to Secret Garden - your personal diary.";
const diaryContent = "Here you can find all your diary entries.";
const newEntryContent = "Here you can add a new entry to your diary.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "My secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/diaryDB", {useNewUrlParser: true,  useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

let loggedUserName = null;

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.HOST_URL + "/auth/google/home",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    loggedUserName = profile.emails[0].value;
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

const postSchema = {
  title: String,
  content: String,
  date: String,
  userName: String
};

const Post = mongoose.model("Post", postSchema);

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile", "email"] })
);

app.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "/" }),
  function(req, res) {
    // Successful authentication, redirect to home.
    res.redirect("/home");
});

app.get("/", function(req, res){
  res.render("welcome");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      loggedUserName = user.username;
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });
});

app.get("/register", function(req, res){
  res.render("register", {error: null});
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.render("register", {error: err});
    } else {
      loggedUserName = user.username;
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});

app.get("/home", function(req, res){
  if (req.isAuthenticated()){
    res.render("home", {homeContent: homeContent, loggedUserName: loggedUserName});
  } else {
    res.redirect("/");
  }
});

app.get("/new-entry", function(req, res){
  if (req.isAuthenticated()){
    res.render("new-entry", {loggedUserName: loggedUserName});
  } else {
    res.redirect("/");
  }
});

app.post("/new-entry", function(req, res){
  if (req.isAuthenticated()){
    const post = new Post({
      title: req.body.postTitle,
      content: req.body.postBody,
      date: dateFormat(req.body.postDate, "dddd, mmmm dS, yyyy, h:MM:ss TT"),
      userName: req.body.userName
    });

    post.save(function(err){
      if (!err){
          res.redirect("/diary");
      }
    });
  } else {
    res.redirect("/");
  }
});

app.post("/delete-entry", function(req, res){
  if (req.isAuthenticated()){
    Post.deleteOne({ _id: req.body.postId, userName: loggedUserName }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/diary");
      }
    });
  } else {
    res.redirect("/");
  }
});


app.get("/diary-entries/:postId", function(req, res){

  if (req.isAuthenticated()){
    const requestedPostId = req.params.postId;

    Post.findOne({_id: requestedPostId, userName: loggedUserName}, function(err, post){
      res.render("post", {
        title: post.title,
        content: post.content,
        date: post.date
      });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/diary", function(req, res){
  if (req.isAuthenticated()){
    Post.find({userName: loggedUserName}, function(err, posts){
      res.render("diary", {
        diaryContent: diaryContent,
        posts: posts.reverse()
        });
    });
  } else {
    res.redirect("/");
  }
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started on port " + port);
});
