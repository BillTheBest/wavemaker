/*
 * Copyright (C) 2009-2010 WaveMaker Software, Inc.
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
ImportDatabase.widgets = {
	layoutBox1: ["wm.Layout", {_classes: {domNode: ["wm-darksnazzy"]}, height: "100%", width: "100%"}, {}, {
					importDBDialogInner: ["wm.Panel", {width: "100%", height: "100%"}, {}, {
							panel1: ["wm.TabLayers", {height: "100%", padding: "10"}, {}, {
							    panel2: ["wm.Layer", {caption: "Basic Options", layoutKind: "top-to-bottom", horizontalAlign: "center", verticalAlign: "middle", padding: "0"}, {}, {

										panel501a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label301: ["wm.Label", {width: "118px", border: "0", caption: "Database System"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
										    dbdropdown: ["wm.Editor", {display: "Select", height: "20px", width: "304px", margin: "0,0,1,0"}, {onchange: "importDBdropdownChanged"}, {
												editor: ["wm._SelectEditor", {}, {}]
											}]
										}],
										panel601a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											hostLabel: ["wm.Label", {width: "120px", border: "0", caption: "Hostname"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
										    hostInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onkeypress: "onImportHostKeyPress", onchange: "importHostChanged", onenterkey: "importBtnClick"}]
										}],
										panel6a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label4: ["wm.Label", {width: "120px", border: "0", caption: "Username"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											usernameInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onkeypress: "onUsernameKeyPress", onchange: "usernameChanged", onenterkey: "importBtnClick"}]
										}],
										panel603a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label5: ["wm.Label", {width: "120px", border: "0", caption: "Password"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											passwordInput: ["wm.Input", {checked: true, width: "300px", border: "0", inputType: "password"}, {onenterkey: "importBtnClick"}]
										}],
										panel701a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											extraInputLabel: ["wm.Label", {width: "120px", border: "0", caption: "extraInputLabel", showing: false}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											extraInput: ["wm.Input", {checked: true, width: "300px", border: "0", showing: false}, {onkeypress: "onImportExtraKeyPress", onchange: "importExtraChanged", onenterkey: "importBtnClick"}]
										}],
										extra2Panel: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											extra2InputLabel: ["wm.Label", {width: "120px", border: "0", caption: "Instance"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											extra2Input: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onkeypress: "onImportExtra2KeyPress", onchange: "importExtra2Changed", onenterkey: "importBtnClick"}]
										}]
								}],
							    panel4: ["wm.Layer", {caption: "Advanced Options", layoutKind: "top-to-bottom", padding: "4,0,0,0", autoScroll: true}, {}, {

								panel5a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label3: ["wm.Label", {width: "120px", border: "0", caption: "Service Name"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											serviceNameInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onkeypress: "onServiceNameKeyPress", onchange: "serviceNameChanged", onenterkey: "importBtnClick"}]
										}],

										panel602a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											portLabel: ["wm.Label", {width: "120px", border: "0", caption: "Port"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											portInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onkeypress: "onImportPortKeyPress", onchange: "importPortChanged", onenterkey: "importBtnClick"}]
										}],

										panel110a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label6: ["wm.Label", {width: "120px", border: "0", caption: "Connection URL"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											connectionUrlInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onenterkey: "importBtnClick"}]
										}],
										panel19a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label7: ["wm.Label", {width: "120px", border: "0", caption: "Java Package"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											packageInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onenterkey: "importBtnClick"}]
										}],
										panel18a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label8: ["wm.Label", {width: "120px", border: "0", caption: "Table Filter"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											tablePatternInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onenterkey: "importBtnClick"}]
										}],
										panel1801a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label9: ["wm.Label", {width: "120px", border: "0", caption: "Schema Filter"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											schemaPatternInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onenterkey: "importBtnClick"}]
										}],
										panel20a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label16: ["wm.Label", {width: "120px", border: "0", caption: "Driver Class"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											driverClassInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onenterkey: "importBtnClick"}]
										}],
										panel201a: ["wm.Panel", {height: "24px", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label27: ["wm.Label", {width: "120px", border: "0", caption: "Dialect"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											dialectInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onenterkey: "importBtnClick"}]
										}],
								panel202a: ["wm.Panel", {height: "28px", padding: "0,0,4,0", layoutKind: "left-to-right", width: "100%",horizontalAlign: "center"}, {}, {
											label28: ["wm.Label", {width: "120px", border: "0", caption: "Naming Strategy"}, {}, {
												format: ["wm.DataFormatter", {}, {}]
											}],
											revengNamingStrategyInput: ["wm.Input", {checked: true, width: "300px", border: "0"}, {onenterkey: "importBtnClick"}]
										}]
									}]
								}]

						}],
						footer: ["wm.Panel", {height: "30px", layoutKind: "left-to-right", horizontalAlign: "right"}, {}, {
							testConnectionBtn: ["wm.Button", {caption: "Test Connection", width: "160px"}, {onclick: "testConnectionBtnClick"}],
							spacer1: ["wm.Spacer", {width: "10px"}, {}],
							importBtn: ["wm.Button", {caption: "Import", width: "96px", hint: "Import Database"}, {onclick: "importBtnClick"}],
							spacer2: ["wm.Spacer", {width: "10px"}, {}],
							cancelBtn: ["wm.Button", {caption: "Close", width: "96px"}, {onclick: "cancelBtnClick"}]
						}]

		}]
}