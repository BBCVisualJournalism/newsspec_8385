define(['lib/news_special/bootstrap', 'full_experience', 'alternative_experience'], function (news, fullExperience, alternativeExperience) {
    function ViewManager() {
        this.defaultDatapoint = news.$('.dataviz').attr('data-point') || 'U5MR_';
        this.datapoint = this.defaultDatapoint;
        this.minYear = 1990;
        this.maxYear = 2013;
        this.year = this.maxYear;
        this.controlsExist = false;
                
        function resizeCompleted() {
            // Haven't resized for ...
            news.pubsub.emit('view_render:resize-map');
        }

        var timeoutId;
        window.addEventListener('resize', function (e) {
            //news.pubsub.emit('resize');

            clearTimeout(timeoutId);
            timeoutId = setTimeout(resizeCompleted, 100);

        }, false);
    }

    ViewManager.prototype = {
        _environmentSupportSVG: function () {
            return (!! document.createElementNS && !! document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect) ? true : false;
        },
                
        render: function () {
            var that = this;
            news.$('.holding-graphic').remove();
            if (that._environmentSupportSVG() && that.getViewportWidth() > 304) {
                news.$('.cm-map-title').addClass('hidden');
                news.$('.cm-map-cta').removeClass('hidden');
                news.$('.non-svg').remove();
                news.pubsub.emit('view_render:full-experience');
                if (!that.controlsExist) {
                    if (that.addFormControls() && that.addAnimControls()) {
                        that.controlsExist = true;
                    }
                }
            } else {
                news.$('.non-svg').removeClass('hidden');
            }

            return this;
        },

        addFormControls: function () {
            var that = this,
                backYear = Number(that.getBackYear(that.year)),
                nextYear = Number(that.getNextYear(that.year)),

                stepNavMarkup = '<div class="cm-step-nav-container">' +
                    '<a id="cm-back-button" class="cm-back-button cm-step-nav-button" data-year="2011" href="#2011">2011</a>' +
                    '<a id="cm-next-button" class="cm-next-button cm-step-nav-button" data-year="1990" href="#1990">1990</a>' +
                '</div>';

            news.$('.year').on('change', function () {
                that.year = $(this).val();
                news.pubsub.emit('view_render:render-data', [that.datapoint, that.year, that.getBackYear(that.year), that.getNextYear(that.year)]);
            });

            news.$('.cm-year-title').after(stepNavMarkup);
            news.$('.cm-step-nav-button').on('click', function (e) {
                e.preventDefault();
                that.year = $(this).attr('data-year');
                news.pubsub.emit('view_render:render-data', [that.datapoint, that.year, that.getBackYear(that.year), that.getNextYear(that.year)]);
                //news.pubsub.emit('istats', ['stepnav-clicked', 'newsspec-interaction', that.year]);
            });

            return true;
        },

        addAnimControls: function () {
            var that = this,
                myPlayPauseMarkup = '<a href="#" class="cm-play-button">' + news.$('.cm-controls-vocabs').attr('data-play') + '</a>' +
                    '<a href="#" class="cm-pause-button hidden">' + news.$('.cm-controls-vocabs').attr('data-pause') + '</a>' +
                    '<a href="#cm-container" class="cm-reset-button">' + news.$('.cm-controls-vocabs').attr('data-reset') + '</a>',
                myPlayModeButtonsMarkup = '<a class="cm-back-button cm-play-mode-button hidden" data-year="2011" href="#2011">2011</a>' +
                    '<a class="cm-next-button cm-play-mode-button hidden" data-year="1990" href="#1990">1990</a>';

            news.$('.cm-year-title').before('<div class="cm-anim-buttons-container">' + myPlayPauseMarkup + '</div>');
            news.$('.cm-play-button').on('click', function (e) {
                e.preventDefault();

                if (Number(that.year) === Number(that.maxYear)) {
                    that.year = Number(that.minYear);
                    // news.$('.cm-next-button').attr('data-year', that.getNextYear(that.year)); // Hack!
                } else {
                    that.year++; // We want to step forward. A bit hacky?
                }
                news.pubsub.emit('view_render:play-anim', [that.datapoint, that.year, that.minYear, that.maxYear]);
                news.pubsub.emit('istats', ['play-clicked', 'newsspec-interaction', that.datapoint]);
            });
            news.$('.cm-reset-button').on('click', function (e) {
                e.preventDefault();
                that.datapoint = that.defaultDatapoint;
                news.$('.datapoint[value=' + that.datapoint + ']').prop('checked', true);
                that.year = that.maxYear;
                news.pubsub.emit('view_render:pause-anim');
                news.pubsub.emit('view_render:render-data', [that.datapoint, that.year, that.getBackYear(that.year), that.getNextYear(that.year)]);
                news.pubsub.emit('istats', ['reset-clicked', 'newsspec-interaction', that.datapoint]);
            });


            news.$('.cm-step-nav-container').append(myPlayModeButtonsMarkup);
            news.$('.cm-pause-button, .cm-play-mode-button').on('click', function (e) {
                e.preventDefault();
                news.pubsub.emit('view_render:pause-anim');
                news.pubsub.emit('istats', ['pause-clicked', 'newsspec-interaction', that.datapoint]);
            });

            return true;
        },

        getBackYear: function (currentYear) {
            return (currentYear > this.minYear) ? (Number(currentYear) - 1) : this.maxYear;
        },

        getNextYear: function (currentYear) {
            return (currentYear < this.maxYear) ? (Number(currentYear) + 1) : this.minYear;
        },

        getViewportWidth: function () {
            return document.body.clientWidth;
        }
    };
    
    return new ViewManager();
});