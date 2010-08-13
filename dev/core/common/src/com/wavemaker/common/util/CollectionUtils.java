/*
 *  Copyright (C) 2009-2010 WaveMaker Software, Inc.
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
package com.wavemaker.common.util;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * @author small
 * @version $Rev$ - $Date$
 *
 */
public class CollectionUtils {

    public static <T> Set<T> createSet(T... args) {
        
        Set<T> set = new HashSet<T>();
        for (T arg: args) {
            set.add(arg);
        }
        return set;
    }
    
    public static <T> List<T> createList(T... args) {
        
        List<T> list = new ArrayList<T>();
        for (T arg: args) {
            list.add(arg);
        }
        return list;
    }
}