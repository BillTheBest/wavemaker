/*
 * Copyright (C) 2009-2012 VMware, Inc. All rights reserved.
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
 
JavaEditor.widgets = {
	smallToolbarImageList: ["wm.ImageList", {width: 16, height: 16, colCount: 32, url: "images/smallToolbarBtns.png"}, {}],
	layoutBox1: ["wm.Layout", {height: "100%", imageList: "smallToolbarImageList"}, {}, {
	    editorToolbar: ["wm.Panel", {_classes: {domNode: ["StudioToolBar"]}, border: "0,0,1,0", borderColor: "#959DAB", layoutKind: "left-to-right", height: "29px"}, {}, {
		toolbarBtnHolder: ["wm.Panel", {border: "0", padding: "0,4", width: "100%", layoutKind: "left-to-right", height: "100%", verticalAlign: "middle"}, {}, {
				javaServiceSaveButton: ["wm.ToolButton", {imageIndex: 8, width: "24px", height: "16px",  hint: "Save Java service", border: "0", margin: "0,4,0,4"}, {onclick: "javaServiceSaveButtonClick"}],
				toolbarspacer1: ["wm.Spacer", {height: "24px", width: "12px", margin: "0,5"}, {}],
				newJavaBtn: ["wm.ToolButton", {imageIndex: 25, width: "24px", height: "16px", hint: "New Java Service", border: "0", margin: "0,4,0,4"}, {onclick: "newJavaBtnClick"}],
				delJavaBtn: ["wm.ToolButton", {imageIndex: 0, width: "24px", height: "16px", hint: "Delete Java Service", border: "0", margin: "0,4,0,4"}, {onclick: "delJavaBtnClick"}],
				toolbarspacer2: ["wm.Spacer", {height: "24px", width: "12px", margin: "0,5"}, {}],
				openCmpOutBtn: ["wm.ToolButton", {imageIndex: 22, width: "24px", height: "16px", hint: "Open Compiler Output", border: "0", margin: "0,4,0,4"}, {onclick: "openCmpOutBtnClick"}],
				closeCmpOutBtn: ["wm.ToolButton", {imageIndex: 23, width: "24px", height: "16px",  hint: "Close Compiler Output", border: "0", margin: "0,4,0,4"}, {onclick: "closeCmpOutBtnClick"}],
			    javaServiceRefreshButton: ["wm.ToolButton", {imageIndex: 27, width: "24px", height: "16px",hint: "Refresh Java service from disk", border: "0", margin: "0,4,0,4"}, {onclick: "javaServiceRefreshButtonClick"}],
			    toolbarspacer3: ["wm.Spacer", {height: "24px", width: "12px", margin: "0,5"}, {}],
		    findBtn: ["wm.ToolButton", {width: "24px", height: "16px", margin: "0,4,0,4", hint: "Search", iconUrl: "lib/images/silkIcons/magnifier.png"}, {onclick: "findClick"}],
			    formatBtn: ["wm.ToolButton", {width: "24px",  height: "16px", margin: "0,4,0,4", hint: "Reformat Code", imageIndex: 29}, {onclick: "formatClick"}],
			    wordWrapBtn: ["wm.ToolButton", {_classes: {domNode: ["ToggleWordWrap"]},width: "24px",  height: "16px", margin: "0", hint: "Toggle line wrapping", imageIndex: 15,imageList: "studio.canvasToolbarImageList16"}, {onclick: "toggleWrapClick"}],
			    pageHelpBtn: ["wm.ToolButton", {width: "24px", height: "16px",  margin: "0,4,0,4", hint: "Help", imageIndex: 26}, {onclick: "showEditorHelp"}],

			}],
			logoBtmHolder: ["wm.Panel", {border: "0", width: "221px"}, {}]
		}],
		editorContainer: ["wm.Panel", {border: "0", width: "100%", layoutKind: "left-to-right", height: "100%"}, {}, {
			panel6: ["wm.Panel", {border: "0", width: "100%", height: "100%"}, {}, {
				javaServicePanel: ["wm.Panel", {border: "0", width: "100%", height: "100%"}, {}, {
				    javaCodeEditor: ["wm.AceEditor", {height: "100%", width: "100%", border: "0", syntax: "java"}, {onCtrlKey: "onCtrlKey", onChange: "setDirty"}],
					javaCodeSplitter: ["wm.Splitter", {layout: "bottom", border: "0"}, {}],
				    logTabs: ["wm.TabLayers", {_classes: {domNode: ["StudioTabs", "StudioDarkLayers"]}, width: "100%", height: "200px",clientBorder: "1,0,0,0", clientBorderColor: "#959DAB"}, {onchange: "changeLogTab"}, {
					    complierTab: ["wm.Layer", {caption: "Compiler Messages"}, {}, {
						    /*
						javaCompilerOutputPanel: ["wm.Panel", {border: "0", height: "150px"}, {}, {
						    javaServiceOutputLabel: ["wm.Label", {caption: "Compiler Output", width: "100%", height: "30px", border: "0"}, {}, {
							format: ["wm.DataFormatter", {}, {}]
						    }],
							    */
						    javaCompilerOutputEditor: ["wm.Html", {height: "100%", width: "100%", readonly: true, readOnly: true, border: "0", scrollY: true}, {}]
						}],
					    serverTab: ["wm.Layer", {caption: "Server Logs"}, {onclick: "updateLogs"}, {
						logViewer: ["wm.PageContainer", {pageName: "LogViewer",  width: "100%", height: "100%"}]
					    }]
					}]
							
				}]
			}],
			splitter1: ["wm.Splitter", {layout: "right"}, {}],
			panel5: ["wm.Panel", {_classes: {domNode: ["wm-darksnazzy"]}, border: "0", width: "220px"}, {}, {
				typeTree: ["wm.Tree", {height: "100%", border: "0"}, {}],
				tabLayers1: ["wm.TabLayers", {border: "0", showing: false, width: "100%", height: "100%"}, {}, {
					typeRefLayer: ["wm.Layer", {caption: "Type Reference"}, {}],
					javaListLayer: ["wm.Layer", {caption: "Java Services"}, {}, {
						tree: ["wm.ServicesTree", {height: "584px", border: "0", width: "224px"}, {onselect: "treeSelect"}]
					}]
				}]
			}]
		}],
		benchbevel4: ["wm.Bevel", {border: "0"}, {}]
	}]
}
