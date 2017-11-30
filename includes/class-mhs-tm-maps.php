<?php

/**
 * MHS_TM_Maps class.
 *
 * This class contains properties and methods for the google maps.
 *
 * @package MHS_TM_Maps
 * @since 1.0
 */

if ( ! class_exists( 'MHS_TM_Maps' ) ) :

class MHS_TM_Maps {

    /**
     * Shortcode Funktion to show google maps with the added routes
     *
     * @since 1.0
     * @access public
     */
    public function show_map( $atts = '' ) {
            global $wpdb, $MHS_TM_Utilities;

            extract( shortcode_atts( array(
                    'map_id'            => 0,
                    'coord_center_lat'  => 54.0237934,
                    'coord_center_lng'  => 9.3754401,
                    'height'            => 500
            ), $atts ) );

			//validate shortcode_atts
			$map_id = (int)$map_id;
			$height = (int)$height;
			$coord_center_lng = (float)$coord_center_lng;
			$coord_center_lat = (float)$coord_center_lat;
			
            $coordinates = array();
            $coordinates = $this->get_coordinates($map_id, 'map');
            
            $output = '<div class="mhs_tm-map" id="mhs_tm_map_canvas_' . esc_attr( $map_id ) . '" style="height: ' . 
			esc_attr( $height ) . 'px; margin: 0; padding: 0;"></div>';

			$key = $MHS_TM_Utilities->get_gmaps_api_key();
			
            wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAcxQgsVr_SEK2rUape65zv7v6Jn0ElZHc', true );
            wp_enqueue_script( 'googlemap' );

            wp_enqueue_script( 'mhs_tm_map' );
            wp_localize_script('mhs_tm_map', 'mhs_tm_app_vars_'. $map_id, array(
                    'coordinates' => $coordinates,
                    'coord_center_lat'	=> $coord_center_lat,
                    'coord_center_lng'	=> $coord_center_lng,
                    'auto_load'			=> true,
                    'map_id'			=> $map_id,
                    'plugin_dir'		=> MHS_TM_RELPATH 
                    )
            );

            return $output;
    }
        
/******************************************************************************
 * Utilities
 ******************************************************************************/
         
    /**
     * Funktion to get coordinates by map_id odr route_id
     *
     * @since 1.0
     * @access public
     */
    public function get_coordinates( $id = NULL, $type = 'map' ) {
        global $wpdb;

			$route_ids = array();

			if ( $type == 'map' && $id != NULL ) {
				$route_ids = $this->get_routes_of_map( $id );
			} elseif ( $id != NULL ) {
				$route_ids[ 0 ] = $id;
			}

			$coordinates = array();
			$key		 = 0;
			if ( !$route_ids == Null ) {
				foreach ( $route_ids as $route_id ) {
					$temp_coordinates	 = array();
					$temp_coordinates	 = $wpdb->get_var( $wpdb->prepare( 
					'SELECT coordinates FROM ' .
					$wpdb->prefix . 'mhs_tm_routes ' .
					'WHERE active = 1 AND id = %d ORDER BY id DESC',
					(int)$route_id
					) );
					$temp_coordinates	 = json_decode( $temp_coordinates, true );

					if ( $temp_coordinates !== Null ) {
						$route_options	 = array();
						$route_options	 = $wpdb->get_var( $wpdb->prepare( 
						'SELECT options FROM ' .
						$wpdb->prefix . 'mhs_tm_routes ' .
						'WHERE active = 1 AND id = %d ORDER BY id DESC',
						(int)$route_id
						) );
						$route_options	 = json_decode( $route_options, true );

						$coordinates[ $key ][ 'options' ]		 = $route_options;
						$coordinates[ $key ][ 'coordinates' ]	 = $temp_coordinates;
						$key++;
					}
				}
			}

			return $coordinates;
		}

		/**
	 * get routes of map
	 * 
	 * returns an array of all route ids of a map
	 *
	 * @since 1.0
	 * @access public
	 */
	function get_routes_of_map( $map_id ) {
        global $wpdb;
		
		$route_ids = $wpdb->get_var( $wpdb->prepare( 
			'SELECT route_ids FROM ' .
			$wpdb->prefix.'mhs_tm_maps '.
			'WHERE active = 1 AND id = %d ORDER BY id DESC',
			(int)$map_id
		) );
		
		return json_decode($route_ids, true);
	}
	
	/**
	 * PHP5 style constructor
	 *
	 * @since 1.0
	 * @access public
	 */
	public function __construct() {
		add_shortcode( 'mhs-travel-map', array( $this, 'show_map' ) );	
	}

} // class

endif; // class exists

?>
