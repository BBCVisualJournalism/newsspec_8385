define(['lib/news_special/bootstrap'], function (news) {
    function render() {
        // console.log('rendering alternative experience');
    }
    
    news.pubsub.on('view_render:alternative-experience', render);
    
});