/*
 * Copyright (C) 2008-2012 VMware, Inc. All rights reserved.
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
 
dojo.provide("wm.studio.app.StudioApplication");

dojo.declare("StudioApplication", wm.Application, {
    manageURL:false,
	main: "Main",
        theme: "wm_studio",
	widgets: {
            pagesListVar: ["wm.Variable", {type: "StringData", isList: true}],
	    projectListVar: ["wm.Variable", {type: "StringData", isList: true}]
	},
/*
    init: function() {
	this.inherited(arguments);

    },
    */
    confirm: function() {
        this.inherited(arguments);
	dojo.addClass(this.confirmDialog.domNode, "studiodialog");
        this.confirmDialog.setBorderColor("#55555");
        this.confirmDialog.setBorder("3");        
        this.confirmDialog.$.genericInfoPanel.setBorder("10");
        this.confirmDialog.$.genericInfoPanel.setBorderColor("#424A5A");
    },
    alert: function() {      
        var hasAlert = this.alertDialog;
        this.inherited(arguments);
        if (!hasAlert) {
	    dojo.addClass(this.alertDialog.domNode, "studiodialog");
        this.alertDialog.setBorderColor("#55555");
        this.alertDialog.setBorder("3");        
            this.alertDialog.$.genericInfoPanel.setBorder("10");
            this.alertDialog.$.genericInfoPanel.setBorderColor("#424A5A");
        }
    }
});
