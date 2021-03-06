var Travel = {
    maxPage: 15,
    albumImages: [],
    initialize: function() {
        Travel.loadPlaces();
        Travel.loadEvents();
    },
    loadEvents: function() {
        // $('.place').click(Travel.showContent);
        $('.place').on('mousemove', Travel.panImage);
        $('.album-btn').click(Travel.loadAlbumData);
        Travel.loadGoogleMaps();
        $('#map').removeClass('loading');
        Travel.loadKeyboardEvents();
    },
    loadKeyboardEvents: function() {
        document.onkeydown = function(e) {
            switch (e.keyCode) {
                case 27: // esc                 
                    if (!$("#map").hasClass("map-hidden")) {
                        $(".map-close-btn").click();
                    }
                    break;
                case 8: // delete/backspace                 
                    if (!$("#map").hasClass("map-hidden")) {
                        $(".map-close-btn").click();
                    }
                    break;
            }
        };
    },
    showContent: function(e) {
        $(e.target).find('.content').toggleClass('content-visible');
        $(e.target).find('.background').toggleClass('background-covered');
    },
    loadPlaces: function() {
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
        $('.places-select').change(function() {
            if ($(".places-select")[0].selectedIndex === 0) {
                return;
            }
            $.scrollify.move(parseInt($(".places-select").val()));
            $(".places-select")[0].selectedIndex = 0;
        });
    },
    loadPlace: function(index, key, place) {
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
                '<div class="place-index fadeInUp">' + '['+ index + '/'+ Object.keys(Travel.places).length+']' + '</div>' +
                '</div></div>' +
                '<div class="background background-covered" style="background: url(' + place.thumbnail + ');"></div>' : 'COMING SOON') +
            '</div>'
        );
    },
    panImage: function(e) {
        var item = e.target.parentNode;
        $(item).children(".background").css({
            "transform-origin": ((e.pageX - $(item).offset().left) / $(item).width()) * 100 + "% " + ((e.pageY - $(item).offset().top) / $(item).height()) * 100 + "%"
        });
    },
    loadAlbumData: function(e) {
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
            error: function() {
                console.error('unable to retrieve album from Imgur...');
            },
            success: function(album) {
                Travel.scrollTop();
                Travel.loadAlbum(album.data);
            }
        });
    },
    loadAlbum: function(album) {
        Travel.albumImages = album.images;
        $('#album').addClass('album-loaded');
        $('#album').empty();
        $('#album').append('<div class="album-info"><div class="album-info-container"><div class="album-title"></div><div class="album-count"></div><div class="close-album-btn">Close Album</div>' +
            '<div class="imgur-album-btn"><a href="' + album.link + '">Imgur</a></div></div></div>');
        $('.album-title').html(album.title);
        $('.album-count').html(album.images.length + " images");
        // load all or paginate, curremntly loading all
        var maxLoad = (Travel.albumImages.length < Travel.maxPage) ? Travel.albumImages.length : Travel.albumImages.length;
        for (var i = 0; i < maxLoad; i++) {
            var albumObj = Travel.albumImages[i];
            var imgUrl = albumObj.link;
            var thumbnail = albumObj.link;
            thumbnail = thumbnail.replace('.jpg', 'h.jpg');
            thumbnail = thumbnail.replace('http:', 'https:');
            Travel.loadAlbumImg(i, thumbnail, imgUrl);
        }
        if (Travel.albumImages.length > Travel.maxPage) {
            $('#album').append('<div class="load-more-btn">Load More</div>');
        }
        $('.album-img-overlay').click(Travel.loadAlbumImgSelected);
        $('.close-album-btn').click(Travel.closeAlbum);
        Travel.loadAlbumEvents();
    },
    loadAlbumImg: function(index, thumbnail, url) {
        $('#album').append(
            '<div class="album-img" style="background: url(' + thumbnail + ');">' +
            '<img src="' + thumbnail + '" class="img">' +
            '<a href="' + url + '" class="link-btn">' +
            '<div>' +
            '<i class="fa fa-2x fa-picture-o"></i>' +
            '</div>' +
            '</a>' +
            '<div class="album-img-overlay" album-img-index="' + index + '" img-url="' + url + '">' +
            '</div>' +
            '</div>'
        );
    },
    loadAlbumEvents: function() {
        document.onkeydown = function(e) {
            switch (e.keyCode) {
                case 37:
                    if ($('.selected-img')[0]) {
                        Travel.loadPreviousImage();
                    } else {
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
                    } else {
                        if ($('.album-grid').children().size() > 0) {
                            Travel.closeAlbum();
                        }
                    }
                    break;
            }
        };
        $('.load-more-btn').click(function() {
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
        $('#album').scroll(function() {
            var h = $("#album")[0].scrollHeight;
            var p = $("#album").height() + $("#album").scrollTop();
            if (p == h) {
                $('.load-more-btn').click();
            }
        });
        $('.album-img').click(function(e) {
            if ($(e.target).find('.album-img-overlay').css('display') !== 'none' || true) {
                return;
            }
            var imgUrl = $(e.target).css('background-image');
            var stringUrl = imgUrl.substring(25, imgUrl.length - 2);
            if (stringUrl.length === 12 && stringUrl.includes('h.jpg')) {
                imgUrl = imgUrl.replace('h.jpg', '.jpg');
            } else {
                imgUrl = imgUrl.replace('.jpg', 'h.jpg');
            }
            $(e.target).css('background-image', imgUrl);
            $(e.target).toggleClass('album-img-select');
        });
    },
    loadNextImage: function() {
        var index = $('.selected-img').attr('index');
        if (++index > Travel.albumImages.length - 1) {
            index = 0;
        }
        var imgUrl = Travel.albumImages[index].link;
        var bgStyle = 'rgba(0, 0, 0, 0) url("' + imgUrl + '") no-repeat scroll 50% 50% / 100% padding-box border-box';
        $('.selected-img').css('background', bgStyle);
        $('.selected-img').attr('index', index);
    },
    loadPreviousImage: function() {
        var index = $('.selected-img').attr('index');
        if (--index < 0) {
            index = Travel.albumImages.length - 1;
        }
        var imgUrl = Travel.albumImages[index].link;
        var bgStyle = 'rgba(0, 0, 0, 0) url("' + imgUrl + '") no-repeat scroll 50% 50% / 100% padding-box border-box';
        $('.selected-img').css('background', bgStyle);
        $('.selected-img').attr('index', index);
    },
    resetAlbum: function() {
        $('#album').empty();
        setTimeout(function() {
            if (!$('#album').hasClass('album-loaded')) {
                $('#album').append('<span class="album-loading"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></span>');
            }
        }, 1000);
    },
    closeAlbum: function() {
        $.scrollify.enable();
        $('#header').show();
        Travel.toggleViews();
        setTimeout(function() {
            $('#album').empty();
            $('#album').removeClass('album-loaded');
        }, 500);
    },
    toggleViews: function() {
        $('#header').toggleClass('header-hidden');
        $('#footer').toggleClass('footer-hidden');
        $('#album').toggleClass('album-hidden');
        $('#places').toggleClass('places-hidden');
    },
    scrollTop: function() {
        setTimeout(function() {
            document.documentElement.scrollTop = 0;
        }, 1000);
    },
    loadAlbumImgSelected: function(e) {
        $('#album-img-selected').removeClass('album-img-selected-hidden');
        $('#album-img-selected').append('<div class="selected-img" index="' + $(e.target).attr('album-img-index') + '" style="background: url(' + $(e.target).attr('img-url') + ');"></div>');
        $('#album-img-selected').append('<span class="close-selected-img-btn"><i class="fa fa-close fa-3x"></i></span>');
        $('#album-img-selected').append('<div class="open-img-nav"><i class="fa fa-fw fa-arrow-circle-left fa-3x"></i>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="fa fa-fw fa-arrow-circle-right fa-3x"></i></div>');
        $('html').addClass('lock-scroll');
        $('.close-selected-img-btn').click(Travel.closeSelectedImage);
        Travel.loadAlbumImgSelectedEvents();
    },
    loadAlbumImgSelectedEvents: function() {
        $('.open-img-nav > .fa-arrow-circle-left').click(function() {
            Travel.loadPreviousImage();
        });
        $('.open-img-nav > .fa-arrow-circle-right').click(function() {
            Travel.loadNextImage();
        });
    },
    closeSelectedImage: function() {
        $('#album-img-selected').addClass('album-img-selected-hidden');
        setTimeout(function() {
            $('#album-img-selected').empty();
        }, 1000);
        $('html').removeClass('lock-scroll');
    },
    toggleGoogleMaps: function() {
        $('#map').toggleClass("map-hidden");
    },
    loadGoogleMaps: function() {
        google.maps.event.addDomListener(window, 'load', init);
        var map, markersArray = [];

        function bindInfoWindow(marker, map, location) {
            google.maps.event.addListener(marker, 'click', function() {
                function close(location) {
                    location.ib.close();
                    location.infoWindowVisible = false;
                    location.ib = null;
                }

                function buildPieces(location, el, part, icon) {
                    if (location[part] === '') {
                        return '';
                    } else if (location.iw[part]) {
                        switch (el) {
                            case 'photo':
                                if (location.photo) {
                                    return '<div class="iw-photo" style="background-image: url(' + location.photo + ');"></div>';
                                } else {
                                    return '';
                                }
                                break;
                            case 'iw-toolbar':
                                return '<div class="iw-toolbar"><h3 class="md-subhead">' + location.title + '</h3></div>';                                
                            case 'div':
                                switch (part) {
                                    default:
                                        return '<div class="iw-details"><i class="material-icons"><img src="//cdn.mapkit.io/v1/icons/' +
                                            icon + '.svg"/></i><span>' + location[part] + '</span></div>';
                                }
                        }
                    } else {
                        return '';
                    }
                }

                if (location.infoWindowVisible === true) {
                    close(location);
                } else {
                    markersArray.forEach(function(loc, index) {
                        if (loc.ib && loc.ib !== null) {
                            close(loc);
                        }
                    });

                    var boxText = document.createElement('div');
                    boxText.style.cssText = 'background: #fff;';
                    boxText.classList.add('md-whiteframe-2dp');

                    boxTezxt.innerHTML = 
                            buildPieces(location, 'photo', 'photo', '') +
                            buildPieces(location, 'iw-toolbar', 'title', '') +
                            buildPieces(location, 'div', 'address', 'location_on');                        
                        

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
                styles: Travel.mapStyle
            };
            var mapElement = document.getElementById('mapkit-google-map');
            var map = new google.maps.Map(mapElement, mapOptions);
            var locations = Travel.locations;
            for (var i = 0; i < locations.length; i++) {
                var marker = new google.maps.Marker({
                    icon: locations[i].marker,
                    position: new google.maps.LatLng(locations[i].lat, locations[i].lng),
                    map: map,
                    address: locations[i].address
                });
                markersArray.push(marker);

                if (locations[i].iw.enable === true) {
                    bindInfoWindow(marker, map, locations[i]);
                }
            }
        }
    },
    places: {
        "bali.2019.03.31": {
            "name": "Bali",
            "date": "March 31st 2019",
            "description": "a description",
            "thumbnail": "https://imgur.com/7vS3NJPh.jpg",
            "rank": 1,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/xtTkx5t",
            "albumId": "xtTkx5t"
        },
        "maldives.2018.11.21": {
            "name": "Maldives",
            "date": "November 21st 2018",
            "description": "a description",
            "thumbnail": "https://imgur.com/rVC053Ph.jpg",
            "rank": 1,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/xXT7uy8",
            "albumId": "xXT7uy8"
        },
        "cappadocia.2018.10.06": {
            "name": "Cappadocia",
            "date": "Octoper 6th 2018",
            "description": "a description",
            "thumbnail": "https://imgur.com/eDoF2Bph.jpg",
            "rank": 1,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/6I7H8ZM",
            "albumId": "6I7H8ZM"
        },
        "positano&capri.2018.09.29": {
            "name": "Positano & Capri",
            "date": "September 9th 2018",
            "description": "a description",
            "thumbnail": "https://imgur.com/jCXzZL6h.jpg",
            "rank": 1,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/vXz94pD",
            "albumId": "vXz94pD"
        },
        "santorini.2018.06.01": {
            "name": "Santorini",
            "date": "June 6th 2018",
            "description": "a description",
            "thumbnail": "https://imgur.com/67Kdyhlh.jpg",
            "rank": 1,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/x7rxg1B",
            "albumId": "x7rxg1B"
        },
        "croation&bosnia.2018.04.01": {
            "name": "Mostar",
            "date": "April 1st 2018",
            "description": "a description",
            "thumbnail": "https://imgur.com/yNjytzJh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/nMD43",
            "albumId": "nMD43"
        },
        "mostar.2018.03.29": {
            "name": "Dubrovnik",
            "date": "March 29th 2018",
            "description": "a description",
            "thumbnail": "https://imgur.com/bQ0i5S1h.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/R0jkg",
            "albumId": "R0jkg"
        },
        "maui.2018.02.08": {
            "name": "Maui",
            "date": "February 8th 2018",
            "description": "a description",
            "thumbnail": "https://imgur.com/EbRcmSch.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/AM4a4",
            "albumId": "AM4a4"
        },
        "ambergriscaye.2017.12.23": {
            "name": "Ambergris Caye",
            "date": "December 23rd 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/fV93YqQh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/0PRO5",
            "albumId": "0PRO5"
        },
        "japan.2017.09.23": {
            "name": "Japan",
            "date": "September 23rd 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/hd6K2kbh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/3SsmJ",
            "albumId": "3SsmJ"
        },
        "banff.2017.08.04": {
            "name": "Banff",
            "date": "August 4th 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/zPN4oEJh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/2FeRZ",
            "albumId": "2FeRZ"
        },
        "santorini.2017.06.23": {
            "name": "Santorini",
            "date": "June 23rd 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/LLF0MoCh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/jGdDd",
            "albumId": "jGdDd"
        },
        "switzerland.2017.06.20": {
            "name": "Switzerland",
            "date": "June 20th 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/zv0ZqXih.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/J62R7",
            "albumId": "J62R7"
        },
        "bangalore.2017.06.13": {
            "name": "Bangalore",
            "date": "June 13th 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/I74VJPph.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/RypVZ",
            "albumId": "RypVZ"
        },
        "toronto.2017.06.02": {
            "name": "Toronto",
            "date": "June 2nd 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/ey4UrOah.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/vuQsj",
            "albumId": "vuQsj"
        },
        "puertavallarta.2017.05.27": {
            "name": "Puerta Vallarta",
            "date": "May 27th 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/7hs77ZNh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/pemY1",
            "albumId": "pemY1"
        },
        "frenchriviera.2017.05.18": {
            "name": "French Riviera",
            "date": "May 18th 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/xOvzpY9h.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/tzRUW",
            "albumId": "tzRUW"
        },
        "portugal.2017.04.15": {
            "name": "Lisbon and Sintra",
            "date": "April 15th 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/zy2eHryh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/KEEJR",
            "albumId": "KEEJR"
        },
        "spain.2017.04.13": {
            "name": "Madrid and Segovia",
            "date": "April 13th 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/YqWCgJxh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/2ftNC",
            "albumId": "2ftNC"
        },
        "lakecomo.2017.03.09": {
            "name": "Lake Como",
            "date": "March 9th 2017",
            "description": "a description",
            "thumbnail": "https://imgur.com/gozpwAIh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/hHT86",
            "albumId": "hHT86"
        },
        "miami.2017.02.18": {
            "name": "Miami",
            "date": "February 18th 2017",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/OZSzOBdh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/1V2NW",
            "albumId": "1V2NW"
        },
        "frenchpolynesia.2016.12.24": {
            "name": "French Polynesia",
            "date": "December 24th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/m6SQFJQh.jpg",
            "rank": 2,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/CzjgH",
            "blog": "https://avarghese.me/blog/travel/2016/12/24/french-polynesia.html",
            "albumId": "CzjgH"
        },
        "phuket.2016.11.22": {
            "name": "Phuket",
            "date": "November 22nd 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/3ToI0jJh.jpg",
            "rank": 5,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/cvkkT",
            "blog": "https://avarghese.me/blog/travel/2016/11/19/thailand.html",
            "albumId": "cvkkT"
        },
        "bangkok.2016.11.19": {
            "name": "Bangkok",
            "date": "November 19th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/DZJB5Glh.jpg",
            "rank": 5,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/4OJ0x",
            "blog": "https://avarghese.me/blog/travel/2016/11/19/thailand.html",
            "albumId": "4OJ0x"
        },
        "costarica.2016.10.07": {
            "name": "Costa Rica",
            "date": "October 7th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/KAYGUVah.jpg",
            "rank": 10,
            "tags": "",
            "places": "",
            "album": "https://imgur.com/a/Mv4CT",
            "blog": "https://avarghese.me/blog/travel/2016/10/07/costa-rica.html",
            "albumId": "Mv4CT"
        },
        "bigsur.2016.09.23": {
            "name": "Big Sur",
            "date": "September 23rd 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/Q0lyf12h.jpg",
            "rank": 2,
            "tags": "roadtrip,bigsur",
            "places": "",
            "album": "https://imgur.com/a/V3P0z",
            "blog": "https://avarghese.me/blog/travel/2016/09/23/big-sur-roadtrip.html",
            "albumId": "V3P0z"
        },
        "negril.2016.08.26": {
            "name": "Negril",
            "date": "August 26th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/pawE6y2h.jpg",
            "rank": 2,
            "tags": "resort,jamaica,villas,cliffjump",
            "places": "",
            "album": "https://imgur.com/a/go1Dc",
            "blog": "https://avarghese.me/blog/travel/2016/08/26/negril.html",
            "albumId": "go1Dc"
        },
        "puertavallarta.2016.08.20": {
            "name": "Puerta Vallarta",
            "date": "August 20th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/tI4r2nNh.jpg",
            "rank": 5,
            "tags": "resort,mexico,infinitypool",
            "places": "",
            "album": "https://imgur.com/a/t4kRN",
            "blog": "https://avarghese.me/blog/travel/2016/08/20/puerta-vallarta.html",
            "albumId": "t4kRN"
        },
        "chicago.2016.08.06": {
            "name": "Chicago",
            "date": "August 6th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/UURlnKlh.jpg",
            "rank": 20,
            "tags": "architecture,pier,cruise,pizza",
            "places": "",
            "album": "https://imgur.com/a/rCay6",
            "blog": "",
            "albumId": "rCay6"
        },
        "puertorico.2016.07.08": {
            "name": "Puerto Rico",
            "date": "July 8th 2016",
            "description": "a description",
            "thumbnail": "https://imgur.com/R1KRe85h.jpg",
            "rank": 1,
            "tags": "architecture,hiking,towns,mofungo",
            "places": "",
            "album": "https://imgur.com/a/CWr4t",
            "blog": "https://avarghese.me/blog/travel/2016/07/08/puerto-rico-trip.html",
            "albumId": "CWr4t"
        },
        "sanfrancisco.2016.06.02": {
            "name": "San Francisco",
            "date": "July 2nd 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/mQZnMf4h.jpg",
            "rank": 20,
            "tags": "walking,city,pier",
            "places": "",
            "album": "https://imgur.com/a/6CEOm",
            "blog": "",
            "albumId": "6CEOm"
        },
        "barcelona.2016.05.13": {
            "name": "Spain",
            "date": "May 13th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/RLSRJv0h.jpg",
            "rank": 1,
            "tags": "architecture,hiking",
            "places": "",
            "album": "https://imgur.com/a/0Wx24",
            "blog": "https://avarghese.me/blog/travel/2016/05/16/barcelona-spain-trip.html",
            "albumId": "0Wx24"
        },
        "italy.2016.05.04": {
            "name": "Italy",
            "date": "May 4th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/Z9dw87jh.jpg",
            "rank": 1,
            "tags": "countryside,hiking,city,gondolas",
            "places": "",
            "album": "https://imgur.com/a/z7iaO",
            "blog": "https://avarghese.me/blog/travel/2016/05/15/italy-trip.html",
            "albumId": "z7iaO"
        },
        "colorado.2016.04.09": {
            "name": "Colorado",
            "date": "April 9th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/QRil5OBh.jpg",
            "rank": 1,
            "tags": "tropical,resort,watersports",
            "places": "",
            "album": "https://imgur.com/a/GznDe",
            "blog": "",
            "albumId": "GznDe"
        },
        "cabosanlucas.2016.02.06": {
            "name": "Cabo San Lucas",
            "date": "February 6th 2016",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/PWBSQp9h.jpg",
            "rank": 10,
            "tags": "parasailing,tropical",
            "places": "",
            "album": "https://imgur.com/a/of5lB",
            "blog": "",
            "albumId": "of5lB"
        },
        "saintlucia.2015.11.27": {
            "name": "Saint Lucia",
            "date": "November 27th 2015",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/3Jr1CVKh.jpg",
            "rank": 1,
            "tags": "tropical,resort,volcanicbath",
            "places": "",
            "album": "https://imgur.com/a/OZl4l",
            "blog": "",
            "albumId": "OZl4l"
        },
        "cancun.2015.11.13": {
            "name": "Cancun",
            "date": "November 13th 2015",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/Vz7Yeoch.jpg",
            "rank": 5,
            "tags": "tropical,canyoneering",
            "places": "",
            "album": "https://imgur.com/a/Y1IKS",
            "blog": "",
            "albumId": "Y1IKS"
        },
        "vancouver.2015.09.03": {
            "name": "Vancouver",
            "date": "September 3rd 2015",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/WtjP0CEh.jpg",
            "rank": 10,
            "tags": "cold,nature,hiking",
            "places": "",
            "album": "https://imgur.com/a/FrNOL",
            "blog": "",
            "albumId": "FrNOL"
        },
        "paris.2015.06.21": {
            "name": "Paris",
            "date": "June 21st 2015",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/4o5ud9kh.jpg",
            "rank": 10,
            "tags": "city,tourism",
            "places": "",
            "album": "https://imgur.com/a/8fFJT",
            "blog": "",
            "albumId": "8fFJT"
        },
        "maldives.2015.06.16": {
            "name": "Maldives",
            "date": "June 16th 2015",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/x8f8KgRh.jpg",
            "rank": 1,
            "tags": "tropical,resort,watersports",
            "places": "",
            "album": "https://imgur.com/a/AHnS7",
            "blog": "",
            "albumId": "AHnS7"
        },
        "eastcoasts.2015.04.23": {
            "name": "East Coast Roadtrip S",
            "date": "April 23rd 2015",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/7iQpKc8h.jpg",
            "rank": 10,
            "tags": "east-coast,driving,roadtrip",
            "places": "sanfrancisco,losangeles,sandiego",
            "album": "https://imgur.com/a/03ibF",
            "blog": "",
            "albumId": "03ibF"
        },
        "japan.2014.12.19": {
            "name": "Japan",
            "date": "December 19th 2014",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/sWsF4tMh.jpg",
            "rank": 10,
            "tags": "city",
            "places": "",
            "album": "https://imgur.com/a/wF1UV",
            "blog": "",
            "albumId": "wF1UV"
        },
        "eastcoastn.2014.11.08": {
            "name": "East Coast Roadtrip N",
            "date": "November 8th 2014",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/Em5c4kdh.jpg",
            "rank": 10,
            "tags": "eastcoast,driving,roadtrip",
            "places": "",
            "album": "https://imgur.com/a/x8Onv",
            "blog": "",
            "albumId": "x8Onv"
        },
        "newyork.2014.08.30": {
            "name": "New York",
            "date": "August 30th 2014",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/e8s5F8xh.jpg",
            "rank": 20,
            "tags": "city",
            "places": "",
            "album": "https://imgur.com/a/WJnS3",
            "blog": "",
            "albumId": "WJnS3"
        },
        "cozumel.2011.01.03": {
            "name": "Cozumel",
            "date": "January 3rd 2011",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/jFY8k8Kh.jpg",
            "rank": 20,
            "tags": "cruise",
            "places": "",
            "album": "https://imgur.com/a/h8Svy",
            "blog": "",
            "albumId": "h8Svy"
        },
        "abudhabiindia.2010.05.08": {
            "name": "Abu Dhabi/India",
            "date": "May 8th 2010",
            "description": "a description",
            "thumbnail": "https://i.imgur.com/feiBatGh.jpg",
            "rank": 20,
            "tags": "tourism,hiking",
            "places": "",
            "album": "https://imgur.com/a/Y6Ww7",
            "blog": "",
            "albumId": "Y6Ww7"
        }
    },
    mapStyle: [{
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
    }],
    locations: [{
        "title": "Miami",
        "address": "Miami, FL, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0039",
        "lat": 25.7616798,
        "lng": -80.19179020000001,
        "photo": "https://lh5.googleusercontent.com/-GSzLY3aPbTc/WJt-bQqIGnI/AAAAAAAAAQc/alJKlT57Q2Qj3PJqPm3cddcWihldjGDkgCLIB/w1280-h853-k/",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Thiruvananthapuram",
        "address": "Thiruvananthapuram, Kerala, India",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1109",
        "lat": 8.524139100000001,
        "lng": 76.93663760000004,
        "photo": "https://lh3.googleusercontent.com/-rTPHgyZCSN0/V6IEj_7-W0I/AAAAAAAAHVY/MHLQoLyzY3Iu86JVMSQ4vYBR_S-elAOjwCJkC/w1280-h853-k/",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Kerala",
        "address": "Kerala, India",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1109",
        "lat": 10.8505159,
        "lng": 76.27108329999999,
        "photo": "https://lh4.googleusercontent.com/-aZvOd-9hWbs/V4TzwXWb9-I/AAAAAAAAFiI/zFtHH1qiqMkMAYbC5h04bcCxw8ltRtQIwCJkC/w1280-h853-k/",
        "vicinity": "Kerala, India",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Konni",
        "address": "Konni, Kerala 689691, India",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1109",
        "lat": 9.2267063,
        "lng": 76.84967789999996,
        "photo": "https://lh5.googleusercontent.com/-2LVcVioDHVs/V4-zb7DGpRI/AAAAAAAAEiA/gP3r9OUA8vwFu_ERKATzqEbUUj-vSvq8ACJkC/w1280-h853-k/",
        "vicinity": "Konni, Kerala 689691, India",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Pathanapuram",
        "address": "Pathanapuram, Kerala, India",
        "desc": "https://imgur.com/1V2NW",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1109",
        "lat": 9.092691599999998,
        "lng": 76.86124100000006,
        "photo": "https://lh5.googleusercontent.com/-lH_mXzqTBAA/V_JMutoIKoI/AAAAAAAACWg/V9WMK6AekAQphxFoKaEECvjb_zVpDisGwCJkC/w1280-h853-k/",
        "vicinity": "Pathanapuram, Kerala, India",
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
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Bengaluru",
        "address": "Bengaluru, Karnataka, India",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1109",
        "lat": 12.9715987,
        "lng": 77.59456269999998,
        "photo": "https://lh4.googleusercontent.com/--eVmoOYuq40/WG89rFDYBRI/AAAAAAAAXgE/eKk20RUl3jgqsbsdfTwKvVRfdQVd9cpDQCLIB/w1280-h853-k/",
        "vicinity": "Bengaluru, Karnataka, India",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Abu Dhabi",
        "address": "Abu Dhabi - United Arab Emirates",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0939",
        "lat": 24.453884,
        "lng": 54.37734380000006,
        "photo": "https://lh4.googleusercontent.com/-fQiKsAksofQ/V6LxenslGzI/AAAAAAAAAkg/MB6q6KtQ8wArU1Cz0oz1GtMvE-zWq7ohACJkC/w1280-h853-k/",
        "vicinity": "Abu Dhabi - United Arab Emirates",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Puerto Vallarta",
        "address": "Puerto Vallarta, Jalisco, Mexico",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 20.65340699999999,
        "lng": -105.2253316,
        "photo": "https://lh6.googleusercontent.com/-ms2s3TUZnwg/WHEe21rHucI/AAAAAAAACig/gaTbesGLMPYCkCyErXuTM_2GIOQQK3OhQCLIB/w1280-h853-k/",
        "vicinity": "Puerto Vallarta, Jalisco, Mexico",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Carrollton",
        "address": "Carrollton, TX, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 32.9756415,
        "lng": -96.88996359999999,
        "photo": "https://lh3.googleusercontent.com/-cfuLPiNagj8/VzPWbt4PYOI/AAAAAAAABxg/eDjQvvEhF_4DXdbsfGo77lIKMv5spvwRwCJkC/w1280-h853-k/",
        "vicinity": "Carrollton, TX, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Vancouver",
        "address": "Vancouver, BC, Canada",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 49.2827291,
        "lng": -123.12073750000002,
        "photo": "https://lh5.googleusercontent.com/-zfCA5EbUBjo/V9mfJ0UXBjI/AAAAAAAAABI/aC3O79bSNfYo1kMa09BPofx7JqAx9ogKwCLIB/w1280-h853-k/",
        "vicinity": "Vancouver, BC, Canada",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Portland",
        "address": "Portland, OR, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 45.52306220000001,
        "lng": -122.67648159999999,
        "photo": "https://lh3.googleusercontent.com/-lUg98ZeEZ14/WAFtxQkRYAI/AAAAAAAAAro/sfIXLo6c5ZI_LNCZL3Ld6p8M0T1sky88gCLIB/w1280-h853-k/",
        "vicinity": "Portland, OR, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Las Vegas",
        "address": "Las Vegas, NV, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 36.1699412,
        "lng": -115.13982959999998,
        "photo": "https://lh5.googleusercontent.com/-9GTB7HfLHDU/WAJT4jzTXkI/AAAAAAAAGpw/iF6XexwXQTYJFkjNr3ueCHzXAs0psowkACLIB/w1280-h853-k/",
        "vicinity": "Las Vegas, NV, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Seattle",
        "address": "Seattle, WA, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 47.6062095,
        "lng": -122.3320708,
        "photo": "https://lh3.googleusercontent.com/-xw1La1JMeX4/V-GbZEBfQ3I/AAAAAAAAF1g/iUpAX0VhVKc5TrY4W0IRwhGz07SZYhgTACJkC/w1280-h853-k/",
        "vicinity": "Seattle, WA, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "San Jose",
        "address": "San Jose, CA, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 37.3382082,
        "lng": -121.88632860000001,
        "photo": "https://lh6.googleusercontent.com/-GzKvECAG9VU/V4qu7pGuQlI/AAAAAAAAD74/r8k589Fvfd4xgp5HTKFiMHahr-UGvW7JACLIB/w1280-h853-k/",
        "vicinity": "San Jose, CA, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "San Diego",
        "address": "San Diego, CA, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 32.715738,
        "lng": -117.16108380000003,
        "photo": "https://lh3.googleusercontent.com/-zkv0nc3fu0o/V-rjV_h925I/AAAAAAAAiqU/uQW3cvrydaYsaOI8DrYgjbSsHuIoIhNEgCLIB/w1280-h853-k/",
        "vicinity": "San Diego, CA, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "San Francisco",
        "address": "San Francisco, CA, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 37.7749295,
        "lng": -122.41941550000001,
        "photo": "https://lh3.googleusercontent.com/-cDHTjmaZoj4/WHu_Vc2bbZI/AAAAAAAEAAk/4aBAkScXukM99MXAXzyire-5ibigjuyBACLIB/w1280-h853-k/",
        "vicinity": "San Francisco, CA, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Los Angeles",
        "address": "Los Angeles, CA, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 34.0522342,
        "lng": -118.2436849,
        "photo": "https://lh4.googleusercontent.com/-rUSF0zynIe8/V6Tb98Z3lTI/AAAAAAAABBo/0tSR93lBtJ0aQlvOFOG4akRDBWuA6PT7wCLIB/w1280-h853-k/",
        "vicinity": "Los Angeles, CA, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "New York",
        "address": "New York, NY, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0039",
        "lat": 40.7127837,
        "lng": -74.00594130000002,
        "photo": "https://lh6.googleusercontent.com/-0Y2LIfXtftk/WAjKQMv5O-I/AAAAAAAATT8/W1xeTYm4R44875Dw6J1qnvKxEbDQsogRgCLIB/w1280-h853-k/",
        "vicinity": "New York, NY, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Chicago",
        "address": "Chicago, IL, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 41.8781136,
        "lng": -87.62979819999998,
        "photo": "https://lh4.googleusercontent.com/-3Ryvb4IIgKU/V5fn4cN2JwI/AAAAAAAALKQ/Cr99nVXJIXU_jpiexz3Sydy_zrXqKxgTACJkC/w1280-h853-k/",
        "vicinity": "Chicago, IL, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Dubuque",
        "address": "Dubuque, IA, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 42.50055830000001,
        "lng": -90.66457179999998,
        "photo": "https://lh5.googleusercontent.com/-IUsh3WRaNto/V8PfMopBfUI/AAAAAAAAQ0E/e74hPtt1fbI3NsCfN-ZL4N1Yev77ipBBwCJkC/w1280-h853-k/",
        "vicinity": "Dubuque, IA, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Dallas",
        "address": "Dallas, TX, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 32.7766642,
        "lng": -96.79698789999998,
        "photo": "https://lh4.googleusercontent.com/-_bZ8zbySbPE/V32qm1XDV6I/AAAAAAAAABY/biS776w0TGkSJRHS--aSnoLkfbxGYN5cwCJkC/w1280-h853-k/",
        "vicinity": "Dallas, TX, USA",
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
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Charlotte",
        "address": "Charlotte, NC, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0039",
        "lat": 35.2270869,
        "lng": -80.84312669999997,
        "photo": "https://lh3.googleusercontent.com/--t2zOl0uKq4/V4FUFylQP0I/AAAAAAAAWNY/2K-uFNrODjIAxU-SmmwSl2UHjStxvcvMACJkC/w1280-h853-k/",
        "vicinity": "Charlotte, NC, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Raleigh",
        "address": "Raleigh, NC, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0039",
        "lat": 35.7795897,
        "lng": -78.63817870000003,
        "photo": "https://lh3.googleusercontent.com/-4oXR7DIxaDU/VYGTGDTmuoI/AAAAAAAAClE/kU4PjgrESiQ0M0Cry1hFGxWSiLZfkgaZwCJkC/w1280-h853-k/",
        "vicinity": "Raleigh, NC, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Orlando",
        "address": "Orlando, FL, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0039",
        "lat": 28.5383355,
        "lng": -81.37923649999999,
        "photo": "https://lh4.googleusercontent.com/-oRd8NmuxLGM/V2gv8I_J2UI/AAAAAAAAgAs/4Wt6KAWhWxUkBWBcDqsqancigokvvqLpgCLIB/w1280-h853-k/",
        "vicinity": "Orlando, FL, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Broken Bow",
        "address": "Broken Bow, OK 74728, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 34.0292764,
        "lng": -94.7391045,
        "photo": "https://lh5.googleusercontent.com/-K41YD01KMm4/V4Pwjsb-N-I/AAAAAAAAAHA/AJsMFc8uFiURPndBeFRCjvnycY6OrHQYgCJkC/w1280-h853-k/",
        "vicinity": "Broken Bow, OK 74728, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Houston",
        "address": "Houston, TX, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 29.7604267,
        "lng": -95.3698028,
        "photo": "https://lh4.googleusercontent.com/-uU4VqBJz_Lg/WAaB-xvoA-I/AAAAAAAAJmY/wZeVx6Zlod0C9OjWIUbd69OvCb1_tztcgCLIB/w1280-h853-k/",
        "vicinity": "Houston, TX, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Galveston",
        "address": "Galveston, TX, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 29.3013479,
        "lng": -94.79769579999999,
        "photo": "https://lh4.googleusercontent.com/-l-yYs3LPyS4/VuzHSbkjKII/AAAAAAAAFsg/Zll-CxDd5hQ-X9US9CFoRjaGNWF2HrxuwCJkC/w1280-h853-k/",
        "vicinity": "Galveston, TX, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Negril",
        "address": "Negril, Jamaica",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0039",
        "lat": 18.2683058,
        "lng": -78.34724240000003,
        "photo": "https://lh5.googleusercontent.com/-XFDA4NStw-s/WGnt-DZ9WvI/AAAAAAAAAdE/EFPAGnmBL7kxmFTH7LVERTD09EIZ8IVWQCLIB/w1280-h853-k/",
        "vicinity": "Negril, Jamaica",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "San Juan",
        "address": "San Juan, Puerto Rico",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0139",
        "lat": 18.4655394,
        "lng": -66.10573549999998,
        "photo": "https://lh6.googleusercontent.com/-R6It4sISCtc/V9V4P8wsEtI/AAAAAAACyDc/dO-zO-JZNNk2efX33GtaZkJ25V6oLaWOQCLIB/w1280-h853-k/",
        "vicinity": "San Juan, Puerto Rico",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "La Fortuna",
        "address": "Provincia de Alajuela, La Fortuna, Costa Rica",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2339",
        "lat": 10.4678335,
        "lng": -84.6426806,
        "photo": "https://lh6.googleusercontent.com/-br-B_IceUd0/WAgOQI8A0kI/AAAAAAAAAIs/dd4pEuW4NO46VNW8BNGppxumqX3kUvF6wCLIB/w1280-h853-k/",
        "vicinity": "Provincia de Alajuela, La Fortuna, Costa Rica",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Cabo San Lucas",
        "address": "Cabo San Lucas, Baja California Sur, Mexico",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2239",
        "lat": 22.8905327,
        "lng": -109.91673709999998,
        "photo": "https://lh6.googleusercontent.com/-W7Z3JxLwNPM/V5mUqSfcFDI/AAAAAAAAQps/PvWbIg4obwsUwneNpGaC46LaKOngQtmMwCJkC/w1280-h853-k/",
        "vicinity": "Cabo San Lucas, Baja California Sur, Mexico",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Cozumel",
        "address": "Cozumel, Quintana Roo, Mexico",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0039",
        "lat": 20.4229839,
        "lng": -86.9223432,
        "photo": "https://lh6.googleusercontent.com/-BXWW3Gds6s0/WD8oRdeOBOI/AAAAAAAAAEw/SeTxfJVmNGc8bR9JBl1BX8sr2UwX7WKtACLIB/w1280-h853-k/",
        "vicinity": "Cozumel, Quintana Roo, Mexico",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Playa del Carmen",
        "address": "Playa del Carmen, Quintana Roo, Mexico",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0039",
        "lat": 20.6295586,
        "lng": -87.07388509999998,
        "photo": "https://lh3.googleusercontent.com/-Xgg4MjTl_X0/V75PWW-aRlI/AAAAAAAATFE/CDh5N5P4izM9N88XzxwdJ-dpjAUOirWwQCJkC/w1280-h853-k/",
        "vicinity": "Playa del Carmen, Quintana Roo, Mexico",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Soufriere",
        "address": "Soufriere, Saint Lucia",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0139",
        "lat": 13.8570986,
        "lng": -61.0573248,
        "photo": "https://lh5.googleusercontent.com/-0JLTMzmzpuU/V3QBJi9rXRI/AAAAAAABzsY/yyKppOdAu3EDpviOA2VvV52aptyo5e5DACJkC/w1280-h853-k/",
        "vicinity": "Soufriere, Saint Lucia",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Carmel-by-the-Sea",
        "address": "Carmel-By-The-Sea, CA 93923, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2139",
        "lat": 36.5552386,
        "lng": -121.92328789999999,
        "photo": "https://lh5.googleusercontent.com/-J0xo6Qf_ngk/WBbRwiEBxZI/AAAAAAAAFvw/Zy6Cxp0ccuYD4FpgDu8Hgki83tVf5jjkgCLIB/w1280-h853-k/",
        "vicinity": "Carmel-By-The-Sea, CA 93923, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Giverny",
        "address": "Giverny, France",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 49.081595,
        "lng": 1.5335039999999935,
        "photo": "https://lh3.googleusercontent.com/-dj8P-P_72x0/V8zG4OD2lEI/AAAAAAAAMSU/bbPenuHrnZkkji5Q5vzL25ptghRFzp5ZQCJkC/w1280-h853-k/",
        "vicinity": "Giverny, France",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Colmar",
        "address": "Colmar, France",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 48.0793589,
        "lng": 7.358512000000019,
        "photo": "https://lh3.googleusercontent.com/-DPRzqtXU6nw/V9j3pvUt_eI/AAAAAAAAF6w/T5u2f0BsI_EDnkIlA6nu4k_pMdoV0VRqwCJkC/w1280-h853-k/",
        "vicinity": "Colmar, France",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Vail",
        "address": "Vail, CO 81657, USA",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "2239",
        "lat": 39.64026379999999,
        "lng": -106.37419549999998,
        "photo": "https://lh5.googleusercontent.com/-HXrtzsS4cPg/V3wP-S_-tkI/AAAAAAAARv8/nsalYPOfM9w66x1leE78Z3foq5p6MlFrACJkC/w1280-h853-k/",
        "vicinity": "Vail, CO 81657, USA",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Reethi Beach Resort Maldives",
        "address": "Maldives",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1039",
        "lat": 5.25625,
        "lng": 73.163725,
        "photo": "https://lh4.googleusercontent.com/-WHzbP-fl_s4/V0_FKNCY06I/AAAAAAAAAMc/fZ6J5dYGnAwIF1W5w0v8Y7ehJOPQWM4-wCJkC/w1280-h853-k/",
        "vicinity": "Maldives",
        "open_hours": [],
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Mo'orea",
        "address": "Mo'orea, French Polynesia",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1939",
        "lat": -17.5388435,
        "lng": -149.82952339999997,
        "photo": "https://lh5.googleusercontent.com/-mjAA_G32iog/V854eyRaJbI/AAAAAAAAGsY/Pn3HNvTkPRYfmeeRuuR1Efboc9E92i7swCJkC/w1280-h853-k/",
        "vicinity": "Mo'orea, French Polynesia",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Tahiti",
        "address": "Tahiti, French Polynesia",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1939",
        "lat": -17.6509195,
        "lng": -149.42604210000002,
        "photo": "https://lh5.googleusercontent.com/-Irr1AdV6FJw/V-2nH4viROI/AAAAAAAAZ4A/71bRNpIT_ykwTsgUSqKj3tYF0PFZ_AdqgCJkC/w1280-h853-k/",
        "vicinity": "Tahiti, French Polynesia",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Paris",
        "address": "Paris, France",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 48.85661400000001,
        "lng": 2.3522219000000177,
        "photo": "https://lh6.googleusercontent.com/-KiaHd3or_h0/V7Lg8Au0QiI/AAAAAAAANbM/iyGe1ftItT8YNR4j7SyQnGcqZqTTvErRwCJkC/w1280-h853-k/",
        "vicinity": "Paris, France",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Montserrat",
        "address": "Montserrat",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0139",
        "lat": 16.742498,
        "lng": -62.187366,
        "photo": "https://lh6.googleusercontent.com/-O9qi7Jt6YAU/WHYgEqhCAII/AAAAAAAALWc/T6sJazz4UBcfgXtvnW6N5BPOeCMo2n2UgCLIB/w1280-h853-k/",
        "vicinity": "Montserrat",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Barcelona",
        "address": "Barcelona, Spain",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 41.38506389999999,
        "lng": 2.1734034999999494,
        "photo": "https://lh3.googleusercontent.com/-3IHPzd76cdE/WGm39sSXT9I/AAAAAAAAlMg/WUMvGutvcIQZq9FZd7dYzZZsAUNxbPleQCLIB/w1280-h853-k/",
        "vicinity": "Barcelona, Spain",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Bangkok",
        "address": "Bangkok, Thailand",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1239",
        "lat": 13.7563309,
        "lng": 100.50176510000006,
        "photo": "https://lh6.googleusercontent.com/-Ns68aFL5Z6I/VgrnP6jv3BI/AAAAAAAAABg/8A1JyduGpsUdLjVlO6LbkL5oETdjhlJpACJkC/w1280-h853-k/",
        "vicinity": "Bangkok, Thailand",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Phuket",
        "address": "Phuket, Thailand",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1239",
        "lat": 7.9519331,
        "lng": 98.33808840000006,
        "photo": "https://lh5.googleusercontent.com/-Lp_zHpVD93s/WHU1WD28lPI/AAAAAAAAGYM/cB9pA0F9T60L-oCzT7uXelOhYhZ031plQCLIB/w1280-h853-k/",
        "vicinity": "Phuket, Thailand",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Rome",
        "address": "Rome, Italy",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 41.90278349999999,
        "lng": 12.496365500000024,
        "photo": "https://lh3.googleusercontent.com/-lCvdrx6Xp1M/WEmtVbO5niI/AAAAAAAA5i0/CFKzD8El5iMNSmJ-mRJNdSqxXJtkxtkhACLIB/w1280-h853-k/",
        "vicinity": "Rome, Italy",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Sorrento",
        "address": "80067 Sorrento, Metropolitan City of Naples, Italy",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 40.6262925,
        "lng": 14.375798499999974,
        "photo": "https://lh5.googleusercontent.com/-8wi4cGZ1G3I/V6PGph2BcoI/AAAAAAAAAfk/Qe5XHOstNq4pz4tFEAhi90q77pG9UGTHwCJkC/w1280-h853-k/",
        "vicinity": "80067 Sorrento, Metropolitan City of Naples, Italy",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Capri",
        "address": "Capri, Metropolitan City of Naples, Italy",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 40.5532009,
        "lng": 14.222154000000046,
        "photo": "https://lh4.googleusercontent.com/-_xtbBA6g9f4/V9E2B0GIqdI/AAAAAAACu8s/aM2ZJnZwqm0oF51lW0RoiaTNOCzqUbMTACLIB/w1280-h853-k/",
        "vicinity": "Capri, Metropolitan City of Naples, Italy",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Florence",
        "address": "Florence, Italy",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 43.7695604,
        "lng": 11.25581360000001,
        "photo": "https://lh4.googleusercontent.com/-WQ7rp6rN8-Q/WGoJNb-L-5I/AAAAAAAAaBY/2SF7_k-291Y4r2ZW44vYItsVJjdKsZbfQCLIB/w1280-h853-k/",
        "vicinity": "Florence, Italy",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Venice",
        "address": "Venice, Italy",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "0639",
        "lat": 45.4408474,
        "lng": 12.31551509999997,
        "photo": "https://lh6.googleusercontent.com/-9o-3Hj9aZdg/VX2MnAucIVI/AAAAAAABO90/MWKwGsKuzvc7MTRh6JQNi8jucfTQXmejwCJkC/w1280-h853-k/",
        "vicinity": "Venice, Italy",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Tokyo",
        "address": "Tokyo, Japan",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1439",
        "lat": 35.6894875,
        "lng": 139.69170639999993,
        "photo": "https://lh4.googleusercontent.com/-2eeAVNdKaeU/WIrMCevwiHI/AAAAAAAAibk/npKgSVHEydQtNBbn7JdlHxptQMR77_vnQCLIB/w1280-h853-k/",
        "vicinity": "Tokyo, Japan",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }, {
        "title": "Kyoto",
        "address": "Kyoto, Kyoto Prefecture, Japan",
        "desc": "",
        "tel": "",
        "int_tel": "",
        "email": "",
        "web": "",
        "web_formatted": "",
        "open": "",
        "time": "1439",
        "lat": 35.01163629999999,
        "lng": 135.76802939999993,
        "photo": "https://lh3.googleusercontent.com/-84OnrLJvQ_s/V6893qAb1gI/AAAAAAAAYVk/yIflSLPVmEEeU-XW_St3LCyFqUunX2ukACLIB/w1280-h853-k/",
        "vicinity": "Kyoto, Kyoto Prefecture, Japan",
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
            "desc": false,
            "email": false,
            "enable": true,
            "int_tel": false,
            "open": true,
            "open_hours": true,
            "photo": true,
            "tel": false,
            "title": false,
            "web": false
        }
    }]
};