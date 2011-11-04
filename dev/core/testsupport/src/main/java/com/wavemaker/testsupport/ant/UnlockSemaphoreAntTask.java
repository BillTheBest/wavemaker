/*
 *  Copyright (C) 2009-2011 VMWare, Inc. All rights reserved.
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

package com.wavemaker.testsupport.ant;

import org.apache.tools.ant.BuildException;
import org.apache.tools.ant.Task;

import com.wavemaker.testsupport.UtilTest;

/**
 * @author Matt Small
 */
public class UnlockSemaphoreAntTask extends Task {

    @Override
    public void execute() throws BuildException {

        if (null == this.semaphoreReturn) {
            throw new BuildException("semaphoreReturn parameter must be set");
        }

        try {
            UtilTest.unlockSemaphore(this.semaphoreReturn);
            System.out.println("unlocked semaphore with key " + this.semaphoreReturn);
        } catch (Exception e) {
            throw new BuildException(e);
        }
    }

    // bean properties
    private String semaphoreReturn;

    public void setSemaphoreReturn(String semaphoreReturn) {
        this.semaphoreReturn = semaphoreReturn;
    }

    public String getSemaphoreReturn() {
        return this.semaphoreReturn;
    }
}