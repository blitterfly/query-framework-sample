/*
 * Experimental javascript framework - AJAX plugin
 * by Havi Sullivan <http://havisullivan.com>
 */ 

(function(window, $) {

	/* AJAX */
	$.ajax = $.prototype.ajax = function(method, url, options)
	{
		options = options || {};
		
		var xhr = new XMLHttpRequest();
		if (options.async !== false)
			xhr.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (this.status == 200 && $.isFunction(options.onsuccess))
					{
						options.onsuccess(this);
					}
					else if ($.isFunction(options.onerror))
					{
						options.onerror(this);
					}
						
					if ($.isFunction(options.oncomplete))
					{
						options.oncomplete(this);
					}
				}
			};
		xhr.open(method, url, options.async !== false);
		xhr.send(options.body);
		return xhr;
	};
		
	$.ajaxGet = $.prototype.ajaxGet = function(url, options)
	{
		return this.ajax('GET', url, options);
	};
		
	$.ajaxPost = $.prototype.ajaxPost = function(url, body, options)
	{
		options = options || {};
		options.body = body;
		return this.ajax('POST', url, options);
	};

})(this, QueryFramework);