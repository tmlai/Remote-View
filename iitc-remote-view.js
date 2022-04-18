// ==UserScript==
// @author         tmlai
// @name           IITC: Remote View URL
// @version        0.1.0
// @description    Generate in-game remote view for selected portal
// @run-at         document-end
// @id             remote-view
// @namespace      https://github.com/tmlai/remote-view
// @updateURL      https://github.com/tmlai/remote-view/iitc-remote-view.js
// @downloadURL    https://github.com/tmlai/remote-view/portal-remote-view.js
// @match          https://intel.ingress.com/*
// @grant          none
// ==/UserScript==

function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

plugin_info.buildName = 'iitc';
plugin_info.dateTimeVersion = '20220418.14020';
plugin_info.pluginId = 'portal-remote-view';

onPortalSelected: function(event) {

  /*if(event.selectedPortalGuid === event.unselectedPortalGuid) {
      return;
  }*/
  if (window.selectedPortal === null) {
    return;
  }
  var portal = window.portals[window.selectedPortal];
  if (!portal) {
    return;
  }
  // After select.

  var data = portal.options.data;
  var lat = data.latE6/1E6;
  var lng = data.lngE6/1E6;

  var linkDetails = $('<div>', { class: 'linkdetails' });
  var guid = portal.options.guid;
  
  var remoteViewHTML = $('<a>').attr({
    href: window.makeRemoteView([lat,lng], guid),
    title: 'Create a Remote View URL link to this portal'}
  ).text('Remote view');
  linkDetails.append($('<aside>').append($('<div>').append(remoteViewHTML)));

})();

window.makeRemoteView = function (latlng, guid, options) {
  options = options || {};
//https://link.ingress.com/?link=https%3a%2f%2fintel.ingress.com%2fportal%2f12c42c6c73fd4edea70e25cef34578a6.16
  function round (l) { // ensures that lat,lng are with same precision as in stock intel permalinks
    return Math.floor(l*1e6)/1e6;
  }

  var args = [];
  args.push('link=https%3a%2f%2fintel.ingress.com%2fportal%2f' + guid);
  args.push('apn=com.nianticproject.ingress');
  args.push('isi=576505181');
  args.push('ibi=com.google.ingress');
  args.push('ifl=https://apps.apple.com/app/ingress/id576505181');

  var latlong = '';
  if (latlng) {
    if ('lat' in latlng) { latlng = [latlng.lat, latlng.lng]; }
    latlong=latlng.join(',');
  }

  args.push('ofl=https://intel.ingress.com/intel?pll=' + latlong);
  var url = 'https://link.ingress.com/'
  return url + '?' + args.join('&');
};

})();

} // wrapper end

// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);

