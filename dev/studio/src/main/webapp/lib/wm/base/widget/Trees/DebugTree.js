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



dojo.provide("wm.base.widget.Trees.DebugTree");
dojo.require("wm.base.widget.Trees.Tree");
dojo.require("wm.base.widget.Trees.JSObjTreeNode");
dojo.require("wm.base.widget.Dialogs.Dialog");


dojo.declare("wm.DebugDialog", wm.Dialog, {
    noEscape: true,
    noTopBottomDocking: true,
    noLeftRightDocking: true,
    useContainerWidget: true,
    useButtonBar: false,
    modal: false,
    title: "Debugger",
    commands: null,
    commandPointer: null,
    postInit: function() {
	this.inherited(arguments);
	this.commands = [];

	this.tabLayers = new wm.TabLayers({owner: this,
					   parent: this.containerWidget,
					   width: "100%",
					   height: "100%",
					   name: "tabLayers"});
	this.addEventsLayer();
	this.addServiceListLayer();
	this.addWidgetListLayer();
	this.tabLayers.setLayerIndex(0);
	this.minify();
    },
    addServiceListLayer: function() {
	this.servicesLayer = new wm.Layer({owner: this,
					   parent: this.tabLayers,
					   name: "servicesLayer",
					   caption: "Services",
					   onShow: dojo.hitch(this,function() {this.serviceGridPanel.activate();}),
					   onDeactivate: dojo.hitch(this, function() {this.serviceGridPanel.deactivate();})
					  });
	this.serviceGridPanel = new wm.ServiceDebugPanel({owner: this,
							 name: "serviceGridPanel",
							 parent: this.servicesLayer,
							 width: "100%",
							 height: "100%",
							 autoScroll:true});

    },
    addWidgetListLayer: function() {
	this.widgetLayer = new wm.Layer({owner: this,
					 parent: this.tabLayers,
					 name: "widgetsLayer",
					 caption: "Widgets",
					 onShow: dojo.hitch(this,function() {this.widgetPanel.activate();}),
					 onDeactivate: dojo.hitch(this, function() {this.widgetPanel.deactivate();})
					});
	this.widgetPanel = new wm.WidgetDebugPanel({owner: this,
						    name: "widgetPanel",
						    parent: this.widgetLayer,
						    width: "100%",
						    height: "100%",
						    autoScroll:true});
    },

    addEventsLayer: function() {
	this.eventsLayer = new wm.Layer({owner: this,
					 parent: this.tabLayers,
					 name: "eventsLayer",
					 caption: "Events"});

	this.bindSearchBar = new wm.Text({owner: this,
					   parent: this.eventsLayer,
					  placeHolder: "Search bindings by property name",
					  width: "100%",
					  emptyValue: "emptyString",
					  resetButton: true,
					  changeOnKey: true,
					  showing: false});
	this.connect(this.bindSearchBar, "onchange", this, function() {
	    this.debugTree.filterBindings(this.bindSearchBar.getDataValue());
	});
	this.debugTree = new wm.DebugTree({owner: this, 
					   parent: this.eventsLayer,
					   width: "100%", height: "100%",
					   name: "debugTree"});

	var commandLine = new wm.Text({width: "100%",
				       owner: this,
				       parent: this.eventsLayer,
				       name: "commandLineDebug"});
	var treeButtonBar = new wm.Panel({owner: this,
					  parent: this.eventsLayer,
					  horizontalAlign: "left",
					  verticalAlign: "top",
					  layoutKind: "left-to-right",
					  width: "100%",
					  height: "35px"});
	var bindButton = new wm.ToggleButton({owner: this,
					      parent: treeButtonBar,
					      name: "debugBindingButton",
					      captionUp: "Bindings",
					      captionDown: "Bindings"});
	var clearDebugButton = new wm.Button({owner: this,
					      parent: treeButtonBar,
					      name: "clearDebugButton",
					      caption: "Clear"});
	var executeDebugButton = new wm.Button({owner: this,
						parent: treeButtonBar,
						name: "executeDebugButton",
						caption: "Execute"});

	this.connect(clearDebugButton, "onclick", this, function() {
	    this.debugTree.clear();
	});
	this.connect(bindButton, "onclick", this, function() {
	    this.debugTree.showBinding(bindButton.clicked);
	    this.bindSearchBar.setShowing(bindButton.clicked);
	});
	this.connect(executeDebugButton, "onclick", this, function() {
	    var text = commandLine.getDataValue();
	    this.debugTree.logCommand(text,"dojo.hitch(app._page, function() {try {return " + text + "}catch(e){return e;}})()");
	    commandLine.clear();
	    this.commands.push(text);
	    while (this.commands.length > 50)
		this.commands.shift();
	    this.commandPointer = null;
	});
	commandLine.connect(commandLine, "keypressed", dojo.hitch(this, function(inEvent) {
	    if (inEvent.charCode) return;
	    if (inEvent.keyCode == dojo.keys.ENTER) {
		executeDebugButton.click();
		dojo.stopEvent(inEvent);
	    } else if (app._keys[inEvent.keyCode] == "UP") {
		if (this.commandPointer === null)
		    this.commandPointer = this.commands.length-1;
		else {
		    this.commandPointer--;
		    if (this.commandPointer < 0)
			this.commandPointer = this.commands.length-1;
		}
		commandLine.setDataValue(this.commands[this.commandPointer]);
		dojo.stopEvent(inEvent);
	    } else if (app._keys[inEvent.keyCode] == "DOWN") {
		if (this.commandPointer === null)
		    this.commandPointer = 0;
		else
		    this.commandPointer = this.commandPointer + 1 % this.commands.length;
		commandLine.setDataValue(this.commands[this.commandPointer]);	    
		dojo.stopEvent(inEvent);
	    }

	}));
    }
});

dojo.declare("wm.ServiceDebugPanel", wm.Container, {
    layoutKind: "left-to-right",
    postInit: function() {
	this.inherited(arguments);

	wm.conditionalRequire("lib.github.beautify", true); 

	this.connect(wm.inflight, "add", this, "newJsonEventStart");
	this.connect(wm.inflight, "remove", this, "newJsonEventEnd");


	var typeDef = this.createComponents({debuggerServicesType: ["wm.TypeDefinition", {internal: true}, {}, {
	    field0: ["wm.TypeDefinitionField", {"fieldName":"page","fieldType":"string","name":"field0"}, {}],
	    field1: ["wm.TypeDefinitionField", {"fieldName":"name","fieldType":"string","name":"field1"}, {}],
	    field2: ["wm.TypeDefinitionField", {"fieldName":"lastUpdate","fieldType":"date","name":"field2"}, {}],
	    field3: ["wm.TypeDefinitionField", {"fieldName":"firedBy","fieldType":"string","name":"field3"}, {}],
	    field4: ["wm.TypeDefinitionField", {"fieldName":"data","fieldType":"string","name":"field4"}, {}],
	    field5: ["wm.TypeDefinitionField", {"fieldName":"request","fieldType":"string","name":"field5"}, {}],
	    field6: ["wm.TypeDefinitionField", {"fieldName":"id","fieldType":"string","name":"field6"}, {}],
	    field7: ["wm.TypeDefinitionField", {"fieldName":"status","fieldType":"string","name":"field7"}, {}]

	}]}, this);
	wm.typeManager.types.debuggerServicesType.fields.id.include = ["update"];
	this.serviceListVar = new wm.Variable({owner: this,
					       isList: true,
					       name: "serviceListVar",
					       type: "debuggerServicesType"});


	var components = this.createComponents({
	    serviceGrid: ["wm.DojoGrid", {width: "100%", height: "100%","columns":[
		{"show":true,"field":"status","title":"-",width:"20px","formatFunc":"wm_image_formatter","formatProps":{"width":18,"height":16}},
		{"show":true,"field":"page","title":"Page","width":"80px","align":"left","formatFunc":""},
		{"show":true,"field":"name","title":"Name","width":"100%","align":"left","formatFunc":""},
		{"show":true,"field":"lastUpdate","title":"Time","width":"80px","align":"left","formatFunc": "wm_date_formatter",
		 "formatProps": {
                     "dateType": "time",
		     formatLength: "medium"
		 }},
		{"show":true,"field":"firedBy","title":"FiredBy","width":"120px","align":"left","formatFunc":""},
		{"show":true,"field":"data","title":"Data","width":"80px","align":"left","formatFunc":"showDataCell", expression: ""},
		/*{"show":true,"field":"request","title":"Request","width":"100%","align":"left","formatFunc":""},*/
		{"show":true,"field":"update","title":"Update","width":"60px","align":"left","formatFunc":"wm_button_formatter","formatProps":null,"expression":"\"Update\"","isCustomField":true}
	    ],
					  "margin":"4",
					  "name":"serviceGrid"}, {onGridButtonClick: "updateGridButtonClick", onSelectionChange: "showDataTabs"}, {
					      binding: ["wm.Binding", {"name":"binding"}, {}, {
						  wire: ["wm.Wire", {"expression":undefined,"name":"wire","source":"app.debugDialog.serviceGridPanel.serviceListVar","targetProperty":"dataSet"}, {}]
					      }]
					  }],
	    tabs: ["wm.TabLayers", {name: "tabs", width: "100%", height: "100%",showing:false, defaultLayer: 0},{}, {
		dataLayer: ["wm.Layer", {name: "dataLayer", caption: "Data",showing: false},{}, {
		    dataEditor: ["wm.AceEditor", {"height":"100%","name":"dataEditor","width":"100%"}, {}, {
			binding: ["wm.Binding", {"name":"binding"}, {}, {
			    wire: ["wm.Wire", {"name":"wire","expression":"${app.debugDialog.serviceGridPanel.serviceGrid.selectedItem};if (app.debugDialog.serviceGridPanel) app.debugDialog.serviceGridPanel.getDataEditorData();","targetProperty":"dataValue"}, {}]
			}]
		    }],
		    setDataButton: ["wm.Button", {name: "fireButton", caption: "setData()", width: "150px"}],
		    errorLabel: ["wm.Html", {name: "errorLabel", width: "100%", height: "50px", border: "1", borderColor: "red"}, {}, {
						      binding: ["wm.Binding", {"name":"binding"}, {}, {
							  wire: ["wm.Wire", {"expression":undefined,"name":"wire","expression":"${app.debugDialog.serviceGridPanel.serviceGrid.selectedItem};if (app.debugDialog.serviceGridPanel) app.debugDialog.serviceGridPanel.getErrorLabel()","targetProperty":"html"}, {}],
							  wire2: ["wm.Wire", {"expression":undefined,"name":"wire","expression":"${app.debugDialog.serviceGridPanel.serviceGrid.selectedItem};if (app.debugDialog.serviceGridPanel) Boolean(app.debugDialog.serviceGridPanel.getErrorLabel())","targetProperty":"showing"}, {}]
						      }]
		    }]			
		}],
		requestLayer: ["wm.Layer", {name: "requestLayer", caption: "Request", showing: false},{}, {
		    requestEditor: ["wm.AceEditor", {"height":"100%","name":"requestEditor","width":"100%"}, {}, {
			binding: ["wm.Binding", {"name":"binding"}, {}, {
			    wire: ["wm.Wire", {"name":"wire","expression":"${app.debugDialog.serviceGridPanel.serviceGrid.selectedItem};if (app.debugDialog.serviceGridPanel) app.debugDialog.serviceGridPanel.getRequestEditorData();","targetProperty":"dataValue"}, {}]
			}]
		    }],
		    fireButton: ["wm.Button", {name: "fireButton", caption: "update()", width: "150px"}]
		}]
		}]
	},this);	
	this.serviceGrid = components[0];
	this.tabs = components[1];
	this.dataLayer = this.tabs.layers[this.tabs.indexOfLayerName("dataLayer")];
	this.dataEditor = this.dataLayer.c$[0];
	this.requestLayer = this.tabs.layers[this.tabs.indexOfLayerName("requestLayer")];
	this.requestEditor = this.requestLayer.c$[0];
	this.setDataButton = this.dataEditor.parent.c$[1];
	this.updateButton = this.requestEditor.parent.c$[1];
	this.connect(this.updateButton, "onclick", this, function wmdebugger() {
	    var data = this.requestEditor.getDataValue();
	    data = eval("(" + data + ")");
	    var c = app.getValueById(this.serviceGrid.selectedItem.getValue("id"));
	    if (c instanceof wm.LiveVariable && c.operation == "read") {
		c.filter.setData(data);
	    } else if (c instanceof wm.LiveVariable) {
		c.sourceData.setData(data);
	    } else if (c instanceof wm.ServiceVariable) {
		c.input.setData(data);
	    }
	    c.update();
	});
	this.connect(this.setDataButton, "onclick", this, function() {
	    var data = this.dataEditor.getDataValue();
	    data = eval("(" + data + ")");
	    var c = app.getValueById(this.serviceGrid.selectedItem.getValue("id"));
	    c.setData(data);
	});

	var x = document.createElement("span");
	dojo.addClass(x, "TabCloseIcon DebuggerCloseButton");
	x.innerHTML = "x";
	this.tabs.decorator.tabsControl.domNode.insertBefore(x, this.tabs.decorator.tabsControl.domNode.firstChild);
	this.connect(x, "onclick", this, function() {
	    this.serviceGrid.deselectAll();
	});
    },
    showDataCell: function(inValue, rowId, cellId, cellField, cellObj, rowObj) {
	var data = rowObj.data;
	if (data instanceof Error) {
	    return data.toString();
	} else if (dojo.isArray(data)) { 
	    return data.length + ' items';
	} else if (wm.isEmpty(data)) {
	    return 'Empty';
	} else {
	    return 'Has Data';
	}
    },
    getErrorLabel: function() {
	var data = app.debugDialog.serviceGridPanel.serviceGrid.selectedItem.getValue('data');
	if(data instanceof Error) {
	    return data.toString(); 
	} else { 
	    return ''; 
	}
    },
    getDataEditorData: function() {
	var data = app.debugDialog.serviceGridPanel.serviceGrid.selectedItem.getValue('data');
	var cleanData;
	if (dojo.isArray(data)) {
	    cleanData = [];
	    dojo.forEach(data, function(item) {
		cleanData.push(wm.DojoGrid.prototype.itemToJSONObject(app.debugDialog.serviceGridPanel.serviceGrid.store,item));
	    });
	} else {
	    cleanData = wm.DojoGrid.prototype.itemToJSONObject(app.debugDialog.serviceGridPanel.serviceGrid.store,data);
	}
	return js_beautify(dojo.toJson(cleanData));
    },
    getRequestEditorData: function() {
	var data = app.debugDialog.serviceGridPanel.serviceGrid.selectedItem.getValue('request');
	var cleanData = wm.DojoGrid.prototype.itemToJSONObject(app.debugDialog.serviceGridPanel.serviceGrid.store,data);
	return js_beautify(dojo.toJson(cleanData));
    },
    showDataTabs: function(inSender) {
	var hasSelection = this.serviceGrid.hasSelection();
	    this.serviceGrid.setColumnShowing("page",!hasSelection, true);
	    this.serviceGrid.setColumnShowing("lastUpdate",!hasSelection, true);
	    this.serviceGrid.setColumnShowing("firedBy",!hasSelection, true);
	    this.serviceGrid.setColumnShowing("data",!hasSelection, true);
	this.serviceGrid.setColumnShowing("update",!hasSelection, false);
	this.tabs.setShowing(hasSelection);	
	this.serviceGrid.setWidth(hasSelection ? "150px" : "100%");
	if (hasSelection) {
	    if (this.tabs.layerIndex == -1) this.tabs.setLayerIndex(0);

	    var data = app.debugDialog.serviceGridPanel.serviceGrid.selectedItem.getData();
	    if (!data) {
		this.requestLayer.hide();
		this.dataLayer.hide();
	    } else if (app.getValueById(data.id) instanceof wm.ServiceVariable == false) {
		this.requestLayer.hide();
		this.dataLayer.setCaption("Data");
		this.dataLayer.show();
	    } else {
		this.requestLayer.show();
		this.dataLayer.setCaption("Response");
		this.dataLayer.show();

	    }
	}
    },
    updateGridButtonClick: function(inSender, fieldName, rowData, rowIndex) {
      try {
	  /* Causes this click to show as "debugger" in the grid */
	  (function wmdebugger() {
              var c = app.getValueById(rowData.id);
              c.update();
	  })();
      } catch(e) {
      } 
  },
    getLoadingIcon: function() {
	return dojo.moduleUrl("wm.base.widget.themes.default.images") + "loadingThrobber.gif";
    },
    getErrorIcon: function() {
	return dojo.moduleUrl("lib.images.boolean.Signage") + "Denied.png";
    },
    getSuccessIcon: function() {
	return dojo.moduleUrl("lib.images.boolean.Signage") + "OK.png";
    },
    newJsonEventStart: function(inDeferred, inService, optName, inArgs, inMethod, invoker) {
	if (!this.isAncestorHidden()) {	
	    this.generateServicesLayer();
	}
	var count = this.serviceListVar.getCount();
	var id =  invoker ? invoker.getRuntimeId() : "";
	for (var i = 0; i < count; i++) {
	    var item = this.serviceListVar.getItem(i);
	    if (id === item.getValue("id")) {
		item.beginUpdate();
		item.setValue("status", this.getLoadingIcon());
		item.endUpdate();
		this.serviceListVar.notify();
		var self = this;
		inDeferred.addCallback(function() {
		    item.beginUpdate();
		    item.setValue("status", self.getSuccessIcon());
		    item.endUpdate();
		    self.serviceListVar.notify();
		});
		inDeferred.addErrback(function(inError) {
		    item.beginUpdate();
		    item.setValue("status", self.getErrorIcon());
		    item.setValue("data", inError);
		    item.endUpdate();
		    self.serviceListVar.notify();
		});
		break;
	    }
	}
    },
    newJsonEventEnd: function(inDeferred, inService, optName, inArgs, inMethod, invoker) {
	;
    },

   activate: function() {
	this.serviceGrid._renderHiddenGrid = true;
	this.generateServicesLayer();
    },
    deactivate: function() {
	this.serviceGrid._renderHiddenGrid = false;
    },
    generateServicesLayer: function() {
	this.serviceListVar.beginUpdate();
	for (var id in wm.Component.byId) {
	    var c = wm.Component.byId[id];

	    /* Only include any servicevar and only wm.Variables owned by page or app */
	    if (c instanceof wm.ServiceVariable == false) {
		if (c instanceof wm.Variable && c.owner instanceof wm.Page == false && c.owner instanceof wm.Application == false || c instanceof wm.Variable == false) {
		    continue;
		}
	    }
	    var page = c.getParentPage();
	    var pageName =  page ? page.declaredClass : "app";
	    var componentName = id.indexOf(wm.decapitalize(pageName)) == 0 ? id.substring(pageName.length+1) : id;
	    var firedBy = "";
	    if (c._debug) {
		if (c._debug.trigger) {
		    firedBy = c._debug.trigger;
		}
		if (c._debug.eventName) {
		    firedBy += "." + c._debug.eventName;
		}
	    } else {
		firedBy = "";
	    }

	    var status = "";
	    if (c instanceof wm.ServiceVariable) {
		if (c._requester ) {
		    status =  this.getLoadingIcon();
		} else if  (c._lastError) {
		    status =  this.getErrorIcon();
		} else if (firedBy) {
		    status = this.getSuccessIcon();
		}
	    }
	    var itemData = {page: pageName,
			    name: componentName,
			    id: c.getRuntimeId(),
			    status: status,
			    lastUpdate: c._debug && c._debug.lastUpdate ? c._debug.lastUpdate :  undefined,
			    firedBy: firedBy || (c instanceof wm.ServiceVariable ? "<i>Never Fired</i>" : ""),
			    data: c._lastError ? c._lastError : c.getData(),
			    request: c._debug ? c._debug.request : {}};

	    // See if the item exists and update it if it does
	    var found = false;
	    var count = this.serviceListVar.getCount();
	    for (var i = 0; i < count; i++) {
		var item = this.serviceListVar.getItem(i);
		if (item.getValue("page") == pageName && item.getValue("name") == componentName) {
		    found = true;
		    item.beginUpdate();
		    item.setData(itemData);
		    item.endUpdate();
		    break;
		}
	    }
	    if (!found) {
		if (!itemData.lastUpdate) itemData.lastUpdate = new Date();
		this.serviceListVar.addItem(itemData);
	    }
	}

	this.serviceListVar.endUpdate();	    
	this.serviceListVar.notify();
    },
    newJsonEvent: function(inDeferred, inService, optName, inArgs, inMethod, invoker) {
	
    }
});


dojo.declare("wm.WidgetDebugPanel", wm.Container, {
    layoutKind: "left-to-right",
    postInit: function() {
	this.inherited(arguments);

	var typeDef = this.createComponents({debuggerWidgetType: ["wm.TypeDefinition", {internal: true}, {}, {
	    field100: ["wm.TypeDefinitionField", {"fieldName":"page","fieldType":"string","name":"field0"}, {}],
	    field101: ["wm.TypeDefinitionField", {"fieldName":"name","fieldType":"string","name":"field1"}, {}],
	    field102: ["wm.TypeDefinitionField", {"fieldName":"id","fieldType":"string","name":"field6"}, {}],
	    field104: ["wm.TypeDefinitionField", {"fieldName":"type","fieldType":"string"}, {}],
	    field105: ["wm.TypeDefinitionField", {"fieldName":"showing","fieldType":"boolean","name":"field3"}, {}]
	}]}, this);
	wm.typeManager.types.debuggerWidgetType.fields.id.include = ["update"];

	var components = this.createComponents({
	    widgetListVar:  ["wm.Variable", {type: "debuggerWidgetType", isList: true}],
	    pageListVar: ["wm.Variable", {type: "StringData", isList: true}],
	    gridPanel: ["wm.Panel", {layoutKind: "top-to-bottom", width: "400px", height: "100%",  verticalAlign: "top", horizontalAlign: "left"},{},{
		searchPanel: ["wm.Panel", {layoutKind: "left-to-right", width: "100%", height: "30px", verticalAlign: "top", horizontalAlign: "left"},{},{
		    searchNameText: ["wm.Text", {resetButton: true, width: "100px", placeHolder: "Widget Name", changeOnKey: true},{onchange: "searchChange"}],
		    searchClassText: ["wm.Text", {resetButton: true, width: "100px", placeHolder: "Class Name", changeOnKey: true},{onchange: "searchChange"}],
		    showingSelect: ["wm.SelectMenu", {displayValue: "All", width: "80px", options: ["All", "List visible widgets", "List hidden widgets"]},{onchange: "showingSelectChange"}],
		    pagesMenu: ["wm.SelectMenu", {placeHolder: "Page name", width: "80px",displayField: "dataValue", dataField: "dataValue", allowNone:true},{onchange: "searchChange"},{
			binding: ["wm.Binding", {"name":"binding"}, {}, {
			    wire: ["wm.Wire", {"expression":undefined,"name":"wire","source":"app.debugDialog.widgetPanel.pageListVar","targetProperty":"dataSet"}, {}]
			}]
		    }]
		}],
		widgetGrid: ["wm.DojoGrid", 
			     {width: "100%", height: "100%","columns":[
				 {"show":true,"field":"page","title":"Page","width":"80px","align":"left","formatFunc":""},
				 {"show":true,"field":"name","title":"Name","width":"100%","align":"left","formatFunc":""},
				 {"show":true,"field":"type","title":"Class","width":"80px","align":"left","formatFunc":""},
				 {"show":true,"field":"showing","title":"Hidden","width":"60px","align":"left","expression": "${showing} ? '' : 'hidden'"}
			     ],
			      "margin":"4",
			      "name":"widgetGrid"}, {onSelectionChange: "showWidget"}, {
				  binding: ["wm.Binding", {"name":"binding"}, {}, {
				      wire: ["wm.Wire", {"expression":undefined,"name":"wire","source":"app.debugDialog.widgetPanel.widgetListVar","targetProperty":"dataSet"}, {}]
				  }]
			      }]
	    }],
	    propertiesPanel: ["wm.Panel", {width: "100%", height: "100%", layoutKind: "top-to-bottom", verticalAlign: "top", horizontalAlign: "left", autoScroll:true},{},{
	    }]
	    },this);
	this.widgetListVar = components[0];
	this.pageListVar = components[1];
	this.searchNameText = components[2].c$[0].c$[0];
	this.searchClassText = components[2].c$[0].c$[1];
	this.showingSelect = components[2].c$[0].c$[2];
	this.pagesMenu = components[2].c$[0].c$[3];
	this.widgetGrid = components[2].c$[1];
	this.propertiesPanel = components[3];
    },
    showWidget: function(inSender) {
	var id = this.widgetGrid.selectedItem.getValue("id");
	if (id) {
	    this.selectedItem = app.getValueById(id);
	}
	if (!id) return;

	this.propertiesPanel.removeAllControls();
	new wm.Label({owner: this,
		      parent: this.propertiesPanel,
		      width: "100%", 
		      singleLine: false, 
		      height: "40px", 
		      caption: "Access with<code>" + id + "</code>"});
	for (var propName in this.selectedItem) {
	    if (propName.indexOf("_") == 0) continue;
	    if (this.selectedItem[propName] instanceof Node) continue;
	    if (typeof this.selectedItem[propName] == "function") continue;
	    if (typeof this.selectedItem[propName] == "object" && this.selectedItem[propName] instanceof wm.Component == false) continue;
	    this.generateEditor(propName);
	}
	this.propertiesPanel.reflow();
    },
    generateEditor: function(inName) {
	var value = this.selectedItem[inName];
	var type = typeof value;
	var ctor;
	if (type == "boolean") {
	    ctor = wm.Checkbox;
	} else if (type == "number") {
	    ctor = wm.Number;
	} else if (type == "object") {
	    value = value.toString();
	    ctor = wm.Text;
	} else {
	    ctor = wm.Text;
	}
	var e = new ctor({owner: this,
			  parent: this.propertiesPanel,
			  readonly: type == "object",
			  width: "100%",
			  caption: inName,
			  dataValue: value,
			  startChecked: value,
			  captionSize: "100px"});
	
	e.onchange = dojo.hitch(this, function(inDisplayValue, inDataValue) {
	    if (this.selectedItem["set" + wm.capitalize(inName)]) {
		this.selectedItem["set" + wm.capitalize(inName)](inDataValue);
	    } else {
		this.selectedItem[inName] = inDataValue;
	    }
	});
    },
    searchChange: function(inSender) {
	var q = {};
	var name = this.searchNameText.getDataValue();
	if (name) {
	    q.name = "*" + name + "*";
	}

	var className = this.searchClassText.getDataValue();
	if (className) {
	    q.type = "*" + className + "*";
	}

	var showing = this.showingSelect.getDataValue();
	if (showing == "List visible widgets") {
	    q.showing = true;
	} else if (showing == "List hidden widgets") {
	    q.showing = false;
	}

	var page = this.pagesMenu.getDataValue();
	if (page) {
	    q.page = page;
	}
	this.widgetGrid.setQuery(q);
	inSender.focus();
    },
   activate: function() {
	this.generateWidgetList();
	this.generatePagesList();
    },
    deactivate: function() {
    },
    generateWidgetList: function() {
	this.widgetListVar.beginUpdate();
	this.widgetListVar.clearData();

	for (var id in wm.Component.byId) {
	    var c = wm.Component.byId[id];
	    if (c instanceof wm.Control == false) continue;
	    if (c == app.debugDialog || c.isAncestor(app.debugDialog)) continue;
	    if (c.isAncestor(app.pageDialog)) continue;
	    var page = c.getParentPage();
	    var pageName =  page ? page.declaredClass : "app";
	    var componentName = id.indexOf(wm.decapitalize(pageName)) == 0 ? id.substring(pageName.length+1) : id;
	    var itemData = {page: pageName,
			    name: componentName,
			    id: c.getRuntimeId(),
			    type: c.declaredClass,
			    showing: c.showing};
	    this.widgetListVar.addItem(itemData);
	}

	this.widgetListVar.endUpdate();	    
	this.widgetListVar.notify();
    },
    generatePagesList: function() {
	this.pageListVar.beginUpdate();
	this.pageListVar.setData([{dataValue: "app"}]);

	for (var pageName in wm.Page.byName) {
	    this.pageListVar.addItem({dataValue: pageName});
	}

	this.pageListVar.endUpdate();	    
	this.pageListVar.notify();
    }
});

dojo.declare("wm.DebugTree", wm.Tree, {
    tmpRoot: null,
    showBindings: false,
    commands: null,
    init: function() {	
	this.inherited(arguments);
	this.tmpRoot = this.root;
	this.connect(wm.inflight, "add", this, "newJsonNode");
	this.subscribe("wmlog", dojo.hitch(this, "newLogEvent"));
	this.startEventImage =  "<img src='" + dojo.moduleUrl("lib.images.silkIcons") + "control_play.png' /> ",
	this.componentEventImage = "<img src='" + dojo.moduleUrl("lib.images.silkIcons") + "bullet_go.png' /> ";
	this.commands = [];
    },
    clear: function() {
	this.inherited(arguments);
	this.tmpRoot = this.root;
    },
    // used like console.log
    log: function(args,parent) {
	new wm.JSObjTreeNode(parent || this.tmpRoot, {prefix: "",
					 object: args});
    },
    error: function(args,parent) {
	new wm.JSObjTreeNode(parent || this.tmpRoot, {prefix: "<img src='" + dojo.moduleUrl("lib.images.boolean.Signage") + "Denied.png'/>",
					 object: args});
    },
    logCommand: function(inText, inEval) {
	var result = eval(inEval);
	if (!this.tmpRoot.tree)
	    this.tmpRoot = this.root;
	var node = new wm.TreeNode(this.tmpRoot, {content: inText,
					       hasChildren: true});
	if (result instanceof Error)
	    this.error(result,node);
	else
	    this.log(result,node);
    },
    showBinding: function(inShow) {
	this.showBindings = inShow;
	this.forEachNode(function(inNode) {
	    if (inNode instanceof wm.DebugBindingNode) 
		inNode.domNode.style.display = inShow ? "block" : "none";
	});
    },
    filterBindings: function(inText) {
	this.forEachNode(function(inNode) {
	    if (inNode instanceof wm.DebugBindingNode) 
		inNode.domNode.style.display = inNode.property && inNode.property.toLowerCase().indexOf(inText.toLowerCase()) != -1 ? "block" : "none";
	});
    },
    newLogEvent: function(inData) {
	var newNode;
	if (!this.tmpRoot.tree)
	    this.tmpRoot = this.root;
	if (inData.type == "componentEvent") {
	    var content = [this.componentEventImage,
			   inData.trigger.name || inData.trigger.declaredClass,
			   "'s ",
			   inData.eventName,
			   " fires ",
			   inData.firing.name || inData.firing.declaredClass, 
			   ".",
			   inData.method];
	    newNode = new wm.TreeNode(this.tmpRoot, {content:  content.join("")});
	} else if (inData.type == "javascriptEventStart") { 
	    var content = [this.startEventImage,
			   inData.trigger.name || inData.trigger.declaredClass,
			   "'s ",
			   inData.eventName,
			   inData.type == "javascriptEventStart" ? " fires page." : " finished firing page.",
			   inData.method];
	    newNode = new wm.TreeNode(this.tmpRoot, {content:  content.join(""), 
						     closed: false});
	    this.tmpRoot = newNode;
	} else if (inData.type == "javascriptEventStop") {
	    this.tmpRoot = this.tmpRoot.parent;

	} else if (inData.type == "bindingEvent") {
	    newNode = new wm.DebugBindingNode(this.tmpRoot, inData, this.showBindings);
	}
	this.cleanupTree();
	return newNode;
    },
    newJsonNode: function(inDeferred, inService, optName, inArgs, inMethod, invoker) {
	if (djConfig.isDebug || invoker && window["studio"] && invoker.isDesignLoaded()) 
	    new wm.DebugTreeJsonNode(this.tmpRoot, {deferred: inDeferred,
						name: optName,
						service: inService,
						invoker: invoker,
						method: inMethod,
						args: inArgs});
	this.cleanupTree();
    },
    cleanupTree: function() {
	var kids = [];
	for (var i = 0; i < this.root.kids.length; i++) {
	    if (this.root.kids[i].domNode.style.display != "none")
		kids.push(this.root.kids[i]);
	}
	while (kids.length > 40) {
	    kids.shift().destroy();
	}
	if (!this.tmpRoot.parent || !this.tmpRoot.parent.parent) this.tmpRoot = this.root;
    }
});

dojo.declare("wm.DebugTreeJsonNode", wm.TreeNode, {
    closed: true,
    jsonFiring: true,
    result: "",
    method: "",
    args: "",
    description: "",
    response: null,
    hasChildren: true,
    autoUpdate: "",
    constructor: function(inParent, inProps) {
	this.autoUpdate = inProps.invoker ? inProps.invoker._autoUpdateFiring : null;
	if (inProps.service != "runtimeService") {
	    this.description = inProps.service + "." + inProps.method; 
	} else if (inProps.name) {
	    this.description = inProps.name + "." + inProps.method;
	} else if (inProps.args[0]) {
	    this.description = inProps.args[0] + ": " + inProps.args[1] + " (" + inProps.method + ")";
	} else {
	    this.description = "LazyLoad: " + inProps.args[1];
	}
	    
	this.setContent("<img src='" + dojo.moduleUrl("wm.base.widget.themes.default.images") + "loadingThrobber.gif' style='width:16px;height:16px;'/> " + this.description); 
	var deferred = inProps.deferred;
	deferred.addCallback(dojo.hitch(this, "jsonResult"));
	deferred.addErrback(dojo.hitch(this, "jsonError"));
	delete this.deferred;
    },
    jsonResult: function(inResponse) {
	this.jsonFiring = false;
	this.result = "Success";
	var response = dojo.clone(inResponse);
	this.setContent("<img src='" + dojo.moduleUrl("lib.images.boolean.Signage") + "OK.png'/> " + this.description);
	if (this.responseNode)
	    this.responseNode.setObject(response);
	else
	    this.responseData = response;
    },
    jsonError: function(inResponse) {
	this.jsonFiring = false;
	this.result = "Error";
	this.response = inResponse;
	this.setContent("<img src='" + dojo.moduleUrl("lib.images.boolean.Signage") + "Denied.png'/> " + this.response);
    },

    // This node has the following children
    // 1. parameter obj
    // 2. Response obj
    initNodeChildren: function(inParentNode) {
	if (this.invoker && this.autoUpdate)
	    this.requestNode = new wm.JSObjTreeNode(this, {prefix: "AutoUpdate",
							   object: this.autoUpdate});
	if (this.invoker) 
	    this.requestNode = new wm.JSObjTreeNode(this, {prefix: "Invoker" + (this.invoker.operation ? " (" + this.invoker.operation + ")" : ""),
							   object: this.invoker});

	this.requestNode = new wm.JSObjTreeNode(this, {prefix: "Request",
						       object: this.args});
	this.responseNode= new wm.JSObjTreeNode(this, {prefix: "Response",
						       object: this.responseData});
    }

});



dojo.declare("wm.DebugBindingNode", wm.TreeNode, {
    component: null,
    property: "",
    value: "",
    source: "",
    expression: "",
    closed: true,
    hasChildren: true,
    constructor: function(inParent, inProps, inShowing) {
	if (!inShowing) this.domNode.style.display = "none";
	this.setContent("<img src='" + dojo.moduleUrl("lib.images.silkIcons") + "wrench.png' /> Bound '" + this.property + "' of " + this.component.getRuntimeId());
    },
    initNodeChildren: function(inParentNode) {
	this.requestNode = new wm.JSObjTreeNode(this, {prefix: this.property + " set to",
						       object: this.value});
	this.requestNode = new wm.JSObjTreeNode(this, {prefix: "For component",
						       object: this.component});

	this.requestNode = new wm.TreeNode(this, {content: "Changed by " + (this.expression || this.source)});
    }

});






