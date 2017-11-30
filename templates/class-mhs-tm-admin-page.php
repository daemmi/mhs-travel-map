<?php

/**
 * MHS_TM_Admin_Page class.
 *
 * This class contains properties and methods
 * to display the very basic elements of every backend page
 *
 * @package MHS Travel Map
 * @since 1.0
 */

if ( ! class_exists( 'MHS_TM_Admin_Page' ) ) :

class MHS_TM_Admin_Page {

	/**
	 * Class Properties
	 *
	 * @since 1.1
	 */
	private $default_args = array(
		'echo' => false,
		'icon' => '',
		'title' => 'Admin Page',
		'active_tab' => '',
		'url' => '?page=admin.php',
		'extra_head_html' => '',
		'tabs' => array(),
		'messages' => array()
	);
	private $args = array();

	/**
	 * PHP4 style constructor
	 *
	 * @since 1.0
	 * @access public
	 */
	public function MHS_TM_Admin_Form( $args = array() ) {
		$this->__construct( $args = array() );
	}

	/**
	 * PHP5 style constructor
	 *
	 * @since 1.0
	 * @access public
	 */
	public function __construct( $args = array() ) {
		$this->args = wp_parse_args( $args, $this->default_args );
	}

	/**
	 * Constructs HTML,
	 * echoes or returns it
	 *
	 * @since 1.0
	 * @access private
	 */
	private function output( $type ) {
		global $MHS_TM_Admin;

		extract( $this->args );

		$output = '';

		switch ( $type ) {
			case 'top':
				$output .= '<div class="wrap"> <div class="admin_title_mhs_tm">';
				if( ! empty( $icon ) ) {
					$output .= '<img src="' . esc_url( $icon ) . '" alt="Icon">';
				}
				$output .= '<h1>' . esc_html( $title ) . '</h1><hr /></div>';

				if( ! empty( $messages ) ) {
					$output .= $MHS_TM_Admin->convert_messages( $messages );
				}

				if( ! empty( $extra_head_html ) ) {
					$output .= $extra_head_html;
				}

				if( ! empty( $tabs ) && is_array( $tabs ) ) {
					$output .= '<h2 class="nav-tab-wrapper">';
					$i = 0;
					foreach ( $tabs as $tab ) {
						$icon	= isset( $tab['icon'] ) ? esc_attr( $tab['icon'] ) : '';
						$value	= isset( $tab['value'] ) ? esc_attr( $tab['value'] ) : '';
						$title	= isset( $tab['title'] ) ? esc_html( $tab['title'] ) : '';
						
						$output .= '<a href="' . esc_url( $url ) . '&tab=' . $value . '" class="nav-tab ' . ( $tab['value'] === $active_tab || ( $tab['value'] === '' && 0 === $i ) ? 'nav-tab-active' : '' ) . '">' .
								'<div class="nav-tab-icon nt-' . $icon . '"></div>' .
								$title .
							'</a>';
						$i++;
					}
					$output .= '</h2>';
				}
			break;

			case 'bottom':
				$output .= '</div>';
			default:

			break;
		}

		if ( $echo ) {
			echo $output;
		}
		return $output;
	}

	/**
	 * Wrapper for top HTML
	 *
	 * @since 1.0
	 * @access public
	 */
	public function top() {
		return $this->output( 'top' );
	}

	/**
	 * Wrapper for bottom HTML
	 *
	 * @since 1.0
	 * @access public
	 */
	public function bottom() {
		return $this->output( 'bottom' );
	}

} // class

endif; // class exists

?>