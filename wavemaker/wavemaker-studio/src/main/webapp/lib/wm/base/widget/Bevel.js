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

dojo.provide("wm.base.widget.Bevel");
dojo.require("wm.base.Control");

dojo.declare("wm.Bevel", wm.Widget, {
	className: "wmbevel",
	flex: 0,
        bevelSize: 4,
	init: function() {
		this.inherited(arguments);
	},
	getOrientedStyleName: function() {
		return this.className + " " + this.className + (this.vertical ? "-h" : "-v");
	},
	addOrientation: function() {
		dojo.addClass(this.domNode, this.getOrientedStyleName());
	},
	removeOrientation: function() {
		dojo.removeClass(this.domNode, this.getOrientedStyleName());
	},
	updateSize: function() {
		var h = (this.parent||0).layoutKind == "left-to-right", d = this.bevelSize + "px";
		this.setWidth(h ? d : "100%");
		this.setHeight(h ? "100%" : d);
	},
	setParent: function() {
		this.inherited(arguments);
		this.addOrientation();
		this.updateSize();
	},
    toHtml: function() {
	return "<hr/>";
    }
});
