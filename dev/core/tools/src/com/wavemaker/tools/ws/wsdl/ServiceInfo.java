/*
 *  Copyright (C) 2007-2010 WaveMaker Software, Inc.
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
package com.wavemaker.tools.ws.wsdl;

import java.util.ArrayList;
import java.util.List;

import javax.xml.namespace.QName;

/**
 * @author ffu
 * @version $Rev$ - $Date$
 * 
 */
public class ServiceInfo extends GenericInfo {

    private QName name;
    
    private List<PortTypeInfo> portTypeInfoList;

    protected ServiceInfo(QName name) {
        this.name = name;
    }

    public QName getQName() {
        return name;
    }

    public String getName() {
        return getQName().getLocalPart();
    }

    public List<PortTypeInfo> getPortTypeInfoList() {
        return portTypeInfoList;
    }
    
    protected void setPortTypeInfoList(List<PortTypeInfo> portTypeInfoList) {
        this.portTypeInfoList = portTypeInfoList;
    }

    protected void addPortTypeInfo(PortTypeInfo portTypeInfo) {
        if (portTypeInfoList == null) {
            portTypeInfoList = new ArrayList<PortTypeInfo>();
        }
        portTypeInfoList.add(portTypeInfo);
    }
}
