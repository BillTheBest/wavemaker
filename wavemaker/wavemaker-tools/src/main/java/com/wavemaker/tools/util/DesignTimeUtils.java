/*
 *  Copyright (C) 2007-2012 VMware, Inc. All rights reserved.
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

package com.wavemaker.tools.util;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Map;
import java.util.Properties;

import javax.xml.bind.JAXBException;

import org.springframework.context.support.ClassPathXmlApplicationContext;

import com.wavemaker.runtime.RuntimeAccess;
import com.wavemaker.tools.common.ConfigurationException;
import com.wavemaker.tools.io.Folder;
import com.wavemaker.tools.io.local.LocalFolder;
import com.wavemaker.tools.project.AbstractStudioFileSystem;
import com.wavemaker.tools.project.LocalDeploymentManager;
import com.wavemaker.tools.project.LocalStudioFileSystem;
import com.wavemaker.tools.project.Project;
import com.wavemaker.tools.project.ProjectManager;
import com.wavemaker.tools.service.DesignServiceManager;
import com.wavemaker.tools.service.DesignServiceType;

/**
 * @author Simon Toens
 * @author Jeremy Grelle
 */
public class DesignTimeUtils {

    private DesignTimeUtils() {
    }

    private static String getDefaultProjectHome() {
        String home;
        if (isRuntime()) {
            home = (String) RuntimeAccess.getInstance().getSession().getAttribute(AbstractStudioFileSystem.PROJECTHOME_PROP_KEY);
        } else {
            home = System.getProperty(AbstractStudioFileSystem.PROJECTHOME_PROP_KEY);
        }
        return home;
    }

    private static void setDefaultProjectHome(String home) {
        if (isRuntime()) {
            RuntimeAccess.getInstance().getSession().setAttribute(AbstractStudioFileSystem.PROJECTHOME_PROP_KEY, home);
        } else {
            System.setProperty(AbstractStudioFileSystem.PROJECTHOME_PROP_KEY, home);
        }
    }

    private static void deleteDefaultProjectHomeProp() {
        if (isRuntime()) {
            RuntimeAccess.getInstance().getSession().removeAttribute(AbstractStudioFileSystem.PROJECTHOME_PROP_KEY);
        } else {
            Properties props = System.getProperties();
            props.remove(AbstractStudioFileSystem.PROJECTHOME_PROP_KEY);
            System.setProperties(props);
        }
    }

    private static boolean isRuntime() {
        try {
            if (RuntimeAccess.getInstance() != null && RuntimeAccess.getInstance().getRequest() != null) {
                return true;
            }
        } catch (Exception e) {
        }
        return false;
    }

    /**
     * Return a DesignServiceManager instance. This may not be very fast, so should be avoided when possible.
     * 
     * @param project
     * @return DesignServiceManager instance
     */
    public static DesignServiceManager getDesignServiceManager(Project project) {
        return getDSMForProjectRoot(project.getRootFolder());
    }

    /**
     * Return a DesignServiceManager instance; this sets up an internal ProjectManager, and creates a Project based on
     * the projectRoot parameter. This may not be very fast, so should be avoided when possible.
     * 
     * @param projectRoot
     * @return DesignServiceManager instance
     */
    public static DesignServiceManager getDSMForProjectRoot(Folder projectRoot) {
        try {
            String oldProp = getDefaultProjectHome();

            try {
                // override configuration
                setDefaultProjectHome(new File(((LocalFolder) projectRoot).getLocalFile().getAbsolutePath()).getParentFile().getAbsolutePath());

                DesignServiceManager dsm = new DesignServiceManager();

                // get out our DesignServiceType configuration
                ClassPathXmlApplicationContext ac = new ClassPathXmlApplicationContext(new String[] { "springapp.xml", "designservicetypes.xml",
                    "servicetypes.xml" });
                Map<?, ?> dsts = ac.getBeansOfType(DesignServiceType.class);

                dsm.setDesignServiceTypes(new ArrayList<DesignServiceType>());
                for (Object o : dsts.values()) {
                    dsm.getDesignServiceTypes().add((DesignServiceType) o);
                }

                LocalStudioFileSystem sf = new LocalStudioFileSystem();
                sf.setTestWaveMakerHome((LocalFolder) projectRoot.getParent());

                ProjectManager pm = new ProjectManager();
                pm.setFileSystem(sf);
                pm.openProject(((LocalFolder) projectRoot).getLocalFile().getName(), true);
                dsm.setProjectManager(pm);

                LocalDeploymentManager dep = new LocalDeploymentManager();
                dep.setProjectManager(pm);
                dep.setFileSystem(sf);
                dsm.setFileSystem(sf);
                dsm.setDeploymentManager(dep);

                return dsm;
            } finally {
                if (oldProp != null) {
                    setDefaultProjectHome(oldProp);
                } else {
                    deleteDefaultProjectHomeProp();
                }
            }
        } catch (JAXBException ex) {
            throw new ConfigurationException(ex);
        } catch (IOException ex) {
            throw new ConfigurationException(ex);
        }
    }
}