var Travel = {
    maxPage: 15,
    albumImages: [],
    initialize: function () {
        Travel.loadPlaces();
        Travel.loadEvents();
    },
    loadEvents: function () {
        // $('.place').click(Travel.showContent);
        $('.place').on('mousemove', Travel.panImage);
        $('.album-btn').click(Travel.loadAlbumData);
        $('.scrolltop-btn').click(Travel.scrollTop);
        $(window).scroll(Travel.scrollListener);
        Travel.loadGoogleMaps();
        Travel.loadKeyboardEvents();
    },
    loadKeyboardEvents: function () {
        document.onkeydown = function (e) {
            switch (e.keyCode) {
                case 27:
                    if (!$("#map").hasClass("map-hidden")) {
                        $(".map-close-btn").click();
                    }
                    break;
                case 8:
                    if (!$("#map").hasClass("map-hidden")) {
                        $(".map-close-btn").click();
                    }
                    break;
            }
        };
    },
    showContent: function (e) {
        $(e.target).find('.content').toggleClass('content-visible');
        $(e.target).find('.background').toggleClass('background-covered');
    },
    loadPlaces: function () {
        var i = 0;
        for (var key in Travel.places) {
            var place = Travel.places[key];
            Travel.loadPlace(i + 1, key.toLowerCase(), place);
            var year = place.date.substring(place.date.length - 4, place.date.length);
            $('.places-select').append($('<option>', {
                value: i,
                text: place.name + " " + year
            }));
            i++;
        }
        $('.places-select').change(function () {
            if ($(".places-select")[0].selectedIndex === 0) {
                return;
            }
            $.scrollify.move(parseInt($(".places-select").val()));
            $(".places-select")[0].selectedIndex = 0;
        });
    },
    loadPlace: function (index, key, place) {
        $('#places').append('<div id="' + key + '" id="' + key + '" class="place">' +
            '<div class="content content-visible">' +
            (place.thumbnail ?
                '<div class="place-details">' +
                    '<div class="place-title wow fadeInUp">' +
                    place.name +
                    '</div>' +
                    '<div class="place-date wow fadeInUp">' + place.date + '</div>' +
                    '<div class="album-btn wow fadeIn" album-id="' + place.albumId + '">Album</div>' +
                    (place.blog ?
                        '<a href="' + place.blog + '"><div class="blog-btn wow fadeIn">Blog</div></a>' : '') +
                    '<div class="place-index fadeInUp">' + ("[" + index + "/" + Object.keys(Travel.places).length + "]") + '</div>' +
                    '</div></div>' +
                    '<div class="background background-covered" style="background: url(' + place.thumbnail + ');"></div>' : 'COMING SOON') +
            '</div>');
    },
    panImage: function (e) {
        var item = e.target.parentNode;
        $(item).children(".background").css({
            "transform-origin": ((e.pageX - $(item).offset().left) / $(item).width()) * 100 + "% " + ((e.pageY - $(item).offset().top) / $(item).height()) * 100 + "%"
        });
    },
    loadAlbumData: function (e) {
        $.scrollify.disable();
        Travel.toggleViews();
        Travel.resetAlbum();
        $.ajax({
            url: 'https://api.imgur.com/3/album/' + $(e.target).attr('album-id'),
            headers: {
                "Authorization": "Client-ID a52210b6349e55a"
            },
            type: 'GET',
            dataType: 'json',
            error: function () {
                console.error('unable to retrieve album from Imgur...');
            },
            success: function (album) {
                Travel.scrollTop();
                Travel.loadAlbum(album.data);
            }
        });
    },
    loadAlbum: function (album) {
        Travel.albumImages = album.images;
        $('#album').addClass('album-loaded');
        $('#album').empty();
        $('#album').append('<div class="album-info"><div class="album-info-container"><div class="album-title"></div><div class="album-count"></div><div class="close-album-btn">Close Album</div>' +
            '<div class="imgur-album-btn"><a href="' + album.link + '">Imgur</a></div></div></div>');
        $('.album-title').html(album.title);
        $('.album-count').html("(" + album.images.length + " images)");
        // load all or paginate, curremntly loading all
        var maxLoad = (Travel.albumImages.length < Travel.maxPage) ? Travel.albumImages.length : Travel.albumImages.length;
        for (var i = 0; i < maxLoad; i++) {
            var albumObj = Travel.albumImages[i];
            var imgUrl = albumObj.link;
            var thumbnail = albumObj.link;
            thumbnail = thumbnail.replace('.jpg', 'h.jpg');
            thumbnail = thumbnail.replace('http', 'https');
            Travel.loadAlbumImg(i, thumbnail, imgUrl);
        }
        if (Travel.albumImages.length > Travel.maxPage) {
            $('#album').append('<div class="load-more-btn">Load More</div>');
        }
        $('.album-img-overlay').click(Travel.loadAlbumImgSelected);
        $('.close-album-btn').click(Travel.closeAlbum);
        Travel.loadAlbumEvents();
    },
    loadAlbumImg: function (index, thumbnail, url) {
        $('#album').append('<div class="album-img" style="background: url(' + thumbnail + ');">' +
            ("<img src=\"" + thumbnail + "\" class=\"img\">") +
            '<a href="' + url + '" class="link-btn">' +
            '<div>' +
            '<i class="fa fa-2x fa-picture-o"></i>' +
            '</div>' +
            '</a>' +
            '<div class="album-img-overlay" album-img-index="' + index + '" img-url="' + url + '">' +
            '</div>' +
            '</div>');
    },
    loadAlbumEvents: function () {
        document.onkeydown = function (e) {
            switch (e.keyCode) {
                case 37:
                    if ($('.selected-img')[0]) {
                        Travel.loadPreviousImage();
                    }
                    else {
                        if ($('.album-grid').children().size() > 0) {
                            Travel.closeAlbum();
                        }
                    }
                    break;
                case 39:
                    if ($('.selected-img')[0]) {
                        Travel.loadNextImage();
                    }
                    break;
                case 27:
                    if ($('.selected-img')[0]) {
                        Travel.closeSelectedImage();
                    }
                    else {
                        if ($('.album-grid').children().size() > 0) {
                            Travel.closeAlbum();
                        }
                    }
                    break;
            }
        };
        $('.load-more-btn').click(function () {
            var offset = $('.album-img').size();
            if (offset < Travel.albumImages.length) {
                var maxLoad = (Travel.albumImages.length - offset < Travel.maxPage) ? Travel.albumImages.length - offset : Travel.maxPage;
                for (var i = offset; i < (offset + maxLoad); i++) {
                    var albumObj = Travel.albumImages[i];
                    var imgUrl = albumObj.link;
                    var thumbnail = albumObj.link;
                    thumbnail = thumbnail.replace('.jpg', 'h.jpg');
                    thumbnail = thumbnail.replace('http', 'https');
                    Travel.loadAlbumImg(i, thumbnail, imgUrl);
                }
                if (maxLoad < Travel.maxPage) {
                    $('.load-more-btn').remove();
                }
                $('.album-img-overlay').click(Travel.loadAlbumImgSelected);
            }
        });
        $('#album').scroll(function () {
            var h = $("#album")[0].scrollHeight;
            var p = $("#album").height() + $("#album").scrollTop();
            if (p == h) {
                $('.load-more-btn').click();
            }
        });
        $('.album-img').click(function (e) {
            if ($(e.target).find('.album-img-overlay').css('display') !== 'none' || true) {
                return;
            }
            var imgUrl = $(e.target).css('background-image');
            var stringUrl = imgUrl.substring(25, imgUrl.length - 2);
            if (stringUrl.length === 12 && stringUrl.includes('h.jpg')) {
                imgUrl = imgUrl.replace('h.jpg', '.jpg');
            }
            else {
                imgUrl = imgUrl.replace('.jpg', 'h.jpg');
            }
            $(e.target).css('background-image', imgUrl);
            $(e.target).toggleClass('album-img-select');
        });
    },
    loadNextImage: function () {
        var index = $('.selected-img').attr('index');
        if (++index > Travel.albumImages.length - 1) {
            index = 0;
        }
        var imgUrl = Travel.albumImages[index].link;
        var bgStyle = 'rgba(0, 0, 0, 0) url("' + imgUrl + '") no-repeat scroll 50% 50% / 100% padding-box border-box';
        $('.selected-img').css('background', bgStyle);
        $('.selected-img').attr('index', index);
    },
    loadPreviousImage: function () {
        var index = $('.selected-img').attr('index');
        if (--index < 0) {
            index = Travel.albumImages.length - 1;
        }
        var imgUrl = Travel.albumImages[index].link;
        var bgStyle = 'rgba(0, 0, 0, 0) url("' + imgUrl + '") no-repeat scroll 50% 50% / 100% padding-box border-box';
        $('.selected-img').css('background', bgStyle);
        $('.selected-img').attr('index', index);
    },
    resetAlbum: function () {
        $('#album').empty();
        setTimeout(function () {
            if (!$('#album').hasClass('album-loaded')) {
                $('#album').append('<span class="album-loading"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></span>');
            }
        }, 1000);
    },
    closeAlbum: function () {
        $.scrollify.enable();
        $('#header').show();
        Travel.toggleViews();
        setTimeout(function () {
            $('#album').empty();
            $('#album').removeClass('album-loaded');
        }, 500);
    },
    toggleViews: function () {
        $('#header').toggleClass('header-hidden');
        $('#footer').toggleClass('footer-hidden');
        $('#album').toggleClass('album-hidden');
        $('#places').toggleClass('places-hidden');
    },
    scrollListener: function (event) {
        if ($(window).scrollTop() > 100) {
            $('.scrolltop-btn').removeClass('scrolltop-btn-hidden');
        }
        else {
            $('.scrolltop-btn').addClass('scrolltop-btn-hidden');
        }
    },
    scrollTop: function (quick) {
        if (!quick) {
            $('body').scrollTop(0);
        }
        else {
            $('body').animate({
                scrollTop: 0
            }, "slow");
        }
    },
    loadAlbumImgSelected: function (e) {
        $('#album-img-selected').removeClass('album-img-selected-hidden');
        $('#album-img-selected').append('<div class="selected-img" index="' + $(e.target).attr('album-img-index') + '" style="background: url(' + $(e.target).attr('img-url') + ');"></div>');
        $('#album-img-selected').append('<span class="close-selected-img-btn"><i class="fa fa-close fa-3x"></i></span>');
        $('#album-img-selected').append('<div class="open-img-nav"><i class="fa fa-fw fa-arrow-circle-left fa-3x"></i>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="fa fa-fw fa-arrow-circle-right fa-3x"></i></div>');
        $('html').addClass('lock-scroll');
        $('.close-selected-img-btn').click(Travel.closeSelectedImage);
        Travel.loadAlbumImgSelectedEvents();
    },
    loadAlbumImgSelectedEvents: function () {
        $('.open-img-nav > .fa-arrow-circle-left').click(function () {
            Travel.loadPreviousImage();
        });
        $('.open-img-nav > .fa-arrow-circle-right').click(function () {
            Travel.loadNextImage();
        });
    },
    closeSelectedImage: function () {
        $('#album-img-selected').addClass('album-img-selected-hidden');
        setTimeout(function () {
            $('#album-img-selected').empty();
        }, 1000);
        $('html').removeClass('lock-scroll');
    },
    toggleGoogleMaps: function () {
        $('#map').toggleClass("map-hidden");
    },
    loadGoogleMaps: function () {
        google.maps.event.addDomListener(window, 'load', init);
        var map, markersArray = [];
        function bindInfoWindow(marker, map, location) {
            google.maps.event.addListener(marker, 'click', function () {
                function close(location) {
                    location.ib.close();
                    location.infoWindowVisible = false;
                    location.ib = null;
                }
                if (location.infoWindowVisible === true) {
                    close(location);
                }
                else {
                    markersArray.forEach(function (loc, index) {
                        if (loc.ib && loc.ib !== null) {
                            close(loc);
                        }
                    });
                    var boxText = document.createElement('div');
                    boxText.style.cssText = 'background: #fff;';
                    boxText.classList.add('md-whiteframe-2dp');
                    function buildPieces(location, el, part, icon) {
                        if (location[part] === '') {
                            return '';
                        }
                        else if (location.iw[part]) {
                            switch (el) {
                                case 'photo':
                                    if (location.photo) {
                                        return '<div class="iw-photo" style="background-image: url(' + location.photo + ');"></div>';
                                    }
                                    else {
                                        return '';
                                    }
                                    break;
                                case 'iw-toolbar':
                                    return '<div class="iw-toolbar"><h3 class="md-subhead">' + location.title + '</h3></div>';
                                    break;
                                case 'div':
                                    switch (part) {
                                        case 'email':
                                            return '<div class="iw-details"><i class="material-icons" style="color:#4285f4;"><img src="//cdn.mapkit.io/v1/icons/' +
                                                icon + '.svg"/></i><span><a href="mailto:' + location.email + '" target="_blank">' +
                                                location.email + '</a></span></div>';
                                            break;
                                        case 'web':
                                            return '<div class="iw-details"><i class="material-icons" style="color:#4285f4;"><img src="//cdn.mapkit.io/v1/icons/' +
                                                icon + '.svg"/></i><span><a href="' + location.web + '" target="_blank">' + location.web_formatted +
                                                '</a></span></div>';
                                            break;
                                        case 'desc':
                                            return '<label class="iw-desc" for="cb_details"><input type="checkbox" id="cb_details"/><h3 class="iw-x-details">Details</h3><i class="material-icons toggle-open-details"><img src="//cdn.mapkit.io/v1/icons/' +
                                                icon + '.svg"/></i><p class="iw-x-details">' + location.desc + '</p></label>';
                                            break;
                                        default:
                                            return '<div class="iw-details"><i class="material-icons"><img src="//cdn.mapkit.io/v1/icons/' +
                                                icon + '.svg"/></i><span>' + location[part] + '</span></div>';
                                            break;
                                    }
                                    break;
                                case 'open_hours':
                                    var items = '';
                                    for (var i = 0; i < location.open_hours.length; ++i) {
                                        if (i !== 0) {
                                            items += '<li><strong>' + location.open_hours[i].day + '</strong><strong>' + location.open_hours[i].hours + '</strong></li>';
                                        }
                                        var first = '<li><label for="cb_hours"><input type="checkbox" id="cb_hours"/><strong>' +
                                            location.open_hours[0].day + '</strong><strong>' + location.open_hours[0].hours +
                                            '</strong><i class="material-icons toggle-open-hours"><img src="//cdn.mapkit.io/v1/icons/keyboard_arrow_down.svg"/></i><ul>' +
                                            items + '</ul></label></li>';
                                    }
                                    return '<div class="iw-list"><i class="material-icons first-material-icons" style="color:#4285f4;"><img src="//cdn.mapkit.io/v1/icons/' +
                                        icon + '.svg"/></i><ul>' + first + '</ul></div>';
                                    break;
                            }
                        }
                        else {
                            return '';
                        }
                    }
                    boxText.innerHTML =
                        buildPieces(location, 'photo', 'photo', '') +
                            buildPieces(location, 'iw-toolbar', 'title', '') +
                            buildPieces(location, 'div', 'address', 'location_on') +
                            buildPieces(location, 'div', 'web', 'public') +
                            buildPieces(location, 'div', 'email', 'email') +
                            buildPieces(location, 'div', 'tel', 'phone') +
                            buildPieces(location, 'div', 'int_tel', 'phone') +
                            buildPieces(location, 'open_hours', 'open_hours', 'access_time') +
                            buildPieces(location, 'div', 'desc', 'keyboard_arrow_down');
                    var myOptions = {
                        alignBottom: true,
                        content: boxText,
                        disableAutoPan: true,
                        maxWidth: 0,
                        pixelOffset: new google.maps.Size(-140, -40),
                        zIndex: null,
                        boxStyle: {
                            opacity: 1,
                            width: '280px'
                        },
                        closeBoxMargin: '0px 0px 0px 0px',
                        infoBoxClearance: new google.maps.Size(1, 1),
                        isHidden: false,
                        pane: 'floatPane',
                        enableEventPropagation: false
                    };
                    location.ib = new InfoBox(myOptions);
                    location.ib.open(map, marker);
                    location.infoWindowVisible = true;
                }
            });
        }
        function init() {
            var mapOptions = {
                center: new google.maps.LatLng(35.29943588555779, -93.84887800000001),
                zoom: 3,
                gestureHandling: 'auto',
                fullscreenControl: false,
                zoomControl: true,
                disableDoubleClickZoom: true,
                mapTypeControl: false,
                scaleControl: true,
                scrollwheel: false,
                streetViewControl: false,
                draggable: true,
                clickableIcons: false,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [{
                        "stylers": [{
                                "hue": "#ff1a00"
                            }, {
                                "invert_lightness": true
                            }, {
                                "saturation": -100
                            }, {
                                "lightness": 33
                            }, {
                                "gamma": 0.5
                            }]
                    }, {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [{
                                "color": "#2D333C"
                            }]
                    }, {
                        "featureType": "road",
                        "elementType": "geometry",
                        "stylers": [{
                                "color": "#eeeeee"
                            }, {
                                "visibility": "simplified"
                            }]
                    }, {
                        "featureType": "road",
                        "elementType": "labels.text.stroke",
                        "stylers": [{
                                "visibility": "off"
                            }]
                    }, {
                        "featureType": "administrative",
                        "elementType": "labels.text.stroke",
                        "stylers": [{
                                "color": "#ffffff"
                            }, {
                                "weight": 3
                            }]
                    }, {
                        "featureType": "administrative",
                        "elementType": "labels.text.fill",
                        "stylers": [{
                                "color": "#2D333C"
                            }]
                    }]
            };
            var mapElement = document.getElementById('mapkit-google-map');
            var map = new google.maps.Map(mapElement, mapOptions);
            var locations = Travel.locations;
            for (i = 0; i < locations.length; i++) {
                marker = new google.maps.Marker({
                    icon: locations[i].marker,
                    position: new google.maps.LatLng(locations[i].lat, locations[i].lng),
                    map: map,
                    title: locations[i].title,
                    address: locations[i].address,
                    desc: locations[i].desc,
                    tel: locations[i].tel,
                    int_tel: locations[i].int_tel,
                    vicinity: locations[i].vicinity,
                    open: locations[i].open,
                    open_hours: locations[i].open_hours,
                    photo: locations[i].photo,
                    time: locations[i].time,
                    email: locations[i].email,
                    web: locations[i].web,
                    iw: locations[i].iw
                });
                markersArray.push(marker);
                if (locations[i].iw.enable === true) {
                    bindInfoWindow(marker, map, locations[i]);
                }
            }
        }
    },
    places: {
        "miami": {
            "name": "Miami",
            "date": "February 18th 2017",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/OZSzOBdh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "http://imgur.com/a/1V2NW",
            "albumId": "1V2NW"
        },
        "frenchpolynesia": {
            "name": "French Polynesia",
            "date": "December 24th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/m6SQFJQh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "http://imgur.com/a/CzjgH",
            "blog": "http://avarghese.me/blog/travel/2016/12/24/french-polynesia.html",
            "albumId": "CzjgH"
        },
        "phuket": {
            "name": "Phuket",
            "date": "November 22nd 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/3ToI0jJh.jpg",
            "rank": 5,
            "tags": "",
            "places": "",
            "album": "http://imgur.com/a/cvkkT",
            "blog": "http://avarghese.me/blog/travel/2016/11/19/thailand.html",
            "albumId": "cvkkT"
        },
        "bangkok": {
            "name": "Bangkok",
            "date": "November 19th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/DZJB5Glh.jpg",
            "rank": 5,
            "tags": "",
            "places": "",
            "album": "http://imgur.com/a/4OJ0x",
            "blog": "http://avarghese.me/blog/travel/2016/11/19/thailand.html",
            "albumId": "4OJ0x"
        },
        "costarica": {
            "name": "Costa Rica",
            "date": "October 7th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/KAYGUVah.jpg",
            "rank": 10,
            "tags": "",
            "places": "",
            "album": "http://imgur.com/a/Mv4CT",
            "blog": "http://avarghese.me/blog/travel/2016/10/07/costa-rica.html",
            "albumId": "Mv4CT"
        },
        "bigsur": {
            "name": "Big Sur",
            "date": "September 23rd 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/Q0lyf12h.jpg",
            "rank": 2,
            "tags": "roadtrip,bigsur",
            "places": "",
            "album": "http://imgur.com/a/V3P0z",
            "blog": "http://avarghese.me/blog/travel/2016/09/23/big-sur-roadtrip.html",
            "albumId": "V3P0z"
        },
        "negril": {
            "name": "Negril",
            "date": "August 26th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/pawE6y2h.jpg",
            "rank": 2,
            "tags": "resort,jamaica,villas,cliffjump",
            "places": "",
            "album": "http://imgur.com/a/go1Dc",
            "blog": "http://avarghese.me/blog/travel/2016/08/26/negril.html",
            "albumId": "go1Dc"
        },
        "puertovallarta": {
            "name": "Puerto Vallarta",
            "date": "August 20th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/tI4r2nNh.jpg",
            "rank": 5,
            "tags": "resort,mexico,infinitypool",
            "places": "",
            "album": "http://imgur.com/a/t4kRN",
            "blog": "http://avarghese.me/blog/travel/2016/08/20/puerto-vallarta.html",
            "albumId": "t4kRN"
        },
        "chicago": {
            "name": "Chicago",
            "date": "August 6th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/UURlnKlh.jpg",
            "rank": 20,
            "tags": "architecture,pier,cruise,pizza",
            "places": "",
            "album": "http://imgur.com/a/rCay6",
            "blog": "",
            "albumId": "rCay6"
        },
        "puertorico": {
            "name": "Puerto Rico",
            "date": "July 8th 2016",
            "description": "a description",
            "thumbnail": "http://imgur.com/R1KRe85h.jpg",
            "rank": 1,
            "tags": "architecture,hiking,towns,mofungo",
            "places": "",
            "album": "http://imgur.com/a/CWr4t",
            "blog": "http://avarghese.me/blog/travel/2016/07/08/puerto-rico-trip.html",
            "albumId": "CWr4t"
        },
        "sanfrancisco": {
            "name": "San Francisco",
            "date": "July 2nd 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/mQZnMf4h.jpg",
            "rank": 20,
            "tags": "walking,city,pier",
            "places": "",
            "album": "http://imgur.com/a/6CEOm",
            "blog": "",
            "albumId": "6CEOm"
        },
        "barcelona": {
            "name": "Spain",
            "date": "May 13th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/RLSRJv0h.jpg",
            "rank": 1,
            "tags": "architecture,hiking",
            "places": "",
            "album": "http://imgur.com/a/0Wx24",
            "blog": "http://avarghese.me/blog/travel/2016/05/16/barcelona-spain-trip.html",
            "albumId": "0Wx24"
        },
        "italy": {
            "name": "Italy",
            "date": "May 4th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/Z9dw87jh.jpg",
            "rank": 1,
            "tags": "countryside,hiking,city,gondolas",
            "places": "",
            "album": "http://imgur.com/a/z7iaO",
            "blog": "http://avarghese.me/blog/travel/2016/05/15/italy-trip.html",
            "albumId": "z7iaO"
        },
        "colorado": {
            "name": "Colorado",
            "date": "April 9th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/QRil5OBh.jpg",
            "rank": 1,
            "tags": "tropical,resort,watersports",
            "places": "",
            "album": "http://imgur.com/a/GznDe",
            "blog": "",
            "albumId": "GznDe"
        },
        "cabosanlucas": {
            "name": "Cabo San Lucas",
            "date": "February 6th 2016",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/PWBSQp9h.jpg",
            "rank": 10,
            "tags": "parasailing,tropical",
            "places": "",
            "album": "http://imgur.com/a/of5lB",
            "blog": "",
            "albumId": "of5lB"
        },
        "saintlucia": {
            "name": "Saint Lucia",
            "date": "November 27th 2015",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/3Jr1CVKh.jpg",
            "rank": 1,
            "tags": "tropical,resort,volcanicbath",
            "places": "",
            "album": "http://imgur.com/a/OZl4l",
            "blog": "",
            "albumId": "OZl4l"
        },
        "cancun": {
            "name": "Cancun",
            "date": "November 13th 2015",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/Vz7Yeoch.jpg",
            "rank": 5,
            "tags": "tropical,canyoneering",
            "places": "",
            "album": "http://imgur.com/a/Y1IKS",
            "blog": "",
            "albumId": "Y1IKS"
        },
        "vancouver": {
            "name": "Vancouver",
            "date": "September 3rd 2015",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/WtjP0CEh.jpg",
            "rank": 10,
            "tags": "cold,nature,hiking",
            "places": "",
            "album": "http://imgur.com/a/FrNOL",
            "blog": "",
            "albumId": "FrNOL"
        },
        "paris": {
            "name": "Paris",
            "date": "June 21st 2015",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/4o5ud9kh.jpg",
            "rank": 10,
            "tags": "city,tourism",
            "places": "",
            "album": "http://imgur.com/a/8fFJT",
            "blog": "",
            "albumId": "8fFJT"
        },
        "maldives": {
            "name": "Maldives",
            "date": "June 16th 2015",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/x8f8KgRh.jpg",
            "rank": 1,
            "tags": "tropical,resort,watersports",
            "places": "",
            "album": "http://imgur.com/a/AHnS7",
            "blog": "",
            "albumId": "AHnS7"
        },
        "eastcoasts": {
            "name": "East Coast Roadtrip S",
            "date": "April 23rd 2015",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/7iQpKc8h.jpg",
            "rank": 10,
            "tags": "east-coast,driving,roadtrip",
            "places": "sanfrancisco,losangeles,sandiego",
            "album": "http://imgur.com/a/03ibF",
            "blog": "",
            "albumId": "03ibF"
        },
        "japan": {
            "name": "Japan",
            "date": "December 19th 2014",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/sWsF4tMh.jpg",
            "rank": 10,
            "tags": "city",
            "places": "",
            "album": "http://imgur.com/a/wF1UV",
            "blog": "",
            "albumId": "wF1UV"
        },
        "eastcoastn": {
            "name": "East Coast Roadtrip N",
            "date": "November 8th 2014",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/Em5c4kdh.jpg",
            "rank": 10,
            "tags": "eastcoast,driving,roadtrip",
            "places": "",
            "album": "http://imgur.com/a/x8Onv",
            "blog": "",
            "albumId": "x8Onv"
        },
        "newyork": {
            "name": "New York",
            "date": "August 30th 2014",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/e8s5F8xh.jpg",
            "rank": 20,
            "tags": "city",
            "places": "",
            "album": "http://imgur.com/a/WJnS3",
            "blog": "",
            "albumId": "WJnS3"
        },
        "cozumel": {
            "name": "Cozumel",
            "date": "January 3rd 2011",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/jFY8k8Kh.jpg",
            "rank": 20,
            "tags": "cruise",
            "places": "",
            "album": "http://imgur.com/a/h8Svy",
            "blog": "",
            "albumId": "h8Svy"
        },
        "abudhabiindia": {
            "name": "Abu Dhabi/India",
            "date": "May 8th 2010",
            "description": "a description",
            "thumbnail": "http://i.imgur.com/feiBatGh.jpg",
            "rank": 20,
            "tags": "tourism,hiking",
            "places": "",
            "album": "http://imgur.com/a/Y6Ww7",
            "blog": "",
            "albumId": "Y6Ww7"
        }
    },
    locations: [
        {
            "title": "Capri",
            "address": "Capri, Metropolitan City of Naples, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.5532009,
            "lng": 14.222154,
            "open_hours": "",
            "marker": {
                "url": "https:\/\/maps.gstatic.com\/mapfiles\/api-3\/images\/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Anacapri",
            "address": "Anacapri, Metropolitan City of Naples, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.5546558,
            "lng": 14.2105284,
            "open_hours": "",
            "marker": {
                "url": "https:\/\/maps.gstatic.com\/mapfiles\/api-3\/images\/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Capri Wine Hotel",
            "address": "Via Marina Grande, 69, 80076 Capri NA, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.551232,
            "lng": 14.237073,
            "open_hours": "",
            "marker": {
                "url": "https:\/\/maps.gstatic.com\/mapfiles\/api-3\/images\/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Miami",
            "address": "Miami, FL, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 25.7616798,
            "lng": -80.19179020000001,
            "vicinity": "Miami",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Reethi Beach Resort Maldives",
            "address": "Maldives",
            "desc": "",
            "tel": "660-2626",
            "int_tel": "+960 660-2626",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 5.25625,
            "lng": 73.163725,
            "vicinity": "Maldives",
            "open_hours": [
                {
                    "day": "Monday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Tuesday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Wednesday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Thursday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Friday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Saturday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Sunday",
                    "hours": "12am–12pm"
                }
            ],
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Cozumel",
            "address": "Cozumel, Quintana Roo, Mexico",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 20.4229839,
            "lng": -86.9223432,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "New York",
            "address": "New York, NY, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.7127837,
            "lng": -74.00594130000002,
            "vicinity": "New York",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Portland",
            "address": "Portland, OR, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 45.52306220000001,
            "lng": -122.67648159999999,
            "vicinity": "Portland",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Seattle",
            "address": "Seattle, WA, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 47.6062095,
            "lng": -122.3320708,
            "vicinity": "Seattle",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Japan",
            "address": "Japan",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 36.204824,
            "lng": 138.252924,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "California",
            "address": "California, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 36.778261,
            "lng": -119.41793239999998,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Maldives",
            "address": "Maldives",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 1.9772276,
            "lng": 73.53610100000003,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Paris",
            "address": "Paris, France",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 48.85661400000001,
            "lng": 2.3522219000000177,
            "vicinity": "Paris",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Vancouver",
            "address": "Vancouver, BC, Canada",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 49.2827291,
            "lng": -123.12073750000002,
            "vicinity": "Vancouver",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Cancún",
            "address": "Cancún, Quintana Roo, Mexico",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 21.161908,
            "lng": -86.85152790000001,
            "vicinity": "Cancún",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Soufriere Bay",
            "address": "Soufriere Bay",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 13.8492638,
            "lng": -61.067514700000004,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Ladera Resort",
            "address": "Jalousle, Saint Lucia",
            "desc": "",
            "tel": "(758) 459-6600",
            "int_tel": "+1 758-459-6600",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 13.8328294,
            "lng": -61.0510956,
            "vicinity": "St. Lucia",
            "open_hours": [
                {
                    "day": "Monday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Tuesday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Wednesday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Thursday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Friday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Saturday",
                    "hours": "12am–12pm"
                },
                {
                    "day": "Sunday",
                    "hours": "12am–12pm"
                }
            ],
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Paresa Resort Phuket",
            "address": "49 Moo 6 Layi - Nakalay rd, Kamala, อำเภอ กะทู้ ภูเก็ต 83150, Thailand",
            "desc": "",
            "tel": "076 302 000",
            "int_tel": "+66 76 302 000",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 7.932839999999999,
            "lng": 98.26249099999995,
            "vicinity": "49 Moo 6 Layi - Nakalay rd, Kamala",
            "open_hours": [
                {
                    "day": "Monday",
                    "hours": "7am–11pm"
                },
                {
                    "day": "Tuesday",
                    "hours": "7am–11pm"
                },
                {
                    "day": "Wednesday",
                    "hours": "7am–11pm"
                },
                {
                    "day": "Thursday",
                    "hours": "7am–11pm"
                },
                {
                    "day": "Friday",
                    "hours": "7am–11pm"
                },
                {
                    "day": "Saturday",
                    "hours": "7am–11pm"
                },
                {
                    "day": "Sunday",
                    "hours": "7am–11pm"
                }
            ],
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Chatrium Hotel Riverside Bangkok",
            "address": "Wat Phraya Krai, Bang Kho Laem, Bangkok 10120, Thailand",
            "desc": "",
            "tel": "02 307 8888",
            "int_tel": "+66 2 307 8888",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 13.711127,
            "lng": 100.50907400000006,
            "vicinity": "",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Santhiya Koh Yao Yai Resort & Spa",
            "address": "88 หมู่.7, พรุใน, เกาะยาว, Phang Nga 82160, Thailand",
            "desc": "",
            "tel": "076 592 888",
            "int_tel": "+66 76 592 888",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 7.984179999999999,
            "lng": 98.56718000000001,
            "vicinity": "88 หมู่.7, พรุใน, เกาะยาว",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Bangkok",
            "address": "Bangkok, Thailand",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 13.7563309,
            "lng": 100.50176510000006,
            "vicinity": "Bangkok",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Wat Arun",
            "address": "Wat Arun, Bangkok Yai, Bangkok 10600, Thailand",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 13.7437024,
            "lng": 100.48602819999996,
            "vicinity": "Wat Arun",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Loh Samah Bay",
            "address": "Andaman Sea, ตำบล อ่าวนาง อำเภอเมืองกระบี่ กระบี่ Thailand",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 7.674409600000001,
            "lng": 98.76667950000001,
            "vicinity": "Andaman Sea",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Phang-nga",
            "address": "Phang-nga, Thailand",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 8.4501414,
            "lng": 98.52553169999999,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Mo'orea",
            "address": "Mo'orea, French Polynesia",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": -17.5388435,
            "lng": -149.82952339999997,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Tahiti",
            "address": "Tahiti, French Polynesia",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": -17.6509195,
            "lng": -149.42604210000002,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Manava Beach Resort & Spa",
            "address": "Moorea, French Polynesia",
            "desc": "",
            "tel": "40 55 17 50",
            "int_tel": "+689 40 55 17 50",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": -17.480633,
            "lng": -149.8033315,
            "vicinity": "Moorea",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Garza Blanca Preserve Resort & Spa",
            "address": "Carretera a Barra de Navidad, Col. Zona Hotelera Sur, 48390 Puerto Vallarta, Jal., Mexico",
            "desc": "",
            "tel": "(877) 845-3791",
            "int_tel": "+1 877-845-3791",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 20.5539481,
            "lng": -105.26427330000001,
            "vicinity": "Carretera a Barra de Navidad, Col. Zona Hotelera Sur, Puerto Vallarta",
            "open_hours": [
                {
                    "day": "Monday",
                    "hours": "open24hours"
                },
                {
                    "day": "Tuesday",
                    "hours": "open24hours"
                },
                {
                    "day": "Wednesday",
                    "hours": "open24hours"
                },
                {
                    "day": "Thursday",
                    "hours": "open24hours"
                },
                {
                    "day": "Friday",
                    "hours": "open24hours"
                },
                {
                    "day": "Saturday",
                    "hours": "open24hours"
                },
                {
                    "day": "Sunday",
                    "hours": "open24hours"
                }
            ],
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Hacienda Encantada Resort & Spa",
            "address": "Carretera Transpeninsular Km 7.3, Corredor Turistico, 23450 Cabo San Lucas, B.C.S., Mexico",
            "desc": "",
            "tel": "01 624 163 5550",
            "int_tel": "+52 624 163 5550",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 22.9023412,
            "lng": -109.8442933,
            "vicinity": "Carretera Transpeninsular Km 7.3, Corredor Turistico, Cabo San Lucas",
            "open_hours": [
                {
                    "day": "Monday",
                    "hours": "open24hours"
                },
                {
                    "day": "Tuesday",
                    "hours": "open24hours"
                },
                {
                    "day": "Wednesday",
                    "hours": "open24hours"
                },
                {
                    "day": "Thursday",
                    "hours": "open24hours"
                },
                {
                    "day": "Friday",
                    "hours": "open24hours"
                },
                {
                    "day": "Saturday",
                    "hours": "open24hours"
                },
                {
                    "day": "Sunday",
                    "hours": "open24hours"
                }
            ],
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Cabo San Lucas",
            "address": "Cabo San Lucas, Baja California Sur, Mexico",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 22.8905327,
            "lng": -109.91673709999998,
            "vicinity": "Cabo San Lucas",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Playa del Carmen",
            "address": "Playa del Carmen, Quintana Roo, Mexico",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 20.6295586,
            "lng": -87.07388509999998,
            "vicinity": "Playa del Carmen",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Positano",
            "address": "84017 Positano, Province of Salerno, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.6280528,
            "lng": 14.484981199999993,
            "vicinity": "Positano",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Ravello",
            "address": "84010 Ravello, Province of Salerno, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.6491886,
            "lng": 14.611711199999945,
            "vicinity": "Ravello",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Amalfi Coast",
            "address": "84011 Amalfi SA, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.6333389,
            "lng": 14.602896299999998,
            "vicinity": "Amalfi",
            "open_hours": [
                {
                    "day": "Monday",
                    "hours": "open24hours"
                },
                {
                    "day": "Tuesday",
                    "hours": "open24hours"
                },
                {
                    "day": "Wednesday",
                    "hours": "open24hours"
                },
                {
                    "day": "Thursday",
                    "hours": "open24hours"
                },
                {
                    "day": "Friday",
                    "hours": "open24hours"
                },
                {
                    "day": "Saturday",
                    "hours": "open24hours"
                },
                {
                    "day": "Sunday",
                    "hours": "open24hours"
                }
            ],
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Amalfi",
            "address": "84011 Amalfi SA, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.63400259999999,
            "lng": 14.60268050000002,
            "vicinity": "Amalfi",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Florence",
            "address": "Florence, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 43.7695604,
            "lng": 11.25581360000001,
            "vicinity": "Florence",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Venice",
            "address": "Venice, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 45.4408474,
            "lng": 12.31551509999997,
            "vicinity": "Venice",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Rome",
            "address": "Rome, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 41.90278349999999,
            "lng": 12.496365500000024,
            "vicinity": "Rome",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Vernazza",
            "address": "19018 Vernazza, Province of La Spezia, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 44.1349211,
            "lng": 9.684993500000019,
            "vicinity": "Vernazza",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Riomaggiore",
            "address": "19017 Riomaggiore SP, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 44.0990492,
            "lng": 9.737485099999958,
            "vicinity": "Riomaggiore",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Manarola",
            "address": "19017 Manarola, Province of La Spezia, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 44.11155939999999,
            "lng": 9.733893699999953,
            "vicinity": "Manarola",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Corniglia",
            "address": "19018 Corniglia, Province of La Spezia, Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 44.11986189999999,
            "lng": 9.710030700000061,
            "vicinity": "Corniglia",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Monterosso",
            "address": "Via Valle Gargassa, 13, 16010 Rossiglione GE, Italy",
            "desc": "",
            "tel": "010 925866",
            "int_tel": "+39 010 925866",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 44.55198470000001,
            "lng": 8.642570999999975,
            "vicinity": "Via Valle Gargassa, 13, Rossiglione",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Ladera Resort (1)",
            "address": "Saint Lucia",
            "desc": "",
            "tel": "(758) 459-6600",
            "int_tel": "+1 758-459-6600",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 13.858208,
            "lng": -61.03549099999998,
            "vicinity": "St. Lucia",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Sugar Beach, A Viceroy Resort",
            "address": "Val Des Pitons Forbidden Beach La Baie de Silence, Saint Lucia",
            "desc": "",
            "tel": "(758) 456-8000",
            "int_tel": "+1 758-456-8000",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 13.8278433,
            "lng": -61.06121159999998,
            "vicinity": "Val Des Pitons Forbidden Beach La Baie de Silence",
            "open_hours": [
                {
                    "day": "Monday",
                    "hours": "open24hours"
                },
                {
                    "day": "Tuesday",
                    "hours": "open24hours"
                },
                {
                    "day": "Wednesday",
                    "hours": "open24hours"
                },
                {
                    "day": "Thursday",
                    "hours": "open24hours"
                },
                {
                    "day": "Friday",
                    "hours": "open24hours"
                },
                {
                    "day": "Saturday",
                    "hours": "open24hours"
                },
                {
                    "day": "Sunday",
                    "hours": "open24hours"
                }
            ],
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Italy",
            "address": "Italy",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 41.87194,
            "lng": 12.567379999999957,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Colorado",
            "address": "Colorado, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 39.5500507,
            "lng": -105.78206740000002,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Phuket",
            "address": "Phuket, Mueang Phuket District, Phuket 83000, Thailand",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 7.8804479,
            "lng": 98.39225039999997,
            "vicinity": "Phuket",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Big Sur",
            "address": "Big Sur, CA, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 36.3614749,
            "lng": -121.85626100000002,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Carmel-by-the-Sea",
            "address": "Carmel-By-The-Sea, CA 93923, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 36.5552386,
            "lng": -121.92328789999999,
            "vicinity": "Carmel-by-the-Sea",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Negril",
            "address": "Negril, Jamaica",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 18.2683058,
            "lng": -78.34724240000003,
            "vicinity": "Negril",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Rockhouse Hotel",
            "address": "W End Rd, Negril, Jamaica",
            "desc": "",
            "tel": "(876) 957-4373",
            "int_tel": "+1 876-957-4373",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 18.2649974,
            "lng": -78.36768990000002,
            "vicinity": "West End Road, Negril",
            "open_hours": [
                {
                    "day": "Monday",
                    "hours": "8am–8pm"
                },
                {
                    "day": "Tuesday",
                    "hours": "8am–8pm"
                },
                {
                    "day": "Wednesday",
                    "hours": "8am–8pm"
                },
                {
                    "day": "Thursday",
                    "hours": "8am–8pm"
                },
                {
                    "day": "Friday",
                    "hours": "8am–8pm"
                },
                {
                    "day": "Saturday",
                    "hours": "8am–8pm"
                },
                {
                    "day": "Sunday",
                    "hours": "8am–8pm"
                }
            ],
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Puerto Vallarta",
            "address": "Puerto Vallarta, Jalisco, Mexico",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 20.65340699999999,
            "lng": -105.2253316,
            "vicinity": "Puerto Vallarta",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Chicago",
            "address": "Chicago, IL, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 41.8781136,
            "lng": -87.62979819999998,
            "vicinity": "Chicago",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Iowa",
            "address": "Iowa, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 41.8780025,
            "lng": -93.09770200000003,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Puerto Rico",
            "address": "Puerto Rico",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 18.220833,
            "lng": -66.590149,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "San Francisco",
            "address": "San Francisco, CA, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 37.7749295,
            "lng": -122.41941550000001,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Los Angeles",
            "address": "Los Angeles, CA, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 34.0522342,
            "lng": -118.2436849,
            "vicinity": "Los Angeles",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Las Vegas",
            "address": "Las Vegas, NV, USA",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 36.1699412,
            "lng": -115.13982959999998,
            "vicinity": "Las Vegas",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Spain",
            "address": "Spain",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 40.46366700000001,
            "lng": -3.7492200000000366,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Barcelona",
            "address": "Barcelona, Spain",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 41.38506389999999,
            "lng": 2.1734034999999494,
            "vicinity": "Barcelona",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Bengaluru",
            "address": "Bengaluru, Karnataka, India",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 12.9715987,
            "lng": 77.59456269999998,
            "vicinity": "Bengaluru",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Kerala",
            "address": "Kerala, India",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 10.8505159,
            "lng": 76.27108329999999,
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        },
        {
            "title": "Thiruvananthapuram",
            "address": "Thiruvananthapuram, Kerala, India",
            "desc": "",
            "tel": "",
            "int_tel": "",
            "email": "",
            "web": "",
            "web_formatted": "",
            "open": "",
            "time": "",
            "lat": 8.524139100000001,
            "lng": 76.93663760000004,
            "vicinity": "Thiruvananthapuram",
            "open_hours": "",
            "marker": {
                "url": "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi_hdpi.png",
                "scaledSize": {
                    "width": 25,
                    "height": 42,
                    "j": "px",
                    "f": "px"
                },
                "origin": {
                    "x": 0,
                    "y": 0
                },
                "anchor": {
                    "x": 12,
                    "y": 42
                }
            },
            "iw": {
                "address": true,
                "desc": true,
                "email": true,
                "enable": true,
                "int_tel": true,
                "open": true,
                "open_hours": true,
                "photo": true,
                "tel": true,
                "title": true,
                "web": true
            }
        }
    ]
};
