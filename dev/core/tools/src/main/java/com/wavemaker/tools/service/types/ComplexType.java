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

package com.wavemaker.tools.service.types;

import java.util.HashMap;
import java.util.Map;

/**
 * Individual complex type.
 * 
 * @author Matt Small
 */
public class ComplexType implements Type {

    Map<String, Field> fields = new HashMap<String, Field>();

    private boolean internal;

    private boolean liveService;

    private String service;

    public Map<String, Field> getFields() {
        return this.fields;
    }

    public void setFields(Map<String, Field> fields) {
        this.fields = fields;
    }

    public boolean isInternal() {
        return this.internal;
    }

    public void setInternal(boolean internal) {
        this.internal = internal;
    }

    public boolean isLiveService() {
        return this.liveService;
    }

    public void setLiveService(boolean liveService) {
        this.liveService = liveService;
    }

    public String getService() {
        return this.service;
    }

    public void setService(String service) {
        this.service = service;
    }
}