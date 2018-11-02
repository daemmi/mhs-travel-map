<?php

/**
 * MHS_TM_Utilities class.
 *
 * This class contains utilitie properties and methods for the plugin.
 *
 * @package MHS_TM_Utilities
 * @since 1.0
 */

if ( ! class_exists( 'MHS_TM_Utilities' ) ) :

class MHS_TM_Utilities {

    /**
     * Funktion to get a loading spinner
     *
     * @since 1.0
     * @access public
     */
    public function loading_spinner() {
            $output = '<div class="sk-fading-circle-background">
							<div class="sk-fading-circle">
								<div class="sk-circle1 sk-circle"></div>
								<div class="sk-circle2 sk-circle"></div>
								<div class="sk-circle3 sk-circle"></div>
								<div class="sk-circle4 sk-circle"></div>
								<div class="sk-circle5 sk-circle"></div>
								<div class="sk-circle6 sk-circle"></div>
								<div class="sk-circle7 sk-circle"></div>
								<div class="sk-circle8 sk-circle"></div>
								<div class="sk-circle9 sk-circle"></div>
								<div class="sk-circle10 sk-circle"></div>
								<div class="sk-circle11 sk-circle"></div>
								<div class="sk-circle12 sk-circle"></div>
							</div>
						</div>';

            return $output;
    }

	/**
	 * Redirect with Post request (Javascript)
	 *
	 * @since 1.0
	 * @access public
	 * @param array $data A singular item Example: array('key1' => 'var1', 'key2' => var2)
	 * @param string $url URL.
	 */
	public function post_redirect( $data, $url ) {
		echo '<form id="myForm" action="' . esc_url( $url ) . '" method="post">';
		foreach ( $data as $a => $b ) {
			echo '<input type="hidden" name="' . esc_attr( $a ) . '" value="' . esc_attr( $b ) . '">';
		}
		echo '</form>';
		echo '<script type="text/javascript">'
		. 'document.getElementById("myForm").submit();'
		. '</script>';
	}

	/**
	 * Get Plugin Settings
	 *
	 * @since 1.0
	 * @access public
	 */
	public function get_plugin_settings() {
		global $wpdb;

		$data	 = $wpdb->get_results(
		'SELECT * FROM ' .
		$wpdb->prefix . 'mhs_tm_maps ' .
		'WHERE id = 1 LIMIT 1', ARRAY_A
		);
		$data	 = $data[ 0 ];

		$json_array = json_decode( $data[ 'options' ], true );					
					
		$json_array['transport_classes'] = json_decode( $json_array['transport_classes'], true );
					
		return $json_array;
	}

	/**
	 * Get Google maps API Key
	 *
	 * @since 1.0
	 * @access public
	 */
	public function get_gmaps_api_key() {
		global $wpdb;

		$settings = $this->get_plugin_settings();

		if( $settings['api_key_gmap'] === null || $settings['api_key_gmap'] == '' ) {
			$key = 'AIzaSyAcxQgsVr_SEK2rUape65zv7v6Jn0ElZHc';
		} else {
			$key = $settings['api_key_gmap'];
		}

		return $key;
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
