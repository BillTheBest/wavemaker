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
 * @author Simon Toens
 */
public class LoggingInitializer {

    @SuppressWarnings("unused")
    private static final String LOG4J_CONFIG_PROPERTY = "log4j.configuration";

    @SuppressWarnings("unused")
    private static final String AG_LOG4J_CONFIG = "log4j.properties";


    public static void initTestLogging() {} // use default log4j filename
	//SystemUtils.setPropertyUnlessSet(LOG4J_CONFIG_PROPERTY,
        //                                 AG_LOG4J_CONFIG);

    public static void initProdLogging() {} // use default log4j filename

}
