<?php

/**
 * MHS_TM_Admin_Maps class.
 *
 * This class contains properties and methods for
 * the creation of new maps.
 *
 * @since 1.0
 */
if ( !class_exists( 'MHS_TM_Admin_Map_Edit' ) ) :

	class MHS_TM_Admin_Map_Edit {
		/* CONTROLLERS */

		/**
		 * Maps edit menu
		 *
		 * @since 1.0
		 * @access private
		 */
		public function maps_edit() {
                    global $MHS_TM_Maps, $MHS_TM_Utilities, $MHS_TM_Admin, 
                            $MHS_TM_Admin_Maps, $wpdb;

                    $id  = isset( $_GET['id'] ) ? sanitize_text_field( $_GET['id'] ) : null;
                    $table_name  = $wpdb->prefix . 'mhs_tm_routes';
                    $url         = 'admin.php?page=mhs_tm-maps';
                    $form_action = $url . '&amp;todo=save&amp;id=' . $id;
                    $height      = 10;
                    $message     = isset( $_GET['message'] ) ? sanitize_text_field( $_GET['message'] ) : null;
                    $messages    = array();

                    if ( !is_numeric( $id ) ) {
                        $this->maps_new();
                    } else {
                        $map_options = $MHS_TM_Maps->get_map_options( $id );
                        $title	 = sprintf( __( 'Edit &quot;%s&quot;', 'mhs_tm' ), $map_options['name'] );
                        $fields	 = $MHS_TM_Admin_Maps->maps_fields( $id );
                        $nonce	 = 'mhs_tm_maps_save_' . $id;

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
                        $ListTable = new List_Table_Map_Routes( $id );
                        $ListTable->prepare_items();
                        echo '<!-- Forms are NOT created automatically, so you need to wrap the table in one to use features like bulk actions -->
                            <form id="list_table" method="post">';
    //                        echo $ListTable->search_box( 'search', 'search_id' );
                        echo        $ListTable->display();

                        echo $adminpage->bottom();

                        echo '<div style="display: none;" id="mhs_tm_dialog_info" title="Info" >'
                        . '<div class="mhs_tm-map" id="mhs_tm_map_canvas_0" style="height: ' . esc_attr( $height ) . 'px; margin-right: auto ; margin-left: auto ; padding: 0;"></div>'
                        . '</div>';

                        $route_ids       = $MHS_TM_Admin_Maps->get_routes_array();
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
                }

		/**
		 * Maps new menu
		 *
		 * @since 1.5.0
		 * @access private
		 */
		public function maps_new() {
                    global $wpdb, $MHS_TM_Admin_Maps;

                    $url         = 'admin.php?page=mhs_tm-maps';
                    $form_action = $url . '&amp;todo=save';
                    $messages  = isset( $_GET['message'] ) ? sanitize_text_field( $_GET['message'] ) : null;

                    $title	 = sprintf( __( 'Add New Map', 'mhs_tm' ) );
                    $fields	 = $MHS_TM_Admin_Maps->maps_fields();
                    $nonce	 = 'mhs_tm_maps_save';
                                     
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
                        'back'		     => true,
                        'back_url'	     => $url,
                        'fields'	     => $fields,
                        'bottom_button'      => true,
                        'nonce'		     => $nonce,
                        'button'             => 'Save map settings'
                    );
                    $form	 = new MHS_TM_Admin_Form( $args );

                    echo $adminpage->top();
                    echo $form->output();                    
                    echo $adminpage->bottom();
		}
	}

	 // class

endif; // class exists