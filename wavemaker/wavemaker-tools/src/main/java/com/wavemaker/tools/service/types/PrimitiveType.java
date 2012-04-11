/*
 *  Copyright (C) 2008-2012 VMware, Inc. All rights reserved.
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

/**
 * Individual primitive type.
 * 
 * @author Matt Small
 */
public class PrimitiveType implements Type {

    public enum PRIMITIVES {

        STRING("String"), NUMBER("Number"), BOOLEAN("Boolean"), DATE("Date");

        private final String primitive;

        PRIMITIVES(String string) {
            this.primitive = string;
        }

        @Override
        public String toString() {
            return this.primitive;
        }
    }

    private PRIMITIVES primitiveType;

    private boolean internal;

    public PRIMITIVES getPrimitiveType() {
        return this.primitiveType;
    }

    public void setPrimitiveType(PRIMITIVES primitiveType) {
        this.primitiveType = primitiveType;
    }

    public void setPrimitiveType(String primitiveType) {

        for (PRIMITIVES val : PRIMITIVES.values()) {
            if (val.primitive.equals(primitiveType)) {
                this.primitiveType = val;
                return;
            }
        }

        this.primitiveType = PRIMITIVES.valueOf(primitiveType);
    }

    public boolean isInternal() {
        return this.internal;
    }

    public void setInternal(boolean internal) {
        this.internal = internal;
    }
}