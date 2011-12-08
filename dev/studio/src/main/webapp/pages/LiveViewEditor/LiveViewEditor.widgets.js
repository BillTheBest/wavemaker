/*
 * Copyright (C) 2009-2011 VMware, Inc. All rights reserved.
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
 
LiveViewEditor.widgets = {
	smallToolbarImageList: ["wm.ImageList", {width: 16, height: 16, colCount: 32, url: "images/smallToolbarBtns.png"}, {}],
	liveVariable: ["wm.LiveVariable", {autoUpdate: false, startUpdate: false}, {onSuccess: "updateSuccess"}],
	layoutBox1: ["wm.Layout", {_classes: {domNode: ["wm-darksnazzy"]}, height: "100%", width: "100%", imageList: "smallToolbarImageList"}, {}, {
		managerToolbar: ["wm.Panel", {border: "0", padding: "0,4", height: "29px", layoutKind: "left-to-right"}, {}, {
			toolbarBtnHolder: ["wm.Panel", {border: "0", height: "100%", layoutKind: "left-to-right", width: "100%"}, {}, {
				saveLiveViewBtn: ["wm.ToolButton", {imageIndex: 8, width: "24px", height: "100%", border: "", margin: "", hint: "Save LiveView"}, {onclick: "saveLiveViewBtnClick"}],
				toolbarspacer1: ["wm.Spacer", {height: "24px", width: "12px", margin: "0,5"}, {}],
				newLiveViewBtn: ["wm.ToolButton", {imageIndex: 25, width: "24px", height: "100%", border: "", margin: "", hint: "New LiveView", showing: false}, {onclick: "newLiveViewBtnClick"}],
				delLiveViewBtn: ["wm.ToolButton", {imageIndex: 0, width: "24px", height: "100%", border: "", margin: "", hint: "Delete LiveView"}, {onclick: "delLiveViewBtnClick"}]
			}],
			logoBtmHolder: ["wm.Panel", {border: "0", width: "221px"}, {}]
		}],
		titleLabel1: ["wm.Label", {_classes: {domNode: ["wm_TextDecoration_Bold"]}, height: "28px", width: "100%", padding: "4", caption: "LiveView", border: "1,0,0,0", borderColor: "#000000"}, {}, {
			format: ["wm.DataFormatter", {}, {}]
		}],
		namePanel: ["wm.Panel", {border: "0", height: "28px", padding: "2", width: "100%", layoutKind: "left-to-right"}, {}, {
			nameEdit: ["wm.Editor", {caption: "LiveView Name", captionSize: "150px", layoutKind: "left-to-right", captionAlign: "left", width: "350px", height: "100%"}, {onchange: "nameEditChanged"}, {
			    editor: ["wm._TextEditor", {changeOnKey:true}, {}]
			}]
		}],
		label1: ["wm.Label", {height: "20px", width: "100%", border: "", padding: "4", caption: "Choose fields to include in this LiveView. Fields required for data operations indicated by <span class=\"wmeditor-required\">*</span>.", singleLine: false}, {}, {
			format: ["wm.DataFormatter", {}, {}]
		}],
		bevel1: ["wm.Bevel", {border: ""}, {}],
		panel1: ["wm.Panel", {border: "0", height: "100%", width: "100%", layoutKind: "left-to-right"}, {}, {
			tree1: ["wm.Tree", {height: "100%", width: "100%", border: ""}, {oninitchildren: "tree1Initchildren", oncheckboxclick: "tree1Checkboxclick", onselect: "tree1Select", ondblclick: "tree1DblClick"}],
			splitter1: ["wm.Splitter", {layout: "right", border: ""}, {}],
			panel2: ["wm.Panel", {border: "0", width: "398px", height: "100%"}, {}, {
				fieldLabel: ["wm.Label", {_classes: {domNode: ["wm_TextDecoration_Bold"]}, height: "28px", border: "1,0,0,0", borderColor: "#000000", padding: "4", caption: "Field Options"}, {}, {
					format: ["wm.DataFormatter", {}, {}]
				}],
				liveForm1: ["wm.LiveForm", {border: "0", captionSize: "90px", height: "100%", width: "100%", padding: "4"}, {}, {
					captionEdit: ["wm.Editor", {caption: "Caption", height: "24px", captionSize: "90px", layoutKind: "left-to-right"}, {onchange: "fieldEditorChanged"}, {
						editor: ["wm._TextEditor", {changeOnKey:true}, {}]
					}],
					orderEdit: ["wm.Editor", {caption: "Order", height: "24px", captionSize: "90px", layoutKind: "left-to-right"}, {onchange: "fieldEditorChanged"}, {
						editor: ["wm._NumberEditor", {changeOnKey:true}, {}]
					}],
					typeEdit: ["wm.Editor", {caption: "Type Hint", display: "Select", height: "24px", captionSize: "90px", layoutKind: "left-to-right"}, {onchange: "fieldEditorChanged"}, {
						editor: ["wm._SelectEditor", {options: "Text,Date,Time,Number,Currency,CheckBox,TextArea,RadioButton,Slider"}, {}]
					}],
					autoSizeBox: ["wm.Editor", {caption: "Auto Size", display: "CheckBox", displayValue: true, height: "24px", width: "100%", captionSize: "90px", layoutKind: "left-to-right", emptyValue: "false"}, {onchange: "fieldEditorChanged"}, {
						editor: ["wm._CheckBoxEditor", {dataType: "boolean"}, {}]
					}],
					panel5: ["wm.Panel", {border: "0", height: "24px", width: "100%", layoutKind: "left-to-right"}, {}, {
						widthEdit: ["wm.Editor", {caption: "Width", display: "Number", captionSize: "90px", layoutKind: "left-to-right", height: "100%"}, {onchange: "fieldEditorChanged"}, {
							editor: ["wm._NumberEditor", {changeOnKey:true}, {}]
						}],
						widthUnitsEdit: ["wm.Editor", {display: "Select", layoutKind: "left-to-right", captionPosition: "right", width: "82px", height: "100%"}, {onchange: "fieldEditorChanged"}, {
							editor: ["wm._SelectEditor", {options: "px,%"}, {}]
						}]
					}],
					requiredBox: ["wm.Editor", {caption: "Required", display: "CheckBox", displayValue: true, height: "24px", width: "100%", captionSize: "90px", layoutKind: "left-to-right", emptyValue: "false"}, {onchange: "fieldEditorChanged"}, {
						editor: ["wm._CheckBoxEditor", {dataType: "boolean"}, {}]
					}]
				}]
			}]
		}],
		splitter2: ["wm.Splitter", {border: "", layout: "bottom"}, {}],
		previewPanel: ["wm.Panel", {border: "0", height: "30px", width: "100%"}, {}, {
			panel4: ["wm.Panel", {border: "0", height: "24px", width: "100%", layoutKind: "left-to-right"}, {}, {
				previewBox: ["wm.CheckBoxEditor", {caption: "Preview", captionSize: "200px", captionAlign: "left", captionPosition: "right", width: "220px", height: "100%", layoutKind: "left-to-right"}, {onchange: "previewBoxChange"}, {
					editor: ["wm._CheckBoxEditor", {}, {}]
				}]
			}],
			bevel2: ["wm.Bevel", {}, {}],
			dataGrid1: ["wm.DataGrid", {width: "100%", height: "100%", showing: false}, {}, {
				column: ["wm.DataGridColumn", {autoSize: true}, {}, {
					format: ["wm.DataFormatter", {}, {}]
				}]
			}]
		}],
		benchbevel4: ["wm.Bevel", {border: "0"}, {}]
	}]
}