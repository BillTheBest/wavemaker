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

package com.wavemaker.tools.ant;

import java.io.File;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

import com.wavemaker.common.util.ClassLoaderUtils;
import com.wavemaker.runtime.RuntimeAccess;
import com.wavemaker.tools.io.ClassPathFile;
import com.wavemaker.tools.io.Folder;
import com.wavemaker.tools.io.local.LocalFolder;
import com.wavemaker.tools.project.Project;
import com.wavemaker.tools.project.StudioFileSystem;
import com.wavemaker.tools.service.DesignServiceManager;
import com.wavemaker.tools.util.AntUtils;
import com.wavemaker.tools.util.DesignTimeUtils;
import com.wavemaker.tools.util.ResourceClassLoaderUtils;

/**
 * Base Task.
 * 
 * @author Simon Toens
 * @author Jeremy Grelle
 */
public abstract class CompilerTask extends Task {

    private File projectRoot;

    private Project agProject;

    private String classpath;

    private boolean projectRootRequired = false;

    private boolean verbose = false;

    private DesignServiceManager designServiceManager = null;

    protected StudioFileSystem fileSystem;

    protected CompilerTask() {
        this(false);
    }

    protected CompilerTask(boolean init) {
        if (init) {
            AntUtils.bootstrap(getClass().getClassLoader());
        }
        this.fileSystem = (StudioFileSystem) RuntimeAccess.getInstance().getSpringBean("fileSystem");
    }

    // REVIEW 25-Sep-07 stoens@activegrid.com -- We also need to handle
    // classpathref
    public void setClassPath(String s) {
        this.classpath = s;
    }

    public Folder getProjectRoot() {
        return new LocalFolder(this.projectRoot);
    }

    public void setProjectRoot(File projectRoot) {
        this.projectRoot = projectRoot;
        Folder folder = new LocalFolder(projectRoot);
        this.agProject = new Project(folder);
    }

    public void setVerbose(boolean verbose) {
        this.verbose = verbose;
    }

    public boolean getVerbose() {
        return this.verbose;
    }

    public Project getAGProject() {
        return this.agProject;
    }

    protected synchronized DesignServiceManager getDesignServiceManager() {
        if (this.designServiceManager == null) {
            if (this.projectRoot != null) {
                Folder folder = new LocalFolder(this.projectRoot);
                this.designServiceManager = DesignTimeUtils.getDSMForProjectRoot(folder);
            }
        }
        return this.designServiceManager;
    }

    protected void setProjectRootRequired(boolean projectRootRequired) {
        this.projectRootRequired = projectRootRequired;
    }

    @Override
    public final void execute() {

        validate();

        Runnable task = new Runnable() {

            @Override
            public void run() {
                doExecute();
            }
        };

        ResourceClassLoaderUtils.runInClassLoaderContext(task, getClassLoader());
    }

    protected abstract void doExecute();

    protected void validate() {

        if (this.projectRootRequired) {

            if (this.projectRoot == null) {
                throw new BuildException("projectRoot must be set");
            }

            if (!this.projectRoot.exists()) {
                throw new BuildException("projectRoot: " + this.projectRoot + "doesn't exist");
            }
        }
    }

    protected void debug(String s) {
        log(s, org.apache.tools.ant.Project.MSG_DEBUG);
    }

    private ClassLoader getClassLoader() {

        if (this.classpath == null) {
            // REVIEW 25-Sep-07 stoens@activegrid.com -- this is a hack for
            // running in Ant, so that we can get the taskdef's classloader
            // for this task. All this because Ant doesn't set the Thread's
            // context ClassLoader.
            return getClass().getClassLoader();
        } else {
            // FIXME 25-Sep-07 stoens@activegrid.com -- this path needs to
            // be split correctly on ';' and ':'. Assume it is a single path
            // for now.

            ClassLoader parent = ClassLoaderUtils.getClassLoader();

            // and another hack related to the comment above -
            if (getClass().getClassLoader().getClass().getName().endsWith("AntClassLoader")) {
                parent = getClass().getClassLoader();
            }
            String[] paths = this.classpath.split(":");
            ClassPathFile[] classPathFiles = new ClassPathFile[paths.length];
            for (int i = 0; i < paths.length; i++) {
                classPathFiles[i] = new ClassPathFile(paths[i]);
            }
            return ResourceClassLoaderUtils.getClassLoaderForResources(parent, classPathFiles);
        }

    }
}