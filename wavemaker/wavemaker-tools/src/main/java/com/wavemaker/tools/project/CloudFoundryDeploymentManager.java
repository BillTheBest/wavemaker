
package com.wavemaker.tools.project;

import java.io.IOException;
import java.util.List;

import org.springframework.core.io.Resource;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

import com.wavemaker.tools.deployment.DeploymentTarget;
import com.wavemaker.tools.deployment.DeploymentTargetManager;
import com.wavemaker.tools.deployment.DeploymentType;
import com.wavemaker.tools.deployment.cloudfoundry.CloudFoundryDeploymentTarget;

public class CloudFoundryDeploymentManager extends AbstractDeploymentManager {

    private DeploymentTargetManager deploymentTargetManager;

    @Override
    public String testRunStart() {
        compile();
        CloudFoundryDeploymentTarget cloudFoundryDeploymentTarget = getCloudFoundryDeploymentTarget();
        return cloudFoundryDeploymentTarget.testRunStart(this.projectManager.getCurrentProject());
    }

    @Override
    public String compile() {
        return this.projectCompiler.compile(this.projectManager.getCurrentProject().getProjectName());
    }

    @Override
    public String cleanCompile() {
        clean();
        return compile();
    }

    private void clean() {
        Project project = this.projectManager.getCurrentProject();
        List<Resource> classFiles = getFileSystem().listChildren(project.getWebInfClasses(), new ResourceFilter() {

            @Override
            public boolean accept(Resource resource) {
                return "class".equals(StringUtils.getFilenameExtension(resource.getFilename()));
            }
        });
        for (Resource classFile : classFiles) {
            getFileSystem().deleteFile(classFile);
        }
    }

    @Override
    public String build() {
        return compile();
    }

    @Override
    public String generateRuntime() {
        throw new UnsupportedOperationException("Haven't implemented this yet.");
    }

    @Override
    public String cleanBuild() {
        return cleanCompile();
    }

    @Override
    public String buildWar(Resource warFile, boolean includeEar) throws IOException {
        throw new UnsupportedOperationException("Haven't implemented this yet.");
    }

    @Override
    public void buildWar(String warFileLocation, boolean includeEar) throws IOException {
        throw new UnsupportedOperationException("Haven't implemented this yet.");
    }

    @Override
    public String deployWar(String warFileName, String deployName) {
        throw new UnsupportedOperationException("Haven't implemented this yet.");
    }

    @Override
    public void testRunClean() {
        undeploy();
    }

    @Override
    public void testRunClean(String projectDir, String deployName) {
        Project project = this.projectManager.getProject(projectDir, true);
        CloudFoundryDeploymentTarget target = getCloudFoundryDeploymentTarget();
        target.undeploy(project);
    }

    @Override
    public void undeploy() {
        Project project = this.projectManager.getCurrentProject();
        CloudFoundryDeploymentTarget target = getCloudFoundryDeploymentTarget();
        target.undeploy(project);
    }

    @Override
    public String exportProject(String zipFileName) {
        throw new UnsupportedOperationException("Haven't implemented this yet.");
    }

    private CloudFoundryDeploymentTarget getCloudFoundryDeploymentTarget() {
        DeploymentTarget deploymentTarget = this.deploymentTargetManager.getDeploymentTarget(DeploymentType.CLOUD_FOUNDRY);
        Assert.isInstanceOf(CloudFoundryDeploymentTarget.class, deploymentTarget);
        return (CloudFoundryDeploymentTarget) deploymentTarget;
    }

    public void setDeploymentTargetManager(DeploymentTargetManager deploymentTargetManager) {
        this.deploymentTargetManager = deploymentTargetManager;
    }
}
