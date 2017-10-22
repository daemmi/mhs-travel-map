jQuery( function ( $ ) {
    var coordinates = mhs_tm_app_vars.coordinates;
    var coord_center_lat = parseFloat( mhs_tm_app_vars.coord_center_lat );
    var coord_center_lng = parseFloat( mhs_tm_app_vars.coord_center_lng );
    var auto_load = mhs_tm_app_vars.auto_load;
    var map = [ ];
    var bounds = [ ];
    var map_canvas_id = 0;
    var old_order;
    var coordinate_index_global = 0;
    var marker = new Array();
    marker[map_canvas_id] = new Array();

    var dummyPath = [
        new google.maps.LatLng( 0, 0 ),
        new google.maps.LatLng( 0, 0 )
    ];

    var linePath = [ ];
    linePath[map_canvas_id] = new google.maps.Polyline( {
        path: dummyPath,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 1.0,
        strokeWeight: 3
    } );

    // 
    $( '#loading ' ).css( "background-color", $( 'body' ).css( "background-color" ) );

    $( document ).ready( function () {

        // Resize the window resize other  stuff too
        $( window ).resize( function () {
            $( "#wp_editor_dialog_div" ).dialog( "option", {
                height: ( $( window ).height() * 0.9 ),
                width: $( "#wrap_content" ).width()
            } );
        } );

        if ( auto_load )
        {
            google.maps.event.addDomListener( window, 'load', gmap_initialize );
        }

        if ( $( '.coordinate_new' ).length > 0 ) {
            $( '.coordinate_new h2' ).append( get_buttons( false ) );
        }

        if ( $( '.coordinate' ).length > 0 ) {
            $( '.coordinate h2' ).append( get_buttons( false ) );
        }

        $( '#normal-sortables' ).accordion( {
            header: '> div > h2',
            collapsible: true,
            heightStyle: 'content'
        } );

        $( '#normal-sortables' ).sortable( {
            items: '.coordinate',
            start: function ( event, ui ) {
                old_order = ui.item.index() - 1;
            },
            stop: function ( event, ui ) {
                var new_order = ui.item.index() - 1;

                if ( new_order != old_order ) {
                    $( '#normal-sortables' ).find( '.coordinate' ).each( function ( index ) {
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

        $( '#normal-sortables div' ).disableSelection();

        $( '.datetimepicker' ).datetimepicker( {
            step: 10
        } );

        $( '.coordinate_new input' ).focusout( function ( event ) {
            focusout_input( $( this ) );
        } );

        $( '.coordinate input' ).focusout( function ( event ) {
            focusout_input( $( this ) );
        } );

        $( "#submit" ).on( 'click', $( this ), function () {
            var coordinates_on_route = get_only_on_route_coordinates( coordinates[map_canvas_id]['coordinates'] );
            
            if ( getUrlParameter( 'id' ) !== undefined ) {
                if ( $( "#name" ).val() ) {
                    $( "#dialog_loading" ).dialog( "open" );
                    var path = [];
                    
                    // snap the route to the roads via gmaps directions
                    route_snap_to_road(coordinates_on_route, 0, path, function(path) {
                        
                        $.post( window.location.pathname + '?page=MHS_TM-routes&js=ja&todo=save&id=' +
                        getUrlParameter( 'id' ),
                        { 
                            name: $( "#name" ).val(),
                            route: JSON.stringify( coordinates[map_canvas_id]['coordinates'] ),
                            todo_check: 'check',
                            path: JSON.stringify(path),
                        } )
                        .done( function () {
                            $( "#dialog_loading" ).dialog( "close" );
                            show_message( 'updated', 'Route has been saved!' );
                        } );
                    });
                } else {
                    show_message( 'error', 'Please enter a name at least!' );
                }
            } else {
                if ( $( "#name" ).val() ) {
                    $( "#dialog_loading" ).dialog( "open" );
                    
                    // snap the route to the roads via gmaps directions
                    route_snap_to_road(coordinates_on_route, 0, path, function(path) {
                        
                        $.post( window.location.pathname + '?page=MHS_TM-routes&js=ja&todo=save',
                            { 
                                name: $( "#name" ).val(),
                                route: JSON.stringify( coordinates[map_canvas_id]['coordinates'] ),
                                todo_check: 'check' ,
                                path: JSON.stringify(path),
                            } )
                            .done( function () {
                                $( "#dialog_loading" ).dialog( "close" );
                                show_message( 'updated', 'Route has been saved!' );
                            } );
                        } );
                } else {
                    show_message( 'error', 'Please enter a name at least!' );
                }
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
                coordinates[map_canvas_id]['coordinates'][coordinate_index_global]['note'] = tinyMCE.activeEditor.getContent();
                var contentString = get_contentstring_of_coordinate( coordinates[map_canvas_id]['coordinates'][coordinate_index_global], coordinates[map_canvas_id]['coordinates'] );
                marker[map_canvas_id][coordinate_index_global].infowindow.setContent( contentString );
                bindInfoWindow( marker[map_canvas_id][coordinate_index_global], marker[map_canvas_id],
                    map[map_canvas_id], contentString );
                $( "#note_" + ( coordinate_index_global + 1 ) ).html( tinyMCE.activeEditor.getContent() );
            },
            open: function ( event, ui ) {
                $( this ).dialog( "option", {
                    height: ( $( window ).height() * 0.9 ),
                    width: $( "#wrap_content" ).width()
                } );
            }
        } );

        $( '.html_div' ).on( 'click', $( this ), function () {
            coordinate_index_global = parseInt( $( this ).attr( 'id' ).replace( 'note' + '_', '' ) - 1 );

            $( "#wp_editor_dialog_div" ).dialog( "open" );
            $( '#wp_editor_dialog_ifr' ).css( 'height', $( "#wp_editor_dialog_div" ).height() * 0.7 );
            tinyMCE.activeEditor.setContent( $( this ).html() );
        } );

        $( '.note_edit' ).on( 'click', $( this ), function () {
            coordinate_index_global = parseInt( $( this ).parent().parent().find( 'div' ).attr( 'id' ).replace( 'note' + '_', '' ) - 1 );

            $( "#wp_editor_dialog_div" ).dialog( "open" );
            $( '#wp_editor_dialog_ifr' ).css( 'height', $( "#wp_editor_dialog_div" ).height() * 0.7 );
            tinyMCE.activeEditor.setContent( $( this ).parent().parent().find( 'div' ).html() );
        } );

        $( ".postbox-container" ).on( 'click', '.Button_Delete', function () {

            var new_order2 = $( '#normal-sortables .coordinate' ).length;
            var old_order2 = $( this ).parent().parent().parent().index() - 1;
            $( this ).parent().parent().parent().remove();

            $( '#normal-sortables' ).find( '.coordinate' ).each( function ( index ) {
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
                    get_timestamp_plus_timezone_offset( new Date( element.val() ).getTime() );
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

            // make the content string for the gmap info window
            var contentString = get_contentstring_of_coordinate( coordinates[map_canvas_id]['coordinates'][coordinate_index], coordinates[map_canvas_id]['coordinates'] );
            marker[map_canvas_id][coordinate_index].infowindow.setContent( contentString );
            bindInfoWindow( marker[map_canvas_id][coordinate_index], marker[map_canvas_id],
                map[map_canvas_id], contentString );

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
                center: { lat: coord_center_lat, lng: coord_center_lng }, //lat: 46.3682855, lng: 14.4170272
                zoom: 5,
                fullscreenControl: true
            };
            map[map_canvas_id] = new google.maps.Map( document.getElementById( 'map-canvas_' + map_canvas_id ), mapOptions );

            // Event listener fires if map is loaded and hide the loaing overlay
            google.maps.event.addListenerOnce( map[map_canvas_id], 'idle', function () {
                // do something only the first time the map is loaded
                $( '#loading' ).slideUp( 1500 );
                //show the form with the coordinates
                $( '#mhs_tm-form ' ).show();
            } );

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


                    // Add new coordinate in coordinate array
                    if ( coordinates[0]['coordinates'].length > 0 ) {

                        Add_Coordinate( event.overlay.getPosition().lat(),
                            event.overlay.getPosition().lng(), false );
                    } else {
                        //  Its the first coordinate                        
                        Add_Coordinate( event.overlay.getPosition().lat(),
                            event.overlay.getPosition().lng(), true );
                    }

                    // Add new Marker to Marker array
                    marker[map_canvas_id].push( event.overlay );
                    //Set options
                    marker[map_canvas_id][marker[map_canvas_id].length - 1].setOptions( {
                        id: marker[map_canvas_id].length - 1,
                        draggable: true
                    } );

                    // Set Info Window of ne Marker
                    marker[map_canvas_id][marker[map_canvas_id].length - 1].infowindow = new google.maps.InfoWindow( {
                        content: ''
                    } );
                    var contentString = get_contentstring_of_coordinate( coordinates[0]['coordinates'][coordinates[0]['coordinates'].length - 1], coordinates[0]['coordinates'] );
                    bindInfoWindow( marker[map_canvas_id][marker[map_canvas_id].length - 1], marker[map_canvas_id], map[map_canvas_id], contentString );

                    Add_Dragend_Listener( event.overlay );

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

                    var path = linePath[0].getPath();
                    path.push( event.overlay.getPosition() );
                }
            } );

            bounds[map_canvas_id] = new google.maps.LatLngBounds();
            var lines = [ ];
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

                        var contentString = get_contentstring_of_coordinate( coordinates[i]['coordinates'][j], coordinates[i]['coordinates'] );

                        marker[map_canvas_id][mark_counter] = new google.maps.Marker( {
                            position: myLatlng,
                            map: map[map_canvas_id],
                            title: coordinates[i]['coordinates'][0].name,
                            id: mark_counter,
                            icon: pinIcon,
                            draggable: true
                        } );

                        Add_Dragend_Listener( marker[map_canvas_id][mark_counter] );

                        marker[map_canvas_id][mark_counter].infowindow = new google.maps.InfoWindow( {
                            // content: contentString
                            content: ''
                        } );

                        map[map_canvas_id].fitBounds( bounds[map_canvas_id] );
                        map[map_canvas_id].panToBounds( bounds[map_canvas_id] );

                        bindInfoWindow( marker[map_canvas_id][mark_counter], marker[map_canvas_id], map[map_canvas_id], contentString );
                        lines.push( marker[map_canvas_id][mark_counter].position );

                        mark_counter++;
                    }

                    linePath[i] = new google.maps.Polyline( {
                        path: lines,
                        geodesic: true,
                        strokeColor: '#000000',
                        strokeOpacity: 1.0,
                        strokeWeight: 3
                    } );

                    //                linePath[i].setMap(map[map_canvas_id]);

                    lines = [ ];
                }
            }
        }

        function Add_Dragend_Listener( marker ) {
            google.maps.event.addListener( marker, 'dragend', function ( event ) {

                $( '#latitude_' + ( marker.id + 1 ) ).val( marker.getPosition().lat() );
                $( '#longitude_' + ( marker.id + 1 ) ).val( marker.getPosition().lng() );

                coordinates[map_canvas_id]['coordinates'][marker.id]['latitude'] = marker.getPosition().lat();
                coordinates[map_canvas_id]['coordinates'][marker.id]['longitude'] = marker.getPosition().lng();

            } );
        }

        function Add_Coordinate( lat, lng, first_coordinate ) {
            if ( first_coordinate ) {
                coordinates = [ ];
                coordinates[0] = [ ];
                coordinates[0]['coordinates'] = [ ];
                coordinates[0]['coordinates'][0] = {
                    latitude: lat,
                    longitude: lng
                };

                var coordinate_id = 1;
                var new_coordinate = $( '#normal-sortables' ).find( '.coordinate_new' ).clone( true );
                new_coordinate.removeAttr( 'style' ).removeClass( 'coordinate_new' ).addClass( 'coordinate' );
            } else {
                // Make a copy of the object without any references 
                coordinates[0]['coordinates'][coordinates[0]['coordinates'].length] = jQuery.extend( true, { }, coordinates[0]['coordinates'][0] );
                coordinates[0]['coordinates'][coordinates[0]['coordinates'].length - 1] = {
                    latitude: lat,
                    longitude: lng
                };

                var coordinate_id = $( '#normal-sortables' ).find( '.coordinate' ).length + 1;
                var new_coordinate = $( '#normal-sortables' ).find( '.coordinate_new' ).clone( true );
                new_coordinate.removeAttr( 'style' ).removeClass( 'coordinate_new' ).addClass( 'coordinate' );
            }

            new_coordinate.find( '.datetimepicker' ).datetimepicker( 'destroy' );

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

            $( '#normal-sortables' ).append( new_coordinate );

            $( '#normal-sortables' ).accordion( 'refresh' );

            $( '#latitude_' + coordinate_id ).val( lat );
            coordinates[0]['coordinates'][coordinate_id - 1]['latitude'] = lat;
            $( '#longitude_' + coordinate_id ).val( lng );
            coordinates[0]['coordinates'][coordinate_id - 1]['longitude'] = lng;

            $( '.datetimepicker' ).datetimepicker( {
                step: 10,
                value: new Date()
            } );
            coordinates[0]['coordinates'][coordinate_id - 1]['starttime'] = new Date().getTime();
        }

        function bindInfoWindow( marker, marker_all, map, contentString ) {
            google.maps.event.addListener( marker, 'click', function () {

                for ( index = 0; index < marker_all.length; ++index ) {
                    marker_all[index].infowindow.close();
                }

                marker.infowindow.setContent( contentString );
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
            coordinate.find( 'h2 > span.postbox_title' ).text( 'Coordinate ' + new_id );
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

} );
