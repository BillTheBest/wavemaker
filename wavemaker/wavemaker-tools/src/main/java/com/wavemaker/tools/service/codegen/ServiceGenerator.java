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

package com.wavemaker.tools.service.codegen;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.log4j.NDC;
import org.json.JSONException;
import org.json.JSONObject;

import com.sun.codemodel.JBlock;
import com.sun.codemodel.JClassAlreadyExistsException;
import com.sun.codemodel.JCodeModel;
import com.sun.codemodel.JDefinedClass;
import com.sun.codemodel.JDocComment;
import com.sun.codemodel.JFieldVar;
import com.sun.codemodel.JInvocation;
import com.sun.codemodel.JMethod;
import com.sun.codemodel.JMod;
import com.sun.codemodel.JTryBlock;
import com.sun.codemodel.JType;
import com.wavemaker.common.util.IOUtils;
import com.wavemaker.common.util.StringUtils;
import com.wavemaker.runtime.service.ElementType;
import com.wavemaker.runtime.service.definition.DeprecatedServiceDefinition;
import com.wavemaker.tools.io.Folder;
import com.wavemaker.tools.io.local.LocalFolder;
import com.wavemaker.tools.project.StudioFileSystem;
import com.wavemaker.tools.ws.wsdl.ServiceInfo;
import com.wavemaker.tools.ws.wsdl.WSDL;

/**
 * All service code generators should extend this class. Although all public or protected methods can be overriden or
 * implemented in subclasses, the following four classes are most frequently implemented to support the partner web
 * service module.
 * <p>
 * - <code>addExtraInputParameters</code>
 * </p>
 * <p>
 * - <code>afterClassGeneration</code>
 * </p>
 * <p>
 * - <code>defineRestServiceVariable</code>
 * </p>
 * <p>
 * - <code>defineServiceInvocation</code>
 * </p>
 * 
 * @author Frankie Fu
 * @author Jeremy Grelle
 */
public abstract class ServiceGenerator {

    protected static final String NDC_PUSH = "push";

    protected static final String NDC_POP = "pop";

    protected Log logger = LogFactory.getLog("com.wavemaker.runtime.service.codegen");

    protected GenerationConfiguration configuration;

    protected DeprecatedServiceDefinition serviceDefinition;

    protected JCodeModel codeModel;

    protected boolean useNDCLogging = false;

    protected WSDL wsdl;

    protected JSONObject smdObject;

    protected StudioFileSystem fileSystem;

    public ServiceGenerator() {
    }

    public ServiceGenerator(GenerationConfiguration configuration) {
        // this.configuration = configuration;
        // serviceDefinition = configuration.getServiceDefinition();
        // codeModel = new JCodeModel();
        this.init(configuration);
    }

    public void init(GenerationConfiguration configuration) {
        this.configuration = configuration;
        this.serviceDefinition = configuration.getServiceDefinition();
        this.codeModel = new JCodeModel();
    }

    /**
     * This method gets executed before code generation.
     * 
     * @throws GenerationException
     */
    protected void preGeneration() throws GenerationException {
    }

    /**
     * This method gets executed after code generation.
     * 
     * @throws GenerationException
     */
    protected void postGeneration() throws GenerationException {
    }

    /**
     * The <code>ServiceGenerator</code> implementation should override this method to provide a custom class name
     * (fully qualified).
     * 
     * @return The class name for the service class being generated
     */
    protected String getClassName() {
        return this.serviceDefinition.getServiceClass();
    }

    /**
     * The <code>ServiceGenerator</code> implementation should override this method to customize the class level
     * javadoc.
     * 
     * @param jdoc
     */
    protected void generateClassJavadoc(JDocComment jdoc) {
        addJavadoc(jdoc);
    }

    /**
     * The <code>ServiceGenerator</code> implementation should override this method to add code to the class's body, eg.
     * to add class variable. This is called first in the generation flow.
     * 
     * @param cls
     * @throws GenerationException
     */
    protected void preGenerateClassBody(JDefinedClass cls) throws GenerationException {
    }

    /**
     * The <code>ServiceGenerator</code> implementation should override this method to add code to the class's body, eg.
     * to add a private method at the bottom of the class. This is called last in the generation flow.
     * 
     * @param cls
     * @throws GenerationException
     */
    protected void postGenerateClassBody(JDefinedClass cls) throws GenerationException {
    }

    /**
     * The <code>ServiceGenerator</code> implementation should override this method to add code to the default
     * constructor's body.
     * 
     * @param body The Java code block represents the default constructor's body
     * @throws GenerationException
     */
    protected void generateDefaultConstructorBody(JBlock body) throws GenerationException {
    }

    /**
     * Overwrite and return false if your Service Class does not have a default constructor.
     * 
     * @return true if this Service Class has a default constructor, or false if it does not
     */
    protected boolean hasDefaultConstructor() {
        return true;
    }

    /**
     * The <code>ServiceGenerator</code> implementation should override this method to add code to the operation's body.
     * 
     * @param method The <code>JMethod</code> object for this method.
     * @param body The Java code block represents the operation's body.
     * @param operationName The operation name for this method.
     * @param inputJTypeMap The map which the key of the map is the parameter name and value is the JType.
     * @param outputJType The JType represents the output.
     * @param overloadCount Sequence number of overloaded method, or null if not overloaded.
     * @throws GenerationException
     */
    protected void generateOperationMethodBody(JMethod method, JBlock body, String operationName, Map<String, JType> inputJTypeMap,
        ElementType outputType, JType outputJType, Integer overloadCount) throws GenerationException {// salesforce
    }

    /**
     * Return true if the underlying service needs to be re-generated, false otherwise.
     * 
     * @param srcLastModified The last time the service src was modified, in milliseconds since the epoch.
     * 
     * @return true if service is up to date, false if it needs to be re-generated.
     */
    public boolean isUpToDate(long srcLastModified) {
        if (srcLastModified == 0) {
            return false;
        }

        com.wavemaker.tools.io.File f = this.configuration.getOutputDirectory().getFile(StringUtils.classNameToSrcFilePath(getClassName()));
        if (!f.exists()) {
            return false;
        }
        return srcLastModified <= f.getLastModified();
    }

    protected List<List<ElementType>> getOverloadedVersions(String operationName) {
        return Collections.emptyList();
    }

    /**
     * Generates service stubs.
     * 
     * @throws GenerationException
     */
    @SuppressWarnings("deprecation")
    public void generate() throws GenerationException {

        preGeneration();

        JDefinedClass serviceCls = generateClass();

        preGenerateClassBody(serviceCls);

        generateClassJavadoc(serviceCls.javadoc());

        if (hasDefaultConstructor()) {
            JMethod defaultConst = generateDefaultConstructor(serviceCls);
            JBlock defaultConstBody = defaultConst.body();
            generateDefaultConstructorBody(defaultConstBody);
        }

        List<String> operationNames = this.serviceDefinition.getOperationNames();

        if (this.logger.isDebugEnabled()) {
            this.logger.debug("Generating service class with operations: " + operationNames);
        }

        for (int i = 0; i < operationNames.size(); i++) {
            String operationName = operationNames.get(i);
            List<ElementType> inputTypes = getInputTypes(operationName);
            generateOperationMethod(serviceCls, operationName, inputTypes, null);

            // add overloaded versions for this method
            int j = 0;
            List<List<ElementType>> overloadedVersions = getOverloadedVersions(operationName);
            for (List<ElementType> overloadedInputTypes : overloadedVersions) {
                generateOperationMethod(serviceCls, operationName, overloadedInputTypes, j++);
            }

        }

        postGenerateClassBody(serviceCls);

        try {
            // TODO - I suspect this will need to be re-written for CF, so let's cheat for now
            // cftempfix
            Folder dir = this.configuration.getOutputDirectory();
            if (dir instanceof LocalFolder) {
                File dest = ((LocalFolder) dir).getOriginalResource();
                this.codeModel.build(dest, dest, null);
            } else {
                File f = IOUtils.createTempDirectory("dataService_directory", null);
                this.codeModel.build(f, f, null);
                Folder folder = new LocalFolder(f);
                folder.copyContentsTo(this.configuration.getOutputDirectory());
            }
        } catch (IOException e) {
            throw new GenerationException("Unable to write service stub", e);
        }

        postGeneration();
    }

    protected List<ElementType> getInputTypes(String operName) {
        return this.serviceDefinition.getInputTypes(operName);
    }

    protected JDefinedClass generateClass() throws GenerationException {
        String serviceClsName = getClassName();

        JDefinedClass serviceCls = null;
        try {
            serviceCls = this.codeModel._class(serviceClsName);
        } catch (JClassAlreadyExistsException e) {
            throw new GenerationException("Java class " + serviceClsName + " already exists", e);
        }

        return serviceCls;
    }

    protected JMethod generateDefaultConstructor(JDefinedClass serviceCls) throws GenerationException {
        JMethod constructor = serviceCls.constructor(JMod.PUBLIC);
        return constructor;
    }

    @SuppressWarnings("deprecation")
    protected void generateOperationMethod(JDefinedClass serviceCls, String operationName, List<ElementType> inputTypes, Integer overloadCount)
        throws GenerationException {

        ElementType outputType1 = this.serviceDefinition.getOutputType(operationName);
        ElementType outputType = getAdjustedOutputType(outputType1);

        JType outputJType = getAdjustedJType(outputType);

        Map<String, JType> inputJTypeMap = new LinkedHashMap<String, JType>();
        JMethod method = serviceCls.method(JMod.PUBLIC, outputJType, operationName);
        for (ElementType inputType : inputTypes) {
            JType paramJType = getJType(inputType);
            String paramName = inputType.getName();
            method.param(paramJType, paramName);
            inputJTypeMap.put(paramName, paramJType);
        }

        addAdditionalInputParams(method, operationName);

        JBlock body = method.body();

        JTryBlock tryBlock = null;

        if (this.useNDCLogging) {
            tryBlock = body._try();
            body = tryBlock.body();
            body.staticInvoke(this.codeModel.ref(NDC.class), NDC_PUSH).arg(getClassName() + "." + operationName);
        }

        generateOperationMethodBody(method, body, operationName, inputJTypeMap, outputType, outputJType, overloadCount);// salesforce

        if (this.useNDCLogging) {
            tryBlock._finally().block().staticInvoke(this.codeModel.ref(NDC.class), NDC_POP);
        }
    }

    protected JType getJType(ElementType elementType) throws GenerationException {
        try {
            if (elementType == null) {
                return this.codeModel.VOID;
            } else if (elementType.isList()) {
                return getGenericListType(elementType.getJavaType());
            } else {
                return this.codeModel.parseType(elementType.getJavaType());
            }
        } catch (ClassNotFoundException e) {
            // this should never get thrown!
            throw new GenerationException(e);
        }
    }

    protected JType getAdjustedJType(ElementType elementType) throws GenerationException {
        try {
            if (elementType == null) {
                return this.codeModel.VOID;
            } else if (elementType.isList()) {
                // return getGenericListType(elementType.getJavaType());
                return getGenericListType(getOutputJavaType(elementType));
            } else {
                // return codeModel.parseType(elementType.getJavaType());
                return this.codeModel.parseType(getOutputJavaType(elementType));
            }
        } catch (ClassNotFoundException e) {
            // this should never get thrown!
            throw new GenerationException(e);
        }
    }

    protected JType getGenericListType(String type) throws ClassNotFoundException {
        return GenerationUtils.getGenericCollectionType(this.codeModel, List.class.getName(), type);
    }

    protected void addJavadoc(JDocComment jdoc) {
        jdoc.add(" Operations for service \"" + this.serviceDefinition.getServiceId() + "\"\n" + StringUtils.getFormattedDate());
    }

    // If maniopulation of the generated java type is needed, extend this class and override this method.
    protected String getOutputJavaType(ElementType outputType) {
        return outputType.getJavaType();
    }

    /**
     * Implement this method if any Java classes need to be modified after they are generated at the end of the partner
     * web service import process.
     * 
     * @param path the full path pointing to the directory where generated Java classes reside
     * @throws GenerationException if any File IO error or other exceptions are encountered
     */
    protected abstract void afterClassGeneration(String path) throws GenerationException;

    /**
     * One of the most important artifacts generated during partner web service import is the service invocation class.
     * The name of this class is usually <i>servicename</i>.<code>java</code> (with the first letter upper case, no
     * underscores and no spaces). In the constructor of this class, the REST service caller must be instantiated.
     * WaveMaker provides the default service caller (<code>RESTService</code>). In case that a partner needs to create
     * their own REST caller, the developer must extend <code>RESTService</code> and override default methods, which in
     * turn, requires the refernce to the REST service caller in the service invocation class to be changed. This method
     * should be implemented to instantiate the customized REST service caller in that case.
     * 
     * 
     * @param cls represents the Java class being generated
     * @param codeModel the root of the code DOM
     * @return the field variable for the instantiated REST service caller
     */
    protected abstract JFieldVar defineRestServiceVariable(JDefinedClass cls, JCodeModel codeModel);

    /**
     * In case that a customized RET service caller is used on behalf of the default service caller, the service
     * invoication line in the service invocation class must properly typed. It can be done by implementing this method.
     * 
     * 
     * @param codeModel the root of the code DOM
     * @return the object that represents a method invocation
     */
    protected abstract JInvocation defineServiceInvocation(JCodeModel codeModel);

    /**
     * Developers may implement this method to add. modify or delete input parameters in the the default parameter list
     * for the service call.
     * 
     * @param body the block of Java code to be modified, which includes input parameter definitions
     * @param serviceInfo the service information object
     * @param wsdl represents the current WSDL
     * @param operationName the operation name
     * @return the block of Java code modified
     */
    protected abstract JBlock addExtraInputParameters(JBlock body, ServiceInfo serviceInfo, WSDL wsdl, String operationName);

    /**
     * Implement this method if the output type of the service invocation method, which is originated from WSDL, needs
     * to be customized for any reason.
     * 
     * @param type the output element type to be modified
     * @return the output element type
     */
    protected ElementType getAdjustedOutputType(ElementType type) {
        return type;
    }

    // Sunclasses may override this method if additional input parameters need to be added
    protected void addAdditionalInputParams(JMethod method, String operationName) {
    }

    public void setSmdContent(String smdContent) {
        try {
            this.smdObject = new JSONObject(smdContent);
        } catch (JSONException ex) {
            this.smdObject = null;
        }
    }
}
