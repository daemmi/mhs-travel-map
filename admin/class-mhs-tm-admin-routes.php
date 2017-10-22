<?php

/**
 * MHS_TM_Admin_Routes class.
 *
 * This class contains properties and methods for
 * the creation of new route.
 *
 * @since 1.0
 */
if ( !class_exists( 'MHS_TM_Admin_Routes' ) ) :

	class MHS_TM_Admin_Routes {
		/* CONTROLLERS */

		/**
		 * Routes control function
		 *
		 * @since 1.0
		 * @access public
		 */
		public function routes_control() {

			$messages = array();

			$todo = isset( $_GET[ 'todo' ] ) ? $_GET[ 'todo' ] : 'default';

			switch ( $todo ) {

				case "delete":
					// delete are defined in list_table_aps.php
					break;

				case "save":
					$this->routes_save( $_GET[ 'id' ] );
					break;

				case "edit":
					$this->routes_edit( $_GET[ 'id' ] );
					break;

				case "new":
					$this->routes_edit();
					break;

				case "import":
					$this->routes_import();
					break;

				default:
					$this->routes_menu();
			}
		}

		/**
		 * Routes administration menu
		 *
		 * @since 1.0
		 * @access private
		 */
		private function routes_menu( $messages = NULL ) {
			global $wpdb, $MHS_TM_Admin_Settings;
			$table_name = $wpdb->prefix . 'mhs_tm_routes';

			$url	 = 'admin.php?page=MHS_TM-routes';
			$height	 = 10;

			$adminpage = new MHS_TM_Admin_Page( array(
				'title'		 => __( 'Overview Routes', 'mhs_tm' ),
				'messages'	 => $messages,
				'url'		 => $url
			) );

			$routes = $wpdb->get_results(
			"SELECT * FROM " . $table_name .
			" WHERE active = 1 order by updated DESC", ARRAY_A
			);

			$button = '<form method="post" action="' . $url . '&todo=new">' .
			'<input type="submit" style="margin-right: 6px;" class="mhs_tm_prim_button button" value="+ ' . __( 'add new route', 'mhs_tm' ) . '" />' .
			'</form>';

			$button2 = '<form method="post" action="' . $url . '&todo=import">' .
			'<input type="submit" class="mhs_tm_prim_button button" value="+ ' . __( 'import new route(s)', 'mhs_tm' ) . '" />' .
			'</form>';

			// create table class="mhs_tm_button-primary"
			//Create an instance of our package class...
			$ListTable = new List_Table_Routes();
			//Fetch, prepare, sort, and filter our data...
			$ListTable->prepare_items();

			echo $adminpage->top();
			echo '<br />' . $button . $button2 . '<br /> <br /> ' .
			'<!-- Forms are NOT created automatically, so you need to wrap the table in one to use features like bulk actions -->
                     <form id="list_table" method="get">
                     <!-- For plugins, we also need to ensure that the form posts back to our current page -->
                     <input type="hidden" name="page" value="' . $_REQUEST[ 'page' ] . '" />
                     <!-- Now we can render the completed list table -->';
//                echo $ListTable->search_box( 'search', 'search_id' );
			echo $ListTable->display();
			echo '</form>' .
			'<br />' . $button .
			$adminpage->bottom();

			echo '<div style="display: none;" id="dialog_info" title="Info" >'
			. '<div class="mhs_tm-map" id="map-canvas_0" style="height: ' . $height . 'px; margin-right: auto ; margin-left: auto ; padding: 0;"></div>'
			. '</div>';

			$key = $MHS_TM_Admin_Settings->get_gmaps_api_key();
			
			wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=' . $key, true );
			wp_enqueue_script( 'googlemap' );
			
			wp_enqueue_script( 'mhs_tm_map' );
			wp_localize_script( 'mhs_tm_map', 'mhs_tm_app_vars_0', array(
				'coordinates'		 => $routes,
				'coord_center_lat'	 => 54.023884,
				'coord_center_lng'	 => 9.377068,
				'auto_load'			 => false,
				'map_id'			 => 0
			)
			);

			wp_enqueue_script( 'mhs_tm_admin_routes' );
		}

		/**
		 * Routes edit menu
		 *
		 * @since 1.0
		 * @access private
		 */
		private function routes_edit( $id = NULL ) {
			global $wpdb, $MHS_TM_Maps, $MHS_TM_Admin, $MHS_TM_Admin_Settings, $MHS_TM_Utilities;
			$table_name = $wpdb->prefix . 'mhs_tm_routes';

			$url		 = 'admin.php?page=MHS_TM-routes';
			$form_action = "javascript:void(0);";

			$routes = $wpdb->get_results(
			"SELECT * FROM " . $table_name .
			" WHERE id = " . $id . " order by create_date DESC", ARRAY_A
			);

			$route_option_string = $routes[ 0 ][ 'options' ];
			$route_options		 = array();
			$route_options		 = json_decode( $route_option_string, true );
			$name				 = $route_options[ 'name' ];

			if ( !is_numeric( $id ) ) {
				$title	 = sprintf( __( 'Add New Route', 'mhs_tm' ) );
				$fields	 = $this->routes_fields();
			} else {
				$title	 = sprintf( __( 'Edit &quot;%s&quot;', 'mhs_tm' ), $name );
				$fields	 = $this->routes_fields( $id );
			}

			$adminpage = new MHS_TM_Admin_Page( array(
				'title'	 => $title,
				'url'	 => $url
			) );
			
			$custom_buttons = array(
				'<input type="submit" class="button-secondary margin" value="' . __( 'update map', 'mhs_tm' ) . '" />'
			);

			$args	 = array(
				'echo'			 => false,
				'form'			 => true,
				'js'			 => true,
				'metaboxes'		 => true,
				'action'		 => $form_action,
				'id'			 => $id,
				'back'			 => true,
				'custom_buttons' => $custom_buttons,
				'back_url'		 => $url,
				'fields'		 => $fields,
				'bottom_button'	 => true,
				'hide'			 => true
			);
			$form	 = new MHS_TM_Admin_Form( $args );

			$coordinates = array();
			$coordinates = $MHS_TM_Maps->get_coordinates( $id, 'route' );
			
			// if coordinates array is empty create a dumy for js functions
			if( empty($coordinates) ) {
				$coordinates = [];
				$coordinates[0] = [];
				$coordinates[0]['coordinates'] = [];
			}
			
			$height		 = 500;

			$output .= '<div id="map-canvas_0" style="height: ' . $height . 'px; margin: 0; padding: 0;"></div>';

			echo $adminpage->top();
			// Make an div over the whole content when loading the page
			echo '<div id="wrap_content">
					<div id="loading">' . 
						$MHS_TM_Utilities->Loading_Spinner()
					. '</div>';
			echo $output;
			echo $form->output();
			echo $adminpage->bottom();
			
			// jquery normal dialogs
			echo '<div style="display: none;" id="dialog_loading" title="Loading..." >'
			. $MHS_TM_Utilities->Loading_Spinner()
			. '</div>';
			
			// Error or Update Message to set by jquery
			echo '<div id="dialog_message" class="updated" style="display: none;"><p>TEXT</p></div>';
			
			echo '<div style="display: none;" id="wp_editor_dialog_div" title="Route note" >';
			$content	 = '';
			$editor_id	 = 'wp_editor_dialog';
			$settings	 = array(
				'wpautop'		 => true, // use wpautop?
				'media_buttons'	 => true, // show insert/upload button(s)
				'textarea_name'	 => $editor_id, // set the textarea name to something different, square brackets [] can be used here
				'textarea_rows'	 => get_option( 'default_post_edit_rows', 10 ), // rows="..."
				'tabindex'		 => '',
				'editor_css'	 => '', // intended for extra styles for both visual and HTML editors buttons, needs to include the <style> tags, can use "scoped".
				'editor_class'	 => '', // add extra class(es) to the editor textarea
				'teeny'			 => false, // output the minimal editor config used in Press This
				'dfw'			 => false, // replace the default fullscreen with DFW (supported on the front-end in WordPress 3.4)
				'tinymce'		 => true, // load TinyMCE, can be used to pass settings directly to TinyMCE using an array()
				'quicktags'		 => true // load Quicktags, can be used to pass settings directly to Quicktags using an array()
			);
			wp_editor( $content, $editor_id, $settings );
			echo '</div>';
			echo '</div>';

			// enqueue, register, localize javascript
			wp_enqueue_script( 'mhs_tm_admin_routes' );

			$key = $MHS_TM_Admin_Settings->get_gmaps_api_key();

			wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=' . $key . '&libraries=drawing', true );
			wp_enqueue_script( 'googlemap' );
			
			wp_enqueue_script( 'mhs_tm_map_edit' );
			wp_localize_script( 'mhs_tm_map_edit', 'mhs_tm_app_vars', array(
				'coordinates'		 => $coordinates,
				'coord_center_lat'	 => 54.023884,
				'coord_center_lng'	 => 9.377068,
				'auto_load'			 => true
			) );

			wp_enqueue_script( 'jquery_ui_touch_punch_min' );
		}

		/**
		 * Routes import menu
		 *
		 * @since 1.0
		 * @access private
		 */
		private function routes_import( $id = NULL ) {
			global $wpdb, $MHS_TM_Admin_Settings, $MHS_TM_Utilities;
			$table_name = $wpdb->prefix . 'mhs_tm_routes';

			$url		 = 'admin.php?page=MHS_TM-routes';
			$form_action = '';
			$title		 = sprintf( __( 'Import new Route(s)', 'mhs_tm' ) );

			$button			 = '<input id="start_import" type="submit" disabled="disabled" style="margin-right: 6px;" class="mhs_tm_prim_button button" value="+ ' . __( 'Start import', 'mhs_tm' ) . '" />';
			$button_save_all = '<input id="save_all" type="submit" style="margin-right: 6px; display:none;" class="mhs_tm_prim_button button" value="+ ' . __( 'Save all listed routes', 'mhs_tm' ) . '" />';

			$adminpage = new MHS_TM_Admin_Page( array(
				'title'	 => $title,
				'url'	 => $url
			) );

			$args	 = array(
				'echo'		 => false,
				'form'		 => true,
				'js'		 => false,
				'metaboxes'	 => true,
				'action'	 => $form_action,
				'id'		 => $id,
				'back'		 => true,
				'back_url'	 => $url,
				'has_cap'	 => false,
				'button'	 => 'Start import',
				'fields'	 => $this->routes_import_fields()
			);
			$form	 = new MHS_TM_Admin_Form( $args );

			echo $adminpage->top();
			echo $form->output();
			echo $button . $button_save_all . '<br / style="clear: both;"> ';
			echo '<div style="display: none;" id="dialog_overrun" title="Warning..." >'
			. '<p>Too many routes in file. Please choose a date earlier to load the rest routes!</p>'
			. '</div>';
			echo '<div style="display: none;" id="dialog_loading" title="Loading..." >'
			. $MHS_TM_Utilities->Loading_Spinner()
			. '</div>';
			echo '<div id="poststuff" class="noflow"> '
			. '<div id="post-body" class="metabox-holder columns-1">'
			. '<div id="list" class="postbox-container"> </div> </div> </div>';

			echo $adminpage->bottom();

			wp_enqueue_script( 'mhs_tm_admin_import' );

			$key = $MHS_TM_Admin_Settings->get_gmaps_api_key();

			wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=' . $key, true );
			wp_enqueue_script( 'googlemap' );

			wp_enqueue_script( 'mhs_tm_map' );
			wp_localize_script( 'mhs_tm_map', 'mhs_tm_app_vars_0', array(
				'coordinates'		 => 'Nichts',
				'coord_center_lat'	 => 46.3682855,
				'coord_center_lng'	 => 14.4170272,
				'auto_load'			 => false
			)
			);
		}

		/**
		 * Routes import fields
		 *
		 * @since 1.0
		 * @access private
		 */
		private function routes_import_fields( $id = NULL ) {
			global $wpdb;

			$routes_fields = array(
				array(
					'title'	 => __( 'The Import Options', 'mhs_tm' ),
					'fields' => array(
						array(
							'type'	 => 'csv-file-upload',
							'label'	 => __( 'The *.csv file from MyHitchhikingSpots', 'mhs_tm' ),
							'id'	 => 'csv-file',
							'desc'	 => __( 'Select the file from your filesystem', 'mhs_tm' )
						),
						array(
							'type'	 => 'datepicker',
							'label'	 => __( 'Start date', 'mhs_tm' ),
							'id'	 => 'start_date',
							'desc'	 => __( 'From which day you would like to import? If you leave it blank it will start with the first entry in file.', 'mhs_tm' )
						),
						array(
							'type'	 => 'datepicker',
							'label'	 => __( 'End date', 'mhs_tm' ),
							'id'	 => 'end_date',
							'desc'	 => __( 'To which day you would like to import? If you leave it blank it will import t the last entr in file.', 'mhs_tm' )
						)
					)
				)
			);

			return $routes_fields;
		}

		/**
		 * Routes fields
		 *
		 * @since 1.0
		 * @access private
		 */
		private function routes_fields( $id = NULL ) {
			global $wpdb;

			// static route fields
			$routes_fields = array(
				array(
					'title'	 => __( 'The Route', 'mhs_tm' ),
					'class'	 => 'sortable_disabled',
					'fields' => array(
						array(
							'type'	 => 'text_long',
							'label'	 => __( 'Name of Route', 'mhs_tm' ),
							'id'	 => 'name',
							'desc'	 => __( 'The name or title of the route.', 'mhs_tm' )
						),
						array(
							'type'	 => 'hidden',
							'hidden' => true,
							'id'	 => 'todo_check',
							'value'	 => 'check'
						)
					)
				)
			);

			// But a none displayed coordinate to the top as place holder to copy via JS
			$coordinate_id = 'X';
			array_push( $routes_fields, array(
				'title'		 => __( 'Coordinate ' . $coordinate_id, 'mhs_tm' ),
				'class'		 => 'closed coordinate_new',
				'display'	 => 'none',
				'fields'	 => array(
					//!!! No _ in id !!!
					array(
						'type'	 => 'text_long',
						'label'	 => __( 'Country', 'mhs_tm' ),
						'id'	 => 'country_' . $coordinate_id,
						'desc'	 => __( 'The country name of the coordinate.', 'mhs_tm' )
					),
					array(
						'type'	 => 'text_long',
						'label'	 => __( 'State', 'mhs_tm' ),
						'id'	 => 'state_' . $coordinate_id,
						'desc'	 => __( 'The state name of the coordinate.', 'mhs_tm' )
					),
					array(
						'type'	 => 'text_long',
						'label'	 => __( 'City', 'mhs_tm' ),
						'id'	 => 'city_' . $coordinate_id,
						'desc'	 => __( 'The city name of the coordinate.', 'mhs_tm' )
					),
					array(
						'type'	 => 'html_div',
						'label'	 => __( 'Note', 'mhs_tm' ),
						'id'	 => 'note_' . $coordinate_id,
						'desc'	 => __( 'The note of the coordinate. <a href="javascript:void(0);" class="note_edit"> Click to edit. </a>', 'mhs_tm' )
					),
					array(
						'type'	 => 'text_long',
						'label'	 => __( 'Latitude', 'mhs_tm' ),
						'id'	 => 'latitude_' . $coordinate_id,
						'desc'	 => __( 'The latitude of the coordinate.', 'mhs_tm' )
					),
					array(
						'type'	 => 'text_long',
						'label'	 => __( 'Longitude', 'mhs_tm' ),
						'id'	 => 'longitude_' . $coordinate_id,
						'desc'	 => __( 'The longitude of the coordinate.', 'mhs_tm' )
					),
					array(
						'type'	 => 'text_long',
						'label'	 => __( 'Waiting time', 'mhs_tm' ),
						'id'	 => 'waitingtime_' . $coordinate_id,
						'desc'	 => __( 'The waiting time at the spot for the next ride (If it is a hitchhikig spot).', 'mhs_tm' )
					),
					array(
						'type'	 => 'text_long',
						'label'	 => __( 'Country code', 'mhs_tm' ),
						'id'	 => 'countrycode_' . $coordinate_id,
						'desc'	 => __( 'The country code from the country where the  coordinate is located. <br>
										The two letters of the ISO code. <a href="https://www.countrycode.org/"> 
										Click for mir information. </a>', 'mhs_tm' )
					),
					array(
						'type'	 => 'checkbox',
						'label'	 => __( 'Hitchhiking spot?', 'mhs_tm' ),
						'id'	 => 'ishitchhikingspot_' . $coordinate_id,
						'desc'	 => __( 'Is this a hitchhiking spot? <br>
										If so, the pin in the map will be different.', 'mhs_tm' )
					),
					array(
						'type'	 => 'checkbox',
						'label'	 => __( 'Part of the route?', 'mhs_tm' ),
						'id'	 => 'ispartofaroute_' . $coordinate_id,
						'desc'	 => __( 'Is this ccoordinate part of the route? <br>
										If not, the line will not connect this coordinate and the pin will be different.', 'mhs_tm' )
					),
					array(
						'type'	 => 'datetimepicker',
						'label'	 => __( 'Time', 'mhs_tm' ),
						'id'	 => 'starttime_' . $coordinate_id,
						'desc'	 => __( 'The start time of the coordinate.', 'mhs_tm' )
					)
				)
			) );

			if ( is_numeric( $id ) ) {

				$data	 = $wpdb->get_results(
				"SELECT * FROM " .
				$wpdb->prefix . "mhs_tm_routes " .
				"WHERE id = " . $id . " LIMIT 1", ARRAY_A
				);
				$data	 = $data[ 0 ];

				// Load Option JSON data
				$json_array = json_decode( $data[ 'options' ], true );
				if ( !empty( $json_array ) ) {
					$json_array_keys = array_keys( $json_array );
					$json_id		 = 0;
					foreach ( $json_array as $json ) {
						$data[ $json_array_keys[ $json_id ] ]	 = $json;
						$json_id								 = $json_id + 1;
					}
				}

				// Load Coordinates JSON data
				$json_array_coordinates = json_decode( $data[ 'coordinates' ], true );

				$coordinate_id = 0;
				if ( is_array( $json_array_coordinates ) && count( $json_array_coordinates ) > 0 ) {
					foreach ( $json_array_coordinates as $json_array_coordinate ) {
						$json_array_keys = array_keys( $json_array_coordinate );

						$json_id		 = 0;
						$coordinate_id	 = $coordinate_id + 1;
						array_push( $routes_fields, array(
							'title'	 => __( 'Coordinate ' . $coordinate_id, 'mhs_tm' ),
							'class'	 => 'closed coordinate',
							'fields' => array(
								//!!! No _ in id !!!
								array(
									'type'	 => 'text_long',
									'label'	 => __( 'Country', 'mhs_tm' ),
									'id'	 => 'country_' . $coordinate_id,
									'desc'	 => __( 'The country name of the coordinate.', 'mhs_tm' )
								),
								array(
									'type'	 => 'text_long',
									'label'	 => __( 'State', 'mhs_tm' ),
									'id'	 => 'state_' . $coordinate_id,
									'desc'	 => __( 'The state name of the coordinate.', 'mhs_tm' )
								),
								array(
									'type'	 => 'text_long',
									'label'	 => __( 'City', 'mhs_tm' ),
									'id'	 => 'city_' . $coordinate_id,
									'desc'	 => __( 'The city name of the coordinate.', 'mhs_tm' )
								),
								array(
									'type'	 => 'html_div',
									'label'	 => __( 'Note', 'mhs_tm' ),
									'id'	 => 'note_' . $coordinate_id,
									'desc'	 => __( 'The note of the coordinate. <a href="javascript:void(0);" class="note_edit"> Click to edit. </a>', 'mhs_tm' )
								),
								array(
									'type'	 => 'text_long',
									'label'	 => __( 'Latitude', 'mhs_tm' ),
									'id'	 => 'latitude_' . $coordinate_id,
									'desc'	 => __( 'The latitude of the coordinate.', 'mhs_tm' )
								),
								array(
									'type'	 => 'text_long',
									'label'	 => __( 'Longitude', 'mhs_tm' ),
									'id'	 => 'longitude_' . $coordinate_id,
									'desc'	 => __( 'The longitude of the coordinate.', 'mhs_tm' )
								),
								array(
									'type'	 => 'text_long',
									'label'	 => __( 'Waiting time', 'mhs_tm' ),
									'id'	 => 'waitingtime_' . $coordinate_id,
									'desc'	 => __( 'The waiting time at the spot for the next ride (If it is a hitchhikig spot).', 'mhs_tm' )
								),
								array(
									'type'	 => 'text_long',
									'label'	 => __( 'Country code', 'mhs_tm' ),
									'id'	 => 'countrycode_' . $coordinate_id,
									'desc'	 => __( 'The country code from the country where the  coordinate is located. <br>
													The two letters of the ISO code. <a href="https://www.countrycode.org/"> 
													Click for more information. </a>', 'mhs_tm' )
								),
								array(
									'type'	 => 'checkbox',
									'label'	 => __( 'Hitchhiking spot?', 'mhs_tm' ),
									'id'	 => 'ishitchhikingspot_' . $coordinate_id,
									'desc'	 => __( 'Is this a hitchhiking spot? <br>
													If so, the pin in the map will be different.', 'mhs_tm' )
								),
								array(
									'type'	 => 'checkbox',
									'label'	 => __( 'Part of the route?', 'mhs_tm' ),
									'id'	 => 'ispartofaroute_' . $coordinate_id,
									'desc'	 => __( 'Is this ccoordinate part of the route? <br>
													If not, the line will not connect this coordinate and the pin will be different.', 'mhs_tm' )
								),
								array(
									'type'	 => 'datetimepicker',
									'label'	 => __( 'Time', 'mhs_tm' ),
									'id'	 => 'starttime_' . $coordinate_id,
									'desc'	 => __( 'The start time of the coordinate.', 'mhs_tm' )
								)
							)
						)
						);

						foreach ( $json_array_coordinate as $json ) {
							$date_key			 = $json_array_keys[ $json_id ] . '_' . $coordinate_id;
							$data[ $date_key ]	 = $json;
							$json_id			 = $json_id + 1;
						}
					}
				}
				
				$mcount = count( $routes_fields );
				for ( $i = 0; $i < $mcount; $i++ ) {
					$fcount = count( $routes_fields[ $i ][ 'fields' ] );
					for ( $j = 0; $j < $fcount; $j++ ) {
						if ( empty( $_POST[ 'submitted' ] ) ) {
							$routes_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = stripslashes( $data[ $routes_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ] );
						} else {

							$routes_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = stripslashes( $_POST[ $routes_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ] );
						}
					}
				}
			}

			return $routes_fields;
		}

		/**
		 * Routes save function
		 *
		 * @since 1.0
		 * @access private
		 */
		private function routes_save( $id = NULL ) {
			global $wpdb, $MHS_TM_Admin_Maps, $MHS_TM_Maps;

			// check if page not refreshed
			if ( !isset( $_POST[ 'todo_check' ] ) ) {
				$this->routes_menu();
				return;
			}
			
			// at least there should be name
			if ( !isset( $_POST[ 'name' ] ) ) {
				$messages[] = array(
					'type'		 => 'error',
					'message'	 => __( 'Route not added! Enter a name at least!', 'mhs_tm' )
				);
				$this->routes_menu( $messages );
				return;
			}

			// save variables
			$coordinates	= stripslashes( $_POST[ 'route' ] );
			$path			= stripslashes( $_POST[ 'path' ] );

			$options = array( 
				'name' => $_POST[ 'name' ],
				'path' => json_decode( $path )
			);

			$options = json_encode( $options );

			// if there is a id just update the route
			if ( isset( $_GET[ 'id' ] ) && $_GET[ 'id' ] != NULL ) {
				$wpdb->update(
				$wpdb->prefix . 'mhs_tm_routes', array(
					'options'		 => $options,
					'coordinates'	 => $coordinates
				), array( 'id' => $_GET[ 'id' ] ), array( '%s', '%s' ), array( '%d' )
				);

				$messages[] = array(
					'type'		 => 'updated',
					'message'	 => __( 'Route successfully updated!', 'mhs_tm' )
				);
			} else {
				// if there no id insert new route
				$wpdb->insert(
				$wpdb->prefix . 'mhs_tm_routes', array(
					'active'		 => 1,
					'options'		 => $options,
					'coordinates'	 => $coordinates,
					'create_date'	 => date( "Y-m-d H:i:s" )
				), array( '%d', '%s', '%s', '%s' )
				);
				$last_route_id = $wpdb->insert_id;
				
				$selected_map = $MHS_TM_Admin_Maps->get_selected_map();
				// if there is a selected map add new inserted route id to the map
				if( $selected_map !== NULL ) {
					$route_ids = $MHS_TM_Maps->get_routes_of_map( $selected_map );
					// put the id as string to the array
					$route_ids[] .= $last_route_id;
					
					$wpdb->update(
					$wpdb->prefix . 'mhs_tm_maps', array(
						'route_ids'	 => json_encode( $route_ids )
					), array( 'id' => $selected_map ), array( '%s' ), array( '%d' )
					);
				}
				
				$messages[] = array(
					'type'		 => 'updated',
					'message'	 => __( 'Route successfully added!', 'mhs_tm' )
				);
			}

			if ( !$_GET[ 'js' ] == 'ja' ) {
				$this->routes_menu( $messages );
			}
		}

	}

	
	
endif; // class exists