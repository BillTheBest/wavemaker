/*
 *  Copyright (C) 2008-2011 WaveMaker Software, Inc.
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
dojo.provide("wm.base.widget.Editors.Radiobutton");
dojo.require("wm.base.widget.Editors.Checkbox");

//===========================================================================
// RadioButton Editor
//===========================================================================
dojo.declare("wm._RadioButtonEditor", wm._CheckBoxEditor, {
	radioGroup: "",
	_createEditor: function(inNode, inProps) {
		return new dijit.form.RadioButton(this.getEditorProps(inNode, inProps));
	},
	getEditorProps: function(inNode, inProps) {
		return dojo.mixin(this.inherited(arguments), {
			name: this.radioGroup
		}, inProps || {});
	},
	captionClicked: function() {
		if (!this.owner.readonly && !this.owner.disabled)
			this.setChecked(true);
	},
	setEditorValue: function() {
		this.inherited(arguments);
		this.updateGroupValue();
	},
	setRadioGroup: function(inGroup) {
		this.radioGroup = inGroup ? wm.getValidJsName(inGroup) : "";
		var group = this.getGroup();
		if (group.length)
			this.dataType = group[0].owner.dataType;
		this.createEditor();
		wm.fire(studio.inspector, "reinspect");
	},
	getGroup: function() {
		var groupList = [];
		var nList = dojo.query("input[type=radio][name="+this.radioGroup+"]");
		nList.forEach(function(DOMNode, index, nodeList){
			groupList[index] = dijit.getEnclosingWidget(DOMNode);
		});
		return groupList;
	},
	updateGroupValue: function() {
		var group = this.getGroup(), gv = this.getGroupValue();
		for (var i=0, v, o; (v=group[i]); i++) {
			o = (v.owner ||0).owner;
			if (o) {
				// avoid setter since we just want to process the update
				o.groupValue = gv;
				o.valueChanged("groupValue", gv);
			}
		}
	},
	setGroupValue: function(inValue) {
		var group = this.getGroup();
		for (var i=0, v; (v=group[i]); i++)
			if (v.owner.getDisplayValue() === inValue) {
				if (!v.checked)
					v.owner.setChecked(true);
				return;
			}
		// if not a good value, uncheck checked editor in group
		for (var i=0, v; (v=group[i]); i++)
			if (v.checked) {
				v.owner.setChecked(false);
				return;
			}
	},
	getGroupValue: function() {
		var group = this.getGroup();
		for (var i=0, v; (v=group[i]); i++)
			if (v.checked)
				return v.owner.getEditorValue();
		// if none checked, return an emptyValue; for consistency use the first editor in the group.
		for (var i=0, v; (v=group[i]); i++)
			return v.owner.makeEmptyValue();
	},
	isLoading: function() {
		var l = this.inherited(arguments);
		if (!l) {
			var group = this.getGroup();
			for (var i=0, v, gl; (v=group[i]); i++) {
				gl = v.owner.owner._rendering;
				if (gl)
					return true;
			}
		}
		return l;
	},
	setDataType: function(inType) {
		var group = this.getGroup();
		for (var i=0, v; (v=group[i]); i++)
			v.owner.dataType = inType;
	},
	setStartChecked: function(inChecked) {
		if (inChecked) {
			var group = this.getGroup();
			for (var i=0, v, r; (v=group[i]); i++)
				if (v.owner != this)
					v.owner.setStartChecked(false);
		}
		this.inherited(arguments);
	},
	// fired when owning editor widget processs change
	ownerEditorChanged: function() {
		this.updateGroupValue();
	}
});



//===========================================================================
// RadioButton Editor
//===========================================================================
dojo.declare("wm.RadioButton", wm.Checkbox, {
	radioGroup: "",
	_createEditor: function(inNode, inProps) {
		return new dijit.form.RadioButton(this.getEditorProps(inNode, inProps));
	},
	getEditorProps: function(inNode, inProps) {
		return dojo.mixin(this.inherited(arguments), {
			name: this.radioGroup
		}, inProps || {});
	},
	captionClicked: function() {
		if (!this.readonly && !this.disabled)
			this.setChecked(true);
	},
	setInitialValue: function() {
		this.beginEditUpdate();

	    var setEditorValueCalled = false;
	    var g = this.getGroup();
	    for (var i = 0; i < g.length; i++) {
		var o = g[i].owner;
		if (o._setEditorValueCalled) {
		    setEditorValueCalled = true;
		    break;
		}
	    }

	    // if setEditorValue has been called, then startChecked no longer controls the checkbox's initial state;
	    // the dataValue only controls the state now.
	    if (this.startChecked && !setEditorValueCalled || this.groupValue == this.checkedValue)
			this.setChecked(true);
		this.endEditUpdate();
	},
	getChecked: function() {
	    if (this.editor)
		return Boolean(this.editor.checked);
	    else
		return this.groupValue == this.checkedValue;
	},
	setEditorValue: function(inValue) {

	    if (inValue == this.checkedValue) {
		if (this.editor) {
		    this.editor.set('checked',true);
		    this.updateGroupValue();
		} else {
		    this.groupValue = this.checkedValue;
		}
	    } else {
		var found = false;
		var group = this.getGroup(), gv = this.getGroupValue();
		for (var i=0, v, o; (v=group[i]); i++) {
		    if (v) {
			o = v.owner;// v.owner refers to a wm.RadioButton (dijit's owner)
			if (o.checkedValue == inValue) {
			    o.setEditorValue(inValue);
			    found = true;
			    break;
			}
		    }
		}

		if (!found) {
		    // If we made it this far, then inValue does not match any of our radio buttons; 
		    // so no buttons should be checked
		    for (var i=0, v, o; (v=group[i]); i++) {
			if (v) {
			    o = v.owner;// v.owner refers to a wm.RadioButton (dijit's owner)
			    if (o.getChecked()) {
				o.setChecked(false);
				this.updateGroupValue();
				return;
			    }
			}
		    }
		}
	    }
	    this._setEditorValueCalled = true;

	},
	setRadioGroup: function(inGroup) {
		this.radioGroup = inGroup ? wm.getValidJsName(inGroup) : "";
		var group = this.getGroup();
		if (group.length)
			this.dataType = group[0].dataType;
		this.createEditor();
		wm.fire(studio.inspector, "reinspect");
	},
	getGroup: function() {
		var groupList = [];
		var nList = dojo.query("input[type=radio][name="+this.radioGroup+"]");
		nList.forEach(function(DOMNode, index, nodeList){
			groupList[index] = dijit.getEnclosingWidget(DOMNode);
		});
		return groupList;
	},
	updateGroupValue: function() {
		var group = this.getGroup(), gv = this.getGroupValue();
		for (var i=0, v, o; (v=group[i]); i++) {
		    if (v) {
			o = v.owner;// v.owner refers to a wm.RadioButton (dijit's owner)
			if (o) {
				// avoid setter since we just want to process the update
				o.groupValue = gv;
			    if (djConfig.isDebug)
				console.log(o.toString() + " has group value " + gv);
			    o.valueChanged("groupValue", gv);
			}
		    }
		}
	},
	setGroupValue: function(inValue) {
		var group = this.getGroup();
	    for (var i=0, v; (v=group[i]); i++) {
		    var o = v.owner;
			if (o.checkedValue === inValue) {
			    if (!o.getChecked()) {
				o.setChecked(true);
			    }
			    return;
			}
	    }

	    // if not a good value, uncheck checked editor in group
	    for (var i=0, v; (v=group[i]); i++) {
		var o = v.owner;
		if (o.getChecked()) {
		    o.setChecked(false);
		    return;
		}
	    }
	},
	getGroupValue: function() {
		var group = this.getGroup();
		for (var i=0, v; (v=group[i]); i++)
			if (v.checked)
				return v.owner.checkedValue;// v.owner refers to a wm.RadioButton (dijit's owner)
		// if none checked, return an emptyValue; for consistency use the first editor in the group.
		for (var i=0, v; (v=group[i]); i++) 
			return v.owner.makeEmptyValue(); // v.owner refers to a wm.RadioButton (dijit's owner)
	},
	isLoading: function() {
		var l = this.inherited(arguments);
		if (!l) {
			var group = this.getGroup();
			for (var i=0, v, gl; (v=group[i]); i++) {
				gl = v.owner._rendering;  // v.owner refers to a wm.RadioButton (dijit's owner)
				if (gl)
					return true;
			}
		}
		return l;
	},
	setDataType: function(inType) {
		var group = this.getGroup();
		for (var i=0, v; (v=group[i]); i++)
			v.dataType = inType;
	},
	setStartChecked: function(inChecked) {
		if (inChecked) {
			var group = this.getGroup();
			for (var i=0, v, r; (v=group[i]); i++)
				if (v != this)
					v.owner.setStartChecked(false); // v.owner refers to a wm.RadioButton (dijit's owner)
		}
		this.inherited(arguments);
	},
	editorChanged: function() {
	    this.inherited(arguments);
	    this.updateGroupValue();
	}
});



// design only...
wm.Object.extendSchema(wm._RadioButtonEditor, {
	groupValue: { isOwnerProperty: 1, ignore: 1, bindable: 1, type: "any", group: "edit", order: 50 }
});

wm.Object.extendSchema(wm.RadioButton, {
    checkedValue: {group: "editor", bindable: 1,order: 40, type: "any", doc: 1},
    groupValue: { ignore: 1, bindSource: 1, type: "any"},
    radioGroup: { type: "string", group: "editor", order: 50,doc: 1}
});