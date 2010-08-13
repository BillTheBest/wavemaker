/*
 *  Copyright (C) 2009-2010 WaveMaker Software, Inc.
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
package com.wavemaker.runtime.service;

import org.apache.log4j.Logger;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;

/**
 * During bean creation, this intercepts the events and adds any ServiceManager-
 * managed beans to the ServiceManager singleton.
 * 
 * @author small
 * @version $Rev$ - $Date$
 */
public class ServiceManagerBeanPostProcessor implements BeanPostProcessor {

    /** Logger for this class and subclasses */
    protected final Logger logger = Logger.getLogger(getClass());
    
    /* (non-Javadoc)
     * @see org.springframework.beans.factory.config.BeanPostProcessor#postProcessAfterInitialization(java.lang.Object, java.lang.String)
     */
    public Object postProcessAfterInitialization(Object bean, String beanName)
            throws BeansException {
        
        if (bean instanceof ServiceType) {
            serviceManager.addServiceType((ServiceType) bean);
        } else if (bean instanceof ServiceWire) {
            serviceManager.addServiceWire((ServiceWire) bean);
        }
        
        return bean;
    }

    /* (non-Javadoc)
     * @see org.springframework.beans.factory.config.BeanPostProcessor#postProcessBeforeInitialization(java.lang.Object, java.lang.String)
     */
    public Object postProcessBeforeInitialization(Object bean, String beanName)
            throws BeansException {
        return bean;
    }

    private ServiceManager serviceManager;
    
    
    public void setServiceManager(ServiceManager serviceManager) {
        this.serviceManager = serviceManager;
    }
    public ServiceManager getServiceManager() {
        return serviceManager;
    }
}