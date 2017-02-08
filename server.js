"use strict";

var express = require("express");
var path = require("path");
var app = express();

app.use(express.static(path.join(__dirname)));

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});

var port = 4790;
app.listen(port);
console.log(`view app at http://localhost:${port}`);

exports = module.exports = app;