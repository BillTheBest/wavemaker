/*
 *  Copyright (C) 2007-2010 VMWare, Inc. All rights reserved.
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

package com.wavemaker.tools.ws.salesforce;

import com.wavemaker.runtime.service.ElementType;
import com.wavemaker.tools.service.definitions.DataObject;
import com.wavemaker.tools.service.DesignServiceManager;
import com.wavemaker.tools.project.ProjectManager;

import java.io.File;

/**
 * Helper class for Salesforce.
 * 
 * @author slee
 */
public class SalesforceHelper {

    public SalesforceHelper(String objName, String serviceId) throws Exception {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
    }
   
    public ElementType setElementTypeProperties(ElementType type, String serviceId) {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
        return null;
    }

    public static boolean isPrimaryKey(String field, String serviceId) {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
        return false;
    }

    public static boolean skipElement(DataObject.Element et, String serviceId) {
        //System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
        return false;
    }

    public boolean skipElement(String field, String serviceId) {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
        return false;
    }

    public static void setSessionHeader(Object hdr) {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
    }

    public static void modifyServiceDefinition(File serviceDefFile) {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
    }

    public String getSubType(String fieldName) {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
        return null;
    }

    public static boolean isSalesForceMethod(DesignServiceManager dsm, String methodName) {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
        return false;
    }

    public static void setupSalesforceSrc(ProjectManager mgr, String username, String password) {
        System.out.println("\n*** SalesForce interface is not avaliable in this package ***\n");
    }
}