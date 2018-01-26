jQuery( function ( $ ) {
    $( 'option' ).mousedown( function ( e ) {
        var coordinates_all = mhs_tm_app_vars.coordinates_all;
        var map_canvas_id = parseInt( $( '.mhs_tm-map' ).attr( 'id' ).replace( 'mhs_tm_map_canvas_', '' ) );

        e.preventDefault();
        $( this ).prop( 'selected', !$( this ).prop( 'selected' ) );

        mhs_tm_map.coordinates = {};
        mhs_tm_map.coordinates[map_canvas_id] = [];

        $( "select option:selected" ).each( function ()
        {
            mhs_tm_map.coordinates[map_canvas_id].push( coordinates_all[$( this ).val()][0] );//get note content div
        } );
        
        //div for gmaps popup window
         $( ".wrap" ).append( '<div id="mhs-tm-gmap-popup-window-' + map_canvas_id + '" class="mhs-tm-gmap-popup-window"></div>' );

        mhs_tm_map.gmap_initialize( map_canvas_id, 'map' );
        //find popup and will with new note content
        var popup_window_before = $( '#mhs-tm-gmap-popup-window-' + map_canvas_id )
            .find( '.mhs-tm-gmap-popup-window-content-before' );
        //fill with content again
        var html = '';
        for ( var i = 0; i < mhs_tm_map.coordinates[map_canvas_id].length; ++i ) {
            for ( var j = 0; j < mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'].length; ++j ) {
                html = '<div  style="display: none;" id="note_output_' + map_canvas_id + '-' + i +
                    '-' + j + '">' + 
                    mhs_tm_map.coordinates[map_canvas_id][i]['coordinates'][j].note + '</div>';

                $( popup_window_before ).append( html );
            }
        }
    } );
} );