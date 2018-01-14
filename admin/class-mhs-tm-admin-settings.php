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

			if ( !wp_verify_nonce( $nonce_key, 'mhs_tm_settings_save' ) ) {
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
					
					echo  $form->output();
					
					break;
					
				case 'about' :
					
					echo '
						<img src="' . MHS_TM_RELPATH . '/img/Logo-fs.jpeg" alt="Logo" width="150" height="150" style="float: left; padding: 10px 10px 10px 0px;" />
						<h1>My Hitchhiking Spot Travel Map </h1>
						<p>My Hitchhiking Spot Travel Map (MHS Travel Map) is for travelers who loves to log there route. It\'s designed mainly for hitchhikers but could also good be used by backpackers, hikers, cyclist, overland travelers with car or motorbike or traveler with any other kind of transportation. Create a Map, add coordinates where you have been, draw your travel route, write a story for each coordinate. You will use the wordpress text editor to write the stories, so you could add images and videos to it.</p>
						<p>For logging of&nbsp; the route you could use the Android app "<a title="My Hitchhiking Spots" href="https://play.google.com/store/apps/details?id=com.myhitchhikingspots" target="_blank">My Hitchhiking Spots</a>" The app runs without mobile internet. You could save a backup and then import the file in the MHS Travel Map plugin. After the import save the routes you would like and change each route individual..</p>	
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
			global $wpdb, $MHS_TM_Utilities;

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
								and get your key <a href="https://console.developers.google.com/flows/enableapi?apiid=maps_backend,geocoding_backend,directions_backend&reusekey=true&pli=1" 
								target="_blank">here</a>. More information you will get <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
								target="_blank">here</a>. For your project you have to activate "Google Maps JavaScript API", "Google Maps Geocoding API" and "Google Maps Directions API"!', 'mhs_tm' )
						),
						array(
							'type'	 => 'text',
							'label'	 => __( 'Translation language for geocoding function.', 'mhs_tm' ),
							'id'	 => 'lang_geocoding_gmap',
							'desc'	 => __( 'Enter here the google language code (<a 
								href="https://developers.google.com/maps/faq#languagesupport" 
								target="_blank">Check for more information about the codes</a>). The result of the 
								google geocode function will be in this language. If you leave it blank, google will 
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
					)
				)
							
			);

			$json_array = $MHS_TM_Utilities->get_plugin_settings();
			
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
						}
					}	
				}
			}

			return $settings_fields;
		}

	} // class

endif; // class exists