
package com.wavemaker.tools.project;

import java.io.IOException;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.wavemaker.runtime.server.FileUploadResponse;
import com.wavemaker.tools.deployment.DeploymentInfo;

public interface DeploymentManager {

    public static final String DIST_DIR_DEFAULT = "dist/";

    /**
     * Start a 'test run' for the given project. This method should ensure that the current project is compiled,
     * deployed and active.
     * 
     * @return return the URL of the deployed application. URLs can be relative paths (eg. '/Project1') or fully
     *         qualified URLS (eg. 'http://project1.cloudfoundry.com'). returned URLs should not include parameters as
     *         these are always managed by the client.
     */
    String testRunStart();

    void testRunClean();

    /**
     * Clean build artifacts
     * 
     * @param projectDir The name of the project.
     * @param deployName The deployment target.
     */
    void testRunClean(String projectDir, String deployName);

    /**
     * Compile java src.
     */
    String compile();

    /**
     * Clean, then compile java src.
     */
    String cleanCompile();

    /**
     * Build the application (run the build target).
     */
    String build();

    /**
     * Only generate the runtime files
     */
    String generateRuntime();

    /**
     * Clean, then build the application (run the build target).
     */
    String cleanBuild();

    String buildWar(Resource warFile, boolean includeEar) throws IOException;

    void buildWar(String warFileLocation, boolean includeEar) throws IOException;

    String deployWar(String warFileName, String deployName);

    void undeploy();

    /**
     * Export the current project to a zip file with the given name.
     * 
     * @param zipFileName the name of the file, excluding any path.
     * @return the full path of the exported file to be displayed to the user
     */
    String exportProject(String zipFileName);

    /**
     * This function takes a zip file as input, unzips it and moves it into the projects folder.
     */
    FileUploadResponse importFromZip(MultipartFile file) throws IOException;

    void deployClientComponent(String name, String namespace, String data) throws IOException;

    void deployTheme(String themename, String filename, String data) throws IOException;

    String[] listThemes() throws IOException;

    void copyTheme(String oldName, String newName) throws IOException;

    void deleteTheme(String name) throws IOException;

    String[] listThemeImages(String themename) throws IOException;

    boolean undeployClientComponent(String name, String namespace, boolean removeSource) throws IOException;

    void deleteDeploymentInfo(String deploymentId);

    String saveDeploymentInfo(DeploymentInfo deploymentInfo);

    List<DeploymentInfo> getDeploymentInfo();
}
