/*
 * Copyright (C) 2011-2012 VMware, Inc. All rights reserved.
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
 

ConfirmSaveDialog.widgets = {
    layoutBox1: ["wm.Layout", {_classes: {domNode: ["StudioDarkPanel"]}, "height":"100%","horizontalAlign":"left","verticalAlign":"top","width":"100%", layoutKind: "top-to-bottom"}, {}, {
        mainPanel: ["wm.studio.DialogMainPanel", {},{}, {
	    html: ["wm.Html", {width: "100%", height: "100%", html: "You have unsaved changes; do you want to save before continuing?", autoSizeHeight: true, autoScroll: false }],
	}],
            buttonBar: ["wm.studio.DialogButtonPanel", {},{}, {
		dontSaveButton: ["wm.Button", {"_classes":{"domNode":["StudioButton"]},"caption":"Don't Save","width":"100px"}, {onclick: "dontSaveClick"}],
		spacer1: ["wm.Spacer", {"width":"100%"}, {}],
	        cancelButton: ["wm.Button", {"_classes":{"domNode":["StudioButton"]},"caption":"Cancel", width: "80px"}, {onclick: "cancelClick"}],
	        saveButton: ["wm.Button", {"_classes":{"domNode":["StudioButton"]},"caption":"Save", width: "80px"}, {onclick: "saveClick"}]
	    }]
	}]
}