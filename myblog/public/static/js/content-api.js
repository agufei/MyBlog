$(function() {
    // 滚动切换导航条
    $(document).scroll(function() {
        addWheel($(document)[0], function(down) {
            if (down) {
                $('.nav-ul').css('top', -68 + 'px');
            } else {
                $('.nav-ul').css('top', 0);
            }
        });
    });

    function addWheel(obj, fn) {
        if (window.navigator.userAgent.toLowerCase().indexOf('firefox') != -1) {
            obj.addEventListener('DOMMouseScroll', function(ev) {
                if (ev.detail > 0) {
                    var down = true;
                } else {
                    var down = false;
                }
                fn(down);
            }, false);
        } else {
            obj.onmousewheel = function(ev) {
                var oEvent = ev || event;
                if (oEvent.wheelDelta > 0) {
                    var down = false;
                } else {
                    var down = true;
                }
                fn(down);
            };
        }
    }
    // 向上或向下滚动
    var count = 0;
    setInterval(function() {
        var des = $(document).scrollTop() + count;
        if (des <= 0) {
            des = 0;
            count = 0;
        } else if (des > $(document).height() - $(window).height()) {
            des = $(document).height() - $(window).height();
            count = 0;
        }
        $(document).scrollTop(des);
    }, 50);
    $('.to-top').click(function() {
        count = -100;
        $('.nav-ul').css('top', 0);
    });
    $('.to-bottom').click(function() {
        count = 100;
    });

    // 通过页面ID标记，获取文章ID
    var sId = $('body').attr('data-id').replace(/"/g, '');

    // 转换Markdown文档至HTML
    var editor;
    $.get('/api/get/content/id/' + sId, function(rs) {
        // console.log(rs);
        // return;
        editor = editormd.markdownToHTML('j-content', {
            width: "100%",
            markdown: rs.result[0].content,
            path: "/src/lib/"
        });
    });

    // 变更日期显示格式
    console.log(formatTime($('#j-date').html()));
    $('#j-date').html(formatTime($(this).html()));

    // 更新访问数量
    var option = { id: sId };
    $.ajaxSetup({ contentType: "application/json; charset=utf-8" });
    $.post('/api/set/visited', JSON.stringify(option), function(rs) {
        if (rs.statu == 'OK') {
            $('#j-visited').html(rs.result.visited);
        }
    });

    // 点赞功能实现
    var likeFlag = false;
    var curNum = parseInt($('#j-like').html());
    var likeNum = curNum;
    $('#j-like-switch').on('click', likeClick);

    function likeClick() {
        likeFlag = !likeFlag;
        $(this).find('i').toggleClass('active');
        if (likeFlag) {
            $('#j-like').html(++likeNum);
        } else {
            $('#j-like').html(--likeNum);
        }
        if (!timer) {
            var timer = setTimeout(function() {
                if (curNum != likeNum) {
                    curNum = likeNum;
                    $.post('/api/set/like', JSON.stringify({ id: sId, addLike: likeFlag }), function(rs) {
                        if (rs.statu == 'deny') {
                            $('#j-like-switch').off('click', likeClick);
                            notification('您已点过赞了！谢谢关注！', 'warning');
                            $('#j-like').html(rs.like);
                        }
                    });
                }
            }, 1000);
        }

    }
    // 在离开页面时，发送点赞锁定请求，固定点赞信息
    $(window).on('beforeunload', function() {
        if (likeFlag) {
            $.get('/api/set/like?liked=true&id=' + sId);
        }
    });
});