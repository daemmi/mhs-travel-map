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
              
                // customer WP_List_Table object
                public $list_table_map_routes;
                public $list_table_routes;
                public $list_table_maps;
                

		/**
		 * PHP5 style constructor
		 *
		 * @since 1.0
		 * @access public
		 */
		public function __construct() {			
                        add_filter('set-screen-option', [ __CLASS__, 'table_map_routes_set_option' ], 10, 3);
			add_action( 'admin_menu', array( &$this, 'display_admin_menu', ) );
                        add_filter( 'submenu_file', array( &$this, 'mhs_tm_wp_admin_submenu_filter', ) );
		}

		/**
		 * Displays admin menu
		 *
		 * @since 1.0
		 * @access public
		 */
		public function display_admin_menu() {
			global $MHS_TM_Admin_Maps, $MHS_TM_Admin_Routes, 
                                $MHS_TM_Admin_Settings, $MHS_TM_Admin_Map_Edit;

			$hook = add_menu_page(
			__( 'MHS Travel Map', 'MHS_TM' ), 
			__( 'MHS Travel Map', 'MHS_TM' ), 
			'manage_options', 
			'mhs_tm-maps', 
			array(
				&$MHS_TM_Admin_Maps,
				'maps_control',
			), 
			MHS_TM_RELPATH . 'img/Logo.png'
			);
                        add_action( "load-$hook", array( &$this, 'add_options_menu_maps', ) );
			
			$hook = add_submenu_page(
                            'mhs_tm-maps', 
                            __( 'Maps', 'MHS_TM' ), 
                            __( 'Maps', 'MHS_TM' ), 
                            'manage_options', 
                            'mhs_tm-maps', 
                            array(
                                    &$MHS_TM_Admin_Maps,
                                    'maps_control', )
                            );
                        add_action( "load-$hook", array( &$this, 'add_options_menu_maps', ) );
			
			$hook = add_submenu_page(
                            'mhs_tm-maps', 
                            __( 'Map edit', 'MHS_TM' ), 
                            __( 'Map edit', 'MHS_TM' ), 
                            'manage_options', 
                            'mhs_tm-maps-edit', 
                            array(
                                    &$MHS_TM_Admin_Map_Edit,
                                    'maps_edit', )
                            );
                        add_action( "load-$hook", array( &$this, 'add_options_submenu_maps_edit', ) );
                        			
			$hook = add_submenu_page(
			'mhs_tm-maps', 
			__( 'Routes', 'MHS_TM' ), 
			__( 'Routes', 'MHS_TM' ), 
			'manage_options', 
			'mhs_tm-routes', 
			array( 
				&$MHS_TM_Admin_Routes, 
				'routes_control', )
			);
                        add_action( "load-$hook", array( &$this, 'add_options_menu_routes', ) );
			
			add_submenu_page(
			'mhs_tm-maps', 
			__( 'Settings', 'MHS_TM' ),
			__( 'Settings', 'MHS_TM' ), 
			'manage_options', 
			'mhs_tm-settings', 
			array( 
				&$MHS_TM_Admin_Settings, 
				'settings_control', )
			);
		}
                
                /**
                * Removes Submenu from admin menu
                *
                * @since 1.5.0
                * @access public
                */  
                function mhs_tm_wp_admin_submenu_filter( $submenu_file ) {

                    global $plugin_page;

                    $hidden_submenus = array(
                        'mhs_tm-maps-edit' => true,
                    );

                    // Select another submenu item to highlight (optional).
                    if ( $plugin_page && isset( $hidden_submenus[ $plugin_page ] ) ) {
                        $submenu_file = 'mhs_tm-maps';
                    }

                    // Hide the submenu.
                    foreach ( $hidden_submenus as $submenu => $unused ) {
                        remove_submenu_page( 'mhs_tm-maps', $submenu );
                    }

                    return $submenu_file;
                }
                
		/**
                * Add Screen options to page
                *
                * @since 1.5.0
                * @access public
                */                
                function add_options_menu_maps() {
                    $option = 'per_page';
                    $args = array(
                           'label' => 'Maps per page',
                           'default' => 50,
                           'option' => 'mhs_tm_maps_per_page'
                           );
                    add_screen_option( $option, $args );
                    $this->list_table_maps = new List_Table_Maps();
                }
                
                function add_options_submenu_maps_edit() {                            
                    $option = 'per_page';
                    $args = array(
                           'label' => 'Routes per page',
                           'default' => 50,
                           'option' => 'mhs_tm_map_routes_per_page'
                           );
                    add_screen_option( $option, $args );
                    $this->list_table_map_routes = new List_Table_Map_Routes( NULL );
                }
                
                function add_options_menu_routes() {                            
                    $option = 'per_page';
                    $args = array(
                           'label' => 'Routes per page',
                           'default' => 50,
                           'option' => 'mhs_tm_routes_per_page'
                           );
                    add_screen_option( $option, $args );
                    $this->list_table_map_routes = new List_Table_Routes();
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
                
                public static function table_map_routes_set_option($status, $option, $value) {
                    return $value;
                }
               
	}

	// class

endif; // class exists
?>