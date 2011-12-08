/*
 *  Copyright (C) 2008-2011 VMware, Inc. All rights reserved.
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

package com.wavemaker.tools.pws;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.wavemaker.common.ConfigurationException;
import com.wavemaker.common.MessageResource;
import com.wavemaker.common.util.SpringUtils;
import com.wavemaker.runtime.pws.IPwsServiceModifier;

/**
 * @author Seung Lee
 * 
 */
public class PwsServiceModifierBeanFactory {

    private Map<String, IPwsServiceModifier> pwsServiceModifiers = new HashMap<String, IPwsServiceModifier>();

    public Collection<String> getPwsServiceModifierNames() {
        return this.pwsServiceModifiers.keySet();
    }

    public IPwsServiceModifier getPwsServiceModifier(String partnerName) {

        if (this.pwsServiceModifiers == null) {
            SpringUtils.throwSpringNotInitializedError(this.getClass());
        }

        if (!this.pwsServiceModifiers.containsKey(partnerName)) {
            throw new ConfigurationException(MessageResource.UNKNOWN_PWS_TOOLS_MANAGER, partnerName);
        }

        return this.pwsServiceModifiers.get(partnerName);
    }

    public void setPwsServiceModifiers(Map<String, IPwsServiceModifier> pwsServiceModifiers) {
        this.pwsServiceModifiers = pwsServiceModifiers;

    }

}
