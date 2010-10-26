/*
 *  Copyright (C) 2008-2010 WaveMaker Software, Inc.
 *
 *  This file is part of the WaveMaker Client Runtime.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
dojo.provide("wm.base.components.Page");
dojo.require("wm.base.Widget");

dojo.connect(window, "onresize", function(){ dojo.publish("window-resize"); });

var wmObjectList = [];
wm.getObject = function(inType){
	if (!wmObjectList[inType])
	{
		wmObjectList[inType] = dojo.getObject(inType);
	}

	return wmObjectList[inType];
}

dojo.declare("wm.Page", wm.Component, {
	name: '',
        deletionDisabled: 1,
	create: function() {
		this.inherited(arguments);
		if (!this.name) 
		    this.name = this.declaredClass.toLowerCase();
		//dojo.addOnLoad(wm.async(dojo.hitch(this, "render")));
		this.render();
	},
	getMainPage: function() {
	  if (!this.owner)
	  	return null;
	  var owner = this.owner;
	  while(owner.owner) {
	    owner = owner.owner;
	  }
	  if (owner instanceof wm.Application)
	    return owner;
	},
	destroy: function() {
	  	var owner = this.getMainPage();
	  	if (owner) 
			owner.subPageUnloaded(this);	  
	  	if (window.app) 
			window.app.subPageUnloaded(this);
		wm.fire(this.root, "destroy");
		this.inherited(arguments);
		delete this.app;
		delete this.domNode;
		delete this.root;
		owner = null;
		delete this._designee;
	},
	/* TODO: Does't this mean that if my page name is document, then window.document property gets clobbered? (MK)*/
	init: function() {
		this.app = window.app;
		if (this.owner instanceof wm.Application)		
			window[this.name] = this;
		else
			this.owner[this.name] = this;
		this.inherited(arguments);
	},
	forEachWidget: function(inFunc) {
		if (this.root)
			return wm.forEachWidget(this.root, inFunc);
		// returning pure "false" will halt the forEach, undefined is ok
	},
	render: function() {
		//console.time('renderTime ');
		var d = this.domNode || document.body;
		// FIXME: hiding pages not owned by app when rendered
		// this really only applies to pages loaded into pageContainers
		// however, due to asynchronous rendering it's not convenient to put
		// this code elsewhere right now.
		var notAppOwned = (this.owner != app), ds = d.style;
		dojo.addClass(d, this.declaredClass);
		
		// if noAppOwned, we set left to negetive value so that user cannot see
		// the actual rendering. After this is done, we should place this div at 
		// the place it was earlier(ie, previousStyleLeft).
		var previousStyleLeft = ds.left;
		if (notAppOwned)
			ds.left = "-100000px";
		wm.timePage && console.time("page.loadComponents");
	    this._loadingPage = true;
	    var startTime = new Date().getTime();
	    var widgets = this.constructor.widgets || this.widgets;
	    if (wm.isEmpty(widgets)) 
			alert("Page " + this.name + " has been corrupted, and no longer has a wm.Layout nor any widgets; please create a new project or edit " + this.name + ".widgets.js by hand");
		this.loadComponents(widgets, null);

	    //this._layoutPanel.parentNode.appendChild(this._layoutPanel.domNode);

		//this.loadCssHtml();
		wm.timePage && console.timeEnd("page.loadComponents");
		var self = this;
	    
		// reverting Michael's change here.
		//if (this.getRoot() instanceof wm.Page && this.getRoot()._loadingPage) {
		//this.postRender();
		//this.onShow();
	    //} else
		
	    dojo.addOnLoad(dojo.hitch(this, function(){
		this.postRender();
		if (notAppOwned)
		    ds.left = previousStyleLeft;
                if (!this.root.isAncestorHidden())
		    this.onShow();
                if (this.owner instanceof wm.Control)
                    this.owner.connectToAllLayers(this, "onShow");
		    //alert("Page rendered in " + ( new Date().getTime() - startTime) + " ms");
			//console.timeEnd('renderTime ');
			//console.info('postInitCalled = ' + postInitCalled);
			//postInitCalled = 0;
	    }));

		//console.profile();

	},
	postRender: function() {
		wm.timePage && console.time("root.reflow");
		wm.fire(this.root, "reflow");
		wm.timePage && console.timeEnd("root.reflow");
		/*
		if (this.owner && this.owner.reflowParent)
			this.owner.reflowParent();
		else
			dojo.publish("window-resize");
		*/
		// FIXME: automatically unload support for parts used in the studio interface
		// so as not to conflict with user parts
		wm.fire(this, "unloadSupport");
		try {
	            this._loadingPage = false;
		    if (this.root) {
			//this.root.leafFirstRenderCss();
			this.reflow();
		    }
		    this.start();
                    this._startCalled = true;
	        if (wm.debugPerformance) {
	            var timeToLoad = this.stopTimerWithName("LoadPage", "wm.Layout");

		    console.log("PAGE "+ timeToLoad + " ms");
		}

		    this.onStart();

                    /* Moved to Application.pageChanged
		    if (this.owner == app) {
			this.connect(document, "keydown", this, "keydown");
		    }*/
		} catch(e) {
		  console.error("Failed to initialize page " + this.name + "; " + e);
		}

	},
	start: function() {
	},
	reflow: function() {
		wm.fire(this.root, "reflow");
	},
	addComponent: function(inComponent) {
		this[inComponent.name] = inComponent;
		if (inComponent instanceof wm.Widget) {
			// FIXME: hack to resolve clickability problem on IE at design-time
			// nodes must have some background or content to receive mouse events
			// on IE.
			if (this._designer && dojo.isIE) {
				var s = inComponent.domNode && dojo.getComputedStyle(inComponent.domNode);
				if (s && s.backgroundImage=="none"){
					inComponent.domNode.style.backgroundImage = "url(images/blank.gif)";
				}
			}
		/*}else{
			this.inherited(arguments);
		*/
		}
		this.inherited(arguments);
	},
	removeComponent: function(inComponent) {
		delete this[inComponent.name];
		this.inherited(arguments);
	},
	// design support
	isDesignLoaded: function() {
	    //return Boolean(this._designer);
            return this.name == "wip";
	},
	getRoot: function() {
		return this;
	},
	getId: function(inName) {
		return inName;
	},
	getRuntimeId: function(inId) {
		inId = this.name + (inId ? "." + inId : "");
		return this.owner ? this.owner.getRuntimeId(inId) : inId;
	},
	getComponent: function(inName) {
		return this.components[inName] || this[inName] || this.owner && this.owner.getComponent(inName);
	},
	_create: function(ctor, props) {
		if (ctor.prototype instanceof dijit._Widget && window.dijit){
			return new wm.DijitWrapper(dojo.mixin(props||{}, { dijitClass: ctor, publishClass: p.declaredClass }));
		}
		return this.inherited(arguments);
	},
	loadComponent: function(inName, inParent, inType, inProps, inEvents, inChildren, isSecond) {
		// Some code for debugging performance; normally skipped
		if (wm.debugPerformance) {
			if (inType == "wm.Layout") {
				if (dojo.isFF)
					console.groupCollapsed("LOAD COMPONENT " + inType + ": " + inName);
				else
					console.group("LOAD COMPONENT " + inType + ": " + inName);
			}

		    this.startTimerWithName("LoadComponent", inType);
		    this.startTimerWithName("LoadPage", inType);
		}

		var ctor = wm.getObject(inType);
		if (!ctor)
		{
			try
			{
				wm.getComponentStructure(inType);
				ctor = dojo.getObject(inType);
			}
			catch (e)
			{
				console.info('Error : Page.js trying to get component dynamically-------------> ' + e);
			}

			if (!ctor) 
			{
				console.debug('Component type "' + inType + '" is not available.');
				ctor = wm.Box;
			}
		}
		

		// FIXME: this check really needs to go
		// yuk
		var props = {};
		isWidget = (ctor.prototype instanceof wm.Widget || ctor.prototype instanceof dijit._Widget);
		if (isWidget){
			var parentNode = (inParent ? inParent.containerNode || inParent.domNode : this.domNode);
			props = {
				owner: this,
				parent: inParent,
				domNode: parentNode ? null : document.body,
				parentNode: parentNode
			};
		}
	    
        // props.name should overwrite getUniqueName(inName), which should overwrite inProps.
            var newOwner;
            if (inParent && inParent instanceof wm.Layout)
                newOwner = inParent.owner;
            else if (inParent)
                newOwner = inParent;
            else
                newOwner = this;
        props = dojo.mixin({}, inProps, {
			name: this.getUniqueName(inName),
	                owner: newOwner,
			_designer: this._designer,
			_loading: true
		}, props);


		if (this.isRelativePositioned && inType == "wm.Layout"){ 
			props.isRelativePositioned = true;	
		}

	    // All custom methods should be page methods; page methods have not been evaled, so 
	    // can not be defined nor invoked at design time
	    if (!this.isDesignLoaded()) {
		for (var p in props) {
		    if (p.indexOf("custom") == 0 && dojo.isFunction(ctor.prototype[p])) {
			var owner = props.owner;
			props[p] = dojo.hitch(owner, owner[props[p]]);
		    }
		}
	    }



		// Calls Component.create, which calls prepare, build, init and postInit
		var c = this._create(ctor, props);


		// FIXME: this initialization should be in Component
		// to remove the distinction between 'loading' and 'creating'
			if (!inParent && isWidget) {
				c.moveable = false;
				this.root = c;
			}

			this.makeEvents(inEvents, c);
			//if (!(c instanceof wm.Layer) || !c.deferLoading)

			if (inChildren)
				this.loadComponents(inChildren, c);

			c.loaded(); // Component.loaded calls postInit 

	                var timeToLoad = this.stopTimerWithName("LoadComponent", inType);
	        if (wm.debugPerformance) {
		  if (inType == "wm.Layout") {
		    console.log(inType + ": " + inName + " TOOK "+ timeToLoad + " ms");
		    console.groupEnd();
		    this.printPagePerformanceData();
		    console.log(inType + ": " + inName + " TOOK "+ timeToLoad + " ms");
		  }
 		}

		return c;
	},
	printPagePerformanceData: function() {
	  var totalsByMethod = {};
			    
			    for (var componentType in wm.Component.timingByComponent) {
			      var obj = wm.Component.timingByComponent[componentType];

			      var display = false;
			      for (var i in obj) {
				if (wm.sum(obj[i]) > 10) display = true;
			      }
			      //if (!display) continue;
			      console.group("Timing for " + componentType);
			      for (var i in obj) {
				console.log(i + ": Total: " + wm.sum(obj[i]) + ", Average: " + wm.average(obj[i]) + ", Worst: " + wm.max(obj[i]) + ", Instances: " + obj[i].length);
				if (!totalsByMethod[i]) totalsByMethod[i] = 0;
				totalsByMethod[i] += wm.sum(obj[i]);
			      }
			      console.groupEnd();
			    }
			    for (var i in totalsByMethod) {
			      console.log("TOTAL TIME IN " + i + ": " + totalsByMethod[i]);
			    }

	},

	loadComponents: function(inChildren, inParent) {
		for (var i in inChildren) {
			try 
			{
			 this.loadComponent(i, inParent, inChildren[i][0], inChildren[i][1], inChildren[i][2], inChildren[i][3]);
			} catch(e) {
			  console.error("FAILED TO LOAD " + "[" + inChildren[i][1].name + "] " + i + ": ", e);
			  console.log("COMPONENT:");console.log(inChildren);
			  console.log("PARENT:");console.log(inParent);
			}
		}
	},
	onShow: function() {
	},
	onStart: function(inPage) {		
	},
	keydown: function(e) {
	    // if there are any modal dialogs showing, do not handle keypress, as
	    // that would allow the user to interact with the page which is deliberately
	    // blocked
	    for (var i = 0; i < wm.dialog.showingList.length; i++) {
		if (wm.dialog.showingList.modal) return;
	    }

	    // only the application's main page should be receiving keyboard events
	      if (this.owner != app || this != app._page) return true;

	    var isInput = (e.target.tagName == "INPUT");
	    var chr = app._keys[e.keyCode];
            var isSpecial = chr.length > 1;

            if (e.keyCode == dojo.keys.ESCAPE)
		this.onEscapeKey();

	    else if (e.shiftKey) {
                // we get a keyCode for the shiftKey being pressed which we should ignore; and a second keycode when a key is hit while shiftKey is held
		if (e.keyCode != dojo.keys.SHIFT && !isInput) 
		    this.onShiftKey(chr);
	    } else if (e.ctrlKey) {
		if (e.keyCode != dojo.keys.CTRL)
		    this.onCtrlKey(chr);
	    } else if (e.keyCode == dojo.keys.ENTER && !isInput)
		this.onEnterKey();
            else if (!isInput && e.keyCode) {
                if (isSpecial)
		    this.onMiscKey(chr);
                else
                    this.onLetterKey(chr);
            }

	},
        onEnterKey: function() {},
        onShiftKey: function(inCharacter) {},
        onCtrlKey: function(inCharacter) {},
        onEscapeKey: function() {},

        onLetterKey: function(inCharacter) {},
        onMiscKey: function(inCharacter) {},
	// bc only: load page css and html
	/*loadCssHtml: function() {
		var path = wm.pagesFolder + this.declaredClass + "/" + this.declaredClass;
		var hasCssLoader, hasHtmlLoader;
		for (var i in this.$) {
			if (this.$[i] instanceof wm.CssLoader)
				hasCssLoader = true;
			if (this.$[i] instanceof wm.HtmlLoader)
				hasHtmlLoader = true;
		}
		if (!hasCssLoader)
			this.loadComponent("cssLoader", null, "wm.CssLoader", {owner: this, url: path + ".css"});
		if (!hasHtmlLoader)
			this.loadComponent("htmlLoader", null, "wm.HtmlLoader", {owner: this, url: path + ".html"});
	},*/
	_end: 0
});

wm.Page.extend({
	designCreate: function() {
		this.inherited(arguments);
		this.app = this.isDesignLoaded() ? studio.application : app;
	},
	// FIXME: unload support for parts that are specifically loaded into our development environment
	// this is so that they do not conflict with user named parts with the same names.
	// the "_isWaveMakerStudio" flag is set in studio and is specifically to detect if we're in the real studio.
	unloadSupport: function() {
		if (!this.isDesignLoaded() && window.studio && window.studio._isWaveMakerStudio) {
			this.constructor._supported = false;
			this.constructor.widgets = {};
		}
	},
	generateEventName: function(inEventName) {
	    return inEventName;
	},
	_getProp: function(n) {
	    if (window["studio"] && this == studio.page && this.isEventProp(n))
		return (getEvent(n,studio.getScript())) ? n : "";
	    return this.inherited(arguments);
	}
});

wm.Object.extendSchema(wm.Page, {
    onStart: {events: ["js", "disableNoEvent"]},
    onShow: {events: ["js", "disableNoEvent"]},
    onShiftKey: {events: ["js", "disableNoEvent"]},
    onCtrlKey: {events: ["js", "disableNoEvent"]},
    onEscapeKey: {}, // allow all events
    onEnterKey: {}, // allow all events
    onLetterKey: {events: ["js", "disableNoEvent"]},
    onMiscKey: {events: ["js", "disableNoEvent"]}
});

// bc
wm.Part = wm.Page
