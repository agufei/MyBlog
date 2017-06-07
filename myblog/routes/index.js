var express = require('express');
var router = express.Router();
var option = {
    root: "./views/html/",
    dotfiles: "deny"
};
/* GET home page. */
router.get('/', function(req, res, next) {
    // res.render('index.jade', { title: 'Express', message: "This is a message!" });
    res.sendfile('index.html', option);
});
router.all('/admin.html', function(req, res, next) {
    console.log(req.session.islogin);
    if (req.session.islogin == true) {
        res.status(200).sendFile('admin.html', option);
    } else {
        res.redirect('/login.html');
    }
});
router.get('/:filename', function(req, res, next) {
    var filename = req.params.filename;
    res.sendFile(filename, option);
});

module.exports = router;