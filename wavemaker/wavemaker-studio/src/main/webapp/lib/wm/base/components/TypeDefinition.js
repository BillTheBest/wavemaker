/*
 *  Copyright (C) 2010-2011 VMware, Inc. All rights reserved.
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

dojo.provide("wm.base.components.TypeDefinition");
dojo.require("wm.base.Component");

dojo.declare("wm.TypeDefinitionField", wm.Component, {
    fieldType: "String", // options are "string/String", "Date", "Boolean", "any", "Number", as well as any more complex types.  Note that String/Number are not the same as StringType and NumberType; they are literals not objects.
    isObject: false, // boolean
    isList: false, // boolean 
    fieldName: "",
    init: function() {
        this.inherited(arguments);
        this.setFieldName(this.fieldName);
    },
    toTypeObj: function() {
        return {type: this.fieldType, isObject: this.isObject, isList: this.isList};
    },
    setFieldName: function(inFieldName) {
        this.fieldName = inFieldName;
        this._treeNodeName = inFieldName; // used by studio to show node in model tree
        if (!this._cupdating) {
            this.owner.doRemoveType();
            this.owner.doAddType();
        }
	if (this.isDesignLoaded() && !this._cupdating && studio.page)
	    studio.refreshComponentTree();
    },
    setFieldType: function(inType) {
        this.fieldType = inType || "String";
        if (!this._cupdating) {
            this.owner.doRemoveType();
            this.owner.doAddType();
        }
    },
    setIsObject: function(inIsObject) {
        this.isObject = inIsObject;
        if (!this._cupdating) {
            this.owner.doRemoveType();
            this.owner.doAddType();
        }
    },
    setIsList: function(inIsList) {
        this.isList = inIsList;
        if (!this._cupdating) {
            this.owner.doRemoveType();
            this.owner.doAddType();
        }
    },
    /* design time */
    addField: function() {
	this.owner.addField();
    }
});

wm.Object.extendSchema(wm.TypeDefinitionField, {
    owner: {ignore:1},
    addField: {operation:1},
    fieldName: {group: "widgetName", subgroup: "fields", order: 1},
    fieldType: {group: "widgetName", subgroup: "fields", order: 2, editor: "wm.prop.DataTypeSelect", editorProps: {useLiterals:1}},
    isList:  {group: "widgetName", subgroup: "fields", order: 3},
    isObject:  {group: "widgetName", subgroup: "fields", order: 4},
    addField:  {group: "widgetName", subgroup: "fields", order: 5, operation: true},
    documentation: {ignore: true},
    generateDocumentation: {ignore: true}
});

dojo.declare("wm.TypeDefinition", wm.Component, {
    internal: false,
    collection: "Fields",
    fields: null,
    init: function() {
	this.inherited(arguments);
	if (this.isDesignLoaded() && studio.application)
	    this.setOwner(studio.application);
    },
    // not init; must wait for page loader to load all subcomponents (typedefinitionfields) which postInit waits for
    postInit: function() {
/*
        for (var i in this.$) {
            this.$[i].parent = this;
        }
        */
	delete this.fields;
        this.doAddType();
    },
    doRemoveType: function() {
	if (!this.internal)
            wm.typeManager.removeType(this.name);
	if (this._isDesignLoaded)
	    studio.typesChanged();
    },
    doAddType: function() {
        this.fieldsAsTypes = {};
        for (var i in this.$) {
            this.fieldsAsTypes[this.$[i].fieldName] = this.$[i].toTypeObj();
        }
        wm.typeManager.addType(this.name, {internal: this.internal, fields: this.fieldsAsTypes});        
        //dojo.publish("TypeChange-" + this.name);
	if (this._isDesignLoaded) {
	    studio.typesChanged();
	    studio.refreshComponentTree();
	}
    },
    getCollection: function(inName) {
        if (!this.fields) {
            this.fields = [];
            for (var i in this.$) {
                this.fields.push(this.$[i]);
            }
        }
        return this.fields;
    },
    setName: function(inName) {
        this.doRemoveType();
        this.inherited(arguments);
        this.doAddType();
    }

});

wm.Object.extendSchema(wm.TypeDefinition, {
    addField: {group: "operation", order: 1, operation:true, requiredGroup:1},
    internal: {ignore: true}, // only way to set something as internal is to hardcode it into widgets.js; should only be internal if in use by studio to define a type for use by studio but not by the user
    owner: {ignore: true}
});

wm.TypeDefinition.extend({
        addField: function() {
            this.fieldsAsTypes = null;
	    var	defName = this.getUniqueName("field1");
            var field = new wm.TypeDefinitionField({name: defName, owner: this});

            this.fields = null; // force this to be recalculated
	    if (this._isDesignLoaded && !this._cupdating && studio.page) {
		studio.refreshComponentTree();
		studio.select(field);
	    }
            this.doRemoveType(); // old type def is missing this field
            this.doAddType(); // now we update the type def
        },
    removeComponent: function(inComponent) {
	if (this.$[inComponent.name]) {
	    this.inherited(arguments);
	    if (!this._isDestroyed) {
		delete this.fields;
		this.getCollection();
		this.doAddType();
	    }
	}
    }
});
