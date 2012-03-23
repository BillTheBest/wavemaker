/*
 *  Copyright (C) 2008-2011 VMware, Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

dojo.provide("wm.base.components.JsonRpcService");
dojo.require("wm.base.components.Service");
dojo.require("dojo.rpc.JsonService");
dojo.require("dojox.uuid.generateRandomUuid");

wm.inflight = {
	_inflight: [],
        _inflightNames: [],
	getCount: function() {
		return this._inflight.length; 
	},
	change: function() {
	},
    // inName: this.service,
    // this.name, inArgs, inMethod, invoker);
    add: function(inDeferred, inName, optName, inArgs, inMethod, invoker) {
	inDeferred._timeStamp = new Date().getTime();
	this._inflight.push(inDeferred);

	var name;
	if (inName != "runtimeService") {
	    name = inName + "." + inMethod;
	} else if (optName) {
	    name = optName + "." + inMethod;
	} else if (inArgs[0]) {
	    name = inArgs[0] + ": " + inArgs[1];
	} else {
	    name = "LazyLoad: " + inArgs[1];
	}


		this._inflightNames.push(name);
		inDeferred.addBoth(dojo.hitch(this, "remove", inDeferred));
		this.change();
	},
	remove: function(inDeferred, inResult) {
		var i = dojo.indexOf(this._inflight, inDeferred);
		if (i==-1)
			return;
		var delta = new Date().getTime() - inDeferred._timeStamp;
		//console.info("deferred inflight for ", delta + "ms", inDeferred);
		this._inflight.splice(i, 1);
		this._inflightNames.splice(i, 1);
		this.change();
		return inResult;
	},
	cancel: function() {
		dojo.forEach(this._inflight, function(d) {
			if (!d.canceller)
				d.canceller = function() {};
			d.cancel();
		});
	}
}

dojo.subscribe("wm-unload-app", wm.inflight, "cancel");

dojo.declare("wm.JsonRpc", dojo.rpc.JsonService, {
	smd: null,
	required: false,
	sync: false,
    _designTime: false,
	requestHeaders: {},
	bind: function(method, parameters, deferredRequestHandler, url){
		//console.log("method", method, "parameters", parameters || [], "url", url || this.serviceUrl);
		url = url || this.serviceUrl;

		//if a query is running for salesforceService, the query service must be provided by the customer application,
		//not from Studio.
		if (method == "runQuery" && parameters[0] == SALESFORCE_SERVICE) {
			url = wm.services.getService(SALESFORCE_SERVICE)._service.serviceUrl;
		}

		if (!url)
			return;

		//The following lines are not being used now.  They may be used in the future to differenciate requests from Studio from
		//requests deployed application.
		if (this._designTime) 
					url = url + "?designTime=true";
	    
		var props = {
			url: url||this.serviceUrl,
			postData: this.createRequest(method, parameters || []),
			contentType: this.contentType,
			timeout: this.timeout, 
			handleAs: "json",
			sync: this.sync,
			headers: this.requestHeaders
		}
	    if (wm.xhrPath) {
		props.url = wm.xhrPath + props.url;
	    }
		var def = dojo.rawXhrPost(props);
		deferredRequestHandler = dojo.mixin(deferredRequestHandler, def.ioArgs);

		def.addCallbacks(this.resultCallback(deferredRequestHandler), this.errorCallback(deferredRequestHandler));
	},
	// override dojo default, we want full result object, not just {result: ...}
	parseResults: function(obj){
		return obj;
	},
	setRequestHeaders: function(reqHeaders) {
		this.requestHeaders = reqHeaders;
	}
});

dojo.declare("wm.JsonRpcService", wm.Service, {
	operations: "",
	ready: false,
	service: "",
	// 0 indicates no timeout.
	timeout: 0,
	errorLevel: 10,
	sync: false,
	url: "",
	_methods: [],
	_operations: {},
	_service: null,
	init: function() {
		//dojo.mixin(this.readonlyProps, { methods: 1, ready: 1 });
		this.inherited(arguments);
		this.initService();
	},
	setSync: function(inSync) {
		this.sync = inSync;
	},
	getServiceRoot: function() {
		return this.getPath() + "services/";
	},
	getJsonPath: function() {
		var p = '';
		// this window.studio test is needed for the login page to run when not in debug mode
		if(this.isDesignLoaded() && window.studio && studio.project) {
		    p = '/' + studio.project.getProjectPath() + '/';
		}
		return p;
	},
	// FIXME: we're making a new service object for every rpc service.
	// This is unnecessary and one side effect is that the smd is re-requested for each rpc service
	// at the least we could cache this smd data to avoid re-retrieving it.
	// it seems unnecessary to have more than one JsonRpc per service
	// and it may be unnecessary to have more than one JsonRpcService (ever) per service 
	// JsonRpcService has a few properties that make collapsing the number of them non-trivial (e.g. sync, timeout)
    initService: function() {
	var n = this.service || this.name;
	var rand = this.owner && this.isDesignLoaded() ? studio.application.getFullVersionNumber() : (app && !window["studio"] ? app.getFullVersionNumber() : Math.floor(Math.random()*1000000));
    var cachedName = this.url || n + ".smd";
	var url = this.url || (n && (this.getServiceRoot() + n + ".smd"));
	this._service = null;
	if (url) {
	    try{
		/* SMD files change at design time, never use a cached SMD file at design time */
		if (window["studio"]) {
		    this._service = new wm.JsonRpc(url + "?rand=" + Math.floor(Math.random() * new Date().getTime()));
		} else if (wm.JsonRpcService.smdCache[url]) {
		    this._service = wm.JsonRpcService.smdCache[url];
		} else if (wm.JsonRpcService.smdCache[cachedName]) {
		    this._service = new wm.JsonRpc({smdObject: wm.JsonRpcService.smdCache[cachedName],
						    serviceUrl: url.replace(/\.smd/,".json")});
		} else {
		    this._service = new wm.JsonRpc(url + "?rand=" + rand);
		}
		wm.JsonRpcService.smdCache[url] = this._service;
		    //The following lines are not being used now.  They may be used in the future to differenciate requests from Studio from
		    //requests deployed application.
		    if (this._designTime)
			this._service._designTime = true;

		    this._service.timeout = this.timeout;
		    this.ready = Boolean(this._service && this._service.smd);
		    if (this.ready) {
			this._service.serviceUrl = this.getJsonPath() + this._service.serviceUrl;
			this.listOperations();
		    }
	    }catch(e){
		console.debug(e);
	    }
	}
    },
	setName: function(inName) {
		this.inherited(arguments);
		if (!this.url)
			this.initService();
	},
	ensureArgs: function(inMethod, inArgs) {
		if (inMethod in this._operations && dojo.isArray(inArgs)) {
			var op = this._operations[inMethod], argCount=0;
			if (op) {
				for (var o in op.parameters)
					argCount++;
				for (var i=inArgs.length; i<argCount; i++)
					inArgs.push(null);
			}
		}
	},
	invoke: function(inMethod, inArgs, owner, invoker) {
		this.invoke(inMethod, inArgs, owner, invoker, false, false, null);
	},
	invoke: function(inMethod, inArgs, owner, invoker, inLoop, inLongDeferred, requestId) {
		if (!this._service) 
			return null;
		this._service.sync = this.sync;
		this.ensureArgs(inMethod, inArgs);
		//if (wm.logging)
	        this.debugLastMethod = inMethod;
		if (djConfig.isDebug && !dojo.isFF) {
		    if (console.groupCollapsed)
			console.groupCollapsed("JsonRpcService.invoke method:", inMethod);
		    else
			console.group("JsonRpcService.invoke method:", inMethod);
		    if (inArgs && inArgs.length) {
		      console.log("Arguments:");
		      console.log(inArgs); 
		    }
		    console.groupEnd();
		}
		this.result = null;
		this.error = null;
		if (inLoop) {
			this._service.setRequestHeaders({"wm-polling-request" : requestId});
		} else {
			requestId = dojox.uuid.generateRandomUuid();
			this._service.setRequestHeaders({"wm-initial-request" : requestId});
		}

		var d = this._service.callRemote(inMethod, inArgs || []);
		var longDeferred = inLongDeferred || new dojo.Deferred();
		d.addCallbacks(dojo.hitch(this, "onLongResponseTimeResult", inMethod, inArgs, owner, invoker, inLoop, requestId, longDeferred, d), 
			dojo.hitch(this, "onLongResponseTimeError", inMethod, inArgs, owner, invoker, inLoop, requestId, longDeferred, d));
		d = longDeferred;
		
	    wm.inflight.add(d, this.service, this.name, inArgs, inMethod, invoker);
		this.inflight = true;
		return d;
	},
    request: function(inMethod, inArgs, inResult, inError, invoker) {
	    var d = this.invoke(inMethod, inArgs, null, invoker);
		if (inResult) {
			if (dojo.isFunction(inResult))
				d.addCallback(inResult);
			else
				d.addCallback(this.owner, inResult);
		}
		if (inError) {
			if (dojo.isFunction(inError))
				d.addErrback(inError);
			else
				d.addErrback(this.owner, inError);
		}
		return d;
	},
	// force a sync call, irrespective of our sync setting
    requestSync: function(inMethod, inArgs, inResult, inError, invoker) {
		var s = this.sync;
		this.sync = true;
	        var d = this.request.apply(this, [inMethod, inArgs, inResult, inError, null, invoker]);
		this.sync = s;
		return d;
	},
	// force an async call, irrespective of our sync setting
        requestAsync: function(inMethod, inArgs, inResult, inError, invoker) {
		var s = this.sync;
		this.sync = false;
		var
			cb = inResult ? dojo.hitch(this, function() {
				this.sync = s;
				return inResult.apply(this, dojo._toArray(arguments));
			}) : null,
			eb = inError ? dojo.hitch(this, function() {
				this.sync = s;
				return inError.apply(this, dojo._toArray(arguments));
			}) : null;
	         return this.request(inMethod, inArgs, cb, eb, null, invoker);
	},
	getResultSync: function(inMethod, inArgs) {
		var d = this.requestSync(inMethod, inArgs);
		return d.results[0];
	},
	onLongResponseTimeResult: function(inMethod, inArgs, owner, invoker, inLoop, requestId, longDeferred, deferred, inResult) {
		var r;
	    this.inflight = false;
		var callInvoke = false;
		var processStatus = deferred.xhr.getResponseHeader("wm-json-response-status");
		if (inLoop) {
			if (processStatus == "processing") {
				callInvoke = true;
			} else if (processStatus == "error") {
				return this.onLongResponseTimeError(inMethod, inArgs, owner, invoker, inLoop, requestId, longDeferred, deferred, inResult.result);
			} else if (processStatus == "done") {
				r = this.fullResult = inResult;
				this.result = (r || 0).result;
				longDeferred.callback(this.result);
			} else {
				callInvoke = true;
			}
			if (callInvoke) {
				wm.onidle(this, function() {
					this.invoke(inMethod, inArgs, owner, invoker, true, longDeferred, requestId);
				});
			}
		} else {

			longDeferred.callback(this.onResult(inResult));
		}
	},
	onLongResponseTimeError: function(inMethod, inArgs, owner, invoker, inLoop, requestId, longDeferred, deferred, inError) {
		if (deferred.xhr.status == 504 || deferred.xhr.status == 502) {			
			this.invoke(inMethod, inArgs, owner, invoker, true, longDeferred, requestId);
		} else {
			longDeferred.errback(this.onError(inError));
		}
	},

	onResult: function(inResult) {
		this.inflight = false;
		var r = this.fullResult = inResult;
		this.result = (r || 0).result;
/*
		if (djConfig.isDebug && !dojo.isFF) {
			console.group("Service Call Completed: " + this.name + "." + this.debugLastMethod);
			if (this.result) {
			    console.log(this.result);
			} else {
			    console.log("Response was null");
			}
			console.groupEnd();
		}
		*/
		return this.result;
	},
	onError: function(inError) {
	    this.inflight = false;
	    var message = inError != null && dojo.isObject(inError) ? inError.message : inError;
	    try {
		if (!inError || message.match(/No ServiceWire found/) && !djConfig.isDebug)
		    return;

		if (console.groupCollapsed)
	            console.groupCollapsed("Service Call Failed: " + this.name + "." + this.debugLastMethod);
		else
	            console.group("Service Call Failed: " + this.name + "." + this.debugLastMethod);                              
		if (message)
		  console.error(message);                                                                               
                console.groupEnd();    
		var errCodes = message.match(/(\d+)$/);
		var errCode = (errCodes) ? errCodes[0] : "";

		// If the failer is a security access error, AND if its NOT a security error that comes from live view 
		// (happens when a project accesses the server while running within studio), then tell the user to log back in.
		// Also don't repeat this alert more than once every 3 minutes (it takes 4 server accesses to open a page, so thats 4 alerts in a row!)
		if (errCode == 403) {
		    dojo.publish("session-expiration", []);
		    if (app && app.onSessionExpiration)
			app.onSessionExpiration();
		} 	       
	    } catch(e) {		
		if (wm.logging) {
		    console.dir(e);
		    console.dir(inError);
		}
	    }
	    this.reportError(inError);
	    return this.error = inError;
	},
	
	reportError: function(inError) {
		var m = dojo.isString(inError) ? inError : (inError.message ? "Error: " + inError.message : "Unspecified Error");
		m = (this.name ? this.name + ": " : "") + m;
		if (this.errorLevel > 5) {
			if (!inError.dojoType == "cancel")
				console.error(m);
		} else if (this.errorLevel > 0)
			wm.logging && console.debug(m);
	},
	paramArrayToHash: function(inParams) {
		var hash = {};
		for (var i=0, p; (p=inParams[i]); i++)
		    hash[p.name] = { type: p.type, hidden: p.hidden };
		return hash;
	},
	listOperations: function() {
		this._methods = [];
		this._operations = {};
		var m = (this._service.smd||0).methods || [];
		for (var i=0, op; (op=m[i]); i++){
			this._methods.push(op.name);
			this._operations[op.name] = {
			    parameters: this.paramArrayToHash(op.parameters || []),
			    returnType: op.returnType || "any",
			    operationType: op.operationType || ""
				//responseTime: op.responseTime || ""
			};
		}
		this._methods.sort();
	}, 
	makePropEdit: function(inName, inValue, inEditorProps) {
		if (inName == "operations")
		    return new wm.SelectMenu(dojo.mixin(inEditorProps, {options:this._methods || []}));
		return this.inherited(arguments);
	}
});

wm.Object.extendSchema(wm.JsonRpcService, {
	ready: { ignore: 1 }
});

wm.JsonRpcService.description = "Any JsonRpc service.";
wm.JsonRpcService.smdCache = {};