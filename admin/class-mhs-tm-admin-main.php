<?php

/**
 * MHS_TM_Admin class.
 *
 * This class contains properties and methods to set up
 * the administration backend.
 *
 * @package MHS Travel Map
 * @since 1.0
 */
if ( !class_exists( 'MHS_TM_Admin' ) ) :

	class MHS_TM_Admin {

		/**
		 * Displays admin menu
		 *
		 * @since 1.0
		 * @access public
		 */
		public function display_admin_menu() {
			Global $MHS_TM_Admin_Maps, $MHS_TM_Admin_Routes, $MHS_TM_Admin_Settings;

			add_menu_page(
			__( 'MHS Travel Map', 'MHS_TM' ), 
			__( 'MHS Travel Map', 'MHS_TM' ), 
			'manage_options', 
			'MHS_TM-maps', 
			array(
				&$MHS_TM_Admin_Maps,
				'maps_control',
			), 
			MHS_TM_RELPATH . 'img/Logo.png'
			);
			
			add_submenu_page(
			'MHS_TM-maps', 
			__( 'Maps', 'MHS_TM' ), 
			__( 'Maps', 'MHS_TM' ), 
			'manage_options', 
			'MHS_TM-maps', 
			array(
				&$MHS_TM_Admin_Maps,
				'maps_control', )
			);
			
			add_submenu_page(
			'MHS_TM-maps', 
			__( 'Routes', 'MHS_TM' ), 
			__( 'Routes', 'MHS_TM' ), 
			'manage_options', 
			'MHS_TM-routes', 
			array( 
				&$MHS_TM_Admin_Routes, 
				'routes_control', )
			);
			
			add_submenu_page(
			'MHS_TM-maps', 
			__( 'Settings', 'MHS_TM' ),
			__( 'Settings', 'MHS_TM' ), 
			'manage_options', 
			'MHS_TM-settings', 
			array( 
				&$MHS_TM_Admin_Settings, 
				'settings_control', )
			);
		}

		/**
		 * Converts message arrays into html output
		 *
		 * @since 1.0
		 * @access public
		 */
		public function convert_messages( $messages = array() ) {
			$output = '';

			foreach ( $messages as $message ) {
				$output .= '<div class="' . $message['type'] . '"><p>' .
				$message['message'] .
				'</p></div>';
			}

			return $output;
		}

		/**
		 * PHP4 style constructor
		 *
		 * @since 1.0
		 * @access public
		 */
		public function MHS_TM_Admin() {
			$this->__construct();
		}

		/**
		 * PHP5 style constructor
		 *
		 * @since 1.0
		 * @access public
		 */
		public function __construct() {
			add_action( 'admin_menu', array( &$this, 'display_admin_menu', ) );
		}
	}

	// class

endif; // class exists
?>