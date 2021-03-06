/*
 *  Copyright (C) 2012 VMware, Inc. All rights reserved.
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
dojo.provide("wm.base.components.NavigationService_design");
dojo.require("wm.base.components.NavigationService");

wm.Object.extendSchema(wm.NavigationCall,{
    owner: {ignoreHint: "Owner only available for some types of operations"},
	autoUpdate: {ignore: 1},
        startUpdateComplete: { ignore: 1},
	startUpdate: {ignore: 1},
	service: {ignore: 1, writeonly: 1},
    name: {requiredGroup: 0}, // hide the required group; too few properties to justify it
    operation: { group: "widgetName", order: 1},
	updateNow: { ignore: 1},
    queue: { group: "operation", operation:1, order: 20},
    clearInput: { group: "operation", operation:1, order: 30},
    input: {group: "widgetName", order: 3, putWiresInSubcomponent: "input", bindTarget: 1, treeBindField: true, editor: "wm.prop.NavigationGroupEditor"},
    inFlightBehavior: {ignore:1}
});

// design only...
/**#@+ @design */
wm.NavigationCall.extend({
	listProperties: function() {
		var result = this.inherited(arguments);
		result.owner.ignoretmp = (this.operation == "gotoPage" || this.operation == "gotoDialogPage") ? 0 : 1;
		return result;
	},
	operationChanged: function() {
		this.inherited(arguments);
	    if (this.isDesignLoaded() && this.owner instanceof wm.Application && this.operation != "gotoPage" && this.operation != "gotoDialogPage" && studio.page) {
			this.set_owner("Page");
		}
	}

});
/**#@- @design */

wm.NavigationCall.description = "Navigation service call.";
