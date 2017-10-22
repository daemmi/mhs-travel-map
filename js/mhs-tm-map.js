// global variables
var map = { };
var marker = { };
var bounds = { };
var coordinates = { };
var coord_center_lat = { };
var coord_center_lng = { };
var auto_load = { };

var dummyPath = [
    new google.maps.LatLng( 0, 0 ),
    new google.maps.LatLng( 0, 0 )
];

var linePath = new google.maps.Polyline( {
    path: dummyPath,
    geodesic: true,
    strokeColor: '#000000',
    strokeOpacity: 1.0,
    strokeWeight: 3
} );

jQuery( function ( $ ) {
    $( document ).ready( function () {

        $( '.mhs_tm-map' ).each( function ( index ) {
            var map_canvas_id = parseInt( $( this ).attr( 'id' ).replace( 'map-canvas_', '' ) );
            coordinates[map_canvas_id] = window["mhs_tm_app_vars_" + map_canvas_id].coordinates;
            coord_center_lat[map_canvas_id] = parseFloat( window["mhs_tm_app_vars_" + map_canvas_id].coord_center_lat );
            coord_center_lng[map_canvas_id] = parseFloat( window["mhs_tm_app_vars_" + map_canvas_id].coord_center_lng );
            auto_load[map_canvas_id] = window["mhs_tm_app_vars_" + map_canvas_id].auto_load;

            if ( auto_load[map_canvas_id] )
            {
                google.maps.event.addDomListener( window, 'load', gmap_initialize( map_canvas_id ) );
            }
        } );
    } );
} );

function gmap_initialize( map_canvas_id ) {
    var mapOptions = {
        center: { lat: coord_center_lat[map_canvas_id], lng: coord_center_lng[map_canvas_id] },
        zoom: 5,
        fullscreenControl: true
    };
    map[map_canvas_id] = new google.maps.Map( document.getElementById( 'map-canvas_' + map_canvas_id ),
        mapOptions );
        
    bounds[map_canvas_id] = new google.maps.LatLngBounds();
    var lines = [ ];
    var mark_counter = 0;
    marker[map_canvas_id] = new Array();
    var last_spot_id = 0;
    var last_mark_id = 0;
    var start_is_set = 0;
    
    for ( var i = 0; i < coordinates[map_canvas_id].length; ++i ) {
        last_spot_id = 0;
        for ( var j = 0; j < coordinates[map_canvas_id][i]['coordinates'].length; ++j ) {
            var lat = parseFloat( coordinates[map_canvas_id][i]['coordinates'][j].latitude );
            var lng = parseFloat( coordinates[map_canvas_id][i]['coordinates'][j].longitude );
            
            if ( isNaN( lat ) || isNaN( lng ) ) {
                break;
            }
            var myLatlng = new google.maps.LatLng( lat, lng );
            var pin = '../wp-content/plugins/mhs-travel-map/img/Pin-Daumen.png';

            bounds[map_canvas_id].extend( myLatlng );

            // check if the coordinate is part of the route then set pin and set flag so that no other coordinate could get start pin
            if ( start_is_set === 0 && coordinates[map_canvas_id][i]['coordinates'][j].ispartofaroute ) {
                start_is_set = 1;
                pin = 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=S|7f7f7f|ffffff';
            } else if ( coordinates[map_canvas_id][i]['coordinates'][j].ispartofaroute ) {
                // if there is a new coordinate on the route change pin of old destination
                if ( last_spot_id != 0 && last_mark_id != 0 && coordinates[map_canvas_id][i]['coordinates'][last_spot_id].ishitchhikingspot ) {
                    var pinIcon = {
                                url: '../wp-content/plugins/mhs-travel-map/img/Pin-Daumen.png'
                              };

                    marker[map_canvas_id][last_mark_id].setIcon( pinIcon );
                } else if ( last_spot_id != 0 && last_mark_id != 0 ) {
                    var pinIcon = {
                                url: '../wp-content/plugins/mhs-travel-map/img/Pin-Star.png'
                              };

                    marker[map_canvas_id][last_mark_id].setIcon( pinIcon );
                }
                // save the id, if the next coordinate is spot again change pin of this one
                last_mark_id = mark_counter;
                last_spot_id = j;
                pin = 'https://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=flag|000000';
            } else if ( !coordinates[map_canvas_id][i]['coordinates'][j].ishitchhikingspot ) {
                pin = '../wp-content/plugins/mhs-travel-map/img/Pin-Star.png';
            } 

            var pinIcon = {
                    url: pin
                  };

            var contentString = get_contentstring_of_coordinate( coordinates[map_canvas_id][i]['coordinates'][j], 
                                                                    coordinates[map_canvas_id][i]['coordinates'] );

            marker[map_canvas_id][mark_counter] = new google.maps.Marker( {
                position: myLatlng,
                map: map[map_canvas_id],
                title: coordinates[map_canvas_id][i]['coordinates'][0].name,
                id: coordinates[map_canvas_id][i]['coordinates'][0].name,
                icon: pinIcon
            } );

            marker[map_canvas_id][mark_counter].infowindow = new google.maps.InfoWindow( {
                content: ""
            } );

            map[map_canvas_id].fitBounds( bounds[map_canvas_id] );
            map[map_canvas_id].panToBounds( bounds[map_canvas_id] );

            bindInfoWindow( marker[map_canvas_id][mark_counter], marker[map_canvas_id], map[map_canvas_id], contentString );
            
            mark_counter++;
        }

        coordinates[map_canvas_id][i]['options']['path'].forEach(function(item, index) {
            lines.push( new google.maps.LatLng( item['lat'], item['lng'] ) );
        } );
        
        linePath[i] = new google.maps.Polyline( {
            path: lines,
            geodesic: true,
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 3
        } );
        
        linePath[i].setMap( map[map_canvas_id] );
    }
    
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
