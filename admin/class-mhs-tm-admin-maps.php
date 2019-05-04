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
			global $wpdb, $MHS_TM_Admin, $List_Table_Map_Routes;
			
			$messages = array();
			$url = 'admin.php?page=MHS_TM-maps';
			
			//save Get and Post
			$todo       = isset(  $_GET[ 'todo' ] ) ? sanitize_text_field( $_GET[ 'todo' ] ) : 'default';
			$id         = isset(  $_GET[ 'id' ] ) ? absint( $_GET[ 'id' ] ) : null;
                        $nonce      = isset( $_GET['_wpnonce'] ) ? esc_attr( $_GET['_wpnonce'] ) : null;

			switch ( $todo ) {

				case 'delete':
					// delete are defined in list_table_maps.php
					break;

				case 'select':
					//validate the input
					if( is_numeric( $id ) && wp_verify_nonce( $nonce, 'mhs_tm_select_map' . $id ) ) {
						// get old selected map and set it to unselected
						$selected_id = $this->get_selected_map();

						if( $selected_id !== NULL ) {
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
					if( is_numeric( $id ) && wp_verify_nonce( $nonce, 'mhs_tm_select_map' . $id ) ) {
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
		private function maps_edit( $id = NULL, $messages = NULL ) {
                    global $MHS_TM_Maps, $MHS_TM_Utilities, $wpdb;

                    $table_name  = $wpdb->prefix . 'mhs_tm_routes';
                    $url         = 'admin.php?page=MHS_TM-maps';
                    $form_action = $url . '&amp;todo=save&amp;id=' . $id;
                    $height      = 10;
                    $message  = isset( $_GET['message'] ) ? sanitize_text_field( $_GET['message'] ) : null;

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

//                    $custom_buttons = array(
//                            '<a href="javascript:void(0);" id="mhs_tm_update_map" class="button-secondary margin" 
//                                    title="Update the map">' . __( 'update map', 'mhs_tm' ) . '</a>',
//                    );
                    
                    switch( $message ) {
                        case 'route_added':
                            $messages[] = array(
                                'type'		 => 'updated',
                                'message'	 => __( 'Route successfully added!', 'mhs_tm' )
                            );
                            break;
                        
                        case 'route_removed':
                            $messages[] = array(
                                'type'		 => 'updated',
                                'message'	 => __( 'Route successfully removed!', 'mhs_tm' )
                            );
                            break;
                        
                        case 'error':
                            $messages[] = array(
                                'type'		 => 'error',
                                'message'	 => __( 'Something went wrong!', 'mhs_tm' )
                            );
                            break;
                        
                        default:
                            break;
                    }
                   
                    $adminpage = new MHS_TM_Admin_Page( array(
                            'title'	 => $title,
                            'messages'	 => $messages,
                            'url'	 => $url
                    ) );

                    $args	 = array(
                        'echo'		     => false,
                        'form'		     => true,
                        'metaboxes'	     => true,
                        'action'	     => $form_action,
//                        'custom_buttons'     => $custom_buttons,
                        'id'		     => $id,
                        'back'		     => true,
                        'back_url'	     => $url,
                        'fields'	     => $fields,
                        'bottom_button'      => true,
                        'nonce'		     => $nonce,
                        'button'             => 'Save map settings'
                    );
                    $form	 = new MHS_TM_Admin_Form( $args );

                    echo $adminpage->top();
                    echo do_shortcode( '[mhs-travel-map map_id=' . $id . ' run_shortcodes=0] </br>' );
                    echo $form->output();
                    
                    echo '<h2>Add routes to map</h2> <hr>';
                    
                    // if there is no id the route is new and first you have to 
                    // save the route before you can add routes to the map
                    if ( !is_numeric( $id ) ) {
                        echo '<p>Please save the new map first to add routes to the map!</p>';
                    } else {
                        $ListTable = new List_Table_Map_Routes( $id );
                        $ListTable->prepare_items();
                        echo '<!-- Forms are NOT created automatically, so you need to wrap the table in one to use features like bulk actions -->
                            <form id="list_table" method="post">';
//                        echo $ListTable->search_box( 'search', 'search_id' );
                        echo        $ListTable->display();
                    }
                    
                    echo $adminpage->bottom();

                    echo '<div style="display: none;" id="mhs_tm_dialog_info" title="Info" >'
                    . '<div class="mhs_tm-map" id="mhs_tm_map_canvas_0" style="height: ' . esc_attr( $height ) . 'px; margin-right: auto ; margin-left: auto ; padding: 0;"></div>'
                    . '</div>';

                    $route_ids		 = $this->get_routes_array();
                    $coordinates_all = array();
                    foreach ( $route_ids as $route ) {
                            $coordinates_all[ $route['value'] ] = $MHS_TM_Maps->get_coordinates( $route['value'], 'route' );
                    }

			wp_enqueue_script( 'mhs_tm_admin_maps' );
			wp_localize_script( 'mhs_tm_admin_maps', 'mhs_tm_app_vars', array(
				'coordinates_all' => $coordinates_all
			) );

                    $key = $MHS_TM_Utilities->get_gmaps_api_key();

                    wp_register_script( 'googlemap', 'https://maps.googleapis.com/maps/api/js?key=' . $key, true );
                    wp_enqueue_script( 'googlemap' );

                    $routes = $wpdb->get_results(
                        'SELECT * FROM ' . $table_name .
                        ' WHERE active = 1 order by updated DESC', ARRAY_A
                    );

                    $plugin_settings = $MHS_TM_Utilities->get_plugin_settings();
                    $map_options['transport_classes'] = $plugin_settings['transport_classes'];

                    wp_enqueue_script( 'mhs_tm_map' );
                    wp_localize_script( 'mhs_tm_map', 'mhs_tm_app_vars_0', array(
                            'coordinates'		=> $routes,
                            'coord_center_lat'	=> 54.023884,
                            'coord_center_lng'	=> 9.377068,
                            'auto_load'		=> false,
                            'map_id'		=> 0,
                            'map_options'		=> $map_options,
                            'plugin_dir'		=> MHS_TM_RELPATH,
                            'ajax_url'		=> admin_url( 'admin-ajax.php' ),
                    ) );

                    wp_enqueue_script( 'mhs_tm_admin_routes' );
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
                                'title'	 => __( 'Map settings', 'mhs_tm' ),
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
                                    ),
                                    array(
                                        'type'	 => 'text',
                                        'label'	 => __( 'Start zoom on last added routes?', 'mhs_tm' ),
                                        'id'	 => 'zoom',
                                        'desc'	 => __( 'If you enter a number the map will zoom at the first load on the entered 
                                                number of last routes sorted by time. If you which to zoom on all routes leave the field 
                                                blank or enter 0. ', 'mhs_tm' )
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
                                                    if( isset( $data[ $maps_fields[ $i ]['fields'][ $j ]['id'] ] ) ) {
                                                            $maps_fields[ $i ]['fields'][ $j ]['value'] = stripslashes( $data[ $maps_fields[ $i ]['fields'][ $j ]['id'] ] );
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
			$zoom			= isset( $_POST['zoom'] ) ? sanitize_text_field( (int)$_POST['zoom'] ) : null;
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
				$options = array( 
					'name' => $name,
					'zoom' => $zoom
				);
			} else {
				$options = array( 
					'name' => $name,
					'zoom' => $zoom
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
					'options'	 => $options,
					'selected'	 => $selected
				), array( 'id' => $id ), array( '%d', '%s', '%d' ), array( '%d' )
				);
				$messages[] = array(
					'type'		 => 'updated',
					'message'	 => __( 'Map successfully updated!', 'mhs_tm' )
				);
			} else {
				$wpdb->insert(
				$wpdb->prefix . 'mhs_tm_maps', array(
					'active'		 => 1,
					'options'		 => $options,
					'selected'		 => $selected,
					'create_date'	 => date( 'Y-m-d H:i:s' )
				), array( '%d', '%s', '%d', '%s' )
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
					'label'	 => 'id: ' . $route['id'] . ' | ' . stripslashes( $route_option['name'] )
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
		
		/**
		 * Bulk action handler
		 *
		 * @since 1.5.0
		 * @access public
		 */
		public function mhs_tm_change_map_routes() {
                    global $MHS_TM_Admin_Utilities, $MHS_TM_Maps, $wpdb, $MHS_TM_Admin;

                    $remove_id  = isset( $_GET[ 'remove_id' ] ) ? sanitize_text_field( $_GET[ 'remove_id' ] ) : null;
                    $add_id     = isset( $_GET[ 'add_id' ] ) ? sanitize_text_field( $_GET[ 'add_id' ] ) : null;
                    $map_id     = isset( $_GET[ 'id' ] ) ? sanitize_text_field( $_GET[ 'id' ] ) : null;
                    $nonce_get  = isset( $_GET['_wpnonce'] ) ? esc_attr( $_GET['_wpnonce'] ) : null;
                    $wp_referer = isset( $_GET['referer'] ) ? htmlspecialchars_decode( $_GET['referer'] ) : null;
                    
                    error_log($remove_id . "\n", 3,  'C:\xampp\htdocs\my_errors.log');
                    error_log( $add_id . "\n", 3,  'C:\xampp\htdocs\my_errors.log');
                    error_log( $map_id . "\n", 3,  'C:\xampp\htdocs\my_errors.log');
                    error_log( $nonce_get . "\n", 3,  'C:\xampp\htdocs\my_errors.log');
                    error_log( $wp_referer . "\n", 3,  'C:\xampp\htdocs\my_errors.log');
                    error_log( wp_verify_nonce( $nonce_get, 'mhs_tm_remove_route_from_map' . absint( $remove_id ) ) . "\n", 3,  'C:\xampp\htdocs\my_errors.log');
                    error_log( wp_verify_nonce( $nonce_get, 'mhs_tm_add_route_from_map' . absint( $add_id ) ) . "\n", 3,  'C:\xampp\htdocs\my_errors.log');
                    
                    if ( wp_verify_nonce( $nonce_get, 'mhs_tm_remove_route_from_map' . absint( $remove_id ) ) && $map_id != null ) {

                        $routes_of_map = $MHS_TM_Maps->get_routes_of_map( $map_id );

                        if ( is_numeric( $remove_id ) ) {
                            if( in_array( $remove_id, $routes_of_map ) ) {
                                array_splice( $routes_of_map, array_search( $remove_id, $routes_of_map ), 1 );
                            } 
                        }

                        $wpdb->update(
                            $wpdb->prefix . 'mhs_tm_maps', array(
                                'route_ids'	 => json_encode( $routes_of_map ),
                            ), array( 'id' => $map_id ), array( '%s' ), array( '%d' )
                        );  

                        wp_safe_redirect( add_query_arg( 'message', 'route_removed', $wp_referer ) );
                        exit();

                    } else if ( wp_verify_nonce( $nonce_get, 'mhs_tm_add_route_from_map' . absint( $add_id ) ) && $map_id != null ) {

                        $routes_of_map = $MHS_TM_Maps->get_routes_of_map( $map_id );

                        if ( is_numeric( $add_id ) ) {
                            if( ! in_array( $add_id, $routes_of_map ) ) {
                                $routes_of_map[] = $add_id;
                            } 
                        }

                        $wpdb->update(
                            $wpdb->prefix . 'mhs_tm_maps', array(
                                'route_ids'	 => json_encode( $routes_of_map ),
                            ), array( 'id' => $map_id ), array( '%s' ), array( '%d' )
                        );  

                        wp_safe_redirect( add_query_arg( 'message', 'route_added', $wp_referer ) );
                        exit();

                    } else { 
                        wp_safe_redirect( add_query_arg( 'message', 'error', $wp_referer ) );
                        exit(); 
                    }
                }
	}

	 // class

endif; // class exists