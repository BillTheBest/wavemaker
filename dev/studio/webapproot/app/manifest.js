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
//
// Studio module manifest
// all loads except for css should be nop in production mode.
wm.registerPaths(
	["wm.studio.app", wm.basePath + "app"],
	["wm.studio.pages", wm.basePath + "pages"]
);

// Design Support Extensions
wm.loadLibs([
	"css.wm.base.widget.themes.default.design",
	"wm.base.Component_design",
	"wm.base.Widget_design",
	"wm.base.Control_design",
	"wm.base.components.LiveView_Design",
	"wm.base.widget.Box_design",
	"wm.base.widget.Content_design",
	"wm.base.widget.Layers_design",
	"wm.base.widget.dijit.Dijit_design",
	"wm.base.widget.dijit.ProgressBar_design",
	"wm.base.widget.LiveForm_design",
	"wm.base.widget.Dashboard_design",
	"wm.base.widget.DojoGrid_design",
	"wm.base.widget.RelatedEditor_design",
	"wm.base.widget.EditArea_design",
	"wm.base.widget.Splitter_design",
	"wm.base.components.Property",
	"wm.base.components.Publisher",
	"wm.base.components.ServerComponent",
	"wm.base.components.DataModel",
	"wm.base.components.Query",
	"wm.base.components.JavaService",
	"wm.base.components.WebService"
]);

// Designer
wm.loadLibs([ 
	"wm.base.design.Designable",
	"wm.base.design.Surface",
	"wm.base.design.Drag",
	"wm.base.design.Wrapper",
	"wm.base.design.Designer"
]);

// EditArea (must always be loaded explicitly)
wm.loadScript(dojo.moduleUrl("wm.studio.app") + "edit_area/edit_area_loader.js", true);

// Studio
wm.loadLibs([
	"wm.studio.app.StudioApplication",
	"wm.studio.pages.Studio.Studio",
	"wm.studio.app.util",
	"wm.studio.app.keyconfig",
	"wm.studio.app.binding",
	"wm.studio.app.Palette",
	"wm.studio.app.inspector.Inspector",
	"wm.studio.app.inspector.BindInspector",
	"wm.studio.app.inspector.StyleInspector",
	"wm.studio.app.inspector.SecurityInspector",
	"wm.studio.app.inspector.ComponentInspector",
	"wm.studio.app.inspect",
	"wm.studio.app.sourcer",
	"wm.studio.app.events",
	"wm.studio.app.file",
	"wm.studio.app.css",
	"wm.studio.app.markup",
	"wm.studio.app.servicesTree",
	"wm.studio.app.dataconstants",
	"wm.studio.app.datautils",
	"wm.studio.app.mainNavigation",
	"wm.studio.app.actions",
	"wm.studio.app.clipboard",
	"wm.studio.app.trees",
	"wm.studio.app.menu",
	"wm.studio.app.project",
	"wm.studio.app.editcommands",
	"wm.studio.app.deploy",
	"wm.studio.app.dom",
	"wm.studio.app.propertyEdit",
	"wm.studio.app.data",
	"wm.studio.app.templates.widgetTemplates",
	"wm.studio.pages.Services.Services",
	"wm.studio.pages.ImportWebService.ImportWebService",
	"wm.studio.pages.ImportFile.ImportFile",
	"wm.studio.pages.ImportPageDialog.ImportPageDialog",
	"wm.studio.pages.ImportDatabase.ImportDatabase",
	"wm.studio.pages.RestServiceBuilder.RestServiceBuilder",
	"wm.studio.pages.RestUrlDialog.RestUrlDialog",
	"wm.studio.pages.Security.Security",
	"wm.studio.pages.QueryEditor.QueryEditor",
	"wm.studio.pages.DeploymentPage.DeploymentPage",
	//"wm.studio.pages.DeploymentJNDIDialog.DeploymentJNDIDialog",
	"wm.studio.pages.DBConnectionSettings.DBConnectionSettings",
	"wm.studio.pages.DataObjectsEditor.DataObjectsEditor",
	"wm.studio.pages.Diagnostics.Diagnostics",
	"wm.studio.pages.BindSourceDialog.BindSourceDialog",
	"wm.studio.pages.Binder.Binder",
	"wm.studio.pages.PopupHelp.PopupHelp",
	"wm.studio.pages.MenuDesigner.MenuDesigner",
	"wm.studio.pages.ResourceManager.ResourceManager",
	"wm.studio.pages.ServiceDialog.ServiceDialog",
	"wm.studio.pages.DDLDialog.DDLDialog",
	"wm.studio.pages.NavigationDialog.NavigationDialog",
	"wm.studio.pages.QueueDialog.QueueDialog",
	"wm.studio.pages.LiveViewEditor.LiveViewEditor",
	"wm.studio.pages.CreateLiveView.CreateLiveView",
	"wm.studio.pages.JavaEditor.JavaEditor",
	"wm.studio.pages.NewJavaService.NewJavaService",
	"wm.studio.pages.PreferencesPane.PreferencesPane",
	"wm.studio.pages.ThemeDesigner.ThemeDesigner",
	"wm.studio.pages.RegistrationDialog.RegistrationDialog",
	"wm.studio.pages.Start.Start"
]);

// Kana
/*
wm.loadLibs([ 
	"Kana.Design"
]);
*/
