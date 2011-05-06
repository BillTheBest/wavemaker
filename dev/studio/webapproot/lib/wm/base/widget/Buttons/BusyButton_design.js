/*
 *  Copyright (C) 2011 VMWare, Inc. All rights reserved.
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

dojo.provide("wm.base.widget.Buttons.BusyButton_design");
dojo.require("wm.base.widget.Buttons.BusyButton");

wm.Object.extendSchema(wm.BusyButton, {
      iconUrl: {ignore: 1},
	    clickVariable:  {group: "BusyButton", bindTarget: 1, order: 29, type: "wm.ServiceVariable", readonly: true},
    defaultIconUrl: {group: "BusyButton", bindable: true, order: 30, type: "String", subtype: "File"},
      iconLoadingUrl: {group: "BusyButton", bindable: true, order: 31, type: "String", subtype: "File"},
      iconSuccessUrl: {group: "BusyButton", bindable: true, order: 32, type: "String", subtype: "File"},
      iconErrorUrl:   {group: "BusyButton", bindable: true, order: 33, type: "String", subtype: "File"},
    iconWidth:      {group: "BusyButton", order: 34},
      iconHeight:      {group: "BusyButton", order: 35},
      iconMargin:      {group: "BusyButton", order: 36},
      imageList: {ignore: 1},
      imageIndex: {ignore: 1},
    editImageIndex: {ignore: 1}
});

wm.BusyButton.extend({
	set_clickVariable: function(inVar) {
		// support setting dataSet via id from designer
		if (inVar && !(inVar instanceof wm.ServiceVariable)) {
			var ds = this.getValueById(inVar);
			if (ds)
				this.components.binding.addWire("", "clickVariable", ds.getId());
		} else
		    this.setClickVariable(inVar);
	},

	makePropEdit: function(inName, inValue, inDefault) {
		switch (inName) {
			case "clickVariable":
			    return new wm.propEdit.DataSetSelect({component: this, name: inName, value: this.clickVariable ? this.clickVariable.getId() : "" , allowAllTypes: true});
		}
		return this.inherited(arguments);
	}
});

wm.BusyButton.description = "A button that indicates when its ServiceVariable/LiveVariable is processing the button's action";
