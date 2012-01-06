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

 dojo.provide("wm.studio.app.inspector.ComponentInspector");
 dojo.require("wm.studio.app.inspector.Inspector");
 dojo.require("wm.studio.app.inspector.BindInspector");
 dojo.require("wm.studio.app.inspector.StyleInspector");
 dojo.require("wm.studio.app.inspector.SecurityInspector");
 dojo.require("wm.base.widget.Tree");

 dojo.declare("wm.ComponentInspector", wm.Layers, {
     inspectors: {
	 Properties: wm.BindInspector,
	 "Events": wm.EventInspector,
	 "CustomMethods": wm.CustomMethodInspector,
	 Styles: wm.StyleInspector,
	 Security: wm.SecurityInspector,
	 Data: wm.DataInspector,
	 Navigation: wm.NavigationInspector
     },
     init: function() {
	 //this.subscribe("wmwidget-rename", this, "reinspect");
	 this.inherited(arguments);
	 this._inspectors = {};
	 for (var i in this.inspectors) {
	     var ctor = this.inspectors[i];
	     this._inspectors[i] = new ctor({border: 0, name: i, parent: this.addLayer(i), owner: this});
	 }
     },
     /* Inspect the specified component
      * NOTE: inInspectorProps is actually a tree node from the tree over the properties panel, 
      *       and is used to tell us which subcomponent we are editting properties for
      */
     inspect: function(inComponent, inInspectorProps) {
	 try {
	     var wasInspecting = this.inspected;

	     var c = this.inspected = inComponent;
	     if (inInspectorProps)
		 this.inspectorProps = inInspectorProps;
	     var ip = this.inspectorProps ;
	     var n = ip && ip.inspector;
	     var inspector = this.getInspector();

	     var changedNode = (this._lastNodeName != ip._nodeName);
	     this._lastNodeName = ip._nodeName;

	     // If we're inspecting the same component with the same inspector, call reinspect
	     if (inspector == this._currentInspector && inComponent == wasInspecting && !changedNode && this.dijits && inspector.tableContainer.innerHTML) {

		 // Update all values in the property inspector UI
		 this._currentInspector.reinspect();
	     } else if (inspector) {

		 // If we have any dijits, we'll need to destroy them all as we'll be reusing those IDs
		 if (this.dijits) dojo.forEach(this.dijits,function(d) {
		     var node = d.domNode;
		     while (node && node.id.match(/^propinspect_row/) == null) {
			 node = node.parentNode;
		     }
		     d.destroy();
		     if (node)
			 dojo.destroy(node); // we need to clean up these node IDs so that data fields in the data inspector can use these names as well
		 });

		 // Cache the current inspector
		 this._currentInspector = inspector;

		 // Generate the property inspector UI
		 inspector.inspect(c);

		 // Turn all editors into dijits and cache them so we can destroy them later
		 try {
		     this.dijits = dojo.parser.parse(this.domNode);
		 } catch(e) {
		     dijit.registry._hash = {};
		     this.dijits = dojo.parser.parse(this.domNode);
		 }
	     }
	 } catch(e) {
	     console.error(e);
	 }
     },

     /* Lookup which inspector should do the editting based on which node in the top property tree is selected */
     getInspector: function() {
	 var selected = this.parent.tree.selected.inspector;
	 switch(selected) {
	 case "Properties":
	     return this._inspectors.Properties;
	 case "Events":
	     return this._inspectors.Events;
	 case "CustomMethods":
	     return this._inspectors.CustomMethods;
	 case "Security":
	     return this._inspectors.Security;
	 case "Data":
	     return this._inspectors.Data;
	 case "Navigation":
	     return this._inspectors.Navigation;
	 case "Styles":
	     if (this._inspectors.Styles.getActiveLayer().name == "properties") {
		 return this._inspectors.Properties;
	     } else {
		 return this._inspectors.Styles;
	     }
	 }

     },

     /* If reinspect is called, verify that we are using the same inspector or we need to call inspect to generate new
      * editors instead of reinspect to populate existing editors
      */
     reinspect: function() {	    
	 var requiredInspector = this.getInspector();
	 var inspectorProps = this.parent.tree.selected.inspector;
	 if (this._currentInspector != requiredInspector || this.inspectorProps.inspector != inspectorProps || !requiredInspector.tableContainer.innerHTML)
	     return this.inspect(this.inspected);
	 if (this.inspected && this.inspectorProps) {
	     this._currentInspector.reinspect(this.inspected);
	 }
     },

     /* Focus on the default property; we've discontinued doing this, but may resume... */
     focusDefault: function() {
	 var inspector = this.getInspector();
	 wm.fire(inspector, "focusDefault");
     },

     /* I believe that select mode is used when seting up composites and wm.Property classes */
     setSelectMode: function(inMode) {
	 for (var i in this.inspectors) {
	     this._inspectors[i].setSelectMode(inMode);
	 }
     },
     writeChildren: function() {
     }
 });

 // magic schema stuff:
 // category: inspector root tree node name
 // categoryProps: inspector root tree node properties
 // categoryParent: a parent node in the inspector
 dojo.declare("wm.ComponentInspectorPanel", wm.Panel, {

     /* The ComponentInspectorPanel is a Tree, splitter and a ComponentInspector */
     init: function() {
	 this.inherited(arguments);
	 var t = ['{',
		  'inspectorTree: ["wm.Tree", {height: "120px", border: 0}, {}, {}],',
		  'splitter3: ["wm.Splitter", {layout: "top", border: 0}, {}, {}],',
		  'inspectorLayers: ["wm.ComponentInspector", {border: 0, flex: 1, box: "v", autoScroll: false}, {}, {}]',
		  '}'];
	 this.readComponents(t.join(''));
	 this.tree = this.owner.inspectorTree;
	 this.inspector = this.owner.inspectorLayers;
	 this.connect(this.tree, "onselect", this, "treeSelect");
     },

     clearTree: function() {
	 if (this.tree)
	     this.tree.clear();
	 this.treeNodes = {};
     },

     // whether a tree node is shown is controlled by the property info first and then the inspector
     canInspect: function(inInspector, inNodeProps) {
	 var i = inInspector, cs = inNodeProps.canInspect, ics = "canInspect", r;
	 if (cs && this[cs])
	     r = this[cs](this.inspected, this.props);
	 else if (i && i[ics])
	     r = i[ics](this.inspected, this.props);
	 else
	     r = true;
	 if (inInspector)
	     inInspector.active = r;
	 return r;
     },

     // Add nodes to the tree...
	 _addTreeNode: function(inInspector, inParent, inProps) {
		 var i = inInspector, a = inProps.addTreeNode, ia = (i||0).addTreeNode;
		 if (a && this[a])
			 return this[a](inParent, this.inspected, inProps, this.props)
		 else if (ia)
			 return ia.apply(i, [inParent, this.inspected, inProps, this.props, this.treeNodes]);
		 else
			 return new wm.TreeNode(inParent, inProps);
	 },
	 addTreeNode: function(inNodeName, inProps, inParent) {
		 inParent = inParent || this.tree.root;
		 inProps = inProps || {};
		 inProps.inspected = this.inspected && this.inspected.getId();
		 inProps._nodeName = inNodeName;
		 inProps.content = wm.extendSchemaDictionary["NODE_" + inNodeName] || inProps.content || inNodeName;
		 inProps.inspector = inProps.inspector || inParent.inspector;
		 inProps.image = inProps.image || inParent.image;
		 // FIXME: need to potentially create inspector if it doesn't exist
		 var ni = this.getInspector(inProps.inspector);
		 if (!this.canInspect(ni, inProps))
			 return;
		 // add node
		 var n = this._addTreeNode(ni, inParent, inProps);
		 if (n)
			 this.treeNodes[n._nodeName || inNodeName] = n;
		 return n;
	 },
	 addTreeSubNode: function(inName, inProps, inParent) {
		 var
			 np = { content: inName };
		 dojo.mixin(np, inProps || {});
		 this.addTreeNode(inParent._nodeName + '.' + inName, np, inParent);
	 },
	 // FIXME: let's not add these to prop tree
	 /*addCollectionTreeNode: function(inComponent) {
		 var
			 collection = inComponent.collection,
			 comps = inComponent.getCollection();
		 if (!this.treeNodes[collection])
			 this.addTreeNode(collection, {image: "images/item.png", isCollection: true});
		 var n = this.treeNodes[collection];
		 dojo.forEach(comps, dojo.hitch(this, function(c) {
			 this.addComponentTreeNode(c.name, {isCollection: true}, n);
		 }));
	 },*/
	 initTree: function(inComponent) {
		 this.clearTree();
		 this.props = inComponent && inComponent.listProperties();
	     this.addTreeNode("Properties", {content: studio.getDictionaryItem("wm.ComponentInpsectorPanel.PROPERTY_NODE_CAPTION"), image: "images/properties_16.png", inspector: "Properties"});
		 this.addTreeNode("Events", {content: studio.getDictionaryItem("wm.ComponentInpsectorPanel.EVENT_NODE_CAPTION"), image: "images/star_16.png", inspector: "Events"});
		 this.addTreeNode("CustomMethods", {content: studio.getDictionaryItem("wm.ComponentInpsectorPanel.CUSTOMMETHOD_NODE_CAPTION"), image: "images/star_16.png", inspector: "CustomMethods"});
		 // component props
		 var props = this.props, p;
		 for (var i in props) {
			 p = props[i];
			 if (p.category && !(p.category in this.treeNodes) && p.categoryProps)
				 this.addTreeNode(p.category, p.categoryProps);
			 // specific to adding components.
			 else if (p.categoryParent) {
				 var n = this.treeNodes[p.categoryParent];
				 if (n)
					 this.addTreeSubNode(i, p.categoryProps, n);
			 }
		 }
		 // FIXME: let's not put these in tree
		 // auto add collection
		 /*for (var i in props)
			 if (i == "collection")
				 this.addCollectionTreeNode(inComponent);
		 */
	 },
	 // FIXME: just refreshes the node if it's part of a collection right now
	 /*refreshTree: function() {
		 var c = this.selectedNode, c = (n || 0).component;
		 var nodes = this.tree.root.kids;
		 for (var i=0, n; (n=nodes[i]); i++)
			 if (n.isCollection) {
				 n.removeChildren();
				 this.addCollectionTreeNode(this.inspected);
				 break;
			 }
		 if (c && n)
			 this._selectComponent(n, c);
	 },*/
	 _selectComponent: function(inNode, inComponentName) {
		 for (var i=0, kids = inNode.kids; (k=kids[i]); i++)
			 if (k.component == inComponentName) {
				 k.tree.select(k);
				 this.selectedNode = k;
				 return true;
			 }
	 },
	 getInspector: function(inInspectorName) {
		 return this.inspector._inspectors[inInspectorName];
	 },
	 updateInspectorLayer: function(inInspectorName) {
		 var
			 n = this.inspectorName = inInspectorName,
			 i = this.getInspector(n);
		 wm.fire((i||0).parent, "activate");
	 },
	 resetInspector: function() {
		 this.inspectorName = null;
	 },
	 // inspector api
	 inspect: function(inComponent) {
		 if (inComponent.noInspector) return;
		 this.inspected = inComponent;
		 this.initTree(inComponent);
		 // update tree selection...
		 var n = this.selectedNode = this.treeNodes[this.inspectorName] || this.treeNodes["Properties"];
		 this.tree.select(n);	        
	 },
	 reinspect: function() {
		 // if we have a component, inspect it
		 var n = (this.selectedNode ||0).component;
		 if (n) {
			 this.inspectComponent(n, this.selectedNode);
		 } else if (this.inspector.inspected == this.inspected) {
		     this.inspector.reinspect();
		 } else {
		     this.inspector.inspect(this.inspected, this.selectedNode);
		 }
	 },
	 focusDefault: function() {
		 wm.fire(this.inspector, "focusDefault");
	 },
	 treeSelect: function(inNode) {
		 if (inNode.inspector)
			 this.updateInspectorLayer(inNode.inspector);
		 this.selectedNode = inNode._nodeName && this.treeNodes[inNode._nodeName];
		 this.reinspect();
	 },
	 inspectComponent: function(inComponentName, inInspectorProps) {
		 this.inspector.inspect(this.inspected.getComponent(inComponentName), inInspectorProps);
	 },
	 refreshComponent: function(inSubComponent) {
		 // look for component in properties or collection node
		 var n = (inSubComponent || 0).name;
		 for (var i=0, kids = this.tree.root.kids, k, f; (k=kids[i]); i++)
			 if (k._nameName == "Properties" || k.isCollection) {
				 var f = this._selectComponent(k, n);
				 if (f)
					 break;
			 }
	 },
	 setSelectMode: function(inMode) {
		 this.inspector.setSelectMode(inMode);
	 },
	 writeChildren: function() {
	 }
 });


 /* New definition for property schema
  * ignore: not written; not editable EVEN IF IT IS A bindTarget (this EVEN IF is new and will cause a few bugs till everything is updated)
  * hidden, writeonly: both mean that the user doesn't see them.  writeonly though shows if its bindable/bindTarget. Both are written whether visible or not.
  * ignoretmp: This property is ignored for its current state; currently we disable/enable the disabled property editor; previously hidden/shown as needed
  * ignoreHint: Hint to give to property editors shown as disabled due to ignoretmp
  * options: array of options for a wm.SelectMenu
  * shortname: Alternate name to show instead of the real name; used for localization and for human readable prop names
  * operation: Show a button instead of an editor; component must have a method with the same name as the property name. If boolean, calls this.propertyName(); if a string it calls this[prop.operation]()
  * method: treat a property as a method, there only for property documentation and autocompletion
  * pageProperty: Used by the bind dialog to determine the property to use to find the subpage and let the user browse the subpage's properties
  * editor: Name of an editor class; typically an editor from propertyEdit.js which knows how to setup its own options
  * editorProps: Properties to pass in when creating editor; only has meaning if "editor" is specified
  * subtype: Currently supports a value of "file" telling it that the bind button should go to the resources panel
  * extensionMatch: For subtype=file, contains an array of valid file extensions to bind to
  * nonlocalizable: property should not be written to localization dictionaries
  * doc: if the property isn't a method, and its not visible (ignored), this signals that its still something the user should know about, just not in the properties panel
  * simpleBindProp: This property is the only property to show for this widget under the basic bind dialog
  * categoryParent: OLD DEF: Adds a tree node to the property panel to the node with the given name; selecting the node shows the properties for the component specified in categoryProps
  * categoryProps.component: inspector will inspect this[categoryProps.component] (i.e. this.dataOutput) 
  * categoryProps.inspector: OLD DEF: Specifies which inspector to use to inspect this component
  * createWire: creates a wire instead of calling setProp
  * readonly: useful for bindable props; user can see them, bind them, but not directly edit the property.  They only write the binding, not the value! TODO: USE THIS!  NOTE: readonly is ignored when setting the property editor's readonly state; the property is shown to be edited.  Use editorProps to make the editor readonly.
  * 
  * subcomponent: the property refers to a subcomponent whose properties should be displayed in the property panel
  *
  * How to control what editor shows up for a property
  * 1. Default behavior: the type of the current value determines the type of editor; if its a number you get a wm.Number; if its boolean you get a checkbox; else you get wm.Text
  * 2. Your type schema can specify an editor; this overrides the type from default behavior    width: { group: "layout", order: 20, doc: 1, editor: "wm.prop.SizeEditor"}
  * 3. makePropEdit method in any given component can override all other methods of specifying the editor; you can return an editor from makePropEdit to be used for editing the prop
  */
 /* TODO:
  * 1. For every widget, change group: 'method' to method: true
  * 2. For every widget add operation: 1 to group: "operation" or other buttons
  * 3. Remove use of ignore when what we really want is writeonly or readonly
  * 4. Find all setPropEdit methods and remove them
  * 5. Finda all editProp methods and remove everything that can be removed
  * 6. Find all makeEditProp methods and remove everything that can be removed
  * 7. Make a _design files for every component
  * 8. Find all bindable/bindTarget properties that should be readonly and make them readonly
  */
 dojo.declare("wm.PropertyInspector", wm.AccordionLayers, {    
     preferredMultiActive: false,
     multiActive: false,
     ignoreHintPrefix: "<p><b>Why is this disabled?</b></p>",
     classNames: "wminspector",
     layerBorder: 0,
     autoScroll: true,
     inspected: null,
     props: null,
     dataSets: [],
     inspect: function(inComponent, forceInspect) {	
	 if (this.inspected == inComponent && !forceInspect) {
	     return this.reinspect();
	 }
	 this._inspecting = true;
	 var activeLayer = this.getActiveLayer();
	 if (activeLayer)
	     this._activeLayer = activeLayer.caption;
	 try {
	     this.inspected = inComponent;
	     this.layerIndex = -1;
	     while (this.layers.length) {
		 this.layers[0].active = false;
		 this.layers[0].destroy();
	     }
	     while(this.dataSets.length)
		 this.dataSets[0].destroy();
	     this.props = this.getProps(inComponent,false);
	     this.editorHash = {};
	     this.bindEditorHash = {};
	     this.subcomponents = {};
	     this.generateGroups(inComponent);
	 } catch(e) {
	     console.error(e);
	 } finally {
	     this._inspecting = false;
	 }
	 this.layerIndex = -1; // make sure it rerenders when we call setLayerIndex
	 if (this._reselectLayerIndex !== undefined && this._reselectLayerIndex < this.layers.length) {
	     this.setLayerIndex(this._reselectLayerIndex);
	 } else {
	     this.setLayerIndex(0);
	 }
     },
     getHashId: function(inComponent, propName) {
	 var id = inComponent.getId();
	 if (this.processingRequiredGroup) {
	     id = "required_" + id;
	 }
/*
	 if (id.indexOf(".") == -1) {
	     id = "";
	 } else {
	     id = id.substring(id.indexOf(".") + 1) + ".";
	 }
	 */
	 return  id + "." + propName;
     },
     reinspect: function(inSubComponent) {
	 /* the previous reinspect will trigger onEditorChange events which will trigger additional reinspects; insure that all of the onEditorChange
	  * events combined can only trigger a single additional reinspect
	  */
	 wm.job("studio.inspect", 10, dojo.hitch(this, "_reinspect", inSubComponent));
     },

     _reinspect: function(inSubComponent) {
	 var inComponent = inSubComponent || this.inspected;
	 this._inspecting = true;
	 try {
	     var props = this.getProps(inComponent,false);
	     for (var i = 0; i < props.length; i++) {
		 var p = props[i];
		 var propName = p.name;
		 var propFullName = p.fullName || propName;
		 var e = this.editorHash[this.getHashId(inComponent,propFullName)];
		 if (e && e.isDestroyed) {
		     delete this.editorHash[this.getHashId(inComponent,propFullName)];
		     e = undefined;
		 }
/*
		 if (p.subcomponent) {
		     this.reinspectSubcomponentEditors(this.inspected,p);
		     continue;
		 }
		 */
		 var binde = this.bindEditorHash[this.getHashId(inComponent,propFullName)];
		 if (e) {		     
		     this.reinspectEditor(inComponent, e, binde, p);
		 }
		 this.processingRequiredGroup = true;
		 e = this.editorHash[this.getHashId(inComponent,propFullName)];
		 if (e && e.isDestroyed) {
		     delete this.editorHash[this.getHashId(inComponent,propFullName)];
		     e = undefined;
		 }
		 var binde = this.bindEditorHash[this.getHashId(inComponent,propFullName)];
		 if (e) {		     
		     this.reinspectEditor(inComponent, e, binde, p);
		 }
		 delete this.processingRequiredGroup;
	     }
	 } catch(e) {}

	 this._inspecting = false;
	 this.reflow();
     },
     reinspectEditor: function(inComponent, e, binde, inProp,optionalAppendToHashName) {
	 var propName = inProp.name;
	 var propPath = inProp.fullName || inProp.name;
	 var skipSetEditor = false;
	 if (!binde)  binde = this.bindEditorHash[(optionalAppendToHashName ? optionalAppendToHashName + "_" : "") +  this.getHashId(inComponent,propPath)];

	 /* If its a wm.prop.SelectMenu then call its reinspect method to update its dataset */
	 if (e instanceof wm.prop.SelectMenu) {
	     e.updateOptions();
	 }

	 /* If the editor provides its own reinspect method, then run it.  This happens in the following cases:
	  * 1. A wm.SelectMenu editor, provisioned through a call to inComponent.makePropEdit, gets a reinspect method
	  *    added by makePropEdit (up to the developer to write this)
	  * 2. Some of the more complex editors in propertyEdit.js need to do their own reinspect
	  * NOTE: if reinspect returns true, then we skip the local reinpsect code entirely;
	  *       if it returns false, then it only updated the dataSet or set of editors or configuration
	  *       and still needs the reinpsect code below to be called.
	  */
	 else if (e.reinspect) {
	     skipSetEditor = e.reinspect();
	 }

	 /* Else if its a wm.SelectMenu, and not one generated from propertyDef options array (which
	  * would mean the options were static and no new dataSet needed), then
	  * the only way we have of insuring its dataSet is up to date is to regenerate it entirely.
	  */
	 else if (e instanceof wm.SelectMenu && !inProp.options) {
	     var parent = e.parent;
	     parent.removeAllControls();
	     e = this.generateEditor(inComponent,inProp, parent.parent, parent); 
	     this.editorHash[(optionalAppendToHashName ? optionalAppendToHashName + "_" : "") +  this.getHashId(inComponent,propPath)] = e;
	 
	     /* If the editor was regenerated, it already shows the latest value; no need to set the editor here */
	     skipSetEditor = true;
	 } 

	 
	 if (!skipSetEditor) {

	     /* Find the current value of the property, which may be a binding */
	     var newVal;
	     var isBound = this.isPropBound(inComponent, inProp);
	     if (isBound) {
		 var wire = inComponent.$.binding.wires[propPath];
		 newVal = wire.source || wire.expression; // TODO: prefix with str,numb, bool, expr
	     } else {
		 if (inProp.treeBindRoot) {
		     newVal = inComponent.getValue(propPath);
		 } else {
		     newVal = inComponent.getProp(propPath);
		 }
		 if (newVal instanceof wm.Component) {
		     if (newVal === inComponent || newVal.isOwnedBy(inComponent)) {
			 // don't show the value if the value is self or is something being managed internally; binding
			 // is for connecting to a different component's properties.
			 newVal = "";
		     }
		 }
	     }

	     // if you call getDataValue on a NumberEditor whose displayValue is a bind expression, you get back undefined
	     // because its not a number
	     if (e instanceof wm.AbstractEditor && !isBound) {
		 var oldVal = e.showing ? e.getDataValue() : binde && binde.showing ? binde.getDataValue() : e.getDataValue();

		 // If the value has changed, update it.
		 if (newVal !== oldVal) {
		     e.setDataValue(newVal);
		 } 

		 /* If the dataValue is an object, only the editor can figure out whether its really changed or not,
		  * just call setDataValue and let it sort things out 
		  */
		 else if (typeof newVal == "object" && newVal !== null) {
		     e.setDataValue(newVal);// make sure the editor sees the updated hash or array
		 }
	     }

	     /* In advanced mode we disable editors that aren't applicable and set a mouseover hint to explain why its disabled.
	      * In basic mode, just hide the editor
	      */
	     e.setDisabled(inProp.ignoretmp || e.alwaysDisabled); // make sure though to change the disabled property if ignoretmp changed...
	     if (this.isAdvancedMode()) {
		 e.setHint(inProp.ignoretmp && inProp.ignoretmp ? this.ignoreHintPrefix +  inProp.ignoreHint : "");
	     } else {
		 e.parent.setShowing(!inProp.ignoretmp);
	     }
	     
	     /* If its a bindable property, update whether the bindeditor or regular editor is showing and update the bindeditor's value. */
	     if (inProp.bindable || inProp.bindTarget) {
		 e.setShowing(!isBound);
		 binde.setShowing(Boolean(isBound));
		 e.parent.setHeight((isBound ? binde.bounds.h : e.bounds.h) +  "px");
		 var wire = inComponent.$.binding && inComponent.$.binding.wires[propPath];
		 binde.setDataValue(wire ?this.getFormattedBoundValue(inProp.type, wire.source,wire.expression) : "");
	     }
	 }
/*
	 if (inProp.subcomponent) {
	     var subcomponent = inComponent.$[propName];
	     if (this.subcomponents[subcomponent.getId()] && 
		 this.subcomponents[subcomponent.getId()].className == subcomponent.declaredClass) {
		 this.reinspect(subcomponent);
	     } else if (this.subcomponents[subcomponent.getId()]) {
		 var subComponentParent = this.subcomponents[subcomponent.getId()].parent;
		 delete this.subcomponents[subcomponent.getId()];

		 subComponentParent.removeAllControls();
		 for (var name in this.editorHash) {
		     var componentid = name.replace(/\.[^\.]*$/,"");
		     if (componentid == subcomponent.getId()) {
			 delete this.editorHash[name];
		     }
		 };
		 var props = this.props;
		 this.props = this.getProps(subcomponent,true);
		 this.generateEditors(subcomponent, "", subComponentParent);
		 this.props = props;

		 this.subcomponents[subcomponent.getId()] = {className: subcomponent.declaredClass,
							     parent: subComponentParent};
	     } else {
		 var currentLayer;
		 dojo.forEach(this.layers, function(l) {if (l.propertyGroup.name == inProp.group) currentLayer = l;});
		 if (!currentLayer) {
		     alert("INVESTIGATE THIS CONDITION");
		     var y = this.addLayer(g.displayName);
		     y.header.setMargin("0,2,2,2");
		     y.header.setBorder("1");
		     y.header.setBorderColor("#333");
		     currentLayer._groupName = inProp.group;
		     this.generateLayer = currentLayer;
		 }

		 this.generateEditors(subcomponent, inProp.group, currentLayer);
	     }
	 }
	 */     
     },
     isEditableProp: function(inProp, allowStyleInspector) {
	 if (inProp.advanced && !this.isAdvancedMode())
	     return false;
	 if (inProp.group == "style" && inProp.editor != "wm.prop.StyleEditor" && !allowStyleInspector)
	     return false; // handled by the style inspector only
	 if (inProp.ignore)
	     return false;
	 if (inProp.method)
	     return false;
	 if (inProp.bindTarget || inProp.bindable) 
	     return true; // shows up even if writeonly/hidden are true; user can't set the value but can bind the value
	 if (inProp.writeonly || inProp.hidden) /* writeonly and hidden appear to be identical */
	     return false;

	 return true;
     },
     getProps: function(inComponent,isSubComponent) {
	 if (isSubComponent && (inComponent.declaredClass == "wm.Variable" || inComponent.declaredClass == "wm.ServiceInput")) {
	     var props = [];
	     var propsHash = inComponent._dataSchema;
	     for (var i in propsHash) {
		 propsHash[i].name = i;
		 props.push(propsHash[i]);
	     }
	     return props;
	 }

	 var allProps = inComponent ? inComponent.listProperties() : {};
	 var props = [];
	 for (var i in allProps) {
	     if (this.isEditableProp(allProps[i])) {	     
		     var p = dojo.mixin({name: i}, allProps[i]);
		 if (allProps[i].isEvent || inComponent.isEventProp(i)) {
		     p.group = "events";
		     if (i.match(/\d$/)) continue; // ignore events that end in numbers; these are the "and-then" events, which are handled by the event editor
		 } else if (allProps[i].isCustomMethod) 
		     p.group = "custommethods";
		 else if (!allProps[i].group) 
		     p.group = "Properties";
		 props[i] = p;
	     }
	 }
	 if (isSubComponent) {
	     delete props.owner;
	     delete props.name;
	     delete props.viewDocumentation;
	     delete props.generateDocumentation;
	 }
	 var newprops = [];
	 for (var propName in props) {
	     newprops.push(props[propName]);
	 }

	 newprops = newprops.sort(function(a,b) {
	     if (a.order !== undefined && b.order !== undefined)
		 return a.order - b.order;
	     else if (a.order !== undefined)
		 return -1;
	     else if (b.order !== undefined)
		 return 1;
	     else
		 return wm.compareStrings(a.name,b.name);
	 });

	 return newprops;
     },
     addSubGroupIndicator: function(inName, inParent) {
	 new wm.Label({_classes: {domNode: ["wminspector-subgroupLabel"]}, parent: inParent,owner: this, caption:inName, width: "100%", border: "0,0,2,0", borderColor: "#959DAB"});
     },
     generateEditors: function(inComponent, inGroupName, inLayer) {
	 var groupObj;
	 if (inGroupName) {
	     for (var i = 0; i < this.groups.length; i++) {
		 if (this.groups[i].name == inGroupName) {
		     groupObj = this.groups[i];
		     break;
		 }
	     }
	 }
	 if (groupObj) {
	     for (var subgroupName in groupObj.subgroups) {		 
		 var subgroup = groupObj.subgroups[subgroupName];
		 if (subgroup.props.length) {
		     this.addSubGroupIndicator(subgroup.displayName || subgroupName,inLayer);
		     this._generateEditors(inComponent, inLayer, subgroup.props, !this.isAdvancedMode());
		 }
	     }
	     this.processingRequiredGroup = inGroupName == "required";
	     this._generateEditors(inComponent, inLayer, groupObj.props,inGroupName == "required" || !this.isAdvancedMode());
	     delete this.processingRequiredGroup;
	 } else {
	     this._generateEditors(inComponent, inLayer, this.props, !this.isAdvancedMode());
	 }
     },

     _generateEditors: function(inComponent, inLayer, inPropList, skipIgnoreTmp) {
	 for (var i = 0; i < inPropList.length; i++) {
	     var p = inPropList[i];
	     var propName = p.name;
	     //if (skipIgnoreTmp && p.ignoretmp) continue;
	     if (p.operation) {
		 this.generateButton(inComponent, p, inLayer);
	     } else {
		 var e = this.generateEditor(inComponent,p, inLayer);
	     }
	 }
     },
     generateButton: function(inComponent,inProp, inLayer) {
	 var b = new wm.Button({
	     owner: this,
	     parent: inLayer,
	     width: "100%",
	     height: "30px",
	     caption: inProp.shortname || inProp.name,
	     margin: "4,40,4,40"
	 });
	 this.editorHash[this.getHashId(inComponent,inProp.name)] = b;
	 b.connect(b, "onclick", this, function() {
	     inComponent[typeof inProp.operation == "string" ? inProp.operation : inProp.name]();
	     this.reinspect();
	 });
     },

     generatePanelForEditor: function(inParent, inName) {	 
	 return new wm.Panel({
	     owner: this,
	     parent: inParent,
	     name: "propEditPanel_" + inName,
	     layoutKind: "left-to-right",
	     width: "100%",
	     height: "30px", /* This height is ignored; we call setBestHeight after we're done */
	     verticalAlign: "top",
	     horizontalAlign: "left"});

     },



     generateEditor: function(inComponent, inProp, inLayer, optionalParent, optionalAppendToHashName) {
	 var value;
	 var isBound = false;
	 var propName = inProp.name;
	 var fullPropName = inProp.fullName || propName;
	 var hashId = (optionalAppendToHashName ? optionalAppendToHashName + "_" : "") +  this.getHashId(inComponent,fullPropName);
	 /**********************************************************
	  * Get the panel we'll insert our editor into 
	  **********************************************************/
	 var panel = optionalParent;
	 if (!panel) {
	     panel = this.generatePanelForEditor(inLayer, inComponent.getId() + "_" + inProp.name);
/*
	     if (inProp.subcomponent) {
		 panel.setLayoutKind("top-to-bottom");
		 panel.setFitToContentHeight(true);
	     }
	     */
	     panel.setShowing(!inProp.ignoretmp || this.isAdvancedMode());
	 }

	 /**********************************************************
	  * Get the current value of the editor; some complex editors don't have a value as such, 
	  * but instead manage their own values in which case this lookup is ignored
	  ***********************************************************/

	 var isBound = this.isPropBound(inComponent, inProp); 
	 if (isBound) {
	     var wire = inComponent.$.binding.wires[fullPropName || propName];
	     value = wire.source || wire.expression; // TODO: prefix with str,numb, bool, expr
	 } else if (inProp.treeBindRoot) {
	     value = inComponent.getValue(propName);
	 } else {
	     value = inComponent.getProp(propName);
	 }

	     if (value instanceof wm.Component) {
		 if (value === inComponent || value.isOwnedBy(inComponent)) {
		      // don't show the value if the value is self or is something being managed internally; binding
		     // is for connecting to a different component's properties.
		     value = "";
		 }
	     }


	 /**********************************************************
	  * Get the editor properties 
	  **********************************************************/
	 var editorProps = this.getDefaultEditorProps(inComponent, inProp, value, this, panel, hashId);	 
	 editorProps.showing = !isBound;

	 if (inProp.editorProps) {
	     editorProps = dojo.mixin(editorProps, inProp.editorProps);
	 }

	 /**********************************************************
	  * Create the Editor Widget
	  **********************************************************/
	 if (inProp.isEvent) {
	     editorProps.propName = inProp.name;
	     var e = new wm.prop.EventEditorSet(editorProps);
	     this.editorHash[hashId] = e;
	 } else {
	     var e = inComponent.makePropEdit(inProp.name, value, editorProps);
	     if (!e || e instanceof wm.Control == false) {
		 var ctor;
		 /*
		 if (inProp.subcomponent) {		
		     return this.generateSubcomponentEditors(inComponent, inProp, panel);
		 } else {
		 */
		     e = this.generateEditorFromProps(inProp, editorProps, value);
		 /*
		 }
		 */
	     }


	     e.connect(e, "onchange", this, dojo.hitch(this, "onEditorChange", e, inProp, inComponent));
	 }
     
	 /* Cache a refernce to the editor so that reinspect can quickly find it */
	 this.editorHash[hashId] = e;


	 /**********************************************************
	  * Create the readonly bind editor that shows the bound value
	  **********************************************************/
	 if ((inProp.bindable || inProp.bindTarget) && !e.noBindColumn) {
	     this.createBindEditor(inProp, editorProps, e, isBound, inComponent,optionalAppendToHashName);
	 } else if (!e.noBindColumn) {
	     new wm.Spacer({owner:this,
			    parent: panel,
			    width: "20px",
			    height: "20px"});
	 }
	 var self = this;
	 if (!e.noHelpButton) {
	     this.createHelpButton(inComponent, inProp, panel, e.captionPosition == "top" ? parseInt(e.captionSize) : 0);
	 }
	 panel.setBestHeight();
	 return e;
     },

     /* When showing a bound value, get a pretty printed version of it */
     getFormattedBoundValue: function(inType, inSource, inExpr) {
	var inValue = "";
	if (!inSource && !inExpr)
	    ;
	else if (inSource) 
	    inValue = "bind: " + inSource;
	else if (inExpr === undefined || inExpr === null || inExpr === "" || String(inExpr).match(/^\s*$/))
	    inValue = "";
	else if (inExpr == "true")
	    inValue = "bool: true";
	else if (inExpr == "false")
	    inValue = "bool: false";
	else if (inExpr == "null")
	    inValue = "null: null";
	else if (inExpr == "null")
	    inValue = "null: null";
	 else if (String(inExpr).match(/\d/) && !isNaN(inExpr)) { // isNaN("") == isNaN(" ") == false
	     if (inType.toLowerCase() == "data" ||
		 inType.toLowerCase() == "time" ||
		 inType.toLowerCase() == "java.util.date") {
		 inValue = "date: " + dojo.date.locale.format(new Date(Number(inExpr)), {selector: "date"});
	     } else {
		 inValue = "numb: " + inExpr;
	     }
	 } else if (inExpr == "(binding data)")
	    inValue = inExpr;
	else {
	    var matches = inExpr.match(/^\s*\"([^\"]*)\"\s*$/);
	    if (matches)
		inValue = "str: " + matches[1];
	    else
		inValue = "expr: " + inExpr;
	    inValue = String(inValue).replace(/\"/g, "'") || "";
	}
	return inValue;
    },

     /**************************************************************************************
      * isPropBound: Tells the generateEditor method if its generating an editor showing
      *              a value that is currently bound.
      *
      * Isn't it enough to know that this component has a binding on this field?
      * Nope; for wm.Variable's dataSet property, if there is a field "name" that you've bound to,
      * then it will appear that you've bound the variable's name property which isn't bindable,
      * when in fact you've bound the name data field 
      **************************************************************************************/
     isPropBound: function(inComponent, inProp) {
	 return Boolean((inProp.bindable || inProp.bindTarget) && inComponent.$.binding && inComponent.$.binding.wires[inProp.fullName || inProp.name]);
     },

     /**************************************************************************************
      * Creates a help button that opens a dialog showing property docs
      **************************************************************************************/
     createHelpButton: function(inComponent, inProp, inPanel, captionHeight) {
	 var self = this;
	 wm.Label({owner: this,
		   caption: "",
		   parent: inPanel,
		   width: "20px",
		   height: (20 + captionHeight) + "px",
		   margin: captionHeight + ",0,0,0",
		   onclick: function() {
		       studio.helpPopup = self.getHelpDialog();
		       self.beginHelp(inProp.name, inPanel.domNode, inComponent.declaredClass);
		   },
		   _classes: {domNode: ["EditorHelpIcon"]}});
     },


     /**************************************************************************************
      * Creates an editor for showing a bound value, sets it to showing/hiding based
      * on whether there IS a bound value, and adds bind and reset buttons
      **************************************************************************************/
     createBindEditor: function(inProp, editorProps, e, isBound, inComponent,optionalAppendToHashName) {
	 if (!isBound) editorProps.dataValue = undefined;
	 else {
	     var w = inComponent.$.binding.wires[inProp.fullName || inProp.name];
	     editorProps.dataValue = this.getFormattedBoundValue(inProp.type, w.source,w.expression);
	 }
	 var bindEditorProps = 
	     dojo.mixin(editorProps, 
			{ captionSize: (e.captionSize == "100%") ? "80px" : e.captionSize, // 100% for checkbox; need more than 16px to show bind value
			  disabled: true,
			  _classes: {domNode: ["wminspector-boundvalue"]},
			  hint: inProp.ignoretmp && inProp.ignoreHint ?  this.ignoreHintPrefix + inProp.ignoreHint : "", // a bound editor of an ignored property
			  resetButton: true,
			  showing: isBound,
			  name: "propEditBind_" + inComponent.getId() + "." + inProp.name,
			  _resetButtonUrl: "images/inspector_bind_disabled.gif"
			});
	 var bindableEditor = new wm.Text(editorProps);

	 bindableEditor._onResetClick = dojo.hitch(this, function() {
	     var parent = e.parent;
	     var propName = inProp.fullName || inProp.name;
	     var w = inComponent.$.binding.wires[propName];
	     if (w) 
		 inComponent.$.binding.removeWire(w.getWireId());
	     bindableEditor.hide();
	     e.clear();
	     /* Clear causes onchange which causes reinspect which may destroy the editor */
	     if (!e.isDestroyed) {
		 e.show();
		 parent.setHeight(e.bounds.h + "px");
		 this.reinspect();
	     }
	 });

	 this.bindEditorHash[(optionalAppendToHashName ? optionalAppendToHashName + "_" : "") +  this.getHashId(inComponent,inProp.fullName || inProp.name)] = bindableEditor;

	 if (!e.hideBindColumn) {
	     var captionHeight = (bindableEditor.captionPosition == "top" ? parseInt(bindableEditor.captionSize) : 0);
	 var l = new wm.Label({owner:this,
			       parent: e.parent,
			       _classes: {domNode: ["wminspector-bindProp"]},
			       caption: "",
			       margin: captionHeight + ",0,0,0",
			       width: "20px",			       
			       height: captionHeight + 20 + "px"});
	 var self = this;
	 l.onclick = function() {
	     //studio.bindDialog.page.update({object: inComponent, targetProperty: inProp.treeBindField || inProp.name});
	     var p = self.getBindDialogProps(inComponent,inProp,e);
	     studio.bindDialog.page.update(p);
	     studio.bindDialog.show();
	 };
	 }
     },

     /**************************************************************************************
      * Handles any onchange event from a standard property editor widget.  Editors
      * that are actually panels for groups of editors probably have their own
      * onchange event handlers.  Events also have their own onchange handler
      **************************************************************************************/
     onEditorChange: function(inSender, inProp, inComponent, inDisplayValue, inDataValue)  {
	 if (inComponent.isDestroyed) return;

	 // onchange events triggered by setting values in the editors programatically should be ignored
	 if (this._inspecting) return; 

	 var e = inSender;
	 try {
	     /* If the editor doesn't have the createWire flag on it, then inputs into the editor should result in 
	      * simply setting of the property
	      */
	     if (!e.createWire) {
		 /* TODO: PROPINSPECTOR CHANGE: Need to use the UNDOABLE TASK MANAGER */
		 if (e instanceof wm.prop.FieldGroupEditor) {
		     inComponent.setValue(inProp.name, inDataValue);
		 } else {
		     inComponent.setValue(inProp.name, inDataValue);
		 }
	     } 

	     /* Else we need to create a wm.Wire for the new value */
	     else {
		 /* editor that uses the bindTarget property can control what the target of the binding is; typically though,
		  * we're just binding to inProp.name.  bindTarget is used by wm.prop.FieldGroupEditor.
		  */
		 var bindPropName = e.bindTarget || inProp.fullName || inProp.name;

		 /* If there is no data value, then there is no wire; make sure that any wire is removed */
		 if (!inDataValue) {
		     inComponent.$.binding.removeWire(bindPropName);
		     inComponent.setValue(bindPropName, undefined);
		 } else if (inDataValue) {
		     /* If an editor uses the createExpressionWire property, then we are creating a binding expression instead
		      * of binding to a target.  Used by wm.prop.FieldGroupEditor.  Typically we are binding something like
		      * a dataSet where we get the name/id of a component and we bind to it.
		      */
		     if (e.createExpressionWire) {
			 inDataValue = this.parseExpressionForWire(inDataValue);
			 inComponent.$.binding.addWire("", bindPropName, "", inDataValue);
		     } else {
			 inComponent.$.binding.addWire("", bindPropName, inDataValue);
		     }
		 }	  
	     }
	 } catch(e) {}
	 
	 /************************************************************************************************************
	  * Adding a wire calls inComponent.setValue(propName, valueOfTheSourceOrExpression);
          * sometimes a widget simply destroys itself and creates a replacement copy; 
          * for example, when I change editorType my text editor is destroyed and a number editor is created.
	  * If that happens, we don't want to reinpsect...
	  ************************************************************************************************************/
	 if (inComponent.isDestroyed) return;

	 // if the name field changes, then all of our editorHash IDs are invalidated.
	 // make sure that this isn't a name field such as for sourceData/input/filter/dataSet/dataOutput,
	 // and if it IS our widget's name, then do a full fresh inspect
	 if (inProp.name == "name" && !inProp.bindTarget) {
	     this.inspect(inComponent, true);
	 }

	 /* Sometimes an editor knows reinspecting is not needed or will cause side-effects; The Roles editor uses this */
	 else if (!e.noReinspect) {
	     this.reinspect();
	 }
     },

     generateEditorFromProps: function(inProp, editorProps, value) {
	 var ctor;
	 if (inProp.editor) {
	     ctor = dojo.getObject(inProp.editor);
	     if (!inProp.editorProps || !inProp.editorProps.height) {
		 this.adjustHeightProperty(editorProps, ctor);
	     }
	 } else if (inProp.options) {
	     ctor = wm.SelectMenu;
	     editorProps.options = inProp.options;
	     editorProps.displayField = editorProps.dataField = "dataValue";
	 } else {
	     switch(String(inProp.type).toLowerCase() || typeof value) {
	     case "java.lang.boolean":
	     case "boolean":
		 ctor = wm.Checkbox;
		 editorProps.startChecked = Boolean(value);
		 editorProps.captionSize = "100%";
		 editorProps.captionPosition = "left";
		 editorProps.emptyValue = "false";
		 editorProps.dataType = "boolean";
		 editorProps.checkedValue = true;
		 editorProps.height = wm.Checkbox.prototype.height;
		 break;
	     case "java.lang.integer":
	     case "java.lang.float":
	     case "int":
	     case "number":
	     case "java.lang.long":
	     case "java.lang.double":
		 ctor = wm.Number;
		 break;
	     case "date":
	     case "time":
	     case "java.util.date":
		 ctor = wm.DateTime;
		 editorProps.dateMode = "Date";
		 break;
	     default:
		 ctor = wm.Text;
	     }
	 }
	 editorProps.dataValue = value;
	 var e =  new ctor(editorProps);
	 return e;
     },
	      /* If the default height for the editor is larger than the default height of a regular
	       * abstract editor, then our standard height will be too small and should be adjusted
	       */
     adjustHeightProperty: function(editorProps, ctor) {
	 if (ctor && ctor.prototype instanceof wm.Control) {
	     var standardHeight = parseInt(wm.AbstractEditor.prototype.height);
	     var ctorHeight = parseInt(ctor.prototype.height);
	     if (ctorHeight > standardHeight) {
		 editorProps.height = ctorHeight + "px";//(parseInt(editorProps.height) + ctorHeight-standardHeight) + "px";
	     }
	 }
     },
/*
     generateSubcomponentEditors: function(inComponent, inProp, panel) {
	 var props = this.props;
	 var subcomponent = inComponent.$[inProp.name];
	 if (subcomponent) {
	     this.subcomponents[subcomponent.getId()] = {className: subcomponent.declaredClass,
							 parent: panel};
	     this.props = this.getProps(subcomponent,true);
	     this.generateEditors(subcomponent,"", panel);
	     this.props = props; // cache the current props until the subcomponent inspection is done
	 }
     },
     reinspectSubcomponentEditors: function(inComponent, inProp) {
	 var props = this.props;
	 var subcomponent = inComponent.$[inProp.name];
	 if (subcomponent) {
	     this.subcomponents[subcomponent.getId()] = {className: subcomponent.declaredClass,
							 parent: panel};
	     this.props = this.getProps(subcomponent,true);
	     this._reinspect(subcomponent);
	     this.props = props; // cache the current props until the subcomponent inspection is done
	 }
     },
     */
     parseExpressionForWire: function(inValue) {
	 // A bind wire expression must be a string 
	 if (typeof inValue == "number") {
	     return String(inValue);
	 } else if (typeof inValue == "boolean") {
	     return String(inValue);
	 } else if (typeof inValue == "object") {
	     return inValue; // may need to handle this some day... but this shouldn't ever happen
	 } else if (inValue == "true" || inValue == "false" || inValue.match(/^\d+$/) || inValue.match(/\"/) || inValue.match(/\$\{.*\}/) || inValue.match(/(\+|\-|\*|\/|\w\.\w)/)) {
	     ; // its an expression, no need to quote it
	 } else {
	     return  '"' + inValue + '"'; // its a string; quote it.
	 }

	 // Still here? Must be an expression; lets attempt to validate the expression
	 try {
	     var tmp = inValue;
	     tmp = tmp.replace(/\$\{.*?\}/g, "''"); // remove the crazy stuff that we dont want to try evaluating right now (probably ok to evaluate it at design time, but its not needed to see if this will compile)
	     // if its undefined, then presumably it failed to compile
	     var tmp2 = eval(tmp);		
	     /* TODO: In 6.4 we openned the bind dialog so they could edit their bind expression in a larger area */
	     if (tmp2 === undefined) {
		 //this.beginBind(origProp, dojo.byId("propinspect_row_" + origProp));
		 //studio.bindDialog.bindSourceDialog.expressionRb.editor.setChecked(true);
		 //studio.bindDialog.bindSourceDialog.expressionEditor.setDataValue(inValue);
		 app.toastError(studio.getDictionaryItem("wm.DataInspector.TOAST_EXPRESSION_FAILED"));
		 throw "Invalid Bind Expression";
	     }
	    } catch(e) {
		//this.beginBind(origProp, dojo.byId("propinspect_row_" + origProp));
		//studio.bindDialog.bindSourceDialog.expressionRb.editor.setChecked(true);
		//studio.bindDialog.bindSourceDialog.expressionEditor.setDataValue(inValue);
		app.toastError(studio.getDictionaryItem("wm.DataInspector.TOAST_EXPRESSION_FAILED"));
		throw "Invalid Bind Expression";
	    }
	 return inValue;
     },
	 beginHelp: function(inPropName, inNode, inType) {
	       var bd = studio.helpPopup;
	       bd.page.setHeader(inType,inPropName);

	       bd.sourceNode = inNode;
	       //bd.positionNode = inNode.parentNode;
	       bd.fixPositionNode = inNode.parentNode;
	       bd.corner = "tl";
	     if (window.location.search.match(/editpropdoc/)) {
		 var classList = [];
		 studio.palette.forEachNode(function(node) {
		     if (node.klass) {
			 try {
			     var prototype = dojo.getObject(node.klass).prototype;
			     if (node.klass.match(/^wm\./) && node.klass != "wm.example.myButton" && prototype instanceof wm._BaseEditor == false && prototype instanceof wm.Editor == false && (!prototype.schema[inPropName] || !prototype.schema[inPropName].ignore)) {
				 if (prototype[inPropName] !== undefined || prototype["get" + wm.capitalize(inPropName)] !== undefined) {
				     var name = node.klass.replace(/^.*\./,"");
				     if (dojo.indexOf(classList, name) == -1)
					 classList.push(name);
				 }
			     }
			 } catch(e){}
		     }
		 });

		 dojo.forEach(classList, function(className,i) {
		     window.setTimeout(function() {
			 var version = wm.studioConfig.studioVersion.replace(/^(\d+\.\d+).*/,"$1");
			 var url = studio.getDictionaryItem("wm.Palette.URL_CLASS_DOCS", {studioVersionNumber: version,
											  className: className.replace(/^.*\./,"") + "_" + inPropName});

			 app.toastInfo("Testing " + className + "." + inPropName);
			 studio.studioService.requestAsync("getPropertyHelp", [url + "?synopsis"], function(inResponse) {
			     if (inResponse.indexOf("No documentation found for this topic") != -1 || !inResponse) {
				 window.open(studio.getDictionaryItem("URL_EDIT_PROPDOCS", {studioVersionNumber: wm.studioConfig.studioVersion.replace(/^(\d+\.\d+).*/,"$1")}) + 
					     className + "_" + inPropName + 
					     "?parent=wmjsref_" + version + "&template=wmjsref_" + version + ".PropertyClassTemplate&name=" + className + "_" + inPropName + "&component=" + className + "&property=" + inPropName, "HelpEdit " + i);
			     }
			 });
		     },
				       i * 1300);
		 });
	     } else {
		 if (inType == studio.application.declaredClass)
		     inType = "wm.Application";
		 var url = studio.getDictionaryItem("wm.Palette.URL_CLASS_DOCS", {studioVersionNumber: wm.studioConfig.studioVersion.replace(/^(\d+\.\d+).*/,"$1"),
										  className: inType.replace(/^.*\./,"") + "_" + inPropName});

		 // clear previous content before showing.
		 bd.page.setContent("");
		 this._loadingContent = true;
		 bd.show();
		 studio.loadHelp(inType, inPropName, function(inResponse) {
		     wm.cancelJob("PropDoc");
		     this._loadingContent = false;
		     if (inResponse.indexOf("No documentation found for this topic") != -1 || !inResponse)
			 inResponse = "<a href='" + url + "' target='docs'>Open Docs</a><br/>" + inResponse;
		     bd.page.setContent(inResponse);
		 });

		 //  And in case of proxy problems, show the link so the user can open it themselves
		 wm.job("PropDoc", 1700, dojo.hitch(this, function() {
		     if (this._loadingContent)
			 bd.page.setContent("<a href='" + url + "' target='docs'>Open Docs</a><br/>If docs fail to show here, this may be due to a proxy server; just click the link to open it in a new page"); 
		 }));
	     }
	       /*
	       dojo.xhrGet({
		     url: "http://dev.wavemaker.com/wiki/bin/view/WM5_Documentation/",
		     handleAs: "html",
		     load: function(response,ioArgs) {
			   alert("Loaded: " + response);
		     },
		     error: function(response,ioArgs) {
			   console.log("HELP SYSTEM: Failed to load!");
			   console.dir(ioArgs);

 }
	       });
	       */
	       return true;
	 },


	 getHelpDialog: function() {
		 if (!studio.helpPopup) {
		     var props = {
			 owner: this,
			 pageName: "PopupHelp",
			 width: "500px",
			 height: "275px",
			 modal: false,
			 noEscape: false,
			 useContainerWidget: false,
			 hideControls: true,
			 corner: "tl"
		     };
		     var d = studio.helpPopup = new wm.PageDialog(props);
		 }
		 var b = studio.helpPopup;
		 return b;
	 },
     /* TODO: Make sure we handle subcomponents correctly, there was a lot of extra code in the previous version of inspector */
     getBindDialogProps: function(inComponent,inPropDef, inEditor) {
	 var result = {object: inComponent, 
		       targetProperty: inPropDef.fullName || inPropDef.name,
		       propDef: inEditor && inEditor.propDef ? inEditor.propDef : inPropDef};
	 return result;
     },




     generateGroups: function(inComponent) {
	 var groups = this.initGroups(this.props);
	 for (var i = 0; i < groups.length; i++) {
	     var g = groups[i];
	     var layer = this.addLayer(g.displayName);
	     layer.propertyGroup = g;
	     layer.header.setMargin("0,2,2,2");
	     layer.header.setBorder("1");
	     layer.header.setBorderColor("#333");
	     layer._groupName = g.name;
	     this.generateLayer = layer;
	     //this.generateEditors(inComponent,g.name, layer);
	     g.layer = layer;
	     if (this._activeLayer == g.displayName) {
		 this._reselectLayerIndex = this.layers.length-1;		
	     }
	     layer.connect(layer, "onShow", this, function() { 
		 var l = this.getActiveLayer();
		 var group = l.propertyGroup;

		 if (l.c$.length == 0) {
		     if (inComponent.isDestroyed) return;
		     this.generateEditors(inComponent, group.name, l);
		     l.reflow();
		 }
		 if (layer.parent && !layer.parent.multiActive) {
		     l.focusFirstEditor();
		 }
	     });
	 }
	 for (var i = 0; i < this.layers.length; i++) {
	     this.layers[i].setPadding("5,4,5,4");
	     this.layers[i].setFitToContentHeight(true);
	 }	
     },
	 // property groups
	 initGroups: function(inProps) {
	     var groups = this.buildGroups(inProps);
		 // sort groups
		 this.sortGroups(groups);
		 // fill in extra properties
/*
		 dojo.forEach(groups, function(g) {
		     var src = wm.propertyGroups[g.name];
		     dojo.mixin(g, {displayName: src && src.displayName ? src.displayName : g.name,
				    order: src.order || 1000});
		 });
		 */
	     this.groups = groups;
	     return groups;
	 },
     makeNewGroupObj: function(inName) {
	 var result = {name: inName,
		       displayName: inName,
		       subgroups: [],
		       props: [],
		       order: 1000};
	 if (wm.propertyGroups[inName]) {
	     result.order = wm.propertyGroups[inName].order;
	     if (inName == "widgetName") {
		 result.displayName = this.inspected.declaredClass.replace(/^.*\./,"");
	     } else {
		 result.displayName = wm.propertyGroups[inName].displayName;
	     }
	 }
	 return result;
     },
     addToSubgroup: function(groupObj, subgroupName, inPropDef) {
	 /* Step 1: Find the subgroup */
	 var subgroupObj;
	 for (var i = 0; i < groupObj.subgroups.length; i++) {
	     if (groupObj.subgroups[i].name == subgroupName) {
		 subgroupObj = groupObj.subgroups[i];
		 break;
	     }
	 }

	 /* Step 2: Create it if its not there */
	 if (!subgroupObj) {
	     if (wm.propertyGroups[groupObj.name] && wm.propertyGroups[groupObj.name].subgroups[subgroupName]) {
		 subgroupObj = dojo.mixin({props: [], 
					   name: subgroupName},
					  wm.propertyGroups[groupObj.name].subgroups[subgroupName]);

	     } else {
		 subgroupObj = {props: [],
				order: 1000,
				name: subgroupName,
				displayName: subgroupName};
	     }
	     groupObj.subgroups.push(subgroupObj);
	 }
	 subgroupObj.props.push(inPropDef);
     },
	 buildGroups: function(inProps) {

	     var groups = {"required": this.makeNewGroupObj("required")}; // hash of all of the groups and subgroups and properties in those groups
	     var groupsArray = []; // We'll copy the groups hash into the array before returning it
	     var defaultGroup = "Properties"; // Name of the default property group if the property has no group

	     dojo.forEach(inProps, dojo.hitch(this, function(inPropDef, index) {
		 if (!this.isEditableProp(inPropDef))
		     return;
		 var groupName = (inPropDef && inPropDef.group) || defaultGroup;
		 var subgroupName = inPropDef && inPropDef.subgroup || "";

		 /* Get a pointer to the group object we'll be adding this property into */
		 var groupObj = groups[groupName];
		 if (!groupObj) {
		     groups[groupName] = this.makeNewGroupObj(groupName);
		     groupObj = groups[groupName];
		 }

		 /* Set the order if provided or set it to 1000 if not */
		 var order = inPropDef && inPropDef.order != undefined ? inPropDef.order : 1000;

		 /* Copy the Property Definition, and add in the name and order */
		 var newPropDef = dojo.mixin({}, inPropDef, {order: order});

		 /* Make sure there is an entry for the subgroup -- if there is a subgroup specified */
		 if (subgroupName) {
		     this.addToSubgroup(groupObj, subgroupName, newPropDef);
		 } else {
		     groupObj.props.push(newPropDef);
		 }
		 
		 /* Enter into the required group if needed */
		 if (newPropDef.requiredGroup) {
		     groups.required.props.push(newPropDef);
		 }
	     }));

	     /* Build the groupsArray; make sure required group is first */
	     for (var i in groups) {
		 if (i == "required") {
		     groupsArray.unshift(groups.required);
		 } else {
		     groupsArray.push(groups[i]);
		 }
	     }
	     return groupsArray;
	 },
	 sortGroups: function(inGroups) {
	     // sort groups
	     inGroups.sort(function(a, b) {
		 return ((wm.propertyGroups[a.name] || 0).order || 28) - ((wm.propertyGroups[b.name] || 0).order || 28); // things with no order go after layout and before style
	     });

	     var mysort = function(a, b) {
		 var o = a.order - b.order;
		 return o == 0 ? wm.compareStrings(a.name, b.name) : o;
	     };

	     // sort props in each group
	     dojo.forEach(inGroups, function(g) {
		 if (g.props.sort)
		     g.props.sort(mysort);
		 if (g.subgroups && g.subgroups.sort)
		     g.subgroups.sort(mysort);
		 for (var subgroupName in g.subgroups) {
		     if (g.subgroups) {
			 var subgroup = g.subgroups[subgroupName];
			 if (subgroup && subgroup.props) {
			     subgroup.props.sort(mysort);
			 }
		     }
		 }
	     });

	     return inGroups;
	 },

     propertySearch:  function(inSender,inDisplayValue,inDataValue) {
	 this.multiActive = Boolean(inDisplayValue) || this.preferredMultiActive;
	 if (!this.multiActive) {
	     var openFound = false;
	     for (var i = 0; i < this.layers.length; i++) {
		 if (this.layers[i].active && !openFound) {
		     openFound = true;
		 } else if (this.layers[i].active) {
		     this.setLayerInactive(this.layers[i]);
		 }
	     }
	 }

	 /* Search only works if all property editors are generated */
	 if (inDisplayValue) {
	     for (var i = 0; i < this.layers.length; i++) {
		 var layer = this.layers[i];
		 if (layer.c$.length === 0) {
		     this.generateEditors(this.inspected, layer._groupName, layer);
		 }
	     }
	 }

	 var props = this.props;
	 for (var key in this.editorHash) { 
	     var editor = this.editorHash[key];
	     var prop = editor.propDef;
	     if (prop) {
		 if (inDisplayValue === "") {
		     if (editor.parent instanceof wm.Layer) {
			 editor.show();
		     } else {
			 editor.parent.show();
		     }
		 } else if (editor.search) {
		     if (editor.search(inDisplayValue)) {
			 editor.show();
		     } else {
			 editor.hide();
		     }
		 } else if (prop.name.toLowerCase().indexOf(inDisplayValue.toLowerCase()) != -1 ||
			    prop.shortname && prop.shortname.toLowerCase().indexOf(inDisplayValue.toLowerCase()) != -1) {
		     if (editor.parent.layoutKind == "left-to-right" && editor.parent instanceof wm.Layer == false) {
			 editor.parent.show();
		     } else {
			 editor.show();
		     }
		 } else {
		     if (editor.parent.layoutKind == "left-to-right" && editor.parent instanceof wm.Layer == false) {
			 editor.parent.hide();
		     } else {
			 editor.hide();
		     }
		 }
	     }
	 }

	 if (inDisplayValue !== "") {
	     for (var i = 0; i < this.layers.length; i++) {
		 var count = 0;
		 var layer = this.layers[i];
		 for (var j = 0; j < layer.c$.length; j++) { 
		     if (layer.c$[j].showing) {
			 count++;
		     }
		 }
		 if (count === 0) {
		     this.setLayerInactive(this.layers[i]);
		 } else {
		     this.layers[i].activate();
		 }
	     }
	 }
     },
     toggleMultiactive: function() {
	 this.preferredMultiActive = !this.preferredMultiActive;
	 this.multiActive = this.preferredMultiActive;
     },
     toggleAdvancedPropertiesSome: function(inSender) {
	 dojo.removeClass(studio.togglePropertiesButton2.domNode, "toggleButtonDown");
	 dojo.addClass(studio.togglePropertiesButton.domNode, "toggleButtonDown");
	 this.advancedMode = false;
	 this.inspect(this.inspected, true);
     },
     toggleAdvancedPropertiesAll: function(inSender) {
	 dojo.addClass(studio.togglePropertiesButton2.domNode, "toggleButtonDown");
	 dojo.removeClass(studio.togglePropertiesButton.domNode, "toggleButtonDown");
	 this.advancedMode = true;
	 this.inspect(this.inspected, true);
     },
     isAdvancedMode: function() {
	 return this.advancedMode; 
     },
     generateComponentInfo: function() {
	 var html = this.inspected.generateDocumentation();
	 if (!studio.componentDiagnosticsDialog) {
	     studio.componentDiagnosticsDialog = new wm.Dialog({owner: studio, 
								name: "componentDiagnosticsDialog",
								width: "300px",
								height: "500px",
								useContainerWidget: true,
								positionNear: studio.PIContents.getId(),
								corner: "cl",
								modal: false,
								noEscape: false});
	     studio.componentDiagnosticsDialog.html = new wm.Html({owner: studio.componentDiagnosticsDialog,
								   parent: studio.componentDiagnosticsDialog.containerWidget,
								   width: "100%",
								   height: "100%"});
	 }
	 studio.componentDiagnosticsDialog.setTitle("Component Synopsis: " + this.inspected.getId());
	 studio.componentDiagnosticsDialog.html.setHtml(html);
	 studio.componentDiagnosticsDialog.show();
     },

     getDefaultEditorProps: function(inComponent, inProp, inValue, inOwner, inParent, inName) {
	 var editorProps = {
	     propDef: inProp,
	     owner: inOwner,
	     parent: inParent,
	     disabled: Boolean(inProp.ignoretmp || inProp.writeonly),
	     hint: inProp.ignoretmp && inProp.ignoreHint ? this.ignoreHintPrefix + inProp.ignoreHint : "",
	     name: "propEdit_" + (inName ? inName : inProp.name),
	     propName: inProp.name,
	     width: "100%",
	     height: "42px",
	     captionSize: "20px",
	     captionPosition: "top",
	     captionAlign: "left",
	     caption: inProp.shortname || inProp.name,
	     dataValue: inValue,
	     inspected: inComponent /* Used by some of the custom editors in propertyEdit.js */
	 };
	 if (inProp.createWire != undefined) {
	     editorProps.createWire = inProp.createWire;
	 }
	 return editorProps;
     },
     _end: 0
 });




wm.addPropertyGroups = function(propGroups) {
	dojo.mixin(wm.propertyGroups || (wm.propertyGroups = {}), propGroups);
}

// registry of groups to show in inspector
wm.addPropertyGroups({
/* NEW SCHEMA */
    required: {displayName: "Required", 
	       order: 1,
	       subgroups: {}},
    common: {displayName: "Common", 
	     order: 10,
	     subgroups: {}},
    display: {displayName: "Display", 
	      order: 15,
	      subgroups: {
		  /* Confirmed */
		  layout: {displayName: "Layout",
			   order: 1},
		  /* Confirmed */
		  panel: {displayName: "Panel",
			  order: 5},
		  /* NOT Confirmed */
		  text: {displayName: "Text",
			 order: 10},
		  /* NOT Confirmed */
		  formatter: {displayName: "Formatting",
			      order: 40},
		  /* NOT Confirmed */
		  help: {displayName: "Help",
			 order: 50},
		  /* Confirmed */
		  scrolling: {displayName: "Scrolling",
			       order: 80},
		  /* NOT Confirmed */
		  visual: {displayName: "Visual",
			   order: 100},
		  /* NOT Confirmed */
		  graphics: {displayName: "Graphics",
			     order: 120},
		  /* NOT Confirmed */
		  misc: {displayName: "Misc",
			 order: 200}
	      }
	     },
    container: {displayName: "Panel",
		order: 40,
		subgroups: {
		    layout: {displayName: "Layout", order: 1},
		    style: {displayName: "Style", order: 10}
		}
	       },
    /* Philosophy of use for widgetName (proposal):
     * For a widget with a small number of properties beyond wm.Control,
     * its a good place to put the properties to highlight them instead of making the user
     * dig in all of the different categories to find the customizations specific to this widget
     */
    widgetName: {displayName: "", // set to class name
		 order: 45,
		 subgroups: {
		     /* COnfirmed */
		     text:      {displayName: "Text",
				 order: 1},
		     /* Confirmed */
		     data:      {displayName: "Data",
				 order: 10},
		     /* Confirmed */
		     fields:    {displayName: "Fields",
				 order: 20},
		     /* Confirmed for DojoChart only */
		     xaxis:     {displayName: "X-Axis",
				 order: 25},
		     /* Confirmed for DojoChart only */
		     yaxis:     {displayName: "Y-Axis",
				 order: 26},

		     /* Confirmed */
		     layout:    {displayName: "Layout",
				  order: 30},
		     /* Confirmed */
		     graphics:   {displayName: "Graphics",
				  order: 40},
		     style:   {displayName: "Style",
				  order: 45},

		     /* Confirmed */
		     editing:    {displayName: "Editing",
				  order: 50},
		     /* Confirmed (DojoMenu) */
		     behavior:   {displayName: "Behavior",
				  order: 60},
		     /* Confirmed */
		     selection: {displayName: "Selection",
				 order: 70},
		     /* Confirmed */
		     confirmation: {displayName: "Confirmation",
				    order: 80},

		     /* Confirmed */
		     format:     {displayName: "Format",
				  order: 90},

		     /* Confirmed for DojoChart only */
		     legend:     {displayName: "Legend",
				  order: 120},
		 }
		},
    /* Confirmed */
    "editor text": {displayName: "Editor Text",
		    order: 50,
		    subgroups: {		    
			caption: {displayName: "Caption",
				  order: 0},
			help: {displayName: "Help",
			       order: 10},
			format: {displayName: "Format",
				 order: 20},
			"dojo tooltips": {displayName: "Dojo Tooltips",
					  order: 50}
		    }
		   },
    /* Confirmed */
    editor: {displayName: "Editor", 
	     order: 60,
	     subgroups: {
		 value: {displayName: "Values",
			 order: 1},
		 dataSet: {displayName: "Data Set",
			   order: 10},
		 display: {displayName: "Value Display",
			     order: 20},
		 behavior: {displayName: "Behaviors",
			    order: 30},
		 layout: {displayName: "Layout",
			     order: 40},
		 toolbar: {displayName: "Toolbar",// Richtext only
			     order: 50},
		 validation: {displayName: "Validation",
			      order: 50}
	     }
	    },
    /* Confirmed */
    dialog: {displayName: "Dialog",
		 order: 55,
		 subgroups: {
		     behavior: {displayName: "Behaviors",
				order: 1},
		     docking: {displayName: "Docking",
			    order: 2}
		 }
		},
    subwidgets: {displayName: "Children", 
		 order: 60,
		 subgroups: {
		     text: {displayName: "Text",
			    order: 1},
		     layout: {displayName: "Layout",
			      order: 10},
		     buttons: {displayName: "Buttons",
			       order: 15},
		     behavior: {displayName: "Behaviors",
			       order: 15}
		 }
		},
    data: {displayName: "Data", 
	   order: 70,
	   subgroups: {
	       data: {displayName: "Data",
		      order: 1},
	       type: {displayName: "Type",
		      order: 5},
	       service: {displayName: "Service",
			 order: 10},
	       serverOptions: {displayName: "Server Options",
			       order: 20},
	       behavior: {displayName: "Behavior",
			  order: 30}
	   }
	  },
	/* Confirmed */
    style: {displayName: "Style", order: 80},
    /* Confirmed */
    events: {displayName: "Events", order: 100},
    /* Confirmed */
    custommethods: {displayName: "Custom Methods", order: 101},
    /* Confirmed */
    roles: {displayName: "Roles", order: 110},
    /* Confirmed */
    devices: {displayName: "Devices", order: 120},
    /* Confirmed */
    deprecated: {displayName: "Deprecated", order: 100000},
/* OLD SCHEMA */





	layout: {displayName: "Layout", order: 25},
	"advanced layout": {displayName: "Advanced Layout", order: 180},

	scrolling: {displayName: "Scrollbars", order: 32},
	dataobjects: {displayName: "Data Objects", order: 35},
	format: {displayName: "Formatting", order: 40},
	Labeling: {displayName: "Labeling", order: 45},
	edit: {displayName: "Editing", order: 50},
	editData: {displayName: "Editor Data", order: 55},

	Events: {displayName: "General", order: 100},
	Properties: {displayName: "Other", order: 100},
	validation: {displayName: "Validation", order: 150},
	columns: {displayName: "Columns", order: 999},
	ungrouped: {displayName: "Other", order: 1000},
	operation: {displayName: "Operations", order: 2000},
    docs: {displayName: "Documentation", order: 3000}

});
