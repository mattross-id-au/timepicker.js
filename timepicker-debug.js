/*
The MIT License (MIT)

Copyright (c) 2014 Matthew Ross - http://mattross.id.au/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.



Visit http://mattross.id.au/timepicker.js/ for instructions including
configuration settings and styling with css


*/
if (!Object.create) {
    Object.create = (function(){
        function F(){}

        return function(o){
            if (arguments.length != 1) {
                throw new Error('Object.create implementation only accepts one parameter.');
            }
            F.prototype = o
            return new F()
        }
    })()
}

var tp = {

	config : {
		start : "0",
		end : "24",
		step : "15",
		format : "12",
		delimiter : ":"
	},

	createFromInput : function(element) {
		var picker = Object.create(tp.TimePicker(element));
	},

	addListener : function(event, elem, func) {
		//if(typeof elem == 'string') elem = document.getElementById(elem);
		//if(!elem) throw 'timepicker.addListener could find element "' + elem + '"';
		
		if(elem.addEventListener) { // W3C
			elem.addEventListener(event, func, false);
		} else if(elem.attachEvent) { // Microsoft lacking standards
			return elem.attachEvent('on'+event, func);
		} else {
			throw 'Could not attach event listener "' + event +'" to element ' + elem;
		}
	},

	appendAfter : function(sibling, elem) {
		//if(typeof sibling == 'string') sibling = document.getElementById(sibling);
		//if(!sibling) throw 'tp.appendAfter could find "sibling" element "' + sibling + '"';
		//if(typeof elem == 'string') elem = document.getElementById(elem);
		//if(!elem) throw 'tp.appendAfter could find "elem" element "' + elem + '"';
		if (sibling.nextSibling) {
		  sibling.parentNode.insertBefore(elem, sibling.nextSibling);
		}
		else {
		  sibling.parentNode.appendChild(elem);
		}
	},

	getPosition : function(elem) {
		//if(typeof elem == 'string') elem = document.getElementById(elem);
		//if(!elem) throw 'tp.getPosition could find element "' + elem + '"';
	    var x=0;
	    var y=0;
	    while(true){
	        x += elem.offsetLeft;
	        y += elem.offsetTop;
	        if(elem.offsetParent === null){
	            break;
	        }
	        elem = elem.offsetParent;
	    }
	    return [x, y];
	},

	positionBelow : function(above, below) {
		//if(typeof above == 'string') above = document.getElementById(above);
		//if(!above) throw 'tp.positionBelow could find "above" element "' + above + '"';
		//if(typeof below == 'string') below = document.getElementById(below);
		//if(!below) throw 'tp.positionBelow could find "below" element "' + below + '"';

		var pos = tp.getPosition(above);
		var h = above.offsetHeight;
		var w = above.clientWidth;

		below.style.position = "absolute";
		below.style.left = pos[0] + "px";
		below.style.top = (pos[1]+h) + "px";
		below.style.width = (w+2) + "px";		
	},

	getElementsWithClass : function(strClass, element) {
		var element = element || document;
		var elems = element.getElementsByTagName('*');
		var matches = [];
		for(var i in elems) {
			if((' ' + elems[i].className + ' ').indexOf(' ' + strClass + ' ') > -1) {
				matches.push(elems[i]);
			}
		}
		return matches;
	},

	hasClass : function(strClass, elem) {
		return ((' ' + elem.className + ' ').indexOf(' ' + strClass + ' ') > -1);
	},

	addClass : function(strClass, elem) {
		var hasClass = tp.hasClass(strClass, elem);
		if(!hasClass) {
			elem.className += ' ' + strClass;
		}
	},

	removeClass : function(strClass, elem) {
		var r = new RegExp(' ?' + strClass + ' ?');
		elem.className = elem.className.split(r).join('');
	},

	applyStylesheet : function() {
		var style = document.createElement('style');
		style.type = 'text/css';
		/*var el = 
			document.head || 
			document.getElementsByTagName('head').item(0) ||
			document.body;*/
		
		var styleStr = [
			".timepicker { border: 1px solid #CCC; background-color: #FFF; max-height: 200px; overflow:auto; z-index: 1000; outline:0; font-family:sans-serif;}\n",
			".timepicker, input[type='timepicker'], input[data-type='timepicker'] {\n",
				"-webkit-box-sizing: border-box;\n",
				"-moz-box-sizing: border-box;\n",
				"box-sizing: border-box; \n",
			"} \n",
			".timepicker ul { margin:0; padding:0;} \n",
			".timepicker li { display: block; list-style: none outside none; cursor: pointer; padding: 0 0.5em; font-size: 90%;}\n",
			".timepicker li.hover { background-color: #DDDDDD; } \n",
		''].join('');
		
		
		if(style.styleSheet) {
			style.styleSheet.cssText= styleStr;
		} else {
			style.innerHTML = styleStr;
		}
		
		// We must prepend this to the head (before other styles)
		// it allows others to easily overwrite the stylesheet
		var head = document.getElementsByTagName('head')[0];
		head.insertBefore(style, head.firstChild);

	},

	stringToMinutes : function(str) { 
		var parts = str.match(/(\d+)(\:|\.)?(\d+)?(am|pm)?/);
		if(parts) {
			var h = parseInt(parts[1]);
			var m = parseInt(parts[3]);
			var ampm = parts[4];
			m = m || 0;

			// Because screw these two times in particular
			//if(h==12 && m==0 && ampm=="am") return 0;
			//if(h==12 && m==0 && ampm=="pm") return (60*12);

			if(ampm == "pm" && h < 12) h += 12;
			if(ampm == "am" && h == 12) h = 0;
			if(h == 24) h = 0;
			return (h*60+m);
		} else {
			return 0;
		}
	},

	minutesToString : function(mins, config) {
		config = config || this.config;
		var h = parseInt(mins / 60);
		var m = mins % 60;

		m = ("0" + m).slice(-2);
		if(config.format == "12") {
			ampm = "am";
			if(mins >= 60*24) {mins -= (60*24); h=0; }
			if(mins >= (60*12)) ampm = "pm";
			if(mins >= (60*13)) h -= 12;
			if(h == 0) h = 12;
			return h + config.delimiter + m + ampm;
		} else {
			if(h < 10) h = "0" + h;
			return h + config.delimiter + m;
		}
	},

	minutesToISO : function(mins) {
		var h = parseInt(mins / 60);
		var m = mins % 60;
		if(h < 10) h = "0"+h;
		if(m < 10) m = "0"+m;
		if(h >= 24) h -= 24;
		return h + ":" + m + ":00";
	},

	stringToISO : function(str) {
		return tp.minutesToISO(tp.stringToMinutes(str));
	},

	liMouseOver : function(event) {
		var li = event.srcElement || this;
		elems = tp.getElementsWithClass('hover', li.parentNode);
		for(i in elems) {
			tp.removeClass("hover", elems[i]);
		}
		tp.addClass("hover", li);
	},

	liMouseOut : function(event) {
		var li = event.srcElement || this;
		li.className = li.className.replace( /(?:^|\s)hover(?!\S)/ , '');
	},

	TimePicker : function(ie) {
		if(typeof ie == 'string') ie = document.getElementById(ie);
		if(!ie) throw 'timepicker could find element "' + ie + '"';

		// CONFIG
		var config = Object.create(tp.config);
		for (var i = 0; i < ie.attributes.length; i++) {
			var attrib = ie.attributes[i];
			if (attrib.specified) {
				var parts = attrib.name.match('^data\-(.*)');
				if(parts) {
					config[parts[1]] = attrib.value;
				}
			}
		}

		mStart = tp.stringToMinutes(config.start);
		mEnd = tp.stringToMinutes(config.end);
		step = parseInt(config.step);

		// If we want full 24hrs from 12am-12am
		if(mEnd == 0) mEnd = (24*60);


		/********************
		** EVENT LISTENERS **
		********************/
		var setTime = function(getTime) {
			var intTime, strTime;

			if(typeof getTime == "string") {
				intTime = tp.stringToMinutes(getTime);
				strTime = getTime;
			} else if(typeof getTime == "number") {
				intTime = getTime;
				strTime = tp.minutesToString(getTime, config);
			}

			//Wrapping around midnight
			if(intTime < 0) {
				intTime += (24*60);
				strTime = tp.minutesToString(intTime, config);
			}

			if(intTime > (24*60)) {
				intTime -= (24*60);
				strTime = tp.minutesToString(intTime, config);
			}

			// Setting input field to strTime
			// is input type="time"?
			var type = ie.getAttribute("type");
			if(ie.value != strTime && ie.value != intTime) {
				if(type == "time") {
					ie.value = intTime;
					if(typeof ie.valueAsDate == 'object' && ie.valueAsDate == null) {
						ie.value = strTime;
					}
				} else {
					ie.value = strTime;
				}
			} 

			// Removing all hover elements
			elems = tp.getElementsWithClass('hover', li.parentNode);
			for(i in elems) {
				tp.removeClass("hover", elems[i]);
			}
			//tp.addClass("hover", li);

			// Selecting new time using .hover class 
			var preselectTimeElement = null;
			var ISOMins = tp.minutesToISO(intTime);

			lis = picker.getElementsByTagName('li')
			for(i in lis) {
				if(typeof lis[i] == 'object') {
					if(lis[i].getAttribute("data-time") == ISOMins) {
						preselectTimeElement = lis[i];
					}
				}
			}

			if(preselectTimeElement != null) {
				var posTime = tp.getPosition(preselectTimeElement);
				var posElem = tp.getPosition(picker);
				picker.scrollTop = (posTime[1] - posElem[1]) - (picker.offsetHeight / 2) + 25;
				tp.addClass("hover", preselectTimeElement);
			}
		};

		var onChange = function(event) {
			setTime(ie.value);
		};

		var onFocus = function() {
			picker.style.display = "block";
			tp.positionBelow(ie, picker);
			// Scrolling screen to position of selected minute
			// Selecting the currently entered time
			setTime(ie.value);
		};

		var onBlurAfter = function() {
			var target = document.activeElement;
			if(target != picker && target != ie) { 
				picker.style.display = "none";
			}
		}

		var onBlur = function() {
			setTimeout(onBlurAfter, 1);
		};

		// onClick for timepicker element (not input box)
		var onClick = function(event) {
			var valueStr = this.innerHTML || event.srcElement.innerHTML;
			setTime(valueStr);
			// Have to delay this incase <input> is wrapped in <label> and clicking timepicker re-selects element
			setTimeout(onClickAfter, 1);
		};

		var onClickAfter = function() {
			ie.blur();
			picker.style.display = "none";
		}

		var onKeyDown = function(event) {
			if(event.keyCode == 38 || event.keyCode == 40) {
				var intTime = tp.stringToMinutes(ie.value);
				if(event.keyCode == 38) {
					intTime -= parseInt(config.step);
				}
				if(event.keyCode == 40) {
					intTime += parseInt(config.step);
				}
				setTime(intTime);
			}
		};





		/**************
		** RENDERING **
		**************/

		var ul = document.createElement('ul');
		for(var t = mStart; t <= mEnd; t += step) {
			var li = document.createElement('li');
			li.innerHTML = tp.minutesToString(t, config);
			li.setAttribute("data-time", tp.minutesToISO(t));
			ul.appendChild(li);
			tp.addListener("mouseover", li, tp.liMouseOver);
			tp.addListener("mouseout", li, tp.liMouseOut);
			tp.addListener("click", li, onClick);
		}

		var picker = document.createElement('div');
		picker.className = "timepicker";
		picker.style.display = "none";
		picker.setAttribute("tabindex","-1");
		picker.appendChild(ul);
		tp.positionBelow(ie, picker);
		tp.appendAfter(ie, picker);



		//tp.addListener("click", ie, onFocus);
		tp.addListener("focus", ie, onFocus);
		tp.addListener("blur", ie, onBlur);
		tp.addListener("blur", picker, onBlur);
		tp.addListener("keydown", ie, onKeyDown);
		tp.addListener("change", ie, onChange);

		return {
			inputElement : ie,
			pickerElement : picker,
			config : config,
			setTime : setTime
		}
	}
};

tp.addListener('load',window, function() {
	tp.applyStylesheet();

	// Finding all <input> elements with type="timepicker" or data-type="timepicker"
	var inputs = document.getElementsByTagName('input');
	for(var i in inputs) {
		if(typeof inputs[i] == 'object') {
			if(
				inputs[i].getAttribute("type") == "timepicker" || 
				inputs[i].getAttribute("data-type") == "timepicker"
			) {
				tp.createFromInput(inputs[i]);
			}
		}
	}
});

/* UNIT TESTS
tp.addListener('load',window, function() {
	console.log("UNIT TEST");
	function strUt(strTime) {
		var intTime = tp.stringToMinutes(strTime);
		console.log(strTime, intTime, tp.minutesToString(intTime));
	}
	function intUt(intTime) {
		var strTime = tp.minutesToString(intTime);
		console.log(intTime, strTime, tp.stringToMinutes(strTime));
	}
	strUt("5.30pm");
	strUt("11:59pm");
	strUt("12:00am");
	strUt("12.01am");
	strUt("12.30am");
	strUt("11.30pm");
	intUt(1410);

}); /* */