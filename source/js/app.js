define(['lib/news_special/bootstrap', 'lib/news_special/share_tools/controller', 'view_manager'], function (news, shareTools, View) {

    return {
        init: function (storyPageUrl) {

            // news.pubsub.emit('istats', ['app-initiated', 'newsspec-nonuser', true]);

            // shareTools.init('.main', {
            //     storyPageUrl:  storyPageUrl,
            //     header:       'Share this page',
            //     message:      'Custom message',
            //     hashtag:      'BBCNewsGraphics'
            // });

            news.sendMessageToremoveLoadingImage();
            View.render();

            news.pubsub.on('view_render:resize-map', function () {
                View.render();
            });
        }
    };

});
