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

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.hibernate.tool.hbm2x.GenericExporter;
import org.hibernate.tool.hbm2x.TemplateProducer;

import com.wavemaker.common.util.ClassLoaderUtils;
import com.wavemaker.common.util.IOUtils;
import com.wavemaker.common.util.SpringUtils;
import com.wavemaker.common.util.StringUtils;
import com.wavemaker.common.util.XMLUtils;
import com.wavemaker.common.util.XMLWriter;
import com.wavemaker.runtime.data.util.DataServiceConstants;
import com.wavemaker.tools.common.ConfigurationException;
import com.wavemaker.tools.data.util.DataServiceUtils;

/**
 * @author Simon Toens
 * @author Jeremy Grelle
 */
public class HibernateSpringConfigExporter extends GenericExporter {

    private static final String TEMPLATE = "/com/wavemaker/tools/data/SpringConfig.ftl";

    private static final String DEFAULT_QUERIES_FILE = "com/wavemaker/tools/data/DefaultQueries.ql.xml";

    private final String serviceName;

    private final String dataPackage;

    private final String serviceClass;

    private final boolean useIndividualCRUDOperations;

    private final boolean impersonateUser;

    private final String activeDirectoryDomain;

    public HibernateSpringConfigExporter(String serviceName, String packageName, String dataPackage, String serviceClass,
        boolean useIndividualCRUDOperations, boolean impersonateUser, String activeDirectoryDomain) {

        this.serviceName = serviceName;
        this.dataPackage = dataPackage;
        this.serviceClass = StringUtils.fq(packageName, serviceClass);
        this.useIndividualCRUDOperations = useIndividualCRUDOperations;
        this.impersonateUser = impersonateUser;
        this.activeDirectoryDomain = activeDirectoryDomain;

        setTemplateName(TEMPLATE);
    }

    @Override
    public void doStart() {

        File path = new File(getOutputDirectory(), DataServiceUtils.getCfgFileName(this.serviceName));

        TemplateProducer producer = new TemplateProducer(getTemplateHelper(), getArtifactCollector());

        Map<String, Context> additionalContext = new HashMap<String, Context>(1);

        Context ctx = new Context(this.serviceName, this.serviceClass, this.impersonateUser, this.activeDirectoryDomain);

        try {

            additionalContext.put(GenerationContext.CONTEXT_NAME, ctx);

            producer.produce(additionalContext, getTemplateName(), path, getTemplateName());

        } finally {
            ctx.dispose();
        }
    }

    @Override
    public String getName() {
        return "Spring Configuration Exporter";
    }

    public class Context extends GenerationContext {

        private final String serviceClass;

        private final boolean impersonateUser;

        private final String activeDirectoryDomain;

        Context(String serviceName, String serviceClass, boolean impersonateUser, String activeDirectoryDomain) {

            super(serviceName, getConfiguration(), HibernateSpringConfigExporter.this.useIndividualCRUDOperations);
            this.serviceClass = XMLUtils.escape(serviceClass);
            this.impersonateUser = impersonateUser;
            this.activeDirectoryDomain = activeDirectoryDomain;
        }

        public String getServiceClass() {
            return this.serviceClass;
        }

        public String getHbmFiles() {
            List<Class<?>> entityClasses = this.def.getMetaData().getEntityClasses();
            return getFileList(entityClasses, DataServiceConstants.HBM_EXT, false);
        }

        public String getQueryFiles() {
            List<Class<?>> entityClasses = DataServiceUtils.getTypesForGeneratedQueries(this.def.getMetaData());
            return getFileList(entityClasses, DataServiceConstants.QUERY_EXT, true);
        }

        public boolean isImpersonateUser() {
            return this.impersonateUser;
        }

        public String getActiveDirectoryDomain() {
            return this.activeDirectoryDomain != null ? this.activeDirectoryDomain : "";
        }

        private String getFileList(List<Class<?>> entityClasses, String ext, boolean addDefaultQueryFile) {

            Collection<String> fileNames = new HashSet<String>(entityClasses.size());

            StringWriter sw = new StringWriter();
            XMLWriter xmlWriter = XMLUtils.newXMLWriter(new PrintWriter(sw));

            for (Class<?> c : entityClasses) {
                String s = StringUtils.packageToSrcFilePath(c.getName());
                fileNames.add(StringUtils.fromLastOccurrence(s, "/"));
                xmlWriter.addElement(SpringUtils.VALUE_ELEMENT, s + ext);
            }

            if (addDefaultQueryFile) {
                String relPath = StringUtils.packageToSrcFilePath(HibernateSpringConfigExporter.this.dataPackage);
                relPath = addDefaultQueriesFile(fileNames, relPath);
                xmlWriter.addElement(SpringUtils.VALUE_ELEMENT, relPath);
            }

            xmlWriter.finish();

            return sw.toString();
        }
    }

    private String addDefaultQueriesFile(Collection<String> reservedNames, String relPath) {

        InputStream is = null;
        OutputStream os = null;

        try {

            is = ClassLoaderUtils.getResourceAsStream(DEFAULT_QUERIES_FILE);

            String name = DataServiceUtils.getDefaultQueryFileName(reservedNames);

            name = relPath + "/" + name;

            File f = new File(getOutputDirectory(), name);

            f.getParentFile().mkdirs();

            os = new FileOutputStream(f);

            IOUtils.copy(is, os);

            return name;

        } catch (IOException ex) {
            throw new ConfigurationException(ex);
        } finally {
            try {
                is.close();
            } catch (Exception ignore) {
            }
            try {
                os.close();
            } catch (Exception ignore) {
            }
        }
    }
}
