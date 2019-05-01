var mhs_tm_map_admin_maps = {
    map_canvas_id : 0,
    gmap_popup_window_loading: 0,
};
    
jQuery( function ( $ ) {   
    mhs_tm_map_admin_maps.map_canvas_id = parseInt( $( '.mhs_tm-map' ).attr( 'id' )
        .replace( 'mhs_tm_map_canvas_', '' ) );
    mhs_tm_map_admin_maps.gmap_popup_window_loading = 
        $( '#mhs-tm-gmap-popup-window-loading-' + mhs_tm_map_admin_maps.map_canvas_id ).clone();  
    
    //set zoom option to 0 to see all routes
     mhs_tm_map.map_options[mhs_tm_map_admin_maps.map_canvas_id]['zoom'] = 0;
     // reinitialize so that the change will be in power
     mhs_tm_map.gmap_initialize( mhs_tm_map_admin_maps.map_canvas_id, 'map' );
    
    $( "#mhs_tm_update_map" ).on( 'click', $( this ), function () {
        var coordinates_all = mhs_tm_app_vars.coordinates_all;
        var map_canvas_id = parseInt( $( '.mhs_tm-map' ).attr( 'id' ).replace( 'mhs_tm_map_canvas_', '' ) );
        mhs_tm_map.coordinates = {};
        mhs_tm_map.coordinates[map_canvas_id] = [];
        
        $( '#mhs_tm_loading_' + map_canvas_id ).show();

        $( "select option:selected" ).each( function ()
        {
            mhs_tm_map.coordinates[map_canvas_id].push( coordinates_all[$( this ).val()][0] );//get note content div
        } );
        
        // control button for gmap
        $( '#mhs_tm_loading_' + map_canvas_id ).append( '<div id="mhs-tm-gmap-show-info-' + map_canvas_id + 
            '"class="mhs-tm-gmap-controls mhs-tm-gmap-controls-button">Info</div>' );
         
        $( ".wrap" ).append( '<div id="mhs-tm-gmap-popup-window-' + map_canvas_id + 
               '" class="mhs-tm-gmap-popup-window"></div>' );
        
        //div for gmaps popup window loading
         $( ".wrap" ).append( 
             $( '#mhs-tm-gmap-popup-window-loading-' + mhs_tm_map_admin_maps.map_canvas_id ).clone() );

        mhs_tm_map.gmap_initialize( map_canvas_id, 'map' );
        
        mhs_tm_utilities.gmaps.popup_control_initialize();
        
        // Event listener fires if map is loaded and hide the loaing overlay
        google.maps.event.addListenerOnce( mhs_tm_map.map[map_canvas_id], 'tilesloaded', function () {
            // do something only the first time the map is loaded
            jQuery( function ( $ ) {
                $( '#mhs_tm_loading_' + map_canvas_id ).slideUp( 1500 );
            } );
        } );
        
    } );
} );