/*
 *  Copyright (C) 2008-2012 VMware, Inc. All rights reserved.
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

dojo.provide("wm.base.widget.Layers");
dojo.require("wm.base.widget.Container");
dojo.require("wm.base.widget.Layers.Decorator");
dojo.require("wm.base.widget.Layers.TabsDecorator");
dojo.require("wm.base.widget.Layers.AccordionDecorator");

dojo.declare("wm.Layer", wm.Container, {
    height: "100%",
	width: "100%",
	caption: "",
	layoutKind: "top-to-bottom",
        closable: false,
        destroyable: false,
        showDirtyFlag: false,
    //_requiredParent: "wm.Layers",
	destroy: function() {
		//console.info('layer destroy called');
	    this._isLayerDestroying = true;
	    var parent = this.parent;
	    if (parent && parent instanceof wm.Layer) 
		parent.setCaptionMapLayer(this.caption, null);	    
	    this.inherited(arguments);
	    if (parent && parent.conditionalTabButtons && !parent.decorator.tabsControl.isDestroyed)
		parent.decorator.tabsControl.setShowing(parent.getVisibleLayerCount() > 1);
	},
	init: function() {

		this.inherited(arguments);
		// bc
		if (this.title) {
			this.caption = this.title;
			delete this.title;
		}
		this.setCaption(this.caption);
		
		if (!this.isRelativePositioned)
			dojo.addClass(this.domNode, "wmlayer");
	},


    setParent: function(inParent) {
	this.inherited(arguments);
	if (this.parent) {
            this.setBorder(this.parent.clientBorder);
            this.setBorderColor(this.parent.clientBorderColor);
	}
    },

	// FIXME: override so that we do not remove and re-add layer
	// this is nasty but avoids dealing with layer order changing
	setName: function(inName) {
		if (this.parent)
			delete this.parent.widgets[this.name];
		this.addRemoveDefaultCssClass(false);
		wm.Component.prototype.setName.apply(this, arguments);
		if (this.parent)
			this.parent.widgets[this.name] = this;
		this.addRemoveDefaultCssClass(true);
	},
	activate: function() {
	    var p = this.parent;
	    if ((this.showing || wm.BreadcrumbLayers && this.parent instanceof wm.BreadcrumbLayers) && !this.isActive()) {
		if (!this.showing) this.show();
		p.setLayer(this);
	    }
	},
	activateAllParents: function() {
	    var p = this.parent;
	    p.setLayer(this);
	    var ancestor = this.parent.isAncestorInstanceOf(wm.Layer);
	    if (ancestor) {
		ancestor.activateAllParents();
	    } else {
		ancestor = this.parent.isAncestorInstanceOf(wm.Dialog);
		if (ancestor) {
		    ancestor.show();
		}
	    }
	},
    /* Called when the layer is the event handler */
        update: function() {
	    this.activate();
	},
	isActive: function() {
		return this.active;
	},
	setShowing: function(inShowing) {
		if (!this.canChangeShowing())
			return;
	        var p = this.parent;
		if (this.showing != inShowing) {
		    this.showing = inShowing;
		    this.decorator.setLayerShowing(this, inShowing);
		    if (!inShowing && p.layerIndex == this.getIndex()) {
			p.setNext();
		    }
		}
	    if (p && p.conditionalTabButtons && !p.decorator.tabsControl.isDestroyed)
		p.decorator.tabsControl.setShowing(p.getVisibleLayerCount() > 1);
	},
        show: function() {
	    this.setShowing(true);
	},
        hide: function() {
	    this.setShowing(false);
	},
	setCaption: function(inCaption) {
	    this.caption = inCaption;
	    if (this.parent) {
		this.parent.setCaptionMapLayer(inCaption, this);
	    }
	    if (this.decorator)
		this.decorator.applyLayerCaption(this);
	},
        setIsDirty: function(inDirty) {
	    if (this.isDirty != inDirty) {
		this.isDirty = inDirty;
		if (this.showDirtyFlag) {
		    var caption = this.caption;
		    caption = caption.replace(/^\<span class="DirtyTab"\>\*\<\/span\>\s*/, "");
		    if (inDirty)
			caption = '<span class="DirtyTab">*</span> ' + caption;
		    this.setCaption(caption);
		}
	    }
	},
	getIndex: function() {
		var p = this.parent;
		return p && p.indexOfLayer(this);
	},
	// fired by Layers
	onShow: function() {
	    this.callOnShowParent();
	},
    // called onDeactivate rather than onHide as its not meant to indicate when its no longer visible; only when its no
    // longer the active Layer in its parent
        onDeactivate: function() {

	},
        onCloseOrDestroy: function() {},
        customCloseOrDestroy: function() {},
    /* Only valid for layers within a TabLayers */
       setClosable: function(isClosable) {
	   this.closable = isClosable;
	   this.decorator.applyLayerCaption(this);
       },
       setDestroyable: function(isClosable) {
	   this.destroyable = isClosable;
	   this.decorator.applyLayerCaption(this);
       },
    handleBack: function(inOptions) {
	if (this.active)
	    return false;

	this.activate();
	return true;
    },/*
    restoreFromLocationHash: function(inValue) {
	this.activate();
    },
    generateStateUrl: function(stateObj) {
	if (this.active && !this._mobileFoldingGenerated) {
	    var index = this.getIndex();
	    if (index == this.parent.defaultLayer || index === 0 && this.parent.defaultLayer === -1) return; 
 	    stateObj[this.getRuntimeId()] = 1;
	}
    },*/
    onTabDrop: function() {}
});

dojo.declare("wm.Layers", wm.Container, {    
        manageHistory: true,
        manageURL: false,
        isMobileFoldingParent: false,
        transition: "none",
        clientBorder: "",
        clientBorderColor: "",
	layerIndex: -1,
	defaultLayer: -1,
	decoratorClass: wm.LayersDecorator,
	layersType: 'Layers',
	layoutKind: "top-to-bottom",
	height: "100%",
	width: "100%",
	destroy: function() {
		//console.info('LAYERS destroy called');
		this.inherited(arguments);
		if (this.decorator) 
		{
			this.decorator.destroy();
			this.decorator = null;
		}
		
		this.layers = null;
		this.captionMap = null;
		this.client = null;
	},
	prepare: function() {
	    this.layers = [];
	    this.captionMap =[];
	    this.inherited(arguments);

	    // needs to happen before build generates the tabsControl or other affected widget
	    var isMobile = wm.isMobile || this._isDesignLoaded && studio.currentDeviceType != "desktop";
	    if (!isMobile) {
		if (this.desktopHeaderHeight != null) {
		    this.headerHeight = this.desktopHeaderHeight;
		} else if (this.headerHeight) {
		    this.desktopHeaderHeight = this.headerHeight;
		}
	    } else {
		if (this.mobileHeaderHeight) {
		    this.headerHeight = this.mobileHeaderHeight;
		} 
	    }
	},
	build: function() {
		this.inherited(arguments);
		this.setLayersType(this.layersType);
	},
	init: function() {


	    this.userDefHeaderHeight = this.headerHeight;
	    if (!this.isRelativePositioned)
		dojo.addClass(this.domNode, "wmlayers");
	    else
		this.setHeaderHeight('20px');
            // vertical defaults to justified; once we get rid of justified, we can remove this property
	    this.client = new wm.Panel({isRelativePositioned:this.isRelativePositioned, 
					border: "0", 
					margin: "0",
					padding: "0",
					name: "client", 
					parent: this, 
					owner: this, 
					height: "100%", 
					width: "100%", 
					verticalAlign: "top",
					horizontalAlign: "left",
					flags: {notInspectable: true, bindInspectable: true}}); // bindInspectable means the user can see it as a container to open in the bind inspector 
	    this.inherited(arguments);
            this._isDesign = this.isDesignLoaded();
	    if (this._isDesign) {
		this.flags.noModelDrop = true;
	    }

	    
	},
	postInit: function() {
		this.inherited(arguments);
/*
		if (!this.getCount() && this._isDesignLoaded)
			this.addLayer();
			*/
		this._initDefaultLayer();
		// fire onshow when loaded
		if (wm.widgetIsShowing(this))
			this._fireLayerOnShow();
	    if (this.manageURL && this.owner.locationState) {		
		this.restoreFromLocationHash(this.owner.locationState[this.getRuntimeId()]);
	    }
	},
/*
	getPreferredFitToContentHeight: function() {
	    return this.padBorderMargin.t + this.padBorderMargin.b + this.getActiveLayer().getPreferredFitToContentHeight();
	},
	getPreferredFitToContentWidth: function() {
	    return  this.padBorderMargin.l +  this.padBorderMargin.r + this.getActiveLayer().getPreferredFitToContentWidth();
	},
	*/

	_initDefaultLayer: function() {
		var d = this.defaultLayer;
		d = d != -1 ? d : 0;
		var dl = this.getLayer(d);
		// call private index setter so we avoid canShow; however, honor showing property
		if (dl && !dl.showing) {
			d = this._getNextShownIndex(d);
			dl = this.getLayer(d);
		}
		if (dl)
			this._setLayerIndex(dl.getIndex());
	},
    getVisibleLayerCount: function() {
	var count = 0;
	for (var i = 0; i < this.layers.length; i++) {
	    if (this.layers[i].showing) {
		count++;
	    }
	}
	return count;
    },
	createLayer: function(inCaption) {
	    var caption = inCaption;
	    if (!caption) {
		caption = this.owner.getUniqueName("layer1");
	    }
	    var name = caption;
	    if (name)
		name = name.replace(/\s/g,"_");
		var
	    defName = this.owner.getUniqueName(name);
	    props = {width: "100%", height: "100%", caption: caption, parent: this, horizontalAlign: "left", verticalAlign: "top", themeStyleType: this.themeStyleType, border: this.clientBorder, borderColor: this.clientBorderColor},
			o = this.getRoot();
		if (o)
			return o.createComponent(defName, "wm.Layer", props);
	},
    addPageContainerLayer: function(inPageName, inCaption, activate) {
	var layer = this.getLayerByCaption(inCaption);
	if (layer) {
	    if (activate || activate === undefined) layer.activate();
	    return layer;
	}
	layer = this.createLayer(inCaption);
	new wm.PageContainer({owner: this.owner,
			      parent: layer,
			      name: this.owner.getUniqueName(layer.name + "PageContainer"),
			      width: "100%",
			      height: "100%",
			      pageName: inPageName,
			      deferLoad: false});
	if (activate || activate === undefined)
	    layer.activate();

	if (this.conditionalTabButtons) {
	    this.decorator.tabsControl.setShowing(this.getVisibleLayerCount() > 1);
	}

	return layer;
    },

        themeStyleType: "",
        setThemeStyleType: function(inMajor) {
	    this.themeStyleType = inMajor;
            for (var i = 0; i < this.layers.length; i++) {
	        this.layers[i].setThemeStyleType(inMajor);
            }
	},

        setClientBorder: function(inBorder) {
            this.clientBorder = inBorder;
	    // in design mode, set_border updates the design borders
	    var method = this.isDesignLoaded() ? "set_border" : "setBorder";
            for (var i = 0; i < this.layers.length; i++) {
		this.layers[i][method](inBorder);
	    }
        },
        setClientBorderColor: function(inBorderColor) {
            this.clientBorderColor = inBorderColor;
            for (var i = 0; i < this.layers.length; i++)
                this.layers[i].setBorderColor(inBorderColor);
        },    
	// public api for adding a layer
    addLayer: function(inCaption, doNotSelect) {
	var pg = this.createLayer(inCaption);
	if (!doNotSelect) {
	    this._setLayerIndex(this.getCount()-1);
	} else {
	    pg.active = false;
	}
	return pg;
    },
	// called by owner automatically.
	addWidget: function(inWidget) {
		if (inWidget instanceof wm.Layer) {
			this.client.addWidget(inWidget);
			this.layers.push(inWidget);
			this.setCaptionMapLayer(inWidget.caption, inWidget);
			if (this.decorator) {
				this.decorator.decorateLayer(inWidget, this.getCount()-1);
				// de-activate layer by default
				this.decorator.setLayerActive(inWidget, false);
			}
		} else {
			this.inherited(arguments);
		}
	},
	removeWidget: function(inWidget) {
		if (inWidget instanceof wm.Layer) {
		    var isActive = inWidget.isActive();
			var i = this.indexOfLayer(inWidget);
			this.layers.splice(i, 1);
			this.setCaptionMapLayer(inWidget.caption, null);
			this.decorator.undecorateLayer(inWidget, i);
			this.client.removeWidget(inWidget);
		    /*
		    var found = false;
		    for (j = 0; j < this.layers.length; j++) {
			if (this.layers[j].active) {
			    this.layerIndex = j;
			    found = true;
			}
		    }
		    if (!found)
			this.setLayerIndex(this.layers.length == 0 ? -1 : (i > 0 ? i - 1 : 0));
			*/
		    if (isActive && !this._isDestroying && this.layers.length) {
			    if (this.layers.length > i) {
			       this.layerIndex = -1;
			       this.setLayerIndex(i);
		    	} else {
		    	    this.setLayerIndex(i-1);
		    	}
		    } else if (!this._isDestroying && i <= this.layerIndex) {
                this.layerIndex--;
		    }
		} else {
			this.inherited(arguments);
		}
	},
	addControl: function(inControl) {
		if (inControl.owner == this) {
			this.inherited(arguments);
		} else if (inControl instanceof wm.Layer) {
			this.client.addControl(inControl);
		}
	},
	removeControl: function(inControl) {
		if (inControl.owner == this) {
			this.inherited(arguments);
		} else if (inControl instanceof wm.Layer) {
			this.client.removeControl(inControl);
		}
	},
	isWidgetTypeAllowed: function(inChildType) {
		return inChildType == "wm.Layer";
	},
	getLayer: function(inIndex) {
		return this.layers[inIndex != undefined ? inIndex : this.layerIndex];
	},
	getActiveLayer: function() {
	  if (this.layerIndex != -1) return this.layers[this.layerIndex];
	  var defaultIndex = (this.defaultLayer == -1) ? 0 : this.defaultLayer;
	  return this.layers[defaultIndex];
	},
	// public api for removing a layer
	removeLayer: function(inIndex) {
		if (!this.layers)
			return;
		var p = this.getLayer(inIndex);
		if (p)
			this.removeWidget(p);
	},
	indexOfLayer: function(inLayer) {
		for (var i=0, l; (l=this.getLayer(i)); i++)
			if (l == inLayer)
				return i;
		return -1;
	},
	indexOfLayerName: function(inLayerName) {
		for (var i=0, l; (l=this.getLayer(i)); i++)
			if (l.name == inLayerName)
				return i;
		return -1;
	},
	indexOfLayerCaption: function(inCaption) {
		return this.indexOfLayer(this.captionMap[inCaption]);
	},
	getLayerCaption: function(inIndex) {
		var p = this.getLayer(inIndex);
		return p && p.caption;
	},
	getLayerByCaption: function(inCaption) {
		return this.getLayer(this.indexOfLayerCaption(inCaption));
	},
	setLayerByCaption: function(inCaption) {
		var p = this.captionMap[inCaption];
	    this.setLayerByName(p && p.name ? p.name : inCaption);
	},
	setLayerByName: function(inName) {
		var l = this.client.widgets[inName];
		if (l)
			this.setLayer(l);
		else if (inName)
			this.addLayer(inName);
	},
	setLayer: function(inNameOrLayer) {
		if (inNameOrLayer instanceof wm.Layer)
			// note: use setProp so we can call design version
			this.setProp("layerIndex", inNameOrLayer.getIndex());
		else
			this.setLayerByName(inNameOrLayer);
	},
	setLayerInactive: function(inLayer) {
		wm.fire(inLayer.decorator, "deactivateLayer", [inLayer]);
	        inLayer.onDeactivate();
	},
	setLayerIndex: function (inIndex) {
	    if (inIndex == this.layerIndex) return;
	    var fireEvents = !this.loading;
	    var oldLayer = this.layers[this.layerIndex];
	    var l = this.getLayer(inIndex);
	    if (fireEvents) {
	        var info = {
	            newIndex: inIndex,
	            canChange: undefined
	        };
	        this.oncanchange(info);
	        if (info.canChange === false) return;
	        inIndex = info.newIndex;
	    }
	    if (inIndex < 0 || inIndex > this.getCount() - 1) return;

	    if (fireEvents && oldLayer) {
		oldLayer.callOnHideParent();
	    }
	    this._setLayerIndex(inIndex);
	    if (fireEvents) {
	        l && l.onShow();
	        oldLayer && oldLayer.onDeactivate();
	    }
	    if (fireEvents && this.lastLayerIndex != this.layerIndex) this.onchange(this.layerIndex);
	    if (!this._initialization && oldLayer &&  !this._isDesignLoaded && this.manageHistory) {
		app.addHistory({id: oldLayer.getRuntimeId(),
			       options: {},
				title: "Show " + l.caption});
	    }
	},
	_setLayerIndex: function(inIndex) {
	    this.lastLayerIndex = this.layerIndex;
	    this.layerIndex = inIndex;
	    var l = this.getLayer(inIndex);
	    if (l) {
		this.decorator.activateLayer(l);
		var page = this.getParentPage();
		if (page && page.validateVisibleOnly) {
		    this.validate();
		}
	    }
	},
	setDecoratorClass: function(inClass) {
		this.decoratorClass = inClass;
		this.createDecorator();
	},
	createDecorator: function() {
		if (this.decorator)
			this.decorator.destroy();
		this.decorator = this.decoratorClass ? new this.decoratorClass(this) : null;
	},
	setLayersType: function(inLayersType) {
		var ctor = wm[inLayersType + 'Decorator'];
		if (!ctor)
			return;
		this.layersType = inLayersType;
		var i = this.layerIndex;
	    if (this.decorator) {
		this.decorator.undecorate();
		this.decorator.destroy();
		this.decorator = null;
	    }
		this.setDecoratorClass(ctor);
		this.decorator.decorate();
		this._setLayerIndex(i);
		this.reflow();
	},
	setDefaultLayer: function(inLayerIndex) {
		this.defaultLayer = inLayerIndex;
	},
	getCount: function() {
		return this.layers.length;
	},
	setCaptionMapLayer: function(inCaption, inLayer) {
		try
		{
			this.captionMap[inCaption] = inLayer;
		}
		catch(e)
		{
			// do nothing as this might happen when we are trying to destroy all the layers.
		}
	},
    _getNextShownIndex: function(inIndex, isSecondCall) {
	var count = this.layers.length;
	for (var i = inIndex + 1; i < count && !this.layers[i].showing; i++) ;
	if (this.layers[i] && this.layers[i].showing) return i;
	if (!isSecondCall)
	    return this._getPrevShownIndex(inIndex,true);
	return 0;
    },
    _getPrevShownIndex: function(inIndex, isSecondCall) {
	for (var i = inIndex - 1; i >= 0 && !this.layers[i].showing; i--) ;
	if (this.layers[i] && this.layers[i].showing) return i;
	if (!isSecondCall)
	    return this._getNextShownIndex(inIndex,true);
	return 0;
    },
/*
	_getPrevNextShownIndex: function(inIndex, inPrev, inBounded) {
		var
			d = inPrev ? -1 : 1,
			c = this.getCount(),
			e = inPrev ? 0 : c-1,
			w = inPrev ? c-1 : 0,
			i = inPrev ? Math.min(inIndex+d, w) : Math.max(inIndex+d, 0),
			l;
		while (i != inIndex) {
			l = this.getLayer(i);
			if (l && l.showing)
				return i;
			if (inPrev ? i > e : i < e)
				i = i + d;
			else {
				if (inBounded)
					return;
				else
					i = w;
			}
		}
	},
	*/
	setNext: function(inBounded) {
		var p = this._getNextShownIndex(Number(this.layerIndex), false);
		if (p !== undefined)
			this.setLayerIndex(p);
	},
	setPrevious: function(inBounded) {
		var p = this._getPrevShownIndex(Number(this.layerIndex), false);
		if (p !== undefined)
			this.setLayerIndex(p);
	},
    moveLayerIndex: function(inLayer, inIndex) {
		var i = inLayer.getIndex(), inIndex = Math.max(0, Math.min(inIndex, this.getCount()-1));
		if (i == inIndex)
			return;
		// fixup layers array
		this.layers.splice(i, 1);
		this.layers.splice(inIndex, 0, inLayer);
		// decorate
		this.decorator.moveLayerIndex(i, inIndex);
		// change layer
	        if (inLayer.active) {
		    this._setLayerIndex(inIndex);
		} else {
		    for (var i = 0; i < this.layers.length; i++) {
			if (this.layers[i].active) {
			    this.layerIndex = i;
			    break;
			}
		    }
		}
	},
	_fireLayerOnShow: function() {
		var l = this.getLayer(this.layerIndex);
		l && l.onShow();
	},
	_onShowParent: function() {
		this._fireLayerOnShow();
	},
	clear: function() {
		wm.forEach(this.widgets, function(w) {
			w.destroy();
		});
		this.widgets = {};
		this.layers = [];
		this.domNode.innerHTML = "";
	},
	// events
	oncanchange: function(inChangeInfo) {
	    var l = this.getLayer(inChangeInfo.newIndex);
	    inChangeInfo.canChange =  (l && l.showing);
	},
	onchange: function(inIndex) {
	},
	// used only by Tabs
	headerHeight: "27px",
        mobileHeaderHeight: "37px",
	setHeaderHeight: function(inHeight) {
	    if (this.layersType != 'Tabs' && this.layersType != "RoundedTabs" && this.layersType != "Wizard" && this.layersType != "Breadcrumb")
			return;
		this.headerHeight = inHeight;
		this.decorator && this.decorator.tabsControl && this.decorator.tabsControl.setHeight(inHeight);

		delete this._lastTabHeight;
		this.renderBounds();

	},
        renderBounds: function() {
	    this.inherited(arguments);
	    if (this.layersType != 'Tabs' && this.layersType != "RoundedTabs")
		return;
	    if (!this.decorator || !this.decorator.tabsControl)
		return;
	    if (this.decorator.tabsControl.isDestroyed)
		return;

	    wm.job(this.getRuntimeId() + ".renderBounds", 10, this, function() {
	    this.decorator.tabsControl.domNode.style.height = 'auto';
	    var newheight = Math.max(this.decorator.tabsControl.domNode.clientHeight, parseInt(this.headerHeight));
	    if (this._isDesignLoaded) console.log("HEIGHT: " + newheight);
	    if (newheight != this.decorator.tabsControl.bounds.h) {
		this.decorator.tabsControl.setHeight(newheight + "px");
	    } else {
		this.decorator.tabsControl.domNode.style.height = this.headerHeight;
	    }
	    });
	},
        getMinHeightProp: function() {
            if (this.minHeight) return this.minHeight;
            var minHeight = 80;
            if (this.layersType.match(/tabs/i)) minHeight += parseInt(this.headerHeight);
            return minHeight;
        },
        getMinWidthProp: function() {
            if (this.minWidth) return this.minWidth;
            var minWidth = 80;
            if (this.layersType.match(/tabs/i)) minWidth += 120; // need horiz space for tabs
            return minWidth;
        },
    restoreFromLocationHash: function(inValue) {
	var value = inValue;
	if (value !== undefined) {
	    var w = this.manageHistory;
	    this.manageHistory = false;
	    var index = Number(inValue);
	    this.setLayerIndex(inValue);
	    this.manageHistory = w;
	}
    },
    generateStateUrl: function(stateObj) {
	if (!this._isDesignLoaded && this.getActiveLayer()) {
	    var defaultIndex = this.defaultLayer == -1 ? 0 : this.defaultLayer;
	    var index = this.layerIndex;
	    if (index != defaultIndex && !this.getActiveLayer()._mobileFoldingGenerated) {
		stateObj[this.getRuntimeId()] = this.layerIndex;
	    }
	}
    }
});


dojo.declare("wm.TabLayers", wm.Layers, {
       dndTargetName: "",
        //useDesignBorder: 0,
       themeStyleType: "ContentPanel",
       layersType: 'Tabs',
       conditionalTabButtons: false,
       verticalButtons: false,
        headerWidth: "50px",
/*
        setHeaderHeight: function(inHeight) {
	    this.headerHeight = inHeight;
	    this.c$[0].setHeight(inHeight);
	},
	*/
    addLayer: function(inCaption, doNotSelect) {
	    var result = this.inherited(arguments);
	    if (!this._cupdating && !this.owner._loadingPage)
		this.renderBounds();
	    if (this.conditionalTabButtons)
		this.decorator.tabsControl.setShowing(this.getVisibleLayerCount() > 1);
	    return result;
	},
	removeLayer: function(inIndex) {
	    this.inherited(arguments);
	    if (this.conditionalTabButtons && !this.isDestroyed)
		this.decorator.tabsControl.setShowing(this.getVisibleLayerCount() > 1);
	},
    // onClose handles both destroy and close as long as it came from clicking the close icon in the tab button
    onCloseOrDestroy: function(inLayer) {

    },
    customCloseOrDestroy: function(inLayer) {

    },
    onTabDrop: function() {},
    onTabRemoved: function() {}
/*,
	   afterPaletteDrop: function(){
	   	this.inherited(arguments);
	   	this.setLayersType("RoundedTabs");
	   }		*/
});



dojo.declare("wm.BreadcrumbLayers", wm.Layers, {
    conditionalTabButtons: true,
    themeStyleType: "ContentPanel",
    layersType: 'Breadcrumb',
    transition: "fade",
    headerWidth: "50px",
    layerBorder: 1,
    postInit: function() {
	this.inherited(arguments);
	this._inBreadcrumbPostInit = true;
	var active = this.getActiveLayer();
	if (!this._isDesignLoaded) {
	    for (var i= 0; i < this.layers.length; i++) {
		if (this.layers[i] != active) {
		    this.layers[i].setShowing(false);
		}
	    }
	}
	delete this._inBreadcrumbPostInit ;
    },
    oncanchange: function(inChangeInfo) {
	var l = this.getLayer(inChangeInfo.newIndex);
	inChangeInfo.canChange = l;
    },
    addWidget: function(inWidget) {
	this.inherited(arguments);	
	if (!this._isDesignLoaded && !this._loading && inWidget instanceof wm.Layer && !inWidget.isActive()) {
	    inWidget.setShowing(false);
	}
    },
    _setLayerIndex: function(inIndex) {
	var l = this.layers[inIndex];
	if (l) l.setShowing(true);
	this.inherited(arguments);
    }
});


