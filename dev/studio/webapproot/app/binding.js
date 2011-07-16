/*
 * Copyright (C) 2008-2011 VMWare, Inc. All rights reserved.
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
 
dojo.provide("wm.studio.app.binding");

//===========================================================================
// Binding utility functions
//===========================================================================

wm.widgetIsBindSource = function(inWidget) {
	inWidget._isBindSource = inWidget._isBindSource !== undefined ? inWidget._isBindSource : !wm.isEmpty(inWidget.listDataProperties("bindSource"))
	return inWidget._isBindSource;
}

wm.widgetIsBindTarget = function(inWidget) {
	inWidget._isBindTarget = inWidget._isBindTarget !== undefined ? inWidget._isBindTarget : !wm.isEmpty(inWidget.listDataProperties("bindTarget"))
	return inWidget._isBindTarget;
}

wm.hasBindableWidgets = function(inWidget, inExcludeWidget) {
	var
		b,
		f = dojo.hitch(this, function(w) {
			b = b || (w != inExcludeWidget && wm.widgetIsBindSource(w));
		});
	for (var i in inWidget.widgets)
		wm.forEachWidget(inWidget.widgets[i], f);
	return b;
	
}

addComponentTypeBinderNodes = function(inParent, inClass, inStrict, includePageContainers) {
    var isRoot = !inParent.page || inParent.page == studio.page;
    var owners = (isRoot) ? [studio.application, inParent.page] : [inParent.page];
    if (!includePageContainers) {
	var comps = wm.listComponents(owners, inClass, inStrict);
    } else {
	var pages = wm.listAllPageContainers(owners);
	var comps = wm.listComponents(pages, inClass, false);

    }

	comps.sort(function(a, b) {
		return wm.data.compare(a.owner.name + "." + a.name, b.owner.name + "." + b.name);
	});
	dojo.forEach(comps, function(c) {
		if (c != studio.selected)
			new wm.BindSourceTreeNode(inParent, {object: c});
	});
}

addWidgetBinderNodes = function(inParent, optionalWidgets) {

    var types = [wm.AbstractEditor, wm.Composite, wm.DataGrid, wm.DojoGrid, wm.Editor, wm.List, wm.ToggleButton, wm.LiveForm ];
    var widgets = optionalWidgets || wm.listOfWidgetTypes(types);
    var page = inParent.page;   


	widgets.sort(function(a, b) {
	    var ownera = (a.owner == studio.page) ? "" : a.owner.name + ".";
	    var ownerb = (b.owner == studio.page) ? "" : b.owner.name + ".";
		return wm.data.compare(ownera + a.name, ownerb + b.name);
	});
	dojo.forEach(widgets, function(w) {
		if (w != studio.selected) {
			var
				props = {object: w},
				object = props.object,
				schema = object.listDataProperties("bindSource");

		        var name = object.name || object.declaredClass;
			dojo.mixin(props, { 
				isObject: true,
				isList: object.isList,
				_hasChildren: !wm.isEmpty(schema),
				objectId: object.getId(),
			    name: (w.owner == studio.page) ? name : (w.owner == studio.application) ? "app." + name : w.owner.name + "." + name,
				schema: schema,
				image: props.image || studio.getComponentImage(object)
			});
			
		    var b = wm.convertForSimpleBind(props);
		    var p = inParent.parent.owner; // bindSourceDialog
		    var isBindable = wm.isNodeBindable(
			props.type,
			props,
			props.isList,
			p.targetType,
			p.targetProps);
			if (b) {
			    if (w instanceof wm.SelectMenu == false && (w instanceof wm.Editor || w instanceof wm.AbstractEditor) && !isBindable)
				return;
			}
		    new wm.SimpleBindSourceTreeNode(inParent, {object: w, content: props.name, type: props.type, isValidBinding: isBindable});
		}
	});
}

    addResourceBinderNodes = function(inParent, inFile, isRoot) {

      var newfile;
      var filename = inFile.file;
	if (inFile.type == "file") {
	  var ext = filename.substring(filename.lastIndexOf(".")+1);
	  var newfile;
	  switch (ext) {
	  case "jpg":
	  case "jpeg":
	  case "gif":
	  case "png":
	  case "tif":
	  case "bmp":
	    newfile = new wm.ImageResourceItem({});
	    break;
	  case "jar":
	    newfile = new wm.JarResourceItem({});
	    newfile.isInClassPath = inFile.isInClassPath;
	    break;
	  case "zip":
	    newfile = new wm.ZipResourceItem({});
	    break;
	  case "js":
	    newfile = new wm.JSResourceItem({});
	    break;
	  case "css":
	    newfile = new wm.CSSResourceItem({});
	    break;
	  case "html":
	    newfile = new wm.HTMLResourceItem({});
	    break;
	  default:
	    newfile = new wm.MiscResourceItem({});
	  }
	} else {
	  newfile = new wm.FolderResourceItem({});
	}
      newfile.itemName = inFile.file;

        var extensionMatch = null;
        var owner = null
        var parent = inParent;
        while(parent && !parent.owner) parent = parent.parent;
        if (parent) owner = parent.owner;
        if (owner.targetProps) {
            var props = owner.targetProps;
            extensionMatch = props.extensionMatch;
        }
	var node = new wm.ResourceTreeNode(inParent, {file: inFile,
						      content: newfile.itemName,
						      data: newfile,
						      closed: !isRoot,
						      isProperty: true,
						      isValidBinding: (!extensionMatch || ext && dojo.indexOf(extensionMatch, ext.toLowerCase()) != -1) ? true : false,
						      source: ((inParent.source) ? inParent.source  + "/" : "")  + escape(inFile.file),
						      image: newfile.iconSrc});	

      newfile.treeNode = node;
      return newfile;

}


wm.convertForSimpleBind = function(inNodeProps, optionalSource) {
	var p;
	for (var n in inNodeProps.schema) {
		var property = inNodeProps.schema[n];
		if (property.simpleBindProp)
			p = {name: n, property: property};
	}
	
	if (p) {

		inNodeProps.source = optionalSource || [inNodeProps.source, p.name].join(".");
		inNodeProps.objectId = inNodeProps.source;
		inNodeProps.isObject = p.property.isObject;
		inNodeProps.isList =  p.property.isList;
		inNodeProps.type = p.property.type;
		
		var schema;
		if (p.property.isObject) {
			var o = inNodeProps.object.getValue(p.name);
			if (o && o instanceof wm.Component) {
				schema = o.listDataProperties("bindSource");
				inNodeProps.object = o;
			} else {
			    schema = wm.typeManager.getTypeSchema(inNodeProps.type);
			}

		}
		
		inNodeProps.schema = schema;
		inNodeProps.isSimpleBind = true;
		inNodeProps._hasChildren = !wm.isEmpty(schema);
		return true;
	}
}

wm.isNodeBindable = function(inType, inProps, inIsList, inTargetType, inTargetProps) {
    if (!inTargetType) return 0;
    var targetIsObject = inTargetType.isObject || inTargetType.type && inTargetType.type.toLowerCase() == "object";

	if (!inProps.isSimpleBind && inProps.isObject && inProps.object instanceof wm.Control) {
	    return inProps.object.declaredClass == inTargetType.type ? 1 : 0;
	}
	var t = (!inProps.isSimpleBind && inType) || inProps.type || (inProps.object && inProps.object.type);
        var originalT = t;
	t = wm.typeManager.getPrimitiveType(t) || t;
	var o = inProps.isSimpleBind ? inProps.isObject : wm.typeManager.isStructuredType(t);
	if (!o)
		t = wm.decapitalize(t);
	if (!targetIsObject)
		inTargetType.type = wm.decapitalize(inTargetType.type);
	
//	console.log("target: " + inTargetType.type + " isObject:" + inTargetType.isObject + " isList:" + inTargetType.isList);
//	console.log("source: " + t + " isObject:" + o + " isLIst:" + inIsList);


    // If only one of them is an object, outright failure
    if (Boolean(targetIsObject) != Boolean(inProps.isObject))
	return 0;

    if (inTargetType.type == "wm.Variable" && inProps.object instanceof wm.Variable)
        ;
    // If we are matching objects and they have different types, outright failure
    // "object" and "wm.Variable" matches all objects... 
    else if (targetIsObject && t !=inTargetType.type && String(inTargetType.type).toLowerCase() != "object" )
	return 0;

    // If we don't match on list, this could be a fluke, treat it as warning rather than failure
    // If its a liveform, then give it a pass
    if (inTargetType.isList  && !inIsList || !inTargetType.isList && inIsList) {
	if (inTargetProps.object instanceof wm.LiveForm) return 1;
	else return 2;
    }

    // if the types are equal, then given that the list status has been passed, these are a match
    if (t == inTargetType.type)
	return 1;

    // haven't reviewed this one 
    if (inTargetType.type == "wm.Variable") {
        // there is either a structured type, or we're dealing with a primitive type only found in service variables -- exactly the data that getPrimitiveType is replacing "t" with.
	return (wm.typeManager.isStructuredType(t) || (originalT != t && originalT)) ? 1 : 0;
    }

    // haven't reviewed this one
    else if (inTargetType.isList && inIsList && (inTargetProps.object instanceof wm.DojoChart || inTargetProps.object instanceof wm.DojoGrid))
	return 1;

    // If it hasn't outright failed, and hasn't outright passed, consider it a warning rather than good/bad.
    return 2;
}

//===========================================================================
// Binding source controls
//===========================================================================

dojo.declare("wm.BinderSource", [wm.Panel], {
	flex: 1,
	box: 'v',
	resourcesModifiedData: 0,
	_source: {
	    bindPanelOuter: ["wm.Panel", {width: "100%", height: "100%", layoutKind: "left-to-right"}, {}, {
		bindPanel: ["wm.Panel", {width: "100%", height: "100%", layoutKind: "top-to-bottom"}, {}, {
		    searchPanel: ["wm.Panel", {layoutKind: "left-to-right", width: "100%", height: "25px"}, {}, {
			pageSelect: ["wm.SelectMenu", {height: "100%", width: "110px", caption: "", dataField: "dataValue", displayField: "dataValue"}, {}, {
			    binding: ["wm.Binding", {}, {}, {
				wire: ["wm.Wire", {"source":"app.pagesListVar","targetProperty":"dataSet", displayField: "dataValue", dataField: "dataValue"}, {}]
			    }]			    
			}],
			pageContainer: ["wm.PageContainer", {showing: false}],
			searchBar: ["wm.Text", {height: "25px", width: "100%", captionSize: "60px", caption: "Search", changeOnKey: true, changeOnEnter: true, resetButton: true, placeHolder: "Enter Name or Class", margin: "0,20,0,0"}],
			validLabel: ["wm.Picture", {height: "100%", width: "20px", source: "images/active.png", showing: false}, {}],
			invalidLabel: ["wm.Picture", {height: "100%", width: "20px", source: "images/inactive.png", showing: false}, {}],
			warningLabel: ["wm.Picture", {height: "100%", width: "20px", source: "lib/images/boolean/Signage/Caution.png", showing: false}, {}]
		    }],
		    treeControlsPanel: ["wm.Panel", {border: 0, height: "22px", layoutKind: "left-to-right", width: "100%"}, {}, {
			propListLabel: ["wm.Label", {caption: "Properties", width: "150px", height: "15px", align: "center"}],
			simpleRb: ["wm.Editor", {display: "RadioButton", displayValue: "simple", caption: "Simple", width: "76px", captionSize: "50px", captionPosition: "right", captionAlign: "left"}, {}, {
			    editor: ["wm._RadioButtonEditor", {radioGroup: "_bindInspector", startChecked: true}, {}]
			}],
			advancedRb: ["wm.Editor", {display: "RadioButton", displayValue: "advanced", caption: "Advanced", width: "94px", captionSize: "68px", captionPosition: "right", captionAlign: "left"}, {}, {
			    editor: ["wm._RadioButtonEditor", {radioGroup: "_bindInspector"}, {}]
			}],
			resourceRb: ["wm.Editor", { display: "RadioButton", displayValue: "resources", caption: "Resources", width: "100px", captionSize: "72px", captionPosition: "right", captionAlign: "left"}, {}, {
			    editor: ["wm._RadioButtonEditor", {radioGroup: "_bindInspector"}, {}]
			}],
			expressionRb: ["wm.Editor", {display: "RadioButton", displayValue: "expression", caption: "Expression", width: "100px", captionSize: "74px", captionPosition: "right", captionAlign: "left"}, {}, {
			    editor: ["wm._RadioButtonEditor", {radioGroup: "_bindInspector"}, {}]
			}],
			displayExpressionRb: ["wm.Editor", {display: "RadioButton", displayValue: "displayExpression", caption: "Expression", showing: false, width: "100px", captionSize: "74px", captionPosition: "right", captionAlign: "left"}, {}, {
			    editor: ["wm._RadioButtonEditor", {radioGroup: "_bindInspector"}, {}]
			}],
			spacer2: ["wm.Spacer", {height: "100%", width: "40px"}, {}]
		    }],
		    bindLeftToRight: ["wm.Panel", {layoutKind: "left-to-right", width: "100%", height: "100%"},{}, {
			propList: ["wm.List", {width: "100%", height: "100%", headerVisible: false, dataFields: "name", width: "147px", border: "0,5,0,1", borderColor: "#5D6678"}],			
		    bindLayers: ["wm.Layers", {border: 0, height: "100%", layoutKind: "top-to-bottom"}, {}, {
			treeLayer: ["wm.Layer", {border: 0, caption: "tree"}, {}, {
			    tree: ["wm.Tree", {border: 0, padding: 2, height: "100%", width: "100%"}, {}, {}]
			}],
			expressionLayer: ["wm.Layer", {border: 0, caption: "expression"}, {}, {
			    expressionEditor: ["wm.Editor", {display: "TextArea", padding: 0, width: "100%", height: "100px"}, {}, {
				editor: ["wm._TextAreaEditor", {}, {}]
			    }],
			    exprSplitter: ["wm.Splitter", {}],
			    expressionBuilderPanel: ["wm.Panel", {height: "100%", width: "100%", verticalAlign: "top", horizontalAlign: "left"}, {}, {
				expressionButtons: ["wm.Panel", {height: "25px", width: "100%", layoutKind: "left-to-right", verticalAlign: "top", horizontalAlign: "left"}, {}, {
				    button1: ["wm.Button", {caption: "+", margin: 2, width: "24px", height: "100%"}, {}],
				    button2: ["wm.Button", {caption: "-", margin: 2, width: "24px", height: "100%"}, {}],
				    button3: ["wm.Button", {caption: "/", margin: 2, width: "24px", height: "100%"}, {}],
				    button4: ["wm.Button", {caption: "*", margin: 2, width: "24px", height: "100%"}, {}]
				}],
				expressionTree: ["wm.Tree", {margin: 2, border: 0, padding: 2, height: "100%", width: "100%"}, {}, {}]
			    }]
			}],
			displayExpressionLayer: ["wm.Layer", {border: 0, caption: "expression"}, {}, {
			    displayExpressionEditor: ["wm.Editor", {display: "TextArea", padding: 0, width: "100%", height: "100px"}, {}, {
				editor: ["wm._TextAreaEditor", {}, {}]
			    }],
			    displayExprSplitter: ["wm.Splitter", {}],
			    displayExpressionBuilderPanel: ["wm.Panel", {height: "100%", width: "100%", verticalAlign: "top", horizontalAlign: "left"}, {}, {
				displayExpressionButtons: ["wm.Panel", {height: "25px", width: "100%", layoutKind: "left-to-right", verticalAlign: "top", horizontalAlign: "left"}, {}, {
				    displayButton1: ["wm.Button", {caption: "+", margin: 2, width: "24px", height: "100%"}, {}],
				    displayButton2: ["wm.Button", {caption: "-", margin: 2, width: "24px", height: "100%"}, {}],
				    displayButton3: ["wm.Button", {caption: "/", margin: 2, width: "24px", height: "100%"}, {}],
				    displayButton4: ["wm.Button", {caption: "*", margin: 2, width: "24px", height: "100%"}, {}]
				}],
				displayExpressionTree: ["wm.Tree", {margin: 2, border: 0, padding: 2, height: "100%", width: "100%"}, {}, {}]
			    }]
			}]
		    }]
		    }],
		    bindEditor: ["wm.Text", { readonly:true, caption: "Bound to", captionSize: "65px", captionAlign: "left", width: "100%", padding: "4,0"}, {}, {}]
		}]
	    }]
	},
        propListVar: null,
	init: function() {	    
	    this.propListVar = new wm.Variable({name: "propListVar", type: "EntryData", owner: this});
	    dojo.addClass(this.domNode, "wmbindersource");

	    this.createComponents(this._source);


	    // FIXME: get references to widgets
	    this.mixinWidgets(this.widgets);
		// connections

	    /* New localization section */
	    this.searchBar.setCaption(this.getDictionaryItem("wm.BinderSource.searchBar.caption"));
	    this.searchBar.setPlaceHolder(this.getDictionaryItem("wm.BinderSource.searchBar.placeHolder"));
	    this.propListLabel.setCaption(this.getDictionaryItem("wm.BinderSource.propListLabel.caption", {componentName: ""}));
	    this.simpleRb.setCaption(this.getDictionaryItem("wm.BinderSource.simpleRb.caption"));
	    this.advancedRb.setCaption(this.getDictionaryItem("wm.BinderSource.advancedRb.caption"));
	    this.resourceRb.setCaption(this.getDictionaryItem("wm.BinderSource.resourceRb.caption"));
	    this.expressionRb.setCaption(this.getDictionaryItem("wm.BinderSource.expressionRb.caption"));
	    this.bindEditor.setCaption(this.getDictionaryItem("wm.BinderSource.bindEditor.caption", {boundTo: ""}));
	    /* End localization section */


	    this.pageContainer._isDesignLoaded = true;
	    this.pageContainer._pageLoader._isDesignLoaded = true;
	    this.pageSelect.connect(this.pageSelect, "onchange", this, function() {
		this.updateBindSourceUi(this.simpleRb.getValue("groupValue"));
	    });


	    this.propList.connect(this.propList, "onselect", this,  function() {
		_this.owner.update({object: _this.owner.targetProps.object, targetProperty: this.propList.selectedItem.getData().dataValue}, true);
		_this.bindEditor.setDataValue("");
	    });


	    this.searchBar.connect(this.searchBar, "onchange", this,  function(inDisplayValue, inDataValue) {
		_this.updateBindSourceUi("search");
	    });

	    var _this = this;
	    this.simpleRb.connect(this.simpleRb, "onchange", this, function(inDisplayValue, inDataValue) {
		//console.log("SIMPLE: " + inDisplayValue + " | " + inDataValue);
		if (inDataValue == "simple")
		    _this.updateBindSourceUi(inDataValue);
	    });
	    this.advancedRb.connect(this.advancedRb, "onchange", this, function(inDisplayValue, inDataValue) {
		//console.log("Advanced: " + inDisplayValue + " | " + inDataValue);
		if (inDataValue == "advanced")
		    _this.updateBindSourceUi(inDataValue);
	    });
	    this.resourceRb.connect(this.resourceRb, "onchange", this,  function(inDisplayValue, inDataValue) {
		//console.log("Resources: " + inDisplayValue + " | " + inDataValue);
		if (inDataValue == "resources")
		    _this.updateBindSourceUi(inDataValue);
	    });
	    this.expressionRb.connect(this.expressionRb, "onchange", this,  function(inDisplayValue, inDataValue) {
		//console.log("Expression: " + inDisplayValue + " | " + inDataValue);
		if (inDataValue == "expression")
		    _this.updateBindSourceUi(inDataValue);
	    });
	    this.tree.connect(this.tree, "onselect", this, "bindNodeSelected");
	    this.tree.connect(this.tree, "ondblclick", this, dojo.hitch(this, function(inNode) {
		this.bindNodeSelected(inNode);
		this.owner.applyButtonClick();
	    }));
            
	    this.expressionTree.connect(this.expressionTree, "onselect", this, "expressionNodeSelected");
	    for (var i=0, c; c=this.expressionButtons.c$[i]; i++){
		if (c instanceof wm.Button) {
		    this.connect(c, "onclick", this, "expressionButtonClicked");
		}
	    }

	    this.displayExpressionTree.connect(this.displayExpressionTree, "onselect", this, "expressionNodeSelected");
	    for (var i=0, c; c=this.displayExpressionButtons.c$[i]; i++){
		if (c instanceof wm.Button) {
		    this.connect(c, "onclick", this, "displayExpressionButtonClicked");
		}
	    }

		//
		this.inherited(arguments);
	},
	mixinWidgets: function(inWidgets) {
		dojo.mixin(this, inWidgets || {});
		for (var i in inWidgets)
			this.mixinWidgets(inWidgets[i].widgets);
	},

	initBinding: function(noRegen) {
            if (!noRegen && !this._applyingBinding) {
		this._setRbEditorChecked(this.simpleRb);
	        this.searchBar.setDataValue("");
		this.updateBindSourceUi("simple");
	    }

	    if (this.owner.targetProps) {
		var object = this.owner.targetProps.object;
		var prop = this.owner.targetProps.targetProperty;
		var propPrefix = "";

		if (prop.indexOf(".") != -1 && !object.isDestroyed) {
		    propPrefix = prop.replace(/\..*?$/,"");
		    prop = prop.replace(/^.*\./,"");
		    object = object.getValue(propPrefix) || object;
		    propPrefix += ".";
		}

		if (propPrefix && !object.isDestroyed) {		    
		    var propList = object.listDataProperties("bindTarget");
		    var list = [];
		    var selectedIndex = -1;
		    for (var i in propList) {
			list.push({dataValue: propPrefix + i, name: i});
			if (propPrefix + i == this.owner.targetProps.targetProperty) 
			    selectedIndex = list.length-1;
		    }
		    this.propListVar.setData(list);
		    this.propList.setDataSet(this.propListVar);
		    if (selectedIndex != this.propList.getSelectedIndex())
			this.propList.select(this.propList.getItem(selectedIndex));
                    this.owner.applyStayButton.show();
		    this.propListLabel.setCaption(this.getDictionaryItem("wm.BinderSource.propListLabel.caption", {componentName: wm.capitalize(object.name)}));
		    this.propList.show();
		    this.propListLabel.show();
		} else {
		    this.propList.hide();
		    this.propListLabel.hide();
                    this.owner.applyStayButton.hide();
		}
	    }
	},
	_setRbEditorChecked: function(inRbEditor) {
		this.simpleRb.beginEditUpdate();
		this.advancedRb.beginEditUpdate();
		this.expressionRb.beginEditUpdate();
		this.resourceRb.beginEditUpdate();
		inRbEditor.editor.setChecked(true);
		this.simpleRb.endEditUpdate();
		this.advancedRb.endEditUpdate();
		this.expressionRb.endEditUpdate();
		this.resourceRb.endEditUpdate();
	},

	isSimpleTree: function() {
		return Boolean(this.simpleRb.getValue("groupValue") == "simple");
	},
	isExpression: function() {
	    return Boolean(this.expressionRb.getValue("groupValue") == "expression");
	},
        isDisplayExpression: function() {
	    return Boolean(this.expressionRb.getValue("groupValue") == "displayExpression");
	},
	isResource: function() {
		return Boolean(this.simpleRb.getValue("groupValue") == "resources");
	},
	updateUiForWire: function(inWire) {
		if (inWire) {
			var s = inWire.source || "", ex = inWire.expression || "";
			this.bindEditor.setValue("dataValue", s);
			this.expressionEditor.setValue("dataValue", inWire.expression || "");
			var rb = ex ? this.expressionRb : this.simpleRb;
			this._setRbEditorChecked(rb);
			if (ex) {
				this.expressionLayer.activate();
				this.validLabel.setShowing(false);
				this.invalidLabel.setShowing(false);
			} else {
				this.treeLayer.activate();
				this.expandBySource(s);
			}
		} else {
			this.tree.select(null);
			this.bindEditor.setValue("dataValue", "");
			this.expressionEditor.setValue("dataValue", "");
			this.validLabel.setShowing(false);
			this.invalidLabel.setShowing(false);
		}
	},
	updateBindSourceUi: function(gv) {
	  //var gv = this.simpleRb.getValue("groupValue"),
	    this.treeControlsPanel.show();
	    this.searchBar.show();
	    var t = this.tree;
	    t.clear();
	    var r = t.root;

	    var page;
	    if (this.pageSelect.getDataValue() == studio.project.pageName ||
	       gv == "simple") 
		page = studio.page;
	    else {
		this.pageContainer.setPageName(this.pageSelect.getDataValue());
		page = this.pageContainer.page;
	    }
	    r.page = page;
            var t2 = this.expressionTree;
            t2.clear();
            var r2 = t2.root;
            r2.page = page;

	    if (gv != "resources" && this.searchBar.getDataValue())
		gv = "search";

		switch(gv) {
		        case "search": 
		    this.searchBar.setDisabled(false);
		    // give text time to finish being entered before rebuilding the tree
		    wm.onidle(this, function() {
			this.treeLayer.activate();
			if (this.simpleRb.getGroupValue() == "expression") {
			    this.expressionLayer.activate();
		            this._buildSearchTree(this.expressionTree.root);
			    this.validLabel.setShowing(false);
			    this.invalidLabel.setShowing(false);
			} else {
		            this._buildSearchTree(r);
			}
		    });
				break;
			case "simple":
		                this.pageSelect.hide();
		                this.searchBar.setDisabled(false);
				this.treeLayer.activate();
		                this.bindEditor.show();
				this._buildSimpleTree(r);
				break;
			case "advanced":
		                this.pageSelect.show();
		                this.searchBar.setDisabled(false);
				this.treeLayer.activate();
		                this.bindEditor.show();
				this._buildAdvancedTree(r);
				break;
			case "expression":
		                this.pageSelect.show();
		                this.searchBar.setDisabled(false);
				this.expressionLayer.activate();
		                this.bindEditor.hide();
				this._buildAdvancedTree(this.expressionTree.root);
				this.validLabel.setShowing(false);
				this.invalidLabel.setShowing(false);
				break;
			case "displayExpression":
		                this.treeControlsPanel.hide();
		                this.searchBar.hide();
		                this.displayExpressionTree.clear();
		                this.pageSelect.hide();
		                this.searchBar.setDisabled(true);
				this.displayExpressionLayer.activate();
		                this.bindEditor.hide();
				this._buildDisplayExpressionTree(this.displayExpressionTree.root);
				this.validLabel.setShowing(false);
				this.invalidLabel.setShowing(false);
				break;

			case "resources":
		                this.pageSelect.hide();
		                this.searchBar.setDisabled(true);
				this.treeLayer.activate();
		                this.bindEditor.show();
				this._buildResourceTree(r);
				this.invalidLabel.setShowing(false);
				break;
		}
	},
	_buildSearchTree: function(inParent) {

		var search = this.searchBar.getDataValue();
		if (!search) {
		    this.updateBindSourceUi(this.simpleRb.getGroupValue());
		    return;
		}
		var appcomps = this.doSearch(studio.application);
		var pagecomps = this.doSearch(inParent.page);
	    if (this.simpleRb.getGroupValue() == "simple") {
		addWidgetBinderNodes(inParent, appcomps);
		addWidgetBinderNodes(inParent, pagecomps);
		if (this.tree.root.kids.length <= 2) {
		    for (var i = 0; i < this.tree.root.kids.length; i++)
			this.tree.root.kids[i].setOpen(true);
		}
	    } else {
	        var count = appcomps.length + pagecomps.length;	    
		dojo.forEach(appcomps, function(c) {
		    if (c != studio.selected)
			new wm.BindSourceTreeNode(inParent, {object: c, closed: count > 2});
		});

		dojo.forEach(pagecomps, function(c) {
		    if (c != studio.selected)
			new wm.BindSourceTreeNode(inParent, {content: ((c.owner != studio.page) ? c.owner.name + "." : "") + c.name, object: c, closed: count > 2});
		});
	    }
            if (this.tree.root.kids.length == 1) {                
                this.tree.select(this.tree.root.kids[0]);
                if (this.simpleRb.getGroupValue() != "simple") {
                    var props = this.tree.root.kids[0].object.listProperties();
                    var simpleProp = "";
                    for (var propName in props) {
                        if (props[propName].simpleBindProp) {
                            simpleProp = propName;
                            break;
                        }
                    }
                    var parent = this.tree.root.kids[0];
                    for (var i = 0; i < parent.kids.length; i++) {
                        if (parent.kids[i].name == simpleProp)
                            this.tree.select(parent.kids[i]);
                    }
                }
            }	   
	},
	_buildSimpleTree: function(inParent) {
		// servicecalls
		addComponentTypeBinderNodes(inParent, wm.ServiceVariable);
		// variables
		addComponentTypeBinderNodes(inParent, wm.Variable, true);
		// widgets

	    // pagecontainers
	    addComponentTypeBinderNodes(inParent, wm.Variable, false, true);


	    addWidgetBinderNodes(inParent);
	},
	_buildAdvancedTree: function(inParent) {
		// servicecalls
		//new wm.ComponentTypeSourceTreeNode(inParent, {content: "ServiceVariables", className: "wm.ServiceVariable", image: "images/wm/serviceData.png"});
		// variables

	    new wm.ComponentTypeSourceTreeNode(inParent, {page: inParent.page,
							  content: this.getDictionaryItem("NON_VISUAL"),
							  className: "wm.Variable", 
							  canSelect: false, 
							  image: "images/wm/variable_16.png"});
		// widgets
	        new wm.WidgetContainerSourceTreeNode(inParent, {page: inParent.page, 
								content: this.getDictionaryItem("VISUAL"),
								object: inParent.page.root, 
								hasSchema: true, 
								canSelect: false});
	},
        _buildDisplayExpressionTree: function(inParent) {
	    new wm.BindSourceTreeNode(inParent, {object: this.owner.targetProps.displayExpressionObject, 
						 closed: false});
/*
	    addComponentTypeBinderNodes(inParent, dojo.getObject(
	    new wm.ComponentTypeSourceTreeNode(inParent, {page: studio.page,
							  content: this.owner.targetProps.displayExpressionObject.name,
							  object: this.owner.targetProps.displayExpressionObject,
							  hasSchema: true, 
							  className: this.owner.targetProps.displayExpressionObject.declaredClass,
							  canSelect: false});	    
							  */
	},
	_buildResourceTree: function(inParent) {	    	    
	    var _this = this;
	    if (this.resourceData && this.resourcesModifiedData >= studio.resourcesModifiedData) {
		addResourceBinderNodes(inParent, this.resourceData,true);
		return;
	    }
	    studio.resourceManagerService.requestAsync("getResourceFolder", [], function(rootfolder) {	     
		_this.resourceData = rootfolder;
		_this.resourcesModifiedData = new Date().getTime();
		addResourceBinderNodes(inParent, rootfolder,true);
	    });
	},
	// tree expanding
	expandBySource: function(inSource) {
		var
			prop = inSource.split('.'),
			object = prop.shift();
		if (this.isSimpleTree()) {
			if (!this._expandSimpleTree(object, prop)) {
				// check advanced tree to see if there is a match
				this._setRbEditorChecked(this.advancedRb);
				this.updateBindSourceUi();
				if (!this._expandAdvancedTree(object, prop)) {
					// no matches found, reset it back to simple
					this._setRbEditorChecked(this.simpleRb);
					this.updateBindSourceUi();
				}
			}
		} else {
			this._expandAdvancedTree(object, prop);
		}
	},
	_expandSimpleTree: function(inObject, inProp) {
		var nodes = this.tree.root.kids;
		for (var i=0, n; (n=nodes[i]); i++)
			if (n.expandBySource && n.expandBySource(inObject, inProp))
				return true;
	},
	_expandAdvancedTree: function(inObject, inProp) {
		return this._expandSimpleTree(inObject, inProp);
	},
	// binding
	// FIXME: all these checks are primtive: need better type checking
	canBind: function(inTargetProps, inSourceProps) {
		var
			tp = inTargetProps,
			sp = inSourceProps;
		//
		if (!tp || !sp)
			return;
		//
		if (sp.expression)
			return true;
		// disallow if no targetProperty
		if (!tp.targetProperty)
			return;
		// if the type is a wm.Object then the source should be a descendant type.
		var
			type = tp.staticType,
			typeObject = type && dojo.getObject(type),
			sourceValue = studio.bindDialog.bindSourceDialog.bindPage.getValueById(sp.source);
	    var prototype = (typeObject && typeObject.prototype) ? dojo.getObject(typeObject.prototype) : "";
		if (prototype instanceof wm.Object) {
			if (!(sourceValue instanceof typeObject))
				return;
		}
		// FIXME: needs more work
		// if the sourceValue is a wm.Object then it should be a descendant type of typeObject.
		/*
		if (sourceValue instanceof wm.Object && (!typeObject || !(sourceValue instanceof typeObject)))
			return;
		*/
		//
		// disallow if target expects a list and we're not binding to one (note that non-lists can bind to lists: variable)
	    if (tp.isList && !wm.fire(sourceValue, "isListBindable"))
			return;
		// passed all tests
		return true;
	},
	// FIXME: unused currently, for reporting bad bind targets
	/*promptToForceBinding: function(inTargetProps, inSource, inIsExpression) {
		var
			warningMessage = "\"${source}\" does not appear to have value that will bind properly to \"${targetProperty}.\" Are you sure you want to create the binding?",
			targetId = wm.fire(inTargetProps.object, "getId");
		return confirm(dojo.string.substitute(warningMessage, {source: (inIsExpression ? "The expression" : inSource || ""), 
			targetProperty: [targetId, inTargetProps.targetProperty].join('.')}))
	},*/
	applyBinding: function(inTargetProps) {
	    var isExpression        = this.isExpression();
	    var isDisplayExpression =  this.isDisplayExpression();
	    var isResource = this.isResource();	    
	    var s = !isExpression && !isDisplayExpression && !isResource && this.bindEditor.getValue("dataValue");
	    if (isExpression) {
		var ex = this.expressionEditor.getValue("dataValue");
	    } else if (isDisplayExpression) {
		var ex = this.displayExpressionEditor.getValue("dataValue");
	    } else if (isResource) {
		var ex = this.bindEditor.getValue("dataValue");
	    }
	
	    var tp = inTargetProps;
	    if (isResource || isDisplayExpression) {
                tp.object.setValue(tp.targetProperty, ex);
                wm.data.clearBinding(tp.object, tp.targetProperty);
                studio.inspector.reinspect();
                return true;
	    }
	    if (!(s || ex)) {
		app.alert(this.getDictionaryItem("ALERT_BLANK_MESSAGE"));
		return false;
	    // FIXME: avoid limiting binding and prompt until we can make sure it will not be misleading.
	    } else /*if (this.canBind(tp, {object: sourceObject, source: s, expression: ex}) 
		   || this.promptToForceBinding(tp, s, isExpression)) */ {
		       try {
			   wm.data.clearBinding(tp.object, tp.targetProperty);
			   var
			   info = this._getBindingInfo(tp.object, tp.targetProperty,  s, ex);
			   wp = info.wireProps;
			   //
			   if (info.binding && wp.targetProperty && (wp.source || wp.expression)) {
			       info.binding.addWire(wp.targetId, wp.targetProperty, wp.source, wp.expression);					
			       wm.logging && console.log("binding created:", info.targetId, wp.source || wp.expression);
                               this._applyingBinding = true;
			       studio.inspector.reinspect();
                               this._applyingBinding = false;
			   } else
			       wm.logging && console.debug('no binding owner or nothing to bind');
		       } catch(e) {
			   wm.data.clearBinding(tp.object, tp.targetProperty);
			   app.alert(this.getDictionaryItem("ALERT_BIND_ERROR", {error: e}));
			   return;
		       }
		}
		return true;
	},
	// return info about binding to be made
	_getBindingInfo: function(inTargetObject, inTargetProp, inSource, inExpression) {
		var
			sa = studio.application,
			tobj = inTargetObject,
	    sobj = inExpression ? this._getExpressionPageSourceObject(inExpression, inTargetObject.owner) : this._getSourceObject(inSource, inTargetObject.owner),
			sourceBind = tobj.isOwnedBy(sa) && sobj && !sobj.isOwnedBy(sa),
			targetId = (tobj || 0).getId();
		return {
			binding: (sourceBind ? sobj : tobj).getComponent("binding"),
			targetId: targetId,
			wireProps: {
				targetId: sourceBind ? targetId : "",
				targetProperty: inTargetProp,
				source: inSource,
				expression: inExpression
			}
		};
	},
        _getSourceObject: function(inSource, inOwner) {
		var parts = (inSource || "").split('.'), o = [];
	    parts.length = (parts.length && (parts[0] == "app" || parts[0] == wm.decapitalize(studio.project.pageName))) ? 2 : 1;
		return inOwner.getValueById(parts.join('.'));
	},
    _getExpressionPageSourceObject: function(inExpression, inOwner) {
		var sources = wm.expression.getSources(inExpression);
		for (var i=0, o, s; (s=sources[i]); i++) {
		    o = this._getSourceObject(s, inOwner);
		    if (o && o.isOwnedBy(inOwner))
				return o;
		}
	},
	bindNodeSelected: function(inNode) {
		if (inNode && inNode.isProperty)
			this.onBindNodeSelected(inNode);
	},
	// events
	onBindNodeSelected: function(inNode) {
/*
	    if (inNode.isInterPageBinding) {
		studio.bindDialog.bindSourceDialog.bindPageContainer = inNode.object;
		studio.bindDialog.bindSourceDialog.bindPage = inNode.object._pageLoader.page;		
		this.searchBar.setDataValue("");
		this.updateBindSourceUi();
	    } else {
	    */
		var b = inNode.isValidBinding;
		this.validLabel.setShowing(b == 1);
		this.invalidLabel.setShowing(b == 0);
		this.warningLabel.setShowing(b == 2);
//	    }
	},
	// expression builder
    addValueToExpressionEditor: function(inValue, inEditor) {
		var 
			v = inValue,
			start = inEditor.editor.editor.focusNode.selectionStart,
			end = inEditor.editor.editor.focusNode.selectionEnd,
			e = inEditor.getDataValue() || "";
	        inEditor.setDataValue(e.slice(0, start) + v + e.slice(end));
	    try {
		this.expressionEditor.focus();
		this.expressionEditor.editor.editor.focusNode.selectionStart = start + v.length;
	    } catch(e) {}
	    try {
		this.expressionEditor.focus();
		this.expressionEditor.editor.editor.focusNode.selectionStart = start + v.length;
	    } catch(e) {}
	},
	expressionNodeSelected: function(inNode) {
		if (inNode.isProperty && inNode.source) {
		    var gv = this.simpleRb.getValue("groupValue");
		    var source = this.owner.getBindNodeSource(inNode);
		    if (gv == "displayExpression")
			source = source.replace(/^.*?\./,"");
		    /* Expressions must bind to values not objects; see if there's a simpleBindProp we can bind to if no property is specified */
		    if (inNode.isProperty == "object") {
			var props = inNode.object.listProperties();
			for (var p in props) {
			    if (props[p].simpleBindProp) {
				source += "." + p;
				break;
			    }
			}
		    }

		    this.addValueToExpressionEditor(["${", source, "}"].join(""), gv == "displayExpression" ? this.displayExpressionEditor : this.expressionEditor);
		}
	},
	expressionButtonClicked: function(e) {
	    this.addValueToExpressionEditor(e.target.innerHTML, this.expressionEditor);
	},
        displayExpressionButtonClicked: function(e) {
	    this.addValueToExpressionEditor(e.target.innerHTML, this.displayExpressionEditor);
	},

        doSearch: function(owner) {

	    var search = this.searchBar.getDataValue();
	    var searchByExactName = false;
	    if (search.indexOf("#") == 0) {
		search = search.substring(1);
		this.searchByExactName = true;
	    } else 
		this.searchByExactName = false;
	    var searchRegex = new RegExp(search, "i");
	    var data = [];

	    var pages = wm.listAllPageContainers([owner]);
	    var owners = [owner].concat(pages);
	    var comps = wm.listComponents(owners, wm.Component, false);

//	    var comps = owner.components;
	    for (var comp in comps) {    
		if (comp) 
		    c = comps[comp];
		if (c) {
		    if (this.searchByExactName) {
			var name = c.name || c.declaredClass;
			if (name == search)
			    data.push(c);
		    } else if (c.declaredClass.match(searchRegex) || c.name.match(searchRegex)) {
			if (wm.widgetIsBindSource(c))
			    data.push(c);
		    } else {
			var props = c.listDataProperties("bindSource")
			for (var p in props) {
			    if (p.match(searchRegex)) {
				data.push(c);
				break;
			    }
			}
		    }
		}
	    }
	    return data;
	}
});


//===========================================================================
// Binding tree nodes
//===========================================================================

dojo.declare("wm.BindTreeNode", wm.TreeNode, {
	initProps: function(inProps) {
		this.initObjectProps(inProps);
		this.closed = true;
		this.inherited(arguments);
	},
	// overridable properties for object
	initObjectProps: function(inProps) {
		var
			props = inProps,
			object = props.object,
	                name = object.name || object.declaredClass,
			schema = this.listDataProperties(object);
			// node props
		dojo.mixin(props, { 
			isObject: true,
			isList: object.isList,
			_hasChildren: !wm.isEmpty(schema),
			objectId: object.getId(),
		        name: name,
			schema: schema,
			image: props.image || studio.getComponentImage(object)
		});
		// add bind info
		this.initBindingProps(this.parent, props);
	    var content;
	    delete object.id;
	    content = object.getId();
		props.content = props.content || this.getNodeContent(content, object.type, object.isList, props);

	},
    buildSourceProp: function(inNodeProps) {
	var namelist = [];
	if (inNodeProps._propertyPath) namelist.push(inNodeProps._propertyPath);
	namelist.push(inNodeProps.objectId);
	var owner = inNodeProps.object.owner;
        if (owner instanceof wm.Page) {
	    while (owner && owner != studio.page && owner != studio.bindDialog.bindSourceDialog.pageContainer) {
	        if (!(owner instanceof wm.PageContainer && owner.owner instanceof wm.PageDialog) && owner.name)
		    if (owner.owner == studio.bindDialog.bindSourceDialog.pageContainer) {
			namelist.push("[" + owner.name + "]");
		    } else {
			namelist.push(owner.name);
		    }
	        owner = owner.owner;
	    }
        }
	return namelist.reverse().join(".");
    },
	dumpSchema: function(inParent, inSchema) {
		inParent.hasSchema = true;
		// sort nodes in schema
		var props = [];
	        for (var n in inSchema) {
		    if (inSchema[n].pageProperty) {
			var pagePropertyName = inSchema[n].pageProperty;
			var page = this.object[pagePropertyName];
			if (page) {
			    new wm.ComponentTypeSourceTreeNode(inParent, {page: page, 
									  content:  this.tree.owner.getDictionaryItem("NON_VISUAL"),
									  className: "wm.Variable", 
									  canSelect: false, 
									  image: "images/wm/variable_16.png"});
			// widgets
			    new wm.WidgetContainerSourceTreeNode(inParent, {page: page, 
									    content: this.tree.owner.getDictionaryItem("VISUAL"),
									    object: page.root, 
									    hasSchema: true, 
									    canSelect: false});			
			}
		    } else {
			props.push({name: n, property: inSchema[n]});
		    }
		}
		props.sort(function(a, b) {
			return wm.data.compare(a.name, b.name);
		});
		// iterate over nodes in schema
		dojo.forEach(props, function(p) {
			var nodeProps = {};
			this.initSchemaProps(p.name, p.property, inParent, nodeProps);
			this.initBindingProps(inParent, nodeProps);
			nodeProps.content = this.getNodeContent(p.name, nodeProps.schema ? nodeProps.type : "", nodeProps.isList, nodeProps);
			new wm.TreeNode(inParent, nodeProps);
		}, this);
	},
	initSchemaProps: function(inName, inProp, inParent, inNodeProps) {
		var n = inName, t = inProp;
		// get the schema for this property
		// most easily obtained from the type registry (it may be null)
		var schema = wm.typeManager.getTypeSchema(t.type), object = inParent.object;
		// for objects with non registered types (generally components),
		// query the object itself for schema
		if (!schema && t.isObject) {
			var o = object.getValue(n);
			if (o) 
				schema = this.listDataProperties(o);
		}
		dojo.mixin(inNodeProps, {
			isProperty: "property",
			owner: this,
			object: object,
			name: n,
			type: t.type,
	                isInterPageBinding: t.isPage,
		        isList: (t.isList),
			_hasChildren: !wm.isEmpty(schema) || t.isPage,
			objectId: inParent.objectId || object.getId(),
			schema: schema,
			image: "images/wm/type.png",
			initNodeChildren: dojo.hitch(this, "initNodeChildren"),
			expandBySchemaProp: this.expandBySchemaProp,
		    page: inParent.page,
			closed: true
		});
	},
	initBindingProps: function(inParent, inNodeProps) {
		var
			o = inNodeProps.object,
			s = o && o.constructor.prototype.schema,
			t = s && (s[inNodeProps.name] || 0).type;
		inNodeProps.staticType = inNodeProps.staticType || t;
		inNodeProps._propertyPath = inParent._propertyPath ? [inParent._propertyPath, inNodeProps.name].join('.') : this.parent != inParent ? inNodeProps.name : "";
	},
	getNodeContent: function(inName, inType, inIsList, inProps) {
	    var p = this.tree.owner;
	    inProps.isObject = Boolean(!wm.typeManager.getPrimitiveType(inType) && wm.typeManager.getType(inType));
		inProps.isValidBinding = wm.isNodeBindable(inType, inProps, inIsList, p.targetType, p.targetProps);
		if (inProps.isSimpleBind)
			inType = inProps.type;
		var r = [inName];
		r.push((inType && inType != "undefined") ? [': <span style="font-style: italic;">', wm.getFriendlyTypeName(inType, inIsList), "</span>"].join('') : "");
		return r.join('');
	},
	listDataProperties: function(inComponent) {
		return dojo.mixin({}, inComponent ? inComponent.listDataProperties(this._bindFlag) : {});
	},
	initNodeChildren: function(inNode) {
		//console.log("BindTreeNode.initNodeChildren");
		if (!inNode.hasSchema)
			this.dumpSchema(inNode, inNode.schema);
	},
	// expand node based on source
	expandBySource: function(inObjectId, inProp) {
		var prop = dojo.clone(inProp || []), objectId = inObjectId;
		if (this.isSimpleBind && prop && prop.length) {
			objectId = [objectId, prop.shift()].join(".");
		}
		if (objectId == this.objectId) {
			if (prop && prop.length) {
				this.setOpen(true);
				for (var i=0, k, kids=this.kids; (k=kids[i]); i++)
					if (k.expandBySchemaProp(prop))
						return true;
			} else {
				this.tree.select(this);
				return true;
			}
		}
	},
	expandBySchemaProp: function(inSource) {
		var a = inSource.shift();
		if (this.name == a) {
			if (!inSource.length)
				this.tree.select(this);
			else {
				this.setOpen(true);
				for (var i=0, k, kids=this.kids; (k=kids[i]); i++)
					if (k.expandBySchemaProp(inSource))
						break;
			}
			return true;
		}
		inSource.unshift(a);
	}
});

dojo.declare("wm.BindSourceTreeNode", wm.BindTreeNode, {
	_bindFlag: "bindSource",
	initBindingProps: function(inParent, inNodeProps) {
	    this.inherited(arguments);
	    if (!this.page)
		this.page = inParent.page;

	    // not sure yet what this is, but looks like its only for navigating the advanced tree
	    inNodeProps.source = this.buildSourceProp(inNodeProps);
	    if (!inNodeProps.isProperty)
		inNodeProps.isProperty = "object"; 
	}
});

dojo.declare("wm.SimpleBindSourceTreeNode", wm.BindSourceTreeNode, {
	initBindingProps: function(inParent, inNodeProps) {
		this.inherited(arguments);
	        wm.convertForSimpleBind(inNodeProps,this.source);
	}
});

dojo.declare("wm.BindTargetTreeNode", wm.BindTreeNode, {
	_bindFlag: "bindTarget",
	initObjectProps: function(inProps) {
		var s = inProps.object && inProps.object.constructor.prototype.schema, p;
		// set default bind target
		for (var i in s) {
			p = s[i];
			if (p.defaultBindTarget && inProps.object.schema[i].defaultBindTarget) {
				inProps.targetProperty = i;
				inProps.staticType = p.type;
				break;
			}
		}
		inProps.targetProperty = inProps.targetProperty || inProps._propertyPath;
		this.inherited(arguments);
	},
	initBindingProps: function(inParent, inNodeProps) {
		this.inherited(arguments);
		var
			np = inNodeProps,
			tp = np.targetProperty || np._propertyPath;
		//
		dojo.mixin(np, {
			type: (np.isObject && np.object ? np.object.type : np.type),
			targetProperty: tp,
			getNodeContent: this.getNodeContent,
			updateNodeContent: this.updateNodeContent
		});
	},
	initSchemaProps: function(inName, inProp, inParent, inNodeProps) {
		this.inherited(arguments);
		inNodeProps.clearBinding = this._clearBinding;
	},
	getNodeContent: function(inName, inType, inIsList, inProps) {
	    var p = this.tree.owner;
	    inProps.isValidBinding = wm.isNodeBindable(inType, inProps, inIsList, p.targetType, p.targetProps);
		var
			c = wm.BindTreeNode.prototype.getNodeContent.apply(this, arguments),
			wire = wm.data.getPropWire(inProps.object, inProps.targetProperty);
		this.tree._bindingImage = this.tree._bindingImage || ['&nbsp;', this.formatImage("images/link.png")].join('');
		if (wire)
			return [c, this.tree._bindingImage, wire.expression ? "(expression)" : wire.source].join(''); 
		else 
			return c;
	},
	updateNodeContent: function() {
		var schema = this.object && this.object.listDataProperties();
		this.type = (schema[this.name] || 0).type || this.type;
		this.setContent(this.getNodeContent(this.name, this.schema ? this.type : "", this.isList, this));
	},
	clearBinding: function() {
		this._clearBinding();
		this.forEachDescendant(function(n) {
			n.clearBinding();
		});
	},
	// applied to each schema node
	_clearBinding: function() {
		wm.data.clearBinding(this.object, this.targetProperty);
	}
});

dojo.declare("wm.ComponentTypeSourceTreeNode", wm.TreeNode, {
	initProps: function(inProps) {
		this.inherited(arguments);
		this._hasChildren = true;
		this.closed = true;
		this.image = this.image || studio.getClassNameImage(this.className);
	},
	initNodeChildren: function() {
		if (this.className) {
			addComponentTypeBinderNodes(this, dojo.getObject(this.className), this.strict);

		}
	},
	expandBySource: function(inObjectId, inProp) {
		var o = this.page.getValueById(inObjectId);
		if (o && o.declaredClass == this.className) {
			this.setOpen(true);
			for (var i=0, n, nodes=this.kids; (n=nodes[i]); i++)
				if (n.expandBySource && n.expandBySource(inObjectId, inProp))
					return true;
		}
	}
});


dojo.declare("wm.ResourceTreeNode", wm.TreeNode, {
	initProps: function(inProps) {
		this.inherited(arguments);

		this._hasChildren = ("files" in this.file && this.file.files.length);
		this.image = this.image || studio.getClassNameImage(this.className);
	},
	initNodeChildren: function() {
	    var _this = this;
	    var children = this.file.files;
	    dojo.forEach(children, function(child) {
		addResourceBinderNodes(_this, child, false);
	    });
	}

});

/*dojo.declare("wm.WidgetsSourceTreeNode", wm.TreeNode, {	widgetTypes: [wm.DataGrid, wm.LiveForm, wm.Editor, wm.List],
	initProps: function(inProps) {
		this.inherited(arguments);
		this._hasChildren = true;
		this.closed = true;
		this.image = "images/wm/widget.png";
	},
	initNodeChildren: function() {
		var widgets = wm.listOfWidgetTypes(this.widgetTypes);
		dojo.forEach(widgets, dojo.hitch(this, function(w) {
			if (w != studio.selected)
				new wm.BindSourceTreeNode(this, {object: w});
		}));
	}
});*/

dojo.declare("wm.WidgetContainerSourceTreeNode", wm.BindSourceTreeNode, {
	initProps: function(inProps) {
		this.inherited(arguments);
		//this.closed = this.shouldInitClosed();
		this.closed = true;
		this._hasChildren = true;
	},
	// open max levels inside root
	shouldInitClosed: function() {
		var r = this.page.root, w = this.object, l = 0, max = 1;
		while (w && w != r) {
			w = w.parent;
			if (l >= max)
				return true;
			l++;
		}
		return false;
	},
	initNodeChildren: function() {
		this.inherited(arguments);

	    // Collect all of the widgets that are children of the current node
	    var widgets = {};
	    for(var w in this.object.widgets)
		if (!this.object.widgets[w].flags.notInspectable || this.object.widgets[w].flags.bindInspectable) // see wm.Layers client for example 
		    widgets[w] = this.object.widgets[w];

	    // If the current node is the wm.Layout of the page,
	    // then also gather all other top level widgets (dialogs)
	    // to put in the visual model
	    if (this.object == this.page.root) {
		var owners = (this.page == studio.page) ? [studio.application, this.page] : [this.page];
		var comps = wm.listComponents(owners, wm.Dialog, false);
		for (var w in comps) {
		    if (!comps[w].flags.notInspectable)
			widgets[w] = comps[w];
		}
	    }

	    // For each widget, add it to the tree
	    wm.forEachProperty(widgets, dojo.hitch(this, function(w) {
			var
				s = (w != studio.selected) && wm.widgetIsBindSource(w) && w.id,
				c = w.container,
				cw = c && wm.hasBindableWidgets(w, studio.selected);
			if (cw)
			    new wm.WidgetContainerSourceTreeNode(this, {page: this.page, object: w, hasBindableWidgets: true});
			else if (s)
			    new wm.BindSourceTreeNode(this, {page: this.page, object: w});
		}));
	},
	widgetIsChild: function(inWidget) {
		var w = inWidget, o = this.object;
		while (w) {
			if (w == o)
				return true;
			w = w.parent;
		}
	},
	expandBySource: function(inObjectId, inProp) {
		var o = this.page.getValueById(inObjectId);
		if (this.widgetIsChild(o)) {
			this.setOpen(true);
			for (var i=0, n, nodes=this.kids; (n=nodes[i]); i++)
				if (n.expandBySource && n.expandBySource(inObjectId, inProp))
					return true;
		}
	}
});



dojo.declare("wm.ResourceItem", wm.Object, {
    itemName: "",
    iconSrc: "images/resourceManagerIcons/file16.png",
    treeNode: null,
    constructor: function(inProps) {
      dojo.mixin(this, inProps);
    },
    getItemPath: function() {
      if (this.treeNode.parent == this.treeNode.tree.root)
	return this.itemName;
      else {
	return this.treeNode.parent.data.getItemPath() + "/" + this.itemName;
      }
    },
    _end: null
});

dojo.declare("wm.ImageResourceItem", wm.ResourceItem, {
    iconSrc: "images/resourceManagerIcons/image16.png",
    init: function() {
	this.inherited(arguments);
    }
});

dojo.declare("wm.JSResourceItem", wm.ResourceItem, {
    iconSrc: "images/resourceManagerIcons/cssjs16.png",
    init: function() {
	this.inherited(arguments);
    }
});

dojo.declare("wm.CSSResourceItem", wm.ResourceItem, {
    iconSrc: "images/resourceManagerIcons/cssjs16.png",
    init: function() {
	this.inherited(arguments);
    }
});

dojo.declare("wm.MiscResourceItem", wm.ResourceItem, {
    init: function() {
	this.inherited(arguments);
    }
});

dojo.declare("wm.HTMLResourceItem", wm.ResourceItem, {
    iconSrc: "images/resourceManagerIcons/html16.png",
    init: function() {
	this.inherited(arguments);
    }
});

dojo.declare("wm.ZipResourceItem", wm.ResourceItem, {
    iconSrc: "images/resourceManagerIcons/file16.png",
    init: function() {
	this.inherited(arguments);
    }
});

dojo.declare("wm.JarResourceItem", wm.ResourceItem, {
    iconSrc: "images/resourceManagerIcons/file16.png",
    init: function() {
	this.inherited(arguments);
    }
});

dojo.declare("wm.FolderResourceItem", wm.ResourceItem, {
    iconSrc: "images/resourceManagerIcons/folder16.png",
    init: function() {
	this.inherited(arguments);
    }
});

/*

    */

 