/*
 * Copyright (C) 2010 WaveMaker Software, Inc.
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

ImportFile.widgets = {
    layoutBox1: ["wm.Layout", {layoutKind: "top-to-bottom", width: "100%", height: "100%", _classes: ["wm-darksnazzy"]}, {}, {
	dialog: ["wm.Panel", {layoutKind: "top-to-bottom",  width: "100%", height: "100%", border: "10", borderColor: "#424959"}, {}, {
	    panel: ["wm.Panel", {_classes: ["wm_Padding_16px"], 
				 layoutKind: "top-to-bottom", 
				 width: "100%", 
				 height: "100%", 
				 padding: "16",
				 horizontalAlign: "left", 
				 verticalAlign: "top"}, {}, {
		panel1: ["wm.Panel", {layoutKind: "left-to-right", width: "100%", height: "40px", verticalAlign: "top", horizontalAlign: "left"},{}, {
		    fileUploader: ["wm.DojoFileUpload", {  width: "100px",
							   height: "32px",
							   useList: false,
							   buttonCaption: "Select Zipfile",
							   service: "deploymentService",
							   operation: "uploadProjectZipFile"},
				   {onSuccess: "selectLastItem"}],
		    openButton: ["wm.Button", { caption: "Open Project",
						height: "32px",
						padding: "0",
						margin: "0,0,0,20",
						width: "120px"},
				 {onclick: "openProject"},
				 {
				      binding: ["wm.Binding", {}, {}, {
					  wire: ["wm.Wire", {"targetProperty":"disabled", expression: "!${list.selectedItem.path}"}, {}]
				      }]
				 }]
		}],
		list: ["wm.List", {width: "100%",
				   height: "100%",
				   dataFields: "name",
				   headerVisible: false,
				   border: "1",
				   borderColor: "black"
				  },{}, {
				      binding: ["wm.Binding", {}, {}, {
					  wire: ["wm.Wire", {"targetProperty":"dataSet", source: "fileUploader.variable"}, {}]
				      }]
				  }]
	    }]
	}]
    }]
}
