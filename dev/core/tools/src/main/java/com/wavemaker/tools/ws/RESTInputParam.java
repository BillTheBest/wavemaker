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

package com.wavemaker.tools.ws;

/**
 * @author ffu
 * @version $Rev$ - $Date$
 * 
 */
public class RESTInputParam {

    public enum InputType {
        STRING, INTEGER, OTHER
    };

    private String name;

    private String type;

    public RESTInputParam() {
    }

    public RESTInputParam(String name, String type) {
        this.name = name;
        this.type = type;
    }

    public RESTInputParam(String name, InputType type) {
        this.name = name;
        if (type == InputType.STRING) {
            this.type = "string";
        } else if (type == InputType.INTEGER) {
            this.type = "int";
        }
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return this.type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public InputType toType() {
        InputType inputType = InputType.OTHER;
        if ("string".equals(this.type)) {
            inputType = InputType.STRING;
        } else if ("int".equals(this.type)) {
            inputType = InputType.INTEGER;
        }
        return inputType;
    }
}
