/*
 *  Copyright (C) 2008-2011 WaveMaker Software, Inc.
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
dojo.provide("wm.base.Plugin");

wm.Plugin = {
	targetClass: null,
	callerFactory: function(inOverrides) {
		return function(inArgs, inNewArgs) {
			var fn = inOverrides[inArgs.callee.nom];
			if (fn)
				return fn.apply(this, inNewArgs || inArgs || []);
		}
	},
	plugin: function(inName, inClass, inProps) {
		var overrides = [];
		for (var p in inProps) {
			if (dojo.isFunction(inProps[p]) && inClass.prototype[p])
				overrides[p] = inClass.prototype[p];
		}
		inProps[inName + 'Socket'] = this.callerFactory(overrides);
		inClass.extend(inProps);
	}
}
