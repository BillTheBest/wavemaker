/*
 * Copyright (C) 2010-2011 VMWare, Inc. All rights reserved.
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
 

ResourceManager.widgets = {  
    /*
    resourceManagerVar: ["wm.ServiceVariable", {service: "resourceManager", operation: "getResourceFolder"}, {}, {   
	input: ["wm.ServiceInput", {type: "getResourceFolderInputs"}, {}, {
	    binding: ["wm.Binding", {}, {}, {
		wire: ["wm.Wire", {targetProperty: "name", source: "nameEditor.dataValue"}, {}]
	    }]
	}]
    }],
    */
	layoutBox1: ["wm.Layout", {height: "100%", width: "100%", horizontalAlign: "left", verticalAlign: "top", layoutKind: "left-to-right"}, {}, {
		panel1: ["wm.Panel", {_classes: {domNode: ["wm-darksnazzy"]}, height: "100%", width: "140px", verticalAlign: "top", horizontalAlign: "left"}, {}, {
			resourcePalette: ["wm.ResourcePalette", {height: "100%", width: "100%"}, {}]
  		}],
		resourcesCanvas: ["wm.Panel", {width: "100%", height: "100%"}, {}, { 
		    //resourcesFolder: ["wm.FolderResourceItem", {itemName: "resources", editable: false, saved: true}, {}, {}] 
		}],
		resourcePropertiesContainer: ["wm.Panel", {_classes: {domNode: ["wm_BackgroundColor_Black"]}, height: "100%", width: "260px", verticalAlign: "top", margin: 0, layoutKind: "top-to-bottom"}, {}, {
		    resourcePropertiesHeader: ["wm.Panel", {height: "17px", width: "100%", verticalAlign: "bottom", layoutKind: "left-to-right", padding: "2,6,0,6", margin: "0,4,0,4"},{},{ 
			resourcePropertiesHeaderIcon: ["wm.Picture", {height: "15px", width: "15px", source: "", aspect: "h"}],
			resourcePropertiesHeaderLabel: ["wm.Label", {_classes: {domNode: ["wm_FontColor_White"]}, height: "15px", width: "100%", caption: "Properties"}],
		    }],
		    resourceProperties: ["wm.Panel", {_classes: {domNode: ["wm-darksnazzy"]}, height: "100%", width: "100%", verticalAlign: "top", horizontalAlign: "center", margin: 4, padding: 6, layoutKind: "top-to-bottom"}, {}, {
			    /*
			filename: ["wm.Editor", {caption: "filename", captionSize: "60%"}, {}, {
			    editor: ["wm._TextEditor", {}, {}]
			}],
			fileUpload1: ["wm.FileUpload", {height: "24px", width: "100%", horizontalAlign: "middle", caption: "", uploadButton: false}, {}, {}],  
			fileUploadButton: ["wm.Button", {height: "55px", width: "80px", horizontalAlign: "middle", caption: "Upload Now"}, {onclick: "UploadFileClick"}]
			    */
		    }]
		}]
	}]
};
