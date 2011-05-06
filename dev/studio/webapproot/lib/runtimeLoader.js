/*
 *  Copyright (C) 2008-2011 VMWare, Inc. All rights reserved.
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


try
{

        wm.libPath = wm.libPath.replace(/\/$/,""); // please remove this after we've gotten a few versions past 6.2

	dojo.registerModulePath("lib", wm.libPath);
	wm.registerPaths(
		["wm", wm.libPath + "/wm"],
		["wm.packages", wm.libPath + "/wm/common/packages"],
		["common", wm.libPath + "/wm/common"],
	    ["wm.modules", wm.basePath + "modules/ep"],
	    ["wm.language", wm.libPath + "/wm/language"],
	    ["language", window.location.pathname.replace(/[^\/]*$/,"language")]
	);	

	    wm.locale = {};
	    dojo.requireLocalization("wm.language", "components");
	    wm.locale.phrases = dojo.i18n.getLocalization("wm.language", "components");
	    
	    dojo.requireLocalization("wm.language", "properties");
	    wm.locale.props = dojo.i18n.getLocalization("wm.language", "properties");


	// Load minified built version of libraries when not booting in debug mode
	if (!djConfig.debugBoot) 
	{
		// Register paths for compressed parts of dojo
		dojo.registerModulePath("dojo.nls", wm.libPath + "/build/nls");
	    //dojo.registerModulePath("dijit.themes.tundra", wm.libPath + "build/themes/tundra");
		dojo.registerModulePath("build", wm.libPath + "/build");

	    dojo.require("build.Gzipped.lib_build", true);	
		//dojo.require("build.lib_build_uncompressed", true);	
		// START: The comments here are for debugging in non-debug mode. Please do not remove these comments
		//dojo.require("build.lib_build_uncompressed", true);
		//wm.writeJsTag(wm.relativeLibPath + '/build/lib_build_uncompressed.js');
		// END: The comments here are for debugging in non-debug mode. Please do not remove these comments
  
		/*
		dojo.require("build.Gzipped.wm_dojo_grid", true);
		dojo.require("build.Gzipped.wm_editors", true);
	dojo.require("build.Gzipped.wm_editors_old", true);
		dojo.require("build.Gzipped.wm_richTextEditor", true);
		dojo.require("build.Gzipped.wm_livepanel", true);
		dojo.require("build.Gzipped.wm_menus", true);
		dojo.require("build.Gzipped.wm_charts", true);
		dojo.require("build.Gzipped.wm_gadgets", true);
		*/


		dojo.require("lib.runtime_manifest", true);

	}
	else
	{
		// Load lib manifest, ensuring anything not included in build will be loaded explicitly
		dojo.require("lib.manifest", true);
	}


}
catch (e)
{
	console.info('error while loading runtime_loader.js file: ' + e.message);
}
