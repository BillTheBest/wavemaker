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

package com.wavemaker.tools.service;

import org.springframework.core.io.Resource;

import com.wavemaker.tools.io.File;

/**
 * Provides access to a service file. Files should be accessed as {@link File}s but legacy {@link Resource} access is
 * also provided to allow {@link ServiceDefinitionFactory} instances to gradually be refactored.
 */
public final class ServiceFile {

    private final File file;

    private final Resource resource;

    public ServiceFile(File file, Resource resource) {
        this.file = file;
        this.resource = resource;
    }

    public File asFile() {
        return this.file;
    }

    @Deprecated
    public Resource asResource() {
        return this.resource;
    }
}
