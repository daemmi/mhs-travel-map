<?php

/**
 * MHS_TM_Admin_Form class.
 *
 * This class contains properties and methods
 * to display user input forms in the administrative backend
 *
 * @package MHS Travel Map
 * @since 1.1
 */
if ( !class_exists( 'MHS_TM_Admin_Form' ) ) :

	class MHS_TM_Admin_Form {

		/**
		 * Class Properties
		 *
		 * @since 1.0
		 */
		private $slug = 'mhs_tm';
		
		private $default_args	 = array(
			'echo'			 => true,
			'form'			 => false,
			'headspace'		 => false,
			'method'		 => 'post',
			'metaboxes'		 => false,
			'js'			 => false,
			'url'			 => '#',
			'action'		 => '',
			'nonce'			 => 'mhs_tm',
			'id'			 => 0,
			'button'		 => 'Save',
			'custom_buttons' => array(),
			'top_button'	 => true,
			'bottom_button'	 => true,
			'back'			 => false,
			'back_url'		 => '#',
			'has_cap'		 => true,
			'fields'		 => array(),
			'hide'			 => false
		);
		private $args			 = array();

		/**
		 * PHP4 style constructor
		 *
		 * @since 1.0
		 * @access public
		 */
//		public function MHS_TM_Admin_Form( $args ) {
//			$this->__construct( $args );
//		}

		/**
		 * PHP5 style constructor
		 *
		 * @since 1.0
		 * @access public
		 */
		public function __construct( $args ) {
			$this->default_args[ 'button' ] = __( 'Save', 'mhs_tm' );

			$this->args = wp_parse_args( $args, $this->default_args );
		}

		/**
		 * Constructs the form HTML,
		 * echoes or returns it
		 *
		 * @since 1.0
		 * @access public
		 */
		public function output() {
			extract( $this->args );

			$output = '';

			$the_button = '<input type="submit" name="submit" class="button-primary ' . esc_attr( $this->slug ) . '_admin_form_submit" value="' . esc_attr( $button ) . '">';

			if ( $form ) {
				echo '<form id="mhs_tm-form" enctype="multipart/form-data" method="' . esc_attr( $method ) . '" action="' . esc_attr( $action ) . '"';
				if ( $headspace ) {
					echo ' class="headspace"';
				}
				if ( $hide ) {
					echo ' style="display: none;"';
				}

				echo '> <input type="hidden" name="MAX_FILE_SIZE" value="3000000" />';
				if ( $back ) {
					echo '<a href="' . esc_url( $back_url ) . '" class="button-secondary margin" title="' . __( 'Back to where you came from...', 'mhs_tm' ) . '">' .
					'&larr; ' . __( 'back', 'mhs_tm' ) .
					'</a>';
				}
				if ( $top_button && $has_cap ) {
					echo $the_button;
				}
				if ( sizeof( $custom_buttons ) > 0 ) {
					foreach( $custom_buttons as $custom_button ) {
						echo $custom_button;
					}
				}
				echo '<input type="hidden" name="submitted" value="y"/>' .
				'<input type="hidden" name="edit_val" value="' . esc_attr( $id ) . '"/>';
				if ( 'post' === $method ) {
					echo wp_nonce_field( $nonce, $nonce . '_nonce', false, false ) .
					wp_nonce_field( 'meta-box-order', 'meta-box-order-nonce', false, false ) .
					wp_nonce_field( 'closedpostboxes', 'closedpostboxesnonce', false, false );
				}
			}

			if ( $metaboxes ) {
				echo '<div class="' . $this->slug . '_poststuff noflow"><div class="' . $this->slug . '_metabox_holder">
					<div class="' . $this->slug . '_postbox_container">';
				if ( $js ) {
					echo '<div class="' . $this->slug . '_normal_sortables ui-sortable ui-accordion">';
				}
				foreach ( $fields as $box ) {
					echo '<div class="postbox_mhs_tm';
					if ( isset( $box[ 'class' ] ) ) {
						echo ' ' . esc_attr( $box[ 'class' ] );
					}
					echo '"';
					if ( isset( $box[ 'display' ] ) && $box[ 'display' ] == 'none' ) {
						echo ' style="display: none;" ';
					}

					echo '>';

					if ( $js ) {
						echo '<h1 style="overflow: auto;" class="hndle"';
					} else {
						echo '<h1 class="no-hover"';
					}
					echo '>';
					if ( isset( $sortable_handler ) ){
						echo '<span class="' . $sortable_handler . '"></span>';
					}
					echo '<span class="postbox_title">' . esc_attr( $box[ 'title' ] ) . '</span></h1>' .
					'<div class="inside">' .
					'<table class="form-table pool-form"><tbody>';

					foreach ( $box[ 'fields' ] as $field ) {
						echo $this->field( $field );
					}
					echo '</tbody></table></div></div>';
				}
			} else {
				echo '<table class="form-table pool-form"><tbody>';
				foreach ( $fields as $field ) {
					echo $this->field( $field );
				}
				echo '</tbody></table>';
			}

			if ( $metaboxes ) {
				if ( $js ) {
					echo '</div>';
				}
				echo '</div></div></div>';
			}

			if ( $form ) {
				if ( $bottom_button && $has_cap ) {
					echo $the_button;
				}
				echo '</form>';
			}

			if ( $echo ) {
				echo $output;
			}
			return $output;
		}

		/**
		 * Returns the HTML
		 * for a single form table row
		 *
		 * @since 1.0
		 * @access private
		 */
		private function field( $field ) {

			$output = '';

			$field[ 'name' ] = (!isset( $field[ 'name' ] ) || empty( $field[ 'name' ] ) ) ? $field[ 'id' ] : $field[ 'name' ];

			if ( !isset( $field[ 'value' ] ) ) {
				$field[ 'value' ] = '';
			}

			if ( 'hidden' !== $field[ 'type' ] ) {
				echo '<tr valign="top" id="row-' . esc_attr( $field[ 'id' ] ) . '"';
				if ( ( isset( $field[ 'row-class' ] ) && isset( $field[ 'js-only' ] ) && true === $field[ 'js-only' ] ) || ( isset( $field[ 'row-class' ] ) && !empty( $field[ 'row-class' ] ) ) ) {
					echo 'class="';
					if ( isset( $field[ 'row-class' ] ) && !empty( $field[ 'row-class' ] ) ) {
						echo esc_attr( $field[ 'row-class' ] );
					}
					if ( isset( $field[ 'js-only' ] ) && true === $field[ 'js-only' ] ) {
						if ( isset( $field[ 'row-class' ] ) && !empty( $field[ 'row-class' ] ) ) {
							echo ' ';
						}
						echo 'no-js-hide';
					}
					echo '"';
				}
				echo '>';

				if ( isset( $field[ 'label' ] ) ) {
					echo '<th scope="row">';
					if ( $field[ 'type' ] != 'section' && isset( $field[ 'label' ] ) && !empty( $field[ 'label' ] ) ) {
						echo '<label for="' .
						esc_attr( $field[ 'id' ] ) .
						'">' .
						esc_attr( $field[ 'label' ] ) .
						'</label>';
					}
					echo '</th>';
				}
				echo '<td>';
			}

			switch ( $field[ 'type' ] ) {
				case 'section':
					echo '<h3>' . esc_attr( $field[ 'label' ] ) . '</h3>';
					break;

				case 'hidden':
					echo '<input type="hidden" ' .
					'name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" class="input' .
					'" value="' . esc_html( $field[ 'value' ] ) . '" />';
					break;

				case 'tel':
					echo '<input type="tel" class="input input-tel"' .
					'name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" value="' . esc_html( $field[ 'value' ] ) . '" size="40"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo ' />';
					break;

				case 'email':
					echo '<input type="email" class="input input-email"' .
					'name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" value="' . esc_html( $field[ 'value' ] ) . '" size="40"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo ' />';
					break;

				case 'textarea':
					echo '<textarea name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" cols="100" rows="5"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo '>' . esc_textarea( $field[ 'value' ] ) . '</textarea>';
					break;

				case 'textarea_long':
					echo '<textarea  style="width: 100%;" name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" cols="100" rows="5"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo '>' . esc_html( $field[ 'value' ] ) . '</textarea>';
					break;

				case 'wp_editor':
					$content	 = esc_attr( $field[ 'value' ] );
					$editor_id	 = esc_attr( $field[ 'id' ] );
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
					//filter to increase the allowed tags from wp_kses_post
					$class = new MHS_TM_Admin_Utilities();
					add_filter( 'wp_kses_allowed_html', array( $class, 'add_wpkses_tags' ), 10, 2 );
					wp_editor( wp_kses_post( $content ), $editor_id, $settings );
					break;

				case 'html_div':
					//filter to increase the allowed tags from wp_kses_post
					$class = new MHS_TM_Admin_Utilities();
					add_filter( 'wp_kses_allowed_html', array( $class, 'add_wpkses_tags' ), 10, 2 );
					echo '<div  class="html_div" name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] );
					echo '">' . wp_kses_post( $field[ 'value' ] ) . '</div>';
					break;

				case 'select':
					echo '<select name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) . '"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					if ( isset( $field[ 'multiple' ] ) && $field[ 'multiple' ] === true ) {
						echo ' multiple ';
					}
					if ( isset( $field[ 'size' ] ) && $field[ 'size' ] >= 0 ) {
						echo 'size="' . esc_attr( $field[ 'size' ] ) . '"';
					}
					echo '>';
					if ( isset( $field[ 'multiple' ] ) && $field[ 'multiple' ] === true ) {
						foreach ( $field[ 'options' ] as $option ) {
							echo '<option';
							if ( is_array( $field[ 'value' ] ) ) {
								if ( ( in_array( $option[ 'value' ], $field[ 'value' ] ) && $option[ 'value' ] != 0 ) ) {
									echo ' selected="selected"';
								}
							}
							echo ' value="' . $option[ 'value' ] . '">' . esc_attr( $option[ 'label' ] ) . '&nbsp;</option>';
						}
					} else {
						foreach ( $field[ 'options' ] as $option ) {
							echo '<option';
							if ( ( $field[ 'value' ] == $option[ 'value' ] && $option[ 'value' ] != 0 ) || $field[ 'value' ] === $option[ 'value' ] ) {
								echo ' selected="selected"';
							}
							echo ' value="' . esc_attr( $option[ 'value' ] ) . '">' . esc_attr( $option[ 'label' ] ) . '&nbsp;</option>';
						}
					}
					echo '</select>';
					break;

				case 'checkbox':
					echo '<input type="checkbox"' .
					'name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) . '" ';
					if ( isset( $field[ 'value' ] ) && !empty( $field[ 'value' ] ) ) {
						echo ' checked="checked"';
					}
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo '/><label for="' . esc_attr( $field[ 'id' ] ) . '">' . esc_attr( $field[ 'label' ] ) . '</label>';
					break;

				case 'radio':
					$end = count( $field[ 'options' ] );
					$i	 = 1;
					foreach ( $field[ 'options' ] as $option ) {
						echo '<input type="radio"' .
						'name="' . esc_attr( $field[ 'name' ] ) .
						'" id="' . esc_attr( $field[ 'id' ] ) . '_' . esc_attr( $option[ 'value' ] ) .
						'" value="' . esc_attr( $option[ 'value' ] ) . '" ';

						if ( $field[ 'value' ] == $option[ 'value' ] ) {
							echo ' checked="checked"';
						}
						if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
							echo ' disabled="disabled"';
						}
						echo ' /><label for="' . esc_attr( $field[ 'id' ] ) . '_' . esc_attr( $option[ 'value' ] ) . '">' . esc_attr( $option[ 'label' ]) . '</label>';
						if ( $i < $end ) {
							echo '<br />';
						}
						$i++;
					}
					break;

				case 'checkbox_group':
				case 'checkbox-group':

					if ( isset( $field[ 'cols' ] ) ) {
						$cols = $field[ 'cols' ];
					} else {
						$cols = 3;
					}

					if ( !empty( $field[ 'options' ] ) ) {

						if ( $cols !== 1 ) {
							echo '<table class="table-inside-table table-mobile-collapse subtable subtable-' . $field[ 'id' ] . '"><tr><td>';
							$i	 = 1;
							$end = count( $field[ 'options' ] );
						}
						$optcount	 = count( $field[ 'options' ] );
						$j			 = 1;
						foreach ( $field[ 'options' ] as $option ) {

							echo '<input type="checkbox"' .
							'value="' . esc_attr( $option[ 'value' ] ) . '" ' .
							'name="' . esc_attr( $field[ 'name' ] ) . '[]" ' .
							'class="' . esc_attr( $field[ 'id' ] ) . '" ' .
							'id="' . esc_attr( $field[ 'id' ] ) . '_' . esc_attr( $option[ 'value' ] ) . '"';

							if ( ( isset( $field[ 'value' ] ) && is_array( $field[ 'value' ] ) && in_array( $option[ 'value' ], $field[ 'value' ] ) ) || ( isset( $option[ 'checked' ] ) && true === $option[ 'checked' ] ) ) {
								echo ' checked="checked"';
							}
							if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
								echo ' disabled="disabled"';
							}

							echo ' /><label for="' . esc_attr( $field[ 'id' ] ) . '_' . esc_attr( $option[ 'value' ] ) . '">' .
							esc_attr( $option[ 'label' ] ) .
							'</label>';

							if ( $cols !== 1 ) {
								if ( ( $i % $cols ) === 0 ) {
									if ( $i === $end ) {
										echo '</td></tr></table>';
									} else {
										echo '</td></tr><tr><td>';
									}
								} elseif ( $i === $end ) {
									$empty_cell = '</td><td>';
									for ( $i = 0; $i < ( $i % $cols ); $i++ ) {
										echo $empty_cell;
									}
									echo '</td></tr></table>';
								} else {
									echo '</td><td>';
								}
								$i++;
							} else {
								echo '<br />';
							}
							//$j++;
						}
					} else {
						echo '<p>' . __( 'There is no data to select...', 'mhs_tm' ) . '</p>';
					}

					if ( isset( $field[ 'extra' ] ) && 'bulk_deselect' === $field[ 'extra' ] ) {
						echo '<input type="submit" name="" class="button-secondary bulk-deselect" value="' .
						__( 'Deselect all', 'mhs_tm' ) . '" /><br />';
					}
					break;

				case 'datepicker':
					echo '<script>
							jQuery(function ($) { 
								$(document).ready(function() {
									$( "#' . esc_attr( $field[ 'id' ] ) . '" ).datepicker({
										showButtonPanel: true,
										changeMonth: true,
										changeYear: true,
										firstDay: 1
									  });
								} ); 
							} );
						</script>';
					echo '<input type="text" id="' . esc_attr( $field[ 'id' ] ) . '" ';
					if ( !empty( $field[ 'value' ] ) ) {
						echo 'value="' . (int)$field[ 'value' ] . '"> ';
						echo '<script>
							jQuery(function ($) { 
								$(document).ready(function() {
									$( "#' . esc_attr( $field[ 'id' ] ) . '" ).datepicker(
										"setDate", new Date( ' . esc_attr( $field[ 'value' ] ) . '  )
									  );
								} ); 
							} );
						</script>';
					} else {
						echo '> ';
					}

					break;

				case 'datetimepicker':
					echo '<input type="text" class="mhs_tm_datetimepicker" id="' . esc_attr( $field[ 'id' ] ) . '" ';
					if ( !empty( $field[ 'value' ] ) ) {
						$timezone = date_default_timezone_get();
						date_default_timezone_set('UTC');
						echo 'value="' . date( "Y/m/d H:i", esc_attr( $field[ 'value' ] ) ) . '"> ';
						date_default_timezone_set($timezone);
					} else {
						echo '> ';
					}
					break;

				case 'color_picker':
					echo '<input type="text" class="color_picker" id="' . esc_attr( $field[ 'id' ] ) . '"  
						value="' . esc_attr( $field[ 'value' ] ) . '" >';
					echo '<script>
							jQuery( function ($) { 
								$( document ).ready( function() {
									$( "#' . esc_attr( $field[ 'id' ] ) . '" ).spectrum ( {
										color: "' . esc_attr( $field[ 'value' ] ) . '",
										showInput: true,
										className: "full-spectrum",
										showInitial: true,
										showPalette: true,
										showSelectionPalette: true,
										maxSelectionSize: 10,
										preferredFormat: "hex",
										localStorageKey: "spectrum.' . $this->slug . '",
										change: function(color) {
											$("#' . esc_attr( $field[ 'id' ] ) . '").val(color.toHexString());
										},
										palette: [
											["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
											"rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
											["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
											"rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
											["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", 
											"rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", 
											"rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
											"rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", 
											"rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
											"rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
											"rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
											"rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
											"rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", 
											"rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
										]
									} );
								} ); 
							} );
						</script>';
					break;

				case 'date':
					if ( !empty( $field[ 'value' ] ) ) {
						$stamp		 = strtotime( $field[ 'value' ] );
						$value		 = $field[ 'value' ];
						$day_val	 = date( 'd', $stamp );
						$month_val	 = date( 'm', $stamp );
						$year_val	 = date( 'Y', $stamp );
					} else {
						$value		 = '';
						$day_val	 = date( 'd' );
						$month_val	 = date( 'm' );
						$year_val	 = date( 'Y' );
					}
					echo '<input type="text" class="no-js-hide datepicker date';
					if ( isset( $field[ 'required' ] ) ) {
						echo ' required';
					}
					echo '" name="' . esc_attr( $field[ 'id' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" value="' . esc_attr( $value ) .
					'" size="30"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo ' /><select class="day js-hide js-hide" id="' . esc_attr( $field[ 'id' ] ) . '_day" name="' . esc_attr( $field[ 'id' ] ) . '_day"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo '>';
					for ( $i = 1; $i < 32; $i++ ) {
						$string = str_pad( $i, 2, '0', STR_PAD_LEFT );
						echo '<option value="' . esc_attr( $string ) . '"';
						if ( $day_val === $string ) {
							echo ' selected="selected"';
						}
						echo '>' .
						esc_attr( $string ) . '&nbsp;' .
						'</option>';
					}
					echo '</select><select class="months js-hide js-hide" id="' . esc_attr( $field[ 'id' ] ) . '_month" name="' . esc_attr( $field[ 'id' ] ) . '_month"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo '>';
					for ( $i = 1; $i < 13; $i++ ) {
						$string = str_pad( $i, 2, '0', STR_PAD_LEFT );
						echo '<option value="' . $string . '"';
						if ( $month_val === $string ) {
							echo ' selected="selected"';
						}
						echo '>' .
						esc_attr( $string ) . '&nbsp;' .
						'</option>';
					}
					echo '</select><select class="year js-hide js-hide" id="' . esc_attr( $field[ 'id' ] ) . '_year" name="' . esc_attr( $field[ 'id' ] ) . '_year"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo '>';
					for ( $i = 0; $i < 20; $i++ ) {
						$string = strval( 2012 + $i );
						echo '<option value="' . $string . '"';
						if ( $year_val === $string ) {
							echo ' selected="selected"';
						}
						echo '>' .
						esc_attr( $string ) . '&nbsp;' .
						'</option>';
					}
					echo '</select>';
					break;

				case 'text':
					echo '<input type="text"' .
					'name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" class="input regular-text"' .
					'" value="' . esc_html( $field[ 'value' ] ) . '" size="40"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo ' />';
					break;

				case 'text_long':
					echo '<input type="text" style="width: 100%;"' .
					'name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" class="input regular-text"' .
					'" value="' . esc_html( $field[ 'value' ] ) . '" size="40"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo ' />';
					break;

				case 'password':
					echo '<input type="password"' .
					'name="' . esc_attr( $field[ 'name' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" class="input regular-text"' .
					'" value="' . esc_attr( $field[ 'value' ] ) . '" size="40"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo ' />';
					break;

				case 'single-pic-upload':
					if ( isset( $field[ 'value' ] ) && !empty( $field[ 'value' ] ) ) {
						echo '<input type="hidden" ' .
						'name="' . esc_attr( $field[ 'id' ] ) . '-tmp" ' .
						'id="' . esc_attr( $field[ 'id' ] ) . '-tmp" ' .
						'value="' . $field[ 'value' ] . '" />' .
						'<img alt="Your Pic" src="' .
						esc_attr( $field[ 'value' ] ) .
						'" style="height:150px;"/><br>';
					}
					echo '<input type="file" name="' . esc_attr( $field[ 'id' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" accept="image/jpeg,image/gif,image/png"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo ' />';
					break;

				case 'csv-file-upload':
					echo '<input type="file" name="' . esc_attr( $field[ 'id' ] ) .
					'" id="' . esc_attr( $field[ 'id' ] ) .
					'" accept=".csv"';
					if ( isset( $field[ 'disabled' ] ) && $field[ 'disabled' ] === true ) {
						echo ' disabled="disabled"';
					}
					echo ' />';
					break;

				case 'content':
				default:
					echo wp_kses_post( $field[ 'value' ] );
					break;
			} // type switch

			if ( 'hidden' !== $field[ 'type' ] ) {
				if ( isset( $field[ 'desc' ] ) && !empty( $field[ 'desc' ] ) ) {
					if ( !in_array( $field[ 'type' ], array( 'hidden', 'checkbox_group', 'checkbox-group', 'html_div' ) ) ) {
						echo '<br />';
					}
					echo '<span class="description">' . $field[ 'desc' ] . '</span>';
				}
				echo '</td></tr>';
			}

			return $output;
		}

	}

	// class

endif; // class exists
?>