/*
 * Copyright (C) 2009-2011 WaveMaker Software, Inc.
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
DeploymentPage_Cloud_rackspaceserver.widgets = {
    cloudServerService: ["wm.JsonRpcService", {service: "cloudServerService", sync: true}, {}],
	deploymentService: ["wm.JsonRpcService", {service: "deploymentService", sync: true}, {}],
    //cloudTaskListVar: ["wm.Variable", {type: "EntryData", json: "[{name: 'Build a new server', dataValue: 'build'},{name: 'Turn off existing server', dataValue: 'delete'}]"}],		    
    ImageListVar: ["wm.Variable", {type: "com.wavemaker.tools.cloudmgr.CloudImage", json: "[{name: 'server1', dataValue: 'server1'}, {name: 'server2', dataValue: 'server2'}]"}, {}],
    FlavorListVar: ["wm.Variable", {type: "com.wavemaker.tools.cloudmgr.CloudFlavor", json: "[{name: 'network1', dataValue: 'network1'}, {name: 'network2', dataValue: 'network2'}]"}],
    HostNamesVar: ["wm.Variable", {type: "com.wavemaker.tools.cloudmgr.CloudServer"}, {}],
    destTypeVar: ["wm.Variable", {type: "EntryData", json: "[{name: 'Server', dataValue: 'server'}, {name: 'Container', dataValue: 'container'}]"}],
	serverTypeVar: ["wm.Variable", {type: "EntryData", json: "[{name: 'Tomcat', dataValue: 'tomcat'}, {name: 'WebSphere', dataValue: 'websphere'}, {name: 'JBoss', dataValue: 'jboss'}, {name: 'WebLogic', dataValue: 'webLogic'}]"}],
	//variable1: ["wm.Variable", {"type":"EntryData","json":"[ {name: \" \", dataValue: \"\" }, \n{name: \"Alabama\", dataValue: \"AL\" }, \n{name: \"Alaska\", dataValue: \"AK\"}, \n{name: \"Arizona\", dataValue: \"AZ\"},\n{name: \"Arkansas\", dataValue: \"AR\"}, \n{name: \"Washington\", dataValue: \"WA\"}, \n{name: \"West Virginia\", dataValue: \"WV\"}, \n{name: \"Wisconsin\", dataValue: \"WI\"}, \n{name: \"Wyoming\", dataValue: \"WY\"} ]"}, {}],
	serviceProviderVar: ["wm.Variable", {type: "EntryData", 
		json: "[{name: 'Amazon', dataValue: 'amazon'}, {name: 'Eucalyptus', dataValue: 'eucalyptus'}, {name: 'OpSource', dataValue: 'opsource'}, {name: 'RackSpace', dataValue: 'rackspace'}]"}],
	layoutBox1: ["wm.Layout", {height: "100%"}, {}, {
	MainLayers: ["wm.Layers", {width: "100%", height: "100%"}, {}, {

	    CredentialLayer: ["wm.Layer", {width: "100%", height: "100%", margin: "10", border: "3", borderColor: "#B0BDD4"}, {}, {
		stepCredentialLabel: ["wm.Label", {_classes: {domNode: ["wm_FontSizePx_14px", "DeploymentHeader"]}, height: "38px", width: "96px", caption: "Enter RackSpace account information", margin: "0,0,5,0"}, {}, {
		    format: ["wm.DataFormatter", {}, {}]
		}],
		CredentialLayerPanel: ["wm.Panel", {height: "100%", width: "100%", margin: "6"},{}, {
		CredentialPanel:  ["wm.Panel", {height: "120px", width: "450px", layoutKind: "top-to-bottom"}, {}, {
		    username: ["wm.Text", {width: "350px", caption: "Username", height: "20px", changeOnKey: true, captionSize: "20%"}, 
				{onEnterKeyPress: "CredentialOKButtonClick"}],
		    spacer111: ["wm.Spacer", {height: "5px", width: "250px"}, {}],
		    password: ["wm.Text", {password: 1, width: "350px", caption: "Password (API Access Key)", height: "20px",  changeOnKey: true, captionSize: "20%"}, 
				{onEnterKeyPress: "CredentialOKButtonClick"}]
		}],
		spacer118: ["wm.Spacer", {height: "15px", width: "20px"}, {}],
		HelpPanel: ["wm.Panel", {height: "150px", width: "100%", layoutKind: "left-to-right"}, {}, {
			spacer337: ["wm.Spacer", {height: "5px", width: "100px"}, {}],
			helpLabel: ["wm.Html", {showing: false, height: "100%", width: "100%", singleLine: false,}],
		}],
		spacerButtonPanel1: ["wm.Spacer", {height: "100%"}],
		CredentialButtonPanel: ["wm.Panel", {height: "48px", width: "100%", layoutKind: "left-to-right", verticalAlign: "top", horizontalAlign: "right"}, {}, {
		    CredentialOKButton: ["wm.Button", {height: "48px", width: "150px", caption: "OK"}, {onclick: "CredentialOKButtonClick"}, {
			binding: ["wm.Binding", {}, {}, {
			    wire: ["wm.Wire", {"targetProperty":"disabled","expression":"!${password.dataValue} || !${username.dataValue}"}, {}]
			}]
		    }],
			//spacer382: ["wm.Spacer", {height: "48px", width: "14px"}, {}],
			CredentialBackButton: ["wm.Button", {height: "48px", width: "150px", caption: "Back to Service Provider List"}, {onclick: "CredentialBackButtonClick"}]    
		}]
		}]
	    }],

	    CreateServersLayer: ["wm.Layer", {width: "100%", height: "100%", margin: "10", border: "3", borderColor: "#B0BDD4"}, {onShow: "createServerShow"}, {
		CreateServersLabel: ["wm.Label", {_classes: {domNode: ["wm_FontSizePx_14px", "DeploymentHeader"]}, height: "38px", width: "100%", caption: "Create Server", margin: "0,0,5,0"}],
		CreateServerLayerPanel: ["wm.Panel", {height: "100%", width: "100%", margin: "6"},{}, {
		    serverName: ["wm.Text", {captionSize: "75px", captionAlign: "left", caption: "Server Name", width: "100%", height: "24px", changeOnKey: true}],
		CreateServerOptionsPanel:  ["wm.Panel", {height: "180px", width: "450px", layoutKind: "left-to-right"}, {}, {
		    ImageListPanel: ["wm.Panel", {height: "100%", width: "35%", layoutKind: "top-to-bottom"}, {}, {
			ImageListLabel: ["wm.Label", {height: "20px", width: "100%", caption: "Choose a server image"}],
			ImageList: ["wm.List", {width: "100%", height: "100%", 
				dataFields: "id, name",
				//columnWidths: "70px, 150px, 80px, 80px, 100px",
				border: "2", borderColor: "rgb(120,120,120)", headerVisible: true}, {}, {
			    binding: ["wm.Binding", {}, {}, {
				wire: ["wm.Wire", {targetProperty: "dataSet", source: "ImageListVar"}, {}]
			    }]
			}],
		    }],
		    optionsSpacer2: ["wm.Spacer", {height: "48px", width: "14px"}, {}],		    
		    FlavorListPanel: ["wm.Panel", {height: "100%", width: "65%", layoutKind: "top-to-bottom"}, {}, {
			FlavorListLabel: ["wm.Label", {height: "20px", width: "100%", caption: "Choose a server flavor"}],
			FlavorList: ["wm.List", {width: "100%", height: "100%", 
				dataFields: "id, name, description, memory, osStorage, extraStorage", 
				border: "2", borderColor: "rgb(120,120,120)", headerVisible: true}, {}, {
			    binding: ["wm.Binding", {}, {}, {
				wire: ["wm.Wire", {targetProperty: "dataSet", source: "FlavorListVar"}, {}]
			    }]
			}],
		    }],
		}],

		spacerButtonPanel5: ["wm.Spacer", {height: "100%"}],
		CreateServerButtonPanel: ["wm.Panel", {height: "48px", width: "100%", layoutKind: "left-to-right", verticalAlign: "top", horizontalAlign: "right"}, {}, {
		    CreateServerButton: ["wm.Button", { caption: "Create", width: "150px", height: "100%"}, {onclick: "createServerClick"}, {
			binding: ["wm.Binding", {}, {}, {
			    wire: ["wm.Wire", {"targetProperty":"disabled","expression":"${FlavorList.emptySelection} ||  ${ImageList.emptySelection} || !${serverName.dataValue}"}, {}]
			}]
		    }],
			//spacer388: ["wm.Spacer", {height: "48px", width: "14px"}, {}],
			CreateServerBackButton: ["wm.Button", { caption: "Back to Server List", width: "150px", height: "100%", }, {onclick: "createServerBackClick"}]		    
		}]
		}],
	    }],

		TargetPropertiesLayer: ["wm.Layer", {width: "100%", height: "100%", margin: "10", border: "3", borderColor: "#B0BDD4"}, {onShow: "setDefaultProperties"}, {
			TargetPropertiesLabel: ["wm.Label", {_classes: {domNode: ["wm_FontSizePx_14px", "DeploymentHeader"]}, height: "38px", width: "100%", caption: "Server Properties", margin: "0,0,5,0"}],
			TargetPropertiesLayerPanel: ["wm.Panel", {height: "100%", width: "100%", margin: "6"},{}, {
				targetName: ["wm.Text", {captionSize: "115px", captionAlign: "left", caption: "Name", width: "100%", height: "24px", changeOnKey: true}],
				targetDescription: ["wm.Text", {captionSize: "115px", captionAlign: "left", caption: "Description", width: "100%", height: "24px", changeOnKey: true}],
				destType: ["wm.SelectMenu", {captionSize: "115px", captionAlign: "left", caption: "Destination Type", width: "100%", height: "24px", displayField: "name", dataField: "dataValue"}, {}, {
					binding: ["wm.Binding", {}, {}, {
						wire: ["wm.Wire", {targetProperty: "dataSet", source: "destTypeVar"}, {}]
					}]
				}],
				serviceProvider: ["wm.SelectMenu", {captionSize: "115px", captionAlign: "left", caption: "Service Provider", width: "100%", height: "24px", displayField: "name", dataField: "dataValue"}, {}, {
					binding: ["wm.Binding", {}, {}, {
						wire: ["wm.Wire", {targetProperty: "dataSet", source: "serviceProviderVar"}, {}]
					}]
				}],
				serverType: ["wm.SelectMenu", {captionSize: "115px", captionAlign: "left", caption: "App Server", width: "100%", height: "24px", displayField: "name", dataField: "dataValue"}, {}, {
					binding: ["wm.Binding", {}, {}, {
						wire: ["wm.Wire", {targetProperty: "dataSet", source: "serverTypeVar"}, {}]
					}]
				}],
				publicIP: ["wm.Text", {captionSize: "115px", captionAlign: "left", caption: "Public IP Address", width: "100%", height: "24px", changeOnKey: true}],
				privateIP: ["wm.Text", {captionSize: "115px", captionAlign: "left", caption: "Private IP Address", width: "100%", height: "24px", changeOnKey: true}],
				portNumber: ["wm.Text", {captionSize: "115px", captionAlign: "left", caption: "Port", width: "100%", height: "24px", changeOnKey: true}],
				serverUser: ["wm.Text", {captionSize: "115px", captionAlign: "left", caption: "User", 
							width: "100%", height: "24px", displayValue: "", emptyValue: "", changeOnKey: true}],
				serverPassword1: ["wm.Text", {password: 1, captionSize: "115px", captionAlign: "left", caption: "Enter Password", 
							width: "100%", height: "24px", displayValue: "", emptyValue: "", changeOnKey: true}],
				serverPassword2: ["wm.Text", {password: 1, captionSize: "115px", captionAlign: "left", caption: "Confirm Password", 
							width: "100%", height: "24px", displayValue: "", emptyValue: "", changeOnKey: true}],
			
				spacer389: ["wm.Spacer", {height: "8px", width: "14px"}, {}],
				overrideFlag: ["wm.CheckBoxEditor", {captionSize: "230px", captionAlign: "left", caption: "Override information if already exists?", 
					width: "100%", layoutKind: "left-to-right", displayValue: true, emptyValue: "false"}, {}, {
						editor: ["wm._CheckBoxEditor", {dataType: "boolean"}, {}]
				}],
				
				spacerButtonPanel5: ["wm.Spacer", {height: "100%"}],
				TargetPropertiesButtonPanel: ["wm.Panel", {height: "48px", width: "100%", layoutKind: "left-to-right", 
						verticalAlign: "top", horizontalAlign: "right"}, {}, {
					TargetPropertiesOKButton: ["wm.Button", { caption: "OK", width: "150px", height: "100%"}, 
						{onclick: "targetPropertiesOKClick"}, {
						binding: ["wm.Binding", {}, {}, {
							wire: ["wm.Wire", {"targetProperty":"disabled","expression":"!${targetName.dataValue} || !${targetDescription.dataValue}"}, {}]
						}]
					}],
					//spacer389: ["wm.Spacer", {height: "48px", width: "14px"}, {}],
					TargetPropertiesBackButton: ["wm.Button", { caption: "Back to Server List", width: "150px", height: "100%", }, {onclick: "targetPropertiesBackClick"}]	
				}],
			}],
		}],
	    
		ServerListLayer: ["wm.Layer", {width: "100%", height: "100%", margin: "10", border: "3", borderColor: "#B0BDD4"}, {}, {
		ServerListLabel: ["wm.Label", {_classes: {domNode: ["wm_FontSizePx_14px", "DeploymentHeader"]}, height: "38px", width: "100%", caption: "Server List", margin: "0,0,5,0"}],
		
		ServerListLayerPanel: ["wm.Panel", {height: "100%", width: "100%", margin: "6"},{}, {
		HostListPanel:  ["wm.Panel", {height: "255px", width: "450px", layoutKind: "top-to-bottom"}, {}, {
		    HostListLabel: ["wm.Label", {height: "20px", width: "100%", caption: "Choose a server"}],
		    HostList: ["wm.List", {toggleSelect: true, width: "100%", height: "100%",  
				dataFields: "serverName, created, imageId, FlavorId, publicIpAddress, privateIpAddress", 
				//columnWidths: "85px, 180px, 100px, 100px",
				headerVisible: true, border: "2", borderColor: "rgb(120,120,120)"}, {}, {
			binding: ["wm.Binding", {}, {}, {
			    wire: ["wm.Wire", {targetProperty: "dataSet", source: "HostNamesVar"}, {}]
			}]
		    }],
		}],
		
		spacer383: ["wm.Spacer", {height: "85px", width: "14px"}, {}],
		HostListButtonPanel: ["wm.Panel", {height: "48px", width: "100%", layoutKind: "left-to-right", verticalAlign: "top", horizontalAlign: "right"}, {}, {
		    HostListRefreshButton: ["wm.Button", { caption: "Refresh", width: "150px", height: "100%"}, {onclick: "serverListRefreshClick"}],
			//spacer358: ["wm.Spacer", {height: "48px", width: "14px"}, {}],

			HostListCreateButton: ["wm.Button", { caption: "Create", width: "150px", height: "100%"}, {onclick: "collectServerBaseInfo"}],
			//spacer361: ["wm.Spacer", {height: "48px", width: "14px"}, {}],
	
			HostListTerminateButton: ["wm.Button", { caption: "Terminate", width: "150px", height: "100%"}, {onclick: "deleteServerClick"}, {
				binding: ["wm.Binding", {}, {}, {
					wire: ["wm.Wire", {"targetProperty":"disabled","source":"HostList.emptySelection"}, {}]
				}]
		    }],
			//spacer385: ["wm.Spacer", {height: "48px", width: "14px"}, {}],
			HostListDepTargetButton: ["wm.Button", { caption: "Add to Deployment Target Table", width: "150px", height: "100%"}, {onclick: "addToDepTargetClick"}, {
				binding: ["wm.Binding", {}, {}, {
					wire: ["wm.Wire", {"targetProperty":"disabled","source":"HostList.emptySelection"}, {}]
				}]
		    }],
			//spacer386: ["wm.Spacer", {height: "48px", width: "14px"}, {}],
			HostListBackButton: ["wm.Button", { caption: "Back to Enter Credentials", width: "150px", height: "100%"}, {onclick: "serverListBackClick"}]		    
		}]
		}]
	    }]
	}]
    }]
};
