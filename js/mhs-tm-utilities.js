var mhs_tm_utilities = mhs_tm_utilities || {};

/**************************************************************************************************
*   Google Maps utilities
*   
**************************************************************************************************/
mhs_tm_utilities.gmaps = {};

//snap path of coordinate array to road
mhs_tm_utilities.gmaps.route_snap_to_road = function( coordinates, i, route_array, disabled_snap_to_road, callback ) {
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
}

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
                    mhs_tm_utilities.gmaps.get_route(from, to, path, callback); 
                }, 2000); 
            } else {
                //if gmaps couldn't finde a direction put coordinates from origin and destination to the array
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
}
 
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
    
    return coordinates_on_route
}

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
    var coordinate_date = new Date( mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset( parseInt( coordinate.starttime ) ) )
        .toLocaleString();
    
    contentString += '</b> </br>' +
        // cut the last 3 chars because it's the seconds we won't display
        coordinate_date.slice(0, coordinate_date.length - 3) +
        mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview(coordinate, coordinates) +
        '</p> <hr>';

    if ( coordinate.note !== null && coordinate.note !== undefined ) {
        contentString += mhs_tm_utilities.utilities.stripslashes( coordinate.note );
    }
    contentString += '</div>';

    return contentString;
}

mhs_tm_utilities.coordinate_handling.get_coordinate_waiting_overview = function( coordinate, coordinates ) {
    var lifts = 0;
    var waiting_time_total = 0;
    
    if( !coordinate.ishitchhikingspot || !coordinate.ispartofaroute ) {
        return '';
    }
    
    if( mhs_tm_utilities.utilities.is_equivalent(coordinate, coordinates[coordinates.length - 1] ) ) {
        for( var x = 1; x < coordinates.length; ++x) {
            if( coordinates[x].ishitchhikingspot && coordinates[x].ispartofaroute ) {
                waiting_time_total += coordinates[x].waitingtime;
                ++lifts;
            }
        }
        
        // get time in hours and minutes
        var waiting_time_total_hours = waiting_time_total / 60;
        waiting_time_total_hours = Math.floor(waiting_time_total_hours);
        var waiting_time_total_minutes = waiting_time_total - waiting_time_total_hours * 60;
        waiting_time_total_minutes = Math.floor(waiting_time_total_minutes);
        
        var coordinate_time_total = coordinates[coordinates.length - 1].starttime - coordinates[0].starttime;
        var coordinate_time_total_hours = coordinate_time_total / (60 * 60 );
        coordinate_time_total_hours = Math.floor(coordinate_time_total_hours);
        var coordinate_time_total_minutes = ( coordinate_time_total - coordinate_time_total_hours * 60 * 60 ) / ( 60 );
        coordinate_time_total_minutes = Math.floor(coordinate_time_total_minutes);
        
        return ' (Total: ' + lifts + ' lifts | ' + coordinate_time_total_hours + 'h ' + 
            coordinate_time_total_minutes + 'min | waited ' + waiting_time_total_hours +'h ' + 
            waiting_time_total_minutes + 'min)'; 
    }else {
        // get time in hours and minutes
        var waiting_time_total_hours = coordinate.waitingtime / 60;
        waiting_time_total_hours = Math.floor(waiting_time_total_hours);
        var waiting_time_total_minutes = coordinate.waitingtime - waiting_time_total_hours * 60;
        waiting_time_total_minutes = Math.floor(waiting_time_total_minutes);
        return ' (waiting time: ' + waiting_time_total_hours +'h ' + 
            waiting_time_total_minutes + 'min)';        
    }
}
 
/**************************************************************************************************
*   Utilities
*   
**************************************************************************************************/
mhs_tm_utilities.utilities = {}
       
mhs_tm_utilities.utilities.get_buttons = function( save_button ) {
    var html = '<span style="float:right;"> \n\
                <span class="mhs_tm_prim_button button mhs_tm_button_delete" style="margin-right:6px" >Delete!</span >';
    if( save_button !== false ) {
        html += '<span class="mhs_tm_prim_button button mhs_tm_button_save" style="margin-right:6px" id="mhs_tm_button_save_' + save_button + '">Save!</span >';
    }

    html += '</span>\n\
                </h3>';

    return html;
}

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
}

mhs_tm_utilities.utilities.stripslashes = function( str ) {
    return str.replace(/\\'/g,'\'').replace(/\"/g,'"').replace(/\\\\/g,'\\').replace(/\\0/g,'\0');
}
        
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
}

mhs_tm_utilities.utilities.sortResults = function( arr, key, asc ) {
    return arr.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if ( asc ) { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
        else { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
    });
}

// Function to get a timestamp in milliseconds - the local timezone offset
mhs_tm_utilities.utilities.get_timestamp_minus_timezone_offset = function( timestamp ) {
    return timestamp * 1000 + ( new Date().getTimezoneOffset() * 60 * 1000 );
}

// Function to get a timestamp in milliseconds + the local timezone offset
mhs_tm_utilities.utilities.get_timestamp_plus_timezone_offset = function( timestamp ) {
    return timestamp * 1000 - ( new Date().getTimezoneOffset() * 60 * 1000 );
}

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