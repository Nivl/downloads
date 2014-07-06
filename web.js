'use strict';

var express = require('express');
var compression = require('compression');

var app = express();
var thirtyMinutes = 1800000;

app.use(compression());

app.use(express.static(__dirname + '/dist'), { maxAge: thirtyMinutes });

app.get('/', function (req, res) {
  res.sendfile('dist/index.html');
});


app.listen(process.env.PORT || 5000);
