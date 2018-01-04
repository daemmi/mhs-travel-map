var mhs_tm_map = mhs_tm_map || {};

// global variables
mhs_tm_map = {
    opacity_strength : 0.3,
    map : {},
    marker: [],
    bounds: {},
    coordinates: {},
    coord_center_lat: {},
    coord_center_lng: {},
    auto_load: {},
    plugin_dir: '',
    dummyPath: [
        new google.maps.LatLng( 0, 0 ),
        new google.maps.LatLng( 0, 0 )
    ],
    linePath: []
};

jQuery( function ( $ ) {
    $( '.mhs_tm-map' ).each( function ( index ) {
        var map_canvas_id = parseInt( $( this ).attr( 'id' ).replace( 'mhs_tm_map_canvas_', '' ) );
        mhs_tm_map.coordinates[map_canvas_id] = window["mhs_tm_app_vars_" + map_canvas_id].coordinates;
        mhs_tm_map.coord_center_lat[map_canvas_id] = parseFloat( window["mhs_tm_app_vars_" + map_canvas_id].coord_center_lat );
        mhs_tm_map.coord_center_lng[map_canvas_id] = parseFloat( window["mhs_tm_app_vars_" + map_canvas_id].coord_center_lng );
        mhs_tm_map.auto_load[map_canvas_id] = window["mhs_tm_app_vars_" + map_canvas_id].auto_load;
        mhs_tm_map.plugin_dir = window["mhs_tm_app_vars_" + map_canvas_id].plugin_dir;
        if ( mhs_tm_map.auto_load[map_canvas_id] )
        {
            google.maps.event.addDomListener( window, 'load', mhs_tm_map.gmap_initialize( map_canvas_id ) );
        }
    } );
} );

mhs_tm_map.gmap_initialize = function( map_canvas_id ) {
    var mapOptions = {
        center: { lat: mhs_tm_map.coord_center_lat[map_canvas_id], lng: mhs_tm_map.coord_center_lng[map_canvas_id] },
        zoom: 5,
        fullscreenControl: true
    };
    mhs_tm_map.linePath[map_canvas_id] = [];
    mhs_tm_map.map[map_canvas_id] = new google.maps.Map( document.getElementById( 'mhs_tm_map_canvas_' + map_canvas_id ),
        mapOptions );
        
    mhs_tm_map.bounds[map_canvas_id] = new google.maps.LatLngBounds();
    var mark_counter = 0;
    mhs_tm_map.marker[map_canvas_id] = [];
    var last_spot_id  = 0;
    var last_mark_id  = 0;
    var last_route_id = 0;
    var start_is_set  = 0;
    
    // click on the map sets the opacity of the paths and markers back to 1 and closes the 
    // info window
    google.maps.event.addListener(mhs_tm_map.map[map_canvas_id], "click", function() {
        for ( var i = 0; i < mhs_tm_map.linePath[map_canvas_id].length; ++i ) {
            mhs_tm_map.linePath[map_canvas_id][i].setOptions( { strokeOpacity: 1 } );
            for ( var j = 0; j < mhs_tm_map.marker[map_canvas_id][i].length; ++j ) {
                mhs_tm_map.marker[map_canvas_id][i][j].infowindow.close();
                mhs_tm_map.marker[map_canvas_id][i][j].setOpacity(1);
            }
        }   
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

            mhs_tm_map.bounds[map_canvas_id].extend( myLatlng );

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
                title: mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][0].name,
                id: mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][0].name,
                icon: pinIcon
            } );
            
            mhs_tm_map.marker[map_canvas_id][i][mark_counter].addListener('click', function() {
                mhs_tm_map.set_opacity( mhs_tm_map.marker, mhs_tm_map.linePath, map_canvas_id, 'marker',this );
            } );
            
            mhs_tm_map.marker[map_canvas_id][i][mark_counter].infowindow = new google.maps.InfoWindow( {
                content: ""
            } );

            var contentString = mhs_tm_utilities.coordinate_handling.get_contentstring_of_coordinate( 
                mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j], 
                mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'] );

            mhs_tm_map.map[map_canvas_id].fitBounds( mhs_tm_map.bounds[map_canvas_id] );
            mhs_tm_map.map[map_canvas_id].panToBounds( mhs_tm_map.bounds[map_canvas_id] );

            mhs_tm_map.bind_info_window( mhs_tm_map.marker[map_canvas_id][i][mark_counter], 
            mhs_tm_map.marker[map_canvas_id][i], mhs_tm_map.map[map_canvas_id], contentString );
            
            mark_counter++;
        }
        
        var lines = [];
        mhs_tm_map.coordinates[map_canvas_id][i]['options']['path'].forEach(function(item, index) {
            lines.push( new google.maps.LatLng( item['lat'], item['lng'] ) );
        } );
        
        mhs_tm_map.linePath[map_canvas_id][i] = new google.maps.Polyline( {
            path: lines,
            geodesic: true,
            strokeColor: mhs_tm_map.coordinates[map_canvas_id][i]['options']['route_color'],
            strokeOpacity: 1.0,
            strokeWeight: 3
        } );
        
        mhs_tm_map.linePath[map_canvas_id][i].addListener( 'click', function () {
            mhs_tm_map.set_opacity( mhs_tm_map.marker, mhs_tm_map.linePath, map_canvas_id, 'linePath',this );
        } );

        mhs_tm_map.linePath[map_canvas_id][i].setMap( mhs_tm_map.map[map_canvas_id] );
    }
};

mhs_tm_map.bind_info_window = function( marker, marker_all, map, contentString ) {
    google.maps.event.addListener( marker, 'click', function () {
        for ( var index = 0; index < marker_all.length; ++index ) {
            marker_all[index].infowindow.close();
        }

        marker.infowindow.setContent( contentString );
        marker.infowindow.open( map, marker );
        
    } );
};

mhs_tm_map.set_opacity = function( marker, line_path, map_canvas_id, from_listener, listener ) {
    // change opacity for all path and markers
    for ( var y = 0; y < line_path[map_canvas_id].length; y++ ) {
        // find route id
        if( from_listener === 'linePath' ) { 
            if( listener === line_path[map_canvas_id][y] ) {
                var route_id = y;
            }
        }
        
        line_path[map_canvas_id][y].setOptions( { strokeOpacity: mhs_tm_map.opacity_strength } );
        for ( var j = 0; j < marker[map_canvas_id][y].length; ++j ) {
            // find route id
            if( from_listener === 'marker' ) { 
                if( listener === marker[map_canvas_id][y][j] ) {
                    var route_id = y;
                }
            }
            marker[map_canvas_id][y][j].infowindow.close();
            marker[map_canvas_id][y][j].setOpacity( mhs_tm_map.opacity_strength );
        }
    }

    line_path[map_canvas_id][route_id].setOptions( { strokeOpacity: 1 } );

    for ( var z = 0; z < marker[map_canvas_id][route_id].length; z++ ) {
        marker[map_canvas_id][route_id][z].setOpacity( 1 );
    }
};
