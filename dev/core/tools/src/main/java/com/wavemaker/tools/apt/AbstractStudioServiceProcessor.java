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

package com.wavemaker.tools.apt;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import javax.annotation.processing.AbstractProcessor;
import javax.annotation.processing.ProcessingEnvironment;
import javax.annotation.processing.RoundEnvironment;
import javax.lang.model.element.TypeElement;
import javax.tools.Diagnostic.Kind;
import javax.tools.JavaCompiler;
import javax.tools.StandardJavaFileManager;
import javax.tools.ToolProvider;

import org.springframework.core.io.Resource;
import org.springframework.util.ClassUtils;
import org.springframework.util.StringUtils;

import com.wavemaker.tools.compiler.ClassFileManager;
import com.wavemaker.tools.javaservice.JavaDesignServiceType;
import com.wavemaker.tools.project.LocalStudioConfiguration;
import com.wavemaker.tools.project.Project;
import com.wavemaker.tools.project.ProjectManager;
import com.wavemaker.tools.project.StudioConfiguration;
import com.wavemaker.tools.service.DesignServiceManager;
import com.wavemaker.tools.service.DesignServiceType;

public abstract class AbstractStudioServiceProcessor extends AbstractProcessor {

    protected String projectName;

    protected StudioConfiguration studioConfiguration;

    protected DesignServiceManager designServiceManager;

    protected ClassFileManager fileManager = null;

    private boolean initialized;

    @Override
    public synchronized final void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        ClassLoader originalLoader = ClassUtils.getDefaultClassLoader();
        ClassUtils.overrideThreadContextClassLoader(getClass().getClassLoader());
        try {
            this.projectName = processingEnv.getOptions().get(ServiceProcessorConstants.PROJECT_NAME_PROP);
            if (this.studioConfiguration == null) {
                this.studioConfiguration = new LocalStudioConfiguration();
            }
            Project project = null;
            if (this.designServiceManager == null) {
                ProjectManager projectManager = new ProjectManager();
                projectManager.setStudioConfiguration(this.studioConfiguration);
                String projectRoot = processingEnv.getOptions().get(ServiceProcessorConstants.PROJECT_ROOT_PROP);
                if (StringUtils.hasText(projectRoot)) {
                    projectRoot = projectRoot.endsWith("/") ? projectRoot : projectRoot + "/";
                    Resource projectDir = this.studioConfiguration.getResourceForURI(projectRoot);
                    this.projectName = projectDir.getFilename();
                    projectManager.openProject(projectDir, true);
                } else {
                    projectManager.openProject(this.projectName, true);
                }
                project = projectManager.getCurrentProject();
                this.designServiceManager = new DesignServiceManager();
                this.designServiceManager.setProjectManager(projectManager);
                this.designServiceManager.setStudioConfiguration(this.studioConfiguration);

                JavaDesignServiceType designServiceType = new JavaDesignServiceType();
                designServiceType.setServiceType("JavaService");
                List<DesignServiceType> designServiceTypes = new ArrayList<DesignServiceType>();
                designServiceTypes.add(designServiceType);
                this.designServiceManager.setDesignServiceTypes(designServiceTypes);

            } else {
                project = this.designServiceManager.getProjectManager().getCurrentProject();
            }
            if (this.fileManager == null) {
                JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
                if (compiler != null) {
                    StandardJavaFileManager standardManager = compiler.getStandardFileManager(null, null, null);
                    this.fileManager = new ClassFileManager(standardManager, this.studioConfiguration, project);
                }
            }
            doInit(processingEnv);
        } catch (Throwable e) {
            processingEnv.getMessager().printMessage(Kind.ERROR,
                "Failed to initialize ServiceDefProcessor - could not create DesignServiceManager due to: " + e.getMessage());
            this.initialized = false;
            e.printStackTrace();
            return;
        } finally {
            ClassUtils.overrideThreadContextClassLoader(originalLoader);
        }
        this.initialized = true;
    }

    /**
     * Subclasses may override this to provide additional initialization logic. Default implementation is a no-op.
     * 
     * @param processingEnv
     */
    protected abstract void doInit(ProcessingEnvironment processingEnv);

    public void setStudioConfiguration(StudioConfiguration studioConfiguration) {
        this.studioConfiguration = studioConfiguration;
    }

    public void setDesignServiceManager(DesignServiceManager designServiceManager) {
        this.designServiceManager = designServiceManager;
    }

    public void setFileManager(ClassFileManager fileManager) {
        this.fileManager = fileManager;
    }

    @Override
    protected synchronized boolean isInitialized() {
        return this.initialized && super.isInitialized();
    }

    @Override
    public final boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        ClassLoader originalLoader = ClassUtils.getDefaultClassLoader();
        ClassUtils.overrideThreadContextClassLoader(getClass().getClassLoader());
        try {
            return doProcess(annotations, roundEnv);
        } finally {
            ClassUtils.overrideThreadContextClassLoader(originalLoader);
        }
    }

    protected abstract boolean doProcess(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv);

}
