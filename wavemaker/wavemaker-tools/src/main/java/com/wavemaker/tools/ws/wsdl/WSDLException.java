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

package com.wavemaker.tools.ws.wsdl;

import com.wavemaker.common.MessageResource;
import com.wavemaker.common.WMException;

/**
 * This class represents WSDL related exception.
 * 
 * @author Frankie Fu
 */
public class WSDLException extends WMException {

    private static final long serialVersionUID = 1L;

    public WSDLException(String message) {
        super(message);
    }

    public WSDLException(MessageResource resource, Object... args) {
        super(resource, args);
    }

    public WSDLException(Throwable cause) {
        super(cause);
    }

    public WSDLException(String message, Throwable cause) {
        super(message, cause);
    }

}
