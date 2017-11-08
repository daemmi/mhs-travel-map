jQuery( function ( $ ) {
    $( document ).ready( function () {

        // routes menue functions
        if ( typeof mhs_tm_map.coordinates != 'undefined' ) {
            //in coordinates are all routes directly out off the db
            //save it to a buffer for later
            coordinates_buff = mhs_tm_map.coordinates;
        }
        ;

        $( "#mhs_tm_dialog_info" ).dialog( {
            modal: false,
            autoOpen: false,
            dialogClass: 'ui-dialog_mhs_tm',
            position: { my: "right", at: "right", of: window }
        } );

        $( ".mhs_tm_info" ).on( 'click', $( this ), function () {
            mhs_tm_map.coordinates = [ ];
            mhs_tm_map.coordinates[0] = [ ];
            mhs_tm_map.coordinates[0][0] = [ ];
            
            //get the right route out of the saved routes
            var id_number = $( this ).find( "a" ).attr( 'id' ).replace( /mhs_tm_info_/, '' );
            var result = $.grep( coordinates_buff[0], function ( e ) {
                return e.id == id_number;
            } );
            
            //convert the jason strings
            mhs_tm_map.coordinates[0][0]['coordinates'] = JSON.parse( result[0]['coordinates'] );
            mhs_tm_map.coordinates[0][0]['options'] = JSON.parse( result[0]['options'] );
            
            var window_height = $( window ).height();
            var window_width = $( "#list_table" ).width();
            window_height = window_height * 0.7;
            window_width = window_width * 0.9;

            if ( window_width > 500 ) {
                window_width = 500;
            }
            
            $( "#mhs_tm_map_canvas_0" ).height( window_height );
            $( "#mhs_tm_map_canvas_0" ).width( window_width );

            $( "#mhs_tm_dialog_info" ).dialog( "option", "width", window_width + ( window_width * 0.05 ) );
            $( "#mhs_tm_dialog_info" ).dialog( "open" );
            
            mhs_tm_map.gmap_initialize( 0 );
        } );

    } );
} );