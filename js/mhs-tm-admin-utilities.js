/**************************************************************************************************
*   Google Maps utilities
*   
**************************************************************************************************/

//snap path of coordinate array to road
function route_snap_to_road( coordinates, i, route_array, callback ) {

    if( i < coordinates.length - 1 ) {
        i++;
        //the gmaps direction service is async so use a callback
        //call thesame function again if the callback from gmaps occured
        //if you went through the whole coordinations array, call callback and pass over the result
        get_route(coordinates[i - 1], coordinates[i], route_array, function() {
            route_snap_to_road(coordinates, i, route_array, callback);
        } );
    } else {
          callback(route_array);
    }
}

//use direction service of gmaps to get coordinates of a route between 2 coordinates
function get_route(from, to, path, callback) {
    var service = new google.maps.DirectionsService();

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
        }
        callback();
    } );
}
 
/**************************************************************************************************
*   Utilities for coordinate handling and informations
*   
**************************************************************************************************/

function get_only_on_route_coordinates( coordinates ) {
    var coordinates_on_route = [];
    
    coordinates.forEach(function(item, index) {
        if( item['ispartofaroute'] ) {
            coordinates_on_route.push( item );
        }
    } );
    
    return coordinates_on_route
}

function get_contentstring_of_coordinate( coordinate, coordinates ) {
    
    var contentString = '<div class="map-message">' +
        '<p class="map-message-title"><b style="font-size: 120%;">';
    if ( coordinate.country )
    {
        contentString = contentString + coordinate.country;
    }
    if ( coordinate.state && coordinate.country )
    {
        contentString = contentString + ' - ' + coordinate.state;
    } else {
        contentString = contentString + coordinate.state;
    }
    if ( coordinate.city && coordinate.country || coordinate.city && coordinate.state )
    {
        contentString = contentString + ' - ' + coordinate.city;
    } else {
        contentString = contentString + coordinate.city;
    }
    var coordinate_date = new Date( get_timestamp_minus_timezone_offset( parseInt( coordinate.starttime ) ) )
        .toLocaleString();

    contentString = contentString + '</b> </br>' +
        // cut the last 3 chars because it's the seconds we won't display
        coordinate_date.slice(0, coordinate_date.length - 3) +
        get_coordinate_waiting_overview(coordinate, coordinates) +
        '</p> <hr>';

    if ( coordinate.note !== null && coordinate.note !== undefined ) {
        contentString = contentString + stripslashes( coordinate.note );
    }
    contentString = contentString +
        '</div>';

    return contentString;
}

function get_coordinate_waiting_overview( coordinate, coordinates ) {
    var lifts = 0;
    var waiting_time_total = 0;
    
    if( !coordinate.ishitchhikingspot || !coordinate.ispartofaroute ) {
        return '';
    }
    
    if( isEquivalent(coordinate, coordinates[coordinates.length - 1] ) ) {
        for( var x = 0; x < coordinates.length; ++x) {
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
        var coordinate_time_total_hours = coordinate_time_total / (60 * 60 * 1000);
        coordinate_time_total_hours = Math.floor(coordinate_time_total_hours);
        var coordinate_time_total_minutes = ( coordinate_time_total - coordinate_time_total_hours * 60 * 60 * 1000 ) / ( 60 * 1000 );
        coordinate_time_total_minutes = Math.floor(coordinate_time_total_minutes);
        
        return ' (Total: ' + lifts + ' lifts | ' + coordinate_time_total_hours + 'h ' + coordinate_time_total_minutes + 'min | waited ' + waiting_time_total_hours +'h ' + waiting_time_total_minutes + 'min)'; 
    }else {
        // get time in hours and minutes
        var waiting_time_total_hours = coordinate.waitingtime / 60;
        waiting_time_total_hours = Math.floor(waiting_time_total_hours);
        var waiting_time_total_minutes = coordinate.waitingtime - waiting_time_total_hours * 60;
        waiting_time_total_minutes = Math.floor(waiting_time_total_minutes);
        return ' (waiting time: ' + waiting_time_total_hours +'h ' + waiting_time_total_minutes + 'min)';        
    }
}
 
/**************************************************************************************************
*   Utilities
*   
**************************************************************************************************/

       
function get_buttons( save_button ) {
    var html = '<span style="float:right;"> \n\
                <span class="mhs_tm_prim_button button Button_Delete" style="margin-right:6px" >Delete!</span >';
    if( save_button !== false ) {
        html += '<span class="mhs_tm_prim_button button Button_Save" style="margin-right:6px" id="Button_Save_' + save_button + '">Save!</span >';
    }

    html += '</span>\n\
                </h3>';

    return html;
}

function isEquivalent( a, b ) {
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

function stripslashes( str ) {
    return str.replace(/\\'/g,'\'').replace(/\"/g,'"').replace(/\\\\/g,'\\').replace(/\\0/g,'\0');
}
        
function show_message( message_class, message ) {
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

function sortResults( arr, key, asc ) {
    return arr.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if ( asc ) { return ((x < y) ? -1 : ((x > y) ? 1 : 0)); }
        else { return ((x > y) ? -1 : ((x < y) ? 1 : 0)); }
    });
}

// Function to get a timestamp in milliseconds - the local timezone offset
function get_timestamp_minus_timezone_offset( timestamp ) {
    return timestamp + ( new Date().getTimezoneOffset() * 60 * 1000 );
}

// Function to get a timestamp in milliseconds + the local timezone offset
function get_timestamp_plus_timezone_offset( timestamp ) {
    return timestamp - ( new Date().getTimezoneOffset() * 60 * 1000 );
}

jQuery( function ( $ ) {
    $( document ).ready( function () {
        $( "#dialog_loading" ).dialog( {
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
} );