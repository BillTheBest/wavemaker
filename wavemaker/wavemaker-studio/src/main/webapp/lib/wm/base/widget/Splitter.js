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

dojo.provide("wm.base.widget.Splitter");
dojo.require("wm.base.widget.Bevel");
dojo.require("wm.base.drag.drag");

/**
	@class
	@name wm.SplitterResize
	@inherits wm.MouseDrag
*/
dojo.declare("wm.SplitterResize", wm.MouseDrag, {
	beginResize: function(e, inSplitter) {
		this.splitter = inSplitter;
		this.setCursor(this.splitter.vertical ? "w-resize" : "n-resize");
		this.mousedown(e);
	},
	drag: function() {
		this.inherited(arguments);
		this.splitter.drag(this.dx, this.dy);
	},
	finish: function() {
		this.inherited(arguments);
		this.splitter.drop();
	}
});

dojo.declare("wm.Splitter", wm.Bevel, {
	className: "wmsplitter",
	minimum: -1,
	maximum: -1,
	mode: dojo.isMoz < 4 || dojo.isIE < 9 ? 2 : 0,
	layout: "",
	constructor: function() {
		wm.Splitter.resizer = wm.Splitter.resizer || new wm.SplitterResize();
	},
	init: function() {
		this.inherited(arguments);
	        this.splitterWidget = this.parentIsSplitter ? this.parent : this;
		this.findLayout();
		this.connectEvents(this.domNode, ["mousedown", "dblclick"]);
	},
	/*
	// FIXME: unify canSize and getSizeNode
	canSize: function(n, next) {
		while (n=n[next]) {
			if (n.style && !n.style.visibility && !n.style.display)
				return !(n.flex > 0);
		}
		return false;
	},
	*/
	findLayout: function() {
	    var v = this.splitterWidget.parent.layoutKind == "left-to-right";
	    var p = this.splitterWidget.parent.prevSibling(this.splitterWidget,true);
	    if (p) {
		var l = v ? (p.width == "100%" ? "right" : "left") : (p.height == "100%" ? "bottom" : "top");
		this.setLayout(l);
	    }
	},
	updateSize: function() {
	    if (this._isDestroying) return;
	    var widget = this.parentIsSplitter ? this.parent : this;
	    var h = (widget.parent||0).layoutKind == "left-to-right", d = this.bevelSize + "px";
	    this.setWidth(h ? d : "100%");
	    this.setHeight(h ? "100%" : d);
	},

	setLayout: function(inLayout) {
		this.layout = inLayout;
		this.removeOrientation();
		this.vertical = this.layout == "left" || this.layout == "right";
		this.addOrientation();
		this.updateSize();
	},
	getSizeControl: function() {
	    var widget = this.splitterWidget;
		//if (!this.layout) 
			//this.findLayout();
		switch (this.layout) {
			case "left":
			case "top":		    
		                this.percentSizeControl = widget.parent.nextSibling(widget,true);
		                return widget.parent.prevSibling(widget,true);
				/*var node = this.domNode.previousSibling;
				while (node && node.nodeType != 1)
					node = node.previousSibling;
				break;*/
			case "right":
			case "bottom":
		                this.percentSizeControl = widget.parent.prevSibling(widget,true);
		                return widget.parent.nextSibling(widget, true);
				/*var node = this.domNode.nextSibling;
				while (node && node.nodeType != 1)
					node = node.nextSibling;
				break;*/
		}
		//return node;
	},
	getPosition: function() {
		//return { top: this.domNode.offsetTop, left: this.domNode.offsetLeft };
		return { top: this.splitterWidget.bounds.t, left: this.splitterWidget.bounds.l };
	},
	mousedown: function(e) {
		this.sizeControl = this.getSizeControl();
		if (!this.sizeControl)
			return;
		//this.size = dojo._getMarginBox(this.sizeNode);
		//this.containerSize = dojo._getContentBox(this.sizeNode.parentNode);
		this.size = this.sizeControl.cloneBounds();
		this.containerSize = this.sizeControl.parent.cloneBounds();
		this.initialPosition = this.getPosition();
		this.position = this.getPosition();
		wm.Splitter.resizer.beginResize(e, this);
	},
	drag: function(inDx, inDy) {
		if (this.vertical)
			this.moveX(inDx);
		else
			this.moveY(inDy);
		this.changing();
	},
	drop: function() {
		this.change();
	},
	// events
	changing: function() { 
		this._collapsed = false;
		switch(this.mode) {
			case 0:
				// slowest, best feedback
				this.adjustSize();
				break;
			/*case 1:
				// slower, partial feedback
				this.adjustSize();
				with (wm.layout.box) {
					recurse = false;
					this.reflowParent();
					recurse = true;
				}
				wm.job(this.id+"reflow", 5, dojo.hitch(this, "reflowParent"));
				break;*/
			default:
				// fastest, minimal feedback (do nothing)
				break;
		}
	},
	change: function() {
		this.adjustSize();
	},
	boundValue: function(inValue) {
	    var widget = this.splitterWidget;
		var x = inValue;
		if (this.minimum != -1)
			inValue = Math.max(this.minimum, inValue);
		if (this.maximum != -1)
			inValue = Math.min(this.maximum, inValue);

	    switch(this.layout) {
	    case "top":
		var min = this.sizeControl.getMinHeightProp();
		var max = widget.parent.bounds.h - this.percentSizeControl.getMinHeightProp() - widget.bounds.h;
		break;
	    case "bottom":
		var min = this.percentSizeControl.getMinHeightProp();
		var max = widget.parent.bounds.h - this.sizeControl.getMinHeightProp() - widget.bounds.h;
		break;
	    case "left":
		var min = this.sizeControl.getMinWidthProp();
		var max = widget.parent.bounds.w - this.percentSizeControl.getMinWidthProp() - widget.bounds.w;
		break;
	    case "right":
		var min = this.percentSizeControl.getMinWidthProp();
		var max = widget.parent.bounds.w - this.sizeControl.getMinWidthProp() - widget.bounds.w;
		break;
	    }
	    if (inValue < min)
		inValue = min;
	    else if (inValue > max)
		inValue = max;

	    this.atLimit = (x != inValue);
	    return inValue;
	},
	adjustSize: function() {
	    var dx = this.position.left - this.initialPosition.left;
	    var dy = this.position.top - this.initialPosition.top;
	    var w = this.size.w + (this.layout=="right" ? -dx : dx);
	    var h = this.size.h + (this.layout=="bottom" ? -dy : dy);
	    //console.log(w, h, dx, dy);
	    //dojo._setMarginBox(this.sizeNode, NaN, NaN, w, h);
	    if (this.layout == "top" || this.layout == "bottom")
		this.sizeControl.setHeight(h + "px");
	    else
		this.sizeControl.setWidth(w + "px");
	},
	move: function(inD, inOrd, inExtent) {
		if (inD == 0)
			return;
		this.position[inOrd] = this.initialPosition[inOrd] + inD;
		if (this.layout==inOrd)
			this.position[inOrd] = this.boundValue(this.position[inOrd]);
		else {
			var e = this.containerSize[inExtent];
			this.position[inOrd] = e - this.boundValue(e - this.position[inOrd]);
		}
	        this.splitterWidget.domNode.style[inOrd] = this.position[inOrd] + "px";
	},
	moveX: function(inDx) {
		this.move(inDx, "left", "w");
	},
	moveY: function(inDy) {
		this.move(inDy, "top", "h");
	},
	dblclick: function() {
			if (this._collapsed)
				this.expand();
			else
				this.collapse();
	},
	collapse: function() {
		this._collapsed = true;
		this.initialPosition = this.getPosition();
		this._expandedPosition = dojo.mixin({}, this.initialPosition);
		switch (this.layout) {
			case "left":
				this.position.left = 0;
				break;
			case "top":
				this.position.top = 0;
				break;
			case "right":
				this.position.left = this.boundValue(this.position.left + this.size.w);
				break;
			case "bottom":
				this.position.top = this.boundValue(this.position.top + this.size.h);
				break;
		}
		this.change();
	},
	expand: function() {
		this._collapsed = false;
		this.initialPosition = this.getPosition();
		dojo.mixin(this.position, this._expandedPosition);
		this.change();
	}
});
