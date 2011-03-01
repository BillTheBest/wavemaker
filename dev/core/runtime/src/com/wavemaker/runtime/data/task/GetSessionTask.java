/*
 *  Copyright (C) 2008-2011 WaveMaker Software, Inc.
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
package com.wavemaker.runtime.data.task;

import org.hibernate.Session;

import com.wavemaker.runtime.data.Task;
import com.wavemaker.runtime.data.DataServiceMetaData;

/**
 * @author Simon Toens
 */
public class GetSessionTask extends BaseTask implements Task, DefaultRollback {

    public Object run(Session session, String dbName, Object... input) {        
        return session;
    }

    public String getName() {
        return "Built-in GetSession Task";
    }

}
