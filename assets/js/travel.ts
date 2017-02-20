let Travel = {
    maxPage: 15,
    albumImages: [],
    initialize: () => {
        Travel.loadPlaces();
        Travel.loadEvents();
    },
    loadEvents: () => {
        // $('.place').click(Travel.showContent);
        $('.place').on('mousemove', Travel.panImage);
        $('.album-btn').click(Travel.loadAlbumData);
        $('.scrolltop-btn').click(Travel.scrollTop);
        $(window).scroll(Travel.scrollListener);
    },
    showContent: (e) => {
        $(e.target).find('.content').toggleClass('content-visible');
        $(e.target).find('.background').toggleClass('background-covered');
    },
    loadPlaces: () => {
        let i = 0;
        for (let key in Travel.places) {
            let place = Travel.places[key];
            Travel.loadPlace(i + 1, key.toLowerCase(), place);
            let year = place.date.substring(place.date.length - 4, place.date.length);
            $('.places-select').append($('<option>', {
                value: i,
                text: `${place.name} ${year}`
            }));
            i++;
        }
        $('.places-select').change(() => {
            if ($(".places-select")[0].selectedIndex === 0) {
                return;
            }
            $.scrollify.move(parseInt($(".places-select").val()));
            $(".places-select")[0].selectedIndex = 0;
        });
    },
    loadPlace: (index, key, place) => {
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
                '<div class="place-index fadeInUp">' + `[${index}/${Object.keys(Travel.places).length}]` + '</div>' +
                '</div></div>' +
                '<div class="background background-covered" style="background: url(' + place.thumbnail + ');"></div>' : 'COMING SOON') +
            '</div>'
        );
    },
    panImage: (e) => {
        let item = e.target.parentNode;
        $(item).children(".background").css({
            "transform-origin": ((e.pageX - $(item).offset().left) / $(item).width()) * 100 + "% " + ((e.pageY - $(item).offset().top) / $(item).height()) * 100 + "%"
        });
    },
    loadAlbumData: (e) => {
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
            error: () => {
                console.error('unable to retrieve album from Imgur...');
            },
            success: (album) => {
                Travel.scrollTop();
                Travel.loadAlbum(album.data);
            }
        });
    },
    loadAlbum: (album) => {
        Travel.albumImages = album.images;
        $('#album').addClass('album-loaded');
        $('#album').empty();
        $('#album').append('<div class="album-info"><div class="album-info-container"><div class="album-title"></div><div class="album-count"></div><div class="close-album-btn">Close Album</div>' +
            '<div class="imgur-album-btn"><a href="' + album.link + '">Imgur</a></div></div></div>');
        $('.album-title').html(album.title);
        $('.album-count').html(`(${album.images.length} images)`);
        // load all or paginate, curremntly loading all
        let maxLoad = (Travel.albumImages.length < Travel.maxPage) ? Travel.albumImages.length : Travel.albumImages.length;
        for (let i = 0; i < maxLoad; i++) {
            let albumObj = Travel.albumImages[i];
            let imgUrl = albumObj.link;
            let thumbnail = albumObj.link;
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
    loadAlbumImg: (index, thumbnail, url) => {
        $('#album').append(
            '<div class="album-img" style="background: url(' + thumbnail + ');">' +
            `<img src="${thumbnail}" class="img">` +
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
    loadAlbumEvents: () => {
        document.onkeydown = (e) => {
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
        $('.load-more-btn').click(() => {
            let offset = $('.album-img').size()
            if (offset < Travel.albumImages.length) {
                let maxLoad = (Travel.albumImages.length - offset < Travel.maxPage) ? Travel.albumImages.length - offset : Travel.maxPage;
                for (let i = offset; i < (offset + maxLoad); i++) {
                    let albumObj = Travel.albumImages[i];
                    let imgUrl = albumObj.link;
                    let thumbnail = albumObj.link;
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
        $('#album').scroll(() => {
            let h = $("#album")[0].scrollHeight;
            let p = $("#album").height() + $("#album").scrollTop();
            if (p == h) {
                $('.load-more-btn').click();
            }
        });
        $('.album-img').click((e) => {
            if ($(e.target).find('.album-img-overlay').css('display') !== 'none' || true) {
                return;
            }
            let imgUrl = $(e.target).css('background-image');
            let stringUrl = imgUrl.substring(25, imgUrl.length - 2);
            if (stringUrl.length === 12 && stringUrl.includes('h.jpg')) {
                imgUrl = imgUrl.replace('h.jpg', '.jpg');
            } else {
                imgUrl = imgUrl.replace('.jpg', 'h.jpg');
            }
            $(e.target).css('background-image', imgUrl);
            $(e.target).toggleClass('album-img-select');
        });
    },
    loadNextImage: () => {
        let index = $('.selected-img').attr('index');
        if (++index > Travel.albumImages.length - 1) {
            index = 0;
        }
        let imgUrl = Travel.albumImages[index].link;
        let bgStyle = 'rgba(0, 0, 0, 0) url("' + imgUrl + '") no-repeat scroll 50% 50% / 100% padding-box border-box';
        $('.selected-img').css('background', bgStyle);
        $('.selected-img').attr('index', index);
    },
    loadPreviousImage: () => {
        let index = $('.selected-img').attr('index');
        if (--index < 0) {
            index = Travel.albumImages.length - 1;
        }
        let imgUrl = Travel.albumImages[index].link;
        let bgStyle = 'rgba(0, 0, 0, 0) url("' + imgUrl + '") no-repeat scroll 50% 50% / 100% padding-box border-box';
        $('.selected-img').css('background', bgStyle);
        $('.selected-img').attr('index', index);
    },
    resetAlbum: () => {
        $('#album').empty();
        setTimeout(() => {
            if (!$('#album').hasClass('album-loaded')) {
                $('#album').append('<span class="album-loading"><i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i></span>');
            }
        }, 1000);
    },
    closeAlbum: () => {
        $.scrollify.enable();
        $('#header').show();
        Travel.toggleViews();
        setTimeout(() => {
            $('#album').empty();
            $('#album').removeClass('album-loaded');
        }, 500);
    },
    toggleViews: () => {
        $('#header').toggleClass('header-hidden');
        $('#footer').toggleClass('footer-hidden');
        $('#album').toggleClass('album-hidden');
        $('#places').toggleClass('places-hidden');
    },
    scrollListener: (event) => {
        if ($(window).scrollTop() > 100) {
            $('.scrolltop-btn').removeClass('scrolltop-btn-hidden');
        } else {
            $('.scrolltop-btn').addClass('scrolltop-btn-hidden');
        }
    },
    scrollTop: (quick) => {
        if (!quick) {
            $('body').scrollTop(0);
        } else {
            $('body').animate({
                scrollTop: 0
            }, "slow");
        }
    },
    loadAlbumImgSelected: (e) => {
        $('#album-img-selected').removeClass('album-img-selected-hidden');
        $('#album-img-selected').append('<div class="selected-img" index="' + $(e.target).attr('album-img-index') + '" style="background: url(' + $(e.target).attr('img-url') + ');"></div>');
        $('#album-img-selected').append('<span class="close-selected-img-btn"><i class="fa fa-close fa-3x"></i></span>');
        $('#album-img-selected').append('<div class="open-img-nav"><i class="fa fa-fw fa-arrow-circle-left fa-3x"></i>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<i class="fa fa-fw fa-arrow-circle-right fa-3x"></i></div>');
        $('html').addClass('lock-scroll');
        $('.close-selected-img-btn').click(Travel.closeSelectedImage);
        Travel.loadAlbumImgSelectedEvents();
    },
    loadAlbumImgSelectedEvents: () => {
        $('.open-img-nav > .fa-arrow-circle-left').click(() => {
            Travel.loadPreviousImage();
        });
        $('.open-img-nav > .fa-arrow-circle-right').click(() => {
            Travel.loadNextImage();
        });
    },
    closeSelectedImage: () => {
        $('#album-img-selected').addClass('album-img-selected-hidden');
        setTimeout(() => {
            $('#album-img-selected').empty();
        }, 1000);
        $('html').removeClass('lock-scroll');
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
    }
};