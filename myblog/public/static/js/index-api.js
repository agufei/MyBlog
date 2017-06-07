$(function() {
    $.get('/api/get/articles?type=json', function(rs) {
        // console.log(rs);
        if (rs.article) {
            var aArt = rs.article;
            for (var i = 0; i < aArt.length; i++) {
                var curArt = aArt[i];
                var sTagId = '';
                for (var j = 0; j < curArt.tag.length; j++) {
                    sTagId += `<a href="/api/get/articles/tag/${curArt.tag[j]}"><i class="tag is-info">${curArt.tag[j]}</i></a>`;
                }
                $('<div/>').addClass('tile is-child').html(
                    `<section class="card">
                                <div class="card-image image is-4by3">
                                    <img src="${curArt.fstPicUrl}" alt="img">
                                </div>
                                <div class="card-content">
                                    <p class="title is-4"><a href="/api/get/content?id=${curArt.id}" target="_blank">${curArt.title}</a></p>
                                    <p class="subtitle is-6"><small>${curArt.addTime}</small>
                                        <span><i class="iconfont icon-xin"></i>${curArt.like}</span>
                                        <span><i class="iconfont icon-fangwen"></i>${curArt.visited}</span>
                                    </p>
                                    <p class="content">${curArt.abstract}</p>
                                </div>
                                <div id="j-tags" class="card-footer content">${sTagId}</div>
                            </section>`
                ).appendTo(i % 2 ? '#j-artList-r' : '#j-artList-l');
            }
        }
    });
    $.get('/api/get/list/tagsinuse', function(rs) {
        for (var i = 0; i < rs.tags.length; i++) {
            var curTag = rs.tags[i];
            $('<li/>').html(
                `<a class="level" href="/api/get/articles/tag/${curTag.tagName}"><strong class="level-left is-small">${curTag.tagName}</strong><span class="level-right is-medium">${curTag.count}</span></a>`
            ).appendTo('#j-tagList');
        }
    });
});