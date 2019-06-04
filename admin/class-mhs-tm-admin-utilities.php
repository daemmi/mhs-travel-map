<?php

if ( ! class_exists( 'MHS_TM_Admin_Utilities' ) ) :

/**
 * MHS_TM_Admin_Utilities class.
 *
 * This class contains utilitie properties and methods for the backend of the plugin.
 *
 * @package MHS_TM_Admin_Utilities
 * @since 1.0
 */
class MHS_TM_Admin_Utilities {

    /**
     * Funktion to sanitize an id array
     *
     * @since 1.0
     * @access public
     */
    public function sanitize_id_array( $array ) {
		// Initialize the new array that will hold the sanitize values
		$new_input = array();

		if( is_array( $array ) ) {
			// Loop through the input and sanitize each of the values
			foreach( $array as $key => $val ) {

				if( isset( $array[ $key ] ) ) {
					$new_input[ $key ] = (int)sanitize_text_field( $val );
				}
			}
		} else {
			$new_input[0] = (int)sanitize_text_field( $array );
		}
		return $new_input;
	}

    /**
     * Function to get the route class name from the route class id
     *
     * @since 1.5.0
     * @access public
     */
    public function get_route_class_name( $route_class_id ) { 
            global $MHS_TM_Utilities;
            
            $route_classes = $MHS_TM_Utilities->get_plugin_settings();
            $route_classes = $route_classes['transport_classes'];
                
            foreach( $route_classes as $route_class ) {
                if( $route_class['id'] == $route_class_id ) {
                    return $route_class['name'];
                }
            }
            return 'not set';
	}
} // class

endif; // class exists

?>
