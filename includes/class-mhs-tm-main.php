<?php

/**
 * MHS_TM class.
 *
 * This class holds all MHS_TM components.
 *
 * @package MHS Travel Map
 * @since 1.0
 */

if ( ! class_exists( 'MHS_TM' ) ) :

class MHS_TM {

	/**
	 * Initializes the plugin
	 *
	 * @since 1.0
	 * @access public
	 */
	public function init() {
		/* add multilinguality support */
		load_plugin_textdomain( 'MHS_TM', false, MHS_TM_DIRNAME . '/languages/' );

		/* MHS_TM @global objects (these need to be accessible from other classes) */

		/* HHH MGMT's objects */
	}

	/**
	 * PHP4 style constructor
	 *
	 * @since 1.0
	 * @access public
	 */
	public function MHS_TM() {
		$this->__construct();
	}

	/**
	 * PHP5 style constructor
	 *
	 * @since 1.0
	 * @access public
	 */
	public function __construct() {
		add_action( 'init', array( &$this, 'init' ) );
	}
} // class

endif; // class exists

?>