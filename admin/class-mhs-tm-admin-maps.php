<?php

/**
 * MHS_TM_Admin_Maps class.
 *
 * This class contains properties and methods for
 * the creation of new maps.
 *
 * @since 1.0
 */
if ( !class_exists( 'MHS_TM_Admin_Maps' ) ) :

	class MHS_TM_Admin_Maps {
		/* CONTROLLERS */

		/**
		 * Maps control function
		 *
		 * @since 1.0
		 * @access public
		 */
		public function maps_control() {
			global $wpdb, $MHS_TM_Admin;
			
			$messages = array();
			$url = 'admin.php?page=MHS_TM-maps';

			$todo = isset( $_GET[ 'todo' ] ) ? $_GET[ 'todo' ] : 'default';

			switch ( $todo ) {

				case 'delete':
					// delete are defined in list_table_aps.php
					break;

				case 'select':
					// get old selected map and set it to unselected
					$selected_id = $this->get_selected_map();
					
					if($selected_id !== NULL) {
						$wpdb->update(
						$wpdb->prefix . 'mhs_tm_maps', array(
							'selected' => 0
						), array( 'id' => $selected_id ), array( '%d' ), array( '%d' )
						);
					}
					
					// Set new map to selected
					$wpdb->update(
					$wpdb->prefix . 'mhs_tm_maps', array(
						'selected' => 1
					), array( 'id' => $_GET[ 'id' ] ), array( '%d' ), array( '%d' )
					);
					
					$messages[] = array(
						'type'		 => 'updated',
						'message'	 => __( 'Map successfully selected!', 'mhs_tm' )
					);
					
					$this->maps_menu( $messages );

					break;

				case 'unselect':
					// Set new map to unselected
					$wpdb->update(
					$wpdb->prefix . 'mhs_tm_maps', array(
						'selected' => 0
					), array( 'id' => $_GET[ 'id' ] ), array( '%d' ), array( '%d' )
					);
					
					$messages[] = array(
						'type'		 => 'updated',
						'message'	 => __( 'Map successfully unselected!', 'mhs_tm' )
					);
					
					$this->maps_menu( $messages );
					
					break;

				case 'save':
					$this->maps_save( $_GET[ 'id' ] );
					break;

				case 'edit':
					$this->maps_edit( $_GET[ 'id' ] );
					break;

				case 'new':
					$this->maps_edit();
					break;

				default:
					$this->maps_menu();
			}
		}

		/**
		 * Maps administration menu
		 *
		 * @since 1.0
		 * @access private
		 */
		private function maps_menu( $messages = NULL ) {

			$url = 'admin.php?page=MHS_TM-maps';

			$adminpage = new MHS_TM_Admin_Page( array(
				'title'		 => __( 'Overview maps', 'mhs_tm' ),
				'messages'	 => $messages,
				'url'		 => $url
			) );



			$button = '<form method="post" action="' . $url . '&todo=new">' .
			'<input type="submit" class="mhs_tm_prim_button button" value="+ ' . __( 'add new map', 'mhs_tm' ) . '" />' .
			'</form>';

			// create table
			//	Create an instance of our package class...
			$ListTable = new List_Table_Maps();
			//Fetch, prepare, sort, and filter our data...
			$ListTable->prepare_items();

			echo $adminpage->top();
			echo '<br />' . $button . '<br />' .
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
		}

		/**
		 * Maps edit menu
		 *
		 * @since 1.0
		 * @access private
		 */
		private function maps_edit( $id = NULL ) {
			global $wpdb, $MHS_TM_Maps;
			$table_name = $wpdb->prefix . 'mhs_tm_maps';

			$url		 = 'admin.php?page=MHS_TM-maps';
			$form_action = $url . "&amp;todo=save&amp;id=" . $id;

			$maps = $wpdb->get_results(
			"SELECT * FROM " . $table_name .
			" WHERE id = " . $id . " order by create_date DESC", ARRAY_A
			);

			$map_option_string	 = $maps[ 0 ][ 'options' ];
			$map_options		 = array();
			$map_options		 = json_decode( $map_option_string, true );
			$name				 = $map_options[ 'name' ];

			if ( !is_numeric( $id ) ) {
				$title	 = sprintf( __( 'Add New Map', 'mhs_tm' ) );
				$fields	 = $this->maps_fields();
			} else {
				$title	 = sprintf( __( 'Edit &quot;%s&quot;', 'mhs_tm' ), $name );
				$fields	 = $this->maps_fields( $id );
			}

			$adminpage = new MHS_TM_Admin_Page( array(
				'title'	 => $title,
				'url'	 => $url
			) );

			$args	 = array(
				'echo'		 => false,
				'form'		 => true,
				'metaboxes'	 => true,
				'action'	 => $form_action,
				'id'		 => $id,
				'back'		 => true,
				'back_url'	 => $url,
				'fields'	 => $fields
			);
			$form	 = new MHS_TM_Admin_Form( $args );

			echo $adminpage->top();
			echo do_shortcode( '[mhs-travel-map map_id=' . $id . '] </br>' );
			echo $form->output();
			echo $adminpage->bottom();

			$route_ids		 = $this->get_routes_array();
			$coordinates_all = array();
			foreach ( $route_ids as $route ) {
				$coordinates_all[ $route[ 'value' ] ] = $MHS_TM_Maps->get_coordinates( $route[ 'value' ], 'route' );
			}
			
			wp_enqueue_script( 'mhs_tm_admin_maps' );
			wp_localize_script( 'mhs_tm_admin_maps', 'mhs_tm_app_vars', array(
				'coordinates_all' => $coordinates_all
			) );
		}

		/**
		 * Maps fields
		 *
		 * @since 1.0
		 * @access private
		 */
		private function maps_fields( $id = NULL ) {
			global $wpdb, $mhs_tm_admin_maps;

			if ( sizeof( $this->get_routes_array() ) < 50 ) {
				$size_of_select = sizeof( $this->get_routes_array() );
			} else {
				$size_of_select = 50;
			}

			$maps_fields = array(
				array(
					'title'	 => __( 'The Map', 'mhs_tm' ),
					'fields' => array(
						array(
							'type'	 => 'text',
							'label'	 => __( 'Name of Map', 'mhs_tm' ),
							'id'	 => 'name',
							'desc'	 => __( 'The name or title of the map', 'mhs_tm' )
						),
						array(
							'type'	 => 'hidden',
							'hidden' => true,
							'id'	 => 'todo_check',
							'value'	 => 'check'
						),
						array(
							'type'		 => 'radio',
							'label'		 => __( 'Is the map the active one?', 'mhs_tm' ),
							'id'		 => 'selected',
							'desc'		 => __( 'All new routes will be maped automaticly to this map!', 'mhs_tm' ),
							'options'	 => array(
								array(
									'value'	 => 1,
									'label'	 => 'Yes'
								),
								array(
									'value'	 => 0,
									'label'	 => 'No'
								)
							)
						)
					)
				),
				array(
					'title'	 => __( 'Routes', 'mhs_tm' ),
					'fields' => array(
						array(
							'type'		 => 'select',
							'label'		 => __( 'Select the routes you would like to add to the map.', 'mhs_tm' ),
							'id'		 => 'route_ids[]',
							'desc'		 => __( 'You could select more than one route. The selected routes will be added to the map.', 'mhs_tm' ),
							'options'	 => $this->get_routes_array(),
							'multiple'	 => true,
							'size'		 => $size_of_select
						)
					)
				)
			);

			if ( !is_numeric( $id ) ) {

				return $maps_fields;
			} else {

				$data	 = $wpdb->get_results(
				"SELECT * FROM " .
				$wpdb->prefix . "mhs_tm_maps " .
				"WHERE id = " . $id . " LIMIT 1", ARRAY_A
				);
				$data	 = $data[ 0 ];

				$json_array = json_decode( $data[ 'options' ], true );
				if ( !empty( $json_array ) ) {
					$json_array_keys = array_keys( $json_array );
					$json_id		 = 0;
					foreach ( $json_array as $json ) {
						$data[ $json_array_keys[ $json_id ] ]	 = $json;
						$json_id							 = $json_id + 1;
					}
				}

				$mcount = count( $maps_fields );
				for ( $i = 0; $i < $mcount; $i++ ) {
					$fcount = count( $maps_fields[ $i ][ 'fields' ] );
					for ( $j = 0; $j < $fcount; $j++ ) {
						if ( empty( $_POST[ 'submitted' ] ) ) {
							if ( $maps_fields[ $i ][ 'fields' ][ $j ][ 'id' ] == 'route_ids[]' ) {
								$maps_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = json_decode( $data[ 'route_ids' ], true );
							} else {
								$maps_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = stripslashes( $data[ $maps_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ] );
							}
						} else {
							if ( $maps_fields[ $i ][ 'fields' ][ $j ][ 'id' ] == 'route_ids[]' ) {
								$maps_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = json_decode( $data[ 'route_ids' ], true );
							} else {
								$maps_fields[ $i ][ 'fields' ][ $j ][ 'value' ] = stripslashes( $data[ $maps_fields[ $i ][ 'fields' ][ $j ][ 'id' ] ] );
							}
						}
					}
				}

				return $maps_fields;
			}
		}

		/**
		 * Maps save function
		 *
		 * @since 1.0
		 * @access private
		 */
		private function maps_save( $id = NULL ) {
			global $wpdb;

			if ( !isset( $_POST[ 'todo_check' ] ) ) {
				$this->maps_menu();
				return;
			}
			
			if ( !isset( $_POST[ 'name' ] ) || $_POST[ 'name' ] === NULL ) {
				$messages[] = array(
					'type'		 => 'error',
					'message'	 => __( 'Map not added! Enter a name at least!', 'mhs_tm' )
				);
				$this->maps_menu( $messages );
				return;
			}

			if ( $_GET[ 'id' ] != NULL ) {
				$options = array( 'name' => $_POST[ 'name' ]
				);
			} else {
				$options = array( 'name' => $_POST[ 'name' ]
				);
			}
			$options = json_encode( $options );

			if ( $_POST[ 'selected' ] == 1 ) {
				$selected_id = $wpdb->get_results(
				"SELECT id FROM " . $wpdb->prefix . "mhs_tm_maps " .
				"WHERE selected = 1", ARRAY_A
				);

				$selected_id = $selected_id[ 0 ][ 'id' ];
				
				$wpdb->update(
				$wpdb->prefix . 'mhs_tm_maps', array(
					'selected' => 0
				), array( 'id' => $selected_id ), array( '%d' ), array( '%d' )
				);
			}

			if ( isset( $_GET[ 'id' ] ) && $_GET[ 'id' ] != NULL ) {
				$wpdb->update(
				$wpdb->prefix . 'mhs_tm_maps', array(
					'active'	 => 1,
					'route_ids'	 => json_encode( $_POST[ 'route_ids' ] ),
					'options'	 => $options,
					'selected'	 => $_POST[ 'selected' ]
				), array( 'id' => $_GET[ 'id' ] ), array( '%d', '%s', '%s', '%d' ), array( '%d' )
				);
				$messages[] = array(
					'type'		 => 'updated',
					'message'	 => __( 'Map successfully updated!', 'mhs_tm' )
				);
			} else {
				$wpdb->insert(
				$wpdb->prefix . 'mhs_tm_maps', array(
					'active'		 => 1,
					'route_ids'		 => json_encode( $_POST[ 'route_ids' ] ),
					'options'		 => $options,
					'selected'		 => $_POST[ 'selected' ],
					'create_date'	 => date( "Y-m-d H:i:s" )
				), array( '%d', '%s', '%s', '%d', '%s' )
				);
				$messages[] = array(
					'type'		 => 'updated',
					'message'	 => __( 'Map successfully added!', 'mhs_tm' )
				);
			}
			$this->maps_menu( $messages );
		}

		/**
		 * get routes
		 * 
		 * returns an array of all route ids
		 *
		 * @since 1.0
		 * @access public
		 */
		function get_routes_array() {
			global $wpdb;

			$route_array = [ ];
			$routes		 = [ ];

			$routes = $wpdb->get_results(
			"SELECT * FROM " . $wpdb->prefix . "mhs_tm_routes " .
			"WHERE active = 1 ORDER BY updated DESC", ARRAY_A
			);

			foreach ( $routes as $route ) {
				$route_option = json_decode( $route[ 'options' ], true );

				$route_array[] = ['value'	 => $route[ 'id' ],
					'label'	 => 'id: ' . $route[ 'id' ] . ' | ' . $route_option[ 'name' ]
				];
			}

			return $route_array;
		}
		
		/**
		 * Get selected map id
		 *
		 * @since 1.0
		 * @access public
		 */
		public function get_selected_map() {
			global $wpdb;
			
			// get old selected map and set it to unselected
			$selected_id = $wpdb->get_results(
			"SELECT id FROM " . $wpdb->prefix . "mhs_tm_maps " .
			"WHERE selected = 1", ARRAY_A
			);

			return $selected_id[ 0 ][ 'id' ];
		}

	}

	 // class

endif; // class exists