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

package com.wavemaker.tools.service;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.util.Assert;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.runtime.service.definition.DeprecatedServiceDefinition;
import com.wavemaker.tools.io.File;
import com.wavemaker.tools.io.Folder;
import com.wavemaker.tools.project.Project;
import com.wavemaker.tools.service.codegen.GenerationConfiguration;
import com.wavemaker.tools.service.codegen.GenerationException;
import com.wavemaker.tools.service.codegen.ServiceGenerator;

/**
 * Generic logic for generating Service Classes from Service Definitions.
 * 
 * @author Simon Toens
 * @author Jeremy Grelle
 */
public class ServiceClassGenerator {

    private final Log logger = LogFactory.getLog(ServiceClassGenerator.class);

    private final List<ServiceDetail> serviceDetails = new ArrayList<ServiceDetail>();

    private Folder outputDirectory;

    private DesignServiceManager serviceManager;

    public void setDesignServiceManager(DesignServiceManager serviceManager) {
        this.serviceManager = serviceManager;
    }

    public void setOutputDirectory(Folder outputDirectory) {
        this.outputDirectory = outputDirectory;
    }

    public void addServiceFiles(List<ServiceFile> serviceFiles, String serviceId) {
        for (ServiceFile f : serviceFiles) {
            addService(f, serviceId);
        }
    }

    private void addService(ServiceFile serviceFile, String serviceId) {
        Assert.notNull(serviceId, "ServiceId must not be null");
        this.serviceDetails.add(new ServiceDetail(serviceFile, serviceId));
    }

    public void run() {
        Assert.state(this.serviceManager != null, "ServiceManager cannot be null");
        for (ServiceDetail serviceDetail : this.serviceDetails) {
            run(serviceDetail);
        }
    }

    private void run(ServiceDetail serviceDetail) {
        DeprecatedServiceDefinition serviceDefinition = ServiceUtils.getServiceDefinition(serviceDetail.getServiceFile(),
            serviceDetail.getServiceId(), this.serviceManager);
        if (serviceDefinition != null) {
            run(serviceDetail, serviceDefinition);
        }
    }

    private void run(ServiceDetail serviceDetail, DeprecatedServiceDefinition serviceDefinition) {
        ServiceGenerator generator = ServiceUtils.getServiceGenerator(new GenerationConfiguration(serviceDefinition, this.outputDirectory));
        if (isUpToDate(serviceDetail, serviceDefinition, generator)) {
            this.logger.info("service " + serviceDefinition.getServiceId() + " is up to date");
            return;
        }
        this.logger.info("service " + serviceDefinition.getServiceId() + " needs to be re-generated");
        try {
            Project project = this.serviceManager.getProjectManager().getCurrentProject();
            File smdFile = ConfigurationCompiler.getSmdFile(project, serviceDetail.getServiceId());
            String smdContent = smdFile.getContent().asString();
            generator.setSmdContent(smdContent);
            generator.generate();
        } catch (GenerationException ex) {
            throw new WMRuntimeException(ex);
        } finally {
            try {
                serviceDefinition.dispose();
            } catch (RuntimeException ex) {
                this.logger.warn("Error while cleaning up", ex);
            }
        }
    }

    private boolean isUpToDate(ServiceDetail serviceDetail, DeprecatedServiceDefinition serviceDefinition, ServiceGenerator generator) {
        Folder runtimeFolder = this.serviceManager.getServiceRuntimeFolder(serviceDetail.getServiceId());
        // cftempfix - Uncomment the following lines when Phil implements lastModified for Folder.
        /*
         * long lastModified; try { lastModified = runtimeFolder.lastModified(); } catch (IOException ex) { throw new
         * WMRuntimeException(ex); }
         */
        // return generator.isUpToDate(xxx);
        return false;
    }

    private static class ServiceDetail {

        private final ServiceFile serviceFile;

        private final String serviceId;

        public ServiceDetail(ServiceFile serviceFile, String serviceId) {
            super();
            this.serviceFile = serviceFile;
            this.serviceId = serviceId;
        }

        public ServiceFile getServiceFile() {
            return this.serviceFile;
        }

        public String getServiceId() {
            return this.serviceId;
        }
    }
}
