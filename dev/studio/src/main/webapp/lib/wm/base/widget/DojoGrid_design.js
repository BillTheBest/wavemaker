/*
 * Copyright (C) 2010-2011 VMware, Inc. All rights reserved.
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
 

dojo.provide("wm.base.widget.DojoGrid_design");
dojo.require("wm.base.widget.DojoGrid");

wm.DojoGrid.extend({
	editColumns: "(Edit Columns)",
    showAddDialog: "(Show Dialog)",
	fieldOptions: [	{name:'',value:''},
			{name:'Text',value:'dojox.grid.cells._Widget'},
		           	{name:'Number',value:'dojox.grid.cells.NumberTextBox'},
	                {name:'Date',value:'dojox.grid.cells.DateTextBox'},
	                {name:'Checkbox',value:'dojox.grid.cells.Bool'},
	                {name:'ComboBox',value:'dojox.grid.cells.ComboBox'}
		      ],
    /* TODO: Localize */
	    defaultFormatters:[	{name:'', value:''},
				{name:'Currency (WaveMaker)', value:'wm_currency_formatter'},
				{name:'Date (WaveMaker)', value:'wm_date_formatter'},
				{name:'Date LocalTime (WaveMaker)', value:'wm_localdate_formatter'},
				{name:'Time (WaveMaker)', value:'wm_time_formatter'},
				{name:'Number (WaveMaker)', value:'wm_number_formatter'},
				{name:'Image (WaveMaker)', value:'wm_image_formatter'},
				{name:'Link (WaveMaker)', value:'wm_link_formatter'}],
    //showAddButton: false,
    //showDeleteButton:false,
    themeableStyles: [],
    themeableSharedStyles: ["-Even Rows", "Row-Background-Color","Row-Font-Color",
			    "-Odd Rows","Row-Background-Odd-Color","Row-Font-Odd-Color",
			    "-Hover Row", "Row-Background-Hover-Color","Row-Font-Hover-Color",
			    "-Selected Row", "Row-Background-Selected-Color", "Row-Font-Selected-Color", 
			    "-Misc", "Row-Border-Color", 
			    "-Header Styles", "Header-Background-Color", "Header-Font-Color", "Header-Image", "Header-Image-Position","Header-Image-Repeat"],
	afterPaletteDrop: function() {
		this.caption = this.caption || this.name;
		this.renderDojoObj();
	},
	set_dataSet: function(inDataSet) {
		// support setting dataSet via id from designer
		if (inDataSet && !(inDataSet instanceof wm.Variable)) {
			var ds = this.getValueById(inDataSet);
			if (ds)
				this.components.binding.addWire("", "dataSet", ds.getId());
		} else if (!inDataSet && !this._cupdating) {
		    this.components.binding.removeWireByProp("dataSet");
		    this.setDataSet(inDataSet);
		} else {
		    this.setDataSet(inDataSet);
		}
	},
	listProperties: function() {
	    var props = this.inherited(arguments);
	    props.dataSet.type = "Object";// should be able to bind to ANY type of variable (as long as its a list); could not find where this value is set to the dataset's type, but I don't want that happening.
	    return props;
	},
	designCreate: function() {
		// if this is being created in studio, supply a default caption
		if (this._studioCreating)
			this.studioCreate();
		this.inherited(arguments);

	    if (!this.headerAttr) {
		this.headerAttr = 
		    [{id:'show', title:' ',width:'10px', type:'checkbox'}, 
		     {id:'id', width:'150px', type:'text', readOnly:true,
		      title: studio.getDictionaryItem("wm.DojoGrid.CONFIG_ID")},

		     {id:'title',width:'150px', type:'text',
		      title:  studio.getDictionaryItem("wm.DojoGrid.CONFIG_TITLE")},
		     {id:'width', width:'109px', type:'width',
		      title:  studio.getDictionaryItem("wm.DojoGrid.CONFIG_WIDTH")},
		     {id:'align',width:'70px', type:'dropdown',
		      title:  studio.getDictionaryItem("wm.DojoGrid.CONFIG_ALIGN")},
		     {id:'formatFunc',width:'150px', type:'dropdown',
		      title:  studio.getDictionaryItem("wm.DojoGrid.CONFIG_FORMAT")},
		     {id:'fieldType',width:'100px', type:'dropdown', isAdvanced:true,
		      title:  studio.getDictionaryItem("wm.DojoGrid.CONFIG_TYPE")},
		/*				{id:'editable', title:'Editable',width:'10px', type:'checkbox', isAdvanced:true}, */
		/*		                {id: 'editParams', title: "Edit Parameters", width: "100px", type: 'gridEditParams', isAdvanced: true},*/
		     {id:'expression', width:'150px', type:'text', isAdvanced:true,
		      title:  studio.getDictionaryItem("wm.DojoGrid.CONFIG_EXPR")}];
	    }

		this.headerAttr[4].dataStore = this.getAlignmentTypeStore();
		this.updateFormatterList();
		this.headerAttr[5].dataStore = this.formatterStore;

		this.updateFieldTypeList(this.fieldOptions);
		this.headerAttr[6].dataStore = this.fieldTypeStore;
		var defaultCustomFieldParams = {id: 'customField', isCustomField: true, expression: '', show:true, width:'100%'};
	    var helpText = studio.getDictionaryItem("wm.DojoGrid.HELP_TEXT");
	    var addColumnLabel = studio.getDictionaryItem("wm.DojoGrid.ADD_COLUMN_LABEL");
	    var dialogTitle =  studio.getDictionaryItem("wm.DojoGrid.EDIT_COLUMNS_DIALOG_TITLE");
	    this.contextMenu = new wm.ContextMenuDialog({addButtonLabel: addColumnLabel, 
							 onAddButtonClick: dojo.hitch(this, 'addNewColumn'), 
							 headerAttr: this.headerAttr, 
							 dataSet: this.columns, 
							 newRowDefault: defaultCustomFieldParams, 
							 addDeleteColumn: true, 
							 helpText: helpText, 
							 containerNodeWidth: 700});
	        this.contextMenu.setWidth("710px");
	    this.contextMenu.setTitle(dialogTitle);

		//this.contextMenu.showModal = false;
		dojo.connect(this.contextMenu, 'onPropChanged', this, 'columnPropChanged');
		dojo.connect(this.contextMenu, 'onRowDelete', this, 'destroyColumn');
		dojo.connect(this.contextMenu, 'onAddNewColumnSuccess', this, 'columnAddSuccess');
	},
	showMenuDialog: function(e){
		this.updateFormatterList();
		this.contextMenu.show();
	},
	columnPropChanged: function(obj, columnId, inValue, trObj, widget){
		if (columnId && columnId == 'width' && !isNaN(dojo.number.parse(inValue))){
				obj.width = inValue+'px';
		}
		
		var addFormatter = false;
	        /* TODO: Localize?? */
		if (columnId && columnId == 'formatFunc' && inValue == "- Add Formatter"){
		    var evtName = wm.getValidJsName(this.name + wm.getValidJsName(wm.capitalize(obj.id)) + 'Format');
			obj.formatFunc = evtName;
			widget.attr('value', evtName, false);
			addFormatter = true;
		} /*else if (columnId == "fieldType") {
		    switch(inValue) {
		    case "dojox.grid.cells.ComboBox":
			dojo.query(".EditorTextOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorNumberOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorDateOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorComboOptions", trObj)[0].style.display = "block";
			break;
		    case "dojox.grid.cells.DateTextBox":
			dojo.query(".EditorTextOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorNumberOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorDateOptions", trObj)[0].style.display = "block";
			dojo.query(".EditorComboOptions", trObj)[0].style.display = "none";
			break;
		    case "dojox.grid.cells.NumberTextBox":
			dojo.query(".EditorTextOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorNumberOptions", trObj)[0].style.display = "block";
			dojo.query(".EditorDateOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorComboOptions", trObj)[0].style.display = "none";
			break;
		    case "dojox.grid.cells.Bool":
			dojo.query(".EditorTextOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorNumberOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorDateOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorComboOptions", trObj)[0].style.display = "none";
			break;
		    case "dojox.grid.cells._Widget":
			dojo.query(".EditorTextOptions", trObj)[0].style.display = "block";
			dojo.query(".EditorNumberOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorDateOptions", trObj)[0].style.display = "none";
			dojo.query(".EditorComboOptions", trObj)[0].style.display = "none";
			break;
		    }


		}
		    */		
		this.updateGridStructure();		
		if (addFormatter) {
			this.contextMenu.hide();
			eventEdit(this, '_formatterSignature', evtName, true);
		}	
	    wm.onidle(studio, "updateCanvasDirty");
	},
	_formatterSignature: function(inValue, rowId, cellId, cellField, cellObj, rowObj){
	},
	destroyColumn: function(){
		this.updateGridStructure();		
	},
	columnAddSuccess: function(){
		this.updateGridStructure();		
	},
	updateFormatterList: function(){
		var fArray = dojo.clone(this.defaultFormatters);
		dojo.forEach(getAllEventsInCode(), function(f){
		    if (f.match(/Format$/))
			fArray.push({name:f, value:f});			
		});

	    fArray.push({name: studio.getDictionaryItem("wm.DojoGrid.ADD_FORMATTER"), value:'- Add Formatter'});

		var data = {identifier: 'value', items: fArray};
		if (this.formatterStore)
		    delete this.formatterStore; // no destroy method
	        this.formatterStore = new dojo.data.ItemFileReadStore({data: data});

	},
	updateFieldTypeList: function(options){
		if (!this.fieldTypeStore){
			var fieldTypeData = {identifier: 'value', label: 'name', value: 'value', items: options};
			this.fieldTypeStore = new dojo.data.ItemFileWriteStore({data: fieldTypeData});
		} else {
			this.fieldTypeStore.attr('data', options);
		}
	},
	getAlignmentTypeStore: function(){
	    /* TODO: Localize: Need to get the default value to use name instead of value */
		var fieldTypeData = {identifier: 'value', label: 'name', value: 'value', 
				     items: [{name:studio.getDictionaryItem("wm.DojoGrid.COLUMN_ALIGN_LEFT"), value:'left'},
					     {name:studio.getDictionaryItem("wm.DojoGrid.COLUMN_ALIGN_CENTER"), value:'center'},
					     {name:studio.getDictionaryItem("wm.DojoGrid.COLUMN_ALIGN_RIGHT"), value:'right'}]};
		return new dojo.data.ItemFileReadStore({data: fieldTypeData});
	},
	getNewColumnId: function(cId){
		if (!this.columnIds){
			this.columnIds = {};
			dojo.forEach(this.columns, function(col){
				if(col.id.indexOf(cId) != -1)
					this.columnIds[col.id] = true;				
			}, this);
		}

		if (!this.columnIds[cId]){
			this.columnIds[cId] = true;
			return cId;
		}

		var c = 1;
		while(this.columnIds['customField' + c]){
			c++;
		}
		
		this.columnIds['customField' + c] = true;
		return 'customField' + c;
	},
	setShowAddButton: function(inValue){
		this.showAddButton = inValue;
		this.updateDOMNode();
		this.renderDojoObj();
		this.addDialogForInsert();
	},
	setShowDeleteButton: function(inValue){
		this.showDeleteButton = inValue;
		this.updateDOMNode();
		this.renderDojoObj();
	},
	setSingleClickEdit: function(inValue){
		this.singleClickEdit = inValue;
		if (this.dojoObj)
			this.dojoObj.singleClickEdit = this.singleClickEdit;
		this.dojoObj.render();
	},
	addNewColumn: function(){
		var customField = {id: this.getNewColumnId('customField'), isCustomField: true, expression: '', show:true, width:'100%'};
		return customField;		
	},
	addDialogForInsert: function(){
	    try{
		if (!this.showAddButton){
		    return;
		}
				
		if (!this.addDialog){
		    this.addDialogName = studio.page.getUniqueName(this.name+"_AddDialog");
		    this.addDialog = new wm.Dialog({width:320, 
						    height:95, 
						    name: this.addDialogName, 
						    fitToContentHeight: true,
						    border:2, 
						    borderColor: "rgb(80,80,80)", 
						    parent: this, owner: this, 
						    modal: false, animateSlide:true});
		}
			
		if (!this.liveForm && this.variable instanceof wm.LiveVariable){
		    this.addFormName = studio.page.getUniqueName(this.name+"_AddForm");
		    this.liveForm = new wm.LiveForm({
			name: this.addFormName,
			owner: this.owner,
			parent: this.addDialog,
			verticalAlign: "top",
			horizontalAlign: "left",
			_liveSource: this.variable.liveSource
		    });
		    
		    this.liveForm.createLiveSource(this.liveForm._liveSource);
		    this.liveForm.beginDataInsert();
		    this.addDialog.setHeight(this.liveForm.height);
		}
	    }
	    catch(e){
		console.info('error while creating dialog and live variable: ', e);
	    }			
	},
	updateGridStructure: function(){
	    this.columns = this.contextMenu.getUpdatedDataSet();
	    if (this.dojoObj) {
		this.dojoObj.attr('structure', this.getStructure());
		this.dojoObj.render();
	    }
	},
	_onResizeColumn: function(idx, inDrag, delta){
	        var sArray = this.columns;
		sArray[idx].width = delta.w + 'px';
	        if (this.contextMenu)
		    this.contextMenu.setDataSet(sArray);
		wm.fire(studio.inspector, "reinspect");
	},
	_onMoveColumn: function(arg1, arg2, oldPos, newPos){
	        var sArray = this.columns;
		var tmp=sArray[oldPos];
		sArray.splice(oldPos,1);
		sArray.splice(newPos,0,tmp);
	        if (this.contextMenu)
		    this.contextMenu.setDataSet(sArray);
		wm.fire(studio.inspector, "reinspect");
	},


	makePropEdit: function(inName, inValue, inDefault) {
	    var prop = this.schema ? this.schema[inName] : null;
	    var name =  (prop && prop.shortname) ? prop.shortname : inName;
		switch (inName) {
			case "dataSet":
		    return new wm.propEdit.DataSetSelect({component: this, name: inName, value: this.$.binding.wires.dataSet ? this.$.binding.wires.dataSet.source : "", allowAllTypes: true, listMatch: true});
/*
		case "selectionMode":
			return makeSelectPropEdit(inName, inValue, ["single", "multiple", "extended", "none"], inDefault);
			*/
		case "updateNow":
		    return makeReadonlyButtonEdit(name, inValue, inDefault);
		case "editColumns":
			return makeReadonlyButtonEdit(name, inValue, inDefault);
		   case "showAddDialog":
		       return makeReadonlyButtonEdit(name, inValue, inDefault);
		}
		return this.inherited(arguments);
	},
	editProp: function(inName, inValue, inInspector) {
		switch (inName) {
			case "updateNow":
				return this.update();
			case "editColumns":
				return this.showMenuDialog();
		        case "showAddDialog":
		    if (this.addDialog)
			this.addDialog.show();
		    else
			this.addDialogForInsert();
		    return;
		}
		return this.inherited(arguments);
	},
	update: function() {
		var ds = this.getValueById((this.components.binding.wires["dataSet"] || 0).source);
		wm.fire(ds, "update");
	},

    get_columns: function() {
	return this.columns || [];
	//return this.contextMenu ? this.contextMenu.getUpdatedDataSet() : this.columns || [];
    },
    get_localizationStructure: function() {
	var l = this.localizationStructure = {};
	if (studio.languageSelect.getDisplayValue() == "default") {
	    return l;
	} else {
	    for (var i = 0; i < this.columns.length; i++) {
		var c = this.columns[i];
		l[c.id] = c.title;
	    }
	    return l;
	}	
    }
/*
	writeProps: function(){
		try{
		    var props = this.inherited(arguments);
		    props.columns = this.contextMenu ? this.contextMenu.getUpdatedDataSet() : [];
		    if (props.columns.length == 0)
			props.columns = this.columns;
		    return props;
		} catch(e){
			console.info('Error while saving dashboard data..............', e);
		}
	}
	*/
});

wm.Object.extendSchema(wm.DojoGrid, {
    rendering: {ignore: 1},
	variable: { ignore: 1 },
	caption:{ignore:1},
	scrollX:{ignore:1},
	scrollY:{ignore:1},
	disabled:{ignore:1},
	query: {ignore:1},
    editColumns:{group: "edit", order:40, contextMenu: true},
    //showAddDialog:{group: "edit", order:40},
    showAddDialog: {ignore: true}, // will unignore once this feature is ready
    singleClickEdit: {group: "edit", order: 32},
    caseSensitiveSort: {group: "display", order: 40},
    selectFirstRow: {group: "display", order: 41},
	store:{ignore:1},
	menu:{ignore:1},
	storeGUID:{ignore:1},
	dataValue:{ignore:1},
    updateNow: {group:"operation"},
    selectedItem: {ignore:1, bindSource: 1, simpleBindProp: true, doc: 1},
    emptySelection: { ignore: true, bindSource: 1, type: "Boolean",  doc: 1},
    isRowSelected: { ignore: true, bindSource: 1, type: "Boolean",   doc: 1},
    dataSet: {bindTarget: 1, group: "edit", order: 30, isList: true, simpleBindTarget: true, doc: 1},
/* TODO: Localize */
    selectionMode: {group: "edit", order: 31, options: ["single", "multiple", "extended", "none"]},
    rightClickTBody: {ignore:1},
    addDialogName:{hidden:true},
    addFormName:{hidden:true},
    dsType:{hidden:true},
    columns:{writeonly:1, nonlocalizable: true},
    localizationStructure: {hidden:true},
    select: {group: "method"},
    deselectAll: {group: "method"},
    getSelectedIndex:{group: "method", returns: "Number"},
    getRow: {group: "method", returns: "Object"},
    findRowIndexByFieldValue:  {group: "method", returns: "Number"},
    getCell:  {group: "method", returns: "String"},
    setCell:  {group: "method"},
    editCell:  {group: "method"},
    deleteRow:  {group: "method"},
    addRow:  {group: "method"},
    addEmptyRow:  {group: "method"},
    getRowCount: {group: "method", returns: "Number"},
    getDataSet: {group: "method", returns: "wm.Variable"},
    setDataSet: {group: "method"},
    showCSVData: {group: "method"},
    setSortIndex:{group: "method"},
    setSortField:{group: "method"},

    onMouseOver: {ignore: 1},
    onMouseOut: {ignore: 1},
    onRightClick: {ignore: 1}
});
