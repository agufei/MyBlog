/******************************************************************
 *                       初始化、设置加载
 ******************************************************************/
// 声明一个url缓存全局变量，用来存储当前文章列表访问的api地址，
// 便于刷新列表使用
var curUrl = '';

$(function() {

    // header搜索栏效果
    $('.search input').focus(function() {
        $('.search').addClass('active');
    }).blur(function() {
        $('.search').removeClass('active');
    });

    // 左侧文章分类筛选选项卡
    $('.tags-list').hide();
    $('.tags-list').eq(0).show();
    $('.article-filter').each(function(i) {
        $(this).click(function() {
            $('.article-filter').removeClass('is-active');
            $('.tags-list').hide();
            (function(index) {
                $('.article-filter').eq(index).addClass('is-active');
                $('.tags-list').eq(index).show();
            })(i);
        });
    });
});


/******************************************************************
 *                           公共函数
 ******************************************************************/

/**
 * pagination(total, each, cur)
 * 更新页面分页按钮函数
 * @param {any} total 需要显示的总文章数
 * @param {any} each  每页需要显示的文章数
 * @param {any} cur   当前应该显示的页码
 */
function pagination(total, each, cur) {
    var allPages = Math.ceil(total / each);
    if (total <= each) {
        // 内容不足一页时不显示分页
        $('.pagination').hide();
    } else {
        $('.pagination').show();
        $('.pagination-list').html('');
        for (var i = 0; i < allPages; i++) {
            $('<a href="javascript:;"/>').addClass((i + 1) == cur ? 'pagination-link is-current' : 'pagination-link').attr({ 'data-page': (i + 1) }).html(i + 1).appendTo('.pagination-list').wrap('<li/>');
        }
        // 将前一页、后一页设置为disabled
        // $("a[data-page=" + cur + "]").attr('disabled', 'true');
        if (cur == 1) {
            $(".pagination-previous").attr('disabled', 'true');
            $(".pagination-next").removeAttr('disabled');
        } else if (cur == allPages) {
            $(".pagination-next").attr('disabled', 'true');
            $(".pagination-previous").removeAttr('disabled');
        } else {
            $(".pagination-previous").removeAttr('disabled');
            $(".pagination-next").removeAttr('disabled');

        }
        if (allPages > 6) {
            for (var i = 1; i < allPages - 1; i++) {
                if (i == cur - 3 || i == cur - 2 || i == cur - 1 || i == cur || i == parseInt(cur) + 1) continue;
                $('.pagination-link').eq(i).hide();
            }
            if (cur > 4) {
                $('a[data-page=1]').after($('<span/>').addClass('pagination-ellipsis').html('&hellip;'));
            }
            if (cur < allPages - 3) {
                $('a[data-page=' + allPages + ']').before($('<span/>').addClass('pagination-ellipsis').html('&hellip;'));
            }
        }
        // $('.pagination-list').on('click', 'a', function() { return refreshPagination(total, each, $(this).attr('data-page')) });


    }
}

/**
 * paginationAddEvent(url)
 * 根据传入的url为页码更新绑定事件并更新文章列表
 * @param {string} url 不含参数的get请求url
 */
function paginationAddEvent(url) {
    $('.pagination-list').off('click', 'a');
    var getUrl = url + '/page/' + 1 + '?type=json';
    refreshBoxWrap(getUrl);
    console.log(getUrl);
    $('.pagination-list').on('click', 'a', function() {
        console.log('clike:' + $(this).attr('data-page'));
        var getUrl = url + '/page/' + $(this).attr('data-page') + '?type=json';
        refreshBoxWrap(getUrl);
    });
}

/**
 * setBoxArchives(article)
 * 将传入的文章对象转换为HTML
 * @param {any} article 需要显示的列表文章对象
 * @returns {string} HTML字符串
 */
function setBoxArchives(article) {
    // console.log(article);
    return `<article class="media">
                <div class="media-left">
                    <figure class="image is-64x64">
                        <img src="/${article.fstPicUrl}" alt="Image">
                    </figure>
                </div>
                <div class="media-content">
                    <div class="content">
                        <p>
                            <a class="article-title" href="/api/get/content?id=${article.id}">
                                <strong>${article.title}</strong> <small>${article.addTime}</small> <small><span class="icon is-small"><i class="fa fa-user"></i></span>${article.visited}</small><small><span class="icon is-small"><i class="fa fa-heart"></i></span>${article.like}</small>
                                <br> ${article.abstract}
                            </a>
                        </p>
                    </div>
                </div>
            </article>`;
}

/**
 * setBoxAdmin(article)
 * 将传入的文章对象转换为HTML
 * @param {any} article 需要显示的列表文章对象
 * @returns {string} HTML字符串
 */
function setBoxAdmin(article) {
    // console.log(article);
    return `<article class="media">
                                <div class="media-left">
                                    <figure class="image is-64x64">
                                        <img src="${article.fstPicUrl}" alt="Image">
                                    </figure>
                                </div>
                                <div class="media-content">
                                    <div class="content">
                                        <p>
                                            <a href="/api/get/content?id=${article.id}" target="_blank">
                                                <strong>${article.title}</strong> <small>${article.addTime}</small> <small><span class="icon is-small"><i class="fa fa-user"></i></span>${article.visited}</small><small><span class="icon is-small"><i class="fa fa-heart"></i></span>${article.like}</small>
                                                <br> ${article.abstract}
                                            </a>
                                        </p>
                                    </div>
                                    <nav class="level is-mobile">
                                        <div class="level-left">
                                            <a class="level-item">
                                                <span class="icon"><i class="edit-article fa fa-pencil-square-o"></i></span>
                                            </a>
                                            <a class="level-item">
                                                <span class="icon"><i class="del-article fa fa-trash-o"></i></span>
                                            </a>
                                        </div>
                                    </nav>
                                </div>
                            </article>`;
}

/**
 * refreshBoxWrap(url)
 * 根据传入的url查询数据库显示文章文章列表，同时更新分页按钮的点击事件
 * @param {any} url 完整的查询url
 */
function refreshBoxWrap(url) {
    if (url != '') {
        curUrl = new String(url);
    } else {
        url = curUrl;
    }
    console.log("curUrl:" + curUrl);
    $.get(url, function(rs) {
        $('#j-box-wrap').html('');
        $('#j-box-container').html('');
        for (var i = 0; i < rs.article.length; i++) {
            $('<div/>').addClass('box').html(setBoxArchives(rs.article[i])).appendTo('#j-box-wrap');
            $('<div/>').addClass('box').attr('data-id', rs.article[i].id).html(setBoxAdmin(rs.article[i])).appendTo('#j-box-container');
        }
        // 通过正则匹配出url中的页码，以进一步为前一页和后一页设置对应页码
        var num = parseInt(url.match(/\/page\/(\d+)\?/)[1]);
        var preUrl = url.replace(/\d+(?=\?)/, num - 1);
        var nextUrl = url.replace(/\d+(?=\?)/, num + 1);
        // 设置前一页和后一页的事件（提前清除原有事件）
        $('.pagination-previous').off('click');
        $('.pagination-next').off('click');
        if (rs.curPagesArticles != 1) {
            $('.pagination-previous').on('click', function() {
                refreshBoxWrap(preUrl);
            });
        }
        if (rs.curPagesArticles != Math.ceil(rs.allPagesArticles / rs.onePagesArticles)) {
            $('.pagination-next').on('click', function() {
                refreshBoxWrap(nextUrl);
            });
        }
        // 更新分页列表
        pagination(rs.allPagesArticles, rs.onePagesArticles, rs.curPagesArticles);
    });
}

/**
 * formatTime(date)
 * 将Date类型的时间转换为正常的汉字格式
 * @param {any} date 日期类型的时间值
 * @returns {string}  汉字格式时间字符串
 */
function formatTime(date) {
    date = new Date(date);
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

function notification(string, type = 'primary') {
    var domNotifi = `
        <div class="notification is-${type}">
            <button class="delete"></button>
                ${string}
        </div>`;
    $(domNotifi).attr({ id: "j-notice" }).css({
        position: "fixed",
        top: "20px",
        left: '50%',
        zIndex: 999,
        width: window.innerWidth * .4,
        marginLeft: -window.innerWidth * .2
    }).appendTo('body');
    $('#j-notice .delete').click(function() {
        $(this).parent().hide();
    });
    setTimeout(function() {
        $('#j-notice').remove();
    }, 3000);
}