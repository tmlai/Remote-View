// ==UserScript==
// @author         tmlai
// @name           IITC: Remote View URL
// @version        1.1.0
// @description    Generate in-game remote view for selected portal
// @run-at         document-end
// @id             remote-view
// @namespace      https://github.com/tmlai/remote-view
// @updateURL      https://raw.githubusercontent.com/tmlai/Remote-View/main/iitc-remote-view.js
// @downloadURL    https://raw.githubusercontent.com/tmlai/Remote-View/main/iitc-remote-view.js
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
    // ensure plugin framework is there, even if iitc is not yet loaded
    if(typeof window.plugin !== 'function') window.plugin = function() {};

    // use own namespace for plugin
    window.plugin.remoteView = function() {};
    let thisPlugin = window.plugin.remoteView;

    plugin_info.buildName = 'iitc';
    plugin_info.dateTimeVersion = '20220418.14020';
    plugin_info.pluginId = 'portal-remote-view';

    function setup() {
		try {
			thisPlugin.currentLoc = L.latLng(JSON.parse(localStorage['plugin-distance-to-portal']));
		} catch {
			thisPlugin.currentLoc = null;
		}
		
		thisPlugin.currentLocMarker = null;
		
		$('<style>').prop('type', 'text/css').html('@include_string:distance-to-portal.css@').appendTo('head');
		
		window.addHook('portalDetailsUpdated', thisPlugin.addDistance); // changed from portalDetailsUpdated to portalSelected to speed up the path drawing
        window.addHook('portalSelected', thisPlugin.addRemoteLink); // changed from portalDetailsUpdated to portalSelected to speed up the path drawing
    };
	thisPlugin.addDistance = function () {		
	  var div = $('<div>')
	    .attr({
	      id: 'portal-distance',
	      title: 'Double-click to set/change current location',
		  text: 'Location not set, dble click to set',
	    })
	    .on('dblclick', window.plugin.distanceToPortal.setLocation);
	
	  $('#resodetails').after(div);
	};

	thisPlugin.setLocation = function () {
	  if (thisPlugin.currentLocMarker) {
	    window.map.removeLayer(thisPlugin.currentLocMarker);
	    thisPlugin.currentLocMarker = null;
	    return;
	  }
	
	  if (!thisPlugin.currentLoc) {
	    thisPlugin.currentLoc = window.map.getCenter();
	  }
	
	 thisPlugin.currentLocMarker = L.marker(thisPlugin.currentLoc, {
	    icon: L.divIcon.coloredSvg('#444'),
	    draggable: true,
	    title: 'Drag to change current location',
	  });
	
	  thisPlugin.currentLocMarker.on('drag', function () {
	    thisPlugin.currentLoc = thisPlugin.currentLocMarker.getLatLng();
	
	    localStorage['plugin-distance-to-portal'] = JSON.stringify({
	      lat: thisPlugin.currentLoc.lat,
	      lng: thisPlugin.currentLoc.lng,
	    });
	  });
	
	  window.map.addLayer(thisPlugin.currentLocMarker);
	};

     thisPlugin.addRemoteLink = function (data, event) {
         setTimeout(function() {
             if (window.selectedPortal === null) {
                 console.log("Selected portal is null")
                 return;
             }

             var portal = window.portals[data.selectedPortalGuid];

             if (!portal) {
                 return;
             }

             // After select.
             var lat = portal.options.data.latE6/1E6;
             var lng = portal.options.data.lngE6/1E6;

             var linkDetails = $('.linkdetails')
             //ignore if link details div is not found
             if (linkDetails.length == 0) {
                 return;
             }

             var guid = data.selectedPortalGuid;

             var remoteViewHTML = $('<a>').attr({
                 href: window.makeRemoteView([lat,lng], guid),
                 title: 'Create a Remote View URL link to this portal'}
                                               ).text('Remote View');

//          console.log("url crafted:");
//          console.log(remoteViewHTML);
//          console.log("linkdetails");
//          console.log(linkDetails);
//          console.log("linkdetails[0]");
//          console.log(linkDetails[0].childElementCount);
//          console.log(linkDetails[0]);

             // #resodetails
             linkDetails.append($('<aside>').append($('<div>').append(remoteViewHTML)));
             var targetLat = 53.600212
             var targetLong = -132.278533

			 if (thisPlugin.currentLoc) {
				 targetLat = thisPlugin.currentLoc.lat
				 targetLong = thisPlugin.currentLoc.lng
			 }
             var lastTouched = '<div><span>Last touched: ' + new Date(portal.options.timestamp) + '</span></div>'
             

             let distance = haversine(targetLat, targetLong, lat, lng);
			 let distanceString = distance.toLocaleString(undefined, // leave undefined to use the visitor's browser locale
															  { minimumFractionDigits: 2 }
															);
			 let maxLinkDistance= 6881279999
			 let diffMaxLinkDistance = maxLinkDistance - distance
			 let diffMaxLinkDistanceString = diffMaxLinkDistance.toLocaleString(undefined, // leave undefined to use the visitor's browser locale
															  { minimumFractionDigits: 2 }
															);
		     //distance = distance.toFixed(1);

             var distanceToTarget = '<div><span>Distance to target: ' +distanceString + 'mm</span></div>'
			 var diffToMaxDistance = '<div><span>Diff to max link distance: ' +diffMaxLinkDistanceString + 'mm</span></div>'
             
             linkDetails.append(lastTouched);
             linkDetails.append(distanceToTarget);
			 linkDetails.append(diffToMaxDistance);
         }, 0);
     }

   //Credit: https://github.com/tehstone/IngressDronePath/blob/master/dronePathTravelPlanner.user.js#L1108
   function haversine(lat1, lon1, lat2, lon2) {
		const R = 6367000000; // milimetres
		const φ1 = lat1 * Math.PI/180; // φ, λ in radians
		const φ2 = lat2 * Math.PI/180;
		const Δφ = (lat2-lat1) * Math.PI/180;
		const Δλ = (lon2-lon1) * Math.PI/180;

		const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
					Math.cos(φ1) * Math.cos(φ2) *
					Math.sin(Δλ/2) * Math.sin(Δλ/2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

		return R * c; // in metres
	}

    window.makeRemoteView = function (latlng, guid, options) {
        options = options || {};
        //https://link.ingress.com/?link=https%3a%2f%2fintel.ingress.com%2fportal%2f12c42c6c73fd4edea70e25cef34578a6.16
        function round (l) { // ensures that lat,lng are with same precision as in stock intel permalinks
            return Math.floor(l*1e6)/1e6;
        }

        var url = 'https://link.ingress.com/portal/'+ guid
        //var args = [];
        ////in-game apn
        //args.push('link=https%3a%2f%2fintel.ingress.com%2fportal%2f' + guid);
        //args.push('apn=com.nianticproject.ingress');
        //args.push('isi=576505181');
        //args.push('ibi=com.google.ingress');
        //args.push('ifl=https://apps.apple.com/app/ingress/id576505181');

        //var latlong = '';
        //if (latlng) {
        //    if ('lat' in latlng) { latlng = [latlng.lat, latlng.lng]; }
        //    latlong=latlng.join(',');
        //}

        //args.push('ofl=https://intel.ingress.com/intel?pll=' + latlong);

        return url;
    };

    // Add an info property for IITC's plugin system
    setup.info = plugin_info;

    // Make sure window.bootPlugins exists and is an array
    if (!window.bootPlugins) window.bootPlugins = [];
    // Add our startup hook
    window.bootPlugins.push(setup);
    // If IITC has already booted, immediately run the 'setup' function
    if (window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end

// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


