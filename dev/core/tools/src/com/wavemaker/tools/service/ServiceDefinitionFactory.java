/*
 *  Copyright (C) 2007-2011 WaveMaker Software, Inc.
 *
 *  This file is part of the WaveMaker Server Runtime.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.wavemaker.tools.service;

import java.io.File;

import com.wavemaker.runtime.service.definition.ServiceDefinition;

/**
 * @author Simon Toens
 */
public interface ServiceDefinitionFactory {

    /**
     * Returns ServiceDefintion instance if this ServiceDefinitionFactory knows
     * how to handle the passed in File. Returns null otherwise.
     * 
     * @param f
     *            The File that represents a ServiceDefinition
     * 
     * @return ServiceDefintion or null if File is unknown
     */
    ServiceDefinition getServiceDefinition(File f, String serviceId, DesignServiceManager serviceMgr);
}
