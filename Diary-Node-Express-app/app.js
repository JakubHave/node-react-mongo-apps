//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const dateFormat = require('dateformat');

const homeContent = "Welcome to your personal diary";
const diaryContent = "Here you can find all your diary entries";
const newEntryContent = "Here you can add a new entry to your diary";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true,  useUnifiedTopology: true});

const postSchema = {
  title: String,
  content: String,
  date: String
};

const Post = mongoose.model("Post", postSchema);

app.get("/", function(req, res){
    res.render("home", {homeContent: homeContent});
});

app.get("/new-entry", function(req, res){
  res.render("new-entry");
});

app.post("/new-entry", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    date: dateFormat(req.body.postDate, "dddd, mmmm dS, yyyy, h:MM:ss TT")
  });

  console.log(post);


  post.save(function(err){
    if (!err){
        res.redirect("/diary");
    }
  });
});

app.get("/diary-entries/:postId", function(req, res){

const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    res.render("post", {
      title: post.title,
      content: post.content,
      date: post.date
    });
  });

});

app.get("/diary", function(req, res){

  Post.find({}, function(err, posts){
    res.render("diary", {
      diaryContent: diaryContent,
      posts: posts.reverse()
      });
  });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
