define(['lib/news_special/bootstrap', 'mortality_class_generator'], function (news, mortalityClass) {
    
    var svg,
        d3,
        HIGHLIGHT_CLASS_NAME = 'highlight',
        MAP_WIDTH_MIN = 320,
        MAP_WIDTH_MAX = 560,
        MAP_WIDTH_HEIGHT_RATIO = 0.9571429,
        MAP_MARGIN_OFFSET = 32, // 16 pixel left and right margins
        dataset,
        tooltip = {},
        animPlaying = false,
        animPaused = false,
        timerId = null,
        rangeBands = 6,

        // Tooltip positioning help
        animButtonsHeight = 0,
        flipMode = false,
        BREAKPOINT = 768 - 16,
        tooltipMinWidth = 100,
        tooltipHeightOffset = 64,
        rhsBuffer = 24,
        tooltipMaxLeft = 308 - (tooltipMinWidth + rhsBuffer),
        tooltipMaxTop = 300,

        // Store the country names translations here
        countryNames = {};
    
    function getCountryCode(countryObject) {
        return countryObject.properties.CODE;
    }
    
    function getCountryName(countryObject) {
        return countryObject.properties.NAME;
    }

    function getCountryData(countryObject) {
        return countryObject.properties.mortality;
    }
    
    function getClassSelector(countryObject) {
        return '.' + getCountryCode(countryObject);
    }
    
    function highlightCountry(countryObject) {
        d3.select(getClassSelector(countryObject)).classed(HIGHLIGHT_CLASS_NAME, true);

        updateTooltip(countryObject);
        showTooltip(countryObject);
    }
    
    function removeHighlight(countryObject) {
        d3.select(getClassSelector(countryObject)).classed(HIGHLIGHT_CLASS_NAME, false);

        hideTooltip();
    }
    
    function updateTooltip(countryObject) {
        var countryData;

        if (countryObject) {
            // Update using the tooltip properties our d3 bound data for this country
            tooltip.countryCode = getCountryCode(countryObject);
            tooltip.countryName = getCountryName(countryObject);
            countryData = getCountryData(countryObject);

            if (countryData && countryData[tooltip.datapoint + tooltip.year]) {
                tooltip.countryData = getCountryData(countryObject);
            } else {
                tooltip.countryData = false;
            }
        } else {
            tooltip.countryData = dataset[tooltip.countryCode] || false;
        }

        if (tooltip.countryData[tooltip.datapoint + tooltip.year]) {
            news.$('.tooltip').html(countryNames[tooltip.countryCode] + '<span class="tooltip-figure">' + tooltip.countryData[tooltip.datapoint + tooltip.year] + '</span>');
        } else {
            news.$('.tooltip').html(countryNames[tooltip.countryCode]);
        }

    }
    
    function showTooltip(countryObject) {
        news.$('.tooltip').addClass('tooltip--active');

    }
    
    function hideTooltip() {
        news.$('.tooltip').removeClass('tooltip--active');

    }

    function repositionTooltip(countryObject, pos) {

        // Check whether we have been passed the array of a position captured when a user clicked.
        // (Else the second param will contain a numerical value we don't need as we assume we're
        // dealing with a mouseover event and we'll grab the position from d3.mouse(this).)
        var position = ((pos instanceof Array) && pos.length === 2) ? pos : d3.mouse(this),
            myTop = (position[1] + 20 + animButtonsHeight) < tooltipMaxTop ?
                (position[1] + 15 + animButtonsHeight) :
                tooltipMaxTop,
            myLeft = position[0] + 20;

        if (flipMode && myLeft >= tooltipMaxLeft) {
            news.$('.tooltip').css({'top': myTop + 'px', 'left': tooltipMaxLeft + 'px'});

        } else {
            news.$('.tooltip').css({'top': myTop + 'px', 'left': myLeft + 'px'});
        }
    }

    function handleClick(e) {
        // Don't do anything if the target is an SVG path
        // Our other event call to handleShapeClick will deal with that instead
        if (news.$(e.target).is('path') || animPlaying === true) {
            return;
        }
        hideTooltip();
    }

    function handleShapeClick(countryObject) {

        var position = d3.mouse(this);
        news.$('.tooltip').css({'top': position[1] - 15 + 'px', 'left': position[0] + 15 + 'px'});
        highlightCountry(countryObject);

        repositionTooltip(countryObject, position);
        news.pubsub.emit('istats', ['map-clicked', 'newsspec-interaction']);
    }

    function getDisplayClassName(countryObject, datapoint, year) {
        var data = getCountryData(countryObject);

        if (data) {
            return mortalityClass.getClass(parseFloat(data[datapoint + year]), datapoint);
        } else {
            return 'no-data';
        }
    }
            
    function colorMap(datapoint, year) {
        d3.selectAll('.country').attr({
            'class': function (d) {
                return 'country ' + getDisplayClassName(d, datapoint, year);
            }
        });
        setTooltipProperties(datapoint, year);
    }

    function setTooltipProperties(datapoint, year) {
        tooltip.datapoint = datapoint;
        tooltip.year = year;
    }
    
    function render() {

        var lang = news.$('html').attr('lang') || 'en';
        
        require([   'data/africa_map',
                    'lib/vendors/mapping/d3',
                    'lib/vendors/mapping/topojson',
                    'data/africa_data_2013',
                    'data/country_names/' + lang
                ], function (
                    topography,
                    d3_,
                    topojson,
                    data,
                    translations) {
            news.$('.cm-map-container svg').remove();
            var containerWidth = news.$('.cm-map-container')[0].clientWidth - MAP_MARGIN_OFFSET,
                width       = getMapWidth(containerWidth),
                height      = getMapHeight(width),
                projection  = d3_.geo.mercator().scale(width * 0.7).translate([(width / 2) - 80, (height / 2) + 10]),
                datapointValue = getDataPointValue();

            d3              = d3_;
            dataset         = data;
            countryNames    = translations;
            
            svg = d3.select('.svg-container').append('svg').attr({'width': width, 'height': height});
            
            var path = d3.geo.path().projection(projection);
            
            var topo = topojson.feature(topography, topography.objects.africa_3).features;

            var countries = svg.append('g').selectAll('.country').data(topo);

            var nodes = countries.enter().append('path')
                .datum(function (d) { d.properties.mortality = data[getCountryCode(d)]; return d; })
                .attr({
                    'class': function (d) {
                        return 'country';
                    },
                    'd': path
                })
                .on('mouseenter', highlightCountry)
                .on('mouseleave', removeHighlight)
                .on('mousemove', repositionTooltip)

                .on('click', handleShapeClick);

            news.$('.cm-reset-button').trigger('click');

            // For hiding the tooltip if the user clicks off a map hotspot
            news.$('#cm-container').on('click', function (e) {
                //e.preventDefault();
                e.stopPropagation();
                handleClick(e);
            });
            addMapKey();

            animButtonsHeight = news.$('.cm-anim-buttons-container')[0].clientHeight || 0;
            tooltipMaxLeft = news.$('.cm-map-container')[0].clientWidth - (tooltipMinWidth + rhsBuffer) || 0;
            tooltipMaxTop = (news.$('.cm-map-container')[0].clientWidth * MAP_WIDTH_HEIGHT_RATIO) + animButtonsHeight - tooltipHeightOffset || 0;

            // If we're on the mobile layout the tooltip needs to be able to flip left
            // whenever it gets too close to the rhs edge
            flipMode = (getViewportWidth() >= BREAKPOINT) ? false : true;
        });
    }

    function getMapWidth(containerWidth) {
        var mapWidth = MAP_WIDTH_MIN;

        if (containerWidth >= MAP_WIDTH_MIN) {
            if (containerWidth >= MAP_WIDTH_MAX) {
                mapWidth = MAP_WIDTH_MAX;
            } else {
                mapWidth = containerWidth;
            }
        }

        return mapWidth;
    }

    function getMapHeight(width) {
        return (width * MAP_WIDTH_HEIGHT_RATIO) + 8;
    }

    function getDataPointValue(width) {
        return tooltip.datapoint ? tooltip.datapoint : news.$('.dataviz').attr('data-point');
    }

    function playMapAnim(datapoint, from, min, max) {

        var that = this;
        animPaused = false;
        animPlaying = true;
        
        news.$('.cm-play-button').addClass('hidden');
        news.$('.cm-pause-button').removeClass('hidden');

        // Hide the real back/next buttons and display spoof ones
        news.$('.cm-step-nav-button').addClass('hidden');
        news.$('.cm-play-mode-button').removeClass('hidden');

        function displayNextFrame() {
                
            if (Number(from) > Number(max)) {
                animPlaying = false;
                pauseMapAnim();
            }

            if (animPlaying === true) {
                news.$('#cm-next-button').trigger('click');
                from++;
            }
        }

        timerId = setInterval(displayNextFrame, 550);
    }

    function pauseMapAnim() {
        animPlaying = false;
        animPaused = true;
        clearInterval(timerId);
        
        news.$('.cm-play-button').removeClass('hidden');
        news.$('.cm-pause-button').addClass('hidden');

        // Re-instate the default UI for back/next
        news.$('.cm-step-nav-button').removeClass('hidden');
        news.$('.cm-play-mode-button').addClass('hidden');
    }

    function updateStepNav(backYear, nextYear) {
        news.$('.cm-back-button').text(backYear);
        news.$('.cm-back-button').attr('data-year', backYear);
        news.$('.cm-back-button').attr('href', '#' + backYear);

        news.$('.cm-next-button').text(nextYear);
        news.$('.cm-next-button').attr('data-year', nextYear);
        news.$('.cm-next-button').attr('href', '#' + nextYear);

    }

    function updateView(datapoint, year, backYear, nextYear) {
        // currentYear = year;
        // currentDatapoint = datapoint;
        colorMap(datapoint, year);
        updateTooltip();
        news.$('.cm-year-title').text(year);
        updateStepNav(backYear, nextYear);
    }

    function addMapKey() {
        news.$('.map-key-title').css('display', 'none');
        if (news.$('.cm-map-key').length < 1) {
            var keyNode = news.$('<div class="cm-map-key"></div>'),
                keyItems = [];

            for (var i = 0; i < rangeBands; i++) {
                keyNode.append('<div class="' + tooltip.datapoint + i + '"></div>');
            }
            keyNode.append('<div class="' + tooltip.datapoint + 'no-data"></div>');
            news.$('.cm-map-container').append(keyNode);
            news.$('.' + tooltip.datapoint + 'map-key-title').css('display', 'block');
        }
    }

    function getViewportWidth() {
        return document.body.clientWidth;
    }
    
    news.pubsub.on('view_render:full-experience', render);
    news.pubsub.on('view_render:render-data', updateView);
    news.pubsub.on('view_render:play-anim', playMapAnim);
    news.pubsub.on('view_render:pause-anim', pauseMapAnim);
    news.pubsub.on('view_render:hide-tooltip', hideTooltip);

});