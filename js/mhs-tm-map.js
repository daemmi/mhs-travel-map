var mhs_tm_map = mhs_tm_map || {};

// global variables
mhs_tm_map = {
    opacity_strength : 0.15,
    map : {},
    marker: [],
    marker_count: [],
    bounds: {},
    bounds_map: {},
    coordinates: {},
    map_options: {},
    shortcode_options: {},
    coord_center_lat: {},
    coord_center_lng: {},
    auto_load: {},
    plugin_dir: '',
    route_path: [],
    no_mousover_out: {},
    active_coordinate: [],
};

jQuery( function ( $ ) {
    $( '.mhs_tm-map' ).each( function ( index ) {
        var map_canvas_id                           = parseInt( $( this ).attr( 'id' ).replace( 'mhs_tm_map_canvas_', '' ) );
        mhs_tm_map.coordinates[map_canvas_id]       = window["mhs_tm_app_vars_" + map_canvas_id].coordinates;
        mhs_tm_map.map_options[map_canvas_id]       = window["mhs_tm_app_vars_" + map_canvas_id].map_options;
        mhs_tm_map.shortcode_options[map_canvas_id] = window["mhs_tm_app_vars_" + map_canvas_id].shortcode_options;
        mhs_tm_map.coord_center_lat[map_canvas_id]  = parseFloat( window["mhs_tm_app_vars_" + map_canvas_id].coord_center_lat );
        mhs_tm_map.coord_center_lng[map_canvas_id]  = parseFloat( window["mhs_tm_app_vars_" + map_canvas_id].coord_center_lng );
        mhs_tm_map.auto_load[map_canvas_id]         = window["mhs_tm_app_vars_" + map_canvas_id].auto_load;
        mhs_tm_map.no_mousover_out[map_canvas_id]   = false;
        mhs_tm_map.plugin_dir                       = window["mhs_tm_app_vars_" + map_canvas_id].plugin_dir;
        mhs_tm_map.ajax_url                         = window["mhs_tm_app_vars_" + map_canvas_id].ajax_url;
        if ( mhs_tm_map.auto_load[map_canvas_id] )
        {
            //set gmap window size
            if( mhs_tm_map.shortcode_options[map_canvas_id].auto_window_ratio ) {
                mhs_tm_utilities.utilities.set_div_16_9( '#mhs_tm_map_canvas_' + map_canvas_id );
            }
            google.maps.event.addDomListener( window, 'load', mhs_tm_map.gmap_initialize( 
                map_canvas_id, mhs_tm_map.shortcode_options[map_canvas_id]['type'] ) );
        }
        
        $( window ).resize( function () {
            //change gmap window size
            if( mhs_tm_map.shortcode_options[map_canvas_id].auto_window_ratio ) {
                mhs_tm_utilities.utilities.set_div_16_9( '#mhs_tm_map_canvas_' + map_canvas_id );
            }
       } );
    } );
    
    mhs_tm_utilities.gmaps.popup_control_initialize();
} );

mhs_tm_map.gmap_initialize = function( map_canvas_id, type ) {
    var mapOptions = {
        center: { lat: mhs_tm_map.coord_center_lat[map_canvas_id], lng: mhs_tm_map.coord_center_lng[map_canvas_id] },
        zoom: 5,
        fullscreenControl: true
    };
    mhs_tm_map.route_path[map_canvas_id] = [];
    mhs_tm_map.active_coordinate[map_canvas_id] = [];
    mhs_tm_map.map[map_canvas_id] = new google.maps.Map( document.getElementById( 'mhs_tm_map_canvas_' + map_canvas_id ),
        mapOptions );   
    
    // Event listener fires if map is loaded and hide the loaing overlay
    google.maps.event.addListenerOnce( mhs_tm_map.map[map_canvas_id], 'tilesloaded', function () {
        // do something only the first time the map is loaded
        jQuery( function ( $ ) {
            $( '#mhs_tm_loading_' + map_canvas_id ).slideUp( 1500 );
        } );
    } );
    
    //if type route no content for statistics and no button
    if ( type === 'route' ) { 
        //Make new popup window for the map
        mhs_tm_map.map[map_canvas_id].popup_window = new mhs_tm_utilities.gmaps.popup_window(
            mhs_tm_map.map[map_canvas_id], 
            document.getElementById( 'mhs_tm_map_canvas_' + map_canvas_id ),
            document.getElementById( 'mhs-tm-gmap-popup-window-' + map_canvas_id ),
            document.getElementById( 'mhs-tm-gmap-popup-window-loading-' + map_canvas_id ),
            document.getElementById( '' ),
            mhs_tm_map.plugin_dir
        );
    } else {
        //Make new popup window for the map
        mhs_tm_map.map[map_canvas_id].popup_window = new mhs_tm_utilities.gmaps.popup_window(
            mhs_tm_map.map[map_canvas_id], 
            document.getElementById( 'mhs_tm_map_canvas_' + map_canvas_id ),
            document.getElementById( 'mhs-tm-gmap-popup-window-' + map_canvas_id ),
            document.getElementById( 'mhs-tm-gmap-popup-window-loading-' + map_canvas_id ),
            document.getElementById( 'mhs-tm-gmap-show-info-' + map_canvas_id ),
            mhs_tm_map.plugin_dir
        );
        //set content for statistics button
        mhs_tm_map.map[map_canvas_id].popup_window.content_control =
            mhs_tm_utilities.coordinate_handling.
            get_contentstring_of_map( mhs_tm_map.coordinates[map_canvas_id],
                mhs_tm_map.map_options[map_canvas_id] );        
    }
        
    mhs_tm_map.bounds[map_canvas_id] = new google.maps.LatLngBounds();
    mhs_tm_map.bounds_map[map_canvas_id] = new google.maps.LatLngBounds();
    var mark_counter = 0;
    mhs_tm_map.marker[map_canvas_id] = [];
    mhs_tm_map.marker_count[map_canvas_id] = 0;
    var last_spot_id  = 0;
    var last_mark_id  = 0;
    var last_route_id = 0;
    var start_is_set  = 0;
    
    // click on the map sets the opacity of the paths and markers back to 1 and closes the 
    // info window
    google.maps.event.addListener(mhs_tm_map.map[map_canvas_id], "click", function() {
        mhs_tm_map.no_mousover_out[map_canvas_id] = false;
        mhs_tm_map.set_full_opacity( mhs_tm_map.marker[map_canvas_id], 
            mhs_tm_map.route_path[map_canvas_id] ); 
    } );
    
    // Event listener fires after a resize of the window
    google.maps.event.addDomListener( window, 'resize', function () {
        //set a time out otherwise the function calls come to early after closing the full screen
        setTimeout( function () {
            mhs_tm_map.map[map_canvas_id].fitBounds( mhs_tm_map.bounds[map_canvas_id] );
            mhs_tm_map.map[map_canvas_id].panToBounds( mhs_tm_map.bounds[map_canvas_id] );
        }, 20 );
    } );
    
    // i = rouute_id
    for ( var i = 0; i < mhs_tm_map.coordinates[map_canvas_id].length; ++i ) {
        last_spot_id = 0;
        start_is_set = 0;
        mark_counter = 0;
        mhs_tm_map.marker[map_canvas_id][i] = [];
        for ( var j = 0; j < mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'].length; ++j ) {
            var lat = parseFloat( mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j].latitude );
            var lng = parseFloat( mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j].longitude );
            
            if ( isNaN( lat ) || isNaN( lng ) ) {
                break;
            }
            var myLatlng = new google.maps.LatLng( lat, lng );
            var pin = mhs_tm_map.plugin_dir + '/img/Pin-Thumb.png';

            //Set the bound for zoom
            if( mhs_tm_map.map_options[map_canvas_id]['zoom'] > 0 ) {
                if( i >= mhs_tm_map.coordinates[map_canvas_id].length - 
                    mhs_tm_map.map_options[map_canvas_id]['zoom'] ) {
                    
                    mhs_tm_map.bounds[map_canvas_id].extend( myLatlng );
                }
            } else {
                mhs_tm_map.bounds[map_canvas_id].extend( myLatlng );
            }

            // Get the icon for the marker
            // check if the coordinate is part of the route then set pin and set flag so that no other coordinate could get start pin
            if ( start_is_set === 0 && mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j].ispartofaroute ) {
                start_is_set = 1;
                pin = 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=S|7f7f7f|ffffff';
            } else if ( mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j].ispartofaroute ) {
                // if there is a new coordinate on the route change pin of old destination
                if ( last_spot_id != 0 && last_mark_id != 0 && mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][last_spot_id].ishitchhikingspot ) {
                    var pinIcon = {
                                url: mhs_tm_map.plugin_dir + '/img/Pin-Thumb.png'
                              };

                    mhs_tm_map.marker[map_canvas_id][last_route_id][last_mark_id].setIcon( pinIcon );
                } else if ( last_spot_id != 0 && last_mark_id != 0 ) {
                    var pinIcon = {
                                url: mhs_tm_map.plugin_dir + '/img/Pin-Star.png'
                              };

                    mhs_tm_map.marker[map_canvas_id][last_route_id][last_mark_id].setIcon( pinIcon );
                }
                // save the id, if the next coordinate is spot again change pin of this one
                last_route_id = i;
                last_mark_id = mark_counter;
                last_spot_id = j;
                pin = 'https://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=flag|000000';
            } else if ( !mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j].ishitchhikingspot ) {
                pin = mhs_tm_map.plugin_dir + '/img/Pin-Star.png';
            } 

            var pinIcon = {
                url: pin
            };
            
            // New Marker mhs_tm_map.marker[Map_id][Route_id][Marker_id]
            mhs_tm_map.marker[map_canvas_id][i][mark_counter] = new google.maps.Marker( {
                position: myLatlng,
                map: mhs_tm_map.map[map_canvas_id],
                title: mhs_tm_utilities.coordinate_handling.get_title(
                    mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j],
                    mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'],
                    mhs_tm_map.coordinates[map_canvas_id][i]['options'] ),
                id: map_canvas_id + '_' + i + '_' + mark_counter,
                id_route: i,
                id_marker: mark_counter,
                id_map: map_canvas_id,
                icon: pinIcon,
                note_div_id: {
                    route_id: mhs_tm_map.coordinates[map_canvas_id][i].options.id,
                    marker_id: mark_counter
                }
            } );
            
            mhs_tm_map.marker[map_canvas_id][i][mark_counter].content_string =
                mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate(
                    mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j],
                    mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'],
                    mhs_tm_map.coordinates[map_canvas_id][i]['options'] );
            
            //click on a pin
            mhs_tm_map.marker[map_canvas_id][i][mark_counter].addListener('click', function() {
                var marker = this;
                // load via ajax note content 
                jQuery( function ( $ ) {
                    $.post(
                        mhs_tm_map.ajax_url + '?action=get_coordinate_note',
                        {
                            route_id: marker.note_div_id.route_id,
                            marker_id: marker.note_div_id.marker_id,
                        },
                        function ( response ) {
                            $( '#mhs-tm-gmap-popup-window-' + map_canvas_id ).
                                find( '.mhs-tm-gmap-popup-window-content-before' ).
                                html( response );
                            
                            setTimeout( function () {
                                mhs_tm_map.map[map_canvas_id].popup_window.hide_loading( 200 );
                                mhs_tm_map.map[map_canvas_id].popup_window.show( marker.content_string );
                            }, 1500);
                        },
                        "json"
                    );
                } );

                // save the aktiv pin to know which is the previous and next pin
                mhs_tm_map.active_coordinate[map_canvas_id].route_id = marker.id_route;
                mhs_tm_map.active_coordinate[map_canvas_id].coordinate_id = marker.id_marker;
                
                mhs_tm_map.set_pop_up_control( marker );
                                          
                mhs_tm_map.map[map_canvas_id].popup_window.show_loading( 200 );
                mhs_tm_map.no_mousover_out[map_canvas_id] = true;
                mhs_tm_map.set_opacity( mhs_tm_map.marker, mhs_tm_map.route_path, map_canvas_id, 
                    'single_marker', this );
                //Set ZIndex for this marker to the highest  single_marker
                this.setZIndex( google.maps.Marker.MAX_ZINDEX + 2 );
                
                // set bounds of map tp path
                mhs_tm_map.set_bounds_via_marker( map_canvas_id, 
                    mhs_tm_map.marker[map_canvas_id][marker.id_route], 
                    mhs_tm_map.map[map_canvas_id] );
            } );
            
            mhs_tm_map.marker[map_canvas_id][i][mark_counter].addListener('mouseover', function() {
                if ( !mhs_tm_map.no_mousover_out[map_canvas_id] ) {
                    mhs_tm_map.set_opacity( mhs_tm_map.marker, mhs_tm_map.route_path, map_canvas_id, 
                        'marker', this );
                }
                //Set ZIndex for this marker to the highest
                this.setZIndex( google.maps.Marker.MAX_ZINDEX + 2 );
            } );
            
            mhs_tm_map.marker[map_canvas_id][i][mark_counter].addListener( 'mouseout', function () {
                if ( !mhs_tm_map.no_mousover_out[map_canvas_id] ) {
                    mhs_tm_map.set_full_opacity( mhs_tm_map.marker[map_canvas_id],
                        mhs_tm_map.route_path[map_canvas_id] );
                }
            } );

            mhs_tm_map.map[map_canvas_id].fitBounds( mhs_tm_map.bounds[map_canvas_id] );
            mhs_tm_map.map[map_canvas_id].panToBounds( mhs_tm_map.bounds[map_canvas_id] );
            
            mark_counter++;
            mhs_tm_map.marker_count[map_canvas_id]++;
        }
        
        var lines = [];
        mhs_tm_map.coordinates[map_canvas_id][i]['options']['path'].forEach( function(item, index) {
            lines.push( new google.maps.LatLng( item['lat'], item['lng'] ) );
        } );
        
        var route_color = mhs_tm_map.get_route_color( mhs_tm_map.map_options[map_canvas_id]['transport_classes'],
            mhs_tm_map.coordinates[map_canvas_id][i] );
        
        mhs_tm_map.route_path[map_canvas_id][i] = new google.maps.Polyline( {
            path: lines,
            geodesic: true,
            strokeColor: route_color,
            strokeOpacity: 1.0,
            strokeWeight: 3,
            id_route: i
        } );
        
        mhs_tm_map.route_path[map_canvas_id][i].addListener( 'click', function () {
            mhs_tm_map.no_mousover_out[map_canvas_id] = true;
            mhs_tm_map.set_opacity( mhs_tm_map.marker, mhs_tm_map.route_path, map_canvas_id, 
                'route_path', this );
            
            // set bounds of map tp path
            mhs_tm_map.set_bounds_via_marker( map_canvas_id, 
                mhs_tm_map.marker[map_canvas_id][this.id_route], 
                mhs_tm_map.map[map_canvas_id] );
        } );
            
        mhs_tm_map.route_path[map_canvas_id][i].addListener('mouseover', function() {
            if ( !mhs_tm_map.no_mousover_out[map_canvas_id] ) {
                mhs_tm_map.set_opacity( mhs_tm_map.marker, mhs_tm_map.route_path, map_canvas_id, 
                    'route_path', this );
            }
        } );

        mhs_tm_map.route_path[map_canvas_id][i].addListener( 'mouseout', function () {
            if ( !mhs_tm_map.no_mousover_out[map_canvas_id] ) {
                mhs_tm_map.set_full_opacity( mhs_tm_map.marker[map_canvas_id],
                    mhs_tm_map.route_path[map_canvas_id] );
            }
        } );

        mhs_tm_map.route_path[map_canvas_id][i].setMap( mhs_tm_map.map[map_canvas_id] );
    }
    // save bounds for the whole map
    mhs_tm_map.bounds_map[map_canvas_id] = mhs_tm_map.bounds[map_canvas_id]
};

mhs_tm_map.set_opacity = function( marker, line_path, map_canvas_id, from_listener, listener ) {
    // change opacity for all path and markers
    for ( var y = 0; y < line_path[map_canvas_id].length; y++ ) {
        // find route id
        if( from_listener === 'route_path' ) { 
            if( listener === line_path[map_canvas_id][y] ) {
                var route_id = y;
            }
        }
        
        line_path[map_canvas_id][y].setOptions( { 
            strokeOpacity: mhs_tm_map.opacity_strength,
            zIndex: 0  
        } );
        
        for ( var j = 0; j < marker[map_canvas_id][y].length; ++j ) {
            // find route id
            if( from_listener === 'marker' || from_listener === 'single_marker' ) { 
                if( listener === marker[map_canvas_id][y][j] ) {
                    var route_id = y;
                }
            }
            marker[map_canvas_id][y][j].setOpacity( mhs_tm_map.opacity_strength );
            marker[map_canvas_id][y][j].setZIndex( 0 );
        }
    }

    line_path[map_canvas_id][route_id].setOptions( { 
        strokeOpacity: 1,
        zIndex: 100,
        strokeColor: line_path[map_canvas_id][route_id].strokeColor,
    } );

    if( from_listener === 'single_marker' ) { 
        for ( var z = 0; z < marker[map_canvas_id][route_id].length; z++ ) {
            marker[map_canvas_id][route_id][z].setOpacity( 0.5 );
        }
        listener.setOpacity( 1 );
        listener.setZIndex( google.maps.Marker.MAX_ZINDEX + 1 );
    } else {
        for ( var z = 0; z < marker[map_canvas_id][route_id].length; z++ ) {
            marker[map_canvas_id][route_id][z].setOpacity( 1 );
            marker[map_canvas_id][route_id][z].setZIndex( google.maps.Marker.MAX_ZINDEX + 1 );
        }
    }
};

mhs_tm_map.set_full_opacity = function ( marker, line_path) {
    for ( var i = 0; i < line_path.length; ++i ) {
        line_path[i].setOptions( { strokeOpacity: 1 } );
        for ( var j = 0; j < marker[i].length; ++j ) {
            marker[i][j].setOpacity( 1 );
        }
    }
};

// set the control buttons of popup window
mhs_tm_map.set_pop_up_control = function ( marker ) {
    // show all
    mhs_tm_map.map[marker.id_map].popup_window.show_control_arrow( 'all' );
    mhs_tm_map.map[marker.id_map].popup_window.show_control_div();
//    document.getElementById("mhs-tm-gmap-popup-window-" + marker.id_map)
//        .getElementsByClassName("mhs-tm-gmap-popup-control-arrow-right")[0]
//        .style.visibility = "visible";
//    document.getElementById("mhs-tm-gmap-popup-window-" + marker.id_map)
//        .getElementsByClassName("mhs-tm-gmap-popup-control-arrow-left")[0]
//        .style.visibility = "visible";
//    document.getElementById('mhs-tm-gmap-popup-window-' + marker.id_map)
//        .getElementsByClassName("mhs-tm-gmap-popup-window-control")[0]
//        .style.visibility = "visible";

    // if just one or no coordinate is in the map show nothing
    if( mhs_tm_map.marker_count[marker.id_map] < 2 ) {
        mhs_tm_map.map[marker.id_map].popup_window.hide_control_div();
//        document.getElementById('mhs-tm-gmap-popup-window-' + marker.id_map)
//            .getElementsByClassName("mhs-tm-gmap-popup-window-control")[0]
//            .style.visibility = "hidden";
    } else if( marker.id_route === 0 && marker.id_marker === 0 ) {
        mhs_tm_map.map[marker.id_map].popup_window.hide_control_arrow( 'left' );
//        document.getElementById('mhs-tm-gmap-popup-window-' + marker.id_map)
//            .getElementsByClassName("mhs-tm-gmap-popup-control-arrow-left")[0]
//            .style.visibility = "hidden";
    } else if( marker.id_route ===  mhs_tm_map.marker[marker.id_map].length - 1
        && marker.id_marker === mhs_tm_map.marker[marker.id_map]
    [mhs_tm_map.marker[marker.id_map].length - 1].length - 1 ) {
        mhs_tm_map.map[marker.id_map].popup_window.hide_control_arrow( 'right' );
//        document.getElementById('mhs-tm-gmap-popup-window-' + marker.id_map)
//            .getElementsByClassName("mhs-tm-gmap-popup-control-arrow-right")[0]
//            .style.visibility = "hidden";
    }
};

// set bounds of map via path
mhs_tm_map.set_bounds_via_path = function ( map_id, path, map ) {
    var bounds = new google.maps.LatLngBounds();
    var points = path.getPath().getArray();
    for (var n = 0; n < points.length ; n++){
        bounds.extend(points[n]);
    }
    mhs_tm_map.bounds[map_id] = bounds;
    
    map.fitBounds( bounds );
    map.panToBounds( bounds );
};

// set bounds of map via marker
mhs_tm_map.set_bounds_via_marker = function ( map_id, marker, map ) {
    var bounds = new google.maps.LatLngBounds();
    
    for (var n = 0; n < marker.length ; n++){
        bounds.extend( marker[n].getPosition() );
    }
    mhs_tm_map.bounds[map_id] = bounds;
    
    map.fitBounds( bounds );
    map.panToBounds( bounds );
};

// animation if user change to next coordinate
mhs_tm_map.next_coordinate_animation = function ( map_canvas_id, marker, active_coordinate, 
next_route_id, next_coordinate_id, change_bounce ) {
    var wait_time = 1500;
                
    mhs_tm_map.map[map_canvas_id].popup_window.hide();

    mhs_tm_map.set_pop_up_control( marker );
    
    if( change_bounce ) {  
        wait_time = 4000;
        
        ///get bounds of both paths
        var bounds = new google.maps.LatLngBounds();
        var points = mhs_tm_map.route_path[map_canvas_id][active_coordinate.route_id].getPath().getArray();
        for (var n = 0; n < points.length ; n++){
            bounds.extend(points[n]);
        }
        points = mhs_tm_map.route_path[map_canvas_id][next_route_id].getPath().getArray();
        for (var n = 0; n < points.length ; n++){
            bounds.extend(points[n]);
        }
    
        setTimeout( function () {
            mhs_tm_map.map[map_canvas_id].fitBounds( bounds );
            mhs_tm_map.map[map_canvas_id].panToBounds( bounds );
        }, 1000 );
        
        setTimeout( function () {
            mhs_tm_map.set_opacity( mhs_tm_map.marker, mhs_tm_map.route_path, map_canvas_id, 
                'single_marker', marker ); 

            //Set ZIndex for this marker to the highest  single_marker
            marker.setZIndex( google.maps.Marker.MAX_ZINDEX + 2 );
        }, 2000 );
        
        setTimeout( function () {
            // set bounds of map tp path
            mhs_tm_map.set_bounds_via_marker( map_canvas_id, 
                mhs_tm_map.marker[map_canvas_id][next_route_id],
                mhs_tm_map.map[map_canvas_id] );
        }, 3000 );
    } else {
        setTimeout( function () {
            mhs_tm_map.set_opacity( mhs_tm_map.marker, mhs_tm_map.route_path, map_canvas_id, 
                'single_marker', marker ); 

            //Set ZIndex for this marker to the highest  single_marker
            marker.setZIndex( google.maps.Marker.MAX_ZINDEX + 2 );
        }, 600 );
    }

    setTimeout( function () {
        mhs_tm_map.map[map_canvas_id].popup_window.show_loading( 200 );
    }, 1200 );
    
    jQuery( function ( $ ) {
        $.post(
            mhs_tm_map.ajax_url + '?action=get_coordinate_note',
            {
                route_id: marker.note_div_id.route_id,
                marker_id: marker.note_div_id.marker_id,
            },
            function ( response ) {
                $( '#mhs-tm-gmap-popup-window-' + map_canvas_id ).
                    find( '.mhs-tm-gmap-popup-window-content-before' ).
                    html( response );
                            
                active_coordinate.route_id = next_route_id;
                active_coordinate.coordinate_id = next_coordinate_id;
                
                setTimeout( function () {
                    mhs_tm_map.map[map_canvas_id].popup_window.hide_loading( 200 );
                    mhs_tm_map.map[map_canvas_id].popup_window.show( marker.content_string );
                }, wait_time );
            },
            "json"
        );
    });
};

mhs_tm_map.get_route_color = function ( transport_classes, route) {
    var route_color;
    
    if( route.options.hasOwnProperty('transport_class') === false || 
        route.options.transport_class === '' ) {
        if( typeof route.options.route_color !== 'string' || route.options.route_color[0] !== '#' ) {
            route_color = '#000000';
        } else {
            route_color = route.options.route_color;
        }
    } else {
        transport_classes.forEach( function(item, index) {
            if( item.id.toString() === route.options.transport_class.toString() ) {
                route_color = item.color;
            }
        } );
    }
    
    return route_color;
};
