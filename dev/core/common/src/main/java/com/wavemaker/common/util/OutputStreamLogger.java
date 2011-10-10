/*
 *  Copyright (C) 2007-2011 VMWare, Inc. All rights reserved.
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

package com.wavemaker.common.util;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;

import org.apache.commons.logging.Log;

/**
 * 
 * @author stoens
 * @version $Rev$ - $Date$
 * 
 */
public class OutputStreamLogger extends OutputStream {

    private final Log log;

    ByteArrayOutputStream bos = new ByteArrayOutputStream();

    public OutputStreamLogger(Log log) {
        this.log = log;
    }

    @Override
    public void write(int b) {
        this.bos.write(b);
    }

    @Override
    public void flush() {
        this.log.error(this.bos.toString());
        this.bos = new ByteArrayOutputStream();
    }
}
