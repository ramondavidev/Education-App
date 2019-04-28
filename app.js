const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require("passport");
const LocalStrategy = require("passport-local");
const methodOverride = require("method-override");


const Post = require("./models/post"),
Comment = require("./models/comment"),
User = require("./models/user");
middleware = require("./middleware");

mongoose.connect('mongodb://localhost:27017/masteredu', {useNewUrlParser: true});



app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));

app.use(require("express-session")({
    secret: "type anything here",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    //whatever we put in res.locals is going to be available in all the templetes, so it takes req.user and pass through the templete as currentUser
    res.locals.currentUser = req.user;
    next(); 
});



app.get('/', (req, res) =>
    res.render("landing")
);

app.get("/inicio", (req, res) =>
    res.render("index")
);

app.get("/info", (req, res) =>
    res.render("info")
);

app.get("/revise", middleware.isLoggedIn, function(req, res){
    Post.find({}, function(err, allPost){
        if(err){
            console.log(err);
        } else {
            res.render("topicos", {posts: allPost});
        }
    });
});

app.get("/postagem", middleware.isAdmin, function(req, res){
    res.render("postagem");
});

app.post("/revise",middleware.isAdmin, function(req, res){
    var newPost = new Post({
        title: req.body.title,
        image:  req.body.img,
        content: req.body.content,
        author: {
            id: req.user._id,
            username: req.user.username
        }
    });
    Post.create(newPost, function(err, newlyCreated){
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
    Post.findById(req.params.id).populate("comments").exec(function(err, foundPost){
        if(err){
            console.log(err);
        } else {
            console.log(foundPost);
            //render show template with that post
            res.render("show", {post: foundPost});
        }
    });
});

app.get("/revise/:id/edit", middleware.checkCampgroundOwnership, (req, res) =>{
    Post.findById(req.params.id, (err, foundPost) =>{
        res.render("edit", {post: foundPost});
    });
});

app.put("/revise/:id", middleware.checkCampgroundOwnership, (req, res) =>{
    Post.findByIdAndUpdate(req.params.id, req.body.post, (err, updatedPost) =>{
        if(err){
            console.log(err);
        } else {
            res.redirect("/revise/" + req.params.id);
        }
    });
});

app.delete("/revise/:id", middleware.checkCampgroundOwnership, (req, res) =>{
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
                    commentCreated.author.id = req.user._id;
                    commentCreated.author.username = req.user.username;
                    commentCreated.save();
                    post.comments.push(commentCreated);
                    post.save();
                    res.redirect("/revise/" + post._id);
                }
            });
        }
    });
});

app.get("/revise/:id/comments/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            console.log(err);
        } else {
            res.render("editComments", {post_id: req.params.id, comment: foundComment});
        }
    });
});

app.put("/revise/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/revise/"+ req.params.id);
        }
    });
});

app.delete("/revise/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            console.log(err);
        } else {
            res.redirect("/revise/"+ req.params.id);
        }
    });
});

app.get("/registro", (req, res) => {
    res.render("register");
});

app.post("/registro", (req, res) => {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email
    });
    User.register(newUser, req.body.password, (err, user) => {
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () =>{
                res.redirect("/inicio");
            });
        }
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/inicio",
        failureRedirect: "/login"
    }),(req, res) => {

    });

app.get("/logout", (req, res)=>{
    req.logout();
    res.redirect("/revise");
});

app.get("/user/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            console.log(err);
        }
        Post.find().where('author.id').equals(foundUser._id).exec(function(err, posts){
            if(err){
                console.log(err);
            }
            res.render("profile", {user: foundUser, posts: posts});
        });
    });
});

app.listen(3000, () => console.log(`Example app listening on port ${3000}!`));