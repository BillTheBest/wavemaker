/*
 * Copyright (C) 2007-2008 WaveMaker Software, Inc.
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
import java.util.Arrays;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;

import org.apache.commons.io.FileUtils;
import org.apache.tools.ant.types.Resource;
import org.apache.tools.ant.types.resources.FileResource;
import org.apache.tools.ant.types.resources.Resources;

import com.wavemaker.common.util.IOUtils;
import com.wavemaker.json.type.OperationEnumeration;
import com.wavemaker.runtime.service.definition.ReflectServiceDefinition;
import com.wavemaker.runtime.service.definition.ServiceDefinition;
import com.wavemaker.studio.infra.StudioTestCase;
import com.wavemaker.studio.service.TestDesignServiceManager.updateService_SD;
import com.wavemaker.studio.service.TestDesignServiceManager.updateService_SD2;
import com.wavemaker.studio.service.TestDesignServiceManager.updateType_SD;
import com.wavemaker.studio.service.TestDesignServiceManager.updateType_SD2;
import com.wavemaker.tools.ant.ConfigurationCompilerTask;
import com.wavemaker.tools.project.DeploymentManager;
import com.wavemaker.tools.project.Project;
import com.wavemaker.tools.project.ProjectManager;
import com.wavemaker.tools.service.ConfigurationCompiler;
import com.wavemaker.tools.service.DesignServiceManager;
import com.wavemaker.tools.spring.SpringConfigSupport;
import com.wavemaker.tools.spring.beans.Bean;
import com.wavemaker.tools.spring.beans.Beans;
import com.wavemaker.tools.spring.beans.Import;

/**
 * @author small
 * @version $Rev:22688 $ - $Date:2008-05-30 16:38:13 -0700 (Fri, 30 May 2008) $
 *
 */
public class TestConfigurationCompilerTask extends StudioTestCase {

    ProjectManager pm;

    DesignServiceManager dsm;

    DeploymentManager dm;

    JAXBContext jaxbContext;

    Unmarshaller unmarshaller;

    @Override
    public void onSetUp() throws Exception {

        super.onSetUp();

        pm = (ProjectManager) getApplicationContext().getBean("projectManager");
        dsm = (DesignServiceManager) getApplicationContext().getBean(
                "designServiceManager");
        dm = (DeploymentManager) getApplicationContext().getBean(
                "deploymentManager");

        try {
            jaxbContext = JAXBContext
                    .newInstance("com.wavemaker.tools.service.definitions");
            unmarshaller = jaxbContext.createUnmarshaller();
        } catch (JAXBException ex) {
            throw new RuntimeException(ex);
        }
    }

    public void testDMCompile() throws Exception {

        String p = "testBasicWriteConfig";
        makeProject(p, false);
        Project project = pm.getCurrentProject();

        ServiceDefinition sd = new updateService_SD();
        ServiceDefinition sd2 = new updateService_SD2();

        File actual = dsm.getServiceDefXml(sd.getServiceId());
        assertFalse(actual.exists());
        dsm.defineService(sd);
        assertTrue(actual.exists());
        dsm.defineService(sd2);

        Thread.sleep(2000);
        dm.build();

        File actualServices = new File(pm.getCurrentProject().getWebInf(),
                "project-services.xml");
        assertTrue(actualServices.exists());
        long firstMod = actualServices.lastModified();

        File smd_sd = ConfigurationCompiler.getSmdFile(pm.getCurrentProject(),
                sd.getServiceId());
        File smd_sd2 = ConfigurationCompiler.getSmdFile(pm.getCurrentProject(),
                sd2.getServiceId());
        assertTrue(smd_sd+" DNE", smd_sd.exists());
        assertTrue(smd_sd2+" DNE", smd_sd2.exists());
        long smd_sd_created = smd_sd.lastModified();
        long smd_sd2_created = smd_sd2.lastModified();


        Beans actualBeans = SpringConfigSupport.readBeans(actualServices,
                project);

        assertEquals(3, actualBeans.getImportsAndAliasAndBeen().size());
        for (Object o : actualBeans.getImportsAndAliasAndBeen()) {
            if (o instanceof Import) {
                Import imp = (Import) o;

                if (("classpath:"+sd2.getRuntimeConfiguration()).equals(imp.getResource())) {
                    // good
                } else if ("classpath:com/wavemaker/runtime/service/runtimeServiceBean.xml"
                        .equals(imp.getResource())) {
                    // good
                } else if (("classpath:"+DesignServiceManager.getServiceBeanName(sd.getServiceId())).equals(imp.getResource())) {
                    // good
                } else {
                    fail("unknown resource: " + imp.getResource());
                }
            } else if (o instanceof Bean) {
                Bean bean = (Bean) o;

                if ("updateService".equals(bean.getId())) {
                    assertEquals(
                            "com.wavemaker.tools.service.UpdateService_SD",
                            bean.getClazz());
                } else {
                    fail("unknown id: " + bean.getId());
                }
            } else {
                fail("unknown type: " + o);
            }
        }

        File actualManagers = new File(pm.getCurrentProject().getWebInf(),
                "project-managers.xml");
        assertTrue(actualManagers.exists());
        actualBeans = SpringConfigSupport.readBeans(actualManagers, project);

        assertNull(actualBeans.getBeanById("serviceManager"));

        // check non-updated timestamps
        Thread.sleep(2000);
        dm.build();
        assertTrue(actualServices.exists());
        long secondMod = actualServices.lastModified();
        assertEquals(firstMod, secondMod);
        assertEquals(smd_sd_created, smd_sd.lastModified());
        assertEquals(smd_sd2_created, smd_sd2.lastModified());

        // check updated timestamps before & after defineService
        Thread.sleep(2000);
        assertEquals(smd_sd_created, smd_sd.lastModified());
        assertEquals(smd_sd2_created, smd_sd2.lastModified());
        dsm.defineService(sd2);
        assertEquals(smd_sd_created, smd_sd.lastModified());
        assertTrue(smd_sd2_created<smd_sd2.lastModified());     // dsm.defineService() creates/updates the SMD for us
        smd_sd2_created = smd_sd2.lastModified();

        dm.build();
        assertTrue(actualServices.exists());
        long thirdMod = actualServices.lastModified();
        assertTrue(firstMod < thirdMod);
        assertEquals("smd has been modified!", smd_sd_created,
                smd_sd.lastModified());
        assertEquals("smd2 has been modified!",
                smd_sd2_created, smd_sd2.lastModified());

        FileUtils.touch(actual);
        dm.build();
        assertTrue("smd was not modified!",
                smd_sd_created < smd_sd.lastModified());
        assertEquals("smd2 has been modified!",
                smd_sd2_created, smd_sd2.lastModified());
    }

    public void testBasicWriteConfig() throws Exception {

        String p = "testBasicWriteConfig";
        makeProject(p, false);

        ReflectServiceDefinition sd = new updateService_SD();
        ReflectServiceDefinition sd2 = new updateService_SD2();
        assertNull(sd.getRuntimeConfiguration());

        File expected = dsm.getServiceDefXml(sd.getServiceId());
        assertFalse(expected.exists());

        dsm.defineService(sd);
        assertTrue(expected.exists());
        dsm.defineService(sd2);

        Thread.sleep(2000);

        ConfigurationCompilerTask rcgt = new ConfigurationCompilerTask();
        rcgt.setVerbose(true);
        rcgt.setProject(new org.apache.tools.ant.Project());
        rcgt.setProjectRoot(pm.getCurrentProject().getProjectRoot());

        Resource resource = new FileResource(dsm.getServiceDefXml(sd
                .getServiceId()));
        Resource resource2 = new FileResource(dsm.getServiceDefXml(sd2
                .getServiceId()));
        Resources resources = new Resources();
        resources.add(resource);
        resources.add(resource2);
        rcgt.add(resources);
        rcgt.perform();

        File actualServices = ConfigurationCompiler.getRuntimeServicesXml(pm
                .getCurrentProject());
        File actualManagers = ConfigurationCompiler.getRuntimeManagersXml(pm
                .getCurrentProject());
        File actualTypes = ConfigurationCompiler.getTypesFile(pm.
                getCurrentProject());
        assertTrue(actualServices.exists());
        assertTrue(actualManagers.exists());
        assertTrue(actualTypes.exists());

        String servicesStr = FileUtils.readFileToString(actualServices);
        String managersStr = FileUtils.readFileToString(actualManagers);
        String typesStr = FileUtils.readFileToString(actualTypes);

        assertTrue("didn't expect service "+sd.getServiceClass()+
                " in servicesStr:\n"+servicesStr,
                -1 == servicesStr.indexOf(sd.getServiceClass() + "\""));
        assertTrue("servicesStr:\n" + servicesStr, -1 != servicesStr
                .indexOf("classpath:"
                        + DesignServiceManager.getServiceBeanName(sd
                                .getServiceId()) + "\""));
        assertTrue(-1 == servicesStr.indexOf(sd2.getServiceClass() + "\""));
        assertTrue(-1 == servicesStr.indexOf(sd2.getServiceId() + "\""));
        assertTrue(-1 != servicesStr.indexOf("classpath:"
                + sd2.getRuntimeConfiguration() + "\""));

        assertTrue(-1 != managersStr.indexOf(sd.getServiceId()));
        assertTrue(-1 != managersStr.indexOf(sd2.getServiceId()));
        
        assertTrue(typesStr.startsWith("wm.types"));
        
        // test writing smds to alternate directories
        File tempFile = IOUtils.createTempDirectory("alternateSMDDir", ".tmp");
        rcgt.setDestServicesDir(tempFile);
        assertEquals(0, tempFile.list().length);
        
        rcgt.perform();
        String[] files = tempFile.list();
        assertEquals(2, files.length);
        assertTrue(Arrays.asList(files).contains(sd.getServiceId()+".smd"));
    }
    
    public void testWriteTypes() throws Exception {

        String p = "testWriteTypes";
        makeProject(p, false);
        File typesFile = ConfigurationCompiler.getTypesFile(pm.getCurrentProject());
        File managersFile = ConfigurationCompiler.getRuntimeManagersXml(pm
                .getCurrentProject());
        assertFalse(typesFile.exists());

        ServiceDefinition sd = new updateType_SD();
        ServiceDefinition sd2 = new updateType_SD2();

        dsm.defineService(sd);

        Thread.sleep(2000);

        ConfigurationCompilerTask rcgt = new ConfigurationCompilerTask();
        rcgt.setVerbose(true);
        rcgt.setProject(new org.apache.tools.ant.Project());
        rcgt.setProjectRoot(pm.getCurrentProject().getProjectRoot());

        Resource resource = new FileResource(dsm.getServiceDefXml(sd
                .getServiceId()));
        Resources resources = new Resources();
        resources.add(resource);
        rcgt.add(resources);
        rcgt.perform();
        
        assertTrue(typesFile.exists());
        String typesFileContents = FileUtils.readFileToString(typesFile);
        assertTrue(typesFileContents.contains(sd.getLocalTypes().get(0).getTypeName()));
        
        assertTrue(managersFile.exists());
        String managersFileContents = FileUtils.readFileToString(managersFile);
        assertTrue(managersFileContents.contains("\""+sd.getServiceId()+"\""));
        assertFalse(managersFileContents.contains("\""+sd2.getServiceId()+"\""));
        
        Thread.sleep(2000);

        dsm.defineService(sd2);
        
        Resource resource2 = new FileResource(dsm.getServiceDefXml(sd2
                .getServiceId()));
        resources = new Resources();
        resources.add(resource);
        resources.add(resource2);
        rcgt.add(resources);
        rcgt.perform();
        
        assertTrue(managersFile.exists());
        managersFileContents = FileUtils.readFileToString(managersFile);
        assertTrue(managersFileContents.contains("\""+sd.getServiceId()+"\""));
        assertTrue(managersFileContents.contains("\""+sd2.getServiceId()+"\""));
        
        assertTrue(typesFile.exists());
        typesFileContents = FileUtils.readFileToString(typesFile);
        assertTrue(typesFileContents.contains(sd.getLocalTypes().get(0).getTypeName()));
        assertTrue(typesFileContents.contains(sd2.getLocalTypes().get(0).getTypeName()));
        assertTrue(typesFileContents.contains(OperationEnumeration.read.value()));
    }
    
    public void testOnlyThroughTask() throws Exception {

        String managersFileContents;
        String typesFileContents;
        File typesFile;
        File managersFile;
        
        String p = "testOnlyThroughTask_First";
        makeProject(p, false);
        Project oldProject = pm.getCurrentProject();

        ServiceDefinition sd = new updateType_SD();
        ServiceDefinition sd2 = new updateType_SD2();

        dsm.defineService(sd);
        dsm.defineService(sd2);

        Thread.sleep(2000);
        
        String p2 = "testOnlyThroughTask";
        makeProject(p2, false);

        ConfigurationCompilerTask rcgt = new ConfigurationCompilerTask();
        rcgt.setVerbose(true);
        rcgt.setProject(new org.apache.tools.ant.Project());
        rcgt.setProjectRoot(pm.getCurrentProject().getProjectRoot());
        Resources resources = new Resources();
        rcgt.add(resources);
        rcgt.perform();
        
        
        typesFile = ConfigurationCompiler.getTypesFile(pm.getCurrentProject());
        managersFile = ConfigurationCompiler.getRuntimeManagersXml(pm
                .getCurrentProject());
        assertTrue(typesFile.exists());
        assertTrue(managersFile.exists());
        
        managersFileContents = FileUtils.readFileToString(managersFile);
        typesFileContents = FileUtils.readFileToString(typesFile);
        assertFalse(managersFileContents.contains("\""+sd.getServiceId()+"\""));
        assertFalse(managersFileContents.contains("\""+sd2.getServiceId()+"\""));
        assertFalse(typesFileContents.contains("\""+sd.getLocalTypes().get(0).getTypeName()+"\""));
        assertFalse(typesFileContents.contains("\""+sd2.getLocalTypes().get(0).getTypeName()+"\""));
        
        // copy in a service
        File sourceFile = new File(new File(oldProject.getProjectRoot(),
                DesignServiceManager.getServicesRelativeDir()), sd
                .getServiceId());
        File destServicesFile = new File(pm.getCurrentProject()
                .getProjectRoot(), DesignServiceManager
                .getServicesRelativeDir());
        destServicesFile.mkdir();
        FileUtils.copyDirectoryToDirectory(sourceFile, destServicesFile);
        

        Resource resource = new FileResource(dsm.getServiceDefXml(sd
                .getServiceId()));
        resources = new Resources();
        resources.add(resource);
        rcgt.add(resources);
        rcgt.perform();
        
        managersFileContents = FileUtils.readFileToString(managersFile);
        typesFileContents = FileUtils.readFileToString(typesFile);
        assertTrue(managersFileContents.contains("\""+sd.getServiceId()+"\""));
        assertFalse(managersFileContents.contains("\""+sd2.getServiceId()+"\""));
        assertTrue(typesFileContents.contains("\""+sd.getLocalTypes().get(0).getTypeName()+"\""));
        assertFalse(typesFileContents.contains("\""+sd2.getLocalTypes().get(0).getTypeName()+"\""));
        
        // copy in another service
        sourceFile = new File(new File(oldProject.getProjectRoot(),
                DesignServiceManager.getServicesRelativeDir()), sd2
                .getServiceId());
        destServicesFile.mkdir();
        FileUtils.copyDirectoryToDirectory(sourceFile, destServicesFile);
        

        Resource resource2 = new FileResource(dsm.getServiceDefXml(sd2
                .getServiceId()));
        resources = new Resources();
        resources.add(resource);
        resources.add(resource2);
        rcgt.add(resources);
        rcgt.perform();
        
        managersFileContents = FileUtils.readFileToString(managersFile);
        typesFileContents = FileUtils.readFileToString(typesFile);
        assertTrue(managersFileContents.contains("\""+sd.getServiceId()+"\""));
        assertTrue(managersFileContents.contains("\""+sd2.getServiceId()+"\""));
        assertTrue(typesFileContents.contains("\""+sd.getLocalTypes().get(0).getTypeName()+"\""));
        assertTrue(typesFileContents.contains("\""+sd2.getLocalTypes().get(0).getTypeName()+"\""));
    }
}
