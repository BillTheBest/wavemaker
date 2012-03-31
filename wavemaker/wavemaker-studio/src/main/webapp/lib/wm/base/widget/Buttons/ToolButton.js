/*
 *  Copyright (C) 2011 VMware, Inc. All rights reserved.
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


dojo.provide("wm.base.widget.Buttons.ToolButton");
dojo.require("wm.base.Control");

dojo.declare("wm.ToolButton", wm.Control, {
        enableTouchHeight: true,
        mobileHeight: "40px", 
	width: "80px", 
	border: 0,
	padding: "",
	margin: "",
	caption: "",
	classNames: "wmtoolbutton",
	iconUrl: "",        
	iconWidth: "16px",
	iconHeight: "16px",
	iconMargin: "0 10px 0 0",
        clicked: false,
	//alignInParent: "topLeft",
	build: function() {
		if (!this.domNode)
		{

			this.domNode = document.createElement('button');
			// in IE8, type becomes submit and then acts weired everywhere.
			// therefore setting type to 'button'.
			dojo.attr(this.domNode, 'type', 'button'); 
		}	
		this.btnNode = this.domNode;
	},

	    /* Sometimes users go from an editor to clicking a button and some browsers don't update the editor value in time for
	     * our onclick handler to see it.  So build in a delay before firing onclick handlers.
	     */

	init: function() {
	    this.inherited(arguments);
	    if (!wm.isMobile) {
		/* IE 8 loses the event after our setTimeout; to access data about the event, we have to copy it and pass on the copy.
		 * Users should not see this pseudoevent and most definitely should not try to call stopEvent on this event
		 * You can change this behavior if your not supporing IE 8 by removing the setTimeout.
		 * Be sure to test for timing issues when going from editting/focus on an editor to clicking on a save button;
		 * Timing issue: focus leaves editor; editor validates; save button's disabled state is updated based on validation; did click happen before or after button's state was updated?
		 */
		this.connect(this.btnNode, "onclick", this, function(evt) {
		    this.click(evt,true);
		});
	    } else if (wm.isFakeMobile) {
		this.connect(this.btnNode, "onmousedown", this, "touchStart");
		this.connect(this.btnNode, "onmousemove", this, "touchMove");
		this.connect(this.btnNode, "onmouseup", this, "touchEnd");
	    } else {
		this.connect(this.btnNode, "ontouchstart", this, "touchStart");
		this.connect(this.btnNode, "ontouchmove", this, "touchMove");
		this.connect(this.btnNode, "ontouchend", this, "touchEnd");
	    }

	    //this.setHint(this.title || this.hint);
	    this.imageListChanged();

	},
    touchStart: function(inEvent) {
	if (!this._cachedBorder) {
	    this._cachedBorder = this.border;
	    this._touchTarget = inEvent.target;
	    this.setBorder("3");
	    wm.job(this.getRuntimeId() + "." + ".touch", app.touchToClickDelay, dojo.hitch(this, "touchEnd"));
	}	
    },
    touchMove: function(inEvent) {
	if (this._cachedBorder) {
	    wm.cancelJob(this.getRuntimeId() + "." + ".touch");
	    this.setBorder(this._cachedBorder);
	    delete this._cachedBorder;
	    delete this._touchTarget;
	}
    },
    touchEnd: function(evt) {
	wm.cancelJob(this.getRuntimeId() + "." + ".touch");
	if (this._cachedBorder) {
	    this.setBorder(this._cachedBorder);
	    if (!evt) {
		evt = {target: this._touchTarget};
	    } else if (!evt.target) {
		evt.target = this._touchTarget;
	    }
	    delete this._cachedBorder;
	    delete this._touchTarget;
	    this.click(evt, false);
	}
    },    
    click: function(inEvent, useDelay) {
	if (!this.disabled) {
	    if (!this.clicked) {
		this.setProp("clicked", true);
	    }
	    if (!useDelay) {
		this.onclick(inEvent,this);
	    } else {
		var pseudoEvt = inEvent ? {clientX: inEvent.clientX,
					   clientY: inEvent.clientY,
					   offsetX: inEvent.offsetX,
					   offsetY: inEvent.offsetY,
					   screenX: inEvent.screenX,
					   screenY: inEvent.screenY,
					   pageX: inEvent.pageX,
					   pageY: inEvent.pageY,
					   x: inEvent.x,
					   y: inEvent.y,
					   target: inEvent.target,
					   currentTarget: inEvent.currentTarget,
					   "type": inEvent.type} : {};
		wm.onidle(this, function() {
		    if (!this._isDestroyed) {
			this.onclick(pseudoEvt, this);
		    }
		});
	    }

	    if (app.toolTipDialog && this == app.toolTipDialog.tipOwner) {
		app.toolTipDialog.hide();
	    }
	}
	},
        onclick: function() {
	},
	setDisabled: function(inDisabled) {
	    var wasdisabled = this._disabled;
	    this.inherited(arguments);
	    var disabled = this._disabled;
	    if (Boolean(wasdisabled) != Boolean(disabled) || this._cupdating) {
		this.btnNode.disabled = disabled ? "disabled" : "";
		dojo[disabled ? "addClass" : "removeClass"](this.domNode, "wmbutton-disabled");

		/* Used to always call render, which destroys and recreates the button. Unfortunately,
		 * it had an annoying tendency to do this while the user is trying to click on it, which often
		 * means the user's click fails.  Example: I go from an editor to a button.  Editor's onchange is bound to this button's
		 * disabled state.  Call to setDisabled rerendered the button while I click on it. Click fails. */
		if (this._imageList && parseInt(this.imageIndex) != NaN && this.imageIndex != -1 && this.declaredClass == "wm.ToolButton") 
		    this.updateImageListButtonHtml();
	    }
	},
	setSelected: function(inSelected) {
	    this.selected = inSelected;
	    if (this._imageList && this.imageIndex && this.declaredClass == "wm.ToolButton") {
		this.updateImageListButtonHtml();
	    }
	},
	setCaption: function(inCaption) {
		this.caption = inCaption;	    
	        if (!this._cupdating) {
	            this.invalidCss = true;
		    this.render(true,true);
		}
	    this.valueChanged("caption", this.caption);
	},
	setIconUrl: function(inUrl) {
	    var root = "";
	    if (inUrl) {
		if (inUrl.slice(0, 4) == "http" || inUrl.slice(0, 1) == "/") {
		    root = "";
		} else if (inUrl.indexOf("lib/") == 0) {
		    root = dojo.moduleUrl("lib").path.replace(/lib\/$/, "");
		} else {
		    root = this.getPath();
		}
	    }

	    this.iconUrl = root + inUrl;
	    this.invalidCss = true;
	    this.render(true,true);
	},
	setIconWidth: function(w) {
	        this.iconWidth = w;
	        this.invalidCss = true;
	    this.render(true,true);
	},
	setIconHeight: function(h) {
	        this.iconHeight = h;
	        this.invalidCss = true;
	    this.render(true,true);
	},
	setIconMargin: function(m) {
	        this.iconMargin = m;
	        this.invalidCss = true;
	    this.render(true,true);
	},
	setContent: function(inContent) { // BC
		this.setCaption(inContent);
	},
/*
	setHint: function(inHint) {
		this.btnNode.title = this.hint = inHint;
	},
	*/
	imageListChanged: function() {
	    this.inherited(arguments);
	    this.invalidCss = true;
	    this.render(true,true);
	},
    getCurrentImageIndex: function() {
	if (this.declaredClass != "wm.ToolButton") {
	    return this.inherited(arguments);
	} else {
	if (this.disabled)
	    return this.imageIndex + this._imageList.colCount * 2;
	if (this.selected)
	    return this.imageIndex + this._imageList.colCount;
	}
	return this.imageIndex;
    },

    updateImageListButtonHtml: function() {
	var sl = this.singleLine ? "line-height: " + this.height + "; " : "";
	var captionHtml = this.caption ? '<span style="padding-left: 2px; ' + sl +'">' + this.caption + '</span>' : "";
	var ii = this.getCurrentImageIndex();
	this.btnNode.innerHTML = this._imageList.getImageHtml(ii) + captionHtml;
    },
    render: function(forceRender, noInherited) {
	    if (!forceRender && (!this.invalidCss || !this.isReflowEnabled())) return;
            if (!noInherited)
	        this.inherited(arguments);
	    var il = this._imageList;
		if (il && il.getImageHtml && this.imageIndex >= 0) {
		    this.btnNode.style.padding = "0px";
		    this.updateImageListButtonHtml();
		} else if (this.iconUrl) {
                    var url = this.iconUrl;
                    var root;
	            if (url.indexOf("lib/") == 0) {
		      root = dojo.moduleUrl("lib").path.replace(/lib\/$/, "");
                        url = root + url;
                    } else {
			 root =  this.getPath() || "";
                    }
			var sl = this.singleLine ? "line-height: " + this.height + "; " : "";
			var captionHtml = this.caption ? '<span style="padding-left: 2px; ' + sl +'">' + this.caption + '</span>' : "";


			this.btnNode.innerHTML = "<img src='" + wm.theme.getImagesPath() + "blank.gif' style='margin: " + this.iconMargin + "; width: " + this.iconWidth + "; height: " + this.iconHeight + "; vertical-align: middle; background:url(" + root + url + ") no-repeat; background-color: transparent;' />" + captionHtml;

			this.btnNode.style.padding = "0px";
		} else {
			this.btnNode.innerHTML = this.caption;
			this.btnNode.style.padding = "";
		}
    },
    renderBounds: function() {
        this.inherited(arguments);
        if (dojo.isIE && dojo.isIE < 9 && this.btnNode && this.btnNode.firstChild && this.btnNode.firstChild.tagName) {
            this.btnNode.firstChild.style.padding = "1px";
	    wm.job(this.getRuntimeId() + ".IEButtonTrick", 5, dojo.hitch(this, function() {
                this.btnNode.firstChild.style.padding = "0px";
            }));
        }
    },


	destroy: function(){
		if (this.btnNode)
		{
			dojo.destroy(this.btnNode);
			this.btnNode = null;
		}

		if (this.domNode)
		{
			dojo.destroy(this.domNode);
			this.domNode = null;
		}

		this.inherited(arguments);
	}
});
