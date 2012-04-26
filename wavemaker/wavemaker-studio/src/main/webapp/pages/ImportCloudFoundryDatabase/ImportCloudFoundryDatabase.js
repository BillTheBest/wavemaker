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
 

dojo.provide("wm.studio.pages.ImportCloudFoundryDatabase.ImportCloudFoundryDatabase");

dojo.declare("ImportCloudFoundryDatabase", wm.Page, {
    i18n: true,
    
    start: function() {
	this.update();
    },
    onShow: function() {
	this.update();
    },
    update: function(inImportDataModel) {
	this.cloudFoundryService.requestAsync("listDatabaseServices", ["","http://api.mkantor.cloudfoundry.me"],
					      dojo.hitch(this, function(inResult) {
						  this.populateCloudFoundryAppList(inResult);
					      }),
					      dojo.hitch(this, function(inError) {
						  app.alert(inError);
					      }));	
    },
	cancelBtnClick: function(inSender) {
	    this.owner.owner.hide();
	},
    populateCloudFoundryAppList: function(inResult) {
	debugger;
	this.serviceListVar.setData(inResult);
    },
	importBtnClick: function(inSender) {
	    this.dataModelName = null;
	    studio.beginWait(this.getDictionaryItem("WAIT_IMPORTING"));
	    studio.dataService.requestAsync(IMPORT_DB_OP,
					[this.serviceNameInput.getDataValue(),
					this.packageInput.getDataValue(),
					this.usernameInput.getDataValue(),
					this.passwordInput.getDataValue(),
					this.connectionUrlInput.getDataValue(),
					this.tablePatternInput.getDataValue(),
					this.schemaPatternInput.getDataValue(),
					this.driverClassInput.getDataValue(),
					this.dialectInput.getDataValue(),
					 this.revengNamingStrategyInput.getDataValue(),
					 this.executeAsMenu.getDataValue() == "Logged in user",
					 this.activeDirectoryDomain.getDataValue()],
					dojo.hitch(this, "_importResult"), 
					dojo.hitch(this, "_importError"));
	},
	_importResult: function() {
	    studio.endWait();
	    this.dataModelName = this.serviceNameInput.getDataValue();
	    studio.updateServices();
	    this.owner.owner.hide();
	},
	_importError: function(inError) {
		studio.endWait();
		var msg = "";
		if (inError.message) {
		    msg = ": " + inError.message;
		}
	    app.alert(this.getDictionaryItem("ALERT_IMPORT_FAILED", {error: inError.message}));
	    app.alertDialog.setWidth("600px");
	},





  _end: 0
});
