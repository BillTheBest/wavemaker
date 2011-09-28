/*
 *  Copyright (C) 2009-2011 VMWare, Inc. All rights reserved.
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

package com.wavemaker.tools.project.upgrade.five_dot_zero;

import java.io.IOException;

import org.springframework.core.io.Resource;
import org.springframework.util.FileCopyUtils;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.tools.project.StudioConfiguration;
import com.wavemaker.tools.project.upgrade.StudioUpgradeTask;
import com.wavemaker.tools.project.upgrade.UpgradeInfo;

/**
 * @author small
 * @author Jeremy Grelle
 * 
 */
public class AddManifestToCommonStudioUpgradeTask implements StudioUpgradeTask {

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.wavemaker.tools.project.upgrade.StudioUpgradeTask#doUpgrade(com.wavemaker
	 * .tools.project.upgrade.UpgradeInfo)
	 */
	public void doUpgrade(UpgradeInfo upgradeInfo) {

		try {
			Resource commonDir = studioConfiguration.getCommonDir();
			Resource userManifest = commonDir.createRelative("manifest.js");

			if (commonDir.exists() && !userManifest.exists()) {
				Resource templateManifest = studioConfiguration
						.getStudioWebAppRoot().createRelative(
								"lib/wm/common/manifest.js");
				FileCopyUtils.copy(templateManifest.getInputStream(),
						studioConfiguration.getOutputStream(userManifest));
			}
		} catch (IOException e) {
			throw new WMRuntimeException(e);
		}
	}

	private StudioConfiguration studioConfiguration;

	public StudioConfiguration getStudioConfiguration() {
		return studioConfiguration;
	}

	public void setStudioConfiguration(StudioConfiguration studioConfiguration) {
		this.studioConfiguration = studioConfiguration;
	}
}