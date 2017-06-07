// let mongoose = require('mongoose');
let myblog = require('./optDB.js');
// let yearArr = [2017, 2016, 2015];

// function rndYear() {
//     return yearArr[Math.floor(Math.random() * 3)];
// }

// function rndMonth() {
//     return Math.floor(Math.random() * 12 + 1);
// }

// function rndDate() {
//     return Math.floor(Math.random() * 31 + 1);
// }

// for (var i = 0; i < 105; i++) {

//     let atcl = new myblog.Article({
//         title: '这是一篇测试文档' + (i * 1111111),
//         tagId: ['js', 'bootstrap', 'css'],
//         addTime: new Date(rndYear(), rndMonth(), rndDate()),
//         abstract: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quas porro doloribus harum distinctio assumenda',
//         content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quas porro doloribus harum distinctio assumenda dolorum est excepturi sit ipsam quidem quaerat officia maiores, esse non, dolor ducimus eum ad! Ex!'
//     });

//     atcl.save((err) => {
//         if (err) {
//             console.log('err:' + err);
//         } else {
//             console.log('successful!');
//         }
//     });

let tag = new myblog.Tag({
    tagName: 'js'
});
tag.save((err) => {
    if (err) {
        console.log('err:' + err);
    } else {
        console.log('successful!');
    }
});

// let conf = new myblog.Config({
//     onePagesArticles: 10
// });

// conf.save((err) => {
//     if (err) {
//         console.log('err:' + err);
//     } else {
//         console.log('successful!');
//     }
// });

// myblog.Article.find(function(err, result) {
//     if (err) {
//         console.error(err);
//         return;
//     }
//     console.log(result);
// });
// }