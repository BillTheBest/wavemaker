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
 
dojo.provide("wm.studio.app.menu");

Studio.extend({
    addPartnerServices: function() {
	      if (!this._serviceMenuStructure) {
		  var menus = this.navigationMenu.fullStructure;
		  for (var i = 0; i < menus.length; i++) {
		      if (menus[i].idInPage == "servicesPopupBtn")
			  this._serviceMenuStructure = menus[i];
		      else if (menus[i].idInPage == "insertPopupBtn")
			  this._insertMenuStructure = menus[i];
		  }
	      }
	var menu = this._serviceMenuStructure;
	menu.children.push({separator: true});
	this._partnerServicesStructure = {
	    label: "Partner Services",
	    iconClass: "PartnerService",
	    idInPage: "partnerServicesSubmenu",
	    children: [
	    ]
	};
	menu.children.push(this._partnerServicesStructure);
    },
		  // called by packageLoader.js for anything that is not an instanceof wm.Control
	addComponentMenuItem: function(inTab, inName, inDescription, inImage, inClass, inProps) {

	  try {

	      if (!this._serviceMenuStructure) {
		  var menus = this.navigationMenu.fullStructure;
		  for (var i = 0; i < menus.length; i++) {
		      if (menus[i].idInPage == "servicesPopupBtn")
			  this._serviceMenuStructure = menus[i];
		      else if (menus[i].idInPage == "insertPopupBtn")
			  this._insertMenuStructure = menus[i];
		  }
	      }
	      var list;
	      var obj = {label: inName,
			 info: {type: inClass, props: inProps}, // for callback to selectComponentMenuItem, not for the menu itself
			 type: inClass,                         // for callback to selectComponentMenuItem, not for the menu itself
			 onClick: "selectComponentMenuItem",
			 idInPage: inName + "MenuItem",
			 iconClass: inImage.indexOf(".") == -1 ? inImage : inImage.substring(inImage.lastIndexOf("/")+1,inImage.indexOf("."))};

	      var menu = (inTab == bundlePackage.Non_Visual_Components) ? this._insertMenuStructure : this._serviceMenuStructure;
	      if (inProps.partnerService) {
		  if (!this._partnerServicesStructure)
		      this.addPartnerServices();
		  menu = this._partnerServicesStructure;
		  if (menu.children.length == 1) {
		      menu.children.push({separator:true});
		  }
	      }

	      if (inProps && inProps.parentMenu) {
		  var submenu;
		  for (var i = 0; i < menu.children.length; i++) {
		      if (menu.children[i].label == inProps.parentMenu) {
			  submenu = menu.children[i];
			  break;
		      }
		  }
		  if (!submenu) {
		      submenu = {label: inProps.parentMenu,
				 iconClass: "InsertMenu" + inProps.parentMenu,
				 children: []};
		      menu.children.push(submenu);
		  }
		  
		  list = submenu.children;

	      } else {
		  list = menu.children;
	      }

	      for (var i = 0; i < list.length; i++)
		  if (list[i].label == obj.label) return;

	      list.push(obj);
/*
	      var menuBar = this.navigationMenu;
	      var menu = (inTab == bundleStudio.M_Services) ? this.servicesPopupBtn : this.insertPopupBtn;
	      if (inProps && inProps.parentMenu) {
		  var parentid = "insertMenu" + inProps.parentMenu + "MenuItem";
		  var tmpmenu = studio[parentid];
		  if (!tmpmenu) {
		      menuBar.addNewMenuItem(menu, {label: inProps.parentMenu,
						    idInPage: parentid,
						    children: []});
		      tmpmenu = studio[parentid];
		  }
		  menu = tmpmenu;
	      }

	  var newId = inName + "MenuItem";

	    menuBar.addNewMenuItem(menu, {label: inName,
					  info: {type: inClass, props: inProps}, // for callback to selectComponentMenuItem, not for the menu itself
					  type: inClass,                         // for callback to selectComponentMenuItem, not for the menu itself
					  onClick: "selectComponentMenuItem",
					  idInPage: inName + "MenuItem",
					  iconClass: inImage.substring(inImage.lastIndexOf("/")+1,inImage.indexOf("."))});

					  */
	} catch(e) {
	    console.error("disableMenuBar Failed");
	    console.log(e);
	}
	    if (inProps)
		delete inProps.parentMenu;
	},
	// TODO: Palette has similar function; should only has one
	selectComponentMenuItem: function(menuObj) {
	    var info = menuObj.info;
	  //var info = e.item.info;
		var props = dojo.clone(info.props || {});
		var ctor = dojo.getObject(info.type);
		dojo.mixin(props, {
			_designer: studio.page._designer,
			name: studio.page.getUniqueName(props.name || studio.makeName(info.type)),
			owner: studio.page,
			parent: studio.page.root
		});
		var comp = new ctor(props);
		if (comp) {
			if (!(comp instanceof wm.ServerComponent)) {
				// create an undo task
				new wm.AddTask(comp);
			}
			if (!wm.fire(comp, "afterPaletteDrop")) {
				// FIXME: should not refresh entire tree when dropping from palette.
				studio.refreshDesignTrees();
				studio.inspector.resetInspector();
				studio.select(comp);
			}
		}
	},

	disableMenuBar: function(inDisabled) {
	  try {
	  // attr for dojo menu items; setDisabled for wavemaker components.  At some point we'll want to put our own DojoMenuItem wrapper around the dojo menu items
		this.projectPopupBtn.set("disabled",false);
		this.editPopupBtn.set("disabled",inDisabled);
	      //this.viewPopupBtn.set("disabled",inDisabled);
		this.insertPopupBtn.set("disabled",inDisabled);
		this.servicesPopupBtn.set("disabled",inDisabled);
		this.pagePopupBtn.set("disabled",inDisabled);
	      //this.leftToolbarButtons.setDisabled(inDisabled);
/*
		this.navTestBtn.setDisabled(inDisabled);
		this.navRunBtn.setDisabled(inDisabled);
		*/
	      this.runPopup.setDisabled(inDisabled);
	      if (inDisabled)
		if (studio.isCloud()) {
		    this.navEditAccountBtn.setDisabled(false);
		    this.navLogoutBtn.setDisabled(false);
		}
		    this.closeProjectItem.set("disabled",inDisabled);
		    this.copyProjectItem.set("disabled",inDisabled);
		    this.deleteProjectItem.set("disabled",inDisabled);
		    this.exportProjectItem.set("disabled",inDisabled);
		    this.deployProjectItem.set("disabled",inDisabled);
	            this.saveProjectItem.set("disabled",inDisabled);
	  } catch(e) {
	    console.error("disableMenuBar Failed");
	    console.log(e);
	  }

	},
	disableCanvasOnlyMenuItems: function(inDisabled) {
		var d = inDisabled;
		this.editPopupBtn.set("disabled",d);
		this.insertPopupBtn.set("disabled",d);
		this.pagePopupBtn.set("disabled",d);
	    //this.outlineItem.set("disabled",d);
		//this.liveLayoutItem.set("disabled",d);
		//this.navigationBar.reflow();
	}
})
