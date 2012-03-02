//
// Globals
//
var mapInstance;
var parser;
var placemarkMetadata = [];    
var placemarksVisible = true;
var polygonsVisible   = true;


//
// Modified from php.js strcmp at http://phpjs.org/functions/strcmp
// Requires b1 and b2 have name fields
//
function placemarkcmp (b1, b2) {
return ((b1.name == b2.name) ? 0 : ((b1.name > b2.name) ? 1 : -1));
}


//
// Triggered by our parsecomplete event
//
function customAfterParse(docSet) {
	// placemarks is the collection of Geoxml3 placemark instances
	// We're collecting document 0, which we know is the placemarks KML
	var placemarks = docSet[0].placemarks;
	
	var markerIndex, placemarkIndex, loopEnd;

	// Create array of placemark metadata objects, containing name and index into the Geoxml3 document array
	for (markerIdx = 0, loopEnd = placemarks.length; markerIdx < loopEnd; markerIdx++) {
		var currentMetadata = {};

		currentMetadata.name = placemarks[markerIdx].name;
		currentMetadata.index = markerIdx;
		placemarkMetadata.push(currentMetadata);
	}

	// Sort alphabetically by name
	placemarkMetadata.sort(placemarkcmp);

	// Add list items with an HTML id attribute  p##, where ## is the index of the marker we want to trigger
	for (placemarkIndex = 0, loopEnd = placemarkMetadata.length; placemarkIndex < loopEnd; placemarkIndex++) {
		$('#placemarkList').append('<li id="p' + placemarkMetadata[placemarkIndex].index + '">' + placemarkMetadata[placemarkIndex].name + '</li>');
	}
}


//
// Triggered by the parsed event on our parser
//
function completeInit() {
	// Hide non-placemark layer(s)
	//parser.hideDocument(parser.docs[1]);
	//polygonsVisible = false;

	// Add event handler for sidebar items
	// Because we're using jQuery 1.7.1, we use on.
	// If we were using previous versions, we'd use live
	$("#placemarkList li").on("click", function(e) {
		// Get the id value, strip off the leading p
		var id = $(this).attr("id");
		id = id.substr(1);

		// "Click" the marker
		google.maps.event.trigger(parser.docs[0].placemarks[id].marker, 'click');
	});
	
	// Add mouse events so users know when we're hovering on a sidebar elemnt
	$("#placemarkList li").on("mouseenter", function(e) {
			var textcolor = $(this).css("color");
			$(this).css({ 'cursor' : 'pointer', 'color' : '#FFFFFF', 'background-color' : textcolor });
		}).on("mouseleave", function(e) {
			var backgroundcolor = $(this).css("background-color");
			$(this).css({ 'cursor' : 'auto', 'color' : backgroundcolor, 'background-color' : 'transparent' });
		});

	// Highlight visible and invisible sidebar items
	// As user scrolls, the sidebar willreflect visible and invisible placemarks
	google.maps.event.addListener(mapInstance, 'bounds_changed', function() {
		currentBounds = mapInstance.getBounds();
		for (i = 0; i < parser.docs[0].placemarks.length; i++) {
			var myLi = $("#p" + i);
			if (currentBounds.contains(parser.docs[0].placemarks[i].marker.getPosition())) {
				myLi.css("color","#000000");
			} else {
				myLi.css("color","#CCCCCC");
			}
		}
	});

	// Placemark layer visibility control
	$("#placemarktoggle").on("click", function(e) {
		if (placemarksVisible) {
			parser.hideDocument(parser.docs[0]);
			placemarksVisible = false;
		} else {
			parser.showDocument(parser.docs[0]);
			placemarksVisible = true;
		}		
	});
	
	// Polygon layer visiblity control
	$("#polygonstoggle").on("click", function(e) {
		if (polygonsVisible) {
			parser.hideDocument(parser.docs[1]);
			polygonsVisible = false;
		} else {
			parser.showDocument(parser.docs[1]);
			polygonsVisible = true;
		}
		
	});
	
	$("#recenter").on("click", function(e) {
		var latlng = new google.maps.LatLng(35.603789, -77.364693);
 	 	mapInstance.setCenter(latlng);		
	});
	
	$("#controls").show();
}


$(document).ready(function() {
	var latlng = new google.maps.LatLng(35.603789, -77.364693);
	var mapOptions = {
		zoom: 16,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControlOptions: {
		style: google.maps.MapTypeControlStyle.DEFAULT
		}
	};
	mapInstance = new google.maps.Map(document.getElementById("map"), mapOptions);

	// Create a new parser for all the KML
	// processStyles: true means we want the styling defined in KML to be what isrendered
	// singleInfoWindow: true means we only want 1 simultaneous info window open
	// zoom: false means we don't want torecenter/rezoom based on KML data
	// afterParse: customAfterparse is a method to add the sidebar once parsing is done
	//
	parser = new geoXML3.parser({
		map: mapInstance,
		processStyles: true,
		singleInfoWindow: true,
		zoom: false,
		afterParse: customAfterParse
		}
	);

	// Add an event listen for the parsed event on the parser
	// Thisrequires a Geoxml3 with the patch defined in Issue 40
	// http://code.google.com/p/geoxml3/issues/detail?id=40
	// We need this event to know when Geoxml3 has compltely defined the coument arrays
	google.maps.event.addListener(parser, 'parsed', completeInit);

	parser.parse(['kml/placemarks.kml', 'kml/polygons.kml']);
});