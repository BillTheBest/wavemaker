/*
 * Copyright (C) 2008-2011 WaveMaker Software, Inc.
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
dojo.provide("wm.studio.app.mainNavigation");

Studio.extend({
	navGotoDesignerClick: function() {
		this.disableMenuBar(false);
	        //this.disableCanvasOnlyMenuItems(false);
	        //this.toggleCanvasSourceBtns(true, false);
		this.tabs.setLayer("workspace");
            if (this.page) {
                if (this._themeDesignerChange) {
                    this._themeDesignerChange = false;
                    studio.application.useWidgetCache();
                }
                if (this._reflowPageDesigner ) {
                    this._reflowPageDesigner = false;
                    wm.onidle(this.page, "reflow");
                }
            }
            if (studio.page && studio.page.root && !studio.page.root.isDestroyed && (
                !studio.selected ||
                studio.selected instanceof wm.DataModel ||
                studio.selected instanceof wm.DataModelEntity ||
                studio.selected instanceof wm.Query ||
                studio.selected instanceof wm.LiveView ||
                    studio.selected instanceof wm.Security))
                studio.select(studio.page.root);
		//this.mainAndResourcePalettes.setLayer("mainPalettes");
		//wm.fire(this.page, "reflow");
	},
	navGotoSourceClick: function() {
		this.disableMenuBar(false);
		//this.disableCanvasOnlyMenuItems(true);
	        //this.toggleCanvasSourceBtns(false, true);
		this.tabs.setLayer("sourceTab");
		//this.mainAndResourcePalettes.setLayer("mainPalettes");
	},
/*
	navGotoResourcesClick: function() {
		this.disableMenuBar(false);
		this.disableCanvasOnlyMenuItems(true);
		this.tabs.setLayer("resourcesTab");
		//this.mainAndResourcePalettes.setLayer("resourcePaletteLayer");
		this.resourcesPage.getComponent("resourceManager").loadResources();
	},
	*/
	navGoToLoginPage: function() {
	    this.loginDialog.show();
/*
		this.disableCanvasOnlyMenuItems(true);
		this.disableMenuBar(true);
		if (this.loginPage.page != "Login")
		  this.loginPage.setPageName("Login");
		this.tabs.setLayer("loginLayer");
		*/
	},
	navGoToDeploymentPage: function() {
	    this.deploymentDialog.show();
/*
		this.disableMenuBar(false);
		this.disableCanvasOnlyMenuItems(true);
		this.toggleCanvasSourceBtns(false, false);
		if (this.deploymentPage.page != "DeploymentPage")
		  this.deploymentPage.setPageName("DeploymentPage");
		this.tabs.setLayer("deploymentLayer");
		if (this.deploymentPage.page && this.deploymentPage.page instanceof DeploymentPage)
		  this.deploymentPage.page.setup();
		  */
	  },
	isLoginShowing: function() {
	    /*return this.tabs.getLayer().name == "loginTab";*/
	    return this.loginDialog.showing;
	},
/*
	toggleCanvasSourceBtns: function(inCanvasOn, inSourceOn) {
		dojo.removeClass(this.designerCanvasBtn.domNode, (inCanvasOn ? "Studio-sourceCanvasBtn" : "Studio-designerCanvasBtn"));
		dojo.addClass(this.designerCanvasBtn.domNode, (inCanvasOn ? "Studio-designerCanvasBtn" : "Studio-sourceCanvasBtn"));
		dojo.removeClass(this.designerSourceBtn.domNode, (inSourceOn ? "Studio-designerSourceBtn" : "Studio-sourceSourceBtn"));
		dojo.addClass(this.designerSourceBtn.domNode, (inSourceOn ? "Studio-sourceSourceBtn" : "Studio-designerSourceBtn"));
	        //dojo.removeClass(this.designerResourcesBtn.domNode, (inResourcesOn ? "Studio-designerResourceBtn" : "Studio-sourceResourceBtn"));
	    //dojo.addClass(this.designerResourcesBtn.domNode, (inResourcesOn ? "Studio-sourceResourceBtn" : "Studio-designerResourceBtn"));

	},
	*/
	disableCanvasSourceBtns: function(inDisable) {
		this.leftToolbarButtons.setDisabled(inDisable);
		this.leftToolbarButtons.reflow();
	},
    navGotoEditor: function(inEditorName, parentLayer, layerName, layerCaption) {
		//this.disableCanvasOnlyMenuItems(true);
	        //this.toggleCanvasSourceBtns(false, false);
	return this.getEditor(inEditorName, parentLayer, true, layerName, layerCaption);
	},
    getEditor: function(inEditorName, parentLayer, inNav, layerName, layerCaption) {
	var tabs;
	if (parentLayer) {
	    parentLayer.show();
	    parentLayer.activate();
	    tabs = parentLayer.c$[0];
	} else {
	    tabs = this.tabs;
	}


	    //var n = wm.decapitalize(inEditorName);
	    var i = tabs.indexOfLayerName(layerName);
		if (i < 0) {
		    return this.addEditor(inEditorName, parentLayer, inNav, layerName, layerCaption);
		} else {
		    tabs.layers[i].setShowing(true);
		    inNav && tabs.setLayerIndex(i);
		    var widgets = tabs.getLayer(i).getOrderedWidgets();
		    for (var j = 0; j < widgets.length; j++)
			if (widgets[j] instanceof wm.PageContainer)
			    return widgets[j];
		}
	},
    addEditor: function(inEditorName, parentLayer, inNav, layerName, layerCaption) {
	    var tabs = parentLayer ? parentLayer.c$[0] : this.tabs; // tablayers should be the first widget within the tab

	    /* Destroy empty layer created automatically for every TabLayers */
	    if (tabs.layers.length == 1 && tabs.layers[0].c$.length == 0)
		tabs.layers[0].destroy();


	    //var n = inEditorName.replace(/\s/g,"_");
	    var t = inNav ? tabs.addLayer(layerName) : tabs.createLayer(layerName);
	    if (layerName)
		t.setName(layerName);
	    if (layerCaption)
		t.setCaption(layerCaption);	    
	    t.setDestroyable(true);
	    t.parent.renderBounds(); // in case multiple rows of tabs are needed after changing the caption
		var editor = studio.createComponent(layerName + "Container", "wm.PageContainer", {
			parent: t,
			pageName: inEditorName,
			width: "100%",
			height: "100%"
		});
		editor.reflowParent();
	        editor._isNewlyCreated = true;

		return editor;
	},
    updateServicesDirtyTabIndicators: function() {
	var tabs = [this.JavaEditorSubTab, this.databaseSubTab, this.webServiceSubTab, this.securitySubTab];
	for (var i = 0; i < tabs.length; i++) {
	    var tab = tabs[i];
	    var isDirty = false;
	    for (var j = 0; j < tab.layers.length; j++) {
		var layer = tab.layers[j];
		if (layer.c$.length == 0) continue;
		var page = layer.c$[0].page;
		if (page && page.getDirty && page.getDirty()) {
		    isDirty = true;
		    break;
		}
	    }
	    var caption = tab.parent.caption.replace(/^\<.*?\>\s*/, "");
	    if (isDirty) caption = "<img class='StudioDirtyIcon'  src='images/blank.gif' /> " + caption;
	    if (caption != tab.parent.caption)
		tab.parent.setCaption(caption);
	}
    },
        closeServiceTab: function(inLayer) {
	    var page = inLayer.c$[0].page;
	    var f = dojo.hitch(this, function() {
		var index = inLayer.getIndex();
		var parent = inLayer.parent;
		inLayer.destroy();
		this.updateServicesDirtyTabIndicators();
	    });
	    if (page && page.getDirty())
		app.confirm("You have changes that are not saved; Leave anyway?", false, f);
	    else
		f();
	},
    closeServiceParentTab: function(inLayer) {
	var layers = inLayer.c$[0].layers;
	var unsavedPages = [];
	for (var i = 0; i < layers.length; i++) {
	    var page = layers[i].c$[0].page;
	    if (page.getDirty())
		unsavedPages.push(page);
	}
	if (unsavedPages.length == 0) {
	    for (var i = 0; i < layers.length; i++) layers[i].destroy();
	    inLayer.hide();
	    this.updateServicesDirtyTabIndicators(); // remove unsaved indicator from the tab now that it has no layers
	} else {
	    var message = this.getDictionayrItem("CONFIRM_UNSAVEDTAB_HEADER") + "<ul>"
	    for (var i = 0; i < unsavedPages.length; i++)
		message += "<li>" + unsavedPages[i].owner.parent.caption.replace(/^\<.*?\>\s*/,"") + "</li>";
		//message += (i == unsavedPages.length-1 ? " and " : i ? ", " : "") + unsavedPages[i].owner.parent.caption.replace(/^\<.*?\>\s*/,"");
	    message += "</ul>" +  this.getDictionaryItem("CONFIRM_UNSAVEDTAB_CLOSEANYWAY");
	    app.confirm(message, false, dojo.hitch(this, function() {
		while (layers.length) layers[0].destroy();
		inLayer.hide();
		this.updateServicesDirtyTabIndicators(); // remove unsaved indicator from the tab now that it has no layers
	    }));
	}

    },
	navGotoPaletteModelClick: function() {
		var n = this.left.getLayerCaption();
		switch (n) {
			case "Palette":
				this.navGotoModelTreeClick();
				break;
			case "Model":
			default:
				this.navGotoPaletteTreeClick();
				break;
				
		}
	},
	navGotoPaletteTreeClick: function() {
		this.left.setLayer("mlpal");
	},
	navGotoModelTreeClick: function() {
		this.left.setLayer("leftObjects");
	},
	navGotoComponentsTreeClick: function() {
		this.left.setLayer("componentModel");
	},
	navGotoProjectTreeClick: function() {
		this.left.setLayer("projects");
	}
});
