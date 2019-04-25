const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require("method-override");

mongoose.connect('mongodb://localhost:27017/masteredu', {useNewUrlParser: true});

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));


//Schemas for DB
var postSchema = new mongoose.Schema({
    title: String,
    image: String,
    content: String,
    createdAt: Date,
    /*author:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username: String
    },*/
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});
Post = mongoose.model("Post", postSchema);

var commentSchema = new mongoose.Schema({
    content:String,
    createdAt: {type: Date , default: Date.now}/*,
    author:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }*/
});
Comment = mongoose.model("Comment", commentSchema);

var userSchema = new mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    password:String,
    email: String,
    isAdmin: {type: Boolean, default: false}
});
User = mongoose.model("User", userSchema);

app.get('/', (req, res) =>
    res.render("landing")
);

app.get("/inicio", (req, res) =>
    res.render("index")
);

app.get("/info", (req, res) =>
    res.render("info")
);

app.get("/revise", (req, res) =>{
    Post.find({}, (err, allPost) =>{
        if(err){
            console.log(err);
        } else {
            res.render("topicos", {posts: allPost});
        }
    });
});

app.get("/postagem", (req, res) =>
    res.render("postagem")
);

app.post("/revise", (req, res) =>{
    var newPost = new Post({
        title: req.body.title,
        image:  req.body.img,
        content: req.body.content
    });
    Post.create(newPost, (err, newlyCreated)=>{
        if(err){
            console.log(err);
        } else {
            console.log(newlyCreated);
            res.redirect("/revise");
        }
    })
});

app.get("/revise/:id", function(req, res){
    //faz com que não retorne o ids do comments, e sim o conteudo.
    Post.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            console.log("deu errado aqui de novo");
            //return res.redirect('/campgrounds');
        } else {
            res.render("show", {post: foundCampground});
        }
    });
});

app.get("/revise/:id/edit", (req, res) =>{
    Post.findById(req.params.id, (err, foundPost) =>{
        res.render("edit", {post: foundPost});
    });
});

app.put("/revise/:id", (req, res) =>{
    Post.findByIdAndUpdate(req.params.id, req.body.post, (err, updatedPost) =>{
        if(err){
            console.log(err);
        } else {
            res.redirect("/revise/" + req.params.id);
        }
    });
});

app.delete("/revise/:id",(req, res) =>{
    Post.findByIdAndRemove(req.params.id, (err, postRemoved) =>{
        if(err){
            console.log(err);
        } else {
            res.redirect("/revise");
        }
    });
});

app.get("/revise/:id/comments/new", (req, res) => {
    Post.findById(req.params.id, (err, foundPost) => {
        if(err){
            console.log(err);
        } else {
            res.render("commentNew", {post: foundPost});
        }
    });
});

app.post("/revise/:id/comments", (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if(err){
            console.log(err);
        } else {
            Comment.create(req.body.comment, (err, commentCreated) => {
                if(err){
                    console.log(err);
                } else {
                    //comment.author.id = req.user._id;
                    //comment.author.username = req.user.username;
                    //comment.save();
                    post.comments.push(commentCreated);
                    post.save();
                    res.redirect("/revise/" + post._id);
                }
            });
        }
    });
});

app.listen(3000, () => console.log(`Example app listening on port ${3000}!`));