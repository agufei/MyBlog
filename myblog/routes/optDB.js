let mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/myblog');

let db = mongoose.connection;

// 创建文章模板
let articleSch = mongoose.Schema({
    id: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
        default: () => {
            let newId = new mongoose.Types.ObjectId;
            return newId;
        }
    },
    title: String,
    tagId: [String],
    addTime: { type: Date, default: Date.now, index: true },
    editTime: { type: Date, default: Date.now },
    visited: { type: Number, default: 0 },
    like: { type: Number, default: 0 },
    fstPicUrl: { type: String, default: 'static/images/default-img.jpg' },
    abstract: String,
    content: String
});

// 创建Tag标签模板
let tagSch = mongoose.Schema({
    tagName: {
        type: String,
        unique: true
    },
    count: { type: Number, default: 0 },
    addTime: { type: Date, default: Date.now }
});

// 创建log日志模板
let logSch = mongoose.Schema({
    logTime: { type: Date, default: Date.now },
    statu: String,
    logContent: String
});

// 创建用户集合模板
let userSch = mongoose.Schema({
    userName: {
        type: String,
        unique: true
    },
    password: String,
    info: { phone: String },
    statu: Boolean
});

// 创建配置集合模板
let confSch = mongoose.Schema({
    onePagesArticles: Number
});

let Article = mongoose.model('Article', articleSch);
let Tag = mongoose.model('Tag', tagSch);
let Log = mongoose.model('Log', logSch);
let User = mongoose.model('User', userSch);
let Config = mongoose.model('Config', confSch);
let tempObj = {};
tempObj.Article = Article;
tempObj.Tag = Tag;
tempObj.Log = Log;
tempObj.User = User;
tempObj.Config = Config;
module.exports = tempObj;