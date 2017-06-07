/******************************************************************
 *                     初始化、设置加载
 ******************************************************************/
$(function() {
    // 标签切换刷新列表内容
    paginationAddEvent('/api/get/articles');
    $('#j-tabs').on('click', 'a', function() {
        // $('#j-box-wrap').html('');
        refreshBoxWrap('/api/get/articles/page/1?type=json');
    });
    // 建立tag分类筛选标签
    $.get('/api/get/list/tags', function(rs) {
        for (var i = 0; i < rs.tag.length; i++) {
            $('<li/>').html(`${rs.tag[i]}`).addClass('panel-block').appendTo('#j-label-tags');

            // 根据url更改选中的按钮
            var path = window.location.pathname;
            if (path.match(/\/tag\//i)) {
                var curTagName = path.replace(/^\/.+tag\//i, '');
                console.log(curTagName);
                $('#j-label-tags li').removeClass('active');
                $('#j-label-tags li:contains(' + curTagName + ')').addClass('active');
            }
        }
        $('#j-label-tags').on('click', 'li', function() {
            $('#j-label-tags li').removeClass('active');
            $('#j-box-wrap').html('');
            $(this).addClass('active');
            paginationAddEvent('/api/get/articles' + ($(this).index() == 0 ? '' : ('/tag/' + $(this).text())));
            // $.get('/api/get/articles' + ($(this).index() == 0 ? '' : ('/tag/' + $(this).text())) + '?type=json', function(rs) {
            //     for (var i = 0; i < rs.article.length; i++) {
            //         // console.log(rs.article[i]);
            //         $('<div/>').addClass('box').html(setBox(rs.article[i])).appendTo('#j-box-wrap');
            //         console.log(rs.allPagesArticles, rs.onePagesArticles, rs.curPagesArticles);
            //         pagination(rs.allPagesArticles, rs.onePagesArticles, rs.curPagesArticles);
            //     }
            // });
        });
    });
    // 建立日期分类筛选标签
    $.get('/api/get/list/dates', function(rs) {
        for (var i = 0; i < rs.date.length; i++) {
            $('<li/>').html(`${rs.date[i].year}年${rs.date[i].month}月（${rs.date[i].count}）`).addClass('panel-block').attr({ "data-year": rs.date[i].year, "data-month": rs.date[i].month }).appendTo('#j-label-dates');
        }
        $('#j-label-dates').on('click', 'li', function() {
            $('#j-label-dates li').removeClass('active');
            $('#j-box-wrap').html('');
            $(this).addClass('active');
            paginationAddEvent('/api/get/articles' + ($(this).index() == 0 ? '' : ('/date/' + $(this).attr('data-year') + '/' + $(this).attr('data-month'))));
            // $.get('/api/get/articles' + ($(this).index() == 0 ? '' : ('/date/' + $(this).attr('data-year') + '/' + $(this).attr('data-month'))) + '?type=json', function(rs) {
            //     for (var i = 0; i < rs.article.length; i++) {
            //         $('<div/>').addClass('box').html(setBox(rs.article[i])).appendTo('#j-box-wrap');
            //         pagination(rs.allPagesArticles, rs.onePagesArticles, rs.curPagesArticles);
            //     }
            // });
        });
    });
    // 建立访问量分类筛选标签
    // 建立点赞量分类筛选标签



});