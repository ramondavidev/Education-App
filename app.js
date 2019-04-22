const express = require('express');
const app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.get('/', (req, res) =>
    res.render("landing")
);

app.get("/inicio", (req, res) =>
    res.render("index")
);

app.get("/info", (req, res) =>
    res.render("info")
);

app.get("/revise", (req, res) =>
    res.render("topicos")
);

app.listen(3000, () => console.log(`Example app listening on port ${3000}!`));