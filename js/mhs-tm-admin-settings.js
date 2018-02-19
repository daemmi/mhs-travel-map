jQuery( function ( $ ) {
    $( "#mhs_tm_transport" ).dialog( {
        modal: false,
        autoOpen: false,
        dialogClass: 'ui-dialog_mhs_tm',
        width: '80%',
        position: { my: "right", at: "right", of: window },
    } );

    $( "#mhs_tm_add_transport" ).on( 'click', $( this ), function () {
        //set values in dialog to null            
        $( '#name_transport_class' ).val( '' );
        $( '#color_transport_class' ).spectrum( "set", '#000000' );
        ;

        $( "#mhs_tm_transport" ).dialog( "open" );
        $( "#mhs_tm_transport" )
            .dialog( 'option', 'buttons', {
                'Add class': function () {
                    var transport_classes = {
                        name: $( '#name_transport_class' ).val(),
                        color: $( '#color_transport_class' ).val(),
                    };


                    var transport_classes_table = $.parseJSON( $( '#transport_classes' ).val() );
                    if ( transport_classes_table === null ) {
                        transport_classes_table = [ ];
                    }
                    
                    //check if name already exist
                    var not_in_array = 1;
                    transport_classes_table.forEach(function (element, index) { 
                        if( element.name === transport_classes.name ) {
                            not_in_array = 0;
                        }
                    });
                    
                    if ( transport_classes.name.length > 0 && not_in_array) {
                        if ( transport_classes.color.length === 0 ) {
                            transport_classes.color = '#000000';
                        }
                        $( '#mhs_tm_transport_table > tbody:last-child' ).append( '<tr><td\n\
                        class="transport_class_color" style="background-color: ' +
                            transport_classes.color + ';"></td><td>' + transport_classes.name + '</td>\n\
                        <td class="transport_class_settings">\n\
                        <a class="mhs_tm_edit_transport" href="javascript:void(0)">Edit</a> | \n\
                        <a class="mhs_tm_delete_transport" href="javascript:void(0)">Delete</a>\n\
                        </td></tr>' );
                        transport_classes_table[transport_classes_table.length] = transport_classes;
                        $( '#transport_classes' ).val( JSON.stringify( transport_classes_table ) );
                    } else {
                        mhs_tm_utilities.utilities.show_message( 'error',
                            'Name already exist or enter a name at least, please!' );
                    }
                },
                'Cancel': function () {
                    $( this ).dialog( "close" );
                }
            } );
    } );

    $( "#mhs_tm_transport_table" ).on( 'click', '.mhs_tm_edit_transport', function () {
        var id = $( this ).closest( 'tr' ).index();
        var tr = $( this ).closest( 'tr' );
        var transport_classes_table = $.parseJSON( $( '#transport_classes' ).val() );

        $( '#name_transport_class' ).val( transport_classes_table[id].name );
        $( '#color_transport_class' ).spectrum( "set", transport_classes_table[id].color );

        $( "#mhs_tm_transport" )
            .dialog( 'option', 'buttons', {
                'Change class': function () {
                    var transport_classes = {
                        name: $( '#name_transport_class' ).val(),
                        color: $( '#color_transport_class' ).val(),
                    };
                    
                    //check if name already exist
                    var not_in_array = 1;
                    var old_name = transport_classes_table[id].name;
                    transport_classes_table.forEach(function (element, index) { 
                        if( element.name === transport_classes.name && 
                            old_name !== transport_classes.name ) {
                            not_in_array = 0;
                        }
                    });

                    if ( transport_classes.name.length > 0 && not_in_array ) {
                        if ( transport_classes.color.length === 0 ) {
                            transport_classes.color = '#000000';
                        }

                        //Set new values in aray
                        transport_classes_table[ id ].name = transport_classes.name;
                        transport_classes_table[ id ].color = transport_classes.color;
                        $( '#transport_classes' ).val( JSON.stringify( transport_classes_table ) );

                        //change it in table
                        tr.find( 'td' ).each( function () {
                            switch ( $( this ).index() ) {
                                case 0:
                                    $( this ).css( 'background-color', transport_classes.color );
                                    break;
                                case 1:
                                    $( this ).html( transport_classes.name );
                                    break;
                                default:
                                    break;
                            }
                        } );

                        $( this ).dialog( "close" );
                    } else {
                        mhs_tm_utilities.utilities.show_message( 'error',
                            'Name already exist or enter a name at least, please!' );
                    }
                },
                'Cancel': function () {
                    $( this ).dialog( "close" );
                }
            } )
            .dialog( "open" );

        $( '#transport_classes' ).val( JSON.stringify( transport_classes_table ) );
    } );

    $( "#mhs_tm_transport_table" ).on( 'click', '.mhs_tm_delete_transport', function () {
        var id = $( this ).closest( 'tr' ).index();
        var transport_classes_table = $.parseJSON( $( '#transport_classes' ).val() );
        transport_classes_table.splice( id, 1 );
        $( '#transport_classes' ).val( JSON.stringify( transport_classes_table ) );

        //delete row in table
        $( this ).closest( 'tr' ).remove();
    } );
} );