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

			$todo = isset( $_GET[ 'todo' ] ) ? $_GET[ 'todo' ] : 'default';

			switch ( $todo ) {

				case "save":
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

			if ( !isset( $_POST[ 'todo_check' ] ) ) {
				$this->settings_menu();
				return;
			}

			$options = array( 
				'api_key_gmap' => $_POST[ 'api_key_gmap' ]
			);
			
			$options = json_encode( $options );
			
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
			
			// get the active tab
			if ( isset ( $_GET['tab'] ) ) {
				$active_tab = $_GET['tab']; 
			} else {
				$active_tab = 'settings';
			}
			
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
					$form_action = $url . "&amp;todo=save";
					$fields	 = $this->settings_fields();
			
					// create the admin page header
					$adminpage = new MHS_TM_Admin_Page( array(
						'title'			=> __( 'Settings', 'mhs_tm' ),
					) );
					
					$args	 = array(
						'echo'		 => true,
						'form'		 => true,
						'metaboxes'	 => true,
						'action'	 => $form_action,
						'back'		 => true,
						'back_url'	 => $url,
						'fields'	 => $fields
					);
					$form	 = new MHS_TM_Admin_Form( $args );
					
					echo  $adminpage->top();
					echo  $form->output();
					echo  $adminpage->bottom();
					
					break;
					
				case 'about' :
			
					// create the admin page header
					$adminpage = new MHS_TM_Admin_Page( array(
						'title'			=> __( 'About', 'mhs_tm' ),
					) );
					
					echo $adminpage->top();
					echo '
						<img src="' . MHS_TM_RELPATH . '/img/Logo-fs.jpeg" alt="Logo" width="150" height="150" style="float: left; padding: 10px 10px 10px 0px;" />
						<h1>My Hitchhiking Spot Travel Map </h1>
						<p>My Hitchhiking Spot Travel Map (MHS Travel Map) is for travelers who loves to log there route. It\'s designed mainly for hitchhikers but could also good be used by backpackers, hikers, cyclist, overland travelers with car or motorbike or traveler with any other kind of transportation. Create a Map, add coordinates where you have been, draw your travel route, write a story for each coordinate. You will use the wordpress text editor to write the stories, so you could add images and videos to it.</p>
						<p>For logging of&nbsp; the route you could use the Android app "<a title="My Hitchhiking Spots" href="https://play.google.com/store/apps/details?id=com.myhitchhikingspots" target="_blank">My Hitchhiking Spots</a>" The app runs without mobile internet. You could save a backup and then import the file in the MHS Travel Map plugin. After the import save the routes you would like and change each route individual..</p>	
						';
					echo $adminpage->bottom();
					
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
			global $wpdb;

			$settings_fields = array(
				array(
					'title'	 => __( 'Settings', 'mhs_tm' ),
					'fields' => array(
						array(
							'type'	 => 'hidden',
							'hidden' => true,
							'id'	 => 'todo_check',
							'value'	 => 'check'
						),
						array(
							'type'	 => 'text',
							'label'	 => __( 'API Key for google maps', 'mhs_tm' ),
							'id'	 => 'api_key_gmap',
							'desc'	 => __( 'You could use your own "API Key". 
								If there is no key entered the plugin will use a public one but it 
								could be that the contingent runs out from time to time. The Google Maps JavaScript API
								and the Google Maps Directions API has to be aktivated for your "Key / Project". 
								Your own key you could get <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
								target="_blank">here (JavaScript API)</a>, and <a href="https://developers.google.com/maps/documentation/directions/get-api-key" 
								target="_blank">here (Directions API)</a>. Create just one project and activate both APIs 
								for this project. You will get just one key. This one you have to enter here', 'mhs_tm' )
						)
					)
				)
			);

			$json_array = $this->get_plugin_settings();
			
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
				$fcount = count( $settings_fields[ $i ][ 'fields' ] );
				for ( $j = 0; $j < $fcount; $j++ ) {
					if ( empty( $_POST[ 'submitted' ] ) ) {
						$settings_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = stripslashes( $data[ $settings_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ] );
					} else {
						$settings_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = stripslashes( $data[ $settings_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ] );
					}
				}
			}

			return $settings_fields;
		}

		/**
		 * Get Plugin Settings
		 *
		 * @since 1.0
		 * @access public
		 */
		public function get_plugin_settings() {
			global $wpdb;

			$data	 = $wpdb->get_results(
			"SELECT * FROM " .
			$wpdb->prefix . "mhs_tm_maps " .
			"WHERE id = 1 LIMIT 1", ARRAY_A
			);
			$data	 = $data[ 0 ];

			$json_array = json_decode( $data[ 'options' ], true );
			
			return $json_array;
		}

		/**
		 * Get Google maps API Key
		 *
		 * @since 1.0
		 * @access public
		 */
		public function get_gmaps_api_key() {
			global $wpdb;

			$settings = $this->get_plugin_settings();
			
			if( $settings['api_key_gmap'] === null || $settings['api_key_gmap'] == '' ) {
				$key = 'AIzaSyAcxQgsVr_SEK2rUape65zv7v6Jn0ElZHc';
			} else {
				$key = $settings['api_key_gmap'];
			}
			
			return $key;
		}

	} // class

endif; // class exists