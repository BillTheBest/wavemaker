/*
 *  Copyright (C) 2007-2009 WaveMaker Software, Inc.
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
package com.wavemaker.runtime;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;

import javax.servlet.http.HttpServletRequest;

import org.junit.Test;

import com.wavemaker.runtime.test.TestSpringContextTestCase;

/**
 * @author small
 * @version $Rev$ - $Date$
 *
 */
public class TestRuntimeAccess extends TestSpringContextTestCase {

    public static class SessionTest {

        @SuppressWarnings("deprecation")
        public void sessionTest() {
            
            assertNotNull(runtimeAccess);
            assertNotNull(runtime);

            HttpServletRequest req = runtimeAccess.getRequest();
            
            // make sure we have different sessions between the first and
            // second requests
            if (null==firstSessionString) {
                firstSessionString = req.getSession().toString();
            } else {
                String secondSessionString = req.getSession().toString();
                assertFalse("session strings were equal; first: "+
                        firstSessionString+", second: "+secondSessionString,
                        firstSessionString.equals(secondSessionString));
            }

            if (null==runtimeToString) {
                runtimeToString = runtimeAccess.toString();
            } else {
                assertFalse("runtimestrings not the same",
                        runtimeToString.equals(runtimeAccess.toString()));
            }

            RuntimeAccess otherRuntime = RuntimeAccess.getInstance();
            assertEquals("runtimes weren't the same", runtimeAccess,
                    otherRuntime);
            assertEquals("runtime hashcodes weren't the same",
                    runtimeAccess.hashCode(), otherRuntime.hashCode());
            assertEquals("sessions weren't the same",
                    runtimeAccess.getSession(), otherRuntime.getSession());
            
            // when you remove these, remove the SuppressWarnings anno
            assertEquals(runtimeAccess.getSession(), runtime.getSession());
            assertEquals(runtimeAccess, runtime.getRuntimeAccess());
        }

        @SuppressWarnings("deprecation")
        protected com.activegrid.runtime.AGRuntime runtime;
        
        protected RuntimeAccess runtimeAccess;

        @SuppressWarnings("deprecation")
        public com.activegrid.runtime.AGRuntime getRuntime() {
            return runtime;
        }

        @SuppressWarnings("deprecation")
        public void setRuntime(com.activegrid.runtime.AGRuntime runtime) {
            this.runtime = runtime;
        }

        public RuntimeAccess getRuntimeAccess() {
            return runtimeAccess;
        }

        public void setRuntimeAccess(RuntimeAccess runtimeAccess) {
            this.runtimeAccess = runtimeAccess;
        }

        protected String runtimeToString = null;
        protected String firstSessionString = null;
    }

    @Test
    public void testSession() throws Exception {

        invokeService_toObject("sessionTestBean", "sessionTest", null);
        invokeService_toObject("sessionTestBean", "sessionTest", null);
    }
}