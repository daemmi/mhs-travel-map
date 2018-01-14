var mhs_tm_utilities = mhs_tm_utilities || {};

/**************************************************************************************************
*   Google Maps utilities
*   
**************************************************************************************************/
mhs_tm_utilities.gmaps = {};

//snap path of coordinate array to road
mhs_tm_utilities.gmaps.route_snap_to_road = function( coordinates, i, route_array, disabled_snap_to_road, callback ) {
    //set distance of first coordinate to 0, should be done if this coordinate had a distance and 
    //the coordinate before have been deleted now
    if( i === 0 ) {
        coordinates[0].distance = 0;
    }
    if( i < coordinates.length - 1 ) {
        i++;
        //the gmaps direction service is async so use a callback
        //call the same function again if the callback from gmaps occured
        //if you went through the whole coordinations array, call callback and pass over the result
        mhs_tm_utilities.gmaps.get_route(coordinates[i - 1], coordinates[i], route_array, disabled_snap_to_road, function() {
            mhs_tm_utilities.gmaps.route_snap_to_road(coordinates, i, route_array, disabled_snap_to_road, callback);
        } );
    } else {
          callback(route_array);
    }
};

//use direction service of gmaps to get coordinates of a route between 2 coordinates
mhs_tm_utilities.gmaps.get_route = function(from, to, path, disabled_snap_to_road, callback) {
    var service = new google.maps.DirectionsService();

    //check if snap to road is disabed
    if( !disabled_snap_to_road && !to.dissnaptoroad ) {
        //the gmaps direction service is async so use a callback
        service.route( {
            origin: new google.maps.LatLng(from.latitude, from.longitude),
            destination: new google.maps.LatLng(to.latitude, to.longitude),
            travelMode: google.maps.DirectionsTravelMode.DRIVING
        }, function(result, status) {
            //if gmaps could calculate a direction get thearray with all coordinates and push it to the array
            if (status == google.maps.DirectionsStatus.OK) {
                //get dstance of path
                to.distance = result.routes[0].legs[0].distance.value;
                
                for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
                path.push( { 
                    lat: result.routes[0].overview_path[i].lat(),
                    lng: result.routes[0].overview_path[i].lng(),
                  } );
                }

                callback(); 
            } else if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
                //wait 2s if there is a OVER_QUERY_LIMIT error
                //and call function again
                setTimeout(function(){
                    mhs_tm_utilities.gmaps.get_route(from, to, path, disabled_snap_to_road, callback); 
                }, 2000); 
            } else {
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

                callback();
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

        callback();
    }
};

//geocode from lat long to places names
mhs_tm_utilities.gmaps.geocode_lat_lng = function( lat, lng, settings, callback ) {
    var index = { 'country': [], 'state': [], 'city': [] };
    index.country[0] = 'country';
    index.state[0]   = 'administrative_area_level_1';
    index.state[1]   = 'administrative_area_level_2';
    index.state[2]   = 'administrative_area_level_3';
    index.state[3]   = 'administrative_area_level_4';
    index.state[4]   = 'administrative_area_level_5';
    index.city[0]    = 'locality';
    index.city[1]    = 'sublocality';
    index.city[2]    = 'neighborhood';
    index.city[3]    = 'postal_town';
    
    gmap_geocode( lat, lng, index, settings, callback );

    function gmap_geocode( lat, lng, index, settings, callback ) {
        $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lng + 
            '&language=' + settings['lang_geocoding_gmap'] + '&key=' + settings['api_key_gmap'],//
            function( data ) {
                var status = data.status;
                var results = data.results;
                if ( data.error_message !== '' && data.error_message !== undefined ) {
                    mhs_tm_utilities.utilities.show_message( 'error',
                        'Google maps Geocoder API error! Message: ' + data.error_message );
                    callback( { 'error': 'Google maps Geocoder API error! Message: ' +
                            data.error_message } );
                    return;
                }
                switch( status ) {
                    case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                        setTimeout(function(){
                            gmap_geocode( lat, lng, index, settings, callback ); }, 2000); 
                        break;
                    case google.maps.GeocoderStatus.OK:
                        // success! 
                        var return_result = []; 
                        var address = results[0].address_components;
                        $.each(index, function( key ) {
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
                                if( return_result[key] !== '' ) {
                                    break;
                                }
                            }
                        } );
                        callback( return_result );
                        break;
                        
                    case google.maps.GeocoderStatus.ZERO_RESULTS:
                        return_result            = [];
                        return_result['country'] = '';
                        return_result['state']   = '';
                        return_result['city']    = '';
                        callback( return_result );
                        break;
                        
                    default:
                        callback(  { 'error': 'Google maps Geocoder API error! Message: undefinded' }  );
                        return;// failure!
                        break;
                }
            }
        );
    };
};
 
/**************************************************************************************************
*   Utilities for coordinate handling and informations
*   
**************************************************************************************************/
mhs_tm_utilities.coordinate_handling = {};

mhs_tm_utilities.coordinate_handling.get_only_on_route_coordinates = function( coordinates ) {
    var coordinates_on_route = [];
    
    coordinates.forEach(function(item, index) {
        if( item['ispartofaroute'] ) {
            coordinates_on_route.push( item );
        }
    } );
    
    return coordinates_on_route;
};

mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate = function( coordinate, coordinates ) {
    
    var contentString = '<div class="mhs-tm-map-message">' +
        '<p class="map-message-title"><b style="font-size: 120%;">';
    if ( coordinate.country )
    {
        contentString += coordinate.country;
    }
    if ( coordinate.state && coordinate.country )
    {
        contentString += ' - ' + coordinate.state;
    } else {
        contentString += coordinate.state;
    }
    if ( coordinate.city && coordinate.country || coordinate.city && coordinate.state )
    {
        contentString += ' - ' + coordinate.city;
    } else {
        contentString += coordinate.city;
    }
    var coordinate_date = new Date( mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset( parseInt( coordinate.starttime ) ) * 1000 )
        .toLocaleString();
    
    contentString += '</b> </br>' +
        // cut the last 3 chars because it's the seconds we won't display
        coordinate_date.slice(0, coordinate_date.length - 3) + '</br>';
    if( mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates) || 
        mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates) ) {
        contentString += '(';
    }
    
    if( mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates) ) {
        contentString += mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates);
        if( mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates) ) {
            contentString += ' | ' + mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates) + 
            ') </p>';
        } else {
            contentString +=  ') </p>';
        }
    } else if( mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates) ) {
        contentString += mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview(coordinate, coordinates) + 
        ') </p>';
    }
        

    if ( coordinate.note !== null && coordinate.note !== undefined && coordinate.note !== '' ) {
        contentString += '<hr>' + mhs_tm_utilities.utilities.stripslashes( coordinate.note );
    }
    contentString += '</div>';

    return contentString;
};

mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview = function( coordinate, coordinates ) {
    var lifts               = 0;
    var waiting_time_total  = 0;
    var id_last_coordinate  = 0;
    var id_first_coordinate = 0;
    var is_hitchhiking_spot = false;
    var string              = '';
    
    if( !coordinate.ispartofaroute ) {
        return false;
    }
    
    //is a hitchhiking spot on the route?      
    for( var x = 0; x < coordinates.length ; x++ ) {
        if( coordinates[x].ispartofaroute && coordinates[x].ishitchhikingspot ) {
            is_hitchhiking_spot = true;
            break;
        }
    }
    
    //find first coordinate on the route        
    for( var x = 0; x < coordinates.length ; x++ ) {
        if( coordinates[x].ispartofaroute ) {
            id_first_coordinate = x;
            break;
        }
    }
    
    //find last coordinate on the route        
    for( var x = coordinates.length - 1; x >= 0 ; x-- ) {
        if( coordinates[x].ispartofaroute ) {
            id_last_coordinate = x;
            break;
        }
    }
    //if coordinate is last coordinate on the route return lift count etc. 
    if( mhs_tm_utilities.utilities.is_equivalent(coordinate, coordinates[id_last_coordinate] ) ) {
        for( var x = 0; x < coordinates.length; ++x) {
            if( coordinates[x].ishitchhikingspot && coordinates[x].ispartofaroute ) {
                if( coordinates[x].waitingtime !== '' ) {
                    waiting_time_total += parseInt(coordinates[x].waitingtime);
                }
                ++lifts;
            }
        }
        
        // get time in hours and minutes
        var waiting_time_total_hours = waiting_time_total / 60;
        waiting_time_total_hours = Math.floor(waiting_time_total_hours);
        var waiting_time_total_minutes = waiting_time_total - waiting_time_total_hours * 60;
        waiting_time_total_minutes = Math.floor(waiting_time_total_minutes);
        var coordinate_time_total = coordinates[id_last_coordinate].starttime - 
            coordinates[id_first_coordinate].starttime;
        var coordinate_time_total_hours = coordinate_time_total / (60 * 60 );
        coordinate_time_total_hours = Math.floor(coordinate_time_total_hours);
        var coordinate_time_total_minutes = ( coordinate_time_total - 
            coordinate_time_total_hours * 60 * 60 ) / ( 60 );
        coordinate_time_total_minutes = Math.floor(coordinate_time_total_minutes);
        
        if( is_hitchhiking_spot ) {
            string += 'Total: ' + ( lifts - 1 ) + ' lifts | ';
        }
        
        string += 'Journey total: ';
        
        if( coordinate_time_total_hours !== 0 ) {
            string += coordinate_time_total_hours + 'h ';
        }
        if( coordinate_time_total_minutes !== 0 || coordinate_time_total_hours === 0 ) {
            string += coordinate_time_total_minutes + 'min ';
        }
        
        if( is_hitchhiking_spot ) {
            string += '| Waited total: ';
            if( waiting_time_total_hours !== 0 ) {
                string += waiting_time_total_hours + 'h ';
            }
            if( waiting_time_total_minutes !== 0 || waiting_time_total_hours === 0 ) {
                string += waiting_time_total_minutes + 'min ';
            }
        }
        
        return string; 
    } else if( coordinate.ishitchhikingspot ) {
        // otherwise just witing time
        // get time in hours and minutes
        var waiting_time_total_hours = coordinate.waitingtime / 60;
        waiting_time_total_hours = Math.floor(waiting_time_total_hours);
        var waiting_time_total_minutes = coordinate.waitingtime - waiting_time_total_hours * 60;
        waiting_time_total_minutes = Math.floor(waiting_time_total_minutes);
        
        var string = 'Waited: ';
        if( waiting_time_total_hours !== 0 ) {
            string += waiting_time_total_hours + 'h ';
        }
        if( waiting_time_total_minutes !== 0 || waiting_time_total_hours === 0 ) {
            string += waiting_time_total_minutes + 'min ';
        }
        return string;        
    }
};

mhs_tm_utilities.coordinate_handling.get_coordinate_distance_overview = function( coordinate, coordinates ) {
    var distance_total      = 0;
    var coordinate_on_route = 0;
    var id_last_coordinate  = 0;
    
    if( !coordinate.ispartofaroute || typeof coordinate.distance === 'undefined' ) {
        return false;
    }
    
    //find last coordinate on the route        
    for( var x = coordinates.length - 1; x >= 0 ; x-- ) {
        if( coordinates[x].ispartofaroute ) {
            id_last_coordinate = x;
            break;
        }
    }
    
    // check if it is first coordinate on the route and calculate total distance
    for( var x = 0; x < coordinates.length; ++x ) {   
        if( coordinates[x].ispartofaroute ) {
            coordinate_on_route += 1;
        }
        
        // if only one coordinate on route return false
        if( mhs_tm_utilities.utilities.is_equivalent( coordinate, coordinates[x] ) && coordinate_on_route < 2 ) {
            return false;
        }
        
        if( coordinates[x].ispartofaroute &&  typeof coordinate.distance !== 'undefined' ) {
            distance_total += coordinates[x].distance;
        }
        
        // if reached present coordinate in array break for loop
        if( mhs_tm_utilities.utilities.is_equivalent( coordinate, coordinates[x] ) ) {
            break;
        }
    }
    
    //if coordinate is last coordinate on the route return Total distance. 
    if( mhs_tm_utilities.utilities.is_equivalent(coordinate, coordinates[id_last_coordinate] ) ) {
        return 'Distance: ' + Math.round( coordinate.distance / 1000 ) + 'km | Total distance: ' + 
            Math.round( distance_total / 1000 ) + 'km';
    } else {
        return 'Distance: ' + Math.round( coordinate.distance / 1000 ) + 'km';
    }
};
 
/**************************************************************************************************
*   Utilities
*   
**************************************************************************************************/
mhs_tm_utilities.utilities = {};
       
mhs_tm_utilities.utilities.get_buttons = function( save_button ) {
    var html = '<span style="float:right;"> \n\
                <span class="mhs_tm_prim_button button mhs_tm_button_delete" style="margin-right:6px" >Delete!</span >';
    if( save_button !== false ) {
        html += '<span class="mhs_tm_prim_button button mhs_tm_button_save" style="margin-right:6px" id="mhs_tm_button_save_' + save_button + '">Save!</span >';
    }

    html += '</span>\n\
                </h3>';

    return html;
};

mhs_tm_utilities.utilities.is_equivalent = function( a, b ) {
    // Create arrays of property names
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length != bProps.length) {
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

mhs_tm_utilities.utilities.stripslashes = function( str ) {
    return str.replace(/\\'/g,'\'').replace(/\"/g,'"').replace(/\\\\/g,'\\').replace(/\\0/g,'\0');
};
        
mhs_tm_utilities.utilities.show_message = function( message_class, message ) {
    jQuery( function ( $ ) {
        $( "#dialog_message>p" ).text( message );
        $( "#dialog_message" )
            .removeClass()
            .addClass( message_class )
            .slideDown();
        setTimeout(  function() {
            $( "#dialog_message" ).slideUp();
        }, 3000);
    } );
};

mhs_tm_utilities.utilities.set_div_16_9 = function( div ) {
    jQuery( function ( $ ) {
        var height = $( div ).width() * 9 / 16;
        if( height > $( window ).height() * 0.8 ) {
            height = $( window ).height() * 0.8;
        }
        $( div ).height( height );
    } );
};

mhs_tm_utilities.utilities.sortResults = function( arr, key, asc ) {
    return arr.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if ( asc ) { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
        else { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
    });
};

// Function to get a timestamp - the local timezone offset 
// (timestamp could be in milliseconds or seconds)
mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset = function( timestamp ) {
    return timestamp + ( new Date().getTimezoneOffset() * 60 );
};

// Function to get a timestamp + the local timezone offset 
// (timestamp could be in milliseconds or seconds)
mhs_tm_utilities.utilities.get_timestamp_plus_timezone_offset = function( timestamp ) {
    return timestamp - ( new Date().getTimezoneOffset() * 60 );
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