var express = require('express');
var app = express();

app.get('/', (req, res) => {
    res.render('index.jade', { title: "Test", message: "This is a message!" });
});

app.listen(3359, 'localhost', () => {
    console.log('Server is listening on port 3359');
});