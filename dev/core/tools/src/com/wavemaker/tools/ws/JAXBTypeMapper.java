/*
 *  Copyright (C) 2007-2010 WaveMaker Software, Inc.
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
package com.wavemaker.tools.ws;

import java.io.File;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.xml.namespace.QName;

import org.w3c.dom.Element;

import com.sun.tools.xjc.api.Mapping;
import com.sun.tools.xjc.api.S2JJAXBModel;
import com.sun.tools.xjc.api.TypeAndAnnotation;
import com.sun.tools.xjc.model.CBuiltinLeafInfo;
import com.sun.tools.xjc.model.CClassInfo;
import com.sun.tools.xjc.model.CElementPropertyInfo;
import com.sun.tools.xjc.model.CPropertyInfo;
import com.sun.tools.xjc.model.CTypeInfo;
import com.sun.tools.xjc.model.Model;
import com.sun.tools.xjc.model.nav.NType;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.runtime.service.ElementType;
import com.wavemaker.tools.service.codegen.GenerationException;
import com.wavemaker.tools.ws.wsdl.TypeMapper;
import com.wavemaker.tools.ws.wsdl.WSDL;
import com.wavemaker.tools.ws.wsdl.WSDL.WebServiceType;
import com.wavemaker.tools.ws.salesforce.SalesforceHelper;
import com.wavemaker.json.type.OperationEnumeration;

/**
 * JAXB specific type mappings.
 * 
 * @author Frankie Fu
 */
public class JAXBTypeMapper implements TypeMapper {

    public static final Map<QName, String> builtinTypeMap;

    static {
        builtinTypeMap = new HashMap<QName, String>();
        Map<NType, CBuiltinLeafInfo> leaves = CBuiltinLeafInfo.LEAVES;
        Collection<CBuiltinLeafInfo> builtinTypes = leaves.values();
        for (CBuiltinLeafInfo builtinType : builtinTypes) {
            builtinTypeMap.put(builtinType.getTypeName(), builtinType.getType()
                    .fullName());
        }
    }

    private S2JJAXBModel jaxbModel;
    
    private Map<QName, String> jaxbMappings;
    
    public JAXBTypeMapper(WSDL wsdl) throws GenerationException {
        this(wsdl, new ArrayList<File>());
    }

    public JAXBTypeMapper(WSDL wsdl, List<File> bindingFiles)
            throws GenerationException {
        this(wsdl.getSchemas(), bindingFiles, wsdl.getPackageName(),
                wsdl.getAuxiliaryClasses(), wsdl.getWebServiceType());
    }

    public JAXBTypeMapper(Map<String, Element> schemas,
            List<File> bindingFiles, String packageName,
            Set<String> auxiliaryClasses, WebServiceType type)
            throws GenerationException {
        jaxbModel = XJCCompiler.createSchemaModel(schemas, bindingFiles,
                packageName, auxiliaryClasses, type);
        jaxbMappings = getMappings();
    }

    public S2JJAXBModel getJAXBModel() {
        return jaxbModel;
    }

    public String getJavaType(QName schemaType, boolean isElement) {
        String javaType = null;
        if (jaxbModel != null) {
            // SimpleTypes or ComplexTypes or any builtin types
            TypeAndAnnotation jt = jaxbModel.getJavaType(schemaType);
            if (jt == null || isElement) {
                // Element
                Mapping mapping = jaxbModel.get(schemaType);
                if (mapping == null) {
                    javaType = jaxbMappings.get(schemaType);
                } else {
                    jt = mapping.getType();
                }
            }
            if (jt != null) {
                javaType = jt.getTypeClass().fullName();
            }
        } else {
            javaType = builtinTypeMap.get(schemaType);
        }
        return javaType;
    }

    public String toPropertyName(String name) {
        return CodeGenUtils.toPropertyName(name);
    }

    public boolean isSimpleType(QName qname) {
        TypeAndAnnotation javaType = jaxbModel.getJavaType(qname);
        if (javaType == null) {
            javaType = jaxbModel.get(qname).getType();
        }
        if (javaType.getTypeClass().isPrimitive()) {
            return true;
        } else {
            return builtinTypeMap.containsValue(javaType.getTypeClass().fullName());
        }
    }

    private Model getInternalModel() {
        if (jaxbModel == null) {
            return null;
        }
        try {
            Field field = jaxbModel.getClass().getDeclaredField("model");
            field.setAccessible(true);
            Model model = (Model) field.get(jaxbModel);
            return model;
        } catch (Exception e) {
            throw new WMRuntimeException(e);
        }
    }
    
    private Map<QName, String> getMappings() {
        Map<QName, String> mappings = new HashMap<QName, String>();
        Model internalModel = getInternalModel();
        if (internalModel != null) {
            for (CClassInfo ci : internalModel.beans().values()) {
                QName qname = ci.getElementName();
                if (qname == null) {
                    qname = ci.getTypeName();
                }
                if (qname != null) {
                    mappings.put(qname, ci.getName());
                }
            }
        }
        return mappings;
    }
    
    public synchronized List<ElementType> getAllTypes (String serviceId) {
        List<ElementType> allTypes = new ArrayList<ElementType>();
        Model internalModel = getInternalModel();
        SalesforceHelper helper = null; //xxx
        if (internalModel != null) {
            for (CClassInfo ci : internalModel.beans().values()) {
                ElementType type = new ElementType(ci.shortName, ci.fullName());

                try {
                    helper = new SalesforceHelper(ci.shortName, serviceId);  //xxx
                } catch (Exception e) {
                    e.printStackTrace();
                }
                List<ElementType> properties = getPropertyTypes(ci, serviceId, helper);
                // if the type extends from a base type, get those properties
                // from the base type as well.
                CClassInfo baseci = ci;
                while ((baseci = baseci.getBaseClass()) != null) {
                    properties.addAll(getPropertyTypes(baseci, serviceId, helper));
                }
                type.setProperties(properties);

                allTypes.add(type);
            }
            if (helper != null) SalesforceHelper.setSessionHeader(null); //xxx
        }
        return allTypes;
    }

    private List<ElementType> getPropertyTypes(CClassInfo ci, String serviceId, SalesforceHelper sfHelper) {
        List<ElementType> properties = new ArrayList<ElementType>();
        for (CPropertyInfo prop : ci.getProperties()) {
            if (sfHelper.skipElement(prop.getName(true), serviceId)) continue; //xxx
            Collection<? extends CTypeInfo> ref = prop.ref();
            String propJavaType = null;
            if (prop instanceof CElementPropertyInfo
                    && ((CElementPropertyInfo) prop).getSchemaType() != null) {
                propJavaType = getJavaType(((CElementPropertyInfo) prop)
                        .getSchemaType(), true);
            } else {
                for (CTypeInfo ct : ref) {
                    propJavaType = ct.getType().fullName();
                }
            }
            ElementType propType = new ElementType(
                    toPropertyName(prop.getName(true)), 
                    propJavaType, prop.isCollection());

            propType = sfHelper.setElementTypeProperties(propType, serviceId);  //xxx
            properties.add(propType);
        }
        return properties;
    }

}
