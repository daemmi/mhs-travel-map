jQuery( function ( $ ) {
    var coordinates = mhs_tm_app_vars.coordinates,
        coord_center_lat = parseFloat( mhs_tm_app_vars.coord_center_lat ),
        coord_center_lng = parseFloat( mhs_tm_app_vars.coord_center_lng ),
        auto_load = mhs_tm_app_vars.auto_load,
        ajax_url = mhs_tm_app_vars.ajax_url,
        map = [],
        bounds = [],
        map_canvas_id = 0,
        old_order,
        coordinate_index_global = 0,
        marker = [],
        route_path;
    
    marker[map_canvas_id] = [];

    $( '#mhs_tm_loading' ).css( "background-color", $( 'body' ).css( "background-color" ) );
    
    // Resize the window resize other stuff too
    $( window ).resize( function () {
        //change gmap window size
        mhs_tm_utilities.utilities.set_div_16_9( '#mhs_tm_map_canvas_' + map_canvas_id );
        // set dialog height min to 500px
        var height = 500;
        if( $( window ).height() * 0.9 > 500 ) {
            height = $( window ).height() * 0.9;
        }
        $( "#wp_editor_dialog_div" ).dialog( "option", {
            height: height,
            width: $( "#wrap_content" ).width(),
        } );
    } );

    if ( auto_load )
    {
        //set gmap window size
        mhs_tm_utilities.utilities.set_div_16_9( '#mhs_tm_map_canvas_' + map_canvas_id );
        google.maps.event.addDomListener( window, 'load', gmap_initialize );
    }

    // Add delete Button to each postbox
    if ( $( '.postbox_mhs_tm.coordinate_new' ).length > 0 ) {
        $( '.postbox_mhs_tm.coordinate_new > h1' ).append( mhs_tm_utilities.utilities.get_buttons( false ) );
    }

    if ( $( '.postbox_mhs_tm.coordinate' ).length > 0 ) {
        $( '.postbox_mhs_tm.coordinate > h1' ).append( mhs_tm_utilities.utilities.get_buttons( false ) );
    }

    $( '.mhs_tm_normal_sortables' ).accordion( {
        header: '> div > h1',
        collapsible: true,
        heightStyle: 'content',
        icons: {
            header: "ui-icon-plusthick",
            activeHeader: "ui-icon-minusthick"
        }
    } );

    $( '.mhs_tm_normal_sortables' ).sortable( {
        items: '.coordinate',
        axis: "y",
        handle: ".mhs-tm-sortable-handler",
        start: function ( event, ui ) {
            old_order = ui.item.index();
        },
        stop: function ( event, ui ) {
            var new_order = ui.item.index();

            if ( new_order != old_order ) {
                $( '.mhs_tm_normal_sortables' ).find( '.coordinate' ).each( function ( index ) {
                    var id = index + 1;
                    if ( id <= Math.max( new_order, old_order ) && id >= Math.min( new_order, old_order ) ) {
                        change_coordinate_id( $( this ), id );
                    }
                } );
                // change the marker position in the marker array
                if ( new_order > old_order ) {
                    // swap from bottom to top                       
                    for ( id = old_order; id < new_order; id++ ) {
                        swap_marker_coordinates( id, id + 1 );
                    }
                } else {
                    // swap from top to bottom
                    for ( id = old_order; id > new_order; id-- ) {
                        swap_marker_coordinates( id, id - 1 );
                    }
                }
            }
        }
    } );

    $( '.mhs_tm_normal_sortables div' ).disableSelection();
    
    $( '.mhs_tm_datetimepicker' ).datetimepicker( {
        step: 10
    } );

    $( '.coordinate_new input' ).focusout( function ( event ) {
        focusout_input( $( this ) );
    } );

    $( '.coordinate input' ).focusout( function ( event ) {
        focusout_input( $( this ) );
    } );

    $( ".mhs_tm_admin_form_submit" ).on( 'click', $( this ), function () {
        var coordinates_on_route = mhs_tm_utilities.coordinate_handling.get_only_on_route_coordinates( coordinates[map_canvas_id]['coordinates'] );
        var path = [];
        
        if ( $( "#name" ).val() ) {
            $( "#mhs_tm_dialog_loading" ).dialog( "open" );
            
            // snap the route to the roads via gmaps directions
            mhs_tm_utilities.gmaps.route_snap_to_road(coordinates_on_route, 0, path, $( "#dis_route_snap_to_road" ).is(':checked'), function(path) {
                save_route( path );
            } );
        } else {
            mhs_tm_utilities.utilities.show_message( 'error', 'Please enter a name at least!' );
        }
    } );

    $( "#wp_editor_dialog_div" ).dialog( {
        autoOpen: false,
        position: { my: "center null", at: "center null", of: "#wrap_content" },
        buttons: {
            'Close': function () {
                $( this ).dialog( "close" );
            }
        },
        close: function ( event, ui ) {
            //check if tinyMCE is active!
            var tinyMCE_active = (typeof tinyMCE != "undefined") && tinyMCE.activeEditor && 
                !tinyMCE.activeEditor.isHidden();
           
            if ( tinyMCE_active ) {
                // Ok, the active tab is Visual, get the content from tinyMCE
                coordinates[map_canvas_id]['coordinates'][coordinate_index_global]['note'] = tinyMCE.activeEditor.getContent();
                $( "#note_" + ( coordinate_index_global + 1 ) ).html( tinyMCE.activeEditor.getContent() );
            } else {
                // The active tab is HTML, get the content from the textarea
                coordinates[map_canvas_id]['coordinates'][coordinate_index_global]['note'] = $('#wp_editor_dialog').val();
                $( "#note_" + ( coordinate_index_global + 1 ) ).html( $('#wp_editor_dialog').val() );
            }
            var contentString = mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate( coordinates[map_canvas_id]['coordinates'][coordinate_index_global], coordinates[map_canvas_id]['coordinates'] );
            marker[map_canvas_id][coordinate_index_global].infowindow.setContent( contentString );
//            bind_info_window( marker[map_canvas_id][coordinate_index_global], marker[map_canvas_id],
//                map[map_canvas_id], contentString );
        },
        open: function ( event, ui ) {
            // set dialog height min to 500px
            var height = 500;
            if( $( window ).height() * 0.9 > 500 ) {
                height = $( window ).height() * 0.9;
            }
            $( this ).dialog( "option", {
                height: height,
                width: $( "#wrap_content" ).width(),
            } );
        }
    } );

    $( '.html_div' ).on( 'click', $( this ), function () {
        coordinate_index_global = parseInt( $( this ).attr( 'id' ).replace( 'note' + '_', '' ) - 1 );
        $( "#wp_editor_dialog_div" ).dialog( "open" );
        var div = $( this );
        setTimeout( function () {
            //tinyMCE is just active if the wp-editor loads the visual tab and not the text tab
            if ( tinyMCE.activeEditor ) {
                // Ok, the active tab is Visual
                $( '#wp_editor_dialog_ifr' ).css( 'height', $( "#wp_editor_dialog_div" ).height() * 0.7 );
                tinyMCE.activeEditor.setContent( div.html() );
            } else {
                // The active tab is HTML, so just query the textarea
                $( '#wp_editor_dialog' ).css( 'height', $( "#wp_editor_dialog_div" ).height() * 0.7 );
                $( '#wp_editor_dialog' ).val( div.html() );
            }
        }, 50 );
    } );

    $( ".postbox_mhs_tm" ).on( 'click', '.mhs_tm_button_delete', function () {

        var new_order2 = $( '.mhs_tm_normal_sortables .coordinate' ).length;
        var old_order2 = $( this ).parent().parent().parent().index();
        $( this ).parent().parent().parent().remove();

        $( '.mhs_tm_normal_sortables' ).find( '.coordinate' ).each( function ( index ) {
            var id = index + 1;

            if ( id <= Math.max( new_order2, old_order2 ) && id >= Math.min( new_order2, old_order2 ) ) {
                change_coordinate_id( $( this ), id );
            }
        } );

        // remove marker from map
        marker[map_canvas_id][old_order2 - 1].setMap( null );
        // swap from bottom to top                       
        for ( id = old_order2; id < new_order2; id++ ) {
            swap_marker_coordinates( id, id + 1 );
        }
        // remove marker from array
        marker[map_canvas_id].splice( new_order2 - 1, 1 );
        coordinates[map_canvas_id]['coordinates'].splice( new_order2 - 1, 1 );
    } );

    $( "#mhs_tm_calc_path" ).on( 'click', $( this ), function () {
        var coordinates_on_route = mhs_tm_utilities.coordinate_handling.get_only_on_route_coordinates( coordinates[map_canvas_id]['coordinates'] );
        var path = [];
        
        $( "#mhs_tm_dialog_loading" ).dialog( "open" );
        // snap the route to the roads via gmaps directions
        mhs_tm_utilities.gmaps.route_snap_to_road(coordinates_on_route, 0, path, $( "#dis_route_snap_to_road" ).is(':checked'), function(path) {
            //update route path
            route_path.setPath(path); 
            route_path.setOptions( { strokeColor: $( "#route_color" ).val() } );
            
            // make the content string for the gmap info window
            for( var x = 0; x < marker[map_canvas_id].length; x++ ) {
                var contentString = mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate( coordinates[map_canvas_id]['coordinates'][x], coordinates[map_canvas_id]['coordinates'] );
                marker[map_canvas_id][x].infowindow.setContent( contentString );
//                bind_info_window( marker[map_canvas_id][x], marker[map_canvas_id],
//                    map[map_canvas_id], contentString );
            }

            $( "#mhs_tm_dialog_loading" ).dialog( "close" );
        } );
    } );

    $( "#mhs_tm_update_location_name_all" ).on( 'click', $( this ), function () {
        var coordinate_id      = 0;
        var last_coordinate_id = $('.coordinate').length - 1;
        $( "#mhs_tm_dialog_loading" ).dialog( "open" );
        get_geocoded_coordinate(coordinate_id, last_coordinate_id );
    } );

    $( ".mhs_tm_update_location_name_coordinate" ).on( 'click', $( this ), function () {
        var element  = $( this ).parent().parent().find('input');
        var input_id = element.attr( 'id' ).substr( 0, element.attr( 'id' ).search( '_' ) );
        var coordinate_index = parseInt( element.attr( 'id' ).replace( input_id + '_', '' ) - 1 );
        $( "#mhs_tm_dialog_loading" ).dialog( "open" );
        get_geocoded_coordinate(coordinate_index, coordinate_index );
    } );
    
    $( ".mhs_tm_update_location_name" ).on( 'click', $( this ), function () { 
        var element  = $( this ).parent().parent().find('input');
        var input_id = element.attr( 'id' ).substr( 0, element.attr( 'id' ).search( '_' ) );
        var coordinate_index = parseInt( element.attr( 'id' ).replace( input_id + '_', '' ) - 1 );
        
        mhs_tm_utilities.gmaps.geocode_lat_lng( coordinates[map_canvas_id]['coordinates'][coordinate_index]['latitude'], 
        coordinates[map_canvas_id]['coordinates'][coordinate_index]['longitude'], input_id, function ( result_geocode ) {
            if( result_geocode !== false ) {
                element.val( result_geocode );
                focusout_input( element );
            } else {
                element.val( '' );
                focusout_input( element );                                   
            }
        } );
    } );
    
    function save_route(path) {
        $.post( 
            ajax_url + '?action=routes_save&id=' + getUrlParameter( 'id' ),
            { 
                name: $( "#name" ).val(),
                route_color: $( "#route_color" ).val(),
                dis_route_snap_to_road: $( "#dis_route_snap_to_road" ).is(':checked') ? 1 : 0,
                route: JSON.stringify( coordinates[map_canvas_id]['coordinates'] ),
                path: JSON.stringify(path),
                mhs_tm_route_save_nonce: $( '#mhs_tm_route_save_' + getUrlParameter( 'id' ) + '_nonce' ).val(),
            },
            function ( response ) {
                //update route path
                route_path.setPath(path); 
                route_path.setOptions( { strokeColor: $( "#route_color" ).val() } );
            
                // make the content string for the gmap info window
                for( var x = 0; x < marker[map_canvas_id].length; x++ ) {
                    var contentString = mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate( coordinates[map_canvas_id]['coordinates'][x], coordinates[map_canvas_id]['coordinates'] );
                    marker[map_canvas_id][x].infowindow.setContent( contentString );
//                    bind_info_window( marker[map_canvas_id][x], marker[map_canvas_id],
//                        map[map_canvas_id], contentString );
                }

                $( ".admin_title_mhs_tm h1" ).html( 'Edit "' + $( "#name" ).val() + '"' );
                $( "#mhs_tm_dialog_loading" ).dialog( "close" );
                mhs_tm_utilities.utilities.show_message( response.type, response.message );
            },
            "json"
        );
    }

    function focusout_input( element ) {
        var input_id = element.attr( 'id' ).substr( 0, element.attr( 'id' ).search( '_' ) );
        var coordinate_index = parseInt( element.attr( 'id' ).replace( input_id + '_', '' ) - 1 );

        // Set the Pin so as it was bevor the changes
        var pin_color = '|7f7f7f|ffffff';
        if ( !coordinates[map_canvas_id]['coordinates'][coordinate_index]['ispartofaroute'] ) {
            pin_color = '|000000|ffffff';
        }

        var pin_shape = 'd_map_pin_letter&chld=';
        var pin_star_color = '';
        if ( !coordinates[map_canvas_id]['coordinates'][coordinate_index]['ishitchhikingspot'] ) {
            pin_shape = 'd_map_xpin_letter&chld=pin_star|';
            pin_star_color = '|ffffff';
        }

        // get the new value of the input and change the Pin again
        if ( input_id == 'starttime' ) {
            coordinates[map_canvas_id]['coordinates'][coordinate_index][input_id] =
                Math.round( mhs_tm_utilities.utilities.get_timestamp_plus_timezone_offset( new Date( element.val() ).getTime() / 1000 ) );
        } else if ( input_id == 'ispartofaroute' ) {
            if ( element.is( ':checked' ) ) {
                coordinates[map_canvas_id]['coordinates'][coordinate_index][input_id] = 1;
                pin_color = '|7f7f7f|ffffff';
            } else {
                coordinates[map_canvas_id]['coordinates'][coordinate_index][input_id] = 0;
                pin_color = '|000000|ffffff';
            }
        } else if ( input_id == 'ishitchhikingspot' ) {
            if ( element.is( ':checked' ) ) {
                coordinates[map_canvas_id]['coordinates'][coordinate_index][input_id] = 1;
                pin_shape = 'd_map_pin_letter&chld=';
            } else {
                coordinates[map_canvas_id]['coordinates'][coordinate_index][input_id] = 0;
                pin_shape = 'd_map_xpin_letter&chld=pin_star|';
                pin_star_color = '|ffffff';
            }
        } else if ( input_id == 'dissnaptoroad' ) {
            if ( element.is( ':checked' ) ) {
                coordinates[map_canvas_id]['coordinates'][coordinate_index][input_id] = 1;
            } else {
                coordinates[map_canvas_id]['coordinates'][coordinate_index][input_id] = 0;
            }
        } else {
            coordinates[map_canvas_id]['coordinates'][coordinate_index][input_id] = element.val();
        }

        var pin = pin_shape + ( coordinate_index + 1 ) + pin_color + pin_star_color;

        var pinIcon = new google.maps.MarkerImage(
            'https://chart.apis.google.com/chart?chst=' + pin,
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            null, /* anchor is bottom center of the scaled image */
            // new google.maps.Size(30, 30)
            null
            );

        marker[map_canvas_id][coordinate_index].setIcon( pinIcon );

        // make the content string for all gmap info window
        for( var x = 0; x < coordinates[map_canvas_id]['coordinates'].length; x++ ) {
            var contentString = mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate(
                coordinates[map_canvas_id]['coordinates'][x],
                coordinates[map_canvas_id]['coordinates'] );

            marker[map_canvas_id][x].infowindow.setContent( contentString );
            
//            bind_info_window( marker[map_canvas_id][x], marker[map_canvas_id],
//                map[map_canvas_id], contentString );
        }

        // set the  gmap marker to the new location
        if ( input_id == 'latitude' || input_id == 'longitude' ) {
            marker[map_canvas_id][coordinate_index].setPosition( {
                lat: parseFloat( coordinates[map_canvas_id]['coordinates'][coordinate_index]['latitude'] ),
                lng: parseFloat( coordinates[map_canvas_id]['coordinates'][coordinate_index]['longitude'] )
            } );
        }
    }

    function swap_marker_coordinates( old_order, new_order ) {
        // swap the coordinates in marker array
        var marker_buff = marker[map_canvas_id][new_order - 1];
        marker[map_canvas_id][new_order - 1] = marker[map_canvas_id][old_order - 1];
        marker[map_canvas_id][old_order - 1] = marker_buff;

        // swap the coordinates in coordinates array
        var marker_buff = coordinates[map_canvas_id]['coordinates'][new_order - 1];
        coordinates[map_canvas_id]['coordinates'][new_order - 1] = coordinates[map_canvas_id]['coordinates'][old_order - 1];
        coordinates[map_canvas_id]['coordinates'][old_order - 1] = marker_buff;

        // change the icon number
        // new coordinate
        var pinIcon = get_marker_icon( coordinates[map_canvas_id]['coordinates'][new_order - 1], new_order );

        marker[map_canvas_id][new_order - 1].setIcon( pinIcon );

        // old coordinate
        pinIcon = get_marker_icon( coordinates[map_canvas_id]['coordinates'][old_order - 1], old_order );

        marker[map_canvas_id][old_order - 1].setIcon( pinIcon );
    }

    function getUrlParameter( sParam ) {
        var sPageURL = decodeURIComponent( window.location.search.substring( 1 ) ),
            sURLVariables = sPageURL.split( '&' ),
            sParameterName,
            i;

        for ( i = 0; i < sURLVariables.length; i++ ) {
            sParameterName = sURLVariables[i].split( '=' );

            if ( sParameterName[0] === sParam ) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    }

    function gmap_initialize() {
        var mapOptions = {
            center: { lat: coord_center_lat, lng: coord_center_lng },
            zoom: 5,
            fullscreenControl: true
        };
        map[map_canvas_id] = new google.maps.Map( document.getElementById( 'mhs_tm_map_canvas_' + map_canvas_id ), mapOptions );

        // Event listener fires if map is loaded and hide the loaing overlay
        google.maps.event.addListenerOnce( map[map_canvas_id], 'idle', function () {
            // do something only the first time the map is loaded
            $( '#mhs_tm_loading' ).slideUp( 1500 );
            //show the form with the coordinates
            $( '#mhs_tm-form ' ).show();
            //enable sortable, otherwise touch punch doesnt work with sortable
            $('.mhs_tm_normal_sortables').sortable('enable');
        } );
        
        // Event listener fires after a resize of the window
        google.maps.event.addDomListener(window, 'resize', function() {
            map[map_canvas_id].fitBounds( bounds[map_canvas_id] );
            map[map_canvas_id].panToBounds( bounds[map_canvas_id] );
        });

        // If new Route, coordinates are NULL and first Pin is 1);
        if ( coordinates[0]['coordinates'] > 0 ) {
            var pin_drawing = 'd_map_xpin_letter&chld=pin_star|' + ( coordinates[0]['coordinates'].length + 1 ) + '|000000|ffffff|ffffff';
        } else {
            var pin_drawing = 'd_map_xpin_letter&chld=pin_star|' + ( 1 ) + '|000000|ffffff|ffffff';
        }

        var pinIcon_drawing = new google.maps.MarkerImage(
            'https://chart.apis.google.com/chart?chst=' + pin_drawing,
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            null, /* anchor is bottom center of the scaled image */
            // new google.maps.Size(30, 30)
            null
            );

        var drawingManager = new google.maps.drawing.DrawingManager( {
            drawingMode: null,
            drawingControl: true,
            drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [ 'marker' ]
            },
            markerOptions: {
                icon: pinIcon_drawing,
                draggable: true
            }
        } );

        drawingManager.setMap( map[map_canvas_id] );

        google.maps.event.addListener( drawingManager, 'overlaycomplete', function ( event ) {
            if ( event.type == 'marker' ) {
                $( "#mhs_tm_dialog_loading" ).dialog( "open" );

                // Add new coordinate in coordinate array
                if ( coordinates[0]['coordinates'].length > 0 ) {

                    add_coordinate( event.overlay.getPosition().lat(),
                        event.overlay.getPosition().lng(), false );
                } else {
                    //  Its the first coordinate                        
                    add_coordinate( event.overlay.getPosition().lat(),
                        event.overlay.getPosition().lng(), true );
                }

                // Add new Marker to Marker array
                marker[map_canvas_id].push( event.overlay );
                //Set options
                marker[map_canvas_id][marker[map_canvas_id].length - 1].setOptions( {
                    id: marker[map_canvas_id].length - 1,
                    draggable: true
                } );

                // Set Info Window of new Marker
                marker[map_canvas_id][marker[map_canvas_id].length - 1].infowindow = new google.maps.InfoWindow( {
                    content: ''
                } );
                var contentString = mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate( 
                    coordinates[0]['coordinates'][coordinates[0]['coordinates'].length - 1], 
                coordinates[0]['coordinates'] );
                
                //bind event handler for info window
                bind_info_window( marker[map_canvas_id][marker[map_canvas_id].length - 1], 
                marker[map_canvas_id], map[map_canvas_id], contentString );
                //set content of info window
                marker[map_canvas_id][marker[map_canvas_id].length - 1].infowindow.setContent( contentString );

                add_dragend_listener( event.overlay );
                //create the Pin Icon
                pin = 'd_map_xpin_letter&chld=pin_star|' + ( coordinates[0]['coordinates'].length ) + '|000000|ffffff|ffffff';

                var pinIcon = new google.maps.MarkerImage(
                    'https://chart.apis.google.com/chart?chst=' + pin,
                    null, /* size is determined at runtime */
                    null, /* origin is 0,0 */
                    null, /* anchor is bottom center of the scaled image */
                    // new google.maps.Size(30, 30)
                    null
                    );

                //set the Icon to marker
                marker[map_canvas_id][marker[map_canvas_id].length - 1].setIcon( pinIcon );
                
                //set the geocode of the new coordinate
                get_geocoded_coordinate( coordinates[0]['coordinates'].length - 1, 
                coordinates[0]['coordinates'].length - 1 );
            }
        } );

        bounds[map_canvas_id] = new google.maps.LatLngBounds();
        var mark_counter = 0;
 
        if ( coordinates.length > 0 ) {
            for ( var i = 0; i < coordinates.length; ++i ) {
                for ( var j = 0; j < coordinates[i]['coordinates'].length; ++j ) {
                    var lat = parseFloat( coordinates[i]['coordinates'][j].latitude );
                    var lng = parseFloat( coordinates[i]['coordinates'][j].longitude );
                    if ( isNaN( lat ) || isNaN( lng ) ) {
                        break;
                    }

                    var myLatlng = new google.maps.LatLng( lat, lng );

                    bounds[map_canvas_id].extend( myLatlng );

                    var pinIcon = get_marker_icon( coordinates[i]['coordinates'][j], ( j + 1 ) );

                    var contentString = mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate( coordinates[i]['coordinates'][j], coordinates[i]['coordinates'] );

                    marker[map_canvas_id][mark_counter] = new google.maps.Marker( {
                        position: myLatlng,
                        map: map[map_canvas_id],
                        title: coordinates[i]['coordinates'][0].name,
                        id: mark_counter,
                        icon: pinIcon,
                        draggable: true
                    } );

                    add_dragend_listener( marker[map_canvas_id][mark_counter] );

                    marker[map_canvas_id][mark_counter].infowindow = new google.maps.InfoWindow( {
                        // content: contentString
                        content: ''
                    } );

                    map[map_canvas_id].fitBounds( bounds[map_canvas_id] );
                    map[map_canvas_id].panToBounds( bounds[map_canvas_id] );
                    //bind event handler for info window
                    bind_info_window( marker[map_canvas_id][mark_counter], marker[map_canvas_id], map[map_canvas_id], contentString );
                    //set content of info window
                    marker[map_canvas_id][mark_counter].infowindow.setContent( contentString );
                    
                    mark_counter++;
                }
        
                var lines = [];
                coordinates[i]['options']['path'].forEach(function(item, index) {
                    lines.push( new google.maps.LatLng( item['lat'], item['lng'] ) );
                } );

                route_path = new google.maps.Polyline( {
                    path: lines,
                    geodesic: true,
                    strokeColor: coordinates[i]['options']['route_color'],
                    strokeOpacity: 1.0,
                    strokeWeight: 3
                } );

                route_path.setMap(map[map_canvas_id]);
            }
        }
    }

    function add_dragend_listener( marker ) {
        google.maps.event.addListener( marker, 'dragend', function ( event ) {
            $( "#mhs_tm_dialog_loading" ).dialog( "open" );
            $( '#latitude_' + ( marker.id + 1 ) ).val( marker.getPosition().lat() );
            $( '#longitude_' + ( marker.id + 1 ) ).val( marker.getPosition().lng() );

            coordinates[map_canvas_id]['coordinates'][marker.id]['latitude'] = marker.getPosition().lat();
            coordinates[map_canvas_id]['coordinates'][marker.id]['longitude'] = marker.getPosition().lng();
                
            //set the geocode of the moved coordinate
            get_geocoded_coordinate( marker.id, marker.id );

        } );
    }

    function add_coordinate( lat, lng, first_coordinate ) {
        if ( first_coordinate ) {
            coordinates = [ ];
            coordinates[0] = [ ];
            coordinates[0]['coordinates'] = [ ];
            coordinates[0]['coordinates'][0] = {
                latitude: lat,
                longitude: lng
            };

            var coordinate_id = 1;
            var new_coordinate = $( '.mhs_tm_normal_sortables' ).find( '.coordinate_new' ).clone( true );
            new_coordinate.removeAttr( 'style' ).removeClass( 'coordinate_new' ).addClass( 'coordinate' );
        } else {
            // Make a copy of the object without any references 
            coordinates[0]['coordinates'][coordinates[0]['coordinates'].length] = jQuery.extend( true, { }, coordinates[0]['coordinates'][0] );
            coordinates[0]['coordinates'][coordinates[0]['coordinates'].length - 1] = {
                latitude: lat,
                longitude: lng
            };

            var coordinate_id = $( '.mhs_tm_normal_sortables' ).find( '.coordinate' ).length + 1;
            var new_coordinate = $( '.mhs_tm_normal_sortables' ).find( '.coordinate_new' ).clone( true );
            new_coordinate.removeAttr( 'style' ).removeClass( 'coordinate_new' ).addClass( 'coordinate' );
        }

        new_coordinate.find( '.mhs_tm_datetimepicker' ).datetimepicker( 'destroy' );

        change_coordinate_id( new_coordinate, coordinate_id );

        new_coordinate.find( 'input' ).each( function () {
            $( this ).val( null );
            $( this ).removeAttr( 'value' );
            var input_id = $( this ).attr( 'id' ).substr( 0, $( this ).attr( 'id' ).search( '_' ) );
            coordinates[0]['coordinates'][coordinate_id - 1][input_id] = '';
        } );

        new_coordinate.find( '.html_div' ).each( function () {
            $( this ).html( null );
            var input_id = $( this ).attr( 'id' ).substr( 0, $( this ).attr( 'id' ).search( '_' ) );
            coordinates[0]['coordinates'][coordinate_id - 1][input_id] = '';
        } );

        $( '.mhs_tm_normal_sortables' ).append( new_coordinate );

        $( '.mhs_tm_normal_sortables' ).accordion( 'refresh' );

        $( '#latitude_' + coordinate_id ).val( lat );
        coordinates[0]['coordinates'][coordinate_id - 1]['latitude'] = lat;
        $( '#longitude_' + coordinate_id ).val( lng );
        coordinates[0]['coordinates'][coordinate_id - 1]['longitude'] = lng;

        $( '.mhs_tm_datetimepicker' ).datetimepicker( {
            step: 10,
            value: new Date()
        } );
        
        coordinates[0]['coordinates'][coordinate_id - 1]['starttime'] = 
            Math.round( mhs_tm_utilities.utilities.get_timestamp_plus_timezone_offset(
                new Date().getTime() / 1000 ) );
    }

    function bind_info_window( marker, marker_all, map, contentString ) {
        google.maps.event.addListener( marker, 'click', function () {

            for ( index = 0; index < marker_all.length; ++index ) {
                marker_all[index].infowindow.close();
            }
            
            marker.infowindow.open( map, marker );
        } );
    }

    function change_coordinate_id( coordinate, new_id ) {
        coordinate.find( 'tr' ).each( function ( index ) {
            $( this ).attr( 'id', $( this ).attr( 'id' ).substr( 0, $( this ).attr( 'id' ).search( '_' ) + 1 ) + new_id );

            $( this ).find( 'label' ).attr( 'for', $( this ).find( 'label' ).attr( 'for' ).substr( 0, $( this ).find( 'label' ).attr( 'for' ).search( '_' ) + 1 ) + new_id );

            var attr = $( this ).find( 'input' ).attr( 'name' );
            if ( $( this ).find( 'input' ).length !== 0 ) {
                if ( typeof attr !== typeof undefined && attr !== false ) {
                    $( this ).find( 'input' ).attr( 'name', $( this ).find( 'input' ).attr( 'name' ).substr( 0, $( this ).find( 'input' ).attr( 'name' ).search( '_' ) + 1 ) + new_id );
                }
                $( this ).find( 'input' ).attr( 'id', $( this ).find( 'input' ).attr( 'id' ).substr( 0, $( this ).find( 'input' ).attr( 'id' ).search( '_' ) + 1 ) + new_id );
            }

            if ( $( this ).find( 'div' ).length !== 0 ) {
                $( this ).find( 'div' ).attr( 'id', $( this ).find( 'div' ).attr( 'id' ).substr( 0, $( this ).find( 'div' ).attr( 'id' ).search( '_' ) + 1 ) + new_id );
                $( this ).find( 'div' ).attr( 'name', $( this ).find( 'div' ).attr( 'name' ).substr( 0, $( this ).find( 'div' ).attr( 'name' ).search( '_' ) + 1 ) + new_id );
            }

        } );
        // change coordinate header name
        coordinate.find( 'h1 > span.postbox_title' ).text( 'Coordinate ' + new_id );
    }
    
    function get_geocoded_coordinate( coordinate_id, last_coordinate_id ) {
        var element_id = coordinate_id + 1;
        //get geocode for all 3 parts of one coordinate
        mhs_tm_utilities.gmaps.geocode_lat_lng(
            coordinates[map_canvas_id]['coordinates'][coordinate_id]['latitude'],
            coordinates[map_canvas_id]['coordinates'][coordinate_id]['longitude'],
            'country', function ( result_geocode ) {                
                if ( result_geocode !== false ) {
                    $( '#country_' + element_id ).val( result_geocode );
                    focusout_input( $( '#country_' + element_id ) );
                } else {
                    $( '#country_' + element_id ).val( '' );
                    focusout_input( $( '#country_' + element_id ) );                                    
                }
                
                mhs_tm_utilities.gmaps.geocode_lat_lng(
                    coordinates[map_canvas_id]['coordinates'][coordinate_id]['latitude'],
                    coordinates[map_canvas_id]['coordinates'][coordinate_id]['longitude'],
                    'state', function ( result_geocode ) {
                        if ( result_geocode !== false ) {
                            $( '#state_' + element_id ).val( result_geocode );
                            focusout_input( $( '#state_' + element_id ) );
                        } else {
                            $( '#state_' + element_id ).val( '' );
                            focusout_input( $( '#state_' + element_id ) );                                    
                        }
                        
                        mhs_tm_utilities.gmaps.geocode_lat_lng(
                            coordinates[map_canvas_id]['coordinates'][coordinate_id]['latitude'],
                            coordinates[map_canvas_id]['coordinates'][coordinate_id]['longitude'],
                            'city', function ( result_geocode ) {
                                if ( result_geocode !== false ) {
                                    $( '#city_' + element_id ).val( result_geocode );
                                    focusout_input( $( '#city_' + element_id ) );
                                } else {
                                    $( '#city_' + element_id ).val( '' );
                                    focusout_input( $( '#city_' + element_id ) );                                    
                                }
                                //if not the last coordinate call function again
                                if ( coordinate_id !== last_coordinate_id ) {
                                    coordinate_id++;
                                    get_geocoded_coordinate( coordinate_id, last_coordinate_id );
                                } else {
                                    //if last close loading window
                                    $( "#mhs_tm_dialog_loading" ).dialog( "close" );
                                }
                            } );
                    } );
            } );
    }

    function get_marker_icon( coordinate, number ) {
        var pin_color = '|7f7f7f|ffffff';
        if ( !coordinate.ispartofaroute ) {
            pin_color = '|000000|ffffff';
        }
        var pin_shape = 'd_map_pin_letter&chld=';
        var pin_star_color = '';
        if ( !coordinate.ishitchhikingspot ) {
            pin_shape = 'd_map_xpin_letter&chld=pin_star|';
            var pin_star_color = '|ffffff';
        }

        var pin = pin_shape + ( number ) + pin_color + pin_star_color;

        var pinIcon = new google.maps.MarkerImage(
            'https://chart.apis.google.com/chart?chst=' + pin,
            null, /* size is determined at runtime */
            null, /* origin is 0,0 */
            null, /* anchor is bottom center of the scaled image */
            // new google.maps.Size(30, 30)
            null
            );

        return pinIcon;
    }
} );
