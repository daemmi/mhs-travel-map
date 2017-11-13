<?php

/*
Plugin Name: My Hitchhiking Spot Travel Map (MHS Travel Map)
Plugin URI: 
Description: Create your travel map with use of google maps by adding coordinates to a map, make your route public, write a story for each coordinate and import backup files from the Android app "<a title="My Hitchhiking Spots" href="https://play.google.com/store/apps/details?id=com.myhitchhikingspots" target="_blank" rel="noopener">My Hitchhiking Spots</a>"
Version: 1.0.2
Author: Jonas Damhuis
Author URI: 
License: GPL3
*/

/*  Copyright 2017 Jonas Damhuis  (email : jonas-damhuis@web.de)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 3, as
    published by the Free Software Foundation.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

/**
 * Holds the absolute location of MHS Travel Map
 *
 * @since 1.0.0
 */
if ( ! defined( 'MHS_TM_ABSPATH' ) )
	define( 'MHS_TM_ABSPATH', dirname( __FILE__ ) );

/**
 * Holds the URL of MHS Travel Map
 *
 * @since 1.0.0
 */
if ( ! defined( 'MHS_TM_RELPATH' ) )
	define( 'MHS_TM_RELPATH', plugin_dir_url( __FILE__ ) );

/**
 * Holds the name of the MHS Travel Map directory
 *
 * @since 1.0.0
 */
if ( !defined( 'MHS_TM_DIRNAME' ) )
	define( 'MHS_TM_DIRNAME', basename( MHS_TM_ABSPATH ) );

/**
 * Enqueue the plugin's javascript
 *
 * @since 1.0
 */
function MHS_TM_enqueue() {
	/* register scripts */ 
	wp_register_script( 'google_jsapi','https://www.google.com/jsapi', true ); 
	wp_register_script( 'mhs_tm_map', MHS_TM_RELPATH . 'js/mhs-tm-map.js' ); 
	wp_register_script( 'mhs_tm_utilities', MHS_TM_RELPATH . 'js/mhs-tm-utilities.js', array( 'jquery', 'jquery-ui-dialog' ) );
	    
	/* register styles */
    
	/* enqueue scripts */
	wp_enqueue_script( 'google_jsapi' );
	wp_enqueue_script( 'mhs_tm_utilities' );
    
	/* enqueue stylesheets */
    
}
add_action( 'wp_enqueue_scripts', 'MHS_TM_enqueue' );

function MHS_TM_admin_enqueue() {
	$jqui_params = array(
		'monthNames' => array(
			_x( 'January', 'Months', 'MHS_TM' ),
			_x( 'February', 'Months', 'MHS_TM' ),
			_x( 'March', 'Months', 'MHS_TM' ),
			_x( 'April', 'Months', 'MHS_TM' ),
			_x( 'May', 'Months', 'MHS_TM' ),
			_x( 'June', 'Months', 'MHS_TM' ),
			_x( 'July', 'Months', 'MHS_TM' ),
			_x( 'August', 'Months', 'MHS_TM' ),
			_x( 'September', 'Months', 'MHS_TM' ),
			_x( 'October', 'Months', 'MHS_TM' ),
			_x( 'November', 'Months', 'MHS_TM' ),
			_x( 'December', 'Months', 'MHS_TM' )
		),
		'dayNamesMin' => array(
			_x( 'Sun', 'Weekdays, Shortform', 'MHS_TM' ),
			_x( 'Mon', 'Weekdays, Shortform', 'MHS_TM' ),
			_x( 'Tue', 'Weekdays, Shortform', 'MHS_TM' ),
			_x( 'Wed', 'Weekdays, Shortform', 'MHS_TM' ),
			_x( 'Thu', 'Weekdays, Shortform', 'MHS_TM' ),
			_x( 'Fri', 'Weekdays, Shortform', 'MHS_TM' ),
			_x( 'Sat', 'Weekdays, Shortform', 'MHS_TM' )
		)
	);
	$admin_params = array(
		'strings' => array(
			'btnDeselect' => __( 'Deselect all', 'MHS_TM' ),
			'btnSelect' => __( 'Select all', 'MHS_TM' )
		)
	);
        
	/* register scripts */
	wp_register_script( 'jquery_datetimepicker', MHS_TM_RELPATH . 'js/jquery.datetimepicker.full.min.js', array( 'jquery' ) );
	wp_register_script( 'papaparse', MHS_TM_RELPATH . 'js/papaparse-4.1.2.js', array( 'jquery' ) );
	wp_register_script( 'mhs_tm_admin_import', MHS_TM_RELPATH . 'js/mhs-tm-admin-import.js', array( 'jquery', 'jquery-ui-draggable', 'jquery-ui-accordion', 'jquery-ui-dialog', 'jquery-ui-sortable', 'jquery-ui-datepicker' ) );
	wp_register_script( 'mhs_tm_utilities', MHS_TM_RELPATH . 'js/mhs-tm-utilities.js', array( 'jquery', 'jquery-ui-dialog' ) );
	wp_register_script( 'mhs_tm_admin_maps', MHS_TM_RELPATH . 'js/mhs-tm-admin-maps.js', array( 'jquery', 'jquery-ui-draggable', 'jquery-ui-accordion', 'jquery-ui-dialog', 'jquery-ui-sortable' ) );
	wp_register_script( 'mhs_tm_admin_routes', MHS_TM_RELPATH . 'js/mhs-tm-admin-routes.js', array( 'jquery', 'jquery-ui-dialog' ) );
	wp_register_script( 'google_jsapi','https://www.google.com/jsapi', true ); 
	wp_register_script( 'jquery_ui_touch_punch_min', MHS_TM_RELPATH . 'js/jquery.ui.touch-punch.min.js' );
	wp_register_script( 'mhs_tm_map', MHS_TM_RELPATH . 'js/mhs-tm-map.js' );
	wp_register_script( 'mhs_tm_map_edit', MHS_TM_RELPATH . 'js/mhs-tm-map-edit.js', array( 'jquery', 'jquery-ui-draggable', 'jquery-ui-accordion', 'jquery-ui-dialog', 'jquery-ui-sortable', 'jquery-ui-datepicker' ) );
        
        /* register styles */
	wp_register_style( 'jquery_datetimepicker_style', MHS_TM_RELPATH . 'css/jquery.datetimepicker.min.css' );
	wp_register_style( 'mhs_tm_admin_style', MHS_TM_RELPATH . 'css/mhs-tm-admin.css', false, '1.0.0' );
	wp_register_style( 'mhs_tm_admin_page_style', MHS_TM_RELPATH . 'css/mhs-tm-admin-page.css', false, '1.0.0' );
	wp_register_style( 'mhs_tm_admin_form_style', MHS_TM_RELPATH . 'css/mhs-tm-admin-form.css', false, '1.0.0' );
	wp_register_style( 'mhs_tm_loading_overlay', MHS_TM_RELPATH . 'css/mhs-tm-loading-overlay.css', false, '1.0.0' );
    wp_register_style( 'mhs_tm_admin_jquery_style', MHS_TM_RELPATH . 'css/jquery-ui-1.12.1/jquery-ui.css', false, '1.12.1' );
        
	/* enqueue scripts */
	wp_enqueue_script( 'mhs_tm_utilities' );
	wp_enqueue_script( 'jquery_datetimepicker' );
	wp_enqueue_script( 'papaparse' );
    wp_enqueue_script( 'google_jsapi' );
        
	/* enqueue stylesheets */
	wp_enqueue_style( 'mhs_tm_admin_style' );
	wp_enqueue_style( 'mhs_tm_admin_page_style' );
	wp_enqueue_style( 'mhs_tm_admin_form_style' );
	wp_enqueue_style( 'mhs_tm_loading_overlay' );
	wp_enqueue_style( 'mhs_tm_admin_jquery_style' ); 
	wp_enqueue_style( 'jquery_datetimepicker_style' );        

	/* localize */
        
}
add_action( 'admin_enqueue_scripts', 'MHS_TM_admin_enqueue' );

/**
 * Require needed files
 *
 * @since 1.0
 */
/* core of the plugin, frontend (usually insantiated only once)*/
require_once ( MHS_TM_ABSPATH . '/includes/class-mhs-tm-maps.php' );
// utilities for the plugin
require_once ( MHS_TM_ABSPATH . '/includes/class-mhs-tm-utilities.php' );


/**
 * MHS_TM Objects
 *
 * @global object $MHS_TM
 * @since 1.0
 */
$GLOBALS['MHS_TM_Maps'] = new MHS_TM_Maps();
$GLOBALS['MHS_TM_Utilities'] = new MHS_TM_Utilities();


/**
 * Admin UI
 *
 * @since 1.0
 */
if ( is_admin() ) {
	/* functional classes (usually insantiated only once) */
	require_once( MHS_TM_ABSPATH . '/admin/class-mhs-tm-admin-main.php' );
	require_once( MHS_TM_ABSPATH . '/admin/class-mhs-tm-admin-maps.php' );
	require_once( MHS_TM_ABSPATH . '/admin/class-mhs-tm-admin-routes.php' );
	require_once( MHS_TM_ABSPATH . '/admin/class-mhs-tm-admin-settings.php' );
	require_once( MHS_TM_ABSPATH . '/admin/class-mhs-tm-admin-utilities.php' );

	/* template classes (non-OOP templates are included on the spot) */
	require_once( MHS_TM_ABSPATH . '/templates/class-mhs-tm-admin-page.php' );
	require_once( MHS_TM_ABSPATH . '/templates/class-mhs-tm-admin-form.php' );
        
	/* templates for tables */
	require_once( MHS_TM_ABSPATH . '/admin/tables/list-table-maps.php' );
	require_once( MHS_TM_ABSPATH . '/admin/tables/list-table-routes.php' );
            
	/**
	 * MHS_TM_Admin object
	 *
	 * @since 1.0
	 */
	$GLOBALS['MHS_TM_Admin'] = new MHS_TM_Admin();
	$GLOBALS['MHS_TM_Admin_Maps'] = new MHS_TM_Admin_Maps();
	$GLOBALS['MHS_TM_Admin_Routes'] = new MHS_TM_Admin_Routes();
	$GLOBALS['MHS_TM_Admin_Settings'] = new MHS_TM_Admin_Settings();
	$GLOBALS['MHS_TM_Admin_Utilities'] = new MHS_TM_Admin_Utilities();

	
	
            
	/**
	 * MHS_TM_Admin ajax
	 *
	 * @since 1.0.1
	 */
	add_action( 'wp_ajax_routes_save', array( 'MHS_TM_Admin_Routes', 'routes_save' ) );
}

/**
 * Define globals
 *
 * @since 1.0
 */
$MHS_TM_db_version = "1.0";

/**
 * Installation & Update Routines
 *
 * Creates and/or updates plugin's tables.
 * The install method is only triggered on plugin installation
 * and when the database version number
 * ( "MHS_TM_db_version", see above )
 * has changed.
 *
 * @since 1.0
 */
function MHS_TM_install() {
   global $wpdb, $MHS_TM_db_version;
        
        $installed_ver = get_option( "MHS_TM_db_version" );

		// if the plugin is not installed the db version is false
        if ( $installed_ver === false ) {

                /* SQL statements to create required tables */
                $sql = array();
                $sql[] = "CREATE TABLE " . $wpdb->prefix . "mhs_tm_maps (
                        id int UNSIGNED NOT NULL AUTO_INCREMENT ,
                        active BOOL NOT NULL DEFAULT true,
                        create_date DATETIME NOT NULL DEFAULT 0 ,
                        updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ,
                        route_ids LONGTEXT NOT NULL ,
                        options LONGTEXT NOT NULL ,
                        selected BOOL NOT NULL,
                        PRIMARY KEY  (id)
                );";
                $sql[] = "CREATE TABLE " . $wpdb->prefix . "mhs_tm_routes (
                        id int UNSIGNED NOT NULL AUTO_INCREMENT ,
                        active BOOL NOT NULL DEFAULT true,
                        create_date DATETIME NOT NULL DEFAULT 0 ,
                        updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP ,
                        coordinates LONGTEXT NOT NULL ,
                        options LONGTEXT NOT NULL ,
                        PRIMARY KEY  (id)
                );";

				// insert in maps table first row for settings of the plugin
				// activeis set to 0 so this map is actually deleted
				$wpdb->insert(
				$wpdb->prefix . 'mhs_tm_maps', array(
					'active'		 => 0,
					'options'		 => ''
				), array( '%d', '%s' )
				);
				
                require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
                dbDelta( $sql );

                add_option( 'MHS_TM_db_version', $MHS_TM_db_version ); 
        }   
		update_option( 'MHS_TM_db_version', $MHS_TM_db_version );   
        register_uninstall_hook( __FILE__, 'MHS_TM_uninstall' );
}
register_activation_hook( __FILE__, 'MHS_TM_install' );

/**
 * Update Routine
 *
 * Checks if the databse is newer and will run the install routine again.
 *
 * @since 1.0
 */
function MHS_TM_update_db_check() {
    global $MHS_TM_db_version;
    if ( get_site_option( 'MHS_TM_db_version' ) != $MHS_TM_db_version ) {
        MHS_TM_install();
    }
}
add_action( 'plugins_loaded', 'MHS_TM_update_db_check' );

/**
 * Uninstall Routine
 *
 * Delete the added Database tables
 *
 * @since 1.0
 */
function MHS_TM_uninstall(){
    // drop a custom database table
    global $wpdb;
    
    delete_option( 'MHS_TM_db_version' );
    $wpdb->query("DROP TABLE IF EXISTS " . $wpdb->prefix . "mhs_tm_routes");
    $wpdb->query("DROP TABLE IF EXISTS " . $wpdb->prefix . "mhs_tm_maps");
}

?>