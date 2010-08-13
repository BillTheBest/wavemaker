/*
 *  Copyright (C) 2008-2010 WaveMaker Software, Inc.
 *
 *  This file is part of the WaveMaker Client Runtime.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
dojo.provide("wm.base.components.ServiceVariable");
dojo.require("wm.base.components.Variable");
dojo.require("wm.base.components.ServiceCall");


//===========================================================================
// Main service calling class: calls services with input data and returns data
//===========================================================================
/**
	Main service calling class: calls services with input data and returns data
	@name wm.ServiceVariable
	@class
	@extends wm.Variable
	@extends wm.ServiceCall
*/
dojo.declare("wm.ServiceVariable", [wm.Variable, wm.ServiceCall], {
	total: 0,
	_page: 0,
	/** Maximum number of results to return */
	maxResults: 0,
	designMaxResults: 50,
	processResult: function(inResult) {
		this.setData(inResult);
		this.inherited(arguments);
	},
	getTotal: function() {
		return this.total || this.getCount();
	},
	getPageCount: function() {
		return Math.ceil(this.getTotal() / (this.getCount() || 1));
	},
	setPage: function(inPage) {
		this._page = Math.max(0, Math.min(this.getPageCount() - 1, inPage));
		this.firstRow = this._page * this.maxResults;
		this.update();
	},
	getPage: function() {
		return this._page;
	},
	setFirstPage: function() {
		this.setPage(0);
	},
	setPreviousPage: function() {
		this.setPage(this._page-1);
	},
	setNextPage: function() {
		this.setPage(this._page+1);
	},
	setLastPage: function() {
		this.setPage(this.getPageCount());
	},
	operationChanged: function() {
		this.inherited(arguments);
		// output has named type matching operation returnType
		var op = this._operationInfo;
		if (op)
			this.setType(op.returnType);
		if ((this.autoUpdate || this.startUpdate) && !this._loading && this.isDesignLoaded()) {
		  this.update();
		}
	}
});

wm.Object.extendSchema(wm.ServiceVariable, {
	operation: { group: "common", order: 24},
	clearInput: { group: "operation", order: 30},
	onSetData: {ignore: 1},
        onCanUpdate: {events: ["js", "sharedjs", "sharedEventHandlers"]},
	input: { ignore: 1 , writeonly: 1, componentonly: 1, categoryParent: "Properties", categoryProps: {component: "input", bindToComponent: true, inspector: "Data"}},
	service: {group: "common", order: 23 },
	autoUpdate: {group: "common", order: 25},
	startUpdate: {group: "common", order: 26},
	maxResults: {group: "data", order: 17},
	designMaxResults: {group: "data", order: 18},
	updateNow: { group: "operation", order: 10},
	queue: { group: "operation", order: 20},
	json: {ignore: 1},
	listType: {ignore: 1},
	isList: {ignore: 1},
	// binding inherited from Variable, keep it and write it but don't show it
	// potentially needed for source bindings.
	binding: {ignore: 1, writeonly: 1},
	type: { ignore: 1 },
	dataSet: { ignore: 1, defaultBindTarget: 1, isObject: true, type: "any"},
	startUpdateComplete: { ignore: 1},
	total: {ignore: 1}
});


wm.ServiceVariable.description = "Data from a service.";

/**#@+ @design */
wm.ServiceVariable.extend({
	/** @lends wm.ServiceVariable.prototype */
});
/**#@- @design */
