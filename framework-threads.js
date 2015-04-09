/*
 * Experimental javascript framework - Threads plugin
 * by Havi Sullivan <http://havisullivan.com>
 */
 
(function(window, $) {

	function executeWaitingThread() {
		var self = this;

		if (this.getActive()) {
			var thread = this.getWaitingThread();
			if (thread) {
				// define new global error handler for thread execution
				var errorHandler = function(errorMsg, url, lineNumber) {
					try {
						thread.setLastError(errorMsg);
						var onerror = thread.getOnErrorCallback() || self.getOnErrorCallback();
						if ($.isFunction(onerror)) {
							onerror.call(thread);
						}
						return true;
					} catch (e) {
						console.log('[QueryFramework] Error thrown from error handler for thread ' + thread.getID() + ': ' + e);
						return false;
					}
				};
				var oldErrorHandler = window.onerror;
				
				// execute thread
				try {
					window.onerror = errorHandler;
					if (!!thread.execute()) {
						// thread requested re-execution, add back to thread queue
						this.addThread(thread);
					}
				} catch (e) {
					errorHandler(e);
				} finally {
					// restore previous error handler
					window.onerror = oldErrorHandler;
				}
			} else if (this.getImplicitStop()) {
				this.stop();
			}

			// re-queue thread loop
			window.setTimeout(function() { executeWaitingThread.call(self); }, this.getFrequency());
		}
	};
	
	function performStart() {
		var onstart = this.getOnStartCallback();
		if ($.isFunction(onstart)) {
			onstart.call(this);
		}
		
		var self = this;
		window.setTimeout(function() { executeWaitingThread.call(self); }, this.getFrequency());
	};
	
	function performStop() {
		this.clear();
		var onstop = this.getOnStopCallback();
		if ($.isFunction(onstop)) {
			onstop.call(this);
		}
	};

	/* Object prototypes */
	$.ThreadPool = function(options) {
		options = options || {};
		var _queue = [];
		var _active = false;
		var _frequency = options.frequency || $.ThreadPool.FREQUENCY_HI;
		if (_frequency < 0) {
			_frequency = 0;
		}
		var _implicitStart = !!options.implicitStart;
		var _implicitStop = !!options.implicitStop;
		var _onstart = options.onstart;
		var _onstop = options.onstop;
		var _onerror = options.onerror;
		
		this.getWaitingThread = function() {
			return _queue.shift();
		};
		
		this.addThread = function(thread) {
			if (thread && thread instanceof $.Thread) {
				_queue.push(thread);
			}	
		};
		
		this.clear = function() {
			_queue = [];
		};
		
		this.getActive = function() {
			return _active;	
		};
		
		this.setActive = function(value) {
			if (_active === value) {
				return;
			}
			_active = value;
			if (!!value) {
				performStart.call(this);
			} else {
				performStop.call(this);
			}
		};
		
		this.getFrequency = function() {
			return _frequency;	
		};
		
		this.getImplicitStart = function() {
			return _implicitStart;
		};
		
		this.getImplicitStop = function() {
			return _implicitStop;	
		};
		
		this.getOnErrorCallback = function() {
			return _onerror;
		};
		
		this.getOnStartCallback = function() {
			return _onstart;
		};
		
		this.getOnStopCallback = function() {
			return _onstop;	
		};
	};
	
	$.Thread = function(options, threadPool) {
		if (options && $.isFunction(options)) {
			options = { callback: options };
		} else {
			options = options || {};
		}
		var _state = options.state;
		var _callback = options.callback;
		var _onerror = options.onerror;
		var _threadState = $.Thread.UNSTARTED;
		var _lastError = null;
		var _id = $.createUUID();
		
		this.execute = function() {
			try {
				_threadState = $.Thread.STATE_RUNNING;
				if ($.isFunction(_callback)) {
					return _callback.call(this, _state);
				} else {
					return false;
				}
			} finally {
				if (_threadState !== $.Thread.STATE_ABORTED) {
					_threadState = $.Thread.STATE_STOPPED;
				}
			}
		};
		
		this.abort = function() {
			_threadState = $.Thread.STATE_ABORTED;
			throw new $.ThreadAbortError('Thread aborted');
		};
		
		this.getID = function() {
			return _id;
		};
		
		this.getOnErrorCallback = function() {
			return _onerror;
		};
		
		this.getState = function() {
			return _state;
		};
		
		this.getThreadPool = function() {
			return threadPool;	
		};
		
		this.getThreadState = function() {
			return _threadState;
		};
		
		this.getLastError = function() {
			return _lastError;
		};
		
		this.setLastError = function(value) {
			if (value && value instanceof Error) {
				_lastError = value;
			} else if (value && typeof value === 'string') {
				_lastError = new Error(value);
			}
		};
	};
	
	$.Thread.STATE_UNSTARTED = 0;
	$.Thread.STATE_RUNNING = 1;
	$.Thread.STATE_STOPPED = 2;
	$.Thread.STATE_ABORTED = 3;
	
	$.Thread.prototype = {
		'wasAborted': function() {
			return this.getThreadState() === $.Thread.STATE_ABORTED;
		}
	};

	$.ThreadPool.FREQUENCY_HI = 0;
	$.ThreadPool.FREQUENCY_MED = 20;
	$.ThreadPool.FREQUENCY_LOW = 100,
	
	$.ThreadPool.prototype = {

		'createThread': function(options) {
			if (!!options === false) {
				throw new Error('Incorrect parameters');
			}
			return new $.Thread(options, this);
		},
			
		'queue': function(optionsOrThread) {
			var thread = optionsOrThread && optionsOrThread instanceof $.Thread ? optionsOrThread : this.createThread(optionsOrThread);
			this.addThread(thread);
			if (this.getImplicitStart()) {
				this.start();
			}
			return this;
		},
	
		'start': function() {
			this.setActive(true);
			return this;
		},
		
		'stop': function() {
			this.setActive(false);
			return this;
		}
	};
	
	$.ThreadAbortError = function(message) {
		this.message = message;
	};
	
	$.ThreadAbortError.prototype = new Error();
	
	$.prototype.thread = function(options) {
		if (options) {
			var opt = $.isFunction(options) ? { callback: options } : $.clone(options);
			if (!!opt.state === false) {
				opt.state = this;
			}
			var pool = new $.ThreadPool({ implicitStart: true, implicitStop: true });
			pool.queue(opt);
		}
		return this;	
	};
	
})(this, QueryFramework);