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

dojo.provide("wm.base.widget.PageContainer");
dojo.require("wm.base.components.Page");
dojo.require("wm.base.widget.Panel");

wm.pagesFolder = "pages/";

dojo.declare("wm.PageContainer", wm.Box, {
    subpageProplist: null,
    subpageEventlist: null,
	width: "100%", 
	height: "100%",
	pageName: "",
	deferLoad: false,
	loadParentFirst: true,
	classNames: "wmpagecontainer",
	init: function() {
		this.pageLoadedList = [];
		this.inherited(arguments);
		this.createPageLoader();
		this.pageLoadedDeferred = new dojo.Deferred();
	        if (!this.deferLoad || !this.isAncestorHidden())
		  this.loadPage(this.pageName);
		//this._connections.push(dojo.connect(window, "onbeforeunload", this, "destroy"));
		dojo.addOnWindowUnload(this, 'destroy');

	    if (this.subpageEventlist) {
		for (var propName in this.subpageEventlist) {
		    if (this[propName] === undefined) {
			this[propName] = function(){};
		    }
		}
	    }
	},
        postInit: function() {
	    this.inherited(arguments);
	    if (this.isDesignedComponent() && this.designWrapper) {
		dojo.addClass(this.designWrapper.domNode, "pageContainerDesignWrapper");
                this.designWrapper.domNode.style.backgroundColor = "white";
                this.createOpenPageButton();
	    }
	    if (this.isDesignedComponent() && this.getRoot() instanceof wm.Application) {
		    this.subscribe("Page-Saved", dojo.hitch(this, function() {
			if (this.pageName == studio.project.pageName) {
			    this.forceReloadPage();
			}
		    }));
		}
	},
    setProp: function(inName, inValue) {
	if (this.subpageProplist !== null && this.page) {
	    var prop = this.subpageProplist[inName];
	    if (prop) {
		if (inValue instanceof wm.Component === false)
		    this[inName] = inValue;
		return this.page.setValue(prop, inValue);
	    }
	}
	return this.inherited(arguments);
    },
    getProp: function(inName) {
	if (this.subpageProplist !== null && this.page) {
	    var prop = this.subpageProplist[inName];
	    if (prop) {
		return this.page.getValue(prop);
	    }
	}
	return this.inherited(arguments);
    },
	    
        onError: function(inErrorOrMessage) {},
	createPageLoader: function() {
		this._pageLoader = new wm.PageLoader({owner: this, domNode: this.domNode, isRelativePositioned: this.isRelativePositioned});
		this._connections.push(this.connect(this._pageLoader, "onPageChanged", this, "pageChanged"));
		this._connections.push(this.connect(this._pageLoader, "onError", this, "onError"));
	},
	getMainPage: function() {
	  var owner = this.owner;
	  while(owner.owner) {
	    owner = owner.owner;
	  }
	  if (owner instanceof wm.Application)
	    return owner;
	},
	/* Not sure if this gets called */
	destroy: function() {
		if (this.isDestroyed)
			return;
	  var owner = this.getMainPage();
	  if (owner) owner.subPageUnloaded(this.page);	  
	  try {
		this.inherited(arguments);
	  } catch(e) {}
	  
	  if (this._pageLoader)
	  {
		this.destroyPreviousPage();
	  	this._pageLoader.destroy();
		this._pageLoader = null;
	  }
	  owner = null;	
	},
	destroyPreviousPage: function(){
	  	for (var i = 0; i < this.pageLoadedList.length; i++)
		{
			try
			{
		  		this._pageLoader.destroyPage(this.pageLoadedList[i]);
			}
			catch(e)
			{
				console.info('couldnt delete page <--------------');
			}
		}

		this.pageLoadedList = [];
	},
	pageChanged: function(inPage, inPreviousPage) {
		try
		{
			// establish page reference
			this.destroyPreviousPage();
			this.pageLoadedList.push(inPage);
			this.page = inPage;
			this[inPage.name] = inPage;
	
			var owner = this.getMainPage();
			if (owner) owner.subPageLoaded(this.page);	  
	
			// FIXME: parent required for layout
			if (this.page.root)
				this.page.root.parent = this;
			// change callback / event
			if (this.pageLoadedDeferred)
				this.pageLoadedDeferred.callback({page: inPage, previousPage: inPreviousPage});
			this.onPageChanged(inPage, inPreviousPage);
			// clean up previous page reference
			var o = (inPreviousPage || 0).name
			if (o && this[o])
				delete this[o];
		}
		catch(e)
		{
			console.info('error in pageChanged in pagecontainer.js ......', e);			
		}
	},
	loadPage: function(inName) {
	    try {
		var d = this.isDesignLoaded(), s = wm.studioConfig;
		if (d && s && s.preventSubPages)
			return;
		// bc: name with initial letter lowercase is required
		var pageName = inName.charAt(0).toLowerCase() + inName.slice(1);

	        // If the design is loaded, then page loading of the container is handled elsewhere.
		if (pageName) {
		    if (!d && this.loadParentFirst) {
			var parentPage =  this.getParentPage();
		    }
		    if (!d && this.loadParentFirst && parentPage && parentPage._loadingPage) {
			// Prevent this from being connected multiple times
			if (!this._pageLoaderConnectedToOwnerStart) {
				if (this._currentPageConnect)
					dojo.disconnect(this._currentPageConnect);
			    this._currentPageConnect = this.owner.connect(this.owner, "start", dojo.hitch(this, 'pageLoaderOnOwnerStart', inName, pageName));
			    this._pageLoaderConnectedToOwnerStart = true;
			}
		    } else {
                        this._pageLoader.loadPage(inName, pageName);
				if (this._currentPageConnect)
					dojo.disconnect(this._currentPageConnect);
                        if (this._pageLoader.page._startCalled)
                            this.onStart();
                        else
		            this._currentPageConnect = this._pageLoader.page.connect(this._pageLoader.page, "onStart", this, "onStart");
		    }
		} else {
			this.destroyPreviousPage();
		}
	    } catch(e) {
		console.error("PageContainer page  '" + inName + "' failed to load: " + e);
	    }
	},
	pageLoaderOnOwnerStart: function(inName, pageName) {
		this._pageLoaderConnectedToOwnerStart = false;
		this._pageLoader.loadPage(inName, pageName);
		this._pageLoader.page.connect(this._pageLoader.page, "onStart", this, "onStart");
    },
	onStart: function() {
	    if (this.parent && this.page && !dojo.coords(this.page.root.domNode).w) 
		this.parent.reflow();

	    if (this.subpageEventlist && this.page) {
		for (var propName in this.subpageEventlist) {
		    var propComponent = this.page[propName];
		    if (propComponent && propComponent.isEvent) {
			var componentName = propComponent.property.replace(/\..*?$/,"");
			var eventName =  propComponent.property.replace(/^.*\./,"");
			var component = this.page.getValue(componentName);
			this.connect(component, eventName, this, propName);
		    }
		}
	    }


	    if (this.subpageProplist) {
		for (var propName in this.subpageProplist) {
			this.setProp(propName, this[propName]);
		}
	    }
	},
	forEachWidget: function(inFunc) {
		if (this.page)
			return this.page.forEachWidget(inFunc);
	},
	setPageName: function(inPageName) {
		if (this._pageLoading)
			return;
	    if (this._isDesignLoaded && inPageName == studio.getDictionaryItem("wm.PageContainer.NEW_PAGE_OPTION")) {
	        return this.createNewPage();
	    }

	    if (this._designerOpenPageButton)
		dojo[this.pageName ? "addClass" : "removeClass"](this._designerOpenPageButton, "hasPageName");

		var o = this.pageName;
		this.pageName = inPageName || "";
	    if (this.isDesignedComponent() && this.designWrapper) {
                this.createOpenPageButton();
            }

	    this.pageLoadedDeferred = new dojo.Deferred();
            if (o != this.pageName)
		this.loadPage(this.pageName);
	    this.valueChanged("pageName", this.pageName);
	},

        // Provided for use in debugging. Note that when we do a better job of caching pages from server, we will need to deallocate them in this call
        forceReloadPage: function() {
            var pageName = this.pageName;
            this.setPageName(null);
            delete window[pageName];
            this.setPageName(pageName);
        },
	onPageChanged: function(inNewPage, inPreviousPage) {
	},
	// optimization: page created when shown if doesn't exist.
	_onShowParent: function() {
		this.revealed();
	},
	revealed: function() {
	    if (!this.page)
		this.loadPage(this.pageName);
	    else {
		this.page.onShow();
		this.page.root.callOnShowParent();
	    }
	},
	flow: function() {
		if (this._boundsDirty)
			wm.fire(this.page, "reflow");
	},
	reflow: function() {
		this._boundsDirty = true;
		this.flow();
	},
	hasPageLoaded: function(optionalPageName) {
	  if (!optionalPageName) return Boolean(this.page);
	  return Boolean(this.page && this.page.name == optionalPageName);
	},
    toHtml: function() {
	if (this.page && this.page.root)
	    return this.page.root.toHtml();
	else
	    return "";
    }
});

