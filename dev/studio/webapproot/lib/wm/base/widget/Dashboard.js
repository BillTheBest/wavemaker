/*
 *  Copyright (C) 2008-2010 WaveMaker Software, Inc.
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
dojo.provide("wm.base.widget.Dashboard");

dojo.declare("wm.Dashboard", wm.Control, {
	margin: 4,
	width:'100%',
	height:'100%',
	dojoObj:null,

	hasResizableColumns:false,
	opacity:0.3,
	nbZones:3,
	allowAutoScroll:true,
	withHandles:true,
	minChildWidth:200,
	minColWidth:10,

	saveInCookie:true,
	portlets:[],
	dijitPortlets:[],
	headerAttr: [{id:'isOpen', title:'Default',width:'10%', type:'checkbox'}, 
				{id:'title', title: 'Title',width:'30%', type:'text'}, 
				{id:'page', title: 'Page',width:'30%', type:'dropdown'}, 
				{id:'isClosable', title: 'Closable',width:'10%', type:'checkbox'}],
	
	init: function() {
		dojo['require']("dojox.layout.GridContainer");
		dojo['require']("dojox.widget.Portlet");
		this.inherited(arguments);
	},
	postInit: function() {
		this.inherited(arguments);
		this.initAddWidgetDialog();
		var thisObj = this;
		dojo.addOnLoad(function(){thisObj.renderDojoObj();});
	},
	initAddWidgetDialog: function(){
		if (this.addDialogName){
			this.addDialog = this.owner[this.addDialogName];
			this.selectEditor = this.addDialog.components[this.name+'_selectEditor'];
			this.okButton = this.addDialog.components['okButton'];
			this.cancelButton = this.addDialog.components['cancelButton'];
		}

		if (this.isDesignLoaded() || !this.selectEditor)
			return;
		var e = this.selectEditor.editor;
		var eData = [];
		dojo.forEach(this.portlets, function(obj){
			eData.push({name: obj.title,dataValue: obj});
		});
		
		var ds = e.dataSet = new wm.Variable({ name: "optionsVar", owner: e, type: "EntryData" });
		ds.setData(eData);
		e.displayField = "name";
		e.dataField = "dataValue";
		e.createEditor();
		dojo.connect(this.okButton, 'onclick', this, '_onOkClick');
		dojo.connect(this.cancelButton, 'onclick', this, '_onCancelClick');
	},
	_onOkClick: function(){
		var props = this.selectEditor.getDataValue();
		props.isOpen = true;
		if (props)
			this.addNewPortlet(props);
		this.addDialog.dismiss();
	},
	_onCancelClick: function(){
		this.addDialog.dismiss();
	},
	/*
    renderBounds: function() {
	    this.inherited(arguments);
	    this.resizeDijit();
	},
	resizeDijit: function() {
		if (this.dojoObj)
			this.dojoObj.resize();
	},
	*/
	renderDojoObj: function() {
		if (this.dojoObj != null){
			this.dojoObj.destroy();
		}

		var props = {
			acceptTypes:['dojox.widget.Portlet','dojox.widget.FeedPortlet'],
			handleClasses:["dijitTitlePaneTitle"],
			isAutoOrganized:false,
			hasResizableColumns:this.hasResizableColumns,
			opacity:this.opacity,
			nbZones:this.nbZones,
			allowAutoScroll:this.allowAutoScroll,
			withHandles:this.withHandles,
			minChildWidth:this.minChildWidth,
			minColWidth:this.minColWidth,
			style:"width:100%;height:100%;",
			"class":"soria"
		};

		this.dojoObj = new dojox.layout.GridContainer(props, dojo.create('div', {}, this.domNode));
		this.connectDojoEvents();
		this.dojoRenderer();
		this.renderPortlets();
	},
	dojoRenderer: function (){
		if (!this.dojoObj)
			return;
		this.dojoObj.startup();
	},
	renderPortlets: function(){
		var visiblePortlets = [];
		if (!this.isDesignLoaded() && this.saveInCookie){
			strPortletList = dojo.cookie(this.name + '_portlets');
			if (strPortletList && strPortletList != '')
				visiblePortlets = dojo.fromJson(strPortletList);
		}
		
		if (visiblePortlets.length < 1){
			dojo.forEach(this.portlets, function(p){
				if (p.isOpen)
					visiblePortlets.push(p);
			});
		}
		
		if (!this.isDesignLoaded())
			this.onBeforeRenderPortlet(visiblePortlets);
		for (var i = 0; i < visiblePortlets.length; i++){
			this.addNewPortlet(visiblePortlets[i]);
		}
	},
	onBeforeRenderPortlet: function(portlets){
	},
	connectDojoEvents: function(){
	},
	addNewPortlet: function(props){
		//props: {isOpen:true,title:'Portlet 1',page:'Page_widget_1',isClosable:false, x:0, y:0}
		if (!props.isOpen)
			return;
		props.title = this.getNewPortletTitle(props.title);
		var portletProps = {'title':props.title, 'class':'soria', 'dndType': 'Portlet'};
		if (!this.isDesignLoaded()){
			portletProps.closable = props.isClosable;			
		}
		
		var portlet = new dojox.widget.Portlet(portletProps, dojo.create('div'));
		portlet.wmProps = props;
		if (this.isDesignLoaded()){
			props.portletId = portlet.id;
			portlet.closeIcon.style.display = props.isClosable ? 'block' : 'none';
		}
		
		portlet.containerNode.style.padding = '0px';
		/*
		if (this.isDesignLoaded()){
			var s = new dojox.widget.PortletSettings();
			dojo.connect(s, 'toggle', this, '_togglePortlet');
			dojo.create('div', {innerHTML:'title edit <br> Page Container name', style:'height:100px'}, s.containerNode);
			portlet.addChild(s);
		}
		*/
		
		this.dojoObj.addService(portlet,props.x || 0, props.y || 0);
	    portlet.wm_pageContainer = new wm.PageContainer({loadParentFirst: false, owner: this, parentNode: portlet.containerNode, isRelativePositioned:true});
        if (props.page)
			portlet.wm_pageContainer.setPageName(props.page);

		if (!this.isDesignLoaded()){
		    dojo.connect(portlet, 'onClose', this, 'portletClosed');
		    portlet.subscribe("/dnd/drop", dojo.hitch(this, '_onDashboardChange'));
			this._onDashboardChange();
		}	
		
		this.dijitPortlets.push(portlet);		
		return props;
	},
	getNewPortletTitle: function(inTitle){
		if (!this.pTitles){
			this.pTitles = {};
			this.pTitles[inTitle] = true;
			return inTitle;
		}

		if (!this.pTitles[inTitle]){
			this.pTitles[inTitle] = true;
			return inTitle;
		}

		var c = 1;
		while(this.pTitles[inTitle + ' ' + c]){
			c++; 
		}
		
		this.pTitles[inTitle + ' ' + c] = true;
		return inTitle + ' ' + c;
		
	},
	portletClosed: function(e){
		var p = dijit.getEnclosingWidget(e.target);
		if (p)
			p.destroy();
		this._onDashboardChange(e);
	},
	_onDashboardChange: function(e){
		var pList = this.updatePortletXY();
		console.info('saving in cookie....', pList);
		if (this.saveInCookie)
			dojo.cookie(this.name + '_portlets', dojo.toJson(pList), {expires:5});
		this.onDashboardChange(pList);
	},
	onDashboardChange: function(activePortlets){
	},
	_togglePortlet: function(evt){
		var p = dijit.getEnclosingWidget(evt.originalTarget);
		dojo.toggleDOM(p.containerNode);
	},
	destroyPortlet: function(props){
		var p = dijit.byId(props.portletId);
		delete props.portletId;
		if (p)
			p.destroy();
	},
	updatePortletXY: function(){
		this.portletXY = {};
		var _this = this;
		var currentPortletList = [];
	    dojo.forEach(this.dojoObj.grid, function(colObj, x){
	      dojo.forEach(colObj.getAllNodes(), function(domPort, y){
	        var portlet = dijit.getEnclosingWidget(domPort);
			var wmProps = portlet.wmProps;
	        if (portlet){
				_this.portletXY[portlet.id] = {x:x, y:y};
				wmProps.x = x;
				wmProps.y = y;
				currentPortletList.push(wmProps);
	        }
	      });
	    });
		
		return currentPortletList;
	},
	destroy: function(){
		this.inherited(arguments);
		if (this.addDialog){
			this.addDialog.destroy();
			delete this.addDialog;
		}
	}
});

dojo.toggleDOM = function(domNode, animate){
	// summary: 
	//		Toggles the visibility of domNode.
	var n = domNode;
	if(dojo.style(n, "display") == "none"){
		if (animate){
			dojo.style(n, {"display": "block",	"height": "1px","width": "auto"});
			dojo.fx.wipeIn({node: n}).play();
		} else {
			dojo.style(n, {"display": "block"});
		}

	}else{
		if (animate){
			dojo.fx.wipeOut({
				node: n,
				onEnd: dojo.hitch(this, function(){
					dojo.style(n,{"display": "none", "height": "", "width":""});
				}
			)}).play();
		} else {
			dojo.style(n, {"display": "none"});
		}
	}
}
