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
			
			//save Get and Post
			$todo = isset(  $_GET[ 'todo' ] ) ? sanitize_text_field( $_GET[ 'todo' ] ) : 'default';
			$id	  = isset(  $_GET[ 'id' ] ) ? absint( $_GET[ 'id' ] ) : null;

			switch ( $todo ) {

				case 'delete':
					// delete are defined in list_table_maps.php
					break;

				case 'select':
					//validate the input
					if( is_numeric( $id ) ) {
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
						), array( 'id' => $id ), array( '%d' ), array( '%d' )
						);

						$messages[] = array(
							'type'		 => 'updated',
							'message'	 => __( 'Map successfully selected!', 'mhs_tm' )
						);
					} else {
						$messages[] = array(
							'type'		 => 'error',
							'message'	 => __( 'Something went wrong!', 'mhs_tm' )
						);
					}
					
					$this->maps_menu( $messages );

					break;

				case 'unselect':
					//validate the input
					if( is_numeric( $id ) ) {
						// Set new map to unselected
						$wpdb->update(
						$wpdb->prefix . 'mhs_tm_maps', array(
							'selected' => 0
						), array( 'id' => $id ), array( '%d' ), array( '%d' )
						);

						$messages[] = array(
							'type'		 => 'updated',
							'message'	 => __( 'Map successfully unselected!', 'mhs_tm' )
						);
					} else {
						$messages[] = array(
							'type'		 => 'error',
							'message'	 => __( 'Something went wrong!', 'mhs_tm' )
						);
					}
					
					$this->maps_menu( $messages );
					
					break;

				case 'save':
					//validate the input
					if( is_numeric( $id ) ) {
						$this->maps_save( $id );
					} elseif ( $id == 0 ) {
						$this->maps_save( );
					} else {
						$messages[] = array(
							'type'		 => 'error',
							'message'	 => __( 'Something went wrong!', 'mhs_tm' )
						);
					
						$this->maps_menu( $messages );
					}
					break;

				case 'edit':
					//validate the input
					if( is_numeric( $id ) ) {
						$this->maps_edit( $id );
					} else {
						$messages[] = array(
							'type'		 => 'error',
							'message'	 => __( 'Something went wrong!', 'mhs_tm' )
						);
					
						$this->maps_menu( $messages );
					}
					break;

				case 'new':
					$this->maps_edit();
					break;

				default:
					$this->maps_menu();
					break;
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
                     <input type="hidden" name="page" value="' . esc_attr( $_REQUEST['page'] ) . '" />
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
			global $MHS_TM_Maps;

			$url		 = 'admin.php?page=MHS_TM-maps';
			$form_action = $url . '&amp;todo=save&amp;id=' . $id;

			if ( !is_numeric( $id ) ) {
				$title	 = sprintf( __( 'Add New Map', 'mhs_tm' ) );
				$fields	 = $this->maps_fields();
				$nonce	 = 'mhs_tm_maps_save';
			} else {
				$map_options		 = $MHS_TM_Maps->get_map_options( $id );
				$title	 = sprintf( __( 'Edit &quot;%s&quot;', 'mhs_tm' ), $map_options['name'] );
				$fields	 = $this->maps_fields( $id );
				$nonce	 = 'mhs_tm_maps_save_' . $id;
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
				'fields'	 => $fields,
				'nonce'		 => $nonce
			);
			$form	 = new MHS_TM_Admin_Form( $args );

			echo $adminpage->top();
			echo do_shortcode( '[mhs-travel-map map_id=' . $id . '] </br>' );
			echo $form->output();
			echo $adminpage->bottom();

			$route_ids		 = $this->get_routes_array();
			$coordinates_all = array();
			foreach ( $route_ids as $route ) {
				$coordinates_all[ $route['value'] ] = $MHS_TM_Maps->get_coordinates( $route['value'], 'route' );
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
					$wpdb->prepare( 'SELECT * FROM ' . $wpdb->prefix . 'mhs_tm_maps' . ' WHERE id = %d LIMIT 1', $id ), 
					ARRAY_A );
				$data	 = $data[0];
				
				$json_array = json_decode( $data['options'], true );
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
					if( isset( $maps_fields[ $i ]['fields'] ) ) {
						$fcount = count( $maps_fields[ $i ]['fields'] );
						for ( $j = 0; $j < $fcount; $j++ ) {
							if ( $maps_fields[ $i ]['fields'][ $j ]['id'] == 'route_ids[]' ) {
								if( isset( $data['route_ids'] ) ) {
									$maps_fields[ $i ]['fields'][ $j ]['value'] = json_decode( $data['route_ids'], true );
								}
							} else {
								if( isset( $data[ $maps_fields[ $i ]['fields'][ $j ]['id'] ] ) ) {
									$maps_fields[ $i ]['fields'][ $j ]['value'] = stripslashes( $data[ $maps_fields[ $i ]['fields'][ $j ]['id'] ] );
								}	
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
			global $wpdb, $MHS_TM_Admin_Utilities;

			// save variables
			$todo_check		= isset( $_POST['todo_check'] ) ? sanitize_text_field( $_POST['todo_check'] ) : null;
			$name			= isset( $_POST['name'] ) ? sanitize_text_field( $_POST['name'] ) : null;
			$selected		= isset( $_POST['selected'] ) ? (int)$_POST['selected'] : null;
			$route_ids		= isset( $_POST['route_ids'] ) ? $MHS_TM_Admin_Utilities->sanitize_id_array( ( $_POST['route_ids'] ) ) : [];
			if ( $id != NULL ) {
				$nonce		= 'mhs_tm_maps_save_' . $id;
				$nonce_key	= isset( $_POST['mhs_tm_maps_save_' . $id . '_nonce'] ) ? esc_attr( $_POST['mhs_tm_maps_save_' . $id . '_nonce'] ) : null;
			} else {
				$nonce = 'mhs_tm_maps_save';
				$nonce_key	= isset( $_POST['mhs_tm_maps_save_nonce'] ) ? esc_attr( $_POST['mhs_tm_maps_save_nonce'] ) : null;
			}
			
			//validate data
			if ( !isset( $todo_check ) ) {
				$this->maps_menu();
				return;
			}
			
			if ( !isset( $name ) || $name === NULL || $name == '' ) {
				$messages[] = array(
					'type'		 => 'error',
					'message'	 => __( 'Map not saved! Enter a name at least!', 'mhs_tm' )
				);
				$this->maps_menu( $messages );
				return;
			}
			
			if ( $selected != 0 && $selected != 1 ||
			!wp_is_numeric_array( $route_ids ) && $route_ids !== null || 
			!wp_verify_nonce( $nonce_key, $nonce ) ) {
				$messages[] = array(
					'type'		 => 'error',
					'message'	 => __( 'Something went wrong!', 'mhs_tm' )
				);
				$this->maps_menu( $messages );
				return;
			}
			
			if ( $id != NULL ) {
				$options = array( 'name' => $name
				);
			} else {
				$options = array( 'name' => $name
				);
			}
			$options = json_encode( $options );

			if ( $selected == 1 ) {
				$selected_id = $wpdb->get_results(
				'SELECT id FROM ' . $wpdb->prefix . 'mhs_tm_maps ' .
				'WHERE selected = 1', ARRAY_A
				);

				$selected_id = $selected_id[0]['id'];
				
				$wpdb->update(
				$wpdb->prefix . 'mhs_tm_maps', array(
					'selected' => 0
				), array( 'id' => $selected_id ), array( '%d' ), array( '%d' )
				);
			}

			if ( isset( $id ) && $id != NULL ) {
				$wpdb->update(
				$wpdb->prefix . 'mhs_tm_maps', array(
					'active'	 => 1,
					'route_ids'	 => json_encode( $route_ids ),
					'options'	 => $options,
					'selected'	 => $selected
				), array( 'id' => $id ), array( '%d', '%s', '%s', '%d' ), array( '%d' )
				);
				$messages[] = array(
					'type'		 => 'updated',
					'message'	 => __( 'Map successfully updated!', 'mhs_tm' )
				);
			} else {
				$wpdb->insert(
				$wpdb->prefix . 'mhs_tm_maps', array(
					'active'		 => 1,
					'route_ids'		 => json_encode( $route_ids ),
					'options'		 => $options,
					'selected'		 => $selected,
					'create_date'	 => date( 'Y-m-d H:i:s' )
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

			$route_array = [];
			$routes		 = [];

			$routes = $wpdb->get_results(
			'SELECT * FROM ' . $wpdb->prefix . 'mhs_tm_routes ' .
			'WHERE active = 1 ORDER BY updated DESC', ARRAY_A
			);

			foreach ( $routes as $route ) {
				$route_option = json_decode( $route['options'], true );

				$route_array[] = ['value'	 => $route['id'],
					'label'	 => 'id: ' . $route['id'] . ' | ' . $route_option['name']
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
			'SELECT id FROM ' . $wpdb->prefix . 'mhs_tm_maps ' .
			'WHERE selected = 1', ARRAY_A
			);

			return $selected_id[0]['id'];
		}

	}

	 // class

endif; // class exists