<?php

/**
 * MHS_TM_Admin_Settings class.
 *
 * This class contains properties and methods for
 * the settings of the plugin.
 *
 * @since 1.0
 */
if ( !class_exists( 'MHS_TM_Admin_Settings' ) ) :

	class MHS_TM_Admin_Settings {
		/* CONTROLLERS */

		/**
		 * Settings control function
		 *
		 * @since 1.0
		 * @access public
		 */
		public function settings_control() {
			global $wpdb, $MHS_TM_Admin;
			
			$messages = array();
			$url = 'admin.php?page=MHS_TM-settings';
			
			//save Get and Post and sanitize
			$todo	= isset( $_GET[ 'todo' ] ) ? sanitize_text_field( $_GET[ 'todo' ] ) : 'default';

			switch ( $todo ) {

				case 'save':
					$this->settings_save();
					break;

				default:
					$this->settings_menu();
			}
		}

		/**
		 * Settings save function
		 *
		 * @since 1.0
		 * @access private
		 */
		private function settings_save() {
			global $wpdb;
			
			//save Get and Post and sanitize
			$api_key_gmap                       = isset( $_POST[ 'api_key_gmap' ] ) ? sanitize_text_field( $_POST[ 'api_key_gmap' ] ) : null;
			$lang_geocoding_gmap                = isset( $_POST[ 'lang_geocoding_gmap' ] ) ? sanitize_text_field( $_POST[ 'lang_geocoding_gmap' ] ) : null;
			$new_coordinate_part_of_the_road    = isset( $_POST[ 'new_coordinate_part_of_the_road' ] ) && $_POST[ 'new_coordinate_part_of_the_road' ] == true ? 1 : 0;
			$new_coordinate_is_hitchhiking_spot = isset( $_POST[ 'new_coordinate_is_hitchhiking_spot' ] ) && $_POST[ 'new_coordinate_is_hitchhiking_spot' ] == true ? 1 : 0;
			$new_coordinate_is_geocoded         = isset( $_POST[ 'new_coordinate_is_geocoded' ] ) && $_POST[ 'new_coordinate_is_geocoded' ] == true ? 1 : 0;
			$moved_coordinate_is_geocoded       = isset( $_POST[ 'moved_coordinate_is_geocoded' ] ) && $_POST[ 'moved_coordinate_is_geocoded' ] == true ? 1 : 0;
			$nonce_key	                        = isset( $_POST[ 'mhs_tm_settings_save_nonce' ] ) ? esc_attr( $_POST[ 'mhs_tm_settings_save_nonce' ] ) : null;
			$transport_classes                  = isset( $_POST[ 'transport_classes' ] ) ? sanitize_text_field( stripslashes( $_POST[ 'transport_classes' ] ) ) : null;
			$transport_classes_next_id           = isset( $_POST[ 'transport_classes_next_id' ] ) ? intval( stripslashes( $_POST[ 'transport_classes_next_id' ] ) ) : 'error';

			if ( !wp_verify_nonce( $nonce_key, 'mhs_tm_settings_save' ) || $transport_classes_next_id == 'error' ) {
				$messages[] = array(
					'type'		 => 'error',
					'message'	 => __( 'Something went wrong!', 'mhs_tm' )
				);
				$this->settings_menu( $messages );
				return;
			}

			$options = json_encode( array( 
				'api_key_gmap'                       => $api_key_gmap,
				'lang_geocoding_gmap'                => $lang_geocoding_gmap,
				'new_coordinate_part_of_the_road'    => $new_coordinate_part_of_the_road,
				'new_coordinate_is_hitchhiking_spot' => $new_coordinate_is_hitchhiking_spot,
				'new_coordinate_is_geocoded'         => $new_coordinate_is_geocoded,
				'moved_coordinate_is_geocoded'       => $moved_coordinate_is_geocoded,
				'transport_classes'                  => $transport_classes,
				'transport_classes_next_id'          => $transport_classes_next_id,
			) );
			
			$wpdb->update(
			$wpdb->prefix . 'mhs_tm_maps', array(
				'active'	 => 0,
				'options'	 => $options,
			), array( 'id' => 1 ), array( '%d', '%s' ), array( '%d' )
			);
			$messages[] = array(
				'type'		 => 'updated',
				'message'	 => __( 'Settings successfully updated!', 'mhs_tm' )
			);
			
			$this->settings_menu( $messages );
		}

		/**
		 * Settings administration menu
		 *
		 * @since 1.0
		 * @access private
		 */
		private function settings_menu( $messages = NULL ) {

			$url = 'admin.php?page=MHS_TM-settings';
			
			//save Get and Post and sanitize
			$active_tab	= isset( $_GET['tab'] ) ? sanitize_text_field( $_GET['tab'] ) : 'settings';
			
			// create the admin page header
			$adminpage = new MHS_TM_Admin_Page( array(
				'title'			=> __( 'Settings', 'mhs_tm' ),
				'icon'			=> MHS_TM_RELPATH . '/img/Logo-fs.jpeg',
				'messages'		=> $messages,
				'url'			=> $url,
				'active_tab'	=> $active_tab,
				'tabs'			=> array(	
					array(
						'value' => 'settings',
						'title' => 'Settings' ),
					array(
						'value' => 'export',
						'title' => 'Export' ),
					array(
						'value' => 'about',
						'title' => 'About' )
					)
			) );

			echo $adminpage->top();
			echo $this->get_tab_content( $active_tab );
			echo $adminpage->bottom();
		}

		/**
		 * Get Conetnt of setting page tabs
		 *
		 * @since 1.0
		 * @access private
		 */
		private function get_tab_content( $tab = 'settings' ) {
			global $MHS_TM_Maps;
			
			$output = '';
		
			switch ( $tab ){
				case 'settings' :
					$url = 'admin.php?page=MHS_TM-settings';
					$form_action = $url . '&amp;todo=save';
					$fields	 = $this->settings_fields();
					
					$args	 = array(
						'echo'		 => true,
						'form'		 => true,
						'metaboxes'	 => true,
						'action'	 => $form_action,
						'back'		 => true,
						'back_url'	 => $url,
						'fields'	 => $fields,
						'nonce'		 => 'mhs_tm_settings_save'
					);
					$form	 = new MHS_TM_Admin_Form( $args );
										
					$fields	 = $this->transport_class_fields();
					$args	 = array(
						'echo'		 => false,
						'form'		 => false,
						'metaboxes'	 => false,
						'action'	 => $form_action,
						'back'		 => true,
						'back_url'	 => $url,
						'fields'	 => $fields,
						'nonce'		 => 'mhs_tm_settings_save'
					);
					$form_transport	 = new MHS_TM_Admin_Form( $args );
					
					echo  $form->output();
					
					//add or edit new transport class dialog
					echo '<div style="display: none;" id="mhs_tm_transport" title="Add transport class" >';
					echo $form_transport->output(); 
					echo '</div>';
					
					// Error or Update Message to set by jquery
					echo '<div id="mhs-tm-dialog-message" class="updated" style="display: none;"><p>TEXT</p></div>';

					wp_enqueue_script( 'mhs_tm_admin_settings' );
					
					break;
					
				case 'export' :
					
					$routes = $MHS_TM_Maps->get_coordinates( 0, 'all' );
					
					$button = '<input id="mhs_tm_start_export" type="submit" class="mhs_tm_prim_button button" 
						value="+ ' . __( 'Start export', 'mhs_tm' ) . '" />';
			
					echo '<p> This export function will search in all your saved routes for lifts and creates an 
						overview with alll important information </p>' . 
						$button;

					wp_enqueue_script( 'mhs_tm_admin_export' );
					wp_localize_script( 'mhs_tm_admin_export', 'mhs_tm_app_export_vars', array(
						'routes' => $routes
					) );
					
					break;
					
				case 'about' :
					
					echo '
						<img src="' . MHS_TM_RELPATH . '/img/Logo-fs.jpeg" alt="Logo" width="150" height="150" style="float: left; padding: 10px 10px 10px 0px;" />
						<h1>My Hitchhiking Spot Travel Map </h1>
						<p>My Hitchhiking Spot Travel Map (MHS Travel Map) is for travelers who loves to log there route. It\'s designed mainly for hitchhikers but could also good be used by backpackers, hikers, cyclist, overland travelers with car or motorbike or traveler with any other kind of transportation. Create a Map, add coordinates where you have been, draw your travel route, write a story for each coordinate. You will use the wordpress text editor to write the stories, so you could add images and videos to it.</p>
						<p>For logging of&nbsp; the route you could use the Android app "<a title="My Hitchhiking Spots" href="https://play.google.com/store/apps/details?id=com.myhitchhikingspots" target="_blank">My Hitchhiking Spots</a>" The app runs without mobile internet. You could save a backup and then import the file in the MHS Travel Map plugin. After the import save the routes you would like and change each route individual..</p>	
						
						<h1 style="clear: left;">Settings and Functions </h1>
						
						<h2>Shortcodes</h2>
						<p>There are just one shortcode name to display a map or a route. Just copy the shortcode 
						you will find in the Maps or routes menu. The shortcode decides if the map_id is a map id or a 
						route id by the addional option "type". </p>
						<p>There are additional option you could add to the shortcode to show a map. Just add it like 
						following at the end of the short code: <strong>[mhs-travel-map map_id=12 auto_window_ratio=0]</strong></p>
						
						<h3>Shortcode options</h3>
						<span style="font-size: 12pt;"><strong>map_id</strong></span> <br> 
						<span style="font-size: 10pt;">values: number; default = 0 </span> <br>
						<p>The map or route ID which should be loaded. It has to be a number.</p>
						<br>
						
						<span style="font-size: 12pt;"><strong>auto_window_ratio</strong></span> <br> 
						<span style="font-size: 10pt;">values: 1/0; default = 1 </span> <br>
						<p>Disable the automatic sizing of the map window. If enabled (default) the map window will automatically set to a 16:9 ratio calculated from the screen size</p>
						<br>

						<span style="font-size: 12pt;"><strong>height</strong></span><br>
						<span style="font-size: 10pt;">values: numeric; default = 500 </span> <br>
						<p>If&nbsp;auto_window_ratio is disabled, the map window height in pixel can set here.</p>
						<br>

						<span style="font-size: 12pt;"><strong>run_shortcodes</strong></span> <br>
						<span style="font-size: 10pt;">values: 1/0; default = 1 </span> <br>
						<p>If 1, shortcodes on the coordinate notes will converted.&nbsp;</p>
						<br>

						<span style="font-size: 12pt;"><strong>type</strong></span> <br>
						<span style="font-size: 10pt;">values: map/route; default = map </span> <br>
						<p>Change the interpretation of the option map_id, if it is a map id or a route id. So the 
						shortcode will load a map with all routes added to the map or just one particluar route by id.
						&nbsp;</p>
						<br>
						';
					
					break;
			}
			return $output;
		}

		/**
		 * Settings fields
		 *
		 * @since 1.0
		 * @access private
		 */
		private function settings_fields() {
			global $MHS_TM_Utilities;
			//get all transport calsses in settings to display them in the transport calsses table
			$plugin_settings = $MHS_TM_Utilities->get_plugin_settings();
			$transport_classes_table_rows = '';
			
			foreach ( $plugin_settings['transport_classes'] as $key => $transport_class ) {
				$transport_classes_table_rows .= '<tr><td class="transport_class_color" style="background-color: ' . $transport_class['color'] . 
				';"></td><td>' . $transport_class['name'] . '</td>
				<td class="transport_class_settings">
				<a class="mhs_tm_edit_transport" href="javascript:void(0)">Edit</a> | 
				<a class="mhs_tm_delete_transport" href="javascript:void(0)">Delete</a>
				</td></tr>';
			}

			$settings_fields = array(
				array(
					'title'	 => __( 'Google Maps', 'mhs_tm' ),
					'fields' => array(
						array(
							'type'	 => 'text_long',
							'label'	 => __( 'API Key for google maps', 'mhs_tm' ),
							'id'	 => 'api_key_gmap',
							'desc'	 => __( 'You could use your own "API Key". 
								If there is no key entered the plugin will use a public one but it 
								could be that the contingent runs out from time to time. <br>
								<b>Please get your own API key!</b> You could get a API key for free. Just use your own google account 
								and get your key <a href="https://console.developers.google.com/flows/enableapi?apiid=maps_backend&reusekey=true&pli=1" 
								target="_blank">here</a>. More information you will get <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
								target="_blank">here</a>. For your project you have to activate "Google Maps JavaScript API"!', 'mhs_tm' )
						),
						array(
							'type'	 => 'text',
							'label'	 => __( 'Translation language for geocoding function.', 'mhs_tm' ),
							'id'	 => 'lang_geocoding_gmap',
							'desc'	 => __( 'Enter here the google language code (<a 
								href="https://developers.google.com/maps/faq#languagesupport" 
								target="_blank">Check for more information about the codes</a>). The language of the map 
								in the route edit menu will be in this language. Also the results of the geocoding will be 
								in this language. If you leave it blank, google will 
								use a language automaticly by your system settings. ', 'mhs_tm' )
						),
					)
				),
				array(
					'title'	 => __( 'Route Edit', 'mhs_tm' ),
					'fields' => array(
						array(
							'type'	 => 'checkbox',
							'label'	 => __( 'New coordinates are part of the roads?', 'mhs_tm' ),
							'id'	 => 'new_coordinate_part_of_the_road',
							'desc'	 => __( 'If checked, added coordinates in the route edit menu will automatically	
								set to be part of the route.', 'mhs_tm' )
						),
						array(
							'type'	 => 'checkbox',
							'label'	 => __( 'New coordinates are hitchhiking spots?', 'mhs_tm' ),
							'id'	 => 'new_coordinate_is_hitchhiking_spot',
							'desc'	 => __( 'If checked, added coordinates in the route edit menu will automatically	
								set to be a hitchhiking spot.', 'mhs_tm' )
						),
						array(
							'type'	 => 'checkbox',
							'label'	 => __( 'New coordinates are geocoded?', 'mhs_tm' ),
							'id'	 => 'new_coordinate_is_geocoded',
							'desc'	 => __( 'If checked, added coordinates in the route edit menu will automatically	
								get geocoded location (Country-, State- and City Name).', 'mhs_tm' )
						),
						array(
							'type'	 => 'checkbox',
							'label'	 => __( 'Moved coordinates are geocoded?', 'mhs_tm' ),
							'id'	 => 'moved_coordinate_is_geocoded',
							'desc'	 => __( 'If checked, moved coordinates in the route edit menu will automatically	
								get geocoded location (Country-, State- and City Name).', 'mhs_tm' )
						),
						array(
							'type'	 => 'content',
							'label'	 => __( 'Defined transportation classes', 'mhs_tm' ),
							'id'	 => 'transport_table',
							'desc'	 => __( '<a class="button-secondary margin" id="mhs_tm_add_transport" 
												href="javascript:void(0)">Add new</a> <br>
												Define transportation classes with a name and a color. Routes can then be
												added to a transportation class. The route will be displayed in the 
												class color and the map statistic will be splitted in the different
												classes.', 'mhs_tm' ),
							'value'	 => '<div class="mhs_tm_table_div"> 
											<table id="mhs_tm_transport_table"> <tbody>' . 
												$transport_classes_table_rows .
											'</tbody> </table>
										</div>'
						),
						array(
							'type'		 => 'hidden',
							'id'		 => 'transport_classes',
						),
						array(
							'type'		 => 'hidden',
							'id'		 => 'transport_classes_next_id',
						)
					)
				)
							
			);

			$json_array = $MHS_TM_Utilities->get_plugin_settings();
			$json_array['transport_classes'] = json_encode( $json_array['transport_classes'] );
			
			if ( !empty( $json_array ) ) {
				$json_array_keys = array_keys( $json_array );
				$json_id		 = 0;
				foreach ( $json_array as $json ) {
					$data[ $json_array_keys[ $json_id ] ]	 = $json;
					$json_id							 = $json_id + 1;
				}
			}

			$mcount = count( $settings_fields );
			for ( $i = 0; $i < $mcount; $i++ ) {
				if( isset( $settings_fields[ $i ]['fields'] ) ) {
					$fcount = count( $settings_fields[ $i ][ 'fields' ] );
					for ( $j = 0; $j < $fcount; $j++ ) {
						if( isset( $data[ $settings_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ] ) ) {
							$settings_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = stripslashes( $data[ $settings_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ] );
//							$settings_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = $data[ $settings_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ];
						}
					}	
				}
			}

			return $settings_fields;
		}

		/**
		 * transport class fields
		 *
		 * @since 1.2.0
		 * @access private
		 */
		private function transport_class_fields() {
			$transport_class_fields = array(
				array(
					'type'	 => 'text_long',
					'label'	 => __( 'Name of class', 'mhs_tm' ),
					'id'	 => 'name_transport_class',
					'desc'	 => __( 'The name or title of the transport class.', 'mhs_tm' )
				),
				array(
					'type'	 => 'color_picker',
					'label'	 => __( 'Color of class', 'mhs_tm' ),
					'id'	 => 'color_transport_class',
					'desc'	 => __( 'The color of the transport class.', 'mhs_tm' )
				),
				array(
					'type'	 => 'hidden',
					'id'	 => 'id_transport_class'
				)						
			);

			return $transport_class_fields;
		}

	} // class

endif; // class exists