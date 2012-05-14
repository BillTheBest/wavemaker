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

package com.wavemaker.tools.spring;

import java.util.List;

import com.wavemaker.infra.WMTestCase;
import com.wavemaker.tools.io.ClassPathFile;
import com.wavemaker.tools.spring.beans.Bean;
import com.wavemaker.tools.spring.beans.Beans;

/**
 * @author Frankie Fu
 */
public class BeansTest extends WMTestCase {

    @Override
    public void setUp() throws Exception {
    }

    public void testGetBeanById() throws Exception {
        ClassPathFile configFile = new ClassPathFile("com/wavemaker/tools/spring/spring-test1.xml");
        Beans beans = SpringConfigSupport.readBeans(configFile);
        Bean bean = beans.getBeanById("book2");
        assertNotNull(bean);
        assertEquals("com.wavemaker.tools.spring.Book", bean.getClazz());
    }

    public void testAddBean() throws Exception {
        ClassPathFile configFile = new ClassPathFile("com/wavemaker/tools/spring/spring-test1.xml");
        Beans beans = SpringConfigSupport.readBeans(configFile);
        Bean bean1 = new Bean();
        bean1.setId("book3");
        bean1.setClazz("com.wavemaker.tools.spring.Book");
        beans.addBean(bean1);
        Bean bean2 = beans.getBeanById("book3");
        assertNotNull(bean2);
        assertEquals(bean1.getId(), bean2.getId());
        assertEquals(bean1.getClazz(), bean2.getClazz());
    }

    public void testRemoveBean() throws Exception {
        ClassPathFile configFile = new ClassPathFile("com/wavemaker/tools/spring/spring-test1.xml");
        Beans beans = SpringConfigSupport.readBeans(configFile);
        assertTrue(beans.removeBeanById("book1"));
        assertEquals(2, beans.getImportsAndAliasAndBean().size());
    }

    public void testGetBeanList() throws Exception {
        ClassPathFile configFile = new ClassPathFile("com/wavemaker/tools/spring/spring-test1.xml");
        Beans beans = SpringConfigSupport.readBeans(configFile);
        List<Bean> beanList = beans.getBeanList();
        assertEquals(3, beanList.size());
    }

    public void testSetBeanList() throws Exception {
        ClassPathFile configFile = new ClassPathFile("com/wavemaker/tools/spring/spring-test1.xml");
        Beans beans = SpringConfigSupport.readBeans(configFile);
        List<Bean> beanList = beans.getBeanList();
        Bean bean = new Bean();
        bean.setId("test");
        beanList.add(bean);
        beans.setBeanList(beanList);
        assertEquals(4, beans.getBeanList().size());
    }
}
