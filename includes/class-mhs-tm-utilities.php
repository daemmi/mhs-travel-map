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
    public function Loading_Spinner() {
            $output = '<div class="sk-fading-circle">
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
		echo '<form id="myForm" action="' . $url . '" method="post">';
		foreach ( $data as $a => $b ) {
			echo '<input type="hidden" name="' . htmlentities( $a ) . '" value="' . htmlentities( $b ) . '">';
		}
		echo '</form>';
		echo '<script type="text/javascript">'
		. 'document.getElementById("myForm").submit();'
		. '</script>';
	}

} // class

endif; // class exists

?>
