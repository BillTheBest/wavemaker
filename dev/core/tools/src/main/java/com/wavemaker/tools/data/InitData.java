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

package com.wavemaker.tools.data;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.wavemaker.runtime.client.TreeNode;

/**
 * @author Simon Toens
 * @version $Rev$ - $Date$
 * 
 */
public class InitData {

    private List<TreeNode> dataObjectsTree = null;

    private Map<String, Collection<TypeInfo>> valueTypes = 
        new HashMap<String, Collection<TypeInfo>>();

    public InitData(List<TreeNode> dataObjectsTree) {
        this.dataObjectsTree = dataObjectsTree;
    }

    public void addValueTypes(String dataModelName, 
                              Collection<TypeInfo> valueTypes) 
    {
        this.valueTypes.put(dataModelName, valueTypes);
    }

    public List<TreeNode> getDataObjectsTree() {
        return dataObjectsTree;
    }

    public Map<String, Collection<TypeInfo>> getValueTypes() {
        return valueTypes;
    }
}
