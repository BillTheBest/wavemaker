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

package com.wavemaker.tools.serializer;

import com.wavemaker.common.MessageResource;
import com.wavemaker.common.WMException;

/**
 * @author ffu
 * @version $Rev$ - $Date$
 * 
 */
public class FileSerializerException extends WMException {

    private static final long serialVersionUID = 1L;

    public FileSerializerException(String message) {
        super(message);
    }

    public FileSerializerException(Throwable e) {
        super(e);
    }

    public FileSerializerException(MessageResource resource, Object... args) {
        super(resource, args);
    }
}
