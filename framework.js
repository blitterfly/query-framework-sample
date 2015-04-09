/*
 * Experimental javascript framework
 * by Havi Sullivan <http://havisullivan.com>
 */
 
(function(window) {
	
	/* Constants */
	var QF_EVENT_HANDLER = '-QueryFramework-OriginalHandler',
		QF_EVENT_NS = '-QueryFramework-Namespace',
		QF_EVENT_NAME_PREFIX = '-QueryFramework-';
	var NODE_ELEMENT = 1;
	var REGEX_TRIM = /^\s+|\s+$/g,
		REGEX_ISNODELIST = /^\[object (?:HTMLCollection|NodeList|Object)\]$/,
		REGEX_ISWINDOW = /^\[object (?:DOM)?Window\]$/,
		REGEX_EVENTNAMES = /(?:blur|change|click|copy|cut|dblclick|error|focus|keydown|keypress|keyup|load|mousedown|mousemove|mouseout|mouseover|mouseup|paste|readystatechange|resize|scroll)/i,
		REGEX_MOUSEEVENTNAMES = /(?:click|dblclick|mousedown|mousemove|mouseout|mouseover|mouseup)/i;

	/* Initializer */
	function QueryFramework(selector, rootNode) {
		return new QueryFramework.prototype.init(selector, rootNode);
	};
	
	/* Event object */
	QueryFramework.EventHandler = function(eventObject) {
		var eventObject = eventObject;
		
		this.getEvent = function() {
			return eventObject || window.event;
		};
		
		return this;	
	};
	
	QueryFramework.EventHandler.prototype = {
		'cancel': function() {
			if (this.getEvent().stopPropagation) {
				this.getEvent().stopPropagation();
			} else if (typeof this.getEvent().cancelBubble !== 'undefined') {
				this.getEvent().cancelBubble = true;
			}
		},
		
		'defaultPrevented': false,
		
		'getSource': function() {
			return this.getEvent().target || this.getEvent().srcElement;
		},
		
		'preventDefault': function() {
			if (this.getEvent().cancelable) {
				this.getEvent().preventDefault();
			}
			this.defaultPrevented = true;
		}
	};
	
	/* Polyfills */
	if (typeof Array.isArray === 'undefined') {
		Array.isArray = function(arg) {
			return Object.prototype.toString.call(arg) === '[object Array]';
		}
	};
	
	if (typeof CSSStyleDeclaration.prototype.getPropertyValue === 'undefined') {
		CSSStyleDeclaration.prototype.getPropertyValue = function(a) {
	        var b = this.getAttribute(a);
	        if (b && b.indexOf('!important') > -1) {
		        b = b.replace('!important', '');
	        }
	        return b;
	    };

		CSSStyleDeclaration.prototype.getPropertyPriority = function(a) {
			var b = this.getAttribute(a);
	        return b && b.indexOf('!important') > -1 ? 'important' : '';
	    };
	    
	    CSSStyleDeclaration.prototype.setProperty = function(a, b, c) {
	    	var d = !!c ? b.toString() + ' !' + c : b.toString();
	        return this.setAttribute(a, d);
	    };
	    
	    CSSStyleDeclaration.prototype.removeProperty = function(a) {
	        return this.removeAttribute(a);
	    };
    };
	
	/* Utility functions */
	QueryFramework.arrayContains = function(arr, obj) {
		if (Array.isArray(arr) && obj) {
			if (Array.prototype.indexOf) {
				return arr.indexOf(obj) > -1;
			}
			for (var i = 0; i < arr.length; i++) {
				if (arr[i] === obj) {
					return true;
				}
			}
		}	
		return false;
	};
	
	QueryFramework.clone = function(obj) {
		var newObj = obj;
		if (arguments.length > 0) {
			if ($.isNode(obj)) {
				newObj = obj.cloneNode(true);
			} else if (obj instanceof RegExp) {
				newObj = new RegExp(obj);
			} else if (Array.isArray(obj)) {
				newObj = [];
				for (var i = 0; i < obj.length; i++) {
					newObj[i] = $.clone(obj[i]);
				}
			} else if (obj instanceof Date) {
				newObj = new Date();
				newObj.setTime(obj.getTime());
			} else if (obj instanceof QueryFramework) {
				newObj = $(obj.get());
			} else if (typeof obj === 'object') {
				var clonedObject = function() { };
				clonedObject.prototype = obj;
				var newObj = new clonedObject();
				for (var key in obj) {
					if (obj.hasOwnProperty(key)) {
						var value = obj[key];
						newObj[key] = $.clone(value);
					}
				}
			}
		} else if (this instanceof QueryFramework) {
			newObj = $.clone(this);
		}
		return newObj;
	};
	
	// this function copied from: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	QueryFramework.createUUID = function() {
	    // http://www.ietf.org/rfc/rfc4122.txt
	    var s = [];
	    var hexDigits = "0123456789abcdef";
	    for (var i = 0; i < 36; i++) {
	        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	    }
	    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
	    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
	    s[8] = s[13] = s[18] = s[23] = "-";
	
	    var uuid = s.join("");
	    return uuid;
	};

	
	QueryFramework.isElement = function(elem) { 
		return $.isNode(elem) && elem.nodeType === NODE_ELEMENT;
	}

	QueryFramework.isFunction = function(fn) {
		// note : fails on IE8 native functions (they identify as Object)
		return Object.prototype.toString.call(fn) === '[object Function]';
	};
		
	QueryFramework.isNodeList = function(nodes) {
		var result = Object.prototype.toString.call(nodes);
		if (REGEX_ISNODELIST.test(result) &&
	    	('length' in nodes) &&
	    	(nodes.length == 0 || (typeof nodes[0] === 'object' && ('nodeType' in nodes[0])))) {
		   	return true;
		}
		return false;
	};
	
	QueryFramework.isNode = function(node) {
		return node &&
			((typeof Node !== 'undefined' && node instanceof Node) ||
			(typeof node === 'object' && 'nodeType' in node));
	}
		
	QueryFramework.isWindow = function(wind) {
		return REGEX_ISWINDOW.test(Object.prototype.toString.call(wind)) ||
			typeof wind.navigator === 'object';
	};
	
	QueryFramework.trim = function(s) {
		if (!!s === false || typeof s !== 'string') {
			return s;
		}
		
		if ($.isFunction(String.prototype.trim)) {
			return s.trim();
		}
		
		return s.replace(REGEX_TRIM, '');
	};
	
	/* Other functions */
	
	// used by append/prepend
	function insertNodeNodesOrString(parentNode, insertPoint, nodeNodesOrString) {
		if (typeof nodeNodesOrString === 'string') {
			parentNode.insertAdjacentHTML(insertPoint ? 'afterbegin' : 'beforeend', nodeNodesOrString);
		} else if ($.isNodeList(nodeNodesOrString) || nodeNodesOrString instanceof QueryFramework || Array.isArray(nodeNodesOrString)) {
			var list;
			if ($.isNodeList(nodeNodesOrString)) {
				// make copy since NodeList will be live-updated
				list = [];
				for (var i = 0; i < nodeNodesOrString.length; i++) {
					list.push(nodeNodesOrString[i]);
				}
			} else if (Array.isArray(nodeNodesOrString)) {
				list = nodeNodesOrString.slice();
			} else {
				list = nodeNodesOrString.get(); 
			}

			for (var j = 0; j < list.length; j++) {
				parentNode.insertBefore(list[j], insertPoint);
			}
		} else if ($.isNode(nodeNodesOrString)) {
			parentNode.insertBefore(nodeNodesOrString, insertPoint);
		} else {
			throw new TypeError('[QueryFramework] Unable to append this object type: ' + Object.prototype.toString.call(nodeNodesOrString));
		}
	};
	
	// used by iterators
	function getNextElementSibling(node) {
		if ('nextElementSibling' in node) {
			return node.nextElementSibling;
		} else {
			var nextNode = node.nextSibling;
			while (nextNode && nextNode.nodeType !== NODE_ELEMENT) {
				nextNode = nextNode.nextSibling;
			}
			return nextNode;
		}
	};

	function getPreviousElementSibling(node) {
		if ('previousElementSibling' in node) {
			return node.previousElementSibling;
		} else {
			var prevNode = node.previousSibling;
			while (prevNode && prevNode.nodeType !== NODE_ELEMENT) {
				prevNode = prevNode.previousSibling;
			}
			return prevNode;
		}
	};

	/* Local copy - see end of file */
	var $;
	
	/* Protoype functions */
	QueryFramework.prototype = {
	
		/* Initializer */
		'init': function(selectorOrNodes, rootNode) {
			var collection = [];
			
			if (typeof selectorOrNodes === 'string') {
				// first parameter is a query selector
				var baseElements = [];
		
				if (rootNode && rootNode instanceof QueryFramework && rootNode.length > 0) {
					baseElements = rootNode.get();
				} else if (rootNode && $.isNodeList(rootNode) || Array.isArray(rootNode)) {
					baseElements = Array.prototype.slice.call(rootNode);
				} else if (rootNode && rootNode instanceof Element) {
					baseElements.push(rootNode);
				} else {
					baseElements.push(document);
				}
				
				for (var i = 0; i < baseElements.length; i++)
				{
					var nodes = baseElements[i].querySelectorAll(selectorOrNodes);
					for (var j = 0; j < nodes.length; j++) {
						collection.push(nodes[j]);
					}
				}
			} else if ($.isFunction(selectorOrNodes)) {
				// first parameter is a function (short-hand for ready function)
				collection.push(window.document);
				this.ready(selectorOrNodes);
			} else if (selectorOrNodes && selectorOrNodes.length) {
				// first parameter is a presumed collection of nodes
				if (selectorOrNodes instanceof QueryFramework) {
					collection = selectorOrNodes.get();
				} else if ($.isNodeList(selectorOrNodes) || Array.isArray(selectorOrNodes)) {
					for (var i = 0; i < selectorOrNodes.length; i++) {
						collection.push(selectorOrNodes[i]);
					}
				} else {
					throw new Error('[QueryFramework] Unknown collection type passed as first argument');
				}
			} else if (selectorOrNodes && ($.isNode(selectorOrNodes) || $.isWindow(selectorOrNodes))) {
				// first parameter is a single DOM node
				collection.push(selectorOrNodes);
			} else {
				// first parameter is omitted or not understood
				collection.push(window.document);
			}
			
			this.get = function() {
				return collection.slice();
			};
			
			this.at = function(index) {
				if (index < 0) {
					index = collection.length - index * -1;
				}
				return index < 0 || index > (collection.length - 1) ? null : collection[index];
			};

			this.length = collection.length;
			
			return this;
		},
		
		/* Utility Functions */
		arrayContains: QueryFramework.arrayContains,
		clone: QueryFramework.clone,
		createUUID: QueryFramework.createUUID,
		isElement: QueryFramework.isElement,
		isNodeList: QueryFramework.isNodeList,
		isNode: QueryFramework.isNode,
		isFunction: QueryFramework.isFunction,
		isWindow: QueryFramework.isWindow,
		trim: QueryFramework.trim,		
		
		/* Selection */
		'child': function(index) {
			var children = [];
			for (var i = 0; i < this.length; i++) {
				var node = this.at(i);
				if ($.isWindow(node)) {
					node = node.document;
				}
				var c = 0;
				for (var j = 0; j < node.childNodes.length; j++) {
					if ($.isElement(node.childNodes[j])) {
						if (c == index) {
							children.push(node.childNodes[j]);
						}
						c++;
					}
				}
			}
			return $(children);
		},
		
		'children': function() {
			var children = [];
			for (var i = 0; i < this.length; i++) {
				var node = this.at(i);
				if ($.isWindow(node)) {
					node = node.document;
				}
				for (var j = 0; j < node.childNodes.length; j++) {
					if ($.isElement(node.childNodes[j])) {
						children.push(node.childNodes[j]);	
					}
				}
			}
			return $(children);
		},
		
		'first': function() {
			if (this.length > 0)
				return $(this.at(0));
			return this;
		},
		
		'last': function() {
			if (this.length > 0)
				return $(this.at(this.length - 1));
			return this;
		},
		
		'getFirst': function() {
			return this.at(0);	
		},
		
		'getLast': function() {
			return this.at(this.length - 1);
		},
		
		'next': function() {
			if (this.length > 0) {
				var nextNodes = [];
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					var nextNode = getNextElementSibling(node);
					if (nextNode) {
						nextNodes.push(nextNode);
					}
				}
				return $(nextNodes);
			}
			return $();
		},
		
		'nextAll': function() {
			if (this.length > 0) {
				var nextNodes = [];
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					var nextNode = node;
					while (nextNode = getNextElementSibling(nextNode)) {
						// dedupe
						if (!$.arrayContains(nextNodes, nextNode))
							nextNodes.push(nextNode);
					}
				}
				return $(nextNodes);
			}
			return $();
		},
		
		'previous': function() {
			if (this.length > 0) {
				var prevNodes = [];
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					var prevNode = getPreviousElementSibling(node);
					if (prevNode) {
						prevNodes.push(prevNode);
					}
				}
				return $(prevNodes);
			}
			return $();
		},
	
		'previousAll': function() {
			if (this.length > 0) {
				var prevNodes = [];
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					var prevNode = node;
					while (prevNode = getPreviousElementSibling(prevNode)) {
						// dedupe
						if (!$.arrayContains(prevNodes, prevNode)) {
							prevNodes.push(prevNode);
						}
					}
				}
				return $(prevNodes);
			}
			return $();
		},
		
		/* Manipulation */
		'append': function(obj) {
			if (obj && this.length) {
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if ($.isNode(node)) {
						insertNodeNodesOrString(node, null, obj);
					}
				}
			}
			return this;
		},

		'prepend': function(obj) {
			if (obj && this.length) {
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if ($.isNode(node)) {
						var insertpoint = node.childNodes.length ? node.firstChild : null;
						insertNodeNodesOrString(node, insertpoint, obj);
					}
				}
			}
			return this;
		},
		
		'html': function(html) {
			if (html) {
				// set
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if ($.isNode(node)) {
						this.at(i).innerHTML = html.toString();
					}
				}
				return this;
			} else {
				// get
				if (this.length == 0) {
					return null;
				}
				
				var returned = [];
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					returned.push($.isWindow(node) ? node.document.innerHTML : node.innerHTML);
				}
				
				return returned.join(' '); // if multiple elements, concatenate the HTML
			}
		},
		
		/* Iteration */
		'all': function(predicate) {
			if (this.length > 0 && this.isFunction(predicate)) {
				for (var i = 0; i < this.length; i++)
				{
					var retval = predicate($(this.at(i)));
					if (retval === false)
						return false;
				}
				return true;
			}
			return false;
		},
		
		'any': function(predicate) {
			if (this.length > 0 && this.isFunction(predicate)) {
				for (var i = 0; i < this.length; i++)
				{
					var retval = predicate($(this.at(i)));
					if (retval === true)
						return true;
				}
			}
			return false;		
		},
		
		'each': function(iterator) {
			if (this.isFunction(iterator))
			{
				for (var i = 0; i < this.length; i++)
				{
					iterator($(this.at(i)));
				}
			}
			return this;
		},
		
		/* Attributes */
		'attr': function(name, value) {
			if (arguments.length == 2) {
				// set
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if ($.isNode(node)) {
						if (value !== null && typeof value !== 'undefined') {
							node.setAttribute(name, value);
						} else {
							node.removeAttribute(name);
						}
					}
				}
			} else if (arguments.length == 1) {
				// get
				if (this.length == 0) {
					return null;
				}
				
				var attrValues = [];
				for (var j = 0; j < this.length; j++) {
					var node = this.at(j);
					if ($.isWindow(node)) {
						node = node.document;
					}
					attrValues.push(node.getAttribute(name) || null); // normalize DOMs that return ""
				}
				return attrValues.length > 1 ? attrValues : attrValues[0];
			}
			return this;
		},
		
		/* CSS */
		'addClass': function(className) {
			for (var i = 0; i < this.length; i++) {
				var node = this.at(i);
				if ('classList' in node) {
					node.classList.add(className);
				} else if ('className' in node) {
					var cssClasses = node.className.split(' ');
					if (!this.arrayContains(cssClasses, className)) {
						cssClasses.push(className);
						node.className = cssClasses.join(' ');
					}
				}
			}
			return this;
		},
		
		'classes': function() {
			var cssClasses = [];
			if (this.length > 0) {
				var node = this.at(0);
				if ('classList' in node) {
					Array.prototype.push.apply(cssClasses, node.classList);
				} else if ('className' in node) {
					Array.prototype.push.apply(cssClasses, node.className.split(' '));
				}
			}
			return cssClasses;
		},
		
		'hasClass': function(className) {
			for (var i = 0; i < this.length; i++) {
				var node = this.at(i);
				if ('classList' in node &&
					node.classList.contains(className)) {
					return true;
				} else if ('className' in node) {
					var cssClasses = node.className.split(' ');
					if ($.arrayContains(cssClasses, className)) {
						return true;
					}
				}
			}
			return false;
		},
		
		'removeClass': function(className) {
			for (var i = 0; i < this.length; i++) {
				var node = this.at(i);
				if ('classList' in node) {
					node.classList.remove(className);
				} else if ('className' in node) {
					var cssClasses = node.className.split(' ');
					if ($.arrayContains(cssClasses, className)) {
						var newClasses = [];
						for (var j = 0; j < cssClasses.length; j++) {
							if (cssClasses[j] !== className) {
								newClasses.push(cssClasses[j]);
							}
						}
						node.className = newClasses.join(' ');
					}
				}
			}
			return this;
		},
		
		'toggleClass': function(className) {
			for (var i = 0; i < this.length; i++) {
				var node = this.at(i);
				if ('classList' in node) {
					node.classList.toggle(className);
				} else if ('className' in node) {
					var cssClasses = node.className.split(' ');
					if ($.arrayContains(cssClasses, className)) {
						$(node).removeClass(className);
					} else {
						$(node).addClass(className);
					}
				}
			}
			return this;
		},
		
		'style': function(propertyName, propertyValue) {
			var returned;
			if (arguments.length == 2) {
				// set
				var important = null;
				if (propertyValue && propertyValue.indexOf('!important') > -1) {
					important = 'important';
					propertyValue = propertyValue.replace('!important', '');
				}
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if ($.isNode(node)) {
						if (propertyValue) {
							node.style.setProperty(propertyName, propertyValue, important);
						} else {
							node.style.removeProperty(propertyName);
						}
					}
				}
			} else if (arguments.length == 1 && propertyName) {
				// get
				if (this.length == 0) {
					return null;
				}
				
				returned = [];
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if ($.isWindow(node)) {
						node = node.document;
					}
					var pvalue = node.style.getPropertyValue(propertyName);
					if (pvalue) {
						var ppri = node.style.getPropertyPriority(propertyName);
						if (ppri) {
							pvalue += ' !' + ppri;
						}
					}
					returned.push(pvalue);
				}
				
				return returned.length > 1 ? returned : returned[0];
			} else {
				// get all
				returned = [];
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if ($.isWindow(node)) {
						node = node.document;
					}
					returned.push(node.style.cssText);
				}
				return returned.length > 1 ? returned : returned[0];
			}
			return this;
		},
		
		/* Events */
			
		'attach': function(eventName, eventHandler) {
			var ename = this.eventNamespace(eventName);
			if (this.isValidEventName(ename.eventName) && this.isFunction(eventHandler)) {
				var wrapper = function(evt) {
					var eventObj = new QueryFramework.EventHandler(evt);
					eventHandler.call(eventObj.getSource(), eventObj);
					return eventObj.defaultPrevented === false;
				};
				wrapper[QF_EVENT_HANDLER] = eventHandler;
				wrapper[QF_EVENT_NS] = ename.namespace;
				
				var ename_pf = QF_EVENT_NAME_PREFIX + ename.eventName;
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if (node.addEventListener) {
						node.addEventListener(ename.eventName, wrapper, false);
					} else if (node.attachEvent) {
						node.attachEvent('on' + ename.eventName, wrapper);
					}
					node[ename_pf] = node[ename_pf] || [];
					node[ename_pf].push(wrapper);
				}
			}
			return this;
		},
		
		'detach': function(eventName, eventHandler) {
			var ename = this.eventNamespace(eventName);
			if (this.isValidEventName(ename.eventName)) {
				var ename_pf = QF_EVENT_NAME_PREFIX + ename.eventName;
				
				if ($.isFunction(eventHandler)) {
					// we're passed the actual event handler to remove
					for (var i = 0; i < this.length; i++) {
						var node = this.at(i);
						var dict = node[ename_pf];
						var wrapper = eventHandler;
						if (Array.isArray(dict)) {
							for (var j = 0; j < dict.length; j++) {
								var handler = dict[j];
								if (handler[QF_EVENT_HANDLER] === eventHandler &&
									(ename.namespace === '' || ename.namespace === handler[QF_EVENT_NS])) {
									wrapper = handler;
									break;
								}
							}
						}
						
						if (node.removeEventListener) {
							node.removeEventListener(ename.eventName, wrapper, false);
						} else if (node.detachEvent) {
							node.detachEvent('on' + ename.eventName, wrapper);
						}
						
						if (dict) {
							var newDict = [];
							for (var j = 0; j < dict.length; j++) {
								var handler = dict[j];
								if (handler !== wrapper)
									newDict.push(handler);
							}
							node[ename_pf] = newDict.length > 0 ? newDict : null;
						}
					} /* for */
				} else { /* if $.isFunction */
					// no event handler, remove by event name and namespace only
					for (var i = 0; i < this.length; i++) {
						var node = this.at(i);
						var dict = node[ename_pf];
						var newDict = [];
						if (dict) {
							for (var j = 0; j < dict.length; j++) {
								var handler = dict[j];
								if (ename.namespace === '' || ename.namespace === handler[QF_EVENT_NS]) {
									if (node.removeEventListener) {
										node.removeEventListener(ename.eventName, handler, false);
									} else if (node.detachEvent) {
										node.detachEvent('on' + ename.eventName, handler);
									}
								} else {
									newDict.push(handler);
								}
							}
						}
						node[ename_pf] = newDict.length > 0 ? newDict : null;
					} /* for */
				} /* if $.isFunction */
			} /* if this.isValidEventName */
			return this;
		},
		
		'fire': function(eventName) {
			if (this.isValidEventName(eventName)) {
				var evt;
				if (REGEX_MOUSEEVENTNAMES.test(eventName)) {
					if (document.createEvent) {
						evt = document.createEvent('MouseEvents');
						evt.initMouseEvent(eventName, true, true, window, eventName == 'dblclick' ? 2 : 1, 0, 0, 0, 0, false, false, false, false, 0, null);
					} else if (document.createEventObject) {
						evt = document.createEventObject();
						evt.button = 1;
						evt.type = eventName.toLowerCase();
					}
				} else {
					if (document.createEvent) {
						evt = document.createEvent('UIEvents');
						evt.initUIEvent(eventName, true, true, window, 0);
					} else if (document.createEventObject) {
						evt = document.createEventObject();
						evt.type = eventName.toLowerCase();
					}
				}
				
				for (var i = 0; i < this.length; i++) {
					var node = this.at(i);
					if (node.dispatchEvent) {
						node.dispatchEvent(evt);
					} else if (node.fireEvent) {
						node.fireEvent('on' + eventName, evt);
					}
				}
			}
			return this;
		},
		
		'isValidEventName': function(eventName) {
			return REGEX_EVENTNAMES.test(eventName);
		},
		
		'eventNamespace': function(eventName) {
			// normalize an event name/namespace pair
			var returned = { eventName: '', namespace: '' };
			if (eventName) {
				var parts = eventName.split('.');
				if (parts.length > 0) {
					returned.eventName = parts[0].toLowerCase();
				}
				if (parts.length > 1) {
					returned.namespace = parts.slice(1).join('.');
				}
			}
			return returned;
		},
		
		'ready': function(eventHandler) {
			var target = window.document;
			var wrapper = function(evt) {
				if (target.readyState === 'complete') {
					var eventObj = new QueryFramework.EventHandler(evt);
					eventHandler.call(eventObj.getSource(), eventObj);
					return evt.defaultPrevented === false;
				}
			};
			
			if (target.addEventListener) {
				target.addEventListener('readystatechange', wrapper, false);
			} else if (target.attachEvent) {
				target.attachEvent('onreadystatechange', wrapper);
			}

			if (target.readyState === 'complete') {
				// document is already done loading, fire immediately
				var evt;
				if (document.createEvent) {
					evt = document.createEvent('UIEvents');
					evt.initUIEvent('readystatechange', true, true, window, 0);
				} else if (document.createEventObject) {
					evt = document.createEventObject();
					evt.type = 'readystatechange';
				}
				wrapper.call(target, evt);
			}
			
			return this;
		}
	};
	
	QueryFramework.prototype.init.prototype = QueryFramework.prototype;

	$ = window.QueryFramework = QueryFramework;
	window.$ = window.$ || $;
})(this);