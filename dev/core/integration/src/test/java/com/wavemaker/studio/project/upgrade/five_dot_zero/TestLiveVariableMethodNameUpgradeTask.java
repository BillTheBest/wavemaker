/*
 * Copyright (C) 2009 WaveMaker Software, Inc.
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
package com.wavemaker.studio.project.upgrade.five_dot_zero;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.util.List;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang.StringUtils;
import org.junit.Test;
import org.springframework.core.io.ClassPathResource;

import com.wavemaker.studio.infra.StudioTestCase;
import com.wavemaker.tools.project.PagesManager;
import com.wavemaker.tools.project.Project;
import com.wavemaker.tools.project.ProjectManager;
import com.wavemaker.tools.project.upgrade.UpgradeInfo;
import com.wavemaker.tools.project.upgrade.UpgradeManager;
import com.wavemaker.tools.project.upgrade.UpgradeTask;
import com.wavemaker.tools.project.upgrade.five_dot_zero.LiveVariableMethodNameUpgradeTask;

/**
 * @author small
 * @author Jeremy Grelle
 * 
 */
public class TestLiveVariableMethodNameUpgradeTask extends StudioTestCase {

	@Test
	public void testChangeInsertDataToInsert() throws Exception {

		String projectName = "testChangeInsertDataToInsert";

		makeProject(projectName, false);
		ProjectManager pm = (ProjectManager) getBean("projectManager");
		Project project = pm.getCurrentProject();

		File webapproot = new File(project.getProjectRoot().getFile(),
				"webapproot");
		assertTrue(webapproot.exists());
		File pagesdir = new File(webapproot, "pages");
		pagesdir.mkdir();

		File autosizeFiles = (new ClassPathResource(
				"com/wavemaker/studio/project/upgrade/five_dot_zero/livevariablemethodname.files"))
				.getFile();
		File inputLogin = new File(autosizeFiles, "input/Main");
		assertTrue(inputLogin.exists());

		File main = new File(pagesdir, "Main");
		FileUtils.copyDirectory(inputLogin, main);

		LiveVariableMethodNameUpgradeTask ut = new LiveVariableMethodNameUpgradeTask();
		ut.setPagesManager((PagesManager) getBean("pagesManager"));
		UpgradeInfo info = new UpgradeInfo();
		ut.doUpgrade(project, info);

		File expectedLogin = new File(autosizeFiles, "expected/Main");
		assertEquals(1, expectedLogin.listFiles().length);
		boolean gotWidgetsJS = false;
		for (File file : expectedLogin.listFiles()) {
			File inputFile = new File(main, file.getName());
			if (inputFile.getName().endsWith(".widgets.js")) {
				gotWidgetsJS = true;
			}

			assertEquals(StringUtils.deleteWhitespace(FileUtils
					.readFileToString(file)),
					StringUtils.deleteWhitespace(FileUtils
							.readFileToString(inputFile)));
		}
		assertTrue(gotWidgetsJS);
	}

	@Test
	public void testUpgradeTaskPresent() throws Exception {

		boolean foundTask = false;

		UpgradeManager um = (UpgradeManager) getBean("upgradeManager");

		outer: for (List<UpgradeTask> uts : um.getUpgrades().values()) {
			for (UpgradeTask ut : uts) {
				if (ut instanceof LiveVariableMethodNameUpgradeTask) {
					foundTask = true;
					break outer;
				}
			}
		}

		assertTrue(foundTask);
	}
}