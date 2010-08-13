/*
 * Copyright (C) 2008 WaveMaker Software, Inc.
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
package com.wavemaker.studio.ant;


import java.io.File;

import org.apache.commons.io.FileUtils;
import org.apache.tools.ant.Project;

import com.wavemaker.studio.infra.StudioTestCase;
import com.wavemaker.tools.ant.ServiceDefCompilerTask;
import com.wavemaker.tools.project.DeploymentManager;
import com.wavemaker.tools.project.ProjectManager;
import com.wavemaker.tools.service.DesignServiceManager;
import com.wavemaker.tools.service.definitions.Operation;
import com.wavemaker.tools.service.definitions.Service;
import com.wavemaker.tools.service.definitions.Operation.Parameter;
import com.wavemaker.tools.util.DesignTimeUtils;

/**
 * @author small
 * @version $Rev$ - $Date:2008-05-30 16:38:13 -0700 (Fri, 30 May 2008) $
 *
 */
public class TestServiceDefCompilerTask extends StudioTestCase {


    ProjectManager pm;
    DeploymentManager dm;

    @Override
    public void onSetUp() throws Exception {
        
        super.onSetUp();

        pm = (ProjectManager) getApplicationContext().getBean("projectManager");
        dm = (DeploymentManager) getApplicationContext().getBean(
                "deploymentManager");
    }

    public void testCreateServiceDef() throws Exception {

        makeProject("testCreateServiceDef", false);
        String serviceId = "serviceA";
        File projectRoot = pm.getCurrentProject().getProjectRoot();



        File serviceASrc = new File(projectRoot,
                DesignServiceManager.getRuntimeRelativeDir(serviceId));
        File javaSrc = new File(serviceASrc, "Foo.java");
        FileUtils.forceMkdir(serviceASrc);
        FileUtils.writeStringToFile(javaSrc,
                "public class Foo{public int getInt(){return 12;}}");

        File classesDir = pm.getCurrentProject().getWebInfClasses();
        FileUtils.forceMkdir(classesDir);

        dm.build();


        File serviceDesignDir = new File(projectRoot,
                DesignServiceManager.getDesigntimeRelativeDir(serviceId));
        assertFalse(serviceDesignDir.exists());

        ServiceDefCompilerTask sdct = new ServiceDefCompilerTask();
        sdct.setProject(new Project());
        sdct.addService(new ServiceDefCompilerTask.NestedService(serviceId));
        sdct.setProjectRoot(projectRoot);
        sdct.perform();

        assertTrue(serviceDesignDir.exists());

        DesignServiceManager localDSM = DesignTimeUtils.getDSMForProjectRoot(
                projectRoot);
        Service service = localDSM.getService(serviceId);
        assertEquals("Foo", service.getClazz());
        assertEquals(1, service.getOperation().size());


        Thread.sleep(2000);
        FileUtils.writeStringToFile(javaSrc,
                "public class Foo{public int getInt(){return 12;}\n"+
                "\tpublic int getInt2(){return 13;}\n}");
        dm.build();

        sdct.perform();
        localDSM = DesignTimeUtils.getDSMForProjectRoot(
                projectRoot);
        service = localDSM.getService(serviceId);
        assertEquals("Foo", service.getClazz());
        assertEquals(2, service.getOperation().size());
        

        // test arrays
        Thread.sleep(2000);
        FileUtils.writeStringToFile(javaSrc,
                "public class Foo{public int getInt(){return 12;}\n"+
                "\tpublic int getInt2(Integer[] ints){return 13+ints[0];}\n}");
        dm.build();

        sdct.perform();
        localDSM = DesignTimeUtils.getDSMForProjectRoot(
                projectRoot);
        service = localDSM.getService(serviceId);
        assertEquals("Foo", service.getClazz());
        assertEquals(2, service.getOperation().size());
        
        boolean foundGetInt2 = false;
        for (Operation op: service.getOperation()) {
            if (op.getName().equals("getInt2")) {
                foundGetInt2 = true;
                
                assertEquals(1, op.getParameter().size());
                Parameter param = op.getParameter().get(0);
                assertTrue(param.isIsList());
                assertEquals("java.lang.Integer", param.getTypeRef());
            }
        }
        assertTrue(""+service.getOperation(), foundGetInt2);
    }
}