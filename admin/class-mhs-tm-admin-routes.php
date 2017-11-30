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
			
			//save Get and Post and sanitize
			$todo = isset(  $_GET['todo'] ) ? sanitize_text_field( $_GET['todo'] ) : 'default';
			$id	  = isset(  $_GET['id'] ) ? absint( $_GET['id'] ) : null;

			switch ( $todo ) {

				// delete are defined in list_table_aps.php
//				case 'delete':
//					break;
//					
				//save is just ajax
//				case 'save':
//					break;

				case 'edit':
					//validate the input
					if( is_numeric( $id ) ) {
						$this->routes_edit( $id );
					} else {
						$messages[] = array(
							'type'		 => 'error',
							'message'	 => __( 'Something went wrong!', 'mhs_tm' )
						);
					
						$this->routes_menu( $messages );
					}
					break;

				case 'new':
					$this->routes_edit();
					break;

				case 'import':
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
			global $wpdb, $MHS_TM_Admin_Settings, $MHS_TM_Utilities;
			$table_name = $wpdb->prefix . 'mhs_tm_routes';

			$url	 = 'admin.php?page=MHS_TM-routes';
			$height	 = 10;

			$adminpage = new MHS_TM_Admin_Page( array(
				'title'		 => __( 'Overview Routes', 'mhs_tm' ),
				'messages'	 => $messages,
				'url'		 => $url
			) );

			$routes = $wpdb->get_results(
			'SELECT * FROM ' . $table_name .
			' WHERE active = 1 order by updated DESC', ARRAY_A
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
                     <input type="hidden" name="page" value="' . esc_attr( $_REQUEST['page'] ) . '" />
                     <!-- Now we can render the completed list table -->';
//                echo $ListTable->search_box( 'search', 'search_id' );
			echo $ListTable->display();
			echo '</form>' .
			'<br />' . $button .
			$adminpage->bottom();

			echo '<div style="display: none;" id="mhs_tm_dialog_info" title="Info" >'
			. '<div class="mhs_tm-map" id="mhs_tm_map_canvas_0" style="height: ' . esc_attr( $height ) . 'px; margin-right: auto ; margin-left: auto ; padding: 0;"></div>'
			. '</div>';

			$key = $MHS_TM_Utilities->get_gmaps_api_key();
			
			wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=' . $key, true );
			wp_enqueue_script( 'googlemap' );
			
			wp_enqueue_script( 'mhs_tm_map' );
			wp_localize_script( 'mhs_tm_map', 'mhs_tm_app_vars_0', array(
				'coordinates'		 => $routes,
				'coord_center_lat'	 => 54.023884,
				'coord_center_lng'	 => 9.377068,
				'auto_load'			 => false,
				'map_id'			 => 0,
                'plugin_dir'	     => MHS_TM_RELPATH 
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
			$form_action = 'javascript:void(0);';

			$coordinates = array();
			$coordinates = $MHS_TM_Maps->get_coordinates( $id, 'route' );
			
			// if coordinates array is empty create a dumy for js functions
			if( empty($coordinates) ) {
				$coordinates = [];
				$coordinates[0] = [];
				$coordinates[0]['coordinates']			= [];
				$coordinates[0]['options']['name']		= '';
			} else {
				$coordinates[0]['coordinates']			= $this->sanitize_coordinates_array( $coordinates[0]['coordinates'] );
				$coordinates[0]['options']['path']		= $this->sanitize_path_array( $coordinates[0]['options']['path'] );
				$coordinates[0]['options']['name']		= sanitize_text_field( $coordinates[0]['options']['name'] );
			}
			
			$name = $coordinates[0]['options']['name'];

			if ( !is_numeric( $id ) ) {
				$title	 = sprintf( __( 'Add New Route', 'mhs_tm' ) );
				$fields_the_route	 = $this->routes_fields(NULL, 'The Route' );
				$fields_coordinates	 = $this->routes_fields(NULL, NULL );
				$nonce	 = 'mhs_tm_route_save';
			} else {
				$title	 = sprintf( __( 'Edit &quot;%s&quot;', 'mhs_tm' ), $name );
				$fields_the_route	 = $this->routes_fields($id, 'The Route' );
				$fields_coordinates	 = $this->routes_fields($id, NULL );
				$nonce	 = 'mhs_tm_route_save_' . $id;
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
				'js'			 => false,
				'metaboxes'		 => true,
				'action'		 => $form_action,
				'id'			 => $id,
				'back'			 => true,
				'custom_buttons' => $custom_buttons,
				'back_url'		 => $url,
				'fields'		 => $fields_the_route,
				'top_button'	 => true,
				'bottom_button'	 => false,
				'hide'			 => true,
				'nonce'			 => $nonce
			);
			$form_the_route	 = new MHS_TM_Admin_Form( $args );

			$args	 = array(
				'echo'			   => false,
				'form'			   => true,
				'js'			   => true,
				'metaboxes'		   => true,
				'action'		   => $form_action,
				'id'			   => $id,
				'back'			   => false,
				'custom_buttons'   => [],
				'back_url'		   => NULL,
				'fields'		   => $fields_coordinates,
				'top_button'	   => false,
				'bottom_button'	   => true,
				'hide'			   => true,
				'sortable_handler' => 'mhs-tm-sortable-handler ui-icon ui-icon-arrowthick-2-n-s'
			);
			$form_coordinates	 = new MHS_TM_Admin_Form( $args );
			
			$height		 = 500;

			$output = '<div id="mhs_tm_map_canvas_0" style="height: ' . esc_attr( $height ) . 'px; margin: 0; padding: 0;"></div>';

			echo $adminpage->top();
			// Make an div over the whole content when loading the page
			echo '<div id="wrap_content">
					<div id="mhs_tm_loading">' . 
						$MHS_TM_Utilities->loading_spinner()
					. '</div>';
			echo $output;
			echo $form_the_route->output();
			echo $form_coordinates->output();
			echo $adminpage->bottom();
			
			// jquery normal dialogs
			echo '<div style="display: none;" id="mhs_tm_dialog_loading" title="Loading..." >'
			. $MHS_TM_Utilities->loading_spinner()
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
				'tabindex'		 => 'wp_editor_dialog-tmce',
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
			$key = $MHS_TM_Utilities->get_gmaps_api_key();

			wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=' . $key . '&libraries=drawing', true );
			wp_enqueue_script( 'googlemap' );

			wp_enqueue_script( 'jquery_ui_touch_punch_min' );
			
			wp_enqueue_script( 'mhs_tm_map_edit' );
			wp_localize_script( 'mhs_tm_map_edit', 'mhs_tm_app_vars', array(
				'coordinates'		 => $coordinates,
				'coord_center_lat'	 => 54.023884,
				'coord_center_lng'	 => 9.377068,
				'auto_load'			 => true,
				'ajax_url'			 => admin_url( 'admin-ajax.php' ),
			) );
		}

		/**
		 * Routes import menu
		 *
		 * @since 1.0
		 * @access private
		 */
		private function routes_import( $id = NULL ) {
			global $wpdb, $MHS_TM_Admin_Settings, $MHS_TM_Utilities;

			$url		 = 'admin.php?page=MHS_TM-routes';
			$form_action = '';
			$title		 = sprintf( __( 'Import new Route(s)', 'mhs_tm' ) );

			$button			 = '<input id="mhs_tm_start_import" type="submit" disabled="disabled" class="mhs_tm_prim_button button" value="+ ' . __( 'Start import', 'mhs_tm' ) . '" />';
			$button_save_all = '<input id="mhs_tm_save_all" type="submit" class="mhs_tm_prim_button button" value="+ ' . __( 'Save all listed routes', 'mhs_tm' ) . '" />';

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
				'fields'	 => $this->routes_import_fields(),
				'nonce'		 => 'mhs_tm_route_save'
			);
			$form	 = new MHS_TM_Admin_Form( $args );

			echo $adminpage->top();
			echo $form->output();
			echo $button . $button_save_all . '<br / style="clear: both;"> ';
			echo '<div style="display: none;" id="dialog_overrun" title="Warning..." >'
			. '<p>Too many routes in file. Please choose a date earlier to load the rest routes!</p>'
			. '</div>';
			echo '<div style="display: none;" id="mhs_tm_dialog_loading" title="Loading..." >'
			. $MHS_TM_Utilities->loading_spinner()
			. '</div>';
			echo '<div id="poststuff" class="noflow"> '
			. '<div id="post-body" class="metabox-holder columns-1">'
			. '<div id="mhs_tm_list" class="postbox-container"> </div> </div> </div>';

			echo $adminpage->bottom();
			
			// Error or Update Message to set by jquery
			echo '<div id="dialog_message" class="updated" style="display: none;"><p>TEXT</p></div>';
			
			//dummy map to localize variables
			echo '<div class="mhs_tm-map" id="mhs_tm_map_canvas_0" style="height: 0px; margin: 0; padding: 0;"></div>';
			

			wp_enqueue_script( 'mhs_tm_admin_import' );
			wp_localize_script( 'mhs_tm_admin_import', 'mhs_tm_import_vars', array(
				'ajax_url'			 => admin_url( 'admin-ajax.php' ),
			) );

			$key = $MHS_TM_Utilities->get_gmaps_api_key();

			wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=' . $key, true );
			wp_enqueue_script( 'googlemap' );

			wp_enqueue_script( 'mhs_tm_map' );
			wp_localize_script( 'mhs_tm_map', 'mhs_tm_app_vars_0', array(
				'coordinates'		 => 'Nichts',
				'coord_center_lat'	 => 46.3682855,
				'coord_center_lng'	 => 14.4170272,
				'auto_load'			 => false,
                'plugin_dir'	     => MHS_TM_RELPATH
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
							'id'	 => 'mhs_tm_csv_file',
							'desc'	 => __( 'Select the file from your filesystem', 'mhs_tm' )
						),
						array(
							'type'	 => 'datepicker',
							'label'	 => __( 'Start date', 'mhs_tm' ),
							'id'	 => 'mhs_tm_start_date',
							'desc'	 => __( 'From which day you would like to import? If you leave it blank it will start with the first entry in file.', 'mhs_tm' )
						),
						array(
							'type'	 => 'datepicker',
							'label'	 => __( 'End date', 'mhs_tm' ),
							'id'	 => 'mhs_tm_end_date',
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
		private function routes_fields( $id = NULL, $part = '' ) {
			global $wpdb;
			
			$table_name = $wpdb->prefix . 'mhs_tm_routes ';
			
			// static route fields
			// by adding new fields also change the sanitize function!
			$routes_fields = [];
			if( $part == 'The Route' ) {
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
			} else {
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
							'desc'	 => __( 'The note of the coordinate.', 'mhs_tm' )
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
	//					array(
	//						'type'	 => 'text_long',
	//						'label'	 => __( 'Country code', 'mhs_tm' ),
	//						'id'	 => 'countrycode_' . $coordinate_id,
	//						'desc'	 => __( '(Not necessary yet, won\'t be used) The country code from the country where the  coordinate is located. <br>
	//										The two letters of the ISO code. <a href="https://www.countrycode.org/"> 
	//										Click for mir information. </a>', 'mhs_tm' )
	//					),
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
			}

			// no new route there are data and maybe coordinates
			if ( is_numeric( $id ) ) {

				$data	 = $wpdb->get_results( $wpdb->prepare( 
				'SELECT * FROM ' . $table_name . ' WHERE id = %d LIMIT 1', $id ), ARRAY_A
				);
				$data	 = $data[ 0 ];

				// Load Option JSON data
				$json_array = json_decode( $data['options'], true );
				if ( !empty( $json_array ) ) {
					$json_array_keys = array_keys( $json_array );
					$json_id		 = 0;
					foreach ( $json_array as $json ) {
						$data[ $json_array_keys[ $json_id ] ]	 = $json;
						$json_id								 = $json_id + 1;
					}
				}

				// Load Coordinates JSON data
				$json_array_coordinates = json_decode( $data['coordinates'], true );

				// display coordinates only if there are one and we will not get the "The Route" fields
				$coordinate_id = 0;
				if ( is_array( $json_array_coordinates ) && count( $json_array_coordinates ) > 0 && $part != 'The Route' ) {
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
									'desc'	 => __( 'The note of the coordinate.', 'mhs_tm' )
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
//								array(
//									'type'	 => 'text_long',
//									'label'	 => __( 'Country code', 'mhs_tm' ),
//									'id'	 => 'countrycode_' . $coordinate_id,
//									'desc'	 => __( 'The country code from the country where the  coordinate is located. <br>
//													The two letters of the ISO code. <a href="https://www.countrycode.org/"> 
//													Click for more information. </a>', 'mhs_tm' )
//								),
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
					if( isset( $routes_fields[ $i ]['fields'] ) ) {
						$fcount = count( $routes_fields[ $i ]['fields'] );
						for ( $j = 0; $j < $fcount; $j++ ) {
							if( isset( $data[ $routes_fields[ $i ]['fields'][ $j ]['id'] ] ) ) {
								$routes_fields[ $i ]['fields'][ $j ]['value'] = stripslashes( $data[ $routes_fields[ $i ]['fields'][ $j ]['id'] ] );
							}
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
		public function routes_save() {
			global $wpdb, $MHS_TM_Admin_Maps, $MHS_TM_Maps, $MHS_TM_Admin_Routes;
			
			// save variables and sanitize 
			$coordinates = isset( $_POST['route'] ) ? $MHS_TM_Admin_Routes->sanitize_coordinates_array( json_decode( stripslashes( $_POST['route'] ) ) ) : [];
			$path		 = isset( $_POST['path'] ) ? $MHS_TM_Admin_Routes->sanitize_path_array( json_decode( stripslashes( $_POST['path'] )  ) ) : [];
			$route       = isset( $_POST['route'] ) ? json_decode( stripslashes( $_POST['route'] ) ) : [];
			$name		 = isset( $_POST['name'] ) ? sanitize_text_field( $_POST['name'] ) : null;
			$nonce_key	 = isset( $_POST['mhs_tm_route_save_nonce'] ) ? esc_attr( $_POST['mhs_tm_route_save_nonce'] ) : null;
			$id			 = isset( $_GET['id'] ) ? absint( $_GET['id'] ) : null;
			
			if ( NULL != $id ) {
				$nonce = 'mhs_tm_route_save_' . $id;
			} else {
				$nonce = 'mhs_tm_route_save';
			}
			
			// check if page not refreshed
			if ( ! wp_verify_nonce( $nonce_key, $nonce ) && ! current_user_can('manage_options') ) {
				$messages = array(
					'type'		 => 'error',
					'message'	 => __( 'Route not saved! Something went wrong!', 'mhs_tm' )
				);
				echo json_encode( $messages );
				wp_die(); 
				return;
			}
			
			// at least there should be name
			if ( ! isset( $name ) || $name === NULL || $name == '' ) {
				$messages = array(
					'type'		 => 'error',
					'message'	 => __( 'Route not saved! Enter a name at least!', 'mhs_tm' )
				);
				echo json_encode( $messages );
				wp_die(); 
				return;
			}

			$options = array( 
				'name' => $name,
				'path' => $path
			);

			$options = wp_json_encode( $options );
			$coordinates = wp_json_encode( $coordinates );
			
			// if there is a id just update the route
			if ( isset( $id ) && $id != 0 ) {
				$wpdb->update(
				$wpdb->prefix . 'mhs_tm_routes', array(
					'options'		 => $options,
					'coordinates'	 => $coordinates
				), array( 'id' => $id ), array( '%s', '%s' ), array( '%d' )
				);

				$messages = array(
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
					'create_date'	 => date( 'Y-m-d H:i:s' )
				), array( '%d', '%s', '%s', '%s' )
				);
				
				// if there is a selected map add new inserted route id to the map
				$selected_map = $MHS_TM_Admin_Maps->get_selected_map();
				$last_route_id = $wpdb->insert_id;
				if( $selected_map !== NULL ) {
					$route_ids = $MHS_TM_Maps->get_routes_of_map( $selected_map );
					// put the id as string to the array
					$route_ids[] .= $last_route_id;
					
					$wpdb->update(
					$wpdb->prefix . 'mhs_tm_maps', array(
						'route_ids'	 => json_encode( $route_ids )
					), array( 'id' => (int)$selected_map ), array( '%s' ), array( '%d' )
					);
				}
				
				$messages = array(
					'type'		 => 'updated',
					'message'	 => __( 'Route successfully added!', 'mhs_tm' ),
					'coordinate_json' => $route,
					'coordinate' => $coordinates
				);
			}
			
			echo json_encode( $messages );
			wp_die(); 
		}

		/**
		 * Funktion to sanitize an path array
		 *
		 * @since 1.0
		 * @access public
		 */
		public function sanitize_path_array( $array ) {
			// Initialize the new array that will hold the sanitize values
			$new_input = array();

			if( is_array( $array ) ) {
				// Loop through the input and sanitize each of the values
				foreach ( $array as $key => $val ) {
					if( isset( $array[ $key ] ) ) {
						if( is_object( $array[ $key ] ) ) {
							$new_input[ $key ] = (object) array( 
								'lat' => (float)$val->lat, 
								'lng' => (float)$val->lng 
							);
						} elseif ( is_array( $array[ $key ] ) ) {
							$new_input[ $key ] = (object) array( 
								'lat' => (float)$val['lat'], 
								'lng' => (float)$val['lng'] 
							);							
						}
					}
				}
			} else {
				$new_input[0] = (int)sanitize_text_field( $array );
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
			global $MHS_TM_Admin_Utilities;
			/* @var $MHS_TM_Admin_Utilities MHS_TM_Admin_Utilities */
			
			// Initialize the new array that will hold the sanitize values
			$new_input = array();
			
			//filter to increase the allowed tags from wp_kses_post
			$class = new MHS_TM_Admin_Utilities();
			add_filter( 'wp_kses_allowed_html', array( $class, 'add_wpkses_tags' ), 10, 2 );

			if( is_array( $array ) ) {
				// Loop through the input and sanitize each of the values
				foreach ( $array as $key => $val ) {
					if( isset( $array[ $key ] ) ) {
						if( is_object( $array[ $key ] ) ) {
							$new_input[ $key ] = (object) array( 
								'city'				=> sanitize_text_field( $val->city ), 
								'country'			=> sanitize_text_field( $val->country ), 
								'ishitchhikingspot' => $MHS_TM_Admin_Utilities->sanitize_checkbox( $val->ishitchhikingspot ), 
								'ispartofaroute'	=> $MHS_TM_Admin_Utilities->sanitize_checkbox( $val->ispartofaroute ), 
								'latitude'			=> floatval( $val->latitude ), 
								'longitude'			=> floatval( $val->longitude ), 
								'note'				=> balanceTags( wp_kses_post( $val->note ), true), 
								'starttime'			=> substr( sanitize_text_field( $val->starttime ), 0, 10), 
								'state'				=> sanitize_text_field( $val->state ), 
								'street'			=> sanitize_text_field( $val->street ), 
								'waitingtime'		=> intval( $val->waitingtime ), 
							);
						} elseif( is_array( $array[ $key ] ) ) {
							$new_input[ $key ] = array( 
								'city'				=> sanitize_text_field( $val['city'] ), 
								'country'			=> sanitize_text_field( $val['country'] ), 
								'ishitchhikingspot' => $MHS_TM_Admin_Utilities->sanitize_checkbox( $val['ishitchhikingspot'] ), 
								'ispartofaroute'	=> $MHS_TM_Admin_Utilities->sanitize_checkbox( $val['ispartofaroute'] ), 
								'latitude'			=> floatval( $val['latitude'] ), 
								'longitude'			=> floatval( $val['longitude'] ), 
								'note'				=> balanceTags( wp_kses_post( $val['note'] ), true), 
								'starttime'			=> substr( sanitize_text_field( $val['starttime'] ), 0, 10), 
								'state'				=> sanitize_text_field( $val['state'] ), 
								'street'			=> sanitize_text_field( $val['street'] ), 
								'waitingtime'		=> intval( $val['waitingtime'] ), 
							);							
						}
					}
				}
			} else {
				$new_input[0] = (int)sanitize_text_field( $array );
			}
			return $new_input;
		}
	} // class

	
	
endif; // class exists