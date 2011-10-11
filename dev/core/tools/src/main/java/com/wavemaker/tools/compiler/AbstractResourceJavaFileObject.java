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

package com.wavemaker.tools.compiler;

import java.io.IOException;

import javax.lang.model.element.Modifier;
import javax.lang.model.element.NestingKind;
import javax.tools.JavaFileObject;

import org.springframework.core.io.Resource;
import org.springframework.util.StringUtils;

import com.wavemaker.tools.project.Project;

/**
 * Abstract base class for {@link JavaFileObject} implementations based on {@link Resource}
 * 
 * @author Jeremy Grelle
 */
public abstract class AbstractResourceJavaFileObject extends GenericResourceFileObject implements JavaFileObject {

    private final Kind kind;

    protected AbstractResourceJavaFileObject(Kind kind, Project project, Resource resource) throws IOException {
        super(project, resource);
        this.kind = kind;
    }

    @Override
    public Modifier getAccessLevel() {
        return null;
    }

    @Override
    public Kind getKind() {
        return this.kind;
    }

    @Override
    public NestingKind getNestingKind() {
        return null;
    }

    @Override
    public boolean isNameCompatible(String name, Kind kind) {
        return this.resource.getFilename().equals(name) && kind.extension.replaceFirst(".", "").equals(StringUtils.getFilenameExtension(name));
    }
}
