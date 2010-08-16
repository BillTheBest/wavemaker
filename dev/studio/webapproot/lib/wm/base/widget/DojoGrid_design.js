dojo.provide("wm.base.widget.DojoGrid_design");
dojo.require("wm.base.widget.DojoGrid");

wm.DojoGrid.extend({
	editColumns: "(Edit Columns)",
	fieldOptions: [	{name:'Text',value:'dojox.grid.cells._Widget'},
		           	{name:'Number',value:'dojox.grid.cells.NumberTextBox'},
	                {name:'Date',value:'dojox.grid.cells.DateTextBox'},
	                {name:'Checkbox',value:'dojox.grid.cells.Bool'}	],
	headerAttr: [{id:'show', title:' ',width:'2%', type:'checkbox'}, 
				{id:'id', title: 'Field',width:'20%', type:'text', readOnly:true}, 
				{id:'title', title: 'Title',width:'20%', type:'text'}, 
				{id:'width', title: 'Width',width:'5%', type:'text'}, 
				{id:'align', title: 'Alignment',width:'10%', type:'dropdown'},
				{id:'formatFunc', title: 'Formatter',width:'10%', type:'dropdown'},
				{id:'fieldType', title: 'Edit Field Type',width:'10%', type:'dropdown'},
				{id:'editable', title:'Edit',width:'2%', type:'checkbox'}, 
				{id:'expression', title: 'Data Expression',width:'20%', type:'text'}],
	showAddButton: false,
	showDeleteButton:false,
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
		} else
			this.setDataSet(inDataSet);
	},
	designCreate: function() {
		// if this is being created in studio, supply a default caption
		if (this._studioCreating)
			this.studioCreate();
		this.inherited(arguments);

		this.headerAttr[4].dataStore = this.getAlignmentTypeStore();
		this.updateFormatterList();
		this.headerAttr[5].dataStore = this.formatterStore;

		this.updateFieldTypeList(this.fieldOptions);
		this.headerAttr[6].dataStore = this.fieldTypeStore;
		var defaultCustomFieldParams = {id: 'customField', isCustomField: true, expression: '', show:true, width:'auto'};
		this.contextMenu = new wm.ContextMenuDialog('DojoGrid Column Properties', 'Add Column', dojo.hitch(this, 'addNewColumn'), 
													this.headerAttr, this.columns, defaultCustomFieldParams, this.domNode, true);
		dojo.connect(this.contextMenu, 'onPropChanged', this, 'columnPropChanged');
		dojo.connect(this.contextMenu, 'onRowDelete', this, 'destroyColumn');
		dojo.connect(this.contextMenu, 'onAddNewColumnSuccess', this, 'columnAddSuccess');
	},
	showMenuDialog: function(e){
		this.updateFormatterList();
		this.contextMenu.show();
	},
	columnPropChanged: function(){
		this.updateGridStructure();		
	},
	destroyColumn: function(){
		this.updateGridStructure();		
	},
	columnAddSuccess: function(){
		this.updateGridStructure();		
	},
	updateFormatterList: function(){
		var fArray = [{name:'', value:''},{name:'Date (WaveMaker)', value:'wm_date_formatter'},{name:'Number (WaveMaker)', value:'wm_number_formatter'}];
		dojo.forEach(getAllEventsInCode(), function(f){
			fArray.push({name:f, value:f});			
		});

		var data = {identifier: 'value', label: 'name', value: 'value', items: fArray};
		if (!this.formatterStore){
			this.formatterStore = new dojo.data.ItemFileReadStore({data: data});
		} else {
			this.formatterStore.reload(data);
		}
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
		var fieldTypeData = {identifier: 'value', label: 'name', value: 'value', items: [{name:'Left', value:'left'},{name:'Center', value:'center'},{name:'Right', value:'right'}]};
		return new dojo.data.ItemFileReadStore({data: fieldTypeData});
	},
	getNewColumnId: function(cId){
		if (!this.columnIds){
			this.columnIds = {};
			this.columnIds[cId] = true;
			return cId;
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
		var customField = {id: this.getNewColumnId('customField'), isCustomField: true, expression: '', show:true, width:'auto'};
		return customField;		
	},
	addDialogForInsert: function(){
		try{
			if (!this.showAddButton){
				return;
			}
				
			if (!this.addDialog){
				this.addDialogName = studio.page.getUniqueName(this.name+"_AddDialog");
				this.addDialog = new wm.Dialog({width:320, height:95, name: this.addDialogName, 
												border:2, borderColor: "rgb(80,80,80)", 
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
		this.dojoObj.attr('structure', this.getStructure());
		this.dojoObj.render();
	},
	_onMoveColumn: function(arg1, arg2, oldPos, newPos){
		var sArray = this.contextMenu.getUpdatedDataSet();
		var tmp=sArray[oldPos];
		sArray.splice(oldPos,1);
		sArray.splice(newPos,0,tmp);
		this.contextMenu.setDataSet(sArray);
		wm.fire(studio.inspector, "reinspect");
	},
	makePropEdit: function(inName, inValue, inDefault) {
		switch (inName) {
		case "selectionMode":
			return makeSelectPropEdit(inName, inValue, ["single", "multiple", "extended", "none"], inDefault);
		case "editColumns":
			return makeReadonlyButtonEdit(inName, inValue, inDefault);
		}
		return this.inherited(arguments);
	},
	editProp: function(inName, inValue, inInspector) {
		switch (inName) {
			case "editColumns":
				return this.showMenuDialog();
		}
		return this.inherited(arguments);
	},
	writeProps: function(){
		try{
			var props = this.inherited(arguments);
			props.columns = this.contextMenu.getUpdatedDataSet();
			return props;
		} catch(e){
			console.info('Error while saving dashboard data..............', e);
		}
	}
	
});

wm.Object.extendSchema(wm.DojoGrid, {
	variable: { ignore: 1 },
	caption:{ignore:1},
	scrollX:{ignore:1},
	scrollY:{ignore:1},
	disabled:{ignore:1},
	query: {ignore:1},
	editColumns:{group: "edit", order:40},
	store:{ignore:1},
	menu:{ignore:1},
	storeGUID:{ignore:1},
	dataValue:{ignore:1},
	selectedItem: {ignore:1, bindSource: 1, simpleBindProp: true },
	emptySelection: { ignore: true, bindSource: 1, type: "Boolean" },
	dataSet: {bindTarget: 1, group: "edit", order: 30, isList: true},
	selectionMode: {group: "edit", order: 31},
	rightClickTBody: {ignore:1},
	addDialogName:{hidden:true},
	addFormName:{hidden:true},
	dsType:{hidden:true},
	columns:{ignore:1}
});
