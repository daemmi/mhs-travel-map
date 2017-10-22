jQuery( function ( $ ) {
    var coordinates_all = mhs_tm_app_vars.coordinates_all;

    $( document ).ready( function () {

        var map_canvas_id = parseInt( $( '.mhs_tm-map' ).attr( 'id' ).replace( 'map-canvas_', '' ) );

        $( 'option' ).mousedown( function ( e ) {
            e.preventDefault();
            $( this ).prop( 'selected', !$( this ).prop( 'selected' ) );

            coordinates = { };
            coordinates[map_canvas_id] = [ ];

            $( "select option:selected" ).each( function ()
            {
                coordinates[map_canvas_id].push( coordinates_all[$( this ).val()][0] );
            } );

            google.maps.event.addDomListener( window, 'load', gmap_initialize( map_canvas_id ) );
        } );

    } );
} );