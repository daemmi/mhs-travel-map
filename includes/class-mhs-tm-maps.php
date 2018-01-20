<?php

/**
 * MHS_TM_Maps class.
 *
 * This class contains properties and methods for the google maps.
 *
 * @package MHS_TM_Maps
 * @since 1.0
 */
if ( !class_exists( 'MHS_TM_Maps' ) ) :

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
				'map_id'			 => 0,
				'coord_center_lat'	 => 54.0237934,
				'coord_center_lng'	 => 9.3754401,
				'height'			 => 500
			), $atts ) );

			//validate shortcode_atts
			$map_id				 = (int) $map_id;
			$height				 = (int) $height;
			$coord_center_lng	 = (float) $coord_center_lng;
			$coord_center_lat	 = (float) $coord_center_lat;

			$coordinates = array();
			$coordinates = $this->get_coordinates( $map_id, 'map' );

			
			$output = '<div class="mhs_tm-map" id="mhs_tm_map_canvas_' . esc_attr( $map_id ) . '" style="height: ' .
			esc_attr( $height ) . 'px; margin: 0; padding: 0;"></div>';
			//control button for gmaps popup window
			$output .= '<div id="mhs-tm-gmap-show-info-' . esc_attr( $map_id ) . '" 
				class="mhs-tm-gmap-controls mhs-tm-gmap-controls-button">Statistics</div>';
			//div for gmaps popup window
			$output .= '<div id="mhs-tm-gmap-popup-window-' . esc_attr( $map_id ) . '" class="mhs-tm-gmap-popup-window"></div>';

			$key = $MHS_TM_Utilities->get_gmaps_api_key();

			wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=' . $key, true );
			wp_enqueue_script( 'googlemap' );

			wp_enqueue_script( 'mhs_tm_map' );
			wp_localize_script( 'mhs_tm_map', 'mhs_tm_app_vars_' . $map_id, array(
				'coordinates'		 => $coordinates,
				'coord_center_lat'	 => $coord_center_lat,
				'coord_center_lng'	 => $coord_center_lng,
				'auto_load'			 => true,
				'map_id'			 => $map_id,
				'plugin_dir'		 => MHS_TM_RELPATH
			)
			);

			return $output;
		}

		/*		 * ****************************************************************************
		 * Utilities
		 * **************************************************************************** */

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
					'WHERE active = 1 AND id = %d ORDER BY id DESC', (int) $route_id
					) );
					$temp_coordinates	 = json_decode( $temp_coordinates, true );

					if ( $temp_coordinates !== Null ) {
						$route_options	 = array();
						$route_options	 = $wpdb->get_var( $wpdb->prepare(
						'SELECT options FROM ' .
						$wpdb->prefix . 'mhs_tm_routes ' .
						'WHERE active = 1 AND id = %d ORDER BY id DESC', (int) $route_id
						) );
						$route_options	 = json_decode( $route_options, true );

						$coordinates[ $key ][ 'options' ]		 = $this->sanitize_coordinate_option_array( $route_options );
						$coordinates[ $key ][ 'coordinates' ]	 = $this->sanitize_coordinates_array( $temp_coordinates );
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
		public function get_routes_of_map( $map_id ) {
			global $wpdb;

			$route_ids = $wpdb->get_var( $wpdb->prepare(
			'SELECT route_ids FROM ' .
			$wpdb->prefix . 'mhs_tm_maps ' .
			'WHERE active = 1 AND id = %d ORDER BY id DESC', (int) $map_id
			) );

			return json_decode( $route_ids, true );
		}

		/**
		 * Funktion to sanitize a coordinate options array
		 *
		 * @since 1.0
		 * @access public
		 */
		public function sanitize_coordinate_option_array( $array ) {
			global $MHS_TM_Utilities;
			// Initialize the new array that will hold the sanitize values
			$new_input = array();

			if ( is_array( $array ) ) {
				$new_input[ 'path' ]					 = $this->sanitize_path_array( $array[ 'path' ] );
				$new_input[ 'name' ]					 = sanitize_text_field( $array[ 'name' ] );
				$new_input[ 'route_color' ]				 = array_key_exists( 'route_color', $array ) ? 
					sanitize_text_field( $array[ 'route_color' ] ) : '000000';
				$new_input[ 'dis_route_snap_to_road' ]	 = array_key_exists( 'dis_route_snap_to_road', $array ) ?
					$MHS_TM_Utilities->sanitize_checkbox( $array[ 'dis_route_snap_to_road' ] ) : false;
			} else {
				$new_input[ 0 ] = (int) sanitize_text_field( $array );
			}
			return $new_input;
		}

		/**
		 * Funktion to sanitize a coordinate path array
		 *
		 * @since 1.0
		 * @access public
		 */
		public function sanitize_path_array( $array ) {
			// Initialize the new array that will hold the sanitize values
			$new_input = array();

			if ( is_array( $array ) ) {
				// Loop through the input and sanitize each of the values
				foreach ( $array as $key => $val ) {
					if ( isset( $array[ $key ] ) ) {
						if ( is_object( $array[ $key ] ) ) {
							$new_input[ $key ] = (object) array(
								'lat'	 => (float) $val->lat,
								'lng'	 => (float) $val->lng
							);
						} elseif ( is_array( $array[ $key ] ) ) {
							$new_input[ $key ] = (object) array(
								'lat'	 => (float) $val[ 'lat' ],
								'lng'	 => (float) $val[ 'lng' ]
							);
						}
					}
				}
			} else {
				$new_input[ 0 ] = (int) sanitize_text_field( $array );
			}
			return $new_input;
		}

		/**
		 * Funktion to sanitize an coordinates array
		 *
		 * @since 1.0
		 * @access public
		 */
		public function sanitize_coordinates_array( $array ) {
			global $MHS_TM_Utilities;
			/* @var $MHS_TM_Utilities MHS_TM_Utilities */

			// Initialize the new array that will hold the sanitize values
			$new_input = array();

			//filter to increase the allowed tags from wp_kses_post
			$class = new MHS_TM_Utilities();
			add_filter( 'wp_kses_allowed_html', array( $class, 'add_wpkses_tags' ), 10, 2 );

			if ( is_array( $array ) ) {
				// Loop through the input and sanitize each of the values
				foreach ( $array as $key => $val ) {
					if ( isset( $array[ $key ] ) ) {
						if ( is_object( $array[ $key ] ) ) {
							$new_input[ $key ] = (object) array(
								'city'				 => sanitize_text_field( $val->city ),
								'country'			 => sanitize_text_field( $val->country ),
								'ishitchhikingspot'	 => $MHS_TM_Utilities->sanitize_checkbox( $val->ishitchhikingspot ),
								'ispartofaroute'	 => $MHS_TM_Utilities->sanitize_checkbox( $val->ispartofaroute ),
								'latitude'			 => floatval( $val->latitude ),
								'longitude'			 => floatval( $val->longitude ),
								'note'				 => balanceTags( wp_kses_post( $val->note ), true ),
								'starttime'			 => substr( sanitize_text_field( $val->starttime ), 0, 10 ),
								'state'				 => sanitize_text_field( $val->state ),
								'street'			 => sanitize_text_field( $val->street ),
								'waitingtime'		 => intval( $val->waitingtime ),
								'dissnaptoroad'		 => property_exists( $val, 'dissnaptoroad' ) && $val->dissnaptoroad == 1 ? 1 : 0,
								'distance'			 => property_exists( $val, 'distance' ) ? intval( $val->distance ) : false,
							);
						} elseif ( is_array( $array[ $key ] ) ) {
							$new_input[ $key ] = array(
								'city'				 => sanitize_text_field( $val[ 'city' ] ),
								'country'			 => sanitize_text_field( $val[ 'country' ] ),
								'ishitchhikingspot'	 => $MHS_TM_Utilities->sanitize_checkbox( $val[ 'ishitchhikingspot' ] ),
								'ispartofaroute'	 => $MHS_TM_Utilities->sanitize_checkbox( $val[ 'ispartofaroute' ] ),
								'latitude'			 => floatval( $val[ 'latitude' ] ),
								'longitude'			 => floatval( $val[ 'longitude' ] ),
								'note'				 => balanceTags( wp_kses_post( $val[ 'note' ] ), true ),
								'starttime'			 => substr( sanitize_text_field( $val[ 'starttime' ] ), 0, 10 ),
								'state'				 => sanitize_text_field( $val[ 'state' ] ),
								'street'			 => sanitize_text_field( $val[ 'street' ] ),
								'waitingtime'		 => intval( $val[ 'waitingtime' ] ),
								'dissnaptoroad'		 => array_key_exists( 'dissnaptoroad', $val ) && $val[ 'dissnaptoroad' ] == 1 ? 1 : 0,
								'distance'			 => array_key_exists( 'distance', $val ) ? intval( $val[ 'distance' ] ) : false,
							);
						}
					}
				}
			} else {
				$new_input[ 0 ] = (int) sanitize_text_field( $array );
			}
			return $new_input;
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

	}

	// class

endif; // class exists
?>
