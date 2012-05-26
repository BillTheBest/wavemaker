/*
 *  Copyright (C) 2011-2012 VMware, Inc. All rights reserved.
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

dojo.provide("wm.base.components.Application_design");
dojo.require("wm.base.components.Application");

wm.Application.extend({
    firstThemeChange: true,
/*
    set_theme: function(inTheme) {
        if (this.firstThemeChange) {
            app.confirm("Sometimes data can be lost when changing themes.  Do you want to save your project before changing themes?", true,
			dojo.hitch(this, function() {
			    studio.project.saveProject();
			    this.firstThemeChange = false;
			    this.setTheme(inTheme);
			}),
			dojo.hitch(this, function() {
			    this.firstThemeChange = false;
			    this.setTheme(inTheme);
			}),
			"Save and Change",
			"Change Only");

	} else {
	    this.setTheme(inTheme);
	}
    },
*/

	write: function(inIndent) {
	    var props = dojo.toJson(this.writeProps(),true);
	    props = props.substring(1,props.length-2);


	    var compsArray = this.writeComponents(inIndent);

	    var classOrdering = ["wm.ImageList", "wm.TypeDefinition", "wm.LiveView"];

	    compsArray = compsArray.sort(function(a,b) {
		var alist = a.match(/^(.*?)\:\s*\[\"(.*?)\"/);
		var blist = b.match(/^(.*?)\:\s*\[\"(.*?)\"/);
		var aindex = dojo.indexOf(classOrdering, alist[2]);
		var bindex = dojo.indexOf(classOrdering, blist[2]);
		if (aindex == -1) aindex = classOrdering.length;
		if (bindex == -1) bindex = classOrdering.length;
		if (aindex == bindex)
		    return (alist[1] <= blist[1]) ? -1 : 1;
		else
		    return (aindex < bindex) ? -1 : 1;

	    });

	    var comps = compsArray.join(", " + sourcer_nl);
	
	    var customsrc = dojo.trim(String(studio.getAppScript())) || studio.project.projectName + ".extend({\n\n\t" + terminus + "\n});";
	    var src = 'dojo.declare("' + this.declaredClass + '", wm.Application, {' +
		props + ",\n\t" + 
		    '"widgets": {\n' +  (comps || "") + '\n\t},\n\t' +
		terminus + "\n});\n\n" + // terminus is defined in events.js
		customsrc;

	    return src;
	},
    setToastPosition: function(inPosition) {
        this.toastPosition = inPosition.replace(/top/, "t").replace(/bottom/,"b").replace(/left/,"l").replace(/right/,"r").replace(/center/,"c").replace(/ /,"");
    },
    makePropEdit: function(inName, inValue, inEditorProps) {
	switch (inName) {
	case "theme":
            var options = [];
            var data = studio.themesListVar.getData();
            dojo.forEach(data, function(item) {options.push(item.dataValue);});
	    return new wm.prop.SelectMenu(dojo.mixin(inEditorProps,{options:options}));
	}
	return this.inherited(arguments);
    },
    set_main: function(inMain) {
	if (inMain == studio.getDictionaryItem("wm.PageContainer.NEW_PAGE_OPTION")) {
	    return this.createNewPage();
	}
	this.main = inMain;
	studio.setProjectMainPage(inMain);
    },
    set_phoneMain: function(inMain) {
	if (inMain == studio.getDictionaryItem("wm.PageContainer.NEW_PAGE_OPTION")) {
	    return this.createNewPage("phoneMain");
	}
	this.phoneMain = inMain;
    },
    set_tabletMain: function(inMain) {
	if (inMain == studio.getDictionaryItem("wm.PageContainer.NEW_PAGE_OPTION")) {
	    return this.createNewPage("tabletMain");
	}
	this.tabletMain = inMain;
    },

    createNewPage: function(optionalInPageType) {
	var pages = studio.project.getPageList();
	var l = {};
	dojo.forEach(pages, function(p) {
	    l[p] = true;
	});

        studio.promptForName("page", wm.findUniqueName(optionalInPageType ? wm.capitalize(optionalInPageType) : "Page", [l]), pages,
                             dojo.hitch(this, function(n) {
				 n = wm.capitalize(n);
				 this[optionalInPageType || "main"] = n;
				 studio.project.saveProject(false, dojo.hitch(this, function() {
				     studio.project.newPage(n);
				     switch(optionalInPageType) {
				     case "tabletMain":
						 studio.tabletToggleButton.click();
						 break;
				     case "phoneMain":
						 studio.phoneToggleButton.click();
						 break;
				     default:
						 studio.desktopToggleButton.click();
						 break;
				     }
				 }));
			     }));
    },


    incSubversionNumber: function() {
	if (dojo.isString(this.projectSubVersion)) {
	    if (parseInt(this.projectSubVersion) + "" == this.projectSubVersion)
		this.projectSubVersion = parseInt(this.projectSubVersion) + 1;
	    else {
		var result = this.projectSubVersion.match(/\d+$/);
		if (result) {
		    this.projectSubVersion = this.projectSubVersion.replace(/\d+$/, "");
		    result = parseInt(result[0]) + 1;
		    this.projectSubVersion += result;
		} else {
		    this.projectSubVersion += "0";
		}
	    }
	} else
	    this.projectSubVersion++;
    },
    setPromptChromeFrame: function(inValue) {
	this.promptChromeFrame = inValue;
	var indexText = studio.project.loadProjectData("index.html");
	if (inValue == "Allow IE 6 and 7")
	    inValue = null;
	else
	    inValue = '"' + inValue + '"';
	indexText = indexText.replace(/var\s+wmChromeFramePath.*/, "var wmChromeFramePath = " + inValue + ";")
	studio.project.saveProjectData("index.html", indexText);
	var src = studio.project.generateApplicationSource();
	studio.project.saveProjectData(studio.project.projectName + ".js", src);
    }
});


wm.Object.extendSchema(wm.Application, {
    page: {ignore:1},
    deviceSize: {ignore: 1, bindSource:1},
    name: {ignore: 1}, // at some point, we might provide this as a way to rename the project... but renaming is really a server side op, so requires confirmation. 
    main: {group: "mobile", shortname: "mainPageName", order: 5, editor: "wm.prop.PagesSelect", editorProps: {currentPageOK:true, newPage: true}},
    tabletMain: {group: "mobile", order: 6, editor: "wm.prop.PagesSelect", editorProps: {currentPageOK:true, newPage: true}},
    phoneMain: {group: "mobile", order: 7, editor: "wm.prop.PagesSelect", editorProps: {currentPageOK:true, newPage: true}},
    isSecurityEnabled: {group: "widgetName", subgroup: "security", type: "boolean"},
    phoneGapLoginPage: {group: "mobile", order: 10, type: "string"},
    promptChromeFrame: {group: "widgetName",  subgroup: "behavior", order: 10, type: "string", options: ["chromeframe.html", "http://google.com/chrome", "Allow IE 6 and 7"]},
    toastPosition: {group: "widgetName",  subgroup: "behavior", editor: "wm.prop.SelectMenu", editorProps: {
	options: ["top left", "top center", "top right", "center left", "center center", "center right", "bottom left", "bottom center", "bottom right"],
	values: ["tl", "tc", "tr", "cl", "cc", "cr", "bl", "bc", "br"]}},
    i18n: {group: "widgetName", type: "boolean", order: 6},
    theme: {group: "widgetName", type: "string", order: 7},
    currencyLocale: {group: "widgetName",  subgroup: "behavior", type: "string", order: 8},
    saveCounter: {writeonly: true},
    //IERoundedCorners: {ignore: true},
    dialogAnimationTime: {group: "widgetName", subgroup: "behavior", type: "number", order: 200},
    disableDirtyEditorTracking: {group: "widgetName", subgroup: "behavior", type: "boolean", order: 250},
    manageURL: {ignore:0},
    manageHistory: {ignore:0},
    studioVersion: {group: "widgetName",  subgroup: "version", writeonly: true, type: "string", order: 105},
    projectVersion: {group: "widgetName",  subgroup: "version", type: "string", order: 100},
    projectSubVersion: {group: "widgetName", subgroup: "version", type: "string", order: 101},
    firstThemeChange: {ignore: true},
    documentation: {ignore: true},
    generateDocumentation: {ignore: true},
    loadPage: {method:1},
    forceReloadPage: {method:1},
    getFullVersionNumber: {method:1},
    getSessionId: {method:1},
    echoFile: {method:1},
    alert: {method:1},
    confirm: {method:1},
    prompt: {method:1},
    toastError: {method:1},
    toastWarning: {method:1},
    toastInfo: {method:1},
    toastSuccess: {method:1},
    createToolTip: {method:1},
    hideToolTip: {method:1}
});
