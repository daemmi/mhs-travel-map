=== My Hitchhiking Spot Travel Map (MHS Travel Map) ===
Contributors: daemmi
Donate link: https://profiles.wordpress.org/daemmi
Tags: map, google maps, hitchhike, hitchhiking, travel, backpacking, traveling
Tested up to: 5.0.3
Requires at least: 3.8.0
Requires PHP: 5.2.0
Stable tag: 1.4.0
License: GPL3
License URI: http://www.gnu.org/licenses/gpl.html

Create your travel map with use of google maps and import backups from the 
Android app `My Hitchhiking Spots`

== Description ==

Create your travel map with use of [google maps api](https://developers.google.com/maps/terms) 
by adding coordinates to a map, make your route public, write a story for each 
coordinate and import backup files from the Android app 
[My Hitchhiking Spots](https://play.google.com/store/apps/details?id=com.myhitchhikingspots).

= Features =

Got to [the demo page](http://mhs-tm.goip.de) to have a look of a couple of example maps and to try out the backend!

* create you own travel map with use of google maps
* import backup files from the Android app `My Hitchhiking Spots`
* add coordinates to the route
* add coordinates which are not on the route
* write to each coordinate a story by using the wordpress text editor
* it will work with shortcodes
* add to each coordinate start time and waiting time
* for each route the total waiting time, the number of lifts, journey time and distance will be calculated
* geocode your coordinate automatically
* set the colour of each route 
* or set a route to a predefined transportation class
* get a whole statistic about all route in one map

== Installation ==

This section describes how to install and use the plugin.

1. Install automatically through the `Plugins` menu and `Add New` button (or upload the entire `mhs-travel-map` folder to the `/wp-content/plugins/` directory)
2. Activate the plugin
3. Go to `MHS Travel Map`
4. Create a route or import a backup file from the Android app [My Hitchhiking Spots](https://play.google.com/store/apps/details?id=com.myhitchhikingspots)
5. Create a map an add the route to the map
6. Use the shortcode in a post or page to make the map public

== Screenshots ==
1. Frontend Map
2. Frontend Map with a selected route / hover effect for marker and route path
3. Frontend Popup window for a clicked coordinate
4. Frontend Statistics popup window of a map
5. Backend map in route edit menu
6. Backend main settings in route edit menu
7. Backend settings for a coordinate in route edit menu

== Frequently Asked Questions ==

== Changelog ==

= 1.4.0 (2019-04-11) =
- added, browse through coordinates function is faster
- added, possibility to add invisible pins to change the snap to road as you need it
- changed, some styles
- fixed, minor bugs

= 1.3.0 (2018-11-XX) =
- added, browse through the coordinates in front end
- added, export function for lifts in routes
- added, ne option for maps of map zoom after first load 
- changed, minior changes at the style of the routes
- fixed, changing of transportation class name is possible now

= 1.2.4 (2018-07-05) =
- added, shortcode work just with a route id
- added, option that time and date won't be shown in coordinate info  
- changed, style of header in coordinate popup window and statistics
popup window
- changed, admin form classes
- fixed, loading overlay in front end
- fixed, error by import of routes
- fixed, wrong calculation of info 

= 1.2.2 (2018-02-21) =
- fixed, new added route can't be saved

= 1.2.1 (2018-02-20) =
- fixed, after activation settings can't be saved

= 1.2.0 (2018-02-19) =
- added, transportation classes
- changed, statistics for each transportation class in a map

= 1.1.2 (2018-01-27) =
- changed, close button in popup window
- fixed, coordinate note content style
- fixed, hover effect in two maps in front end

= 1.1.1 (2018-01-26) =
- changed, close button in popup window
- fixed, coordinate content load in route and map editor

= 1.1.0 (2018-01-25) =
- added, colour for route path
- added, import settings
- added, snap to rod settings in editor
- added, more interaction in front end map
- added, calculation of distance 
- added, geocoding for coordinates
- added, front end map will set size automatically to 16:9
- added, general settings for editor
- added, searchbox in editor
- added, popup window for map will open if marker is pressed
- added, statistics about distance, waiting tie, journey time and lifts for all
  route in a map
- changed, loading spinner and update message are sticked to window  
- changed, shortcodes can be used in coordinate note 
- changed, import routine standard saving name
- changed, route table will show time of first coordinate
- fixed, bug in time calculation of coordinates
- fixed, bug in waiting tie calculation

= 1.0.5 (2017-12-16) =
- changed, loading spinner
- fixed, displaying content in edit routes 

= 1.0.4 (2017-12-04) =
- added, better support in jquery sortable accordion for mobile handling
- changed, admin-form; there have been too man default tags in a switch statement
- fixed, warnings which are shown in the WP debug probe
- fixed, format of gmap info window content
- fixed, problem with deleting coordinates in a route
- fixed, problems with tinyMCE editor

= 1.0.3 (2017-11-20) =
* first release

== Upgrade Notice ==

= 1.2.1 =
major bug fixed, settings could be used now

= 1.2.0 =
major bugs fixed and most comfort right now

= 1.0.3 =
First release