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
			foreach ( $array as $key => $val ) {

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
     * Funktion to sanitize a checkbox
     *
     * @since 1.0
     * @access public
     */
    public function sanitize_checkbox( $value ) {
		// Initialize the new array that will hold the sanitize values
		$new_value = array();

		if( (int)$value == 1 || (int)$value == 0 ) {
			$new_value = (int)$value;
		} else {
			$new_value = 0;
		}
		return $new_value;
	}
			
	/**
	 * Funktion to add tags in wp_kses_post
	 *
	 * @since 1.0
	 * @access public
	 */
	function add_wpkses_tags( $tags, $context ) {
		if ( 'post' === $context ) {
			$tags['iframe'] = array(
				'src'             => true,
				'height'          => true,
				'width'           => true,
				'frameborder'     => true,
				'scrolling'       => true,
				'allowfullscreen' => true,
			);
		}
		return $tags;
	}
} // class

endif; // class exists

?>
