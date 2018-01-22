jQuery( function ( $ ) {
    var routes = [];
    var ajax_url = mhs_tm_import_vars.ajax_url; 

    $( "#mhs_tm_list" ).on( 'click', '.mhs_tm_button_delete', function () {
        $( this ).parent().parent().parent().remove();
    } );

    $( "#mhs_tm_save_all" ).on( 'click', $( this ), function () {

        //if no route listed do nothing
        if( $( '.mhs_tm_button_save' ).last().length === 0 ) {
            return;
        }

        $( "#mhs_tm_dialog_loading" ).dialog( "open" );

        //get the last element
        var id_number_max = $( '.mhs_tm_button_save' ).last().attr( 'id' ).replace( /mhs_tm_button_save_/, '' );

        $( '#mhs_tm_button_save_' + id_number_max ).on( "remove", function () {
            $( "#mhs_tm_dialog_loading" ).dialog( "close" );
        } );

        //save sequentiel all listed routes
        save_all();
    } );

    $( "#mhs_tm_list" ).on( 'click', '.mhs_tm_button_save', function () {

        $( "#mhs_tm_dialog_loading" ).dialog( "open" );
        var id_number = $( this ).attr( 'id' ).replace( /mhs_tm_button_save_/, '' );
        var id = $( this ).attr( 'id' );
        save_route( id_number, id );

        $( '#' + id ).on( "remove", function () {
            $( "#mhs_tm_dialog_loading" ).dialog( "close" );
        } );
    } );

    $( "#mhs_tm_csv_file" ).change( function () {
        if( $(this).val() != '' ) {
            $( "#mhs_tm_start_import" ).prop('disabled', false);
        } else {
            $( "#mhs_tm_start_import" ).prop('disabled', true);
        }
    } );

    $( "#mhs_tm_start_import" ).on( 'click', $( this ), function () {
        $( "#mhs_tm_dialog_loading" ).dialog( "open" );

        $( "#mhs_tm_list" ).children().remove();

        var file = document.getElementById( "mhs_tm_csv_file" );
        var data;
        var route = [ ];
        var counter = 0;

        Papa.parse( file.files[0], {
            header: true,
            dynamicTyping: true,
            complete: function ( results ) {
                routes = [ ];

                // remove last entry in results because its always empty
                results['data'].splice(results['data'].length - 1, 1);
                // sort results DESC through START_DATE_TIME column 
                data = mhs_tm_utilities.utilities.sort_results(results['data'], 'START_DATE_TIME', 1);

                var start_date = $( "#mhs_tm_start_date" ).datepicker( "getDate" );
                if ( !start_date ) {
                    start_date = new Date( "1900/01/01" );
                }
                var end_date = $( "#mhs_tm_end_date" ).datepicker( "getDate" );
                if ( !end_date ) {
                    end_date = new Date();
                }
                
                $.each( data, function ( key, value ) {

                    if ( value['_id'] != '' && !( typeof value['_id'] === "undefined" ) ) {
                        var coordinate = [ ];
                        // !!!no _ in object keys!!!
                        coordinate = ( { 
                            city: value['CITY'],
                            country: value['COUNTRY'],
                            state: value['STATE'],
                            street: value['STREET'],
                            latitude: value['LATITUDE'],
                            longitude: value['LONGITUDE'],
                            note: value['NOTE'],
                            starttime: value['START_DATE_TIME'],
                            ishitchhikingspot: value['IS_HITCHHIKING_SPOT'],
                            ispartofaroute: value['IS_PART_OF_AROUTE'],
                            waitingtime: value['WAITING_TIME']
                        } );
                        //START_DATE_TIME is in milliseconds and devided by 1000 to be in seconds for php
                        coordinate.starttime = coordinate.starttime / 1000;
                        
                        route.push( coordinate );

                        if ( value['IS_DESTINATION'] === 1 ) {
                            // + 24 * 60 * 60 * 1000 to get the timestamp of the end of the selected day
                            if ( value['START_DATE_TIME'] >= start_date.valueOf()
                                && value['START_DATE_TIME'] <= ( end_date.valueOf() + 24 * 60 * 60 * 1000 ) ) {
                                route[ route.length - 1].ishitchhikingspot = 1;
                                routes.push( route );
                                route = [ ];
                                counter++;
                                if ( counter === 50 ) {
                                    return false;
                                }
                            } else {
                                route = [ ];
                            }
                        }
                    }
                } );
                
                $.each( routes, function ( key, value ) {
                    auto_list_add( value, key );
                } );

                if ( 0 < routes.length ) {
                    mhs_tm_map.coordinates = [];
                    mhs_tm_map.coordinates[0] = [];
                    mhs_tm_map.coordinates[0][0] = [];
                    mhs_tm_map.coordinates[0][0]['coordinates'] = [];
                    mhs_tm_map.coordinates[0][0]['options'] = [];
                    mhs_tm_map.coordinates[0][0]['coordinates'] = routes[0];

                    //calculate path of coordinate
                    var coordinates_on_route = mhs_tm_utilities.coordinate_handling.get_only_on_route_coordinates( routes[0] );
                    var path = [];
                    mhs_tm_utilities.gmaps.route_snap_to_road(coordinates_on_route, 0, path, 
                    $( "#mhs_tm_dis_route_snap_to_road" ).is(':checked'), function(path) {
                        if( path !== false ) {
                            //if calculation finish pass over the path coordinate in gloabl variable
                            //and load map
                            mhs_tm_map.coordinates[0][0]['options']['path'] = path;

                            mhs_tm_map.coord_center_lat[0] = parseFloat( window["mhs_tm_app_vars_0"].coord_center_lat );
                            mhs_tm_map.coord_center_lng[0] = parseFloat( window["mhs_tm_app_vars_0"].coord_center_lng );

                            mhs_tm_map.gmap_initialize( 0, 'route' );
                        }
                    } );

                    $( "#mhs_tm_save_all" ).css( 'display', "initial" );
                }
                
                $( "#mhs_tm_dialog_loading" ).dialog( "close" );
            }
        } );
    } );

    $( "#mhs_tm_list" ).accordion( {
        header: "> div > h3",
        collapsible: true,
        activate: function ( event, ui ) {
            var id_number = $( '.ui-accordion-header-active' ).parent().attr( 'id' );

            if ( id_number !== undefined )
            {
                id_number = id_number.replace( /mhs_tm_list_item_new_/, '' );
                if ( $( "#mhs_tm_map_canvas_" + id_number ).children().length == 0 )
                {
                    $( "#mhs_tm_dialog_loading" ).dialog( "open" );
                    map_canvas_id = id_number;

                    mhs_tm_map.coordinates = [ ];
                    mhs_tm_map.coordinates[map_canvas_id] = [ ];
                    mhs_tm_map.coordinates[map_canvas_id][0] = [ ];
                    mhs_tm_map.coordinates[map_canvas_id][0]['coordinates'] = [ ];
                    mhs_tm_map.coordinates[map_canvas_id][0]['options'] = [];
                    mhs_tm_map.coordinates[map_canvas_id][0]['options'].name = 'Route';
                    mhs_tm_map.coordinates[map_canvas_id][0]['coordinates'] = routes[id_number];

                    //calculate path of coordinate
                    var coordinates_on_route = mhs_tm_utilities.coordinate_handling.get_only_on_route_coordinates( routes[id_number] );
                    var path = [];
                    mhs_tm_utilities.gmaps.route_snap_to_road(coordinates_on_route, 0, path, $( "#mhs_tm_dis_route_snap_to_road" ).is(':checked'), function(path) {
                        //if calculation finish pass over the path coordinate in gloabl variable
                        //and load map
                        mhs_tm_map.coordinates[map_canvas_id][0]['options']['path'] = path;

                        mhs_tm_map.coord_center_lat[map_canvas_id] = parseFloat( window["mhs_tm_app_vars_0"].coord_center_lat );
                        mhs_tm_map.coord_center_lng[map_canvas_id] = parseFloat( window["mhs_tm_app_vars_0"].coord_center_lng );
                        mhs_tm_map.gmap_initialize( map_canvas_id, 'route' );

                        $( "#mhs_tm_dialog_loading" ).dialog( "close" );
                    } );

                } else {

                    google.maps.event.trigger( mhs_tm_map.map[id_number], "resize" );
                    mhs_tm_map.map[id_number].fitBounds( mhs_tm_map.bounds[id_number] );
                    mhs_tm_map.map[id_number].panToBounds( mhs_tm_map.bounds[id_number] );

                }
            }
        }
    } );

    auto_list_add = function( route, id ) {

        var html = ' <div class="mhs_tm_box_item"" id="mhs_tm_list_item_new_' + id + '"> \n\
                    <h3 class="no-hover" style="overflow: auto;">';
        var name = '';
        if ( route[0]['city'] )
        {
            html += route[0]['city'];
            name += route[0]['city'];
        } else if ( route[0]['state'] )
        {
            html += route[0]['state'];
            name += route[0]['state'];
        } else if ( route[0]['country'] )
        {
            html += route[0]['country'];
            name += route[0]['country'];
        }

        html += ' to ';
        name += ' to ';

        if ( route[route.length - 1]['city'] )
        {
            html += route[route.length - 1]['city'];
            name += route[route.length - 1]['city'];
        } else if ( route[route.length - 1]['state'] )
        {
            html += route[route.length - 1]['state'];
            name += route[route.length - 1]['state'];
        } else if ( route[route.length - 1]['country'] )
        {
            html += route[route.length - 1]['country'];
            name += route[route.length - 1]['country'];
        }
        // time * 1000 because time is in seconds and Date() calculates in milliseconds
        html += ' (' +
            new Date( parseInt( route[0]['starttime'] * 1000 ) ).
            toLocaleString( [ ], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } ) +
            ' / ' + new Date( parseInt( route[route.length - 1]['starttime'] * 1000 ) ).
            toLocaleString( [ ], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } ) + ')';
        name += ' (' +
            new Date( parseInt( route[0]['starttime'] * 1000 ) ).
            toLocaleString( [ ], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } ) +
            ' / ' + new Date( parseInt( route[route.length - 1]['starttime'] * 1000 ) ).
            toLocaleString( [ ], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } ) + ')';
        
        //set map name
        mhs_tm_map.map_options[id] = { 'name': name };
        
        html += mhs_tm_utilities.utilities.get_buttons( id );

        html += '<div id="map" class="collapse ">\n\
        <div class="mhs_tm-map" id="mhs_tm_map_canvas_' + id + 
            '" style="height: 500px; margin: 0; padding: 0;"></div>\n\
        </div>';
        //div for gmaps popup window
        html += '<div id="mhs-tm-gmap-popup-window-' + id + 
            '" class="mhs-tm-gmap-popup-window"></div>';


        html += '</div>';

        $( '#mhs_tm_list' ).append( html );

        $( '#mhs_tm_list' ).accordion( "refresh" );


    };

    //save sequentiel all listed routes
    save_all = function() {
        //get the last element
        var id_number_max = $( '.mhs_tm_button_save' ).last().attr( 'id' ).replace( /mhs_tm_button_save_/, '' );
        //get the first elemment
        var id_number = $( '.mhs_tm_button_save' ).first().attr( 'id' ).replace( /mhs_tm_button_save_/, '' );
        var id = $( '.mhs_tm_button_save' ).first().attr( 'id' );

        save_route( id_number, id );

        if( id_number_max != id_number ) {
            //if the first not the last call function again if elemnt removed, beause there are more to save
            $( '#mhs_tm_button_save_' + id_number ).on( "remove", function () {
                //wait 500ms because the element has realy to be removed!!
                setTimeout(function(){
                    save_all(); 
                }, 500);                       
            } );
        }
    };

    save_route = function( id_number, id ) {
        var name = '';

        if ( routes[id_number][0]['city'] )
        {
            name = name + routes[id_number][0]['city'];
        } else if ( routes[id_number][0]['state'] )
        {
            name = name + routes[id_number][0]['state'];
        } else if ( routes[id_number][0]['country'] )
        {
            name = name + routes[id_number][0]['country'];
        }

        name = name + ' to ';

        if ( routes[id_number][routes[id_number].length - 1]['city'] )
        {
            name = name + routes[id_number][routes[id_number].length - 1]['city'];
        } else if ( routes[id_number][routes[id_number].length - 1]['state'] )
        {
            name = name + routes[id_number][routes[id_number].length - 1]['state'];
        } else if ( routes[id_number][routes[id_number].length - 1]['country'] )
        {
            name = name + routes[id_number][routes[id_number].length - 1]['country'];
        }
        
        // time * 1000 because time is in seconds and Date() calculates in milliseconds
        name = name + ' (' + new Date( parseInt( routes[id_number][routes[id_number].length - 1]['starttime'] * 1000 ) ).
            toLocaleString( [ ], { year: '2-digit', month: '2-digit', day: '2-digit' } ) + ')';
        
        //check if a path already calculated
        //path is just saved in global coordinates array
        if( typeof mhs_tm_map.coordinates[id_number] !== 'undefined' && mhs_tm_map.coordinates[id_number].length > 0 ) {
            if( typeof mhs_tm_map.coordinates[id_number][0]['options']['path'] !== 'undefined' ) {
                var path = mhs_tm_map.coordinates[id_number][0]['options']['path'];
                $.post( 
                    ajax_url + '?action=routes_save',
                    {
                        name: name,
                        route: JSON.stringify( routes[id_number] ),
                        path: JSON.stringify( path ),
                        dis_route_snap_to_road: $( "#mhs_tm_dis_route_snap_to_road" ).is(':checked') ? 1 : 0,
                        mhs_tm_route_save_nonce: $( '#mhs_tm_route_save_nonce' ).val(),
                    },
                    function ( response ) {
                        mhs_tm_utilities.utilities.show_message( response.type, response.message );
                        $( '#' + id ).parent().parent().parent().remove();
                    },
                    "json"
                );
            }
        } else {
            var coordinates_on_route = mhs_tm_utilities.coordinate_handling.get_only_on_route_coordinates( routes[id_number] );
            var path = [];
            mhs_tm_utilities.gmaps.route_snap_to_road(coordinates_on_route, 0, path, $( "#mhs_tm_dis_route_snap_to_road" ).is(':checked'), function(path) {
                $.post( 
                    ajax_url + '?action=routes_save',
                    {
                        name: name,
                        route: JSON.stringify( routes[id_number] ),
                        path: JSON.stringify( path ),
                        dis_route_snap_to_road: $( "#mhs_tm_dis_route_snap_to_road" ).is(':checked') ? 1 : 0,
                        mhs_tm_route_save_nonce: $( '#mhs_tm_route_save_nonce' ).val(),
                    },
                    function ( response ) {
                        mhs_tm_utilities.utilities.show_message( response.type, response.message );
                        $( '#' + id ).parent().parent().parent().remove();
                    },
                    "json"
                );
            } );
        }
    };
} );