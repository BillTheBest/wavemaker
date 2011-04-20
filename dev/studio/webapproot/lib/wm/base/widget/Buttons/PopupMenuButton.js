/*
 *  Copyright (C) 2011 WaveMaker Software, Inc.
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

dojo.provide("wm.base.widget.Buttons.PopupMenuButton");
dojo.require("wm.base.widget.Buttons.Button");


dojo.declare("wm.PopupMenuButton", wm.Button, {
    width: "120px",
    rememberWithCookie: true,
    classNames: "wmbutton wmPopupButton",
    fullStructureStr: "",
    iconClass: "", // alternative to iconUrl which allows for the icon to be loaded the same way as the icons in the menu itself

    afterPaletteDrop: function() {
	this.inherited(arguments);
	this.setFullStructureStr(studio.getDictionaryItem("wm.PopupMenu.DEFAULT_STRUCTURE"));
    },

    onclick:function() {},
    onchange: function(inLabel,inIconClass,inEvent) {}, // fired when the user changes the button's caption (reselects also fires)
    onchangeNoInit: function(inLabel,inIconClass,inEvent) {}, // fired when the user changes the button's caption (reselects also fires)
    postInit: function() {
	this.dojoMenu = new wm.PopupMenu({name:"dojoMenu", 
					  classNames: "wmpopupmenu wmpopupbuttonmenu",
					  owner: this});

	try {
	    if (this.rememberWithCookie && !this.isDesignLoaded()) {
		var obj = dojo.cookie(this.getRuntimeId());
		if (obj) obj = dojo.fromJson(obj);
		if (obj && typeof obj == "object") {
		    this.caption = obj.caption;
		    this.iconClass = obj.iconClass;
		    this.iconWidth = obj.iconWidth;
		    this.iconHeight = obj.iconHeight;
		    this.onchange(obj.caption, obj.iconClass);
		}
	    }
	} catch(e) {

	}
 /*
			     this.caption = obj.label;
			     var img = dojo.query( ".dijitIcon." + obj.label, this.dojoMenu.dojoObj.domNode)[0];
			     if (img) {
				 var computed = dojo.getComputedStyle(img);
				 var url = computed.backgroundImage;
				 url = url.substring(4, url.length-1);
				 var width = computed.width;
				 var height = computed.height;
			     }
			     this.iconUrl = url;
			     this.width = width;
			     this.height = height;
			     this.render(true);
			     */
	if (this.fullStructureStr)
	    this.setFullStructureStr(this.fullStructureStr);
	else if (this.fullStructure)
	    this.setFullStructure(this.fullStructure);

	this.connect(this.dojoMenu, "onclick", this, "menuChange");
	this.inherited(arguments);	
    },
    menuChange: function(inLabel, inIconClass, inEvent) {
	this.caption = inLabel;
	this.iconClass = inIconClass;
	if (inIconClass) {
	    var img = dojo.query(".dijitIcon." + inIconClass, this.dojoMenu.dojoObj.domNode)[0];
	    if (img) {
		var computed = dojo.getComputedStyle(img);
		var width = computed.width;
		var height = computed.height;
		this.iconWidth = width;
		this.iconHeight = height;
	    } else {
		this.iconUrl = "";
		this.iconWidth = "0px";
		this.iconHeight  = "0px";
	    }
	}
	    this.render(true);
	this.onchange(inLabel,inIconClass,inEvent);
	this.onchangeNoInit(inLabel,inIconClass,inEvent);
	if (this.rememberWithCookie) {
	    dojo.cookie(this.getRuntimeId(), dojo.toJson({caption: this.caption, 
					      iconClass: this.iconClass,
					      iconWidth: this.iconWidth,
							  iconHeight: this.iconHeight}));
	}
    },
/*
    updateButtonFromMenu: function(domNode) {
	while (domNode.tagName.toLowerCase() != "tr")
	    domNode = domNode.parentNode;
	this.caption = dojo.query(".dijitMenuItemLabel",domNode)[0].innerHTML;
	var img = dojo.query( ".dijitMenuItemIcon", domNode)[0];
	if (img) {
	    var computed = dojo.getComputedStyle(img);
	    var url = computed.backgroundImage;
	    url = url.substring(4, url.length-1);
	    var width = computed.width;
	    var height = computed.height;
	    this.iconWidth = width;
	    this.iconHeight = height;
	    this.iconUrl = url;
	} else {
	    this.iconWidth = "0px";
	    this.iconHeight = "0px";
	    this.iconUrl = "";
	}


	this.render(true);
    },
    */
    build: function() {
	this.inherited(arguments);
	var html = "<table class='dijitMenuTable' style='width:100%'><tbody class='dijitReset'><tr class='dijitMenuItem dijitReset'><td class='dijitReset dijitMenuItemIconCell' style='width:"+(parseInt(this.iconWidth)+4) + "px;'><div style='width:"+this.iconWidth + ";height:"+this.iconHeight+";'/></td><td class='dijitReset dijitMenuItemLabel'>"+this.caption + "</td><td class='dijitReset dijitMenuArrow'><div class='popupIcon'/></td></tr></tbody></table>";
	this.domNode.innerHTML = html;
/*
	var div = dojo.query(".popupIcon", this.domNode)[0];
	    this.connect(div, "onclick", this, function(e) {
		if (this.disabled) return;
		dojo.stopEvent(e);
		this.dojoMenu.update(e, this, true);
	    });
	    */
    },
    click: function(inEvent) {
	if (this.disabled) return;
	var coords = dojo.coords(dojo.query(".popupIcon", this.domNode)[0]);
	var popupX = coords.x-2;
	if (inEvent.pageX >= popupX) {
	    this.dojoMenu.update(inEvent, this, true);
	} else {	    
	    this.onclick(inEvent, this);
	    if (!this.clicked) 
		this.setProp("clicked", true);
	}
    },


    // TODO: I want code that will change how we render a button and its icon if there is an icon... 
    render: function(forceRender) {
	if (!forceRender && (!this.invalidCss || !this.isReflowEnabled())) return;
	wm.Control.prototype.render.call(this, forceRender);
	dojo.query(".dijitMenuItemLabel",this.domNode)[0].innerHTML = this.caption;
	var img = dojo.query(".dijitMenuItemIconCell div",this.domNode)[0];
	img.className = this.iconClass;
	img.style.width = this.iconWidth;
	img.style.height = this.iconHeight;

	var width = parseInt(this.iconWidth) || 0;
	img.parentNode.style.width = (width+4) + "px";
/*
	var height = parseInt(this.iconHeight) || 0;
	img.parentNode.style.height = (height+4) + "px";
	*/
    },
    setIconClass: function(inClass) {
	this.iconClass = inClass;
	if (this.isReflowEnabled()) 
	    this.render(true);
    },

    set_caption: function(inCaption) {
	for (var i = 0; i < this.dojoMenu.fullStructure.length; i++) {
	    if (!inCaption || inCaption == this.dojoMenu.fullStructure[i].label) {
		this.setIconClass(this.dojoMenu.fullStructure[i].iconClass);
		return this.setCaption(inCaption);
	    }
	}
    },

    editMenuItems: "(Edit Menu Items)",
    makePropEdit: function(inName, inValue, inDefault) {
	switch (inName) {
	case "editMenuItems":
	    return makeReadonlyButtonEdit(inName, inValue, inDefault);
	case "caption":
	    var list = [];
	    dojo.forEach(this.dojoMenu.fullStructure, function(struct) {
		list.push(struct.label);
	    });
	    return makeSelectPropEdit("caption", this.caption, list, list[0]);
	}
	return this.inherited(arguments);
    },
    setPropEdit: function(inName) {
	switch (inName) {
	case "caption":
	    var editor = dijit.byId("studio_propinspect_caption");
	    var store = editor.store.root;
	    while (store.firstChild) store.removeChild(store.firstChild);
	    dojo.forEach(this.dojoMenu.fullStructure, function(struct) {
		var node = document.createElement("option");
		node.innerHTML = struct.label;
		store.appendChild(node);
	    });
	    return true;
	}
	return this.inherited(arguments);
    },
	editProp: function(inName, inValue, inInspector) {
		switch (inName) {
		case "editMenuItems":
		    if (!studio.menuDesignerDialog) {
			studio.menuDesignerDialog = new wm.PageDialog({pageName: "MenuDesigner", 
								       name: "MenuDesignerDialog",
								       title: studio.getDictionaryItem("wm.PopupMenuButton.MENU_DESIGNER_TITLE"),
								       hideControls: true,
								       owner: studio,
								       width: "250px",
								       height: "350px"});
		    }
		    studio.menuDesignerDialog.page.setMenu(this,{content: this.caption,
								 iconClass: this.iconClass},true);
		    studio.menuDesignerDialog.show();
		}
	},
    setFullStructureStr: function(inStr, inSetByDesigner) {
	this.fullStructureStr = inStr;
	this.dojoMenu.setFullStructureStr(inStr);
	this.dojoMenu.renderDojoObj();

	if (!this.caption)
	    this.set_caption();
	if (inSetByDesigner && this.isDesignLoaded())
	    studio.inspector.reinspect();
    },
    // used by users who hand edit their own widgets.js files; used by studio.widgets.js
    setFullStructure: function(inObj) {
	if (this._isDesignLoaded)
	    this.fullStructureStr = dojo.toJson(inObj);
	this.dojoMenu.setFullStructure(inObj);
	this.dojoMenu.renderDojoObj();
    },
/*
    setDefaultItem: function(inData) {
	if (!inData) {
	    this.caption = this.dojoMenu.fullStructure[0].label;
	    this.iconClass = this.dojoMenu.fullStructure[0].iconClass;
	} else {
	    this.caption = inData.content;
	    this.iconClass = inData.iconClass;
	}
	this.render(true);
    },
    */
    /* when we're ready to have every menu item appear in our events list, uncomment this; but
       you'll still have to write some code so that when the user selects an event it gets handled
       properly 
    listProperties: function(){
	var props = this.inherited(arguments);
	for (evt in props)
	{
	    if (props[evt].isMenuItem)
		delete props[evt];
	}
	this.dojoMenu.addNodesToPropList(this.dojoMenu.fullStructure, props);
	return props;
    },
    */
    _end: 0
});
