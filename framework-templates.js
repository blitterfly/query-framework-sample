/*
 * Experimental javascript framework - Templates plugin
 * by Havi Sullivan <http://havisullivan.com>
 */
 
(function(window, $) {
	/* Constants */
	var NodeTypes = {
		'ELEMENT_NODE': 1,
		'TEXT_NODE': 3
	};
	
	/* Functions */
	
	// does a deep copy of template and returns the copy, ID will be stripped from the root element if any
	function copyTemplate(template) {
		var element = template.cloneNode(false);
		element.removeAttribute('id');
		if (template.hasChildNodes())
		{
			var node = template.firstChild;
			while (node)
			{
				if (node.nodeType == NodeTypes.ELEMENT_NODE) {
					element.appendChild(node.cloneNode(true));
				}
				else if (node.nodeType == NodeTypes.TEXT_NODE) {
					element.appendChild(node.cloneNode(false));
				}
				node = node.nextSibling;
			}
		}
		return element;
	};
	
	// applies the properties found in object 'data' to template node 'target' using function 'namingFunction' for property names
	function applyTemplateProperties(target, data, namingFunction, removeClassOnApply) {
		var target$ = $(target);
		var classes = target$.classes();
		for (var propertyKey in data) {
			var propertyParts = propertyKey.split('$', 2);
			var propertyName = namingFunction(propertyParts[0]);
			for (var i = 0; i < classes.length; i++)
				if (classes[i] === propertyName) {
					if (propertyParts.length > 1 && propertyParts[1]) {
						// $-separated means to set an attribute (style is special and appends rather than replacing)
						if (propertyParts[1].toLowerCase() === 'style') {
							var rules = data[propertyKey].split(';');
							for (var j = 0; j < rules.length; j++) {
								var parts = rules[j].split(':');
								if (parts.length == 2) {
									target$.style($.trim(parts[0]), $.trim(parts[1]));
								}
							}
						} else {
							target$.attr(propertyParts[1].toLowerCase(), data[propertyKey].toString());
						}
					} else if (target.tagName.toUpperCase() === 'IMG') {
						// if the target is an IMG tag, assume we want to set the SRC attribute
						target$.attr('src', data[propertyKey].toString());
					} else {
						// all others, append the contents to the end of the tag (assuming it's convertible to an HTML string)
						target$.append(data[propertyKey].toString());
					}
					
					if (removeClassOnApply) {
						target$.removeClass(classes[i]);
					}
				}
		}
		
		if (target.hasChildNodes())
		{
			for (var i = 0; i < target.childNodes.length; i++)
			{
				var node = target.childNodes[i];
				if (node.nodeType == NodeTypes.ELEMENT_NODE) {
					applyTemplateProperties(node, data, namingFunction, removeClassOnApply);
				}	
			}
		}
	};

	
	/* Object prototypes */
	$.TemplateObject = function(options) {
		if (options && (typeof options === 'string' || Array.isArray(options) || $.isNodeList(options) || $.isNode(options) || options instanceof $)) {
			options = { template: options };
		} else {
			options = options || {};
		}
		
		this.getTemplateSelectorOrNodes = function() {
			return options.template;
		};
		
		this.getClassNamePrefix = function() {
			return options.classNamePrefix || '';
		};
		
		this.getRemoveClassOnApply = function() {
			return !!options.removeDataClasses;	
		};
	};
	
	$.template = function(options) {
		return new $.TemplateObject(options);	
	};
	
	$.prototype.template = function(options) {
		var opt = options || {};
		opt.template = opt.template || this.get();
		return new $.TemplateObject(opt);	
	};
	
	$.TemplateObject.prototype = {
		'render': function(insertPointSelectorOrNodes, data, insertCallback) {
			var self = this;
			data = data || {};
			var templates$ = $(this.getTemplateSelectorOrNodes());
			var insertPoints$ = $(insertPointSelectorOrNodes);
			if (templates$.length && insertPoints$.length) {
				for (var n = 0; n < templates$.length; n++) {
					var templateNode = templates$.at(n);
					
					if ($.isNode(templateNode) && templateNode.nodeType == NodeTypes.ELEMENT_NODE) {
						var arr = Array.isArray(data) ? data : [ data ];
						
						for (var i = 0; i < arr.length; i++) {
							if (typeof arr[i] === 'object') {
								
								var newNode = copyTemplate(templateNode);
								applyTemplateProperties(newNode, arr[i], function(propertyName) { return self.getCssNameForProperty(propertyName); }, self.getRemoveClassOnApply());
								if ('id' in arr[i]) {
									newNode.id = arr[i].id;
								}
								
								insertPoints$.append(newNode);
								if ($.isFunction(insertCallback)) {
									insertCallback(i, $(newNode), arr[i]);
								}
								
							} /* if typeof */
						} /* for i */
						
					} /* if templateNode */
				} /* for n */
			} /* if templates$ */
			return this;
		},
		
		'getCssNameForProperty': function(propertyName) {
			this._cssPropertyCache = this._cssPropertyCache || {};
			if (this._cssPropertyCache[propertyName]) {
				return this._cssPropertyCache[propertyName];
			}

			var prefix = this.getClassNamePrefix();
			if (prefix) {
				prefix += '-';
			}
			return this._cssPropertyCache[propertyName] = (prefix + propertyName.replace(/[a-z][A-Z]/, function(str) {
				return str[0] + '-' + str[1];
			})).toLowerCase();
		}
	}
})(this, QueryFramework);