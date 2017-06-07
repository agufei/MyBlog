/******************************************************************
 *                     初始化、设置加载和公共函数
 ******************************************************************/
var express = require('express');
var myblog = require('./optDB.js');

// 实例化路由模块对象
var list = express.Router();
var articles = express.Router();
var content = express.Router();
var admin = express.Router();
var set = express.Router();
var login = express.Router();

// 获取单页最大文章数设置
var onePagesArticles;
myblog.Config.find(function(err, result) {
    onePagesArticles = result[0].onePagesArticles;
});

/**
 * getArticles(num, option, cb)
 * 获取文章信息公共函数，供路由响应函数调用
 * @param {number} num 当前要调用的页序号
 * @param {object} option 查询参数，用于不同查询条件
 * @param {function} cb 查询结果回调函数，只有一个回调参数result
 */
function getArticles(num, option, cb) {
    var allPagesArticles;

    // 为优化性能，查询时不查询正文内容和默认_id
    myblog.Article.count(option, function(err, result) { allPagesArticles = result; });
    myblog.Article.find(option, { _id: 0, content: 0 })
        .sort({ addTime: -1 })
        .skip((num - 1) * onePagesArticles)
        .limit(onePagesArticles)
        .exec(function(err, result) {
            // 初始化返回对象
            var json = {
                allPagesArticles: allPagesArticles,
                onePagesArticles: onePagesArticles,
                curPagesArticles: num,
                article: []
            };
            // 将查询到的数据存入返回对象
            result.forEach(function(item) {
                var tmpObj = {
                    id: item.id,
                    title: item.title,
                    addTime: formatTime(item.addTime),
                    editTime: formatTime(item.editTime),
                    tag: item.tagId,
                    visited: item.visited,
                    like: item.like,
                    fstPicUrl: item.fstPicUrl,
                    abstract: item.abstract
                };
                json.article.push(tmpObj);
            }, this);
            cb(json);
            // return json;


        });

}

/**
 * formatTime(date)
 * 格式化时间
 * @param {date} date 要进行格式化的Date类型数据
 * @returns {string}  格式化后的时间字符串
 */
function formatTime(date) {
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    return `${year}年${_toDB(month+1)}月${_toDB(day)}日 ${_toDB(hour)}:${_toDB(minutes)}`;

    function _toDB(n) {
        return n < 10 ? '0' + n : '' + n;
    }
}

/******************************************************************
 *                 /api/get/list路由的响应函数
 ******************************************************************/

// 响应/api/get/list/（tags、tagsinuse、dates）目录的路由函数
list.get('/:type', function(req, res) {
    var type = req.params.type;

    switch (type) {
        case 'tags':
            fnTags();
            break;
        case 'tagsinuse':
            fnTagsInUse();
            break;
        case 'dates':
            fnDates();
            break;
    }

    // 对标签请求响应的函数
    function fnTags() {
        var json = { tag: [] };
        myblog.Tag.find({}, { _id: 0, tagName: 1 }, function(err, result) {
            result.forEach(function(item) {
                json.tag.push(item.tagName);
            }, this);
            res.json(json);
        });
    }
    // 查询已经使用的标签和文章数
    function fnTagsInUse() {
        var json = { tags: [] };
        myblog.Article.aggregate([{ $unwind: "$tagId" }, { $group: { _id: "$tagId", count: { $sum: 1 } } }], function(err, result) {
            result.forEach(function(item) {
                json.tags.push({ tagName: item._id, count: item.count });
            }, this);
            res.json(json);
        });
    }
    // 对日期分类请求响应的函数
    function fnDates() {
        var json = { date: [] };
        // 采用聚合方式，按照文章建立的年和月进行分组统计数量
        myblog.Article.aggregate([{
            // 利用映射函数建立两个变量date_year和date_month存储文章的年和月
            $project: {
                date_year: { "$year": "$addTime" },
                date_month: { "$month": "$addTime" }
            }
        }, {
            // 按照文章的年和月对文章进行分组统计文章数量
            $group: {
                _id: { date_year: "$date_year", date_month: "$date_month" },
                count: {
                    $sum: 1
                }
            }
            // 将结果降序排列
        }, { $sort: { _id: -1 } }], function(err, result) {
            if (err) {
                console.err(err);
                return;
            } else {
                // 按照要求的格式返回数据
                result.forEach(function(item) {
                    var tempObj = {};
                    tempObj.year = item._id.date_year;
                    tempObj.month = item._id.date_month;
                    tempObj.count = item.count;
                    json.date.push(tempObj);
                }, this);
                res.json(json);
            }
        });
    }
});


/******************************************************************
 *                /api/get/articles路由的响应函数
 ******************************************************************/

// 响应/api/get/articles/目录的路由函数
articles.get('/', function(req, res) {
    getArticles(1, {}, function(result) {
        returnRes(res, req.query.type, result);
    });
});
// 响应/api/get/articles/page/目录的路由函数
articles.get('/page/:num', function(req, res) {
    getArticles(req.params.num, {}, function(result) {
        returnRes(res, req.query.type, result);
    });
});

// 响应/api/get/articles/tag/xxx目录的路由函数
articles.get('/tag/:tagName', function(req, res) {
    getArticles(1, { "tagId": req.params.tagName }, function(result) {
        returnRes(res, req.query.type, result);
    });
});
articles.get('/tag/:tagName/page/:num', function(req, res) {
    getArticles(req.params.num, { "tagId": req.params.tagName }, function(result) {
        returnRes(res, req.query.type, result);
    });
});

// 响应/api/get/articles/date/xxxx/xxx目录的路由函数
articles.get('/date/:year/:month?', function(req, res) {
    var option = req.params;
    // 判断option参数是否为年月条件
    if (option.year) {
        if (option.month) {
            option = { addTime: { $gte: new Date(parseInt(option.year), parseInt(option.month) - 1, 1, 0), $lt: new Date(parseInt(option.year), parseInt(option.month), 1, 0) } }
        } else {
            option = { addTime: { $gte: new Date(parseInt(option.year), 0), $lt: new Date(parseInt(option.year) + 1, 0) } }
        }
    }
    getArticles(1, option, function(result) {
        returnRes(res, req.query.type, result);
    });
});
// 响应/api/get/articles/date/xxxx/xxx/page/xxx目录的路由函数
articles.get(['/date/:year/:month/page/:num', '/date/:year/page/:num'], function(req, res) {
    var option = req.params;
    // 判断option参数是否为年月条件
    if (option.year) {
        if (option.month) {
            option = { addTime: { $gte: new Date(parseInt(option.year), parseInt(option.month) - 1, 1, 0), $lt: new Date(parseInt(option.year), parseInt(option.month), 1, 0) } }
        } else {
            option = { addTime: { $gte: new Date(parseInt(option.year), 0), $lt: new Date(parseInt(option.year) + 1, 0) } }
        }
    }
    getArticles(req.params.num, option, function(result) {
        returnRes(res, req.query.type, result);
    });
});

// 为res增加按照请求类型返回不用值的方法
function returnRes(res, type, val) {
    if (type == 'json') {
        res.json(val);
    } else {
        var data = {};
        data.articles = val.article;
        // res.json(data);
        res.render('archives.jade', data);
    }
}



/******************************************************************
 *                   /api/get/content路由的响应函数
 ******************************************************************/
// 响应页面跳转请求
content.get('/', function(req, res) {
    getContent(req.query.id, function(json) {
        if (json.statu == 'OK') {
            var data = {};
            var result = json.result[0];
            data.id = result.id;
            data.title = result.title;
            data.addTime = result.addTime;
            data.visited = formatTime(new Date(result.visited));
            data.like = result.like;
            data.tags = result.tagId;
            data.content = result.content;
            res.render('content.jade', data);
        }
    });
});
// 响应ajax查询请求
content.get('/id/:id', function(req, res) {
    getContent(req.params.id, function(json) { res.json(json) });
});

function getContent(id, cb) {
    var json = { result: {} };
    myblog.Article.find({ id: id }, { _id: 0 }, function(err, result) {
        if (err) {
            json.statu = 'err';
            json.result = err;
            cb(json);
        } else {
            // 如果查到文章为空，返回提示
            if (result.length == 0) {
                json.statu = 'Empty';
                json.result = '未找到这篇文章';
            } else {
                // 如果有内容，正常返回
                json.statu = 'OK';
                json.result = result;
            }
            cb(json);
        }
    });
}
/******************************************************************
 *                   /api/login路由的响应函数
 ******************************************************************/
login.post('/', function(req, res) {
    if (req.body.username == 'agufei' && req.body.password == '12345') {
        req.session.islogin = true;
        res.json({ statu: "OK", redirection: '/admin.html' });
    } else if (req.body.username && req.body.password) {
        myblog.User.findOne({ userName: req.body.username }, function(err, result) {
            if (req.body.password == result.password) {
                req.session.username = req.body.username;
                req.session.isUserLogin = true;
                res.json({ statu: "OK", username: req.body.username, redirection: '/' });
            } else {
                res.json({ statu: "err" });
            }
        });
    } else {
        res.json({ statu: "err" });
    }
});
login.get('/logout', function(req, res) {
    req.session.islogin = null;
    if (req.query.source == 'ajax') {
        res.json({ statu: 'OK', redirection: '/login.html' });
    }
    res.redirect('/login.html');
});
login.post('/regist', function(req, res) {
    if (req.body.username && req.body.password && req.body.phone) {
        var json = {};
        json.userName = req.body.username;
        json.password = req.body.password;
        json.info = { phone: req.body.phone };
        json.statu = true;
        myblog.User.create(json, function(err, result) {
            if (err) {
                res.json({ statu: "err", result: "数据库错误，未保存成功！" })
            } else {
                req.session.username = req.body.username;
                res.json({ statu: "OK", result: { username: req.body.username }, redirection: "/index.html" });
            }
        });
    } else {
        res.json({ statu: "err", result: "信息不完整，请重新填写！" });
    }
});
/******************************************************************
 *                   /api/admin路由的响应函数
 ******************************************************************/

// 后台对文章路由操作的函数
admin.post('/:type', function(req, res) {
    var type = req.params.type;
    var option = {};
    switch (type) {
        // 添加文章
        case 'add':
            option = req.body.update;
            myblog.Article.create(option, function(err, result) {
                var json = { result: {} };
                if (err) {
                    json.statu = 'err';
                    json.result = err;
                    res.json(json);
                } else {
                    json.statu = 'OK';
                    json.result = { editTime: result.editTime, option: option };
                    res.json(json);
                }
            });
            break;
            // 编辑文章
        case 'edit':
            option = req.body.update;
            option.editTime = new Date();
            myblog.Article.findOneAndUpdate({ id: req.body.id }, option, function(err) {
                var json = { result: {} };
                if (err) {
                    json.statu = 'err';
                    json.result = err;
                    res.json(json);
                } else {
                    json.statu = 'OK';
                    json.result.editTime = option.editTime;
                    res.json(json);
                }
            });
            break;
            // 删除文章
        case 'delete':
            myblog.Article.remove({ id: req.body.id }, function(err) {
                var json = { result: {} };
                if (err) {
                    json.statu = 'err';
                    json.result = err;
                    res.json(json);
                } else {
                    json.statu = 'OK';
                    json.result = { editTime: new Date() };
                    res.json(json);
                }
            });
            break;
    }
});

// 后台对Tag操作的路由响应函数
admin.post('/tag/:opt', function(req, res) {
    var opt = req.params.opt;
    var json = { result: {} };
    switch (opt) {
        case 'add':
            myblog.Tag.insert({ tagNage: req.body.newTagName }, function(err) {
                if (err) {
                    json.statu = 'err';
                    json.result = err;
                    res.json(json);
                } else {
                    json.statu = "OK";
                    myblog.Tag.find({ tagName: req.body.newTagName }, function(err, result) {
                        json.result = { addTime: result.addTime };
                        res.json(json);
                    });

                }
            });
            break;
        case 'delete':
            myblog.Tag.remove({ tagNage: req.body.tagName }, function(err) {
                var json = { result: {} };
                if (err) {
                    json.statu = 'err';
                    json.result = err;
                    res.json(json);
                } else {
                    json.statu = 'OK';
                    json.result = { editTime: new Date() };
                    res.json(json);
                }
            });
            break;
    }
});
/******************************************************************
 *                     /api/set路由的响应函数
 ******************************************************************/
// 如果客户端更新页面，对文章的点赞信息将会锁定
set.get('/like', function(req, res) {
    if (req.query.liked == 'true') {
        if (req.session.liked == null) {
            req.session.liked = {};
        }
        req.session.liked[req.query.id] = true;
        // console.log(req.session);
        res.json(req.session);
    }
});
set.post('/:type', function(req, res) {
    var type = req.params.type;
    var updateOption = {};
    var option = {};
    option[req.params.type] = 1;
    // return;
    if (type == 'like') {
        // req.session.liked = null;
        // console.log(req.session, req.body.addLike);
        if (req.session.liked && req.session.liked[req.body.id] == true) {
            myblog.Article.findOne({ id: req.body.id }, { _id: 0, like: 1 }, function(err, result) {
                res.json({ statu: 'deny', like: result.like });
            });
            return;
        }
        updateOption = req.body.addLike ? { $inc: { like: 1 } } : { $inc: { like: -1 } };
    } else {
        updateOption = { $inc: option };
    }
    myblog.Article.findOneAndUpdate({ id: req.body.id }, updateOption, function(err) {
        var json = { result: {} };
        if (err) {
            json.statu = 'err';
            json.result = err;
            res.json(json);
        } else {
            myblog.Article.find({ id: req.body.id }, option, function(err, result) {
                json.statu = 'OK';
                json.result[type] = result[0][type];
                res.json(json);
            });
        }
    });

});
/******************************************************************
 *                  将所有路由封装为模块以备调用
 ******************************************************************/

var apiObj = {};
// 将所有/api/get/list路由的响应方法存入返回对象
apiObj.list = list;
apiObj.articles = articles;
apiObj.content = content;
apiObj.admin = admin;
apiObj.set = set;
apiObj.login = login;
module.exports = apiObj;