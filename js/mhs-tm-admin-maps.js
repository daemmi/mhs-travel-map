jQuery( function ( $ ) {

    $( document ).ready( function () {

        $( 'option' ).mousedown( function ( e ) {
            var coordinates_all = mhs_tm_app_vars.coordinates_all;
            var map_canvas_id = parseInt( $( '.mhs_tm-map' ).attr( 'id' ).replace( 'mhs_tm_map_canvas_', '' ) );
            
            e.preventDefault();
            $( this ).prop( 'selected', !$( this ).prop( 'selected' ) );

            mhs_tm_map.coordinates = {};
            mhs_tm_map.coordinates[map_canvas_id] = [];

            $( "select option:selected" ).each( function ()
            {
                mhs_tm_map.coordinates[map_canvas_id].push( coordinates_all[$( this ).val()][0] );
            } );

            google.maps.event.addDomListener( window, 'load', mhs_tm_map.gmap_initialize( map_canvas_id ) );
        } );

    } );
} );