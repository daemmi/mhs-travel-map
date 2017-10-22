jQuery( function ( $ ) {
    var routes = [ ];

    $( document ).ready( function () {

        $( "#list" ).accordion( {
            header: "> div > h3",
            collapsible: true
        } );

        $( "#list" ).on( 'click', '.Button_Delete', function () {
            $( this ).parent().parent().parent().remove();
        } );

        $( "#save_all" ).on( 'click', $( this ), function () {

            $( "#dialog_loading" ).dialog( "open" );

            var id_number_max = $( '.Button_Save' ).last().attr( 'id' ).replace( /Button_Save_/, '' );

            $( ".Button_Save" ).each( function () {

                var id_number = $( this ).attr( 'id' ).replace( /Button_Save_/, '' );
                var id = $( this ).attr( 'id' );
                save_route( id_number, id );

            } );
            
            $( '#Button_Save_' + id_number_max ).on( "remove", function () {
                $( "#dialog_loading" ).dialog( "close" );
            } );
        } );

        $( "#list" ).on( 'click', '.Button_Save', function () {

            $( "#dialog_loading" ).dialog( "open" );
            var id_number = $( this ).attr( 'id' ).replace( /Button_Save_/, '' );
            var id = $( this ).attr( 'id' );
            save_route( id_number, id );

            $( '#' + id ).on( "remove", function () {
                $( "#dialog_loading" ).dialog( "close" );
            } );
        } );

        $( "#csv-file" ).change( function () {
            if( $(this).val() != '' ) {
                $( "#start_import" ).prop('disabled', false);
            } else {
                $( "#start_import" ).prop('disabled', true);
            }
        } );

        $( "#start_import" ).on( 'click', $( this ), function () {
            $( "#list" ).children().remove();

            var file = document.getElementById( "csv-file" );
            var data;
            var route = [ ];
            var counter = 0;

            $( "#dialog_loading" ).dialog( "open" );

            Papa.parse( file.files[0], {
                header: true,
                dynamicTyping: true,
                complete: function ( results ) {
                    routes = [ ];
                    
                    // remove last entry in results because its always empty
                    results['data'].splice(results['data'].length - 1, 1);
                    // sort results DESC through START_DATE_TIME column 
                    data = sortResults(results['data'], 'START_DATE_TIME', 1);
                    
                    var start_date = $( "#start_date" ).datepicker( "getDate" );
                    if ( !start_date ) {
                        start_date = new Date( "1900/01/01" );
                    }
                    var end_date = $( "#end_date" ).datepicker( "getDate" );
                    if ( !end_date ) {
                        end_date = new Date();
                    }
                    
                    $.each( data, function ( key, value ) {

                        if ( value['_id'] != '' && !( typeof value['_id'] === "undefined" ) ) {
                            var coordinate = [ ];
                            // !!!no _ in object keys!!!
                            coordinate = ( { id: value['_id'],
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
                                waitingtime: value['WAITING_TIME'],
                                countrycode: value['COUNTRY_CODE']
                            } );

                            route.push( coordinate );

                            if ( value['IS_DESTINATION'] === 1 ) {
                                if ( value['START_DATE_TIME'] >= start_date.valueOf()
                                    // + 24 * 60 * 60 * 1000 to get the timestamp of the end of the selected day
                                    && value['START_DATE_TIME'] <= ( end_date.valueOf() + 24 * 60 * 60 * 1000 ) ) {
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
                        coordinates = [ ];
                        coordinates[0] = [ ];
                        coordinates[0][0] = [ ];
                        coordinates[0][0]['coordinates'] = [ ];
                        coordinates[0][0]['options'] = [];
                        coordinates[0][0]['coordinates'] = routes[0];

                        //calculate path of coordinate
                        var coordinates_on_route = get_only_on_route_coordinates( routes[0] );
                        var path = [];
                        route_snap_to_road(coordinates_on_route, 0, path, function(path) {
                            //if calculation finish pass over the path coordinate in gloabl variable
                            //and load map
                            coordinates[0][0]['options']['path'] = path;
                            
                            coord_center_lat[0] = parseFloat( window["mhs_tm_app_vars_0"].coord_center_lat );
                            coord_center_lng[0] = parseFloat( window["mhs_tm_app_vars_0"].coord_center_lng );

                            gmap_initialize( 0 );
                        } );
                        
                        $( "#save_all" ).css( 'display', "initial" );
                    }

                    $( "#dialog_loading" ).dialog( "close" );
                }
            } );
        } );

        $( "#list" ).accordion( {
            activate: function ( event, ui ) {
                var id_number = $( '.ui-accordion-header-active' ).parent().attr( 'id' );

                if ( id_number !== undefined )
                {
                    id_number = id_number.replace( /listItem_new_/, '' );
                    if ( $( "#map-canvas_" + id_number ).children().length == 0 )
                    {
                        $( "#dialog_loading" ).dialog( "open" );
                        map_canvas_id = id_number;
                        
                        coordinates = [ ];
                        coordinates[map_canvas_id] = [ ];
                        coordinates[map_canvas_id][0] = [ ];
                        coordinates[map_canvas_id][0]['coordinates'] = [ ];
                        coordinates[map_canvas_id][0]['options'] = [];
                        coordinates[map_canvas_id][0]['coordinates'] = routes[id_number];
                        
                        //calculate path of coordinate
                        var coordinates_on_route = get_only_on_route_coordinates( routes[id_number] );
                        var path = [];
                        route_snap_to_road(coordinates_on_route, 0, path, function(path) {
                            //if calculation finish pass over the path coordinate in gloabl variable
                            //and load map
                            coordinates[map_canvas_id][0]['options']['path'] = path;
                            
                            coord_center_lat[map_canvas_id] = parseFloat( window["mhs_tm_app_vars_0"].coord_center_lat );
                            coord_center_lng[map_canvas_id] = parseFloat( window["mhs_tm_app_vars_0"].coord_center_lng );
                            gmap_initialize( map_canvas_id );
                            
                            $( "#dialog_loading" ).dialog( "close" );
                        } );
                        
                    } else {
                        
                        google.maps.event.trigger( map[id_number], "resize" );
                        map[id_number].fitBounds( bounds[id_number] );
                        map[id_number].panToBounds( bounds[id_number] );
                        
                    }
                }
            }
        } );

        function auto_list_add( route, id ) {

            var html = ' <div class="Box_Item postbox"" id="listItem_new_' + id + '"> \n\
                        <h3 class="no-hover" style="overflow: auto;">';

            if ( route[0]['city'] )
            {
                html = html + route[0]['city'];
            } else if ( route[0]['state'] )
            {
                html = html + route[0]['state'];
            } else if ( route[0]['country'] )
            {
                html = html + route[0]['country'];
            }

            html = html + ' to ';

            if ( route[route.length - 1]['city'] )
            {
                html = html + route[route.length - 1]['city'];
            } else if ( route[route.length - 1]['state'] )
            {
                html = html + route[route.length - 1]['state'];
            } else if ( route[route.length - 1]['country'] )
            {
                html = html + route[route.length - 1]['country'];
            }

            html = html + ' (' +
                new Date( parseInt( route[0]['starttime'] ) ).
                toLocaleString( [ ], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } ) +
                ' / ' + new Date( parseInt( route[route.length - 1]['starttime'] ) ).
                toLocaleString( [ ], { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' } ) + ')';
           
            html = html + get_buttons( id );

            html = html + '<div id="map" class="collapse ">\n\
                                <div class="mhs_tm-map" id="map-canvas_' + id + '" style="height: 500px; margin: 0; padding: 0;"></div>\n\
                                </div>';

            html = html + '</div>';

            $( '#list' ).append( html );

            $( '#list' ).accordion( "refresh" );


        }

        function save_route( id_number, id ) {
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

            name = name + ' (' + new Date( parseInt( routes[id_number][routes[id_number].length - 1]['starttime'] ) ).
                toLocaleString( [ ], { year: '2-digit', month: '2-digit', day: '2-digit' } ) + ')';
            
            //check if a path already calculated
            //path is just saved in global coordinates array
            if( typeof coordinates[id_number] !== 'undefined' && coordinates[id_number].length > 0 ) {
                if( typeof coordinates[id_number][0]['options']['path'] !== 'undefined' ) {
                    var path = coordinates[id_number][0]['options']['path'];

                    $.post( window.location.pathname + '?page=MHS_TM-routes&js=ja&todo=save',
                        {
                            name: name,
                            todo_check: 'check',
                            route: JSON.stringify( routes[id_number] ),
                            path: JSON.stringify( path )
                        } )
                        .done( function () {
                            $( '#' + id ).parent().parent().parent().remove();
                        } );
                }
            } else {
                var coordinates_on_route = get_only_on_route_coordinates( routes[id_number] );
                var path = [];
                route_snap_to_road(coordinates_on_route, 0, path, function(path) {
                    $.post( window.location.pathname + '?page=MHS_TM-routes&js=ja&todo=save',
                        {
                            name: name,
                            todo_check: 'check',
                            route: JSON.stringify( routes[id_number] ),
                            path: JSON.stringify( path )
                        } )
                        .done( function () {
                            $( '#' + id ).parent().parent().parent().remove();
                        } );
                } );
            }
        }

    } );
} );