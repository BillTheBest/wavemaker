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


dojo.provide("wm.base.widget.Editors.AbstractEditor");
dojo.require("wm.base.widget.Editors.dijit");
dojo.require("wm.base.widget.Formatters");

// check if a property is not undefined or not same as in the object prototype
wm.propertyIsChanged = function(inValue, inProp, inCtor) {
	var p = (inCtor||0).prototype;
	return p && p[inProp] !== inValue;
}

wm.defaultEmptyValue = function(inType){
	switch(inType){
		case 'Text': return '';
		case 'Number': return 0;
		
	}
}


wm.createFieldEditor = function(inParent, inFieldInfo, inProps, inEvents, inClass) {
	var props = dojo.mixin({}, wm.getFieldEditorProps(inFieldInfo), inProps);
	var name = wm.getValidJsName(props.name || "editor1");
	return inParent.owner.loadComponent(name, inParent, inClass ||"wm._TextEditor1", props, inEvents);
};



dojo.declare("wm.AbstractEditor", wm.Control, {
    changeKeycodes: [dojo.keys.ENTER, dojo.keys.NUMPAD_ENTER, dojo.keys.DELETE, dojo.keys.BACKSPACE],
    classNames: "wmeditor",

    /* Formating */
	formatter: '',
	height: "24px",
	width: "300px",
	padding: "2",
	border: "0",
	editorBorder: true,

    /* Editor */
        dataValue: null,
        displayValue: null,
	emptyValue: "unset",
	required: false,
	readonly: false,
        ignoreParentReadonly: false,
        editorNode: null,
        isDirty: false,
        _lastValue: "",
        _lastValueReported: "",

    /* Caption */
	caption: "",
        captionPosition: "left",
	captionSize: "100px",
        captionNode: null,
	captionAlign: "right",
	singleLine: true,

    /* Tips */
    helpText: "",

    /* Events */
        changeOnEnter: false,
        changeOnKey: false,
        _updating: 0,

    scrim: true,

	init: function() {
		this._editorConnects = [];
		this.inherited(arguments);
	},
	// If I name it getMinHeight, then it will be used to show the "minHeight" property in the designer; this func is meant to use EITHER a user supplied value OR a best calculation, and that calculation varies at runtime based on various factors, so we do NOT want to write this calculation as a property to widgets.js
	getMinHeightProp: function() {	
		if (this.minHeight) return this.minHeight;
		if (this.captionPosition == "left" || this.captionPosition == "right" || !this.caption) return 24;
		else if (this.captionSize.match(/\%/)) return 40;
		else return 24 + parseInt(this.captionSize);
	},
	getMinWidthProp: function() {
		if (this.minWidth) return this.minWidth;
		if (this.captionPosition == "top" || this.captionPosition == "bottom" || !this.caption) return 80;
		else if (this.captionSize.match(/\%/)) return 120;
		else return 80 + parseInt(this.captionSize);
	},
	createCaption: function() {		 
		var labeldiv = document.createElement("label");
		var s = labeldiv.style;
		s.padding = "0px";
		s.margin = "0px";

		dojo.addClass(labeldiv, "wmeditor-caption");
		dojo.addClass(labeldiv, "wmlabel");
		labeldiv.innerHTML = this.caption;
		this.domNode.appendChild(labeldiv);
		this.captionNode = labeldiv;
		this.setCaptionAlign(this.captionAlign);
		this.setSingleLine(this.singleLine);
	},
	postInit: function() {
	        this.createEditor();
		this.inherited(arguments);

		wm.fire(this, "ownerLoaded"); // TODO: Replace this with call in SelectEditor.postInit
		if (this.captionPosition != "left")
		  this.setCaptionPosition(this.captionPosition);
	    this._inPostInit = true;
	    this.displayValue = this.getDisplayValue();
	    this.dataValue = this.getDataValue();
	    this.valueChanged("displayValue", this.displayValue);
	    this.valueChanged("dataValue", this.dataValue);
	    //this.editorChanged();
	    delete this._inPostInit;
	},

	setCaption: function(inCaption) {
		var oldCap = this.caption;
		this.caption = inCaption;
	    if (!this.captionNode) return;
		var cap = inCaption + ((this.required && !this.readonly) ? '&nbsp;<span class="wmeditor-required">*</span>' : "");
		this.captionNode.innerHTML = cap;
		if (oldCap && !inCaption || !oldCap && inCaption) {
			dojo.style(this.captionNode, "display", (inCaption) ? "block" : "none");
			this.sizeEditor();
		}
	},
	setCaptionSize: function(inCaptionSize) {
	    this.captionSize = inCaptionSize;
	    this.sizeEditor();
	},
	setCaptionAlign: function(inCaptionAlign) {
		this.captionAlign = inCaptionAlign;
	        dojo.style(this.captionNode, "textAlign", this.captionAlign);
	},
    setCaptionPosition: function(pos) {
	var oldPos = this.captionPosition;
	this.captionPosition = pos;
	if ((oldPos == "left" || oldPos == "right") && (pos == "bottom" || pos == "top")) {
	    if (this.height.match(/px/) && parseInt(this.height) < 48)
		this.setHeight("48px");
	    this.captionSize = "28px";
	} else if ((pos == "left" || pos == "right") && (oldPos == "bottom" || oldPos == "top")) {
	    if (this.bounds.h >= 48) {
		this.setHeight(this.constructor.prototype.height);
	    }
	    if (this.captionSize.match(/px/) && parseInt(this.captionSize) < 100) {
		this.captionSize = "100px";
	    }
	}
	this.sizeEditor();
    },
    setCaptionPositionLF: function(inPosition) {
	var liveform = this.isAncestorInstanceOf(wm.LiveFormBase) || this.isAncestorInstanceOf(wm.FormPanel);
	if (liveform) {
	    this.setCaptionPosition(liveform.captionPosition);
	    this.setCaptionSize(liveform.captionSize);
	    this.setCaptionAlign(liveform.captionAlign);
	    if (this.constructor.prototype.height == wm.AbstractEditor.prototype.height)
		this.setHeight(liveform.editorHeight);  // don't set height for large text areas/richtext areas based on editorHeight.
	}
	this.sizeEditor();
    },
    setSingleLine: function(inSingleLine) {
	this.singleLine = inSingleLine;
	var s = this.captionNode.style;
	s.whiteSpace =  (inSingleLine) ? "nowrap" : "normal";
	s.overflow =  "hidden";	
	s.lineHeight = (this.singleLine) ? s.height : "normal";
	if (this.readOnlyNode)
		this.updateReadOnlyNodeStyle();
    },
	setDisabled: function(inDisabled) {
	    inDisabled = Boolean(inDisabled);
		var d = this.disabled;
		this.inherited(arguments);
	    if (this.editor) {
		if (this.editor instanceof wm.Control && d != this.editor.disabled) {
		    this.editor.setDisabled(inDisabled);
		    dojo[this.disabled ? "addClass" : "removeClass"](this.captionNode, "wmeditor-caption-disabled");
		} else if (d != this.disabled) {
		    this.editor.set("disabled", Boolean(inDisabled));
		    dojo[this.disabled ? "addClass" : "removeClass"](this.captionNode, "wmeditor-caption-disabled");
		}
		
	    }
	    this.disabled = inDisabled;
	},

	destroy: function() {
		this.destroyEditor();
		this.inherited(arguments);
	},
    createHelpNode: function() {
	this.helpNode = dojo.create("div", {className: "EditorHelpIcon"}, this.domNode);
	if (typeof this.helpText == "string") {
	    this._helpTextOverConnect =
		this.connect(this.helpNode, "onmouseover", this, function(e) {
		    wm.job(this.getRuntimeId() + ".helpText", 100, dojo.hitch(this, function() {
			var coords = dojo.coords(this.helpNode);
			//app.createToolTip(this.helpText, null, {mouseX: coords.x, mouseY: coords.y + coords.h});
			app.createToolTip(this.helpText, null, {mouseX: coords.x, mouseY: coords.y + coords.h});
		    }));
		});
	    this._helpTextOutConnect =
		this.connect(this.helpNode, "onmouseout", this, function() {
		    wm.job(this.getRuntimeId() + ".helpText", 100, dojo.hitch(this, function() {
			if (app.getToolTip() == this.helpText) // make sure tooltip isn't showing another editor's help text
			    app.hideToolTip();
		    }));

		});
	}
	this.connect(this.helpNode, "onclick", this, "onHelpClick");
    },
    onHelpClick: function() {},
    destroyHelpNode: function() {
	dojo.destroy(this.helpNode);
	wm.Array.removeElement(this._connections,this._helpTextOverConnect); 
	wm.Array.removeElement(this._connections,this._helpTextOutConnect); 
	dojo.disconnect(this._helpTextOverConnect);
	dojo.disconnect(this._helpTextOutConnect);

    },
    createEditor: function(inProps) {
		// Its possible for createEditor to be called before postInit where createCaption is called,
		// and we need it for styleEditor to work correctly.
		if (!this.captionNode) this.createCaption();
           	if (this.helpText && !this.helpNode) {
		    this.createHelpNode();
		}
		this.destroyEditor();
		var n = document.createElement('div');
		this.domNode.appendChild(n);
	    this.startTimerWithName("CreateDijit", this.declaredClass);
		this.editor = this._createEditor(n, inProps);
	        dojo.attr(this.captionNode, "for", this.editor.id);
/*
            if (this.editor._onChangeHandle) {
                window.clearTimeout(this.editor._onChangeHandle);
                this.editor._onChangeHandle = null;
            }
	    */
	/* this.editor.tagName is an IE safe way of doing this.editor instanceof Node */
	        this.editorNode = this.editor.tagName ? this.editor : this.editor.domNode;
		this.editorNode.style.margin = "0"; // failure to explicitly set these is throwing off my bounds calculations
	        this.editorNode.style.padding = "0";
    	    this.stopTimerWithName("CreateDijit", this.declaredClass);
		// If using html widgets and replacing them with dijits use  "if (this.editor && this.editor.declaredClass) "
		if (this.editor) {
			this.styleEditor();
			if (this.validationEnabled())
			  this.validatorNode = this._getValidatorNode();
			this.sizeEditor();
			this.connectEditor();
			this.setRequired(this.required);
			this.setInitialValue();

/*
            if (this.editor._onChangeHandle) {
                window.clearTimeout(this.editor._onChangeHandle);
                this.editor._onChangeHandle = null;
            }
	    */
			this.setReadonly(this.readonly);
		}

		if (this.editor.displayMessage) {
		    this.editor.displayMessage = dojo.hitch(this, function(message) {
				if (!this.showMessages)
					return;
				var o = dojo.getObject(this.editor.declaredClass);
				if (o)
					o.prototype.displayMessage.apply(this.editor, arguments);
		    });
		}
		return this.editor;
	},
	validationEnabled: function() { return true;},
	_createEditor: function(inNode, inProps) {
		return new dijit.form.TextBox(this.getEditorProps(inNode, inProps));
	},
	destroyEditor: function() {
		this.disconnectEditor();
		wm.fire(this.editor, "destroy");
		this.editor = null;
	},
	styleEditor: function() {
		if (this.isRelativePositioned){
			if (this.captionNode)
				dojo.addClass(this.captionNode, 'wmInlineDiv');
			return;
		}
	    dojo.style(this.editorNode, {position: "absolute"});
	    if (this.captionNode)
			dojo.style(this.captionNode, {position: "absolute"});
	},

	sizeEditor: function() {	     
		if (this._cupdating)
			return;
	        var e = (this.readonly) ? this.readOnlyNode : this.editor;
		if (e) {
		    var bounds = this.getContentBounds();
                    var position = this.captionPosition;
	            var captionEditorSpacing = (position == "left" || position == "right") ? wm.AbstractEditor.captionPaddingWidth : wm.AbstractEditor.captionPaddingHeight;
		    var w = bounds.w;
		    var h = bounds.h;
		    var labelWidth;
		    var editorWidth;
		    var height = bounds.h; //bounds.h ? bounds.h - ((bounds.h > 20) ? Math.floor(bounds.h * 0.1) : 2) : "";
		    var labelHeight;
		    var editorHeight;
		    var helpIconSize = 16;
		    var helpIconMargin = 4;
		    var allocateHelpIconSpace = Boolean(this.helpText);
		    if (!this.caption) {
			labelWidth = 0;
			editorWidth = w;
			editorHeight = h;
		    } else if (position == "left" || position == "right") {			
			var tmpWidth = (this.captionSize.match(/px/)) ? parseInt(this.captionSize) : Math.floor(parseInt(this.captionSize) * w/100);
			if (w - tmpWidth < (this.minEditorWidth || 16)) {
			    editorWidth = this.minEditorWidth || 16;
			    labelWidth = w - editorWidth - (this.helpText ? helpIconSize + helpIconMargin : 0);
			    allocateHelpIconSpace = false;
			} else {
			    labelWidth = tmpWidth;
			    editorWidth =  w - labelWidth;			
			}
//			if (labelWidth) editorWidth -=  18; // TODO: number 18 is a random number that worked out in FF, but needs testing elsewhere
			labelHeight = (height) ? height : "";
			editorHeight = labelHeight;			
		    } else {
			labelHeight = (this.captionSize.match(/px/)) ? parseInt(this.captionSize) : Math.floor(parseInt(this.captionSize) * height/100);
			if (labelHeight > height) {
			    labelHeight = height - 16;
			    if (this.captionSize.match(/px/)) this.captionSize = labelHeight + "px";
			}
			editorHeight =  (height - labelHeight);
			labelWidth = (w) ? w  : "";
			editorWidth = labelWidth;
			if (this.helpText)
			    labelWidth -= helpIconSize + helpIconMargin;
		    }

		    labelWidth = Math.round(labelWidth);
		    editorWidth = Math.round(editorWidth);
		    if (allocateHelpIconSpace) {
			if (this.captionPosition == "left" || !this.caption) {
			    editorWidth -= helpIconSize + helpIconMargin;
			} else {
			    labelWidth -= helpIconSize + helpIconMargin;
			}
		    }
                    if (this._editorPaddingLeft) editorWidth -= this._editorPaddingLeft;
                    if (this._editorPaddingRight) editorWidth -= this._editorPaddingRight;
		    var s = this.captionNode.style;
		    var labelWidthWithSpacing = (labelWidth - ((position == "right" || position == "left") ? captionEditorSpacing : 0));
		    labelWidthWithSpacing = (labelWidthWithSpacing) ? labelWidthWithSpacing : 0;
  		    if (labelWidthWithSpacing < 0) labelWidthWithSpacing = 0;		    
			s.width =  labelWidthWithSpacing + "px";
		    s.height = ((labelHeight && labelHeight > 0) ? labelHeight : 0) + "px";
		    
		     // if height changes, then lineHeight may have to change
		    s.lineHeight = (s.lineHeight != "normal") ? s.height : "normal";
		    var captionLeft = (position == "right") ? (bounds.w + bounds.l - labelWidthWithSpacing )  : bounds.l;
		    if (position == "right" && allocateHelpIconSpace) 
			captionLeft -= helpIconSize + helpIconMargin ;
		    s.left = captionLeft + "px";
		    s.top  = (position == "bottom") ? (editorHeight + bounds.t - captionEditorSpacing) + "px" : bounds.t + "px"; 

                    var b = {w: editorWidth , 
                             h: editorHeight,
                             l: ((position == "left" &&  labelWidth) ? labelWidth : 0) + bounds.l,
                             t: ((position == "top" && labelHeight) ? labelHeight : 0) + bounds.t};
/*
		    if (this instanceof wm.Checkbox) {
			b.w = "16";
			b.h = "16";
		    }
		    */
		
		    if (!b.w || b.w < 0) b.w = 0;
		    if (!b.h || b.h < 0) b.h = 0;

                    if (e instanceof wm.Control) {			
			var oldUpdatingValue = e._cupdating;
			e._cupdating = true; // make sure that we call render only once; setBorder should not call render.
			e.setBorder((this.editorBorder) ? "1" : "0");	  			 
                        e.setBounds(b);
			e._cupdating = oldUpdatingValue;
			if (e.invalidCss)
	                        e.render();
			else
				e.renderBounds();
			e.reflow();

                    } else {
			var setnode = (e["domNode"]) ? e.domNode : e;

			var s = setnode.style;

			if (this.editorBorder && b.w && b.h) {
			    s.borderWidth = "1px";
                            if (!this._editorBackgroundColor)
			        s.backgroundColor = "";
			    s.backgroundImage = "";
			    b.w -= 2;
			    b.h -= 2;
                            if (s.lineHeight != "normal")
                                s.lineHeight = (b.h) + "px"
			} else {
			    s.borderWidth = "0px";
                            if (!this._editorBackgroundColor)
			        s.backgroundColor = "transparent";
			    s.backgroundImage = "none";
                            if (s.lineHeight != "normal" && b.h)
                                s.lineHeight = b.h + "px"
			}
			s.width = b.w + "px";
			s.height= b.h + "px";
			s.left  = b.l + "px";
			s.top   = b.t + "px";			
/*
                        dojo.style(this.editorNode, {width:  b.w + "px",
                                                     height: b.h + "px",
                                                     left:   b.l + "px",
                                                     top:    b.t + "px"});
						     */
                    }
		    if (e == this.readOnlyNode)
			this.updateReadOnlyNodeStyle(b.h);

		}
	    this._editorHeight = b.h;
	    this._editorWidth = b.w;
	    if (this.helpText && this.helpNode) {
		var s = this.helpNode.style;
		s.top = (this.caption) ? (parseInt(this.captionNode.style.top) + (this.captionPosition == "bottom" ? 5 : 0)) + "px" : b.t + "px";
		s.left = (this.getContentBounds().w-16) + "px";
	    }
	},
        setHelpText: function(inText) {
	    var formerText = this.helpText;
	    this.helpText = inText;
	    if (inText && !this.helpNode) {
		this.createHelpNode();
		this.sizeEditor();
	    } else if (!inText && this.helpNode) {
		this.destroyHelpNode();
		this.sizeEditor();
	    } else if (inText && !formerText) {
		this.sizeEditor();
	    }
	},
        updateReadOnlyNodeStyle: function(h) {
	    var s = this.readOnlyNode.style;
	    var overflow = this.getReadOnlyNodeOverflow();
	    if (s.overflow != overflow) s.overflow = overflow;

	    var lineHeight = this.getReadOnlyNodeLineHeight();
	    if(s.lineHeight != lineHeight) s.lineHeight = (lineHeight == "normal") ? lineHeight : lineHeight + "px";

	    var whiteSpace = this.getReadOnlyNodeWhiteSpace();
	    if (s.whiteSpace != whiteSpace) s.whiteSpace = whiteSpace;

	    var wordWrap = this.getReadOnlyNodeWordWrap();
	    if (s.wordWrap != wordWrap) s.wordWrap = wordWrap;
	},
        getReadOnlyNodeLineHeight: function() {
	    if (this.singleLine)
		return parseInt(this.readOnlyNode.style.height) + ((this.editorBorder) ? 2 : 0);
	    else
		return "normal";
	},
        getReadOnlyNodeOverflow: function() {
		return "hidden";
	},
        getReadOnlyNodeWhiteSpace: function() {
		return "nowrap";
	},
        getReadOnlyNodeWordWrap: function() {
		return "normal";
	},
	renderBounds: function() {
		this.inherited(arguments);
		this.sizeEditor();
	},
    // TODO: Changing this from true to false works, changing from false to true does not; this was true back when wm.Editor was in use as well.
	setEditorBorder: function(inEditorBorder) {
		this.editorBorder = inEditorBorder;
	        this.sizeEditor();
	},
	addEditorConnect: function(inConnect) {
		this._editorConnects.push(dojo.connect.apply(dojo, arguments));
	},
	connectEditor: function() {
		this.disconnectEditor();
		this.addEditorConnect(this.editor, "onChange", this, "changed");
		this.addEditorConnect(this.editor, "onBlur", this, "blurred");
		this.addEditorConnect(this.editor, "_onFocus", this, "focused");
		this.addEditorConnect(this.editor.domNode, "onkeypress", this, "keypressed");

/*
		this.addEditorConnect(this.editor.domNode, "onkeypress", this, "keypressed");
		this.addEditorConnect(this.editor.domNode, "onkeypress", this, "dokeypress");
*/
		if (this.validationEnabled())
		  this.addEditorConnect(this.editor, "validate", this, "editorValidated");
	},
	disconnectEditor: function() {
		dojo.forEach(this._editorConnects, dojo.disconnect);
		this._editorConnects = [];
	},
	invalidate: function() {
		delete this._isValid;
	},
	keypressed: function(inEvent){
	    if (inEvent.charCode || inEvent.keyCode == dojo.keys.BACKSPACE || inEvent.keyCode == dojo.keys.DELETE || dojo.indexOf(this.changeKeycodes, inEvent.keyCode) != -1) {
		this.validate();
	        this.dokeypress(inEvent);
	    }
	},
	blurred: function() {
		this.validate();
		this.doOnblur();
	},
	focused: function() {
            dojo.publish("wm.AbstractEditor-focused", [this]);
	    this.doOnfocus();	    
	},
    doOnblur: function() {
	if (!this.disabled) {
	    /* Sometimes values don't update before the event fires; build in a delay before the event handler so 
	     * values have time to update before firing the handler.
	     */
	    wm.onidle(this, function() {
		this.onblur();
	    });
	}
    },
    onblur: function() {},
    doOnfocus: function() {
	if (!this.disabled) {

	    /* Sometimes values don't update before the event fires; build in a delay before the event handler so 
	     * values have time to update before firing the handler.
	     */
	    wm.onidle(this, function() {
		    this.onfocus();
	    });
	}
    },
    onfocus: function() {},
    changed: function() {
	this.validate();
	this.doOnchange();
    },
    doOnchange: function() {
	if (this.editorChanged()) {
	    var e = this.editor;
	    if (!this._loading && !this.isUpdating() && !this.readonly && e && !this.isLoading())
		this.onchange(this.getDisplayValue(), this.getDataValue());
	}
    },
    onchange: function(inDisplayValue, inDataValue) {},
	_getValidatorNode: function() {
		var n = this.editor && this.editor.domNode.firstChild;
		if (!n)
		{
			return null;
		}
		for (var i=0, c, children=n.childNodes; c=children[i]; i++)
			if (dojo.hasClass(c, "dijitValidationIcon"))
				return c;
	},
	editorValidated: function() {
		if (this.validatorNode)
			this.validatorNode.style.display = this.editor.state == "Error" ? "" : "none";
	},
	validate: function() {
		if (this.validationEnabled())
		    this.invalidate();

            // just because the editor doesn't have validation doesn't mean that the container won't need to validate the sum of all inputs
		wm.job(this.getRuntimeId(), 25, dojo.hitch(this, function() {
		    if (!this.isDestroyed) {
			if (this.parent) 
				wm.fire(this.parent, "validate");
			this.valueChanged("invalid", this.getInvalid());
		    }
		}));
	},
	getEditorProps: function(inNode, inProps) {
		return dojo.mixin({srcNodeRef: inNode, owner: this, disabled: this.disabled}, inProps || {});
	},
	isValid: function() {
		return !this.getInvalid();
	}, 
	getInvalid: function() {
	    var validationEnabled = this.validationEnabled();
	    if (validationEnabled && this.editor && this.editor.isValid) { /* test for existence of isValid method */
		if (this._isValid === undefined)
		    this._isValid = this.editor.isValid();
		return !(this.readonly || this._isValid);
	    } else if (this.required && !this.readonly) {
		var value = this.getDataValue();
		if (value === undefined || value === null || value === "") {
		    return true;
		}
	    }
	},
        setInvalid: function() {
	    this._isValid = false;
	    this.editor.set("state","Error");
	    this.valueChanged("invalid", this.getInvalid());
	},
	_getReadonlyValue: function() {
		return this.getDisplayValue() || "";
	},
        createReadOnlyNode: function() {
	    var node = dojo.create("div");
	    dojo.addClass(node, "wmeditor-readonlyNode");
	    var readstyle = node.style;
	    readstyle.lineHeight = "normal";
	    readstyle.position = "absolute";
	    readstyle.whiteSpace =  (this.singleLine) ? "nowrap" : "normal";
	    return node;
	},

    // TODO: If editor gets resized, what will the readOnlyNode do?
	setReadonly: function(inReadonly, hideOrShowEditor) {
		var r = this.readonly;
		this.readonly = inReadonly;
		if (r != this.readonly)
			this.setCaption(this.caption);
			
		var domNode = this.domNode;
		
		// Insure we have a readonly node, let each subclass override what the readonly node actually consists of
		if (!this.readOnlyNode && this.readonly)
			this.readOnlyNode = this.createReadOnlyNode();
		
		// If there is a readOnlyNode, then take care of adding/removing it from our domNode.
		if (this.readOnlyNode) {
			// If we're in readonly mode, and the readonly node is not in our domNode, add it in.
			if (this.readonly && this.readOnlyNode.parentNode != domNode)
				dojo.place(this.readOnlyNode, domNode,  "last");
			// If we are NOT in readonly mode, and the readonly node is within our domNode, remove it.
			else if (!this.readonly && this.readOnlyNode.parentNode == domNode)
				domNode.removeChild(this.readOnlyNode);
		} 
		
		if (hideOrShowEditor) {
	    if (this.readonly) 
	      this.editorNode.style.display = 'none';
	    else  
	      this.editorNode.style.display = 'block';
		} else {
			// Add or remove the editorNode from our domNode
			if (!this.readonly && this.editorNode.parentNode != domNode) 
				dojo.place(this.editorNode, domNode, "last");
			else 
				if (this.readonly && this.editorNode.parentNode == domNode) 
					domNode.removeChild(this.editorNode);
		}
			
		this.invalidCss = true;
		this.render();
		
		if (this.readonly)
			wm.fire(this.editor,"_hideTooltip");
		
		this.updateReadonlyValue();
	},

	updateReadonlyValue: function(inValue) {
	    if (this.readonly && this.readOnlyNode){
		var value;
		if (this.$.format && this.$.format.declaredClass != "wm.DataFormatter") {
		    value = this.$.format.format(inValue || this.getDataValue());
		} else if (this.formatter && dojo.isFunction(this.owner[this.formatter])) {
		    try {
			value = this.owner[this.formatter](this, inValue || this.getDataValue());
		    } catch(e) {
			console.error("Formatter error in " + this.toString() + ": " + e);
		    }
		} 
		if (value === undefined) {
		    value = inValue || this._getReadonlyValue();
		}
		this.readOnlyNode.innerHTML = value;
	    }
	},
	getDisplayValue: function() {
		return this.editor && this.editor.declaredClass &&  this.editor.get && this.editor.get('displayedValue') ? this.editor.get('displayedValue') || "" : this.getEditorValue() || "";
	},
	makeEmptyValue: function() {
		// this.display is only set by LiveForm therefore will only work for fields in LiveForm and their emptyValue is not set yet.
		if (this.emptyValue == 'unset' && this.display)
			return wm.defaultEmptyValue(this.display);
		
		switch (this.emptyValue) {
			case "null": return null;
			case "false": return false;
			case "emptyString": return "";
			case "zero": return 0;
		}
	},
	getEditorValue: function() {
		var v;
	    // If using html widgets and replacing them with dijits use 
	    // v = (this.editor.declaredClass) ? this.editor.attr('value') : this.editor.value;
		if (this.editor)
		    v = this.editor.get('value') ;
	    
		return (v || v === 0) ? v : this.makeEmptyValue();
	},
        normalizeDataValue: function(inValue) {return inValue;},
	setEditorValue: function(inValue) {
	    if (this.editor) {  // If using html widgets and replacing them with dijits use  if (this.editor && this.editor.declaredClass) {
		inValue = inValue === undefined ? null : inValue;
		inValue = this.normalizeDataValue(inValue);
		var oldValue = this.editor.get('value');
		this.editor.set('value',inValue, false);

		/* Bug in dojo causes this value NOT to be updated if we pass in "false" as our last
		 * parameter to set("value"); we pass in false so we can maintain an easier to 
		 * understand syncrhonous setting of values and triggering of side effects */
		this.editor._lastValueReported = inValue ? inValue : "";
		if (oldValue != inValue) {
		    this.changed();
		} else if ((typeof inValue != "object" || inValue === null) && this.dataValue !== inValue) {
		    this.displayValue = this.getDisplayValue();
		    this.dataValue = this.getDataValue();
		}

		/* If updateReadonlyValue is called before this.changed, then this.dataValue will not yet have been set */
		this.updateReadonlyValue();
	    }
	},
	setDisplayValue: function(inValue) {
		this.setEditorValue(inValue);
	},
	setRequired: function(inValue) {
	        var oldValue = this.required;
		this.required = inValue;
		if (this.editor) {
			this.editor.required = inValue;
			if (this.required || oldValue) {
			    this.validate();
			    this.setCaption(this.caption);
			}
		}
	},
	
	getRequired: function(){
		return this.required;
	},

	beginEditUpdate: function(inProp) {
		this._updating++;
	},
	endEditUpdate: function(inProp) {
		this._updating--;
	},
	requireChanged: function() {
		this.setCaption(this.caption);
	},
	setInitialValue: function() {
	    this.beginEditUpdate();
	    try {
		this.setEditorValue(wm.propertyIsChanged(this.dataValue, "dataValue", wm.Editor) ? this.dataValue : this.displayValue);
	    } catch(e) {}
	    this.endEditUpdate();
	},

    /* EditorChanged is called when we think that the editor has changed values.  If it returns false however,
     * it has concluded that the editor has not in fact changed.
     * If you need to set this.dataValue/this.displayValue before editorChanged is called, then you should
     * use a subclass that provides its own editorChanged method, and which returns true.
     * Added to prevent onblur from firing bindings and onchange events if onKeyPress already fired that change.
     */
	editorChanged: function() {
	    var displayValue = this.getDisplayValue();
	    var changed = false;
	    if (this.displayValue != displayValue) {
		this.valueChanged("displayValue", this.displayValue = displayValue);
		changed = true;
	    }

	    var dataValue = this.getDataValue();
	    if (this.calcIsDirty(dataValue, this._lastValueReported)) {		
		this.valueChanged("dataValue", this.dataValue = dataValue);
		changed = true;		
	    } else {
		this.dataValue = dataValue; // its possible for _lastValueReported to not be stored in this.dataValue, though its probably just a special case for DataSet editors
	    }
	    if (changed) {
		/* NOTE: editorChanged is called when the user types OR when setDataValue is called
		 * _lastValue must NOT be updated if its caused by the user typing, so its cleared from
		 * setDataValue instead.  But _inPostInit gets special treatment.
		 */
		if (this._inPostInit) {		
		    this._lastValue = this.dataValue;
		}
		this.updateIsDirty();
	    }
	    return changed;
		//wm.fire(this.editor, "ownerEditorChanged");
	},    

    calcIsDirty: function(val1, val2) {
	if (val1 === undefined || val1 === null)
	    val1 = "";
	if (val2 === undefined || val2 === null)
	    val2 = "";
	return val1 != val2;
    },
    clearDirty: function() {
	this._lastValue = this.dataValue == null ? this.makeEmptyValue() : this.dataValue;
	this.updateIsDirty();
    },
    updateIsDirty: function() {
	var wasDirty = this.isDirty;
	var isDirty = true;
	if (!this.calcIsDirty(this.dataValue, this._lastValue)) {
	    isDirty = false;
	} else if ((this.dataValue === "" || this.dataValue === null || this.dataValue === undefined) &&
		   (this._lastValue === "" || this._lastValue === null || this._lastValue === undefined)) {
	    isDirty = false;
	}
	this.valueChanged("isDirty", this.isDirty = isDirty);
	if (wasDirty != this.isDirty)
	    dojo.toggleClass(this.domNode, "isDirty", this.isDirty);
	if (!app.disableDirtyEditorTracking)
	    wm.fire(this.parent, "updateIsDirty");
    },
	getDataValue: function() {
	    if (this.isReady()) {
		return this.getEditorValue();
	    } else if (this.dataValue === null || this.dataValue === undefined || this.dataValue === "") {
		return this.makeEmptyValue();
	    } else {
		return this.dataValue;
	    }
	},
	setDataValue: function(inValue) {
	    // for simplicity, treat undefined as null
	    if (inValue === undefined)
		inValue = null;
/*
	    this._lastValue  = inValue instanceof wm.Variable ? inValue.getData() : inValue;
	    if (this._lastValue == null)
	        this._lastValue = this.makeEmptyValue();
		*/
	    this.setEditorValue(inValue);
	    if (inValue === "" || inValue === null) 
		this.resetState();
	    if (!this.isUpdating())
		this.clearDirty(); // calls to setDataValue should always clear the dirty indicator and assume the input value is "Good"
	},
	isUpdating: function() {
		return this._updating > 0;
	},

	// used to determine if the editor is ready to send and receive values
	isReady: function() {
		return Boolean(this.editor);
	},
	canFocus: function() {
		return !this.readonly;
	},
	focus: function() {
		wm.fire(this.editor, "focus");
	},
        reset: function() {
	    this.setDataValue(this._lastValue);
	    this.resetState();
	},
	resetState: function() {
	    this.invalidate();	    
		var e = this.editor;
		if (e) {
			e._hasBeenBlurred = false;
			wm.fire(e,"_hideTooltip");
		    if (this.validatorNode && !this.getDisplayValue()) {
			this.validatorNode.style.display = "none";
			e.set("state", "Normal");
			e._setStateClass();
		    }
		}
	},
	clear: function() {
		//this.setEditorValue(null);
	        this._lastValue = this.makeEmptyValue();

	        this.setDataValue(null);  // changed from setEditorValue because setEditorValue does not handle readonly editor
	        //this.resetState();  called by setDataValue now
	},
	// design time
	listOwnerProperties: function() {
		var p = dojo.mixin({}, wm.Component.prototype.listProperties.apply(this) || {});
		// include properties intended for editor's owner
		for (var i in p) {
			if (!p[i].isOwnerProperty)
				delete p[i];
		}
		return p;
	},
	listProperties: function() {
		var p = dojo.mixin({}, this.inherited(arguments) || {});
		// exclude properties intended for editor's owner
		// This will exclude owner props from serialization by default.
		// If these properties are *not* serialized in the owner and should be serialized
		// then override isWriteableProp and serialize here.
		for (var i in p) {
			if (p[i].isOwnerProperty)
				delete p[i];
		}
		return p;
	},
	valueChanged: function(inProp, inValue) {
		if (this._updating)
			return;
	    if (inProp == "dataValue")
		this._lastValueReported = inValue;
	    this.inherited(arguments);
		//if (this.isDesignLoaded() && inProp)
		//	this.createEditor();
	},
	isLoading: function() {
		return this._loading;
	},
	dokeypress: function(inEvent) {
		if (this.changeOnKey || (this.changeOnEnter && inEvent.keyCode == dojo.keys.ENTER))
			wm.onidle(this, "doChangeOnKey", arguments);
	        if (inEvent.keyCode == dojo.keys.ENTER)
		    wm.onidle(this, "onEnterKeyPress", [this]);
	},
	doChangeOnKey: function(inEvent) {
		var e = this.editor;
	        //e.set("value",e.get("value"));
	    this.changed();
	},

	setDefaultOnInsert:function(){
	        if (this.editor && this.defaultInsert) {
		    if (this.$.binding && this.$.binding.wires.defaultInsert)
			this.$.binding.wires.defaultInsert.refreshValue();
			
		    this.editor.set('value', this.defaultInsert, false);
		    this.invalidate();
		}
	},
    onEnterKeyPress: function() {},


    toHtml: function(inWidth) {
	var remainingWidth = inWidth - 4; // always seem to need a 4px buffer to avoid wrapping
	var margin = "2px 4px 2px 4px";
	remainingWidth -= 8; // margin for the wrapper div
	remainingWidth -= 2; // border for the editor
	var captionSize = 125;
	var topToBottomLayout =  (remainingWidth - captionSize < 100 || this.captionPosition == "top" || this.captionPosition == "bottom");
	if (this.caption && this.captionSize != "0px" && this.captionSize != "0%" && !topToBottomLayout) {
	    var captionPadding = 4;
	    var editorSize = remainingWidth - captionSize;
	    return "<div class='wmeditor' id='" + this.domNode.id + "' style='margin: " + margin + ";'><div class='wmeditor-label' style='width:" + (captionSize-captionPadding) + "px;padding-right:" + captionPadding + "px;display:inline-block;'>" + this.caption + "</div><div class='wmeditor-value' style='display: inline-block;width:" + editorSize + "px'>" + (this.getDisplayValue() || "&nbsp;") + "</div></div>";
	} else {
	    var html = [];
	    html.push("<div class='wmeditor' id='" + this.domNode.id + "' style='margin: " + margin + ";'>");
	    if (this.caption && this.captionSize != "0px" && this.captionSize != "0%") {
		html.push("<div class='wmeditor-label' >" + this.caption + "</div>");
	    }
	    html.push("<div class='wmeditor-value'>" + (this.getDisplayValue() || "&nbsp;") + "</div>");
	    html.push("</div>");
	    return html.join("\n");
	}
    }    

});

wm.AbstractEditor.captionPaddingWidth = 8;
wm.AbstractEditor.captionPaddingHeight = 2;


