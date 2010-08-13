/*
 *  Copyright (C) 2008-2010 WaveMaker Software, Inc.
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
package com.wavemaker.common;

/**
 * @author small
 * @version $Rev$ - $Date$
 *
 */
public class CommonConstants {


    public static final String WM_SYSTEM_PROPERTY_PREFIX = "wm.";
    public static final String APP_PROPERTY_FILE = "app.properties";
    public static final String LOGON_TENANT_ID = "logOnTenantId";
    public static final String LOGON_USER_NAME = "logOnUsername";
    public static final String IBMWAS_DIR = "websphere";

    public static final String SERVER_TYPE_TOMCAT = "tomcat";
    public static final String SERVER_TYPE_WEBSPHERE = "websphere";
    public static final String DEPLOYMENT_TARGETS_XML = "deploymentTargets.xml";
     
    private CommonConstants() {
        throw new UnsupportedOperationException();
    }
}