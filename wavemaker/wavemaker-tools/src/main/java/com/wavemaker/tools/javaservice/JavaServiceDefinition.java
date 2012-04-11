/*
 *  Copyright (C) 2007-2012 VMware, Inc. All rights reserved.
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

package com.wavemaker.tools.javaservice;

import java.io.File;
import java.io.IOException;
import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.springframework.core.io.Resource;

import com.wavemaker.common.MessageResource;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.ClassLoaderUtils;
import com.wavemaker.json.type.FieldDefinition;
import com.wavemaker.json.type.PrimitiveTypeDefinition;
import com.wavemaker.json.type.TypeDefinition;
import com.wavemaker.json.type.TypeState;
import com.wavemaker.json.type.reflect.ReflectTypeDefinition;
import com.wavemaker.json.type.reflect.ReflectTypeState;
import com.wavemaker.json.type.reflect.ReflectTypeUtils;
import com.wavemaker.runtime.javaservice.JavaServiceType;
import com.wavemaker.runtime.pws.IPwsServiceModifier;
import com.wavemaker.runtime.server.ServerUtils;
import com.wavemaker.runtime.service.LiveDataService;
import com.wavemaker.runtime.service.ServiceType;
import com.wavemaker.runtime.service.definition.ReflectServiceDefinition;
import com.wavemaker.runtime.service.definition.ServiceOperation;

/**
 * @author Simon Toens
 * @author Matt Small
 * @author Jeremy Grelle
 */
public class JavaServiceDefinition implements ReflectServiceDefinition {

    private final String serviceId;

    private final List<TypeDefinition> typeDefinitions = new ArrayList<TypeDefinition>();

    private final List<ServiceOperation> operations = new ArrayList<ServiceOperation>();

    private final List<String> excludeTypeNames;

    private boolean implementsCRUDService = false;

    private String packageName = null;

    private String serviceClassName = null;

    public JavaServiceDefinition() {
        this.serviceId = "";
        this.excludeTypeNames = null;
    }

    /**
     * Normal constructor. Attempts to use reflection (and a custom, very isolated classloader) to read information
     * about the class.
     * 
     * @throws IOException
     */
    public JavaServiceDefinition(String serviceClassName, String serviceId, Resource serviceCompiledDir, Resource serviceLibDir,
        List<String> excludeTypeNames) throws ClassNotFoundException, LinkageError, IOException {

        this(serviceClassName, serviceId, serviceCompiledDir == null ? null : Arrays.asList(new File[] { serviceCompiledDir.getFile() }),
            serviceLibDir == null ? null : Arrays.asList(new File[] { serviceLibDir.getFile() }), excludeTypeNames);
    }

    /**
     * Normal constructor. Attempts to use reflection (and a custom, very isolated classloader) to read information
     * about the class.
     */
    @SuppressWarnings("unchecked")
    public JavaServiceDefinition(String serviceClassName, String serviceId, List<File> serviceCompiledDirs, List<File> serviceLibDirs,
        List<String> excludeTypeNames) throws ClassNotFoundException, LinkageError {

        List<File> classpath = new ArrayList<File>();
        if (serviceCompiledDirs != null) {
            classpath.addAll(serviceCompiledDirs);
        }
        if (serviceLibDirs != null) {
            for (File serviceLibDir : serviceLibDirs) {
                if (!serviceLibDir.exists()) {
                    continue;
                } else if (!serviceLibDir.isDirectory()) {
                    throw new WMRuntimeException(MessageResource.LIB_DIR_NOT_DIR, serviceLibDir);
                }

                classpath.addAll(FileUtils.listFiles(serviceLibDir, new String[] { "jar" }, false));
            }
        }

        ClassLoader cl = ClassLoaderUtils.getTempClassLoaderForFile(classpath.toArray(new File[] {}));

        Class<?> serviceClass = ClassLoaderUtils.loadClass(serviceClassName, false, cl);
        Class<?> runtimeServiceClass = ClassLoaderUtils.loadClass("com.wavemaker.runtime.service.LiveDataService", cl);

        this.serviceId = serviceId;
        this.excludeTypeNames = excludeTypeNames;

        init(serviceClass, runtimeServiceClass);
    }

    /**
     * A constructor that reads information from the serviceClass class parameter.
     */
    public JavaServiceDefinition(Class<?> serviceClass, String serviceId) {

        this.serviceId = serviceId;
        this.excludeTypeNames = new ArrayList<String>();

        init(serviceClass, LiveDataService.class);
    }

    /**
     * A constructor that reads information from the serviceClass class parameter.
     */
    public JavaServiceDefinition(String serviceClass, String serviceId) {
        this.serviceClassName = serviceClass;
        this.serviceId = serviceId;
        this.excludeTypeNames = new ArrayList<String>();
    }

    public static String getRelPathFromClass(String fqClassName) {
        return fqClassName.replace('.', '/') + ".java";
    }

    public static String getClass(String fqClassName) {

        String ret;

        if (fqClassName.contains(".")) {
            ret = fqClassName.substring(fqClassName.lastIndexOf('.') + 1);
        } else {
            ret = fqClassName;
        }

        return ret;
    }

    public static String getPackage(String fqClassName) {

        String ret = null;

        if (fqClassName.contains(".")) {
            ret = fqClassName.substring(0, fqClassName.lastIndexOf('.'));
        }

        return ret;
    }

    private void init(Class<?> serviceClass, Class<?> runtimeServiceClass) {

        ReflectTypeState typeState = new ReflectTypeState();

        Collection<Method> methods = filterOverloadedMethods(ServerUtils.getClientExposedMethods(serviceClass));
        for (Method m : methods) {
            initOperation(m, typeState);
        }

        this.implementsCRUDService = runtimeServiceClass.isAssignableFrom(serviceClass);
        this.serviceClassName = serviceClass.getName();

        if (this.implementsCRUDService) {
            for (TypeDefinition td : this.typeDefinitions) {
                ((ReflectTypeDefinition) td).setLiveService(this.implementsCRUDService);
            }
        }

        if (serviceClass.getPackage() == null) {
            this.packageName = null;
        } else {
            this.packageName = serviceClass.getPackage().getName();
        }
    }

    private void initOperation(Method method, TypeState typeState) {

        ServiceOperation so = new ServiceOperation();
        so.setName(method.getName());

        if (!method.getReturnType().equals(void.class)) {
            so.setReturnType(ReflectTypeUtils.getFieldDefinition(method, typeState, false, null));
            checkAddType(so.getReturnType().getTypeDefinition());
        }

        List<String> paramNames = ServerUtils.getParameterNames(method);
        Type[] types = method.getGenericParameterTypes();
        List<FieldDefinition> params = new ArrayList<FieldDefinition>(types.length);
        so.setParameterTypes(params);
        for (int i = 0; i < types.length; i++) {
            params.add(ReflectTypeUtils.getFieldDefinition(types[i], typeState, false, paramNames.get(i)));
            checkAddType(params.get(i).getTypeDefinition());
        }

        this.operations.add(so);
    }

    private void checkAddType(TypeDefinition td) {

        if (td == null) {
            return;
        }
        if (this.typeDefinitions.contains(td)) {
            return;
        }
        if (td instanceof PrimitiveTypeDefinition) {
            return;
        }

        for (TypeDefinition knownType : this.typeDefinitions) {
            if (knownType.getTypeName().equals(td.getTypeName())) {
                return;
            }
        }

        if (this.excludeTypeNames.contains(td.getTypeName())) {
            return;
        }

        this.typeDefinitions.add(td);
    }

    /**
     * Get a list of methods, excluding overloaded ones, biased towards the method with the least number of arguments
     * (in other words, if a method is overloaded, the instance with the fewest arguments is included in the return
     * value).
     * 
     * @param allMethods
     * @return
     */
    public static Collection<Method> filterOverloadedMethods(List<Method> allMethods) {

        Map<String, Method> methodsMap = new HashMap<String, Method>();
        for (Method method : allMethods) {
            if (methodsMap.containsKey(method.getName())) {
                if (methodsMap.get(method.getName()).getParameterTypes().length > method.getParameterTypes().length) {
                    methodsMap.put(method.getName(), method);
                }
            } else {
                methodsMap.put(method.getName(), method);
            }
        }

        return methodsMap.values();
    }

    @Override
    public String getPackageName() {
        return this.packageName;
    }

    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }

    @Override
    public String getServiceId() {
        return this.serviceId;
    }

    @Override
    public ServiceType getServiceType() {
        return new JavaServiceType();
    }

    @Override
    public String getRuntimeConfiguration() {
        return null;
    }

    @Override
    public String getServiceClass() {
        return this.serviceClassName;
    }

    @Override
    public List<String> getEventNotifiers() {
        return Collections.emptyList();
    }

    @Override
    public boolean isLiveDataService() {
        return this.implementsCRUDService;
    }

    public void setLiveDataService(boolean liveDataService) {
        this.implementsCRUDService = liveDataService;
    }

    @Override
    public List<TypeDefinition> getLocalTypes() {
        return this.typeDefinitions;
    }

    @Override
    public List<TypeDefinition> getLocalTypes(String username, String password) { // salesforce
        return null;
    }

    @Override
    public List<ServiceOperation> getServiceOperations() {
        return this.operations;
    }

    @Override
    public String getPartnerName() {
        return null;
    }

    @Override
    public List<ServiceOperation> getServiceOperations(IPwsServiceModifier serviceModifier) {
        return this.operations;
    }
}