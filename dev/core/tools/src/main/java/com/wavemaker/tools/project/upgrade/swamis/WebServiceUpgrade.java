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

package com.wavemaker.tools.project.upgrade.swamis;

import java.io.File;
import java.io.IOException;

import javax.xml.bind.JAXBException;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.TransformerException;

import org.xml.sax.SAXException;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.IOUtils;
import com.wavemaker.runtime.ws.WebServiceType;
import com.wavemaker.tools.project.Project;
import com.wavemaker.tools.project.upgrade.UpgradeInfo;
import com.wavemaker.tools.project.upgrade.UpgradeTask;
import com.wavemaker.tools.service.DesignServiceManager;
import com.wavemaker.tools.service.definitions.Service;
import com.wavemaker.tools.ws.FeedServiceDefinition;
import com.wavemaker.tools.ws.WebServiceToolsManager;
import com.wavemaker.tools.ws.wsdl.WSDLException;

/**
 * This upgrade task will perform the followings: <li>Delete and re-import FeedService.</li> <li>Detete and re-import
 * all SOAP and REST services in the project.</li>
 * 
 * @author Frankie Fu
 */
public class WebServiceUpgrade implements UpgradeTask {

    private DesignServiceManager dsm;

    public DesignServiceManager getDesignServiceManager() {
        return this.dsm;
    }

    public void setDesignServiceManager(DesignServiceManager dsm) {
        this.dsm = dsm;
    }

    @Override
    public void doUpgrade(Project project, UpgradeInfo upgradeInfo) {
        WebServiceToolsManager wstm = new WebServiceToolsManager(this.dsm.getProjectManager(), this.dsm);
        try {
            upgradeWebServices(wstm, upgradeInfo);
        } catch (IOException e) {
            throw new WMRuntimeException(e);
        } catch (JAXBException e) {
            throw new WMRuntimeException(e);
        } catch (WSDLException e) {
            throw new WMRuntimeException(e);
        } catch (NoSuchMethodException e) {
            throw new WMRuntimeException(e);
        } catch (ParserConfigurationException e) {
            throw new WMRuntimeException(e);
        } catch (SAXException e) {
            throw new WMRuntimeException(e);
        } catch (TransformerException e) {
            throw new WMRuntimeException(e);
        }
    }

    private void upgradeWebServices(WebServiceToolsManager wstm, UpgradeInfo upgradeInfo) throws IOException, JAXBException, WSDLException,
        NoSuchMethodException, ParserConfigurationException, SAXException, TransformerException {
        for (String serviceId : this.dsm.getServiceIds()) {
            Service service = this.dsm.getService(serviceId);
            if (service != null && WebServiceType.TYPE_NAME.equals(service.getType())) {
                if (serviceId.equals(FeedServiceDefinition.FEED_SERVICE_NAME)) {
                    this.dsm.deleteService(FeedServiceDefinition.FEED_SERVICE_NAME);
                    wstm.registerFeedService();
                } else {
                    File wsdlFile = wstm.getWSDLFile(serviceId);
                    if (wsdlFile != null) {
                        File tempDir = IOUtils.createTempDirectory();
                        try {
                            File tempWsdlFile = new File(tempDir, "temp.wsdl");
                            IOUtils.copy(wsdlFile, tempWsdlFile);

                            this.dsm.deleteService(serviceId);
                            wstm.importWSDL(tempWsdlFile.getCanonicalPath(), null, true, null, null, null);
                        } finally {
                            try {
                                IOUtils.deleteRecursive(tempDir);
                            } catch (IOException e) {
                                e.printStackTrace();
                            }
                        }
                    }
                }
                upgradeInfo.addVerbose("Upgraded " + serviceId);
            }
        }
    }
}
