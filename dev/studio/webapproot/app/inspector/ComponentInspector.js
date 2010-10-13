/*
 * Copyright (C) 2008-2010 WaveMaker Software, Inc.
 *
 * This file is part of WaveMaker Studio.
 *
 * WaveMaker Studio is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License, only.
 *
 * WaveMaker Studio is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WaveMaker Studio.  If not, see <http://www.gnu.org/licenses/>.
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
	inspect: function(inComponent, inInspectorProps) {
		var
			c = this.inspected = inComponent,
			ip = this.inspectorProps = inInspectorProps;
			n = ip && ip.inspector,
			inspector = this._inspectors[n];
		if (inspector)
			inspector.inspect(c, inInspectorProps);
	},
	reinspect: function() {
		if (this.inspected && this.inspectorProps)
			this.inspect(this.inspected, this.inspectorProps);
	},
	focusDefault: function() {
		var inspector = this._inspectors[this.getLayerCaption()];
		wm.fire(inspector, "focusDefault");
	},
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
	init: function() {
		this.inherited(arguments);
		var t = ['{',
			'inspectorTree: ["wm.Tree", {height: "120px", border: 0}, {}, {}],',
			'splitter3: ["wm.Splitter", {layout: "top", border: 0}, {}, {}],',
			'inspectorLayers: ["wm.ComponentInspector", {border: 0, flex: 1, box: "v"}, {}, {}]',
		'}'];
		this.readComponents(t.join(''));
		this.tree = this.owner.inspectorTree;
		this.inspector = this.owner.inspectorLayers;
		this.connect(this.tree, "onselect", this, "treeSelect");
	},
	// tree
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
		inProps.content = inProps.content || inNodeName;
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
		this.addTreeNode("Properties", {content: bundleStudio.I_Properties, image: "images/properties_16.png", inspector: "Properties"});
		this.addTreeNode("Events", {content: bundleStudio.I_Events, image: "images/star_16.png", inspector: "Events"});
		this.addTreeNode("CustomMethods", {content: bundleStudio.I_CustomMethods, image: "images/star_16.png", inspector: "CustomMethods"});
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
		} else
			this.inspector.inspect(this.inspected, this.selectedNode);
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