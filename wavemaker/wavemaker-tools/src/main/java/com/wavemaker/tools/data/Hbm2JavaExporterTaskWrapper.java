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

import org.hibernate.tool.ant.HibernateToolTask;
import org.hibernate.tool.ant.Hbm2JavaExporterTask;
import org.springframework.core.io.Resource;

public class Hbm2JavaExporterTaskWrapper extends Hbm2JavaExporterTask {
    private Resource destDir;
    
    public Hbm2JavaExporterTaskWrapper(HibernateToolTask parent, Resource destDir) {
        super(parent);
        this.destDir = destDir;
    }

    public HibernateToolTask getParent() {
        return super.parent;
    }

    public void setDestDir(Resource destDir) {
        this.destDir = destDir;
    }

    public Resource getDestDir() {
        return this.destDir;
    }
}