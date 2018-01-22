var mhs_tm_utilities = mhs_tm_utilities || { };

/**************************************************************************************************
 *   Google Maps utilities
 *   
 **************************************************************************************************/
mhs_tm_utilities.gmaps = { };

//snap path of coordinate array to road
mhs_tm_utilities.gmaps.route_snap_to_road = function ( coordinates, i, route_array, disabled_snap_to_road, callback ) {
    //set distance of first coordinate to 0, should be done if this coordinate had a distance and 
    //the coordinate before have been deleted now

    //a route could only calculated between two coordinates
    if ( coordinates.length < 2 ) {
        callback( false );
        return;
    }

    if ( i === 0 ) {
        coordinates[0].distance = 0;
    }
    if ( i < coordinates.length - 1 ) {
        i++;
        //the gmaps direction service is async so use a callback
        //call the same function again if the callback from gmaps occured
        //if you went through the whole coordinations array, call callback and pass over the result
        mhs_tm_utilities.gmaps.get_route( coordinates[i - 1], coordinates[i], route_array,
            disabled_snap_to_road, function ( result ) {
                if ( result === true ) {
                    mhs_tm_utilities.gmaps.route_snap_to_road( coordinates, i, route_array,
                        disabled_snap_to_road, callback );
                } else {
                    callback( false );
                }
            } );
    } else {
        callback( route_array );
    }
};

//use direction service of gmaps to get coordinates of a route between 2 coordinates
mhs_tm_utilities.gmaps.get_route = function ( from, to, path, disabled_snap_to_road, callback ) {
    var service = new google.maps.DirectionsService();

    //check if snap to road is disabed
    if ( !disabled_snap_to_road && !to.dissnaptoroad ) {
        //the gmaps direction service is async so use a callback
        service.route( {
            origin: new google.maps.LatLng( from.latitude, from.longitude ),
            destination: new google.maps.LatLng( to.latitude, to.longitude ),
            travelMode: google.maps.DirectionsTravelMode.DRIVING
        }, function ( result, status ) {
            //if a error occurs 
            if ( result.error_message !== '' && result.error_message !== undefined ) {
                mhs_tm_utilities.utilities.show_message( 'error',
                    'Google maps Directions API error! Message: ' + result.error_message );
                callback( { 'error': 'Google maps Geocoder API error! Message: ' +
                        result.error_message } );
                return;
            }
            //if gmaps could calculate a direction get thearray with all coordinates and push it to the array
            switch ( status ) {
                case google.maps.DirectionsStatus.OK:
                    //get dstance of path
                    to.distance = result.routes[0].legs[0].distance.value;

                    for ( var i = 0, len = result.routes[0].overview_path.length; i < len; i++ ) {
                        path.push( {
                            lat: result.routes[0].overview_path[i].lat(),
                            lng: result.routes[0].overview_path[i].lng(),
                        } );
                    }

                    callback( true );
                    break;
                case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                    //wait 2s if there is a OVER_QUERY_LIMIT error
                    //and call function again
                    setTimeout( function () {
                        mhs_tm_utilities.gmaps.get_route( from, to, path, disabled_snap_to_road, callback );
                    }, 2000 );
                    break;
                case google.maps.DirectionsStatus.ZERO_RESULTS:
                    //if gmaps couldn't finde a direction put coordinates from origin and destination to the array
                    // get distance
                    to.distance = Math.round( google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng( from.latitude, from.longitude ),
                        new google.maps.LatLng( to.latitude, to.longitude ) ) );

                    path.push( {
                        lat: from.latitude,
                        lng: from.longitude,
                    } );

                    path.push( {
                        lat: to.latitude,
                        lng: to.longitude,
                    } );

                    callback( true );
                    break;
                default:
                    mhs_tm_utilities.utilities.show_message( 'error',
                        'Google maps Directions API error! Message: ' + result.error_message );
                    callback( { 'error': 'Google maps Geocoder API error! Message: ' +
                            result.error_message } );
                    break;
            }
        } );
    } else {
        //if disabled then just push the coordinates to the path and run callback
        // get distance
        to.distance = Math.round( google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng( from.latitude, from.longitude ),
            new google.maps.LatLng( to.latitude, to.longitude ) ) );
        path.push( {
            lat: from.latitude,
            lng: from.longitude,
        } );

        path.push( {
            lat: to.latitude,
            lng: to.longitude,
        } );

        callback( true );
    }
};

//geocode from lat long to places names
mhs_tm_utilities.gmaps.geocode_lat_lng = function ( lat, lng, settings, callback ) {
    var index = { 'country': [ ], 'state': [ ], 'city': [ ] };
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

    gmap_geocode( lat, lng, index, settings, callback );

    function gmap_geocode( lat, lng, index, settings, callback ) {
        $.getJSON( 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng +
            '&language=' + settings['lang_geocoding_gmap'] + '&key=' + settings['api_key_gmap'], //
            function ( data ) {
                var status = data.status;
                var results = data.results;
                if ( data.error_message !== '' && data.error_message !== undefined ) {
                    mhs_tm_utilities.utilities.show_message( 'error',
                        'Google maps Geocoder API error! Message: ' + data.error_message );
                    callback( { 'error': 'Google maps Geocoder API error! Message: ' +
                            data.error_message } );
                    return;
                }
                switch ( status ) {
                    case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                        setTimeout( function () {
                            gmap_geocode( lat, lng, index, settings, callback );
                        }, 2000 );
                        break;
                    case google.maps.GeocoderStatus.OK:
                        // success! 
                        var return_result = [ ];
                        var address = results[0].address_components;
                        $.each( index, function ( key ) {
                            return_result[key] = '';
                            for ( var p = address.length - 1; p >= 0; p-- ) {
                                //loop through all indexes of the present field
                                for ( var x = 0; x < index[key].length; x++ ) {
                                    if ( address[p].types.indexOf( index[key][x] ) !== -1 ) {
                                        return_result[key] = address[p]['long_name'];
                                        break;
                                    }
                                }
                                //check if something founded
                                if ( return_result[key] !== '' ) {
                                    break;
                                }
                            }
                        } );
                        callback( return_result );
                        break;

                    case google.maps.GeocoderStatus.ZERO_RESULTS:
                        return_result = [ ];
                        return_result['country'] = '';
                        return_result['state'] = '';
                        return_result['city'] = '';
                        callback( return_result );
                        break;

                    default:
                        callback( { 'error': 'Google maps Geocoder API error! Message: undefinded' } );
                        return;// failure!
                        break;
                }
            }
        );
    }
    ;
};

//Class popup window
jQuery( function ( $ ) {
    mhs_tm_utilities.gmaps.popup_window = function ( gmap, gmap_div, popup_div, control_button ) {
        this.gmap = gmap;
        this.gmap_div = gmap_div;
        this.popup_div = popup_div;
        this.control_button = control_button;
        this.popup_div_content_before = $( this.popup_div ).html();
        
        //add aditonal div to the popup div
        $( this.popup_div ).html( '<div class="mhs-tm-gmap-popup-window-inner">\n\
        <a class="mhs-tm-gmap-popup-window-close" href="javascript:void(0)"> \n\
        <span class="ui-icon ui-icon-white ui-icon-closethick"></span> </a> </div> \n\
        <div class="mhs-tm-gmap-popup-window-content">\n\
        <div class="mhs-tm-gmap-popup-window-new"></div> \n\
        <div class="mhs-tm-gmap-popup-window-content-before">' + this.popup_div_content_before + '</div> </div> ');

        this.popup_div_close = $( this.popup_div ).find( '.mhs-tm-gmap-popup-window-close' );
        this.popup_div_inner = $( this.popup_div ).find( '.mhs-tm-gmap-popup-window-inner' );
        this.popup_div_content = $( this.popup_div ).find( '.mhs-tm-gmap-popup-window-content' );
        this.popup_div_content_new = $( this.popup_div ).find( '.mhs-tm-gmap-popup-window-new' );
        this.popup_div_content_before = $( this.popup_div ).find( '.mhs-tm-gmap-popup-window-content-before' );
        this.content_control = '';

        this.show_control_button = function () {
            $( this.control_button ).fadeIn();
            this.change_gm_style();
        };

        this.change_gm_style = function () {
            $( this.gmap_div ).find( '.gm-style' ).css( {
                'color': '',
                'font-family': '',
                'font-size': '',
                'line-height': '',
                'font': 'inherit',
            } );
        };

        this.show = function ( content ) {
            $( this.popup_div ).outerHeight( $( this.gmap_div ).find( '.gm-style' ).height() );
            $( this.popup_div ).outerWidth( $( this.gmap_div ).find( '.gm-style' ).width() );
            $( this.popup_div ).css( {
                'left': 0,
                'z-index': 1000000000000
            } );
            $( this.popup_div_content_new ).html( content );
            $( this.popup_div ).fadeIn();

            $( this.popup_div_inner ).css( {
                'margin-top': ( $( this.popup_div ).height() -
                    $( this.popup_div_content ).outerHeight() ) / 2
            } );
            $( this.popup_div_content ).css( {
                'margin-top': ( $( this.popup_div ).height() -
                    $( this.popup_div_content ).outerHeight() ) / 2
            } );
        };

        this.show_control = function () {
            this.show( this.content_control );
        };

        this.hide = function () {
            $( this.popup_div ).fadeOut();
            $( this.popup_div_content_before ).children('div').each(function () {
                $( this ).fadeOut();
            });
        };

        this.set_size = function () {
            $( this.popup_div ).outerHeight( $( this.gmap_div ).find( '.gm-style' ).height() );
            $( this.popup_div ).outerWidth( $( this.gmap_div ).find( '.gm-style' ).width() );

            $( this.popup_div_inner ).css( {
                'margin-top': ( $( this.popup_div ).height() - $( this.popup_div_content ).outerHeight() ) / 2
            } );
            $( this.popup_div_content ).css( {
                'margin-top': ( $( this.popup_div ).height() - $( this.popup_div_content ).outerHeight() ) / 2
            } );
        };

        //place it in the map
        this.gmap.controls[google.maps.ControlPosition.LEFT_TOP].push( this.control_button );
        this.gmap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push( this.popup_div );
        //make the control button visible
        google.maps.event.addListenerOnce( this.gmap, 'idle', this.show_control_button.bind( this ) );
        google.maps.event.addListenerOnce( this.gmap, 'idle', this.change_gm_style.bind( this ) );

        this.gmap.addListener( 'bounds_changed', this.set_size.bind( this ) );

        //event if close is pressed
        $( this.popup_div_close ).click( this.hide.bind( this ) );

        $( this.control_button ).click( this.show_control.bind( this ) );
    };

} );

/**************************************************************************************************
 *   Utilities for coordinate handling and informations
 *   
 **************************************************************************************************/
mhs_tm_utilities.coordinate_handling = { };

mhs_tm_utilities.coordinate_handling.get_only_on_route_coordinates = function ( coordinates ) {
    var coordinates_on_route = [ ];

    coordinates.forEach( function ( item, index ) {
        if ( item['ispartofaroute'] ) {
            coordinates_on_route.push( item );
        }
    } );

    return coordinates_on_route;
};

mhs_tm_utilities.coordinate_handling.get_title = function ( coordinate, coordinates ) {
    var content_string = '';
    if ( coordinate.country )
    {
        content_string += coordinate.country;
    }
    if ( coordinate.state && coordinate.country )
    {
        content_string += ' - ' + coordinate.state;
    } else {
        content_string += coordinate.state;
    }
    if ( coordinate.city && coordinate.country || coordinate.city && coordinate.state )
    {
        content_string += ' - ' + coordinate.city;
    } else {
        content_string += coordinate.city;
    }

    if ( coordinate.country || coordinate.state || coordinate.city ) {
        content_string += ' - ';
    }
    var coordinate_date = new Date( mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset( parseInt( coordinate.starttime ) ) * 1000 )
        .toLocaleString( [], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' } );
    content_string += coordinate_date + ' - ';

    if ( mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview( coordinate, coordinates ) ||
        mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ) ) {
        content_string += '(';
    }

    if ( mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview( coordinate, coordinates ) ) {
        content_string += mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview( coordinate, coordinates ).string;
        if ( mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ) ) {
            content_string += ' | ' + mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ).string +
                ')';
        } else {
            content_string += ')';
        }
    } else if ( mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ) ) {
        content_string += mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ).string +
            ')';
    }

    return content_string;
};

mhs_tm_utilities.coordinate_handling.get_contentstring_of_map = function ( coordinates, map_name ) {
    var total_distance = 0;
    var lifts_total = 0;
    var journey_total_h = 0;
    var journey_total_min = 0;
    var journey_string = '';
    var waited_total_h = 0;
    var waited_total_min = 0;
    var waited_string = '';
    var content_string = '';
    var start_date = 999999999999999;
    var end_date = 0;
    var lift_string = '';
    
    for ( var x = 0; x < coordinates.length; x++ ) {
        //check if route has coordinates
        if( coordinates[x].coordinates.length !== 0 ) {
            
            if( coordinates[x].coordinates[0].starttime < start_date ) {
                start_date = coordinates[x].coordinates[0].starttime;
            } 
            
            if( coordinates[x].coordinates[coordinates[x].coordinates.length - 1].starttime > end_date ) {
                end_date = coordinates[x].coordinates[coordinates[x].coordinates.length - 1].starttime;
            } 
            
            content_string += coordinates[x].options.name + ' - ';
            var coordinate_date = new Date( mhs_tm_utilities.utilities
                .get_timestamp_minus_timezone_offset( parseInt( coordinates[x].coordinates[0].starttime ) ) * 1000 )
                .toLocaleString( [ ], { year: 'numeric', month: 'numeric', day: 'numeric' } );
            content_string += coordinate_date + '</br>';

            if ( mhs_tm_utilities.coordinate_handling.
                get_coordinate_waiting_overview( coordinates[x].coordinates[coordinates[x].coordinates.length - 1],
                    coordinates[x].coordinates ) ||
                mhs_tm_utilities.coordinate_handling.
                get_coordinate_distance_overview( coordinates[x].coordinates[coordinates[x].coordinates.length - 1],
                    coordinates[x].coordinates ) ) {

                content_string += '(';
            }

            if ( mhs_tm_utilities.coordinate_handling.
                get_coordinate_waiting_overview( coordinates[x].coordinates[coordinates[x].coordinates.length - 1],
                    coordinates[x].coordinates ) ) {
                var overview = mhs_tm_utilities.coordinate_handling.
                    get_coordinate_waiting_overview( coordinates[x].coordinates[coordinates[x].coordinates.length - 1],
                        coordinates[x].coordinates );

                journey_string = 'Journey: ';
                if ( overview.journey_time_h > 0 ) {
                    journey_string += overview.journey_time_h + 'h ';
                }
                if ( overview.journey_time_h > 0 && overview.journey_time_min > 0 || 
                    overview.journey_time_h === 0 ) {
                    journey_string += overview.journey_time_min + 'min';
                }

                waited_string = '';
                if( overview.waiting_time_h > 0 || overview.waiting_time_min > 0 ) {
                    waited_string += ' | Waited: ';
                    if ( overview.waiting_time_h > 0 ) {
                        waited_string += overview.waiting_time_h + 'h ';
                    }
                    if ( overview.waiting_time_h > 0 && overview.waiting_time_min > 0 || 
                        overview.waiting_time_h === 0 ) {
                        waited_string += overview.waiting_time_min + 'min';
                    }
                }
                
                if( overview.lifts > 0 ) {
                    content_string += overview.lifts + ' lifts | ';
                }
                content_string += journey_string + waited_string;
                lifts_total += overview.lifts;
                journey_total_h += overview.journey_time_h;
                journey_total_min += overview.journey_time_min;
                waited_total_h += overview.waiting_time_h;
                waited_total_min += overview.waiting_time_min;

                if ( mhs_tm_utilities.coordinate_handling.
                    get_coordinate_distance_overview( coordinates[x].coordinates[coordinates[x].coordinates.length - 1],
                        coordinates[x].coordinates ) ) {
                    var distance = mhs_tm_utilities.coordinate_handling.
                        get_coordinate_distance_overview( coordinates[x].coordinates[coordinates[x].coordinates.length - 1],
                            coordinates[x].coordinates );
                    content_string += ' | Total distance: ' + distance.total_distance + 'km) <br> <br>  ';

                    total_distance += distance.total_distance;
                } else {
                    content_string += ') <br>  <br> ';
                }
            } else if ( mhs_tm_utilities.coordinate_handling.
                get_coordinate_distance_overview( coordinates[x].coordinates[coordinates[x].coordinates.length - 1],
                    coordinates[x].coordinates ) ) {
                distance = mhs_tm_utilities.coordinate_handling.
                    get_coordinate_distance_overview( coordinates[x].coordinates[coordinates[x].coordinates.length - 1],
                        coordinates[x].coordinates );
                content_string += ' | Total distance: ' + distance.total_distance + 'km) <br> <br>  ';

                total_distance += distance.total_distance;
            }    
        }
    }
    
    if( lifts_total > 0 ) {
        lift_string = lifts_total + ' lifts | ';
    }
    
    journey_string = 'Journey: ';
    if( journey_total_h > 24) {
        journey_string += ( mhs_tm_utilities.utilities.get_days_from_hours( journey_total_h ).days ) + 'd ';
    }
    if( journey_total_h > 0) {
        journey_string += (  mhs_tm_utilities.utilities.get_days_from_hours( journey_total_h ).hours + 
            mhs_tm_utilities.utilities.get_hours_from_minutes( journey_total_min ).hours ) + 'h ';
    }
    if( journey_total_h > 0 && journey_total_min > 0 || journey_total_h === 0 ) {
        journey_string += mhs_tm_utilities.utilities.get_hours_from_minutes( journey_total_min ).minutes + 'min';
    }

    if( waited_total_h > 0 || waited_total_min > 0 ) {
        waited_string = ' | Waited: ';
        if( waited_total_h > 24 ) {
            waited_string += ( mhs_tm_utilities.utilities.get_days_from_hours( waited_total_h ).days ) + 'd ';
        }
        if( waited_total_h > 0 ) {
            waited_string += (  mhs_tm_utilities.utilities.get_days_from_hours( waited_total_h ).hours + 
                mhs_tm_utilities.utilities.get_hours_from_minutes( waited_total_min ).hours ) + 'h ';
        }   
        if( waited_total_h > 0 && waited_total_min > 0 || waited_total_h === 0 ) {
            waited_string += mhs_tm_utilities.utilities.get_hours_from_minutes( waited_total_min ).minutes + 'min';
        }
    }

    start_date = new Date( mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset( parseInt( start_date ) ) * 1000 )
        .toLocaleString( [], { year: 'numeric', month: 'numeric', day: 'numeric' } );

    end_date = new Date( mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset( parseInt( end_date ) ) * 1000 )
        .toLocaleString( [], { year: 'numeric', month: 'numeric', day: 'numeric' } );
    
    var header_string = '<div class="mhs-tm-map-message"> <p class="mhs-tm-map-message-title"> \n\
                        <b style="font-size: 150%;">' + map_name + '</b> <br>' + 
                        start_date + ' to ' + end_date + '<br>' +
                        lift_string + journey_string + waited_string + ' | ' +
                        'Distance: ' + total_distance + 'km </p> <hr> \n\
                        <p class="mhs-tm-map-message-content">';

    content_string += '</p> </div>';

    return header_string + content_string;
};

mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate = function ( coordinate, coordinates ) {

    var content_string = '<div class="mhs-tm-map-message"> <p class="mhs-tm-map-message-title">';

    if ( coordinate.country || coordinate.state || coordinate.city ) {
        content_string += '<b style="font-size: 120%;">';
    }
    if ( coordinate.country )
    {
        content_string += coordinate.country;
    }
    if ( coordinate.state && coordinate.country )
    {
        content_string += ' - ' + coordinate.state;
    } else {
        content_string += coordinate.state;
    }
    if ( coordinate.city && coordinate.country || coordinate.city && coordinate.state )
    {
        content_string += ' - ' + coordinate.city;
    } else {
        content_string += coordinate.city;
    }

    if ( coordinate.country || coordinate.state || coordinate.city ) {
        content_string += '</b> </br>';
    }
    var coordinate_date = new Date( mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset( parseInt( coordinate.starttime ) ) * 1000 )
        .toLocaleString( [], { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' } );
    content_string += coordinate_date + '</br>';

    if ( mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview( coordinate, coordinates ) ||
        mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ) ) {
        content_string += '(';
    }

    if ( mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview( coordinate, coordinates ) ) {
        content_string += mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview( coordinate, coordinates ).string;
        if ( mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ) ) {
            content_string += ' | ' + mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ).string +
                ') </p>';
        } else {
            content_string += ') </p>';
        }
    } else if ( mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ) ) {
        content_string += mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview( coordinate, coordinates ).string +
            ') </p>';
    }


    if ( coordinate.note !== null && coordinate.note !== undefined && coordinate.note !== '' ) {
        content_string += '<hr>';
    }
    content_string += '</div>';

    return content_string;
};

mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview = function ( coordinate, coordinates ) {
    var lifts = 0;
    var waiting_time_total = 0;
    var id_last_coordinate = 0;
    var id_first_coordinate = 0;
    var is_hitchhiking_spot = false;
    var string = '';

    if ( !coordinate.ispartofaroute ) {
        return false;
    }

    //is a hitchhiking spot on the route?      
    for ( var x = 0; x < coordinates.length; x++ ) {
        if ( coordinates[x].ispartofaroute && coordinates[x].ishitchhikingspot ) {
            is_hitchhiking_spot = true;
            break;
        }
    }

    //find first coordinate on the route        
    for ( var x = 0; x < coordinates.length; x++ ) {
        if ( coordinates[x].ispartofaroute ) {
            id_first_coordinate = x;
            break;
        }
    }

    //find last coordinate on the route        
    for ( var x = coordinates.length - 1; x >= 0; x-- ) {
        if ( coordinates[x].ispartofaroute ) {
            id_last_coordinate = x;
            break;
        }
    }
    //if coordinate is last coordinate on the route return lift count etc. 
    if ( mhs_tm_utilities.utilities.is_equivalent( coordinate, coordinates[id_last_coordinate] ) ) {
        for ( var x = 0; x < coordinates.length; ++x ) {
            if ( coordinates[x].ishitchhikingspot && coordinates[x].ispartofaroute ) {
                if ( coordinates[x].waitingtime !== '' ) {
                    waiting_time_total += parseInt( coordinates[x].waitingtime );
                }
                ++lifts;
            }
        }

        // get time in hours and minutes
        var waiting_time_total_hours = 
            mhs_tm_utilities.utilities.get_hours_from_minutes( waiting_time_total ).hours;
        var waiting_time_total_minutes = 
            mhs_tm_utilities.utilities.get_hours_from_minutes( waiting_time_total ).minutes;
        var coordinate_time_total = coordinates[id_last_coordinate].starttime -
            coordinates[id_first_coordinate].starttime;
        var coordinate_time_total_hours = coordinate_time_total / ( 60 * 60 );
        coordinate_time_total_hours = Math.floor( coordinate_time_total_hours );
        var coordinate_time_total_minutes = ( coordinate_time_total -
            coordinate_time_total_hours * 60 * 60 ) / ( 60 );
        coordinate_time_total_minutes = Math.floor( coordinate_time_total_minutes );

        if ( is_hitchhiking_spot ) {
            string += 'Total: ' + ( lifts - 1 ) + ' lifts | ';
        }

        string += 'Journey total: ';

        if ( coordinate_time_total_hours !== 0 ) {
            string += coordinate_time_total_hours + 'h ';
        }
        if ( coordinate_time_total_minutes !== 0 || coordinate_time_total_hours === 0 ) {
            string += coordinate_time_total_minutes + 'min';
        }

        if ( is_hitchhiking_spot ) {
            string += ' | Waited total: ';
            if ( waiting_time_total_hours !== 0 ) {
                string += waiting_time_total_hours + 'h ';
            }
            if ( waiting_time_total_minutes !== 0 || waiting_time_total_hours === 0 ) {
                string += waiting_time_total_minutes + 'min';
            }
        }

        return { 'string': string,
            'lifts': lifts,
            'journey_time_h': coordinate_time_total_hours,
            'journey_time_min': coordinate_time_total_minutes,
            'waiting_time_h': waiting_time_total_hours,
            'waiting_time_min': waiting_time_total_minutes
        };
    } else if ( coordinate.ishitchhikingspot ) {
        // otherwise just witing time
        // get time in hours and minutes
        var waiting_time_total_hours = coordinate.waitingtime / 60;
        waiting_time_total_hours = Math.floor( waiting_time_total_hours );
        var waiting_time_total_minutes = coordinate.waitingtime - waiting_time_total_hours * 60;
        waiting_time_total_minutes = Math.floor( waiting_time_total_minutes );

        var string = ' Waited: ';
        if ( waiting_time_total_hours !== 0 ) {
            string += waiting_time_total_hours + 'h ';
        }
        if ( waiting_time_total_minutes !== 0 || waiting_time_total_hours === 0 ) {
            string += waiting_time_total_minutes + 'min';
        }
        return { 'string': string,
            'lifts': lifts,
            'journey_time_h': coordinate_time_total_hours,
            'journey_time_min': coordinate_time_total_minutes,
            'waiting_time_h': waiting_time_total_hours,
            'waiting_time_min': waiting_time_total_minutes
        };
    }
};

mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview = function ( coordinate, coordinates ) {
    var distance_total = 0;
    var coordinate_on_route = 0;
    var id_last_coordinate = 0;

    if ( !coordinate.ispartofaroute || typeof coordinate.distance === 'undefined' ||
        coordinate.distance == 0 ) {
        return false;
    }

    //find last coordinate on the route        
    for ( var x = coordinates.length - 1; x >= 0; x-- ) {
        if ( coordinates[x].ispartofaroute ) {
            id_last_coordinate = x;
            break;
        }
    }

    // check if it is first coordinate on the route and calculate total distance
    for ( var x = 0; x < coordinates.length; ++x ) {
        if ( coordinates[x].ispartofaroute ) {
            coordinate_on_route += 1;
        }

        // if only one coordinate on route return false
        if ( mhs_tm_utilities.utilities.is_equivalent( coordinate, coordinates[x] ) && coordinate_on_route < 2 ) {
            return false;
        }

        if ( coordinates[x].ispartofaroute && typeof coordinate.distance !== 'undefined' ) {
            distance_total += coordinates[x].distance;
        }

        // if reached present coordinate in array break for loop
        if ( mhs_tm_utilities.utilities.is_equivalent( coordinate, coordinates[x] ) ) {
            break;
        }
    }

    //if coordinate is last coordinate on the route return Total distance. 
    if ( mhs_tm_utilities.utilities.is_equivalent( coordinate, coordinates[id_last_coordinate] ) ) {
        var string = 'Distance: ' + Math.round( coordinate.distance / 1000 ) + 'km | Total distance: ' +
            Math.round( distance_total / 1000 ) + 'km';
        return { 'string': string,
            'coordinate_distance': Math.round( coordinate.distance / 1000 ),
            'total_distance': Math.round( distance_total / 1000 ) 
        };
    } else {
        var string =  'Distance: ' + Math.round( coordinate.distance / 1000 ) + 'km';
        return { 'string': string,
            'coordinate_distance': Math.round( coordinate.distance / 1000 ),
            'total_distance': Math.round( distance_total / 1000 ) 
        };
    }
};

/**************************************************************************************************
 *   Utilities
 *   
 **************************************************************************************************/
mhs_tm_utilities.utilities = { };

mhs_tm_utilities.utilities.get_buttons = function ( save_button ) {
    var html = '<span style="float:right;"> \n\
                <span class="mhs_tm_prim_button button mhs_tm_button_delete" style="margin-right:6px" >Delete!</span >';
    if ( save_button !== false ) {
        html += '<span class="mhs_tm_prim_button button mhs_tm_button_save" style="margin-right:6px" id="mhs_tm_button_save_' + save_button + '">Save!</span >';
    }

    html += '</span>\n\
                </h3>';

    return html;
};

mhs_tm_utilities.utilities.is_equivalent = function ( a, b ) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames( a );
    var bProps = Object.getOwnPropertyNames( b );

    // If number of properties is different,
    // objects are not equivalent
    if ( aProps.length != bProps.length ) {
        return false;
    }

    for ( var i = 0; i < aProps.length; i++ ) {
        var propName = aProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if ( a[propName] !== b[propName] ) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
};

mhs_tm_utilities.utilities.stripslashes = function ( str ) {
    return str.replace( /\\'/g, '\'' ).replace( /\"/g, '"' ).replace( /\\\\/g, '\\' ).replace( /\\0/g, '\0' );
};

mhs_tm_utilities.utilities.show_message = function ( message_class, message ) {
    jQuery( function ( $ ) {
        var dialog_width = $( "#mhs-tm-dialog-message" ).width();
        $( "#mhs-tm-dialog-message>p" ).text( message );
        $( "#mhs-tm-dialog-message" )
            .removeClass()
            .addClass( message_class )
            .fadeIn();
        setTimeout( function () {
            $( "#mhs-tm-dialog-message" ).fadeOut();
        }, 1500 );
    } );
};

mhs_tm_utilities.utilities.set_div_16_9 = function ( div ) {
    jQuery( function ( $ ) {
        var height = $( div ).width() * 9 / 16;
        if ( height > $( window ).height() * 0.8 ) {
            height = $( window ).height() * 0.8;
        }
        $( div ).height( height );
    } );
};

mhs_tm_utilities.utilities.sort_results = function ( arr, key, asc ) {
    return arr.sort( function ( a, b ) {
        var x = a[key];
        var y = b[key];
        if ( asc ) {
            return ( ( x < y ) ? -1 : ( ( x > y ) ? 1 : 0 ) );
        } else {
            return ( ( x > y ) ? -1 : ( ( x < y ) ? 1 : 0 ) );
        }
    } );
};

// Function to get a timestamp - the local timezone offset 
// (timestamp could be in milliseconds or seconds)
mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset = function ( timestamp ) {
    return timestamp + ( new Date().getTimezoneOffset() * 60 );
};

// Function to get a timestamp + the local timezone offset 
// (timestamp could be in milliseconds or seconds)
mhs_tm_utilities.utilities.get_timestamp_plus_timezone_offset = function ( timestamp ) {
    return timestamp - ( new Date().getTimezoneOffset() * 60 );
};

// Function to get hours from minutes
mhs_tm_utilities.utilities.get_hours_from_minutes = function ( minutes ) {
    var hours = Math.floor( minutes / 60 );
    minutes = Math.floor( minutes - hours * 60 );
    
    return {'hours': hours, 'minutes': minutes };
};

// Function to get days from hours
mhs_tm_utilities.utilities.get_days_from_hours = function ( hours ) {
    var days = Math.floor( hours / 24 );
    hours = Math.floor( hours - days * 24 );
    
    return {'days': days, 'hours': hours };
};

jQuery( function ( $ ) {
    $( "#mhs_tm_dialog_loading" ).dialog( {
        modal: true,
        dialogClass: 'mhs_tm_dialog_loading',
        open: function ( event, ui ) {
            $( ".ui-dialog-titlebar-close" ).hide();
            $( ".ui-dialog-titlebar" ).hide();
        },
        autoOpen: false,
        position: { my: "center", at: "center+" + $( "#adminmenuback" ).width() / 2, of: window }
    } );
} );