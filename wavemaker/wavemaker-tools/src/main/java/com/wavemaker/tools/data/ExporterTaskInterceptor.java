/*
 *  Copyright (C) 2012 VMware, Inc. All rights reserved.
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

package com.wavemaker.tools.data;

import java.io.File;
import java.lang.reflect.Method;

import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;

import org.hibernate.tool.ant.HibernateToolTask;

import com.wavemaker.common.util.IOUtils;
import com.wavemaker.runtime.RuntimeAccess;
import com.wavemaker.tools.io.Folder;
import com.wavemaker.tools.io.local.LocalFolder;
import com.wavemaker.tools.project.StudioFileSystem;

public class ExporterTaskInterceptor implements MethodInterceptor {

    @Override
    public Object intercept(Object object, Method method, Object[] args, MethodProxy methodProxy) throws Throwable {

        HibernateToolTask parent = null;
        Folder destDir = null;

        if (!method.getName().equals("execute")) {
            return methodProxy.invokeSuper(object, args);
        }

        if (object instanceof HibernateConfigExporterTask) {
            HibernateConfigExporterTask task = (HibernateConfigExporterTask) object;
            parent = task.getParent();
            destDir = task.getDestDir();
        } else if (object instanceof Hbm2JavaExporterTaskWrapper) {
            Hbm2JavaExporterTaskWrapper task = (Hbm2JavaExporterTaskWrapper) object;
            parent = task.getParent();
            destDir = task.getDestDir();
        } else if (object instanceof QueryExporterTask) {
            QueryExporterTask task = (QueryExporterTask) object;
            parent = task.getParent();
            destDir = task.getDestDir();
        } else if (object instanceof Hbm2HbmXmlExporterTaskWrapper) {
            Hbm2HbmXmlExporterTaskWrapper task = (Hbm2HbmXmlExporterTaskWrapper) object;
            parent = task.getParent();
            destDir = task.getDestDir();
        } else if (object instanceof HibernateSpringConfigExporterTask) {
            HibernateSpringConfigExporterTask task = (HibernateSpringConfigExporterTask) object;
            parent = task.getParent();
            destDir = task.getDestDir();
        }

        File tempDestDir = IOUtils.createTempDirectory("dataService_directory", null);
        parent.setDestDir(tempDestDir);

        Object rtn = methodProxy.invokeSuper(object, args);

        Folder folder = new LocalFolder(tempDestDir);
        folder.copyContentsTo(destDir);

        return rtn;
    }
}