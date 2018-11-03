jQuery( function ( $ ) {
    $( "#mhs_tm_start_export" ).on( 'click', $( this ), function () {        
        //get time and date
        var currentdate = new Date(); 
        var datetime = currentdate.getDate() + "_"
                        + (currentdate.getMonth()+1)  + "_" 
                        + currentdate.getFullYear() + " @ "  
                        + currentdate.getHours() + "_"  
                        + currentdate.getMinutes();
                    
        var filename = 'mhs-tm_export_' + datetime + '.csv';
        
        var routes = []; 
        var lift_counter = 1;
        var part_distance_sum = 0;
        
        //go through all routes
        mhs_tm_app_export_vars.routes.forEach( function( route, index, arr ) { 
            var new_route = 1;
            var last_coordinate_id = mhs_tm_utilities.coordinate_handling.
                get_last_on_route_and_spot_coordinate_id_in_route( route.coordinates )
            //inside each route go through the coordinates and find lifts
            route.coordinates.forEach( function( coordinate, index, arr ) {
                if( new_route && coordinate.ispartofaroute && coordinate.ishitchhikingspot && 
                    index < last_coordinate_id ) {
                    //save the first informations to the assembled route
                    routes[routes.length] = {
                        "number": lift_counter,
                        "waitingtime": coordinate.waitingtime,
                        "distance": 0,
                        "from country": coordinate.country,
                        "from state": coordinate.state,
                        "from city": coordinate.city,
                        "from latitude": coordinate.latitude,
                        "from longitude": coordinate.longitude,
                        "starttime": new Date( coordinate.starttime * 1000 ).toUTCString(),
                        "starttime timestap UTC": coordinate.starttime
                    };
                    
                    new_route = 0;
                    lift_counter++;
                    part_distance_sum = 0;
                } else if( !new_route && coordinate.ispartofaroute && coordinate.ishitchhikingspot ) {
                    //save the informtion from the ext coordinate which will be the end of the lift 
                    //to the lift entry
                    routes[routes.length - 1]['to country'] = coordinate.country;
                    routes[routes.length - 1]['to state'] = coordinate.state;
                    routes[routes.length - 1]['to city'] = coordinate.city;
                    routes[routes.length - 1]['to latitude'] = coordinate.latitude;
                    routes[routes.length - 1]['to longitude'] = coordinate.longitude;
                    routes[routes.length - 1]['arrivetime'] = new Date( coordinate.starttime * 1000 ).toUTCString();
                    routes[routes.length - 1]['arrivetime  timestap UTC'] = coordinate.starttime;
                    
                    //if part_distance_sum > 0 then take this distance because there is a other 
                    //coordinate in the actual lift 
                    if( part_distance_sum != 0 ) {
                        routes[routes.length - 1]['distance'] = part_distance_sum + coordinate.distance;
                    } else { 
                        routes[routes.length - 1]['distance'] = coordinate.distance;
                    }
  
                    //save the information for the next lift, if this coordinate is not the last one
                    if( index < last_coordinate_id ) {
                        routes[routes.length] = {
                            "number": lift_counter,
                            "waitingtime": coordinate.waitingtime,
                            "distance": 0,
                            "from country": coordinate.country,
                            "from state": coordinate.state,
                            "from city": coordinate.city,
                            "from latitude": coordinate.latitude,
                            "from longitude": coordinate.longitude,
                            "starttime": new Date( coordinate.starttime * 1000 ).toUTCString(),
                            "starttime timestap UTC": coordinate.starttime
                        }; 
                    lift_counter++;      
                    }
                    part_distance_sum = 0;
                } else if ( !new_route && coordinate.ispartofaroute && !coordinate.ishitchhikingspot ) {
                    //if this coordinate is not a hitchhiking spot but itis between 
                    //2 hitchhiking spots and so a part of a lift calculate sum the distance of the parts
                    part_distance_sum = part_distance_sum + coordinate.distance;
                }
            } );
        } );
        
        var csv = Papa.unparse( routes );
        
        var csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
        var csvURL =  null;
        if (navigator.msSaveBlob)
        {
            csvURL = navigator.msSaveBlob(csvData, filename);
        }
        else
        {
            csvURL = window.URL.createObjectURL(csvData);
        }

        var tempLink = document.createElement('a');
        tempLink.href = csvURL;
        tempLink.setAttribute('download', filename);
        tempLink.click();
    
    } );
} );