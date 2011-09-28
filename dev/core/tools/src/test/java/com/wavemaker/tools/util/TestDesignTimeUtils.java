/*
 *  Copyright (C) 2008-2009 WaveMaker Software, Inc.
 *
 *  This file is part of the WaveMaker Server Runtime.
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
package com.wavemaker.tools.util;

import org.springframework.core.io.Resource;

import com.wavemaker.infra.WMTestCase;
import com.wavemaker.tools.project.LocalStudioConfiguration;
import com.wavemaker.tools.service.DesignServiceManager;

/**
 * @author small
 * @version $Rev$ - $Date$
 *
 */
public class TestDesignTimeUtils extends WMTestCase {

    public void testGetDSM() throws Exception {
        
        Resource tempDir = new LocalStudioConfiguration().createTempDir();
        assertTrue(tempDir.exists());
        
        DesignServiceManager dsm = DesignTimeUtils.getDSMForProjectRoot(tempDir);
        assertEquals(tempDir.getURI(), dsm.getProjectManager().getCurrentProject().getProjectRoot().getURI());
        assertNotNull(dsm.getDesignServiceTypes());
        assertTrue(dsm.getDesignServiceTypes().size() >= 3);
    }
}