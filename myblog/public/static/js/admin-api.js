$(function() {
    var curId = '';
    var abstract = '';
    var curUrl = '';
    // 登出按钮事件
    $('#j-logout').click(function() {
        $.get('/api/login/logout?source=ajax', function(rs) {
            if (rs.statu == 'OK') {
                window.location.href = rs.redirection;
            } else {
                notification('登出失败!', 'danger');
            }
        });
    });
    // 创建MD编辑器配置参数
    var config = {
        width: "100%",
        height: window.innerHeight * .7,
        watch: false,
        // syncScrolling: "single",
        saveHTMLToTextarea: false,
        // markdown: md,
        path: "src/lib/" // Autoload modules mode, codemirror, marked... dependents libs path
    };

    // 点击新建文章按钮创建MD编辑器对象
    var editor;
    $('#add-article').click(function() {
        $(".modal").addClass('is-active');
        config.markdown = '';
        abstract = '';
        $('#editormd textarea').val('');
        $('#j-edit-title').val('');
        $('#j-tags-list li').removeClass('is-active');
        $('#j-info-addTime').html('待定');
        $('#j-info-editTime').html('待定');
        $('#j-info-visited').html('0');
        $('#j-info-like').html('0');
        console.log(config);
        editor = editormd("editormd", config);
    });

    // 关闭按钮点击事件
    $('.modal-close').click(function() {
        $(".modal").removeClass('is-active');
        editor = null;
        refreshBoxWrap(curUrl);
    });

    // 按照标签数据显示标签列表
    $.get('/api/get/list/tags', function(rs) {
        var aTag = rs.tag;
        $('#j-tags-list').html('');
        for (var i = 0; i < aTag.length; i++) {
            $('<li/>').addClass('panel-block').html(`
                <span class="panel-icon"><i class="fa fa-tags"></i></span>${aTag[i]}
            `).appendTo('#j-tags-list');
        }
        // 为标签列表设置选中行为
        $('.tags .panel-block').click(function() {
            $(this).toggleClass('is-active');
        });
    });

    // 为‘编辑’按钮设置打开编辑器行为
    $('#j-box-container').on('click', '.edit-article', function() {
        curId = $(this).parents('.box').attr('data-id');
        $.get('/api/get/content/id/' + curId, function(rs) {
            var result = rs.result[0];
            // 按照文章ID取回内容赋值给MD编辑器
            config.markdown = result.content;
            abstract = result.abstract;
            $(".modal").addClass('is-active');
            editor = editormd("editormd", config);
            // 赋值给标题
            $('#j-edit-title').val(result.title);
            // 赋值给Tag选择器
            for (var i = 0; i < result.tagId.length; i++) {
                $('#j-tags-list li:contains(' + result.tagId[i] + ')').addClass('is-active');
            }
            // 赋值给信息栏
            $('#j-info-addTime').html(formatTime(result.addTime));
            $('#j-info-editTime').html(formatTime(result.editTime));
            $('#j-info-visited').html(result.visited);
            $('#j-info-like').html(result.like);
        });
    });
    // 为‘删除’按钮设置删除行为
    $('#j-box-container').on('click', '.del-article', function() {
        var id = $(this).parents('.box').attr('data-id');
        $.ajaxSetup({ contentType: "application/json; charset=utf-8" });
        $.post('/api/admin/delete', JSON.stringify({ id: id }), function(rs) {
            if (rs.statu == 'OK') {
                notification('删除成功！删除时间为：' + formatTime(rs.result.editTime));
                $('.box[data-id=' + id + ']').remove();
            } else if (rs.statu == 'err') {
                notification('Error:' + rs.result.err, 'danger');
            }
        });
        console.log('curUrlInAdmin:' + curUrl);
        refreshBoxWrap(curUrl);
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

    // 保存按钮事件
    $('#j-button-save').click(function() {
        var req = { id: curId, update: {} };
        req.update.title = $('#j-edit-title').val();
        req.update.content = editor.getMarkdown();
        // var abstract=editor.getText();
        req.update.abstract = abstract == '' ? (function() { editor.setSelection({ line: 1, ch: 0 }, { line: 3, ch: 20 }); return editor.getSelection(); })() : abstract;
        req.update.tagId = [];
        $('#j-tags-list li.is-active').each(function() {
            req.update.tagId.push($.trim($(this).text()));
        });
        // req.update.editTime = new Date();
        $.ajaxSetup({ contentType: "application/json; charset=utf-8" });
        console.log(req);
        var postUrl = '';
        if (curId != '') {
            postUrl = '/api/admin/edit';
        } else {
            req.id = null;
            postUrl = '/api/admin/add';
        }
        $.post(postUrl, JSON.stringify(req), function(rs) {
            if (rs.statu == 'OK') {
                notification('保存成功！保存时间为：' + formatTime(rs.result.editTime));
            } else {
                notification('保存失败！原因为：' + rs.result.err, 'danger');
            }
            $('#j-button-save').removeClass('is-loading');
            $(".modal").removeClass('is-active');
            editor = null;
            refreshBoxWrap(curUrl);
        });
        $('#j-button-save').addClass('is-loading');
    });

    // 保存摘要按钮事件
    $('#j-button-abstract').click(function() {
        abstract = editor.getSelection();
        $('#j-abstract-tooltip').html(abstract).css({
            zIndex: 10,
            bottom: 45 + 'px',
            opacity: 1,
            width: 'auto',
            height: 'auto'
        });
    });
    $('#j-button-abstract').mouseover(function() {
        // $('#j-abstract-tooltip').show();
        $('#j-abstract-tooltip').css({
            zIndex: 10,
            bottom: 45 + 'px',
            opacity: 1,
            width: 'auto',
            height: 'auto'
        }).html(abstract);
    }).mouseout(function() {
        $('#j-abstract-tooltip').css({
            zIndex: -1,
            bottom: 80 + 'px',
            opacity: 0,
            width: 0,
            height: 0
        });
        // $('#j-abstract-tooltip').hide();
    });

    // 取消按钮事件
    $('#j-button-cancel').click(function() {
        $(".modal").removeClass('is-active');
        editor = null;
        refreshBoxWrap(curUrl);
    });
});