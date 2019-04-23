const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/masteredu', {useNewUrlParser: true});

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));


//Schemas for DB
var postSchema = new mongoose.Schema({
    title: String,
    image: String,
    content: String,
    createdAt: Date,
    author:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username: String
    },
    comment: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});
Post = mongoose.model("Post", postSchema);

var commentSchema = new mongoose.Schema({
    content:String,
    createdAt: {type: Date , default: Date.now},
    author:{
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
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

app.get("/revise", function(req, res){
    Post.find({}, function(err, allPost){
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

app.post("/revise", function(req, res){
    var newPost = new Post({
        title: req.body.title,
        image:  req.body.img,
        content: req.body.content
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

app.listen(3000, () => console.log(`Example app listening on port ${3000}!`));