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

package com.wavemaker.tools.project;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.PrintStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpSessionBindingEvent;
import javax.servlet.http.HttpSessionBindingListener;

import org.apache.log4j.Logger;
import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.BuildListener;
import org.apache.tools.ant.DefaultLogger;
import org.apache.tools.ant.Project;
import org.apache.tools.ant.ProjectHelper;
import org.springframework.core.io.Resource;

import com.sun.xml.bind.marshaller.NamespacePrefixMapper;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.IOUtils;
import com.wavemaker.runtime.RuntimeAccess;
import com.wavemaker.tools.io.local.LocalFile;
import com.wavemaker.tools.io.local.LocalFolder;

/**
 * Main deployment class.
 * 
 * @author Joel Hare
 * @author Jeremy Grelle
 */
public class LocalDeploymentManager extends AbstractDeploymentManager {

    static Logger logger = Logger.getLogger(LocalDeploymentManager.class);

    // ant properties
    private static final String PROJECT_DIR_PROPERTY = "project.dir";

    private static final String PROJECT_NAME_PROPERTY = "project.name";

    private static final String PROJECT_ENCODING_PROPERTY = "project.encoding";

    private static final String TOMCAT_HOST_PROPERTY = "tomcat.host";

    private static final String TOMCAT_PORT_PROPERTY = "tomcat.port";

    private static final String DEPLOY_NAME_PROPERTY = "deploy.name";

    private static final String STUDIO_WEBAPPROOT_PROPERTY = "studio.webapproot.dir";

    private static final String WAR_FILE_NAME_PROPERTY = "war.file.name";

    private static final String EAR_FILE_NAME_PROPERTY = "ear.file.name";

    public static final String CUSTOM_WM_DIR_NAME_PROPERTY = "custom.wm.dir";

    private static final String BUILD_WEBAPPROOT_PROPERTY = "build.app.webapproot.dir";

    private static final String WAVEMAKER_HOME = "wavemaker.home";

    private static final String BUILD_RESOURCE_NAME = "app-deploy.xml";

    // targets

    private static final String TEST_RUN_CLEAN_OPERATION = "testrunclean";

    private static final String UNDEPLOY_OPERATION = "undeploy";

    private static final String BUILD_OPERATION = "build";

    private static final String BUILD_WAR_OPERATION = "build-war";

    private static final String BUILD_EAR_OPERATION = "build-ear";

    private static final String GEN_RTFILES_OPERATION = "generate-runtime-files";

    private static final String COPY_JARS_OPERATION = "copy-jars";

    private static final String CLEAN_OPERATION = "clean";

    private static final String TEST_RUN_START_PREP_OPERATION = "testrunstart-prep";

    private static final String TEST_RUN_START_TEMP_OPERATION = "testrunstart-temp";

    public class Undeployer implements HttpSessionBindingListener {

        private String projectName;

        @Override
        public void valueBound(HttpSessionBindingEvent event) {
            this.projectName = getDeployName();
            LocalDeploymentManager.logger.info("SESSION BOUND " + this.projectName + "!!!!!!!!!!!!!!!");
        }

        @Override
        public void valueUnbound(HttpSessionBindingEvent event) {
            // Lines are commented out because an attempt to undeploy the
            // current project will cause the Studio
            // to hang. Now, undeploy is done in Launcher.
            // logger.info("SESSION UNBOUND!!!!!!!!!!!!!!!" + projectName);
            // mAnt.executeTarget(UNDEPLOY_OPERATION);
            // logger.info("Undeployed executed it seems");
        }
    }

    private LocalFolder getProjectDir(com.wavemaker.tools.project.Project project) {
        return (LocalFolder) project.getRootFolder();
    }

    private LocalFolder getProjectDir() {
        com.wavemaker.tools.project.Project currentProject = getProjectManager().getCurrentProject();
        if (currentProject == null) {
            throw new WMRuntimeException("Current project must be set");
        }
        return getProjectDir(currentProject);
    }

    private String testRunStart(String projectDir, String deployName) {

        // this method for some reason is how we add the listener
        javax.servlet.http.HttpSession H = RuntimeAccess.getInstance().getSession();
        if (H != null && H.getAttribute("Unloader") == null) {
            H.setAttribute("Unloader", new Undeployer());
        }

        antExecute(projectDir, deployName, TEST_RUN_START_PREP_OPERATION);
        antExecute(projectDir, deployName, BUILD_OPERATION);
        compile();
        return antExecute(projectDir, deployName, TEST_RUN_START_TEMP_OPERATION);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String testRunStart() {
        String deployName = getDeployName();
        testRunStart(getCanonicalPath(getProjectDir()), deployName);
        return "/" + deployName;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String compile() {
        antExecute(getCanonicalPath(getProjectDir()), getDeployName(), COPY_JARS_OPERATION);
        return this.projectCompiler.compile();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String cleanCompile() {
        antExecute(getCanonicalPath(getProjectDir()), getDeployName(), CLEAN_OPERATION);
        return compile();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String build() {
        antExecute(getCanonicalPath(getProjectDir()), getDeployName(), BUILD_OPERATION);
        return compile();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String generateRuntime() {
        return antExecute(getCanonicalPath(getProjectDir()), getDeployName(), GEN_RTFILES_OPERATION);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String cleanBuild() {
        antExecute(getCanonicalPath(getProjectDir()), getDeployName(), CLEAN_OPERATION);
        return build();
    }

    private void buildWar(LocalFolder projectDir, String buildDir, String warFile, boolean includeEar) {

        int len = warFile.length();
        String earFileName = warFile.substring(0, len - 4) + ".ear";
        Map<String, String> properties = new HashMap<String, String>();
        properties.put(BUILD_WEBAPPROOT_PROPERTY, buildDir);
        properties.put(WAR_FILE_NAME_PROPERTY, warFile);
        properties.put(EAR_FILE_NAME_PROPERTY, earFileName);
        properties.put(CUSTOM_WM_DIR_NAME_PROPERTY, AbstractStudioFileSystem.COMMON_DIR);

        try {
            properties.put(WAVEMAKER_HOME, getFileSystem().getWaveMakerHome().getFile().getPath());
        } catch (IOException ex) {
            throw new WMRuntimeException(ex);
        }

        properties.put(PROJECT_DIR_PROPERTY, getCanonicalPath(projectDir));
        properties.put(DEPLOY_NAME_PROPERTY, projectDir.getName());

        //build();

        antExecute(getCanonicalPath(projectDir), BUILD_WAR_OPERATION, properties);

        if (includeEar) {
            antExecute(getCanonicalPath(projectDir), BUILD_EAR_OPERATION, properties);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public com.wavemaker.tools.io.File buildWar(com.wavemaker.tools.io.File warFile, java.io.File tempWebAppRoot,
                                                boolean includeEar) throws IOException {
        String warFileLocation = ((LocalFile) warFile).getLocalFile().getCanonicalPath();
        buildWar(warFileLocation, tempWebAppRoot, includeEar);
        return warFile;
    }

    private void buildWar(String warFileName, java.io.File tempWebAppRoot, boolean includeEar) throws IOException {
        buildWar(getProjectDir(), tempWebAppRoot.getAbsolutePath(), warFileName, includeEar);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void testRunClean() {
        antExecute(getCanonicalPath(getProjectDir()), getDeployName(), TEST_RUN_CLEAN_OPERATION);
    }

    @Override
    public void testRunClean(com.wavemaker.tools.project.Project project) {
        antExecute(getCanonicalPath(getProjectDir(project)), getDeployName(project), TEST_RUN_CLEAN_OPERATION);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void undeploy() {
        undeploy(getCanonicalPath(getProjectDir()), getDeployName());
    }

    private String undeploy(String projectDir, String deployName) {
        return antExecute(projectDir, deployName, UNDEPLOY_OPERATION);
    }

    public String antExecute(String projectDir, String targetName, Map<String, String> properties) {
        return antExecute(projectDir, null, targetName, properties);
    }

    private String antExecute(String projectDir, String deployName, String targetName) {

        Map<String, String> props = Collections.emptyMap();
        return antExecute(projectDir, deployName, targetName, props);
    }

    private String antExecute(String projectDir, String deployName, String targetName, Map<String, String> properties) {

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        PrintStream printStream = new PrintStream(byteArrayOutputStream);
        DefaultLogger logger = new DefaultLogger();
        logger.setErrorPrintStream(printStream);
        logger.setOutputPrintStream(printStream);
        logger.setMessageOutputLevel(Project.MSG_INFO);

        Project antProject = parseAntFile(projectDir, deployName, properties);

        // remove all existing build listeners, and add in just mine
        for (Object bl : antProject.getBuildListeners()) {
            antProject.removeBuildListener((BuildListener) bl);
        }
        antProject.addBuildListener(logger);

        try {
            try {
                LocalDeploymentManager.logger.info("RUN ANT");
                antProject.executeTarget(targetName);
                LocalDeploymentManager.logger.info("END ANT");
            } finally {
                printStream.close();
            }
        } catch (BuildException e) {
            LocalDeploymentManager.logger.error(
                "build failed with compiler output:\n" + byteArrayOutputStream.toString() + "\nmessage: " + e.getMessage(), e);
            throw new BuildExceptionWithOutput(e.getMessage(), byteArrayOutputStream.toString() + "\nmessage: " + e.getMessage(), e);
        }

        String loggedOutput = byteArrayOutputStream.toString();
        LocalDeploymentManager.logger.warn("Ant succeeded with logged output:\n" + loggedOutput);
        return loggedOutput;
    }

    private Project parseAntFile(String projectDir, String deployName, Map<String, String> properties) {

        Project ant = new Project();
        StudioFileSystem fileSystem = this.projectManager.getFileSystem();
        Map<String, Object> newProperties = new HashMap<String, Object>();

        if (getProjectManager() != null && getProjectManager().getCurrentProject() != null) {
            newProperties.put(PROJECT_ENCODING_PROPERTY, getProjectManager().getCurrentProject().getEncoding());
        }

        newProperties.put(TOMCAT_HOST_PROPERTY, getStudioConfiguration().getTomcatHost());
        System.setProperty("wm.proj." + TOMCAT_HOST_PROPERTY, getStudioConfiguration().getTomcatHost());

        newProperties.put(TOMCAT_PORT_PROPERTY, getStudioConfiguration().getTomcatPort());
        System.setProperty("wm.proj." + TOMCAT_PORT_PROPERTY, getStudioConfiguration().getTomcatPort() + "");

        newProperties.put("tomcat.manager.username", getStudioConfiguration().getTomcatManagerUsername());
        System.setProperty("wm.proj.tomcat.manager.username", getStudioConfiguration().getTomcatManagerUsername());

        newProperties.put("tomcat.manager.password", getStudioConfiguration().getTomcatManagerPassword());
        System.setProperty("wm.proj.tomcat.manager.password", getStudioConfiguration().getTomcatManagerPassword());

        newProperties.putAll(properties);

        try {
            newProperties.put(STUDIO_WEBAPPROOT_PROPERTY, fileSystem.getStudioWebAppRoot().getFile().getCanonicalPath());
        } catch (IOException ex) {
            throw new WMRuntimeException(ex);
        }

        newProperties.put(PROJECT_DIR_PROPERTY, projectDir);

        LocalDeploymentManager.logger.info("PUT DIR: " + projectDir);
        Resource projectDirFile = fileSystem.getResourceForURI(projectDir);
        String projectName = projectDirFile.getFilename();
        newProperties.put(PROJECT_NAME_PROPERTY, projectName);

        LocalDeploymentManager.logger.info("PUT NAME: " + projectName);

        if (deployName != null) {
            newProperties.put(DEPLOY_NAME_PROPERTY, deployName);
            System.setProperty("wm.proj." + DEPLOY_NAME_PROPERTY, deployName);
        }

        for (Map.Entry<String, Object> mapEntry : newProperties.entrySet()) {
            ant.setProperty(mapEntry.getKey(), String.valueOf(mapEntry.getValue()));
        }
        ProjectHelper helper = ProjectHelper.getProjectHelper();
        DefaultLogger log = new DefaultLogger();
        log.setErrorPrintStream(System.err);
        log.setOutputPrintStream(System.out);
        log.setMessageOutputLevel(Project.MSG_INFO);
        ant.addBuildListener(log);
        ant.init();
        helper.parse(ant, this.getClass().getResource(BUILD_RESOURCE_NAME));
        return ant;
    }

    private String getCanonicalPath(LocalFolder folder) {
        try {
            return folder.getLocalFile().getCanonicalPath();
        } catch (IOException e) {
            throw new WMRuntimeException(e);
        }
    }

    private String getDeployName() {
        return getDeployName(this.projectManager.getCurrentProject());
    }

    private String getDeployName(com.wavemaker.tools.project.Project project) {
        return project.getProjectName();
    }

    public static class DeploymentNamespaceMapper extends NamespacePrefixMapper {

        @Override
        public String getPreferredPrefix(String namespaceUri, String suggestion, boolean requirePrefix) {
            if ("http://www.wavemaker.com/namespaces/DeploymentPlan/1.0".equals(namespaceUri)) {
                return "";
            } else if ("http://www.w3.org/2001/XMLSchema-instance".equals(namespaceUri)) {
                return "xsi";
            } else {
                return null;
            }
        }
    }
}
