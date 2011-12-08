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

dojo.provide("wm.base.widget.DataForm_design");
dojo.require("wm.base.widget.DataForm");
dojo.require("wm.base.widget.Container_design");


wm.Object.extendSchema(wm.FormPanel, {
    cancelButton: {ignore:1},
    updateButton: {ignore:1},
    deleteButton: {ignore:1},
    saveButton: {ignore:1},
    newButton: {ignore:1},
    readonly: { group: "editor", order: 6},
    editorWidth: {group: "display", order: 200, editor: "wm.prop.SizeEditor"},
    editorHeight: {group: "display", order: 201, editor: "wm.prop.SizeEditor"},
    captionSize: { group: "display", order: 210, editor: "wm.prop.SizeEditor"},
    captionAlign: { group: "display", order: 230, options: ["left", "center", "right"]},
    captionPosition: { group: "display", order: 240, options: ["top", "left", "bottom", "right"]},
    layoutKind: {ignore: 1},
    lock: {ignore: 1},
    freeze: {ignore: 1},
    imageList: {ignore: 1},
    horizontalAlign: {writeonly: 1},
    verticalAlign: {writeonly: 1}
});

wm.Object.extendSchema(wm.DataForm, {
    dataSet: {readonly: 1, group: "data", order: 1, bindTarget: 1, createWire:1,type: "wm.Variable"},// readonly; only binding should be written, not value
    dataOutput: { ignore: 1, group: "data", order: 2, bindSource: 1, type: "wm.Variable", simpleBindProp: true, categoryParent: "Properties", categoryProps: {component: "dataOutput", inspector: "Data"} },
    type: {group: "data",  order: 1, editor: "wm.prop.DataTypeSelect"},
    generateInputBindings: {group: "editor"},
    generateOutputBindings: {group: "editor"},
    addEditors: {operation: true, group: "operation"},
    removeEditors: {operation: true, group: "operation"},
    generateButtons:{operation: true, group: "operation"},
    confirmChangeOnDirty: {group: "editor", order: 100},
    setReadonlyOnPrimaryKeys: {group: "editor", order: 10},
    editNewObject: {method: 1},
    editCurrentObject:{method: 1},
    noDataSet: {ignore: 1, bindSource: 1}
    
});

wm.Object.extendSchema(wm.DBForm, {
    formBehavior: {group: "editor", order: 50, options: ["standard", "insertOnly", "updateOnly"]},
    readonlyManager: {group: "editor", order: 55},
    useLoadingDialog: {group: "display", order: 60},
    deleteConfirmation: {group: "editor", order: 500},
    operation: {ignore:1},
    service: {hidden: 1},
    type: {group: "data",  order: 1, editor: "wm.prop.DataTypeSelect", editorProps: {liveTypes: true}},
    insertOp: {ignore:1},
    deleteOp: {ignore:1},
    updateOp: {ignore:1},
    generateDeleteButton:{operation: true, group: "operation"},
    generateCancelButton:{operation: true, group: "operation"},
    generateEditButton:{operation: true, group: "operation"},
    generateNewButton:{operation: true, group: "operation"},
    generateSaveButton:{operation: true, group: "operation"},
    serviceVariable: {ignore:1}
});

wm.DataForm.extend({
    _placeEditorOffset: 1,
    /****************
     * METHODS: afterPaletteDrop
     * DESCRIPTION:  Setup onEnterKeyPress event handler 
     ***************/
    afterPaletteDrop: function() {
	this.inherited(arguments);
    },


    /****************
     * METHOD: set_type (DESIGN)
     * DESCRIPTION: Each time either the user or set_dataSet changes type, generate a new set of editors
     ***************/
    set_type: function(inType) {
	if (inType != this.type) {
	    this._removeEditors();
	    this.type = inType;
	    this.dataOutput.setType(inType);
	    this.dataSet.setType(inType);
	    this.addEditors();
	    return true;
	} else {
	    return false;
	}
    },

    /****************
     * METHOD: set_dataSet (DESIGN)
     * DESCRIPTION: 
     *       1. Takes in a name of a variable and creates a binding from that variable to our dataSet property.
     *          The binding then immediately calls set_dataSet(wm.Variable).
     *       2. Takes in a Variable and makes it our dataSet property and updates our type and form fields
     ***************/
    set_dataSet: function(inDataSet) {
	this.setDataSet(inDataSet);
	if (inDataSet && inDataSet.type != "any" && inDataSet.type != this.type) {
		this.set_type(inDataSet.type);
	}
    },


    /****************
     * METHOD: makePropEdit (DESIGNTIME)
     * DESCRIPTION: Generates property editors
     ***************/
	makePropEdit: function(inName, inValue, inEditorProps) {
	var prop = this.schema ? this.schema[inName] : null;
	var name =  (prop && prop.shortname) ? prop.shortname : inName;
	    switch (inName) {
	    case "dataSet":
		    var p = wm.getParentForm(this);
		    if (p) {
			return new wm.prop.Select(dojo.mixin(inEditorProps, {options: this.getFormSubDataSetNames(p)}));
		    } else {
			return new wm.prop.DataSetSelect(dojo.mixin(inEditorProps, {widgetDataSets: true, listMatch: undefined, noForms:true}));
		    }
	    }
	    return this.inherited(arguments);
	},

    getTypeSchema: function() {
	return wm.typeManager.getTypeSchema(this.type);
    },

    /****************
     * METHOD: addEditors (DESIGNTIME)
     * DESCRIPTION: Entry point method for generating all editors needed for the current type
     ***************/
    addEditors: function() {
	this._currentEditors = this.getEditorsArray();
	// we don't want updates while making editors
	this.makeEditors();
	this.finishAddEditors();
	this._currentEditors = null;
    },

    removeEditors: function() {
		app.confirm(studio.getDictionaryItem("wm.LiveForm.CONFIRM_REMOVE_EDITORS", {name: this.getId()}),
			    false, 
			    dojo.hitch(this, "_removeEditors"));
    },
    _removeEditors: function() {
	this.destroyEditors();
	this.setFitToContentHeight(false);
	this.reflow();
	wm.fire(this, "updateDesignTrees");
    },
	destroyEditors: function() {
		this._currentEditors = null;
		for(var i=0, eds = this.getEditorsArray(), e; (e=eds[i]); i++) {
			this._removeBindingForEditor(e);
			e.destroy();
		}

		for(var i=0, eds = this.getRelatedEditorsArray(), e; (e=eds[i]); i++) {
			this._removeBindingForEditor(e);
			e.destroy();
		}
	},


    /****************
     * METHOD: finishAddEditors (DESIGNTIME)
     * DESCRIPTION: After the editors are generated; populate them (unless we bound each editor's dataValue),
     *              and switch from fixed height (allows us to see the form) to autoHeight (now that the form is not empty).
     *              Finish by updating the model.
     ***************/
	finishAddEditors: function() {
	    var eds = this.getEditorsArray();		
	    if (!this.generateInputBindings) {
		this.populateEditors();
	    }
	    this.setHeight(this.getPreferredFitToContentHeight() + "px");
	    this.reflow();
	    studio.refreshDesignTrees();
	},

/* DESIGN TIME */
	getViewDataIndex: function(inFormField) {
		return inFormField;
	},

	addEditorToForm: function(inEditor) {
		var e = inEditor, ff = e.formField && this.getViewDataIndex(e.formField || "");
		if (ff) {
                    if (wm.isInstanceType(e, wm.SubForm))
			var f = this.addEditorToView(e, ff);
		    if (f)
			wm.updateFieldEditorProps(e, f)
		}
		inEditor.setReadonly(this.readonly);
		this._bindEditor(inEditor);
		this.populateEditors();
	},
/* DESIGN TIME; only relevant if the dataSet is a LiveVariable; ServiceVariables dont support LiveViews and must get
 * any extra data needed some other way.
 */
	addEditorToView: function(inEditor, inField) {
	    var lvar = this.getLiveVariable();
	    var v = lvar && lvar.liveView;

		if (v) {
		    if (wm.isInstanceType(inEditor, wm.Lookup) ||
			wm.isInstanceType(inEditor, wm.SubForm)) {
			v.addRelated(inField);
			lvar.update();
		    } else {
			return v.addField(inField);
		    }
		}
	},
    getLiveView: function() {
	if (lvar) return lvar.liveView;
    },
	getLiveVariable: function() {
		// Not sure why we were not checking for liveVariable instance in the object itself,
		// before digging deep and trying to find liveVariable elsewhere. 
		/*
		if (this.liveVariable && wm.isInstanceType(this.liveVariable, wm.LiveVariable))
			return this.liveVariable;
		*/
		var
			s = this.dataSet.dataSet,
			o = s && s.owner,
			ds = null;
		  o = o && !(wm.isInstanceType(o, wm.Variable)) ? o : null;
			
			if (o){
				try{
				    if (wm.isInstanceType(o, wm.DojoGrid)) {
					ds = o.variable;
				    } else {
					ds = o.dataSet;
				    }
				} catch(e) {
					// This might happen if wm.DojoGrid class itself is not loaded.
					ds = o.dataSet;
				}
			}
			// if source not owned by a variable but it has a dataSet, use it if it's a LiveVariable
	        
			if (o && ds && wm.isInstanceType(ds, wm.LiveVariable)) {
				return ds;
		}
		// otherwise walk owners to look for a LiveVariable
		while (s) {
			if (wm.isInstanceType(s, wm.LiveVariable)) {
				return s;
			}
			s = s.owner;
			if (!(wm.isInstanceType(s.owner, wm.Variable))) {
				break;
			}
		}
	},


    /****************
     * METHOD: makeEditors (DESIGNTIME)
     * DESCRIPTION: 1. Iterate over each editor that is no longer needed (it has a formField that isn't in the new type) 
     *                 and destroy it. 
     *              2. Iterate over each field of the new type and generate an editor if there isn't one already
     ***************/
    getTypeDef: function() {
	return wm.typeManager.getType(this.type);
    },
	makeEditors: function() {
	    var typeDef;
	    var fields;

	    typeDef = this.getTypeDef();
	    if (typeDef) {
		fields = wm.typeManager.getFilteredPropNames(typeDef.fields);
	    }


	    var editors = this.getEditorsArray();

	    for (var i = 0; i < editors.length; i++) {
		if (editors[i].formField && !fields[editors[i].formField])
		    editors[i].destroy();
	    }
	    if (fields) {
		for (var i = 0; i < fields.length; i++) {
		    var fieldName = fields[i];
		    var fieldDef = typeDef.fields[fieldName];
		    this.makeEditor(fieldDef, fieldName);
		}
	    }
	},

    /****************
     * METHOD: makeEditor (DESIGNTIME)
     * DESCRIPTION: Figure out if we're creating a basic editor or related/lookup editor; and create the editor
     ***************/
    makeEditor: function(inFieldInfo, fieldName) {
	var formField = this._getFormField(/*inFieldInfo.dataIndex */fieldName);
	if (formField && !this._getEditorForField(formField)) {
	    if (wm.typeManager.isStructuredType(inFieldInfo.type)) {
		return this.makeRelatedEditor(inFieldInfo, formField);
	    } else {
		return this.makeBasicEditor(inFieldInfo, formField);
	    }
	}
    },

    /****************
     * METHOD: makeBasicEditor (DESIGNTIME)
     * DESCRIPTION: Create a basic editor based on type information
     ***************/
    makeBasicEditor: function(inFieldInfo, inFormField) {
	var props = dojo.mixin(this.getFormEditorProps() || {}, {
	    formField: inFormField,
	    readonly: this.readonly,
	    name: wm.makeNameForProp(inFormField, "Editor")
	});

	var e = this.createEditor(inFieldInfo, props, {}, wm.getEditorClassName(inFieldInfo.displayType || inFieldInfo.type));
	if (e) {
	    if (!e.caption)
		e.setCaption(wm.capitalize(inFormField));
	    this._bindEditor(e);
	}
	return true;
    },

    /****************
     * METHOD: createEditor (DESIGNTIME)
     * DESCRIPTION: Generates an editor based on info from makeBasicEditor; then sets up a few of its properties
     ***************/
	createEditor: function(inFieldInfo, inProps, inEvents, inClass) {
		var e = wm.createFieldEditor(this.getEditorParent(), inFieldInfo, inProps, inEvents, inClass);
		if (e) {		    
		    this.placeEditor(e);
		    if (wm.isInstanceType(e, wm.Number) && inFieldInfo.exclude && inFieldInfo.exclude.indexOf("insert") != -1) {
			e.emptyValue = "zero";
		    } 

		    if (wm.isInstanceType(e, wm.Date) && this.bounds.w > 400)
			e.setWidth("400px");
                    else if (e.parent.horizontalAlign != "justified")
			e.setWidth(this.editorWidth);
                    else 
                        e.setWidth("100%"); // because its going to be 100% anyway so why confuse the user?
		    e.setHeight(this.editorHeight);
		    //console.log(this.name, "createEditor", arguments, e);
		    return e;
		}
	},
    placeEditor: function(inEditor) {
	var offset = this._placeEditorOffset;
		    var editors = this.getEditorsArray(); // getEditorsArray includes the newly created editor which screws with what should be obvious math...
		    if (editors.length == offset) {
			this.moveControl(inEditor,0);
		    } else {
			var lastIndex = this.indexOfControl(editors[editors.length-1 - offset]);
			var parent = editors[editors.length-1-offset].parent;
			if (parent != inEditor.parent) 
			    inEditor.setParent(parent);
			parent.moveControl(inEditor,lastIndex+1);
		    }
    },


    /****************
     * METHODS: BINDING METHODS (DESIGNTIME)
     * DESCRIPTION: Generates bindings to bind each editor's dataValue to this form's dataset.
     *              Generates bindings to bind this form's dataOutput to each editor's dataValue
     ***************/

    /* Called by designPasted to recheck/refresh bindings after pasting */
	_checkBindings: function() {
		var editors = this.getFormEditorsArray();
		for (var i=0, ed; (ed=editors[i]); i++) {
			if (!this._isOkOutputBinding(ed))
				this._bindEditorOutput(ed);
			if (!this._isOkInputBinding(ed))
				this._bindEditorInput(ed);
		}
	},
	_isOkInputBinding: function(inEditor) {
		var
			info = this._getInputBindInfo(inEditor),
			b = inEditor && inEditor.components.binding,
			wires = b && b.wires,
			w = info && wires[info.targetProperty];
		return !info || (w && (w.source == info.source));
	},
	_isOkOutputBinding: function(inEditor) {
		var
			info = this._getOutputBindInfo(inEditor),
			b = this.components.binding,
			wires = b.wires,
			w = info && wires[info.targetProperty];
		return !info || (w && (w.source == info.source));
	},



	_removeBindingForEditor: function(inEditor) {
		// unbind form
		var
			wire,
			binding = this.components.binding,
			wires = binding.wires,
			name = inEditor && inEditor.getId();

	    /* Remove bindings from form to Editor */
		if (name) {
			for (var i in wires) {
			    wire = wires[i];
			    if (wire.source.indexOf(name + ".") == 0)
				binding.removeWire(wire.getWireId());
			}
		}

	    /* Remove bindings from Editor to form */
	    var binding = inEditor.components.binding;
	    if (binding)
		binding.removeWire("dataValue");
	},

	// make binding from which editor gets data
	// FIXME: remove knowledge of editor type
	_getInputBindInfo: function(inEditor) {
	    var formField = inEditor.formField;
	    var targetProperty = null;
	    if (inEditor instanceof wm.AbstractEditor) {
		targetProperty =  "dataValue";
	    } else if (wm.isInstanceType(inEditor, wm.SubForm)) {
		targetProperty = "dataSet";
	    }
	    var dataSet = this.dataSet;
	    var source = dataSet ? (dataSet.getId() + (formField ? "." + formField : "")) : "";
	    if (source)
		return formField !== undefined && targetProperty ? {targetProperty: targetProperty, source: source} : false;
	},
	_getOutputBindInfo: function(inEditor) {
	    var formField = inEditor.formField;
	    var targetProperty = "dataOutput" + (formField ? "." + formField : "");
	    var sourceProp = null;
	    if (inEditor instanceof wm.AbstractEditor) {
		sourceProp =  "dataValue";
	    } else if (wm.isInstanceType(inEditor, wm.SubForm)) {
		sourceProp = "dataOutput" ;
	    }
	    var source = inEditor.getId() + (sourceProp ? "." + sourceProp : "");
	    return formField !== undefined && sourceProp ? {targetProperty: targetProperty, source: source} : false;
	},
	_bindEditorInput: function(inEditor) {
		var info = this._getInputBindInfo(inEditor);
		if (info)
			inEditor.$.binding.addWire("", info.targetProperty, info.source);
	},
	// push data from editor to form
	_bindEditorOutput: function(inEditor) {
		var info = this._getOutputBindInfo(inEditor);
		if (info)
			this.components.binding.addWire("", info.targetProperty, info.source);
	},
    _bindEditor: function(inEditor) {
	if (!inEditor)
	    return;
	this._removeBindingForEditor(inEditor);
	if (inEditor.formField) {
	    if (this.generateInputBindings)
		this._bindEditorInput(inEditor);
	    if (this.generateOutputBindings)
		this._bindEditorOutput(inEditor);
	}
    },


    /****************
     * METHOD: makeRelatedEditor (DESIGNTIME)
     * DESCRIPTION: Create a wm.Lookup or wm.RelatedEditor/Subform based on type information
     ***************/
    makeRelatedEditor: function(inFieldInfo, inFormField) {
	var props = this.getFormEditorProps();
	props.caption = wm.capitalize(inFormField);
	props.formField = inFormField;
        props.width = this.editorWidth;

	var typeDef = this.getTypeDef();
	if (typeDef)
	    var fieldDef = typeDef.fields[inFormField];
	if (fieldDef)
	    var relatedTypeDef = wm.typeManager.getType(fieldDef.type);

	if (relatedTypeDef) {
	    /* If its a liveService and its not a list type, create a wm.Lookup */
	    if (relatedTypeDef.liveService && !inFieldInfo.isList) {
		    props.name = wm.makeNameForProp(inFormField, "Lookup")
		    var e = wm.createFieldEditor(this.getEditorParent(), fieldDef, props, {}, "wm.Lookup");
	    }

	    /* If its a liveService and it IS a list type, create a readonly grid related editor */
	    else if (relatedTypeDef.liveService && inFieldInfo.isList) {
		/* don't automatically add grids
		    props.editingMode = "readonly";
		    var e = this.owner.loadComponent(wm.makeNameForProp(inFormField, "RelatedDataEditor"), this, "wm.RelatedDataEditor", props);		
		e.set_type(fieldDef.type);
		*/
	    } 

	    /* Anything else, and  just get an editable subform for lack of a better idea */
	    else {
		props.editingMode = "one-to-one";
		var e = this.owner.loadComponent(wm.makeNameForProp(inFormField, "SubForm"), this, "wm.SubForm", props);
		e.set_type(fieldDef.type);
	    }

	    if (e) {
		this.placeEditor(e);
		this._bindEditor(e);
	    }
	}
    },
    generateButtons: function() {
	var buttonPanel = new wm.Panel({
	    owner: this.owner,
	    name: this.owner.getUniqueName(this.name + "ButtonPanel"),
	    parent: this,
	    layoutKind: "left-to-right",
	    width: "100%",
	    height: wm.Button.prototype.height,
	    horizontalAlign: "right",
	    verticalAlign: "top"});

	var cancelButton = new wm.Button({owner: this.owner,
					  name: studio.page.getUniqueName(this.name + "ExampleCancelButton"),
					  parent: buttonPanel,
					  showing: true,
					  width: "180px",
					  caption: "cancelEdit()"});
	cancelButton.eventBindings.onclick = this.name + ".cancelEdit";

	var newButton = new wm.Button({owner: this.owner,
				       name: studio.page.getUniqueName(this.name + "ExampleNewButton"),
				       parent: buttonPanel,
				       width: "180px",
				       caption: "editNewObject()"});
	newButton.eventBindings.onclick = this.name + ".editNewObject";

	var updateButton = new wm.Button({owner: this.owner,
					  name: studio.page.getUniqueName(this.name + "ExampleUpdateButton"),
					  parent: buttonPanel,
					  width: "180px",
					  caption: "editCurrentObject()"});
	updateButton.eventBindings.onclick = this.name + ".editCurrentObject";
	updateButton.$.binding.addWire(null, "disabled", this.name + ".noDataSet","");



	this.setHeight(this.getPreferredFitToContentHeight() + "px");
	    this.reflow();
	    studio.refreshDesignTrees();
	// reflow called by caller
    }

});

wm.DBForm.extend({

    set_type: function(inType) {
	var changed = this.inherited(arguments);
	if (inType && changed) {
	    this.serviceVariable.destroy();
	    this.initServiceVariable();
	}
	return changed;
    },



    /****************
     * METHODS: afterPaletteDrop
     * DESCRIPTION:  Setup onEnterKeyPress event handler and generate the buttons panel
     ***************/
    afterPaletteDrop: function() {
	this.inherited(arguments);

	if (!studio.newLiveFormDialog) {
	    studio.newLiveFormDialog = new wm.PageDialog({owner: studio,
							  name: "newLiveFormDialog",
								       pageName: "NewLiveFormDialog",
								       width: "400px",
								       height: "300px",
								       modal: true,
								       hideControls: true,
								       title: studio.getDictionaryItem("wm.DBForm.DIALOG_TITLE")});
	    }
	    studio.newLiveFormDialog.show();
	studio.newLiveFormDialog.page.setForm(this);
    },

    set_readonlyManager: function(inValue) {
	this.readonlyManager = Boolean(inValue);
	if (this.readonlyManager) {
	    this.setReadonly(true);
	}
	this.generateButtons(); /* This may cause problems if the user has modified their buttons */
    },

    set_formBehavior: function(inValue) {
	this.formBehavior = inValue;
	var buttonPanel = this._findButtonPanel();
	if (buttonPanel.isAncestor(this)) {
	    buttonPanel.destroy();
	}

	/* Buttons are still save and cancel if there is no readonly manager */
	if (this.readonlyManager) {
	    this.generateButtons(); /* This may cause problems if the user has modified their buttons */
	}
    },

    /****************
     * METHOD: makePropEdit (DESIGNTIME)
     * DESCRIPTION: Generates property editors
     ***************/
	makePropEdit: function(inName, inValue, inEditorProps) {
	var prop = this.schema ? this.schema[inName] : null;
	var name =  (prop && prop.shortname) ? prop.shortname : inName;
	    switch (inName) {
	    case "dataSet":
		    var p = wm.getParentForm(this);
		    if (p) {
			return new wm.prop.Select(dojo.mixin(inEditorProps, {options: this.getFormSubDataSetNames(p)}));
		    } else {
			return new wm.prop.DataSetSelect(dojo.mixin(inEditorProps, {widgetDataSets: true, listMatch: undefined, noForms:true, allowAllTypes: false, liveServicesOnly: true}));
		    }
	    }
	    return this.inherited(arguments);
	},

    listProperties: function() {
	var props = this.inherited(arguments);
	props.dataSet.ignoretmp = this.formBehavior == "insertOnly";	
	return props;
    },

    _findButtonPanel: function() {
	var buttons = [this.cancelButton, this.newButton, this.deleteButton, this.editButton, this.saveButton];
	for (var i = 0; i < buttons.length; i++) {
	    if (buttons[i] && !buttons[i].isDestroyed && buttons[i].parent.isAncestor(this)) {
		return buttons[i].parent;
	    }
	}
	return this.parent;
    },
    generateCancelButton: function(buttonPanel, noRefresh) {
	if (!buttonPanel) buttonPanel = this._findButtonPanel();
	var cancelButton = new wm.Button({owner: this.owner,
					  name: studio.page.getUniqueName(this.name + "CancelButton"),
					  parent: buttonPanel,
					  showing: this.readonlyManager ? false : true,
					  caption: studio.getDictionaryItem("wm.EditPanel.CANCEL_CAPTION")});
	cancelButton.eventBindings.onclick = this.name + ".cancelEdit";
	this.$.binding.addWire(null, "cancelButton", cancelButton.getId(), "");
	if (!this.readonlyManager) {
	    cancelButton.$.binding.addWire(null, "disabled", "", "!\${" + this.name + ".isDirty}");
	}
	if (!noRefresh) {
	    buttonPanel.reflow();
	    studio.refreshDesignTrees();
	}
    },
    generateNewButton: function(buttonPanel, noRefresh) {
	if (!buttonPanel) buttonPanel = this._findButtonPanel();
	var newButton = new wm.Button({owner: this.owner,
				       name: studio.page.getUniqueName(this.name + "NewButton"),
				       parent: buttonPanel,
				       caption: studio.getDictionaryItem("wm.EditPanel.NEW_CAPTION")});
	newButton.eventBindings.onclick = this.name + ".editNewObject";
	this.$.binding.addWire(null, "newButton", newButton.getId(), "");

	if (!noRefresh) {
	    buttonPanel.reflow();
	    studio.refreshDesignTrees();
	}
    },
    generateEditButton: function(buttonPanel, noRefresh) {
	if (!buttonPanel) buttonPanel = this._findButtonPanel();
	var editButton = new wm.Button({owner: this.owner,
					  name: studio.page.getUniqueName(this.name + "EditButton"),
					  parent: buttonPanel,
					  caption: studio.getDictionaryItem("wm.ServiceForm.UPDATE_CAPTION")});
	editButton.eventBindings.onclick = this.name + ".editCurrentObject";
	editButton.$.binding.addWire(null, "disabled", this.name + ".noDataSet","");
	this.$.binding.addWire(null, "editButton", editButton.getId(), "");
	
	if (!noRefresh) {
	    buttonPanel.reflow();
	    studio.refreshDesignTrees();
	}
    },
    generateDeleteButton: function(buttonPanel, noRefresh) {
	if (!buttonPanel) buttonPanel = this._findButtonPanel();
	var deleteButton = new wm.Button({owner: this.owner,
					  name: studio.page.getUniqueName(this.name + "DeleteButton"),
					  parent: buttonPanel,
					  caption: studio.getDictionaryItem("wm.EditPanel.DELETE_CAPTION")});
	deleteButton.eventBindings.onclick = this.name + ".deleteData";
	deleteButton.$.binding.addWire(null, "disabled", this.name + ".noDataSet","");
	this.$.binding.addWire(null, "deleteButton", deleteButton.getId(), "");
	
	if (!noRefresh) {
	    buttonPanel.reflow();
	    studio.refreshDesignTrees();
	}
    },
    generateSaveButton: function(buttonPanel, noRefresh) {
	if (!buttonPanel) buttonPanel = this._findButtonPanel();
	var saveButton = new wm.Button({owner: this.owner,
					name: studio.page.getUniqueName(this.name + "SaveButton"),
					parent: buttonPanel,
					showing: this.readonlyManager ? false : true,
					caption: studio.getDictionaryItem("wm.EditPanel.SAVE_CAPTION")});
	saveButton.eventBindings.onclick = this.name + ".saveData";
	saveButton.$.binding.addWire(null, "disabled", "", "\${" + this.name + ".invalid} || !\${" + this.name + ".isDirty}");
	this.$.binding.addWire(null, "saveButton", saveButton.getId(), "");

	
	if (!noRefresh) {
	    buttonPanel.reflow();
	    studio.refreshDesignTrees();
	}
    },
    generateResetButton: function(buttonPanel, noRefresh) {
	if (!buttonPanel) buttonPanel = this._findButtonPanel();
	var resetButton = new wm.Button({owner: this.owner,
					name: studio.page.getUniqueName(this.name + "ResetButton"),
					parent: buttonPanel,
					showing: this.readonlyManager ? false : true,
					 caption: studio.getDictionaryItem("wm.DBForm.RESET_CAPTION")});
	resetButton.eventBindings.onclick = this.name + ".resetData";
	resetButton.$.binding.addWire(null, "disabled", "", "!\${" + this.name + ".isDirty}");
	this.$.binding.addWire(null, "resetButton", resetButton.getId(), "");

	
	if (!noRefresh) {
	    buttonPanel.reflow();
	    studio.refreshDesignTrees();
	}
    },

    generateButtons: function() {
	if (this.buttonPanel) this.buttonPanel.destroy();
	var buttonPanel = new wm.Panel({
	    owner: this.owner,
	    name: this.owner.getUniqueName(this.name + "ButtonPanel"),
	    parent: this,
	    layoutKind: "left-to-right",
	    width: "100%",
	    height: wm.Button.prototype.height,
	    horizontalAlign: "right",
	    verticalAlign: "top"});
	this.$.binding.addWire(null, "buttonPanel", buttonPanel.getId(), "");
	if (this.readonlyManager) {
	    if (this.formBehavior != "updateOnly") {
		this.generateNewButton(buttonPanel);
	    }
	    if (this.formBehavior != "insertOnly") {
		this.generateEditButton(buttonPanel,true);
	    }
	    if (this.formBehavior == "standard") {
		this.generateDeleteButton(buttonPanel,true);
	    }	    
	    this.generateCancelButton(buttonPanel, true);
	    this.generateSaveButton(buttonPanel, true);
	} else {
	    if (this.formBehavior == "standard") {
		this.generateDeleteButton(buttonPanel,true);
	    }	    
	    if (this.formBehavior == "standard") {
		this.generateNewButton(buttonPanel, true);
	    }
	    this.generateSaveButton(buttonPanel, true);
	    this.generateCancelButton(buttonPanel, true);
	}



	this.reflow();
	studio.refreshDesignTrees();

	// reflow called by caller
    }

});


wm.ServiceForm.extend({


    /****************
     * METHOD: set_dataSet (DESIGN)
     * DESCRIPTION: 
     *       1. Takes in a name of a variable and creates a binding from that variable to our dataSet property.
     *          The binding then immediately calls set_dataSet(wm.Variable).
     *       2. Takes in a Variable and makes it our dataSet property and updates our type and form fields
     ***************/
    set_dataSet: function(inDataSet) {
	this.inherited(arguments);
	if (inDataSet.input) {
	    this.service = inDataSet.service;
	}
    },
    /****************
     * METHOD: makePropEdit (DESIGNTIME)
     * DESCRIPTION: Generates property editors
     ***************/
    makePropEdit: function(inName, inValue, inEditorProps) {
	var prop = this.schema ? this.schema[inName] : null;
	var name =  (prop && prop.shortname) ? prop.shortname : inName;
	switch (inName) {
	case "insertOp":
	case "updateOp":
	case "deleteOp":
	    var service = this.serviceVariable._service;
	    if (service) {
		var valueOk = service && service.getOperation(inValue);
		var methods = service && service.getOperationsList();
	    } else {
		methods = ["No dataSet selected"];
	    }
	    if (!valueOk){
		inValue = methods ? methods[0] : "";
	    }
	    if (methods)
		return new wm.SelectMenu(dojo.mixin(inEditorProps, {options: methods}));
	    break;

	    }
	    return this.inherited(arguments);
	},


    _end: 0
});


wm.SubForm.extend({
    afterPaletteDrop: function() {
	this.inherited(arguments);
	var f = this.getParentForm();
	if (f) {
	    /* TODO: These should use setters to generate the bindings unless formField isn't set until later */
	    this.generateInputBindings = f.generateInputBindings;
	    this.generateOutputBindings = f.generateOutputBindings;

	    this.setReadonly(f.readonly);
	    this.setCaptionSize(f.captionSize);
	    this.setCaptionPosition(f.captionPosition);
	    this.setCaptionAlign(f.captionAlign);
	    this.setEditorWidth(f.editorWidth);
	    this.setEditorHeight(f.editorHeight);
	}
    },

	postInit: function(){
		this.inherited(arguments);
		this.initializeFormField();
	},
        initializeFormField: function(){
	    if (!this.formField)
	    {
		var ff = this.getUniqueFormField();
		if (ff && ff != '')
		    this.set_formField(ff);
	    }
	    	
	},
	getUniqueFormField: function(){
			var lf = wm.getParentForm(this);
			if (!lf)
				return '';
			var arr = this.getOptions();
			if (arr.length < 2)
				return arr[0];
			for (var i = 1; i < arr.length; i++){
				if (!lf.isFormFieldInForm(arr[i]))
					return arr[i];
			}
			
			return arr[1];
	},
	set_formField: function(inFieldName) {
		if (!inFieldName)
			delete this.formField;
		else
			this.formField = inFieldName;

	    this.removeAllControls();
	    var f = this.getParentForm();
	    if (f) {
		f.addEditorToForm(this);
	    }

	    if (inFieldName) {
	        var fieldSchema = this._getFieldSchema();
		this.type = fieldSchema.type;
	        if (fieldSchema && fieldSchema.isList) {
	            this.set_editingMode("one-to-many");
	        } else {
	            this.set_editingMode("one-to-one");
	        }
	    }

	},
	set_editingMode: function(inMode) {
	    this.editingMode = inMode;
	    if (this.editingMode == "one-to-one") {
		this.addEditors();
	    } else {
		//TODO handle grid...
		app.alert("Not yet implemented");
	    }

	},
	_getFieldSchema: function() {
		var f = this.getParentForm();
		if (!f) {
			console.debug('RelatedEditor "' + this.name + '" is not inside a live form.');
			return;
		}
	    var schema = f.getTypeSchema();
		if (!schema)
			return;
		return wm.typeManager.getPropertyInfoFromSchema(schema, this.formField);
	}
});

wm.Object.extendSchema(wm.SubForm, {
    formField: {group: "common", order: 500, editor: "wm.prop.FormFieldSelect", editorProps: {relatedFields: true}},
    editingMode: {hidden:true}
});