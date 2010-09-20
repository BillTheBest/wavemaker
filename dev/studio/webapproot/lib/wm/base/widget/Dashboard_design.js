dojo.provide("wm.base.widget.Dashboard_design");
dojo.require("wm.base.widget.Dashboard");
dojo.require("wm.base.widget.ContextMenuDialog");

wm.Dashboard.extend({
    themeable: false,
	configPortlets: "(Configure Portlets)",
	designCreate: function(){
		this.inherited(arguments);
		var defaultPortletParams = {isOpen:true, title:'Portlet', page:'', isClosable:true, x:0, y:0};
		this.updatePageList();
		this.headerAttr[2].dataStore = this.pageStore;
		this.contextMenu = new wm.ContextMenuDialog('Configure Portlets', 'Add Portlet', dojo.hitch(this, 'addNewPortlet'), 
													this.headerAttr, this.portlets, defaultPortletParams, this.domNode, true);
		dojo.connect(this.contextMenu, 'onPropChanged', this, 'portletPropChanged');
		dojo.connect(this.contextMenu, 'onRowDelete', this, 'destroyPortlet');
		if (!this.addDialogName)
			this.createAddWidgetDialog();
	},
	showMenuDialog: function(e){
		this.contextMenu.show();
	},
	portletPropChanged: function(Obj, prop, inValue, trObj){
		switch(prop){
			case 'isOpen':
				if (inValue){
					this.addNewPortlet(Obj);
				} else {
					this.destroyPortlet(Obj);
				}
				break;
			case 'title':
				var p = dijit.byId(Obj.portletId);
				if (!p)
					return;
				p.attr('title', inValue);					 
			  	break;
			case 'page':
				var p = dijit.byId(Obj.portletId);
				if (!p)
					return;
				p.wm_pageContainer.setPageName(inValue);
			  	break;
			case 'isClosable':
				var p = dijit.byId(Obj.portletId);
				if (!p)
					return;
				p.closeIcon.style.display = inValue ? 'block':'none';
			  	break;
		}
	},
	removePortlet: function(obj){
		this.destroyPortlet(Obj);
	},
	updatePageList: function(){
		var pages = wm.getPageList(false);
		var pageList = [];
		
		dojo.forEach(pages, function(pageName){
			pageList.push({name:pageName, value:pageName});
		});

		if (!this.pageStore){
			var storeData = {identifier: 'value', label: 'name', value: 'value', items: pageList};
			this.pageStore = new dojo.data.ItemFileWriteStore({data: storeData});
		} else {
			this.pageStore.attr('data', pageList);
		}
	},
	makePropEdit: function(inName, inValue, inDefault) {
		switch (inName) {
		case "configPortlets":
			return makeReadonlyButtonEdit(inName, inValue, inDefault);
		}
		return this.inherited(arguments);
	},
	editProp: function(inName, inValue, inInspector) {
		switch (inName) {
			case "configPortlets":
				return this.showMenuDialog();
		}
		return this.inherited(arguments);
	},
	writeProps: function(){
		try{
			var props = this.inherited(arguments);
			var pList = this.contextMenu.getUpdatedDataSet();
			this.updatePortletXY();
			var writePortlets = [];		
			dojo.forEach(pList, function(obj){
				var coord = this.portletXY[obj.portletId];
				if (coord){
					obj.x = coord.x;
					obj.y = coord.y;
				}
				
				var wObj = dojo.clone(obj);
				delete wObj.portletId;
				writePortlets.push(wObj);
			}, this);
			props.portlets = writePortlets;
			return props;
		} catch(e){
			console.info('Error while saving dashboard data..............', e);
		}
	}
});

wm.Dashboard.description = "A dojo Grid Container that is used as a dashboard element.";

wm.Object.extendSchema(wm.Dashboard, {
	caption:{ignore:1},
	disabled:{ignore:1},
	dataValue:{ignore:1},
	minWidth:{ignore:1},
	portlets:{ignore:1},
	dijitPortlets:{ignore:1},
	addDialogName:{hidden:true},
	headerAttr:{ignore:1},
	configPortlets: { group: "edit", order: 10 }
});

