var mhs_tm_utilities = mhs_tm_utilities || {};

/**************************************************************************************************
 *   Google Maps utilities
 *   
 **************************************************************************************************/
mhs_tm_utilities.gmaps = {};

//snap path of coordinate array to road
mhs_tm_utilities.gmaps.route_snap_to_road = function (coordinates, i, route_array, disabled_snap_to_road, callback) {
    //set distance of first coordinate to 0, should be done if this coordinate had a distance and 
    //the coordinate before have been deleted now

    //a route could only calculated between two coordinates
    if (coordinates.length < 2) {
        callback(false);
        return;
    }

    if (i === 0) {
        coordinates[0].distance = 0;
    }
    if (i < coordinates.length - 1) {
        i++;
        //the gmaps direction service is async so use a callback
        //call the same function again if the callback from gmaps occured
        //if you went through the whole coordinations array, call callback and pass over the result
        mhs_tm_utilities.gmaps.get_route(coordinates[i - 1], coordinates[i], route_array,
            disabled_snap_to_road, function (result) {
                if (result === true) {
                    mhs_tm_utilities.gmaps.route_snap_to_road(coordinates, i, route_array,
                        disabled_snap_to_road, callback);
                } else {
                    callback(false);
                }
            });
    } else {
        callback(route_array);
    }
};

//use direction service of gmaps to get coordinates of a route between 2 coordinates
mhs_tm_utilities.gmaps.get_route = function (from, to, path, disabled_snap_to_road, callback) {
    var service = new google.maps.DirectionsService();

    //check if snap to road is disabed
    if (!disabled_snap_to_road && !to.dissnaptoroad) {
        //the gmaps direction service is async so use a callback
        service.route({
            origin: new google.maps.LatLng(from.latitude, from.longitude),
            destination: new google.maps.LatLng(to.latitude, to.longitude),
            travelMode: google.maps.DirectionsTravelMode.DRIVING
        }, function (result, status) {
            //if gmaps could calculate a direction get thearray with all coordinates and push it to the array
            switch (status) {
                case google.maps.DirectionsStatus.OK:
                    //get dstance of path
                    to.distance = result.routes[0].legs[0].distance.value;

                    for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
                        path.push({
                            lat: result.routes[0].overview_path[i].lat(),
                            lng: result.routes[0].overview_path[i].lng(),
                        });
                    }

                    callback(true);
                    break;
                case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                    //wait 2s if there is a OVER_QUERY_LIMIT error
                    //and call function again
                    setTimeout(function () {
                        mhs_tm_utilities.gmaps.get_route(from, to, path, disabled_snap_to_road, callback);
                    }, 2000);
                    break;
                case google.maps.DirectionsStatus.ZERO_RESULTS:
                    //if gmaps couldn't finde a direction put coordinates from origin and destination to the array
                    // get distance
                    to.distance = Math.round(google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(from.latitude, from.longitude),
                        new google.maps.LatLng(to.latitude, to.longitude)));

                    path.push({
                        lat: from.latitude,
                        lng: from.longitude,
                    });

                    path.push({
                        lat: to.latitude,
                        lng: to.longitude,
                    });

                    callback(true);
                    break;
                default:
                    if (result !== null && result.error_message !== '' &&
                        result.error_message !== undefined) {
                        mhs_tm_utilities.utilities.show_message('error',
                            'Google maps Directions API error! Message: ' + result.error_message);
                        callback({
                            'error': 'Google maps Geocoder API error! Message: ' +
                                result.error_message
                        });
                    } else {
                        mhs_tm_utilities.utilities.show_message('error',
                            'Google maps Directions API error!');
                        callback({ 'error': 'Google maps Geocoder API error!' });
                    }
                    break;
            }
        });
    } else {
        //if disabled then just push the coordinates to the path and run callback
        // get distance
        to.distance = Math.round(google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(from.latitude, from.longitude),
            new google.maps.LatLng(to.latitude, to.longitude)));
        path.push({
            lat: from.latitude,
            lng: from.longitude,
        });

        path.push({
            lat: to.latitude,
            lng: to.longitude,
        });

        callback(true);
    }
};

//geocode from lat long to places names
mhs_tm_utilities.gmaps.geocode_lat_lng = function (lat, lng, settings, callback) {
    var index = { 'country': [], 'state': [], 'city': [] };
    index.country[0] = 'country';
    index.state[0] = 'administrative_area_level_1';
    index.state[1] = 'administrative_area_level_2';
    index.state[2] = 'administrative_area_level_3';
    index.state[3] = 'administrative_area_level_4';
    index.state[4] = 'administrative_area_level_5';
    index.city[0] = 'locality';
    index.city[1] = 'sublocality';
    index.city[2] = 'neighborhood';
    index.city[3] = 'postal_town';

    gmap_geocode(lat, lng, index, settings, callback);

    function gmap_geocode(lat, lng, index, settings, callback) {
        var geocoder = new google.maps.Geocoder;
        //        $.getJSON( 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng +
        //            '&language=' + settings['lang_geocoding_gmap'] + '&key=' + settings['api_key_gmap'],
        //            function ( data ) {
        geocoder.geocode({ 'location': { lat: lat, lng: lng } }, function (results, status) {
            switch (status) {
                case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                    setTimeout(function () {
                        gmap_geocode(lat, lng, index, settings, callback);
                    }, 2000);
                    break;
                case google.maps.GeocoderStatus.OK:
                    // success! 
                    var return_result = [];
                    var address = results[0].address_components;

                    for (var key in index) {
                        return_result[key] = '';
                        for (var p = address.length - 1; p >= 0; p--) {
                            //loop through all indexes of the present field
                            for (var x = 0; x < index[key].length; x++) {
                                if (address[p].types.indexOf(index[key][x]) !== -1) {
                                    return_result[key] = address[p]['long_name'];
                                    break;
                                }
                            }
                            //check if something founded
                            if (return_result[key] !== '') {
                                break;
                            }
                        }
                    }
                    callback(return_result);
                    break;

                case google.maps.GeocoderStatus.ZERO_RESULTS:
                    return_result = [];
                    return_result['country'] = '';
                    return_result['state'] = '';
                    return_result['city'] = '';
                    callback(return_result);
                    break;

                default:
                    if (results !== null && results.error_message !== '' &&
                        results.error_message !== undefined) {
                        mhs_tm_utilities.utilities.show_message('error',
                            'Google maps Directions API error! Message: ' + results.error_message);
                        callback({
                            'error': 'Google maps Geocoder API error! Message: ' +
                                results.error_message
                        });
                    } else {
                        mhs_tm_utilities.utilities.show_message('error',
                            'Google maps Directions API error!');
                        callback({ 'error': 'Google maps Geocoder API error!' });
                    }
                    return;// failure!
                    break;
            }
        });
    };
};

//Class popup window
jQuery(function ($) {
    mhs_tm_utilities.gmaps.popup_window = function (gmap, gmap_div, popup_div, loading_div,
        control_button, plugin_dir) {
        this.gmap = gmap;
        this.gmap_div = gmap_div;
        this.popup_div = popup_div;
        this.loading_div = loading_div;
        this.control_button = control_button;
        this.popup_div_content_before = $(this.popup_div).html();
        this.gmap_id = this.gmap_div.id.slice(18);

        //add aditonal div to the popup div
        $(this.popup_div).html('<div class="mhs-tm-gmap-popup-window-inner">\n\
        <div class="mhs-tm-gmap-popup-window-close" href="javascript:void(0)" title="close"></div> </div> \n\
        <div class="mhs-tm-gmap-popup-window-content-wrapper">\n\
            <div class="mhs-tm-gmap-popup-window-control"> \n\
                <div class="mhs-tm-gmap-popup-control-arrow-left" data-map-id="' + this.gmap_id + '"\n\
                style="float: left; display: flex; flex-wrap: nowrap; align-items: center;"> \n\
                <a href="javascript:void(0)" id="mhs-tm-gmap-popup-previous">\n\
                <img border="0" alt="previous" \n\
                src="' + plugin_dir + 'img/Arrow_Left.png"> </a> \n\
                <a href="javascript:void(0)" style="vertical-align: super;"> \n\
                Previous </a></div>\n\
                <div class="mhs-tm-gmap-popup-control-arrow-right" data-map-id="' + this.gmap_id + '"\n\
                style="float: right; display: flex; flex-wrap: nowrap; align-items: center;"> \n\
                <a href="javascript:void(0)" style="vertical-align: super;"> \n\
                Next </a>\n\
                <a href="javascript:void(0)" id="mhs-tm-gmap-popup-next">\n\
                <img border="0" alt="next" \n\
                src="' + plugin_dir + 'img/Arrow_Right.png"> </a> </div>\n\
            </div>\n\
            <div class="mhs-tm-gmap-popup-window-content">\n\
                <div class="mhs-tm-gmap-popup-window-new"></div> \n\
                <div class="mhs-tm-gmap-popup-window-content-before">' + this.popup_div_content_before + '</div> \n\
            </div> \n\
        </div>');

        this.popup_div_close = $(this.popup_div).find('.mhs-tm-gmap-popup-window-close');
        this.popup_div_inner = $(this.popup_div).find('.mhs-tm-gmap-popup-window-inner');
        this.popup_div_content_wrapper = $(this.popup_div).find('.mhs-tm-gmap-popup-window-content-wrapper');
        this.popup_div_content = $(this.popup_div).find('.mhs-tm-gmap-popup-window-content');
        this.popup_div_content_control = $(this.popup_div).find('.mhs-tm-gmap-popup-window-control');
        this.popup_div_content_control_left = $(this.popup_div).find('.mhs-tm-gmap-popup-control-arrow-left');
        this.popup_div_content_control_right = $(this.popup_div).find('.mhs-tm-gmap-popup-control-arrow-right');
        this.popup_div_content_new = $(this.popup_div).find('.mhs-tm-gmap-popup-window-new');
        this.popup_div_content_before = $(this.popup_div).find('.mhs-tm-gmap-popup-window-content-before');
        this.content_control = '';

        this.show_control_button = function () {
            this.gmap.controls[google.maps.ControlPosition.LEFT_TOP].push(this.control_button);
            $(this.control_button).delay(1000).fadeIn();
            this.change_gm_style();
        };

        this.change_gm_style = function () {
            $(this.gmap_div).find('.gm-style').css({
                'color': '',
                'font-family': '',
                'font-size': '',
                'line-height': '',
                'font': 'inherit',
            });
        };

        this.show = function (content) {
            this.popup_div_content_control.show();
            $(this.popup_div).outerHeight($(this.gmap_div).find('.gm-style').height());
            $(this.popup_div).outerWidth($(this.gmap_div).find('.gm-style').width());
            $(this.popup_div).css({
                'left': 0,
                'z-index': 1000000000000
            });
            $(this.popup_div_content_new).html(content);
            $(this.popup_div).fadeIn();
            $(this.popup_div_content).scrollTop(0);

            this.set_size();
        };

        this.show_loading = function (time) {
            $(this.loading_div).css({
                'left': 0,
                'top': 0,
                'z-index': 1000000000000
            });

            $(this.loading_div).fadeIn(time);
        };

        this.show_control = function () {
            this.popup_div_content_control.hide();
            this.popup_div_content_before.html('');
            $(this.popup_div).outerHeight($(this.gmap_div).find('.gm-style').height());
            $(this.popup_div).outerWidth($(this.gmap_div).find('.gm-style').width());
            $(this.popup_div).css({
                'left': 0,
                'z-index': 1000000000000
            });
            $(this.popup_div_content_new).html(this.content_control);
            $(this.popup_div).fadeIn();
            $(this.popup_div_content).scrollTop(0);

            this.set_size();
        };

        this.show_control_div = function () {
            this.popup_div_content_control.show();
        };

        this.hide_control_div = function () {
            this.popup_div_content_control.hide();
        };

        this.show_control_arrow = function (arrow) {
            switch (arrow) {
                case 'left':
                    this.popup_div_content_control_left.show();
                    break;
                case 'right':
                    this.popup_div_content_control_right.show();
                    break;
                default:
                    this.popup_div_content_control_left.show();
                    this.popup_div_content_control_right.show();
                    break;
            }
        };

        this.hide_control_arrow = function (arrow) {
            switch (arrow) {
                case 'left':
                    this.popup_div_content_control_left.hide();
                    break;
                case 'right':
                    this.popup_div_content_control_right.hide();
                    break;
                default:
                    this.popup_div_content_control_left.hide();
                    this.popup_div_content_control_right.hide();
                    break;
            }
        };

        this.hide = function () {
            $(this.popup_div).fadeOut();
            $(this.popup_div_content_before).children('div').each(function () {
                $(this).fadeOut();
            });
        };

        this.hide_loading = function (time) {
            $(this.loading_div).fadeOut(time);
        };

        this.set_size = function () {
            $(this.popup_div).outerHeight($(this.gmap_div).find('.gm-style').height());
            $(this.popup_div).outerWidth($(this.gmap_div).find('.gm-style').width());

            $(this.popup_div_content).css({
                'max-height': ($(this.popup_div).height()) -
                    $(this.popup_div_content_control).outerHeight(true) -
                    ($(this.popup_div_content_wrapper).outerHeight() -
                        $(this.popup_div_content_wrapper).innerHeight())
            });

            //No margin on top, because if pictures get loaded later the div size with content
            //gets bigger and get out of the map div because margin will be calculated before
            //            $( this.popup_div_inner ).css( {
            //                'margin-top': ( $( this.popup_div ).height() - $( this.popup_div_content_wrapper ).outerHeight() ) / 2
            //            } );
        };

        //place it in the map
        this.gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(this.popup_div);
        ////place loading_div in the map
        this.gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(this.loading_div);
        //make the control button visible
        google.maps.event.addListenerOnce(this.gmap, 'tilesloaded', this.show_control_button.bind(this));
        google.maps.event.addListenerOnce(this.gmap, 'tilesloaded', this.change_gm_style.bind(this));

        this.gmap.addListener('bounds_changed', this.set_size.bind(this));

        //event if close is pressed
        $(this.popup_div_close).click(this.hide.bind(this));

        $(this.control_button).click(this.show_control.bind(this));
    };

    mhs_tm_utilities.gmaps.popup_control_initialize = function () {
        // handle gmap popup window control action
        $('.mhs-tm-gmap-popup-control-arrow-left').on('click', $(this), function () {
            var map_canvas_id = $(this).attr("data-map-id");
            var active_coordinate = mhs_tm_map.active_coordinate[map_canvas_id];
            var next_route_id = 0;
            var next_coordinate_id = 0;
            var five_next_route_id = 0;
            var five_next_coordinate_id = 0;
            var change_bounce = 0;

            //calculate which id are for the nextcoordinate
            if (active_coordinate.route_id === 0) {
                if (active_coordinate.coordinate_id !== 0) {
                    next_coordinate_id = active_coordinate.coordinate_id - 1;
                }
            } else if (active_coordinate.route_id !== 0 && active_coordinate.coordinate_id !== 0) {
                next_coordinate_id = active_coordinate.coordinate_id - 1;
                next_route_id = active_coordinate.route_id;
            } else if (active_coordinate.route_id !== 0 && active_coordinate.coordinate_id === 0) {
                next_route_id = active_coordinate.route_id - 1;
                next_coordinate_id = mhs_tm_map.marker[map_canvas_id][next_route_id].length - 1;

                change_bounce = 1;
            }

            for (var y = 0; y < 5; y++) {
                //calculate which id are for the 5th previous coordinate
                if (active_coordinate.route_id === 0) {
                    if (active_coordinate.coordinate_id !== 0) {
                        active_coordinate.coordinate_id = active_coordinate.coordinate_id - 1;
                    }
                } else if (active_coordinate.route_id !== 0 && active_coordinate.coordinate_id !== 0) {
                    active_coordinate.coordinate_id = active_coordinate.coordinate_id - 1;
                } else if (active_coordinate.route_id !== 0 && active_coordinate.coordinate_id === 0) {
                    active_coordinate.route_id = active_coordinate.route_id - 1;
                    active_coordinate.coordinate_id = mhs_tm_map.marker[map_canvas_id][active_coordinate.route_id].length - 1;
                }
            }

            var five_next_route_id = active_coordinate.route_id;
            var five_next_coordinate_id = active_coordinate.coordinate_id;

            var marker = mhs_tm_map.marker[map_canvas_id][next_route_id][next_coordinate_id];

            mhs_tm_map.next_coordinate_animation(map_canvas_id, marker, active_coordinate,
                next_route_id, next_coordinate_id, change_bounce, five_next_route_id, five_next_coordinate_id);
        });

        $('.mhs-tm-gmap-popup-control-arrow-right').on('click', $(this), function () {
            var map_canvas_id = $(this).attr("data-map-id");
            var active_coordinate = mhs_tm_map.active_coordinate[map_canvas_id];
            var next_route_id = 0;
            var next_coordinate_id = 0;
            var five_next_route_id = 0;
            var five_next_coordinate_id = 0;
            var change_bounce = 0;

            //calculate which id are for the nextcoordinate
            if (active_coordinate.coordinate_id < mhs_tm_map.marker[map_canvas_id][active_coordinate.route_id].length - 1) {
                next_coordinate_id = active_coordinate.coordinate_id + 1;
                next_route_id = active_coordinate.route_id;
            } else {
                next_coordinate_id = 0;
                next_route_id = active_coordinate.route_id + 1;

                change_bounce = 1;
            }

            for (var y = 0; y < 5; y++) {
                //calculate which id are for the 5th next coordinate
                if (active_coordinate.coordinate_id < mhs_tm_map.marker[map_canvas_id][active_coordinate.route_id].length - 1) {
                    active_coordinate.coordinate_id = active_coordinate.coordinate_id + 1;
                } else if (active_coordinate.route_id < mhs_tm_map.marker[map_canvas_id].length - 1) {
                    active_coordinate.route_id = active_coordinate.route_id + 1;
                    active_coordinate.coordinate_id = 0;
                }
            }

            var five_next_route_id = active_coordinate.route_id;
            var five_next_coordinate_id = active_coordinate.coordinate_id;

            var marker = mhs_tm_map.marker[map_canvas_id][next_route_id][next_coordinate_id];

            mhs_tm_map.next_coordinate_animation(map_canvas_id, marker, active_coordinate,
                next_route_id, next_coordinate_id, change_bounce, five_next_route_id, five_next_coordinate_id);
        });
    };
});

/**************************************************************************************************
 *   Utilities for coordinate handling and informations
 *   
 **************************************************************************************************/
mhs_tm_utilities.coordinate_handling = {};

mhs_tm_utilities.coordinate_handling.get_only_on_route_coordinates = function (coordinates) {
    var coordinates_on_route = [];

    coordinates.forEach(function (item, index) {
        if (item['ispartofaroute']) {
            coordinates_on_route.push(item);
        }
    });

    return coordinates_on_route;
};

mhs_tm_utilities.coordinate_handling.get_last_on_route_coordinate_id_in_route = function (coordinates) {
    var last_coordinate_id_on_route = 0;

    for (i = coordinates.length - 1; i > 0; i--) {
        if (coordinates[i]['ispartofaroute']) {
            last_coordinate_id_on_route = i;
            break;
        }
    }

    return last_coordinate_id_on_route;
};

mhs_tm_utilities.coordinate_handling.get_last_on_route_and_spot_coordinate_id_in_route = function (coordinates) {
    var last_coordinate_id_on_route = 0;

    for (i = coordinates.length - 1; i > 0; i--) {
        if (coordinates[i]['ispartofaroute'] && coordinates[i]['ishitchhikingspot']) {
            last_coordinate_id_on_route = i;
            break;
        }
    }

    return last_coordinate_id_on_route;
};

mhs_tm_utilities.coordinate_handling.get_title = function (coordinate, coordinates, route_options) {
    var content_string = '';

    if (coordinate.invisiblepin) {
        content_string = 'invisible';
    } else {
        if (coordinate.country) {
            content_string += coordinate.country;
        }
        if (coordinate.state && coordinate.country) {
            content_string += ' - ' + coordinate.state;
        } else {
            content_string += coordinate.state;
        }
        if (coordinate.city && coordinate.country || coordinate.city && coordinate.state) {
            content_string += ' - ' + coordinate.city;
        } else {
            content_string += coordinate.city;
        }

        if (coordinate.country || coordinate.state || coordinate.city) {
            content_string += ' - ';
        }

        if (route_options['dis_route_time_date'] !== 1) {
            var coordinate_date = new Date(mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset(parseInt(coordinate.starttime)) * 1000)
                .toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
            content_string += coordinate_date + ' - ';
        }

        if (mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates) ||
            mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates)) {
            content_string += '(';
        }

        if (mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates)) {
            content_string += mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates).string;
            if (mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates)) {
                content_string += ' | ' + mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates).string +
                    ')';
            } else {
                content_string += ')';
            }
        } else if (mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates)) {
            content_string += mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates).string +
                ')';
        }
    }

    return content_string;
};

mhs_tm_utilities.coordinate_handling.get_contentstring_of_map = function (routes, map_options) {
    var total_distance = [];
    var lifts_total = [];
    var journey_total_h = [];
    var journey_total_min = [];
    var journey_string = [];
    var waited_total_h = [];
    var waited_total_min = [];
    var waited_string = [];
    var content_string = [];
    var start_date = [];
    var end_date = [];
    var lift_string = [];
    var transport_classes = [];
    var header_string = [];
    var transport_class;
    var transport_color = [];
    var transport_name = [];

    //create variables for all
    lifts_total['all'] = 0;
    journey_total_h['all'] = 0;
    journey_total_min['all'] = 0;
    waited_total_h['all'] = 0;
    waited_total_min['all'] = 0;
    total_distance['all'] = 0;

    for (var x = routes.length - 1; x >= 0; x--) {
        //check if route has coordinates
        if (routes[x].coordinates.length > 1) {
            //Get all transport classes
            if (routes[x].options.transport_class === '') {
                transport_class = 'Other';
            } else {
                transport_class = routes[x].options.transport_class;
                map_options.transport_classes.forEach(function (item, index) {
                    if (parseInt(transport_class) === parseInt(item.id)) {
                        transport_color[transport_class] = item.color;
                        transport_name[transport_class] = item.name;
                    }
                });
            }

            var last_on_route_coordinate_id = mhs_tm_utilities.coordinate_handling.
                get_last_on_route_coordinate_id_in_route(routes[x].coordinates);

            if (transport_classes.indexOf(transport_class) === -1) {
                //add new class to array of all appearing classes
                transport_classes.push(transport_class);
                //create the variables
                content_string[transport_class] = '<p class="mhs-tm-map-message-content" \n\
                                                    style="padding-left: 20px;">';
                lifts_total[transport_class] = 0;
                journey_total_h[transport_class] = 0;
                journey_total_min[transport_class] = 0;
                waited_total_h[transport_class] = 0;
                waited_total_min[transport_class] = 0;
                total_distance[transport_class] = 0;
            }

            //Make statistics for each transport class
            if (typeof start_date['all'] === 'undefined' ||
                routes[x].coordinates[0].starttime < start_date['all']) {
                start_date['all'] = routes[x].coordinates[0].starttime;
            }
            if (typeof start_date[transport_class] === 'undefined' ||
                routes[x].coordinates[0].starttime < start_date[transport_class]) {
                start_date[transport_class] = routes[x].coordinates[0].starttime;
            }

            if (typeof end_date['all'] === 'undefined' ||
                routes[x].coordinates[last_on_route_coordinate_id].starttime > end_date['all']) {
                end_date['all'] = routes[x].coordinates[last_on_route_coordinate_id].starttime;
            }
            if (typeof end_date[transport_class] === 'undefined' ||
                routes[x].coordinates[last_on_route_coordinate_id].starttime > end_date[transport_class]) {
                end_date[transport_class] = routes[x].coordinates[last_on_route_coordinate_id].starttime;
            }

            content_string[transport_class] += routes[x].options.name + ' - ';
            var coordinate_date = new Date(mhs_tm_utilities.utilities
                .get_timestamp_minus_timezone_offset(parseInt(routes[x].coordinates[0].starttime)) * 1000)
                .toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric' });
            content_string[transport_class] += coordinate_date + '</br>';

            if (mhs_tm_utilities.coordinate_handling.
                get_coordinate_waiting_overview(routes[x].coordinates[last_on_route_coordinate_id],
                    routes[x].coordinates) ||
                mhs_tm_utilities.coordinate_handling.
                    get_coordinate_distance_overview(routes[x].coordinates[last_on_route_coordinate_id],
                        routes[x].coordinates)) {

                content_string[transport_class] += '(';
            }

            if (mhs_tm_utilities.coordinate_handling.
                get_coordinate_waiting_overview(routes[x].coordinates[last_on_route_coordinate_id],
                    routes[x].coordinates)) {
                var overview = mhs_tm_utilities.coordinate_handling.
                    get_coordinate_waiting_overview(routes[x].coordinates[last_on_route_coordinate_id],
                        routes[x].coordinates);

                journey_string[transport_class] = 'Journey: ';
                if (overview.journey_time_h > 0) {
                    journey_string[transport_class] += overview.journey_time_h + 'h ';
                }
                if (overview.journey_time_h > 0 && overview.journey_time_min > 0 ||
                    overview.journey_time_h === 0) {
                    journey_string[transport_class] += overview.journey_time_min + 'min';
                }

                waited_string[transport_class] = '';
                if (overview.waiting_time_h > 0 || overview.waiting_time_min > 0) {
                    waited_string[transport_class] += ' | Waited: ';
                    if (overview.waiting_time_h > 0) {
                        waited_string[transport_class] += overview.waiting_time_h + 'h ';
                    }
                    if (overview.waiting_time_h > 0 && overview.waiting_time_min > 0 ||
                        overview.waiting_time_h === 0) {
                        waited_string[transport_class] += overview.waiting_time_min + 'min';
                    }
                }

                if (overview.lifts > 0) {
                    content_string[transport_class] += overview.lifts + ' lifts | ';
                }
                content_string[transport_class] += journey_string[transport_class] +
                    waited_string[transport_class];

                lifts_total[transport_class] += overview.lifts;
                journey_total_h[transport_class] += overview.journey_time_h;
                journey_total_min[transport_class] += overview.journey_time_min;
                waited_total_h[transport_class] += overview.waiting_time_h;
                waited_total_min[transport_class] += overview.waiting_time_min;

                lifts_total['all'] += overview.lifts;
                journey_total_h['all'] += overview.journey_time_h;
                journey_total_min['all'] += overview.journey_time_min;
                waited_total_h['all'] += overview.waiting_time_h;
                waited_total_min['all'] += overview.waiting_time_min;

                if (mhs_tm_utilities.coordinate_handling.
                    get_coordinate_distance_overview(routes[x].coordinates[last_on_route_coordinate_id],
                        routes[x].coordinates)) {
                    var distance = mhs_tm_utilities.coordinate_handling.
                        get_coordinate_distance_overview(routes[x].coordinates[last_on_route_coordinate_id],
                            routes[x].coordinates);
                    content_string[transport_class] += ' | Total distance: ' + distance.total_distance + 'km) <br> <br>  ';

                    total_distance[transport_class] += distance.total_distance;
                    total_distance['all'] += distance.total_distance;
                } else {
                    content_string[transport_class] += ') <br>  <br> ';
                }
            } else if (mhs_tm_utilities.coordinate_handling.
                get_coordinate_distance_overview(routes[x].coordinates[last_on_route_coordinate_id],
                    routes[x].coordinates)) {
                distance[transport_class] = mhs_tm_utilities.coordinate_handling.
                    get_coordinate_distance_overview(routes[x].coordinates[last_on_route_coordinate_id],
                        routes[x].coordinates);
                content_string[transport_class] += ' | Total distance: ' + distance.total_distance + 'km) <br> <br>  ';

                total_distance[transport_class] += distance.total_distance;
                total_distance['all'] += distance.total_distance;
            }
        }
    }
    //close all content strings
    transport_classes.forEach(function (item, index) {
        content_string[item] += '</p>';
    });

    //create header for the whole map and the other transport classes
    transport_classes.push('all');
    transport_classes.forEach(function (item, index) {
        //Default Strings
        lift_string[item] = '';
        journey_string[item] = '';
        waited_string[item] = '';

        if (lifts_total[item] > 0) {
            lift_string[item] = lifts_total[item] + ' lifts | ';
        }

        journey_string[item] = 'Journey: ';
        if (journey_total_h[item] > 24) {
            journey_string[item] += (mhs_tm_utilities.utilities.get_days_from_hours(journey_total_h[item] +
                mhs_tm_utilities.utilities.get_hours_from_minutes(journey_total_min[item]).hours).days) + 'd ';
        }
        if (journey_total_h[item] > 0) {
            journey_string[item] += mhs_tm_utilities.utilities.get_days_from_hours(journey_total_h[item] +
                mhs_tm_utilities.utilities.get_hours_from_minutes(journey_total_min[item]).hours).hours + 'h ';
        }
        if (journey_total_h[item] > 0 && journey_total_min[item] > 0 || journey_total_h[item] === 0) {
            journey_string[item] += mhs_tm_utilities.utilities.get_hours_from_minutes(journey_total_min[item]).minutes + 'min';
        }

        if (waited_total_h[item] > 0 || waited_total_min[item] > 0) {
            waited_string[item] = ' | Waited: ';
            if (waited_total_h[item] > 24) {
                waited_string[item] += (mhs_tm_utilities.utilities.get_days_from_hours(waited_total_h[item] +
                    mhs_tm_utilities.utilities.get_hours_from_minutes(waited_total_min[item]).hours).days) + 'd ';
            }
            if (waited_total_h[item] > 0) {
                waited_string[item] += mhs_tm_utilities.utilities.get_days_from_hours(waited_total_h[item] +
                    mhs_tm_utilities.utilities.get_hours_from_minutes(waited_total_min[item]).hours).hours + 'h ';
            }
            if (waited_total_h[item] > 0 && waited_total_min[item] > 0 || waited_total_h[item] === 0) {
                waited_string[item] += mhs_tm_utilities.utilities.get_hours_from_minutes(waited_total_min[item]).minutes + 'min';
            }
        }

        start_date[item] = new Date(mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset(parseInt(start_date[item])) * 1000)
            .toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric' });

        end_date[item] = new Date(mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset(parseInt(end_date[item])) * 1000)
            .toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric' });

        var title = '';
        var break_block = '';
        var style_block = 'style="font-size: 120%; text-decoration: underline; -webkit-text-decoration-color: ' +
            transport_color[item] + '; text-decoration-color: ' + transport_color[item] + ';"';
        if (item === 'all') {
            title = map_options.name;
            break_block = '<br>';
            style_block = 'style="font-size: 150%;"';
        } else if (item === 'Other') {
            title = item;
            style_block = 'style="font-size: 120%;"';
        } else {
            title = transport_name[item];
            //            title = item;
        }
        header_string[item] = '<div class="mhs-tm-map-message-title"> \n\
                            <h1 ' + style_block + '>' + title + '</h1>' +
            start_date[item] + ' to ' + end_date[item] + '<br>' +
            lift_string[item] + journey_string[item] + waited_string[item] + ' | ' +
            'Distance: ' + total_distance[item] + 'km <hr></div>';
    });

    var return_string = '<div class="mhs-tm-map-message">';
    return_string += header_string['all'];
    transport_classes.forEach(function (item, index) {
        if (item !== 'all' && item !== 'Other')
            return_string += header_string[item] + content_string[item];
    });

    if (typeof header_string['Other'] !== 'undefined') {
        return_string += header_string['Other'] + content_string['Other'];
    }

    return return_string;
};

mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate =
    function (coordinate, coordinates, route_options) {

        var content_string = '<div class="mhs-tm-map-message-title">';

        if (coordinate.country || coordinate.state || coordinate.city) {
            content_string += '<h1 style="font-size: 120%;">'; //'<b style="font-size: 120%;">'
        }
        if (coordinate.country) {
            content_string += coordinate.country;
        }
        if (coordinate.state && coordinate.country) {
            content_string += ' - ' + coordinate.state;
        } else {
            content_string += coordinate.state;
        }
        if (coordinate.city && coordinate.country || coordinate.city && coordinate.state) {
            content_string += ' - ' + coordinate.city;
        } else {
            content_string += coordinate.city;
        }

        if (coordinate.country || coordinate.state || coordinate.city) {
            content_string += '</h1>';
        }

        content_string += '<p>';

        if (route_options['dis_route_time_date'] !== 1) {
            var coordinate_date = new Date(mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset(parseInt(coordinate.starttime)) * 1000)
                .toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
            content_string += coordinate_date + '</br>';
        }

        if (mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates) ||
            mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates)) {
            content_string += '(';
        }

        if (mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates)) {
            content_string += mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates).string;
            if (mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates)) {
                content_string += ' | ' + mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates).string +
                    ')';
            } else {
                content_string += ')';
            }
        } else if (mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates)) {
            content_string += mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates).string +
                ')';
        }
        content_string += '</p>';


        if (coordinate.note !== null && coordinate.note !== undefined && coordinate.note !== '') {
            content_string += '<hr>';
        }
        content_string += '</div>';

        return content_string;
    };

mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview = function (coordinate, coordinates) {
    var lifts = 0;
    var waiting_time_total = 0;
    var id_last_coordinate = 0;
    var id_first_coordinate = 0;
    var is_hitchhiking_spot = false;
    var string = '';

    if (!coordinate.ispartofaroute) {
        return false;
    }

    //is a hitchhiking spot on the route and is it not the last one?      
    for (var x = 0; x < coordinates.length - 1; x++) {
        if (coordinates[x].ispartofaroute && coordinates[x].ishitchhikingspot) {
            is_hitchhiking_spot = true;
            break;
        }
    }

    //find first coordinate on the route        
    for (var x = 0; x < coordinates.length; x++) {
        if (coordinates[x].ispartofaroute) {
            id_first_coordinate = x;
            break;
        }
    }

    //find last coordinate on the route        
    for (var x = coordinates.length - 1; x >= 0; x--) {
        if (coordinates[x].ispartofaroute) {
            id_last_coordinate = x;
            break;
        }
    }
    //if coordinate is last coordinate on the route return lift count etc. 
    if (mhs_tm_utilities.utilities.is_equivalent(coordinate, coordinates[id_last_coordinate])) {
        for (var x = 0; x < coordinates.length; ++x) {
            if (coordinates[x].ishitchhikingspot && coordinates[x].ispartofaroute &&
                x !== id_last_coordinate) {
                if (coordinates[x].waitingtime !== '') {
                    waiting_time_total += parseInt(coordinates[x].waitingtime);
                }
                ++lifts;
            }
        }

        // get time in hours and minutes
        var waiting_time_total_hours =
            mhs_tm_utilities.utilities.get_hours_from_minutes(waiting_time_total).hours;
        var waiting_time_total_minutes =
            mhs_tm_utilities.utilities.get_hours_from_minutes(waiting_time_total).minutes;
        var coordinate_time_total = coordinates[id_last_coordinate].starttime -
            coordinates[id_first_coordinate].starttime;
        var coordinate_time_total_hours = coordinate_time_total / (60 * 60);
        coordinate_time_total_hours = Math.floor(coordinate_time_total_hours);
        var coordinate_time_total_minutes = (coordinate_time_total -
            coordinate_time_total_hours * 60 * 60) / (60);
        coordinate_time_total_minutes = Math.floor(coordinate_time_total_minutes);

        if (is_hitchhiking_spot && lifts > 0) {
            string += 'Total: ' + (lifts) + ' lifts | ';
        }

        string += 'Journey total: ';

        if (coordinate_time_total_hours !== 0) {
            string += coordinate_time_total_hours + 'h ';
        }
        if (coordinate_time_total_minutes !== 0 || coordinate_time_total_hours === 0) {
            string += coordinate_time_total_minutes + 'min';
        }

        if (is_hitchhiking_spot) {
            string += ' | Waited total: ';
            if (waiting_time_total_hours !== 0) {
                string += waiting_time_total_hours + 'h ';
            }
            if (waiting_time_total_minutes !== 0 || waiting_time_total_hours === 0) {
                string += waiting_time_total_minutes + 'min';
            }
        }

        return {
            'string': string,
            'lifts': lifts,
            'journey_time_h': coordinate_time_total_hours,
            'journey_time_min': coordinate_time_total_minutes,
            'waiting_time_h': waiting_time_total_hours,
            'waiting_time_min': waiting_time_total_minutes
        };
    } else if (coordinate.ishitchhikingspot) {
        // otherwise just witing time
        // get time in hours and minutes
        var waiting_time_total_hours = coordinate.waitingtime / 60;
        waiting_time_total_hours = Math.floor(waiting_time_total_hours);
        var waiting_time_total_minutes = coordinate.waitingtime - waiting_time_total_hours * 60;
        waiting_time_total_minutes = Math.floor(waiting_time_total_minutes);

        var string = ' Waited: ';
        if (waiting_time_total_hours !== 0) {
            string += waiting_time_total_hours + 'h ';
        }
        if (waiting_time_total_minutes !== 0 || waiting_time_total_hours === 0) {
            string += waiting_time_total_minutes + 'min';
        }
        return {
            'string': string,
            'lifts': lifts,
            'journey_time_h': coordinate_time_total_hours,
            'journey_time_min': coordinate_time_total_minutes,
            'waiting_time_h': waiting_time_total_hours,
            'waiting_time_min': waiting_time_total_minutes
        };
    }
};

mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview = function (coordinate, coordinates) {
    var distance_total = 0;
    var distance = 0;
    var coordinate_on_route = 0;
    var id_last_coordinate = 0;

    if (!coordinate.ispartofaroute || typeof coordinate.distance === 'undefined' ||
        coordinate.distance == 0) {
        return false;
    }

    //find last coordinate on the route        
    for (var x = coordinates.length - 1; x >= 0; x--) {
        if (coordinates[x].ispartofaroute) {
            id_last_coordinate = x;
            break;
        }
    }

    // check if it is first coordinate on the route and calculate total distance
    for (var x = 0; x < coordinates.length; ++x) {
        if (coordinates[x].ispartofaroute) {
            coordinate_on_route += 1;
        }

        // if only one coordinate on route return false
        if (mhs_tm_utilities.utilities.is_equivalent(coordinate, coordinates[x]) && coordinate_on_route < 2) {
            return false;
        }

        if (coordinates[x].ispartofaroute && typeof coordinate.distance !== 'undefined') {
            distance_total += coordinates[x].distance;
        }

        // if reached present coordinate in array break for loop and check if 
        // a invisible pin is come before
        if (mhs_tm_utilities.utilities.is_equivalent(coordinate, coordinates[x])) {
            distance += coordinates[x].distance;
            break;
        } else if (coordinates[x].invisiblepin) {
            distance += coordinates[x].distance;
        } else {
            distance = 0;
        }
    }

    // take the right calculated distance
    if (distance === 0) {
        distance = coordinate.distance;
    }

    //if coordinate is last coordinate on the route return Total distance. 
    if (mhs_tm_utilities.utilities.is_equivalent(coordinate, coordinates[id_last_coordinate])) {
        var string = 'Distance to pin: ' + Math.round(distance / 1000) + 'km | Total distance: ' +
            Math.round(distance_total / 1000) + 'km';
        return {
            'string': string,
            'coordinate_distance': Math.round(distance / 1000),
            'total_distance': Math.round(distance_total / 1000),
            'total_distance_in_m': distance_total
        };
    } else {
        var string = 'Distance to pin: ' + Math.round(distance / 1000) + 'km';
        return {
            'string': string,
            'coordinate_distance': Math.round(distance / 1000),
            'total_distance': Math.round(distance_total / 1000),
            'total_distance_in_m': distance_total
        };
    }
};

/**************************************************************************************************
 *   Utilities
 *   
 **************************************************************************************************/
mhs_tm_utilities.utilities = {};

mhs_tm_utilities.utilities.get_buttons = function (save_button) {
    var html = '<span style="float:right;"> \n\
                <span class="mhs_tm_prim_button button mhs_tm_button_delete" style="margin-right:6px" >Delete!</span >';
    if (save_button !== false) {
        html += '<span class="mhs_tm_prim_button button mhs_tm_button_save" style="margin-right:6px" id="mhs_tm_button_save_' + save_button + '">Save!</span >';
    }

    html += '</span>\n\
                </h3>';

    return html;
};

mhs_tm_utilities.utilities.is_equivalent = function (a, b) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length !== bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
};

mhs_tm_utilities.utilities.stripslashes = function (str) {
    return str.replace(/\\'/g, '\'').replace(/\"/g, '"').replace(/\\\\/g, '\\').replace(/\\0/g, '\0');
};

mhs_tm_utilities.utilities.show_message = function (message_class, message) {
    jQuery(function ($) {
        var dialog_width = $("#mhs-tm-dialog-message").width();
        $("#mhs-tm-dialog-message>p").text(message);
        $("#mhs-tm-dialog-message")
            .removeClass()
            .addClass(message_class)
            .fadeIn();
        setTimeout(function () {
            $("#mhs-tm-dialog-message").fadeOut();
        }, 1500);
    });
};

mhs_tm_utilities.utilities.set_div_16_9 = function (div) {
    jQuery(function ($) {
        var height = $(div).width() * 9 / 16;
        if (height > $(window).height() * 0.8) {
            height = $(window).height() * 0.8;
        }
        $(div).height(height);
    });
};

mhs_tm_utilities.utilities.sort_results = function (arr, key, asc) {
    return arr.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if (asc) {
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        } else {
            return ((x > y) ? -1 : ((x < y) ? 1 : 0));
        }
    });
};

// Function to get a timestamp - the local timezone offset 
// (timestamp in seconds)
mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset = function (timestamp) {
    return timestamp + (new Date(timestamp * 1000).getTimezoneOffset() * 60);
};

// Function to get a timestamp + the local timezone offset 
// (timestamp in seconds)
mhs_tm_utilities.utilities.get_timestamp_plus_timezone_offset = function (timestamp) {
    return timestamp - (new Date(timestamp * 1000).getTimezoneOffset() * 60);
};

// Function to get hours from minutes
mhs_tm_utilities.utilities.get_hours_from_minutes = function (minutes) {
    var hours = Math.floor(minutes / 60);
    minutes = Math.floor(minutes - hours * 60);

    return { 'hours': hours, 'minutes': minutes };
};

// Function to get days from hours
mhs_tm_utilities.utilities.get_days_from_hours = function (hours) {
    var days = Math.floor(hours / 24);
    hours = Math.floor(hours - days * 24);

    return { 'days': days, 'hours': hours };
};

jQuery(function ($) {
    $("#mhs_tm_dialog_loading").dialog({
        modal: true,
        dialogClass: 'mhs_tm_dialog_loading',
        open: function (event, ui) {
            $(".ui-dialog-titlebar-close").hide();
            $(".ui-dialog-titlebar").hide();
        },
        autoOpen: false,
        position: { my: "center", at: "center+" + $("#adminmenuback").width() / 2, of: window }
    });
});