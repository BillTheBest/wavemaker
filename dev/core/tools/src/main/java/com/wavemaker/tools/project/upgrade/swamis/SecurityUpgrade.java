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

package com.wavemaker.tools.project.upgrade.swamis;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.JAXBException;

import org.apache.commons.io.FileUtils;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.IOUtils;
import com.wavemaker.tools.common.ConfigurationException;
import com.wavemaker.tools.project.Project;
import com.wavemaker.tools.project.upgrade.UpgradeInfo;
import com.wavemaker.tools.project.upgrade.UpgradeTask;
import com.wavemaker.tools.security.DatabaseOptions;
import com.wavemaker.tools.security.DemoOptions;
import com.wavemaker.tools.security.DemoUser;
import com.wavemaker.tools.security.GeneralOptions;
import com.wavemaker.tools.security.LDAPOptions;
import com.wavemaker.tools.security.SecurityServiceDefinition;
import com.wavemaker.tools.security.SecurityToolsManager;
import com.wavemaker.tools.service.DesignServiceManager;

/**
 * This upgrade task will perform the followings:
 * <li> Delete old securityService and create a new one. </li>
 * <li> Gather security settings from the old project-security.xml and recreate
 * a new one using the existing settings. </li>
 * <li> Rename login.html to login.html.bak and regenerate a new one.</li>
 * 
 * @author ffu
 * @version $Rev$ - $Date$
 * 
 */
public class SecurityUpgrade implements UpgradeTask {

    private DesignServiceManager dsm;

    public DesignServiceManager getDesignServiceManager() {
        return dsm;
    }

    public void setDesignServiceManager(DesignServiceManager dsm) {
        this.dsm = dsm;
    }

    /* (non-Javadoc)
     * @see com.wavemaker.tools.project.upgrade.UpgradeTask#doUpgrade(com.wavemaker.tools.project.Project, com.wavemaker.tools.project.upgrade.UpgradeInfo)
     */
    public void doUpgrade(Project project, UpgradeInfo upgradeInfo) {
        SecurityToolsManager stm = new SecurityToolsManager(dsm
                .getProjectManager(), dsm);
        try {
            // delete old SecurityService
            boolean deleted = deleteSecurityService();
            if (deleted) {
                upgradeInfo.addVerbose("Upgraded " +
                        SecurityServiceDefinition.DEFAULT_SERVICE_ID);
            }
            try {
                // gather security settings from the existing (old)
                // project-security.xml and then use those settings to create a
                // new project-security.xml.
                // This will also add the new SecurityService to the project.
                if (upgradeSpringBeanAndCreateService(stm)) {
                    upgradeInfo.addVerbose("Upgraded project-security.xml");
                }
            } catch (ConfigurationException e) {
                // this usually means user has customized project-security.xml,
                // so just add the new SecurityService to the project.
                if (deleted && !dsm.serviceExists(
                        SecurityServiceDefinition.DEFAULT_SERVICE_ID)) {
                    stm.registerSecurityService();
                }
            }
            // backup old login.html and rename it to login.html.bak, then
            // generate a new login.html
            if (upgradeLoginHtml(project, stm)) {
                upgradeInfo.addVerbose("Renamed existing login.html to login.html.bak and regenerated a new one.");
            }
        } catch (IOException e) {
            throw new WMRuntimeException(e);
        } catch (JAXBException e) {
            throw new WMRuntimeException(e);
        } catch (NoSuchMethodException e) {
            throw new WMRuntimeException(e);
        }
    }
    
    private boolean deleteSecurityService()
            throws IOException, JAXBException, NoSuchMethodException {
        if (dsm.serviceExists(SecurityServiceDefinition.DEFAULT_SERVICE_ID)) {
            dsm.deleteService(SecurityServiceDefinition.DEFAULT_SERVICE_ID);
            return true;
        } else {
            return false;
        }
    }
    
    private boolean upgradeSpringBeanAndCreateService(SecurityToolsManager stm)
            throws JAXBException, IOException {
        File acegiSpringFile = stm.getAcegiSpringFile();
        GeneralOptions generalOptions = stm.getGeneralOptions();
        if (generalOptions == null) {
            return false;
        }
        String dataSourceType = generalOptions.getDataSourceType();
        if (dataSourceType == null) {
            return false;
        }
        if (dataSourceType.equals(GeneralOptions.DEMO_TYPE)) {
            DemoOptions oldDemoOptions = stm.getDemoOptions();
            List<DemoUser> oldDemoUsers = oldDemoOptions.getUsers();
            List<DemoUser> demoUsers = new ArrayList<DemoUser>();
            for (DemoUser oldDemoUser : oldDemoUsers) {
                DemoUser demoUser = new DemoUser();
                demoUser.setUserid(oldDemoUser.getUserid());
                demoUser.setPassword(oldDemoUser.getPassword());
                demoUsers.add(demoUser);
            }

            acegiSpringFile.delete();
            stm.setGeneralOptions(generalOptions.isEnforceSecurity(), true);
            stm.configDemo(demoUsers.toArray(new DemoUser[0]));

        } else if (dataSourceType.equals(GeneralOptions.DATABASE_TYPE)) {
            DatabaseOptions oldDatabaseOptions = stm.getDatabaseOptions();

            acegiSpringFile.delete();
            stm.setGeneralOptions(generalOptions.isEnforceSecurity(), true);
            stm.configDatabase(oldDatabaseOptions.getModelName(),
                    oldDatabaseOptions.getTableName(),
                    oldDatabaseOptions.getUnameColumnName(),
                    oldDatabaseOptions.getUidColumnName(),
                    null,
                    oldDatabaseOptions.getPwColumnName(), null, null);

        } else if (dataSourceType.equals(GeneralOptions.LDAP_TYPE)) {
            LDAPOptions oldLDAPOptions = stm.getLDAPOptions();

            acegiSpringFile.delete();
            stm.setGeneralOptions(generalOptions.isEnforceSecurity(), true);
            stm.configLDAP(oldLDAPOptions.getLdapUrl(),
                    oldLDAPOptions.getManagerDn(),
                    oldLDAPOptions.getManagerPassword(),
                    oldLDAPOptions.getUserDnPattern(), true, null, null, null);
        }
        return true;
    }
    
    private boolean upgradeLoginHtml(Project project, SecurityToolsManager stm)
            throws IOException {
        File webapp = project.getWebAppRoot();
        File loginHtml = new File(webapp, "login.html");
        if (loginHtml.exists()) {
            File loginTemplate = stm.getLoginHtmlTemplateFile();
            if (loginTemplate == null) {
                return false;
            }
            
            IOUtils.copy(loginHtml, new File(webapp, "login.html.bak"));
            String loginContent = FileUtils.readFileToString(loginTemplate,
                    project.getEncoding());
            loginContent = loginContent.replace("{%PROJECT}",
                    project.getProjectName());
            FileUtils.writeStringToFile(loginHtml, loginContent,
                    project.getEncoding());

            return true;
        } else {
            return false;
        }
    }
}
