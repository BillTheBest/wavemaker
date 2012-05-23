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

package com.wavemaker.tools.data;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.TreeSet;
import java.util.concurrent.Callable;

import com.wavemaker.common.CommonConstants;
import com.wavemaker.common.NotYetImplementedException;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.ObjectUtils;
import com.wavemaker.common.util.StringUtils;
import com.wavemaker.runtime.RuntimeAccess;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.client.TreeNode;
import com.wavemaker.runtime.data.DataServiceDefinition;
import com.wavemaker.runtime.data.DataServiceOperation;
import com.wavemaker.runtime.data.ExternalDataModelConfig;
import com.wavemaker.runtime.data.Input;
import com.wavemaker.runtime.data.util.DataServiceConstants;
import com.wavemaker.runtime.data.util.DataServiceUtils;
import com.wavemaker.runtime.data.util.QueryRunner;
import com.wavemaker.runtime.service.definition.DeprecatedServiceDefinition;
import com.wavemaker.tools.common.ConfigurationException;
import com.wavemaker.tools.compiler.ProjectCompiler;
import com.wavemaker.tools.data.parser.BaseHbmParser;
import com.wavemaker.tools.data.parser.HbmParser;
import com.wavemaker.tools.data.parser.HbmQueryParser;
import com.wavemaker.tools.data.parser.HbmQueryWriter;
import com.wavemaker.tools.data.parser.HbmWriter;
import com.wavemaker.tools.data.spring.SpringService;
import com.wavemaker.tools.io.File;
import com.wavemaker.tools.io.Folder;
import com.wavemaker.tools.io.local.LocalFolder;
import com.wavemaker.tools.project.ProjectManager;
import com.wavemaker.tools.project.StudioFileSystem;
import com.wavemaker.tools.service.AbstractFileService;
import com.wavemaker.tools.service.ClassLoaderFactory;
import com.wavemaker.tools.service.DefaultClassLoaderFactory;
import com.wavemaker.tools.service.DesignServiceManager;
import com.wavemaker.tools.service.FileService;
import com.wavemaker.tools.service.codegen.ServiceDataObjectGenerator;
import com.wavemaker.tools.service.definitions.Service;
import com.wavemaker.tools.util.ResourceClassLoaderUtils;

/**
 * Manages a single Hibernate Data Model.
 * 
 * @author Simon Toens
 * @author Jeremy Grelle
 */
public class DataModelConfiguration {

    public static interface UpdateCallback {

        public void update(DataServiceDefinition dataServiceDefinition);
    }

    private static final String BACKUP_SUFFIX = ".bak";

    // writes new types for "select" queries
    private final OperationWrapperGenerator generator = new OperationWrapperGenerator();

    // data model name (same as serviceId)
    private final String name;

    // used for reading and writing files
    private final FileService fileService;

    // for initializing Hibernate
    private final ClassLoaderFactory classLoaderFactory;

    // relative path to dir containing cfg file
    private final String cfgPath;

    // cfg file name
    private final String cfgFileName;

    private final File cfgFile;

    // used for loading configuration data that is stored
    // externally
    private final ExternalDataModelConfig externalConfig;

    private final DataServiceSpringConfiguration springConfiguration;

    // data objects package
    private String dataPackage = null;

    // =================================================
    // entity related mappings

    // entity name to path of mapping file
    private final Map<String, String> entityNameToPath = new HashMap<String, String>();

    // entity name to EntityInfo
    private final Map<String, EntityInfo> entityInfos = new HashMap<String, EntityInfo>();

    private final Map<String, HbmParser> entityNameToHbmParser = new HashMap<String, HbmParser>();

    // value type name to TypeInfo
    private final Map<String, TypeInfo> valueTypes = new HashMap<String, TypeInfo>();

    // helper types (query output wrappers)
    private final Map<String, BeanInfo> outputTypes = new HashMap<String, BeanInfo>();

    private final Collection<EntityInfo> modifiedEntityInfos = new HashSet<EntityInfo>();

    // path to deleted entity
    private final Collection<String> deletedEntities = new HashSet<String>();

    // BaseHbmParser to path (has query and mapping parsers)
    private final Map<BaseHbmParser, String> parserToPath = new HashMap<BaseHbmParser, String>();

    // path to deleted data objects
    private final Collection<String> deletedTypes = new HashSet<String>();

    // =================================================
    // query related mappings

    private final List<String> queryFiles = new ArrayList<String>();

    // query name to QueryInfo
    private Map<String, QueryInfo> queryNameToQueryInfo = null;

    // for modifications
    // query name -> mapping-element - for modifying existing queries
    private Map<String, HbmQueryParser> queryNameToParser = null;

    // single mapping element for unknown output type
    private HbmQueryParser defaultQueryParser = null;

    // for writing
    // set of modified mapping elements
    private final Collection<HbmQueryParser> modifiedQueryParsers = new HashSet<HbmQueryParser>();

    // to keep track of what queries have been added, changed
    // used for logging
    private final Collection<String> modifiedQueryNames = new HashSet<String>();

    // path to deleted query file
    private final Collection<String> deletedQueries = new HashSet<String>();

    private final Collection<String> deletedSFQueries = new HashSet<String>(); // salesforce

    private final Collection<String> deletedSFDataObjects = new HashSet<String>(); // salesforce

    private StudioFileSystem fileSystem;

    private ProjectCompiler projectCompiler;

    private ProjectManager projMgr;

    // =================================================

    private final Collection<String> writtenBackupFiles = new HashSet<String>();

    public DataModelConfiguration(File cfgFile, FileService fileService, String serviceId, ExternalDataModelConfig externalConfig,
        ClassLoaderFactory classLoaderFactory) throws IOException {

        this.name = serviceId;
        this.cfgFile = cfgFile;
        this.cfgFileName = cfgFile.getName();
        this.cfgPath = DesignServiceManager.getRuntimeRelativeDir(serviceId);
        this.fileService = fileService;
        this.externalConfig = externalConfig;
        this.classLoaderFactory = classLoaderFactory;
        this.springConfiguration = new DataServiceSpringConfiguration(fileService, this.cfgPath, this.cfgFile, serviceId);
        this.projMgr = (ProjectManager) RuntimeAccess.getInstance().getSession().getAttribute(DataServiceConstants.CURRENT_PROJECT_MANAGER);

        this.projectCompiler = (ProjectCompiler) RuntimeAccess.getInstance().getSpringBean("projectCompiler");
        this.fileSystem = (StudioFileSystem) RuntimeAccess.getInstance().getSpringBean("fileSystem");

        if (!serviceId.equals(CommonConstants.SALESFORCE_SERVICE)) {
            setup();
        } else {
            setup_SF();
        }
    }

    // public DataModelConfiguration(StudioFileSystem fileSystem, Resource springConfig) {
    // this(fileSystem, springConfig, com.wavemaker.tools.data.util.DataServiceUtils.getDummyExternalConfig());
    // }

    public DataModelConfiguration(File springConfig) {
        this(springConfig, com.wavemaker.tools.data.util.DataServiceUtils.getDummyExternalConfig());
    }

    public DataModelConfiguration(File springConfig, ClassLoaderFactory classLoaderFactory) {
        this(springConfig, com.wavemaker.tools.data.util.DataServiceUtils.getDummyExternalConfig(), classLoaderFactory);
    }

    // public DataModelConfiguration(StudioFileSystem fileSystem, Resource springConfig, ExternalDataModelConfig
    // externalConfig) {
    // this(fileSystem, springConfig, externalConfig, new DefaultClassLoaderFactory(springConfig.getParentFile()), new
    // DefaultCompileService(
    // springConfig.getParentFile()));
    // }

    // public DataModelConfiguration(Resource springConfig, ExternalDataModelConfig externalConfig) {
    // this(springConfig, externalConfig, new DefaultClassLoaderFactory(fileSystem.getParent(springConfig)));
    // }

    public DataModelConfiguration(File springConfig, ExternalDataModelConfig externalConfig) {
        this.projectCompiler = (ProjectCompiler) RuntimeAccess.getInstance().getSpringBean("projectCompiler");
        this.fileSystem = (StudioFileSystem) RuntimeAccess.getInstance().getSpringBean("fileSystem");
        this.name = StringUtils.fromFirstOccurrence(springConfig.getName(), ".", -1);
        // this.cfgPath = ".";
        this.cfgPath = "";
        this.cfgFile = springConfig;
        this.cfgFileName = springConfig.getName();
        final Folder baseDir = springConfig.getParent();
        this.classLoaderFactory = new DefaultClassLoaderFactory(springConfig.getParent());
        this.externalConfig = externalConfig;
        this.projMgr = (ProjectManager) RuntimeAccess.getInstance().getSession().getAttribute(DataServiceConstants.CURRENT_PROJECT_MANAGER);

        this.fileService = new AbstractFileService() {

            @Override
            public Folder getFileServiceRoot() {
                return baseDir;
            }
        };

        this.springConfiguration = new DataServiceSpringConfiguration(this.fileService, this.cfgPath, this.cfgFile, this.name);

        setup();
    }

    public DataModelConfiguration(File springConfig, ExternalDataModelConfig externalConfig, ClassLoaderFactory classLoaderFactory) {
        this.projectCompiler = (ProjectCompiler) RuntimeAccess.getInstance().getSpringBean("projectCompiler");
        this.fileSystem = (StudioFileSystem) RuntimeAccess.getInstance().getSpringBean("fileSystem");
        this.name = StringUtils.fromFirstOccurrence(springConfig.getName(), ".", -1);
        // this.cfgPath = ".";
        this.cfgPath = "";
        this.cfgFile = springConfig;
        this.cfgFileName = springConfig.getName();
        final Folder baseDir = springConfig.getParent();
        this.classLoaderFactory = classLoaderFactory;
        this.externalConfig = externalConfig;
        this.fileSystem = this.fileSystem;
        this.projMgr = (ProjectManager) RuntimeAccess.getInstance().getSession().getAttribute(DataServiceConstants.CURRENT_PROJECT_MANAGER);

        this.fileService = new AbstractFileService() {

            @Override
            public Folder getFileServiceRoot() {
                return baseDir;
            }
        };

        this.springConfiguration = new DataServiceSpringConfiguration(this.fileService, this.cfgPath, this.cfgFile, this.name);

        setup();
    }

    // Mapping accessors
    // --------------------------------------------------------

    public Collection<String> getEntityNames() {
        return new TreeSet<String>(this.entityInfos.keySet());
    }

    public Collection<EntityInfo> getEntities() {
        return this.entityInfos.values();
    }

    public Collection<TypeInfo> getValueTypes() {
        return this.valueTypes.values();
    }

    public Collection<BeanInfo> getOtherTypes() {
        return this.outputTypes.values();
    }

    public BeanInfo getBean(String beanName) {
        return this.outputTypes.get(beanName);
    }

    public EntityInfo getEntity(String entity) {
        EntityInfo rtn = this.entityInfos.get(entity);
        if (rtn == null) {
            throw new ConfigurationException("Unknown entity: " + entity);
        }
        return rtn;
    }

    public String getEntityName(String javaType) {

        // questionable logic to get the type name
        // for a given java type
        return StringUtils.splitPackageAndClass(javaType).v2;
    }

    public boolean isKnownType(String javaType) {
        String s = getEntityName(javaType);
        return this.entityInfos.containsKey(s) || this.valueTypes.containsKey(s) || this.outputTypes.containsKey(s);
    }

    public boolean isEntityType(String javaType) {
        String s = getEntityName(javaType);
        return this.entityInfos.containsKey(s);
    }

    public boolean isValueType(String javaType) {
        String s = getEntityName(javaType);
        return this.valueTypes.containsKey(s);
    }

    public boolean isHelperType(String javaType) {
        String s = getEntityName(javaType);
        return this.outputTypes.containsKey(s);
    }

    public Collection<String> getPropertyNames(String entity) {
        return getEntity(entity).getPropertyNames();
    }

    public Collection<PropertyInfo> getProperties(String entity) {
        return getEntity(entity).getProperties();
    }

    public PropertyInfo getProperty(String entity, String property) {
        return getEntity(entity).getProperty(property);
    }

    public Collection<PropertyInfo> getRelatedProperties(String entity) {
        return getEntity(entity).getRelatedProperties();
    }

    public Collection<ColumnInfo> getColumns(String entity) {
        return getEntity(entity).getColumns();
    }

    public Map<String, ColumnInfo> getColumnsMap(String entity) {
        Collection<ColumnInfo> cols = getColumns(entity);
        Map<String, ColumnInfo> rtn = new LinkedHashMap<String, ColumnInfo>(cols.size());
        for (ColumnInfo c : cols) {
            rtn.put(c.getName(), c);
        }
        return rtn;
    }

    public ColumnInfo getColumn(String entity, String property) {
        return getProperty(entity, property).getColumn();
    }

    public ColumnInfo getColumn(String entity, String parentProperty, String property) {
        PropertyInfo parent = getProperty(entity, parentProperty);

        PropertyInfo p = parent.getCompositeProperty(property);
        if (p == null) {
            throw new ConfigurationException("Unkown property " + property + " on " + parentProperty);
        }
        return p.getColumn();
    }

    public Collection<String> getQueryNames() {
        return new TreeSet<String>(getHibernateQueries().keySet());
    }

    public Collection<QueryInfo> getQueries() {
        return getHibernateQueries().values();
    }

    public QueryInfo getQuery(String queryName) {
        return getHibernateQueries().get(queryName);
    }

    public QueryInfo getQueryByOperationName(String operationName) {
        QueryInfo rtn = getQuery(operationName);
        if (rtn == null) {
            operationName = DataServiceUtils.operationToQueryName(operationName, getHibernateQueries().keySet());
        }
        return getQuery(operationName);
    }

    public void updateQuery(QueryInfo queryInfo) {

        if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
            DataServiceLoggers.parserLogger.debug("updateQuery: " + queryInfo.getName() + " " + "inputs: "
                + ObjectUtils.toString(queryInfo.getInputs()) + " " + "single result: " + queryInfo.getReturnsSingleResult());
        }

        if (!queryInfo.getIsHQL()) {
            throw new NotYetImplementedException("Can only add HQL queries " + "for now");
        }

        if (queryInfo.getName() == null) {
            throw new IllegalArgumentException("Query must have a name set");
        }

        if (!StringUtils.isValidJavaIdentifier(queryInfo.getName())) {
            throw new ConfigurationException("Query name must be a valid Java identifier");
        }

        // make sure queries are initialized
        getHibernateQueries();

        HbmQueryParser parser = getParserForQuery(queryInfo);

        if (parser == null) {
            throw new AssertionError("Parser cannot be null");
        }

        // for DML operations, force single result
        if (DataServiceUtils.isDML(queryInfo.getQuery())) {
            if (!queryInfo.getReturnsSingleResult()) {
                if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                    DataServiceLoggers.parserLogger.info("updateQuery: " + queryInfo.getName() + " is a DML operation, setting "
                        + " returns single result");
                }
                queryInfo.setReturnsSingleResult(true);
            }
        }

        // updated by user, so no longer generated
        queryInfo.setIsGenerated(false);

        parser.getQueries().put(queryInfo.getName(), queryInfo);

        this.modifiedQueryParsers.add(parser);
        this.modifiedQueryNames.add(queryInfo.getName());
        this.queryNameToQueryInfo.put(queryInfo.getName(), queryInfo);
        this.queryNameToParser.put(queryInfo.getName(), parser);
    }

    public void addUserQueries(Collection<QueryInfo> queries) {

        for (QueryInfo q : queries) {
            if (!q.getIsGenerated()) {
                updateQuery(q);
            }
        }

    }

    public QueryInfo deleteQuery(String queryName) {
        return deleteQuery(queryName, false);
    }

    public QueryInfo deleteQuery(String queryName, boolean skipIfNotExists) {

        if (ObjectUtils.isNullOrEmpty(queryName)) {
            throw new IllegalArgumentException("queryName must be set");
        }

        // init
        getHibernateQueries();

        QueryInfo rtn = this.queryNameToQueryInfo.remove(queryName);

        if (rtn == null) {
            if (skipIfNotExists) {
                return null;
            } else {
                throw new IllegalArgumentException("Uknown query: " + queryName);
            }
        }

        this.modifiedQueryNames.remove(queryName);
        HbmQueryParser p = this.queryNameToParser.remove(queryName);
        this.modifiedQueryParsers.remove(p);

        p.getQueries().remove(queryName);

        if (p.getQueries().isEmpty() && p != this.defaultQueryParser) {
            p.close();
            String path = this.parserToPath.remove(p);
            this.deletedQueries.add(path);
            removeMappingFromSpringFile(path);
        } else {
            this.modifiedQueryParsers.add(p);
        }

        String outputType = rtn.getOutputType();

        // if it is one of our generated types, it lives in the output
        // package
        if (outputType != null && DataServiceUtils.isOutputType(outputType)) {
            this.deletedQueries.add(StringUtils.classNameToSrcFilePath(outputType));
            this.deletedSFQueries.add(queryName);
            this.deletedSFDataObjects.add(StringUtils.classNameToSrcFilePath(outputType));
        }

        return rtn;
    }

    public Collection<RelatedInfo> getRelated(String entity) {

        Collection<PropertyInfo> props = getRelatedProperties(entity);
        Collection<RelatedInfo> rtn = new ArrayList<RelatedInfo>(props.size());
        for (PropertyInfo p : props) {
            rtn.add(getRelated(entity, p.getName()));
        }
        return rtn;
    }

    public RelatedInfo getRelated(String entity, String property) {

        PropertyInfo p = getProperty(entity, property);

        String tableName = getEntity(entity).getTableName();
        if (p.getIsInverse()) {
            tableName = getEntity(p.getType()).getTableName();
        }

        return p.toRelated(tableName);
    }

    // End mapping accessors
    // --------------------------------------------------------

    // Start DataModel edit
    // --------------------------------------------------------

    /**
     * Mark all Entities as modified.
     */
    public void touchAllEntities() {
        for (EntityInfo e : getEntities()) {
            touchEntity(e);
        }
    }

    /**
     * Mark an Entity as modified.
     */
    public void touchEntity(EntityInfo entity) {
        this.modifiedEntityInfos.add(entity);
    }

    /**
     * Mark the Entity with given name as modified.
     */
    public void touchEntity(String entityName) {
        touchEntity(getEntity(entityName));
    }

    public void addValueType(TypeInfo typeInfo) {

        if (typeInfo == null) {
            throw new IllegalArgumentException("typeInfo must be set");
        }

        this.valueTypes.put(typeInfo.getName(), typeInfo);
    }

    public void deleteValueType(String valueTypeName) {

        if (ObjectUtils.isNullOrEmpty(valueTypeName)) {
            throw new IllegalArgumentException("valueTypeName must be set");
        }

        TypeInfo t = this.valueTypes.remove(valueTypeName);
        if (t == null) {
            throw new IllegalArgumentException("Unknown value type " + valueTypeName);
        }

        String path = getRelServicePath(StringUtils.classNameToSrcFilePath(t.getFullyQualifiedName()));

        this.deletedTypes.add(path);
    }

    // public void deleteEntity(String entityName) {
    // deleteEntity(entityName, false, null);
    // }

    // public void deleteEntity(String entityName, boolean updateReferences,
    // String newEntityName) {
    public void deleteEntity(String entityName) {

        if (ObjectUtils.isNullOrEmpty(entityName)) {
            throw new IllegalArgumentException("entityName must be set");
        }

        EntityInfo ei = this.entityInfos.remove(entityName);

        if (ei == null) {
            throw new IllegalArgumentException("Unknown entity: " + entityName);
        }

        this.modifiedEntityInfos.remove(ei);

        BaseHbmParser p = this.entityNameToHbmParser.remove(entityName);
        p.close();
        this.parserToPath.remove(p);
        String path = this.entityNameToPath.remove(entityName);
        removeMappingFromSpringFile(path);
        this.deletedEntities.add(path);

        String s = getRelServicePath(StringUtils.fromLastOccurrence(path, DataServiceConstants.HBM_EXT, -1));
        this.deletedTypes.add(s);

        // if (updateReferences) {
        // updateReferences(entityName, newEntityName, ei
        // .getRelatedProperties());
        // } else {
        deleteReferences(entityName, ei.getRelatedProperties());
        // }
    }

    private void replaceEntity(String entityName, String newEntityName) {

        if (ObjectUtils.isNullOrEmpty(entityName)) {
            throw new IllegalArgumentException("entityName must be set");
        }

        EntityInfo ei = this.entityInfos.remove(entityName);
        this.modifiedEntityInfos.remove(ei);

        ei.setEntityName(newEntityName);
        this.entityInfos.put(newEntityName, ei);

        String oldPkgName = StringUtils.packageToSrcFilePath(ei.getPackageName()) + "/" + entityName + DataServiceConstants.HBM_EXT;
        String newPkgName = StringUtils.packageToSrcFilePath(ei.getPackageName()) + "/" + newEntityName + DataServiceConstants.HBM_EXT;
        File oldf = getProjectRootFolder().getFile(getRelServicePath(oldPkgName));
        File newf = getProjectRootFolder().getFile(getRelServicePath(newPkgName));

        oldf.rename(newf.toString());

        String content = newf.getContent().asString();

        content = content.replace(entityName, newEntityName);
        // FileUtils.writeStringToFile(newf, content, ServerConstants.DEFAULT_ENCODING);
        newf.getContent().write(content);

        removeMappingFromSpringFile(oldPkgName);

        addEntityToSpringFile(newPkgName);

        this.modifiedEntityInfos.add(ei);

        BaseHbmParser p = this.entityNameToHbmParser.remove(entityName);
        this.entityNameToHbmParser.put(newEntityName, (HbmParser) p);
        // p.close();
        this.parserToPath.remove(p);
        this.parserToPath.put(p, newPkgName);
        this.entityNameToPath.remove(entityName);
        this.entityNameToPath.put(newEntityName, newPkgName);
        this.deletedEntities.add(oldPkgName);

        String s = getRelServicePath(StringUtils.fromLastOccurrence(oldPkgName, DataServiceConstants.HBM_EXT, -1));
        this.deletedTypes.add(s);

        // Try to delete system generated queries if any.
        String qryName = "get" + entityName + "ById";
        deleteQuery(qryName, true);

        updateReferences(entityName, newEntityName, ei.getRelatedProperties());
    }

    /*
     * private String getProjectRoot() { // ProjectManager projMgr = (ProjectManager) //
     * RuntimeAccess.getInstance().getSession().getAttribute(DataServiceConstants.CURRENT_PROJECT_MANAGER); String
     * projRoot; try { projRoot = this.projMgr.getCurrentProject().getProjectRoot().getURI().toString(); } catch
     * (IOException ex) { throw new WMRuntimeException(ex); }
     * 
     * return projRoot; }
     */

    private Folder getProjectRootFolder() {
        return this.projMgr.getCurrentProject().getRootFolder();
    }

    public void updateEntity(String entityName, EntityInfo entity) {

        if (ObjectUtils.isNullOrEmpty(entityName)) {
            throw new IllegalArgumentException("entityName must be set");
        }

        EntityInfo orig;

        if (getEntityNames().contains(entityName)) {

            if (!entityName.equals(entity.getEntityName())) {

                validateName(entity.getEntityName());

                if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                    DataServiceLoggers.parserLogger.debug(entityName + " Processing entity rename from " + entityName + " to "
                        + entity.getEntityName());
                }

                // deleteEntity(entityName, true, entity.getEntityName());
                replaceEntity(entityName, entity.getEntityName());
                updateEntity(entity.getEntityName(), entity);
                return;
            }

            orig = getEntity(entityName);

            if (orig.isEqualTo(entity)) {
                if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                    DataServiceLoggers.parserLogger.debug(entityName + " has not changed");
                }
                return;
            } else {
                if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                    DataServiceLoggers.parserLogger.debug("Processing entity update for " + entityName);
                }
            }
        } else {

            validateName(entityName);

            orig = new EntityInfo();
            this.entityInfos.put(entityName, orig);
            String path = StringUtils.packageToSrcFilePath(entity.getPackageName()) + "/" + entityName + DataServiceConstants.HBM_EXT;
            this.entityNameToPath.put(entityName, path);

            if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                DataServiceLoggers.parserLogger.debug("Processing entity add for " + entityName + " at " + path);
            }

            addEntityToSpringFile(path);

            // add dummy instance for mapping
            this.entityNameToHbmParser.put(entityName, new HbmParser());

            if (this.dataPackage == null) {
                // adding a new entity to an empty data model
                this.dataPackage = entity.getPackageName();
            }
        }

        String origSchema = orig.getSchemaName();
        String origCatalog = orig.getCatalogName();
        String origPackage = orig.getPackageName();

        orig.update(entity);
        this.modifiedEntityInfos.add(orig);

        propagateSchemaChange(orig, origSchema);
        propagateCatalogChange(orig, origCatalog);
        propagatePackageChange(orig, origPackage);

        setProperties(orig);
    }

    public void updateColumns(String entityName, List<ColumnInfo> columns) {
        updateColumns(entityName, columns, Collections.<PropertyInfo> emptyList());
    }

    public void updateColumns(String entityName, List<ColumnInfo> columns, List<PropertyInfo> properties) {

        EntityInfo ei = getEntity(entityName);

        if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
            DataServiceLoggers.parserLogger.info("Updating columns for " + entityName);
        }

        for (ColumnInfo ci : columns) {
            if (Integer.valueOf(0).equals(ci.getLength())) {
                ci.setLength(null);
            }
            if (Integer.valueOf(0).equals(ci.getPrecision())) {
                ci.setPrecision(null);
            }
        }

        ei.updateColumns(columns, properties, this);

        this.modifiedEntityInfos.add(ei);
    }

    public void updateRelated(String entityName, List<RelatedInfo> related) {

        EntityInfo ei = getEntity(entityName);

        List<PropertyInfo> rels = new ArrayList<PropertyInfo>(related.size());

        for (RelatedInfo ri : related) {

            validateName(ri.getName());

            PropertyInfo p = PropertyInfo.newCompositeProperty();
            p.fromRelated(ri, ei, this);
            rels.add(p);
        }

        Collection<EntityInfo> modifiedMany = ei.updateRelated(rels, this);
        this.modifiedEntityInfos.add(ei);
        this.modifiedEntityInfos.addAll(modifiedMany);

        ei.initFkColumnTypes(this);

        ei.setColumns(initColumns(entityName));
    }

    // End DataModel edit
    // --------------------------------------------------------

    public boolean useIndividualCRUDOperations() {
        return this.springConfiguration.useIndividualCRUDperations();
    }

    public void setRefreshEntities(List<String> refreshEntities) {
        this.springConfiguration.setRefreshEntities(refreshEntities);
    }

    public List<String> getRefreshEntities() {
        return this.springConfiguration.getRefreshEntities();
    }

    public synchronized Properties readConnectionProperties() {
        return readConnectionProperties(true);
    }

    public synchronized Properties readConnectionProperties(boolean removePrefix) {
        return this.springConfiguration.readCombinedProperties(removePrefix);
    }

    public synchronized void writeConnectionProperties(Properties props) {
        String connUrl = props.getProperty(DataServiceConstants.DB_URL_KEY);
        if (!WMAppContext.getInstance().isCloudFoundry()) {
            String projRoot = ((LocalFolder) this.projMgr.getCurrentProject().getWebAppRootFolder()).getOriginalResource().getPath();
            connUrl = StringUtils.replacePlainStr(connUrl, projRoot, DataServiceConstants.WEB_ROOT_TOKEN);
        }
        props.setProperty(DataServiceConstants.DB_URL_KEY, connUrl);

        this.springConfiguration.writeProperties(props);
    }

    public void checkQuery(final String query, final Input[] inputs, final String values) {

        Runnable task = new Runnable() {

            @Override
            public void run() {

                QueryRunner queryRunner = SpringService.initQueryRunner(DataModelConfiguration.this.cfgFile);

                setBindParameters(queryRunner, inputs, values, true);

                try {
                    queryRunner.check(query);
                } finally {
                    queryRunner.dispose();
                }
            }
        };
        ResourceClassLoaderUtils.runInClassLoaderContext(task, this.classLoaderFactory.getClassLoader());
    }

    public Object runQuery(final String query, final Input[] inputs, final String values, final Long maxResults) {

        Callable<Object> task = new Callable<Object>() {

            @Override
            public Object call() {

                QueryRunner queryRunner = SpringService.initQueryRunner(DataModelConfiguration.this.cfgFile);

                setBindParameters(queryRunner, inputs, values, false);

                queryRunner.setMaxResults(maxResults);

                Object rtn = null;

                try {
                    rtn = queryRunner.run(query);
                } catch (Throwable th) {
                    throw DataServiceUtils.unwrap(th);
                } finally {
                    queryRunner.dispose();
                }

                return rtn;
            }
        };

        return ResourceClassLoaderUtils.runInClassLoaderContext(task, this.classLoaderFactory.getClassLoader());
    }

    public void save() {
        save(false);
    }

    public void save(boolean backup) {
        save(backup, com.wavemaker.tools.data.util.DataServiceUtils.NOOP_UPDATE_CALLBACK);
    }

    public void save(UpdateCallback updateCallback) {
        save(true, updateCallback);
    }

    public synchronized void save(boolean backup, UpdateCallback callback) {
        save(backup, callback, false, true);
    }

    public synchronized void save(boolean backup, UpdateCallback callback, boolean forceUpdate, boolean compile) {

        writeCfgFile(backup);

        boolean updateService = forceUpdate;

        if (this.modifiedQueryParsers.isEmpty() && this.deletedQueries.isEmpty()) {
            if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                DataServiceLoggers.parserLogger.info("No modified query, nothing to save");
            }
        } else {
            saveDeletedQueries(backup);
            saveModifiedQueries(backup);
            updateService = true;
        }

        if (this.modifiedEntityInfos.isEmpty() && this.deletedEntities.isEmpty()) {
            if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                DataServiceLoggers.parserLogger.info("No modified entities, nothing to save");
            }
        } else {
            saveModifiedEntities(backup, true);
            saveDeletedEntities(backup);
            updateService = true;
        }

        if (!this.deletedTypes.isEmpty()) {

            deleteTypes(true);

            removeServiceClass();
        }

        if (updateService) {
            if (compile) {
                this.projectCompiler.compile();
            }
            updateService(callback);
        }
    }

    public synchronized void revert() {
        revert(false);
    }

    public synchronized void revert(boolean compile) {

        Collection<String> s = new HashSet<String>(this.writtenBackupFiles);

        for (String path : s) {
            try {
                String original = this.fileService.readFile(path);
                String originalPath = StringUtils.fromLastOccurrence(path, BACKUP_SUFFIX, -1);
                this.fileService.writeFile(originalPath, original);
                this.fileService.deleteFile(path);
                if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                    DataServiceLoggers.parserLogger.info("Reverted " + originalPath + " from backup file");
                }
                this.writtenBackupFiles.remove(path);
            } catch (IOException ex) {
                throw new ConfigurationException(ex);
            }
        }

        this.springConfiguration.revert();

        if (compile) {
            this.projectCompiler.compile();
        }
    }

    public synchronized void removeBackupFiles() {

        Collection<String> s = new HashSet<String>(this.writtenBackupFiles);

        for (String path : s) {
            try {
                this.fileService.deleteFile(path);
            } catch (IOException ex) {
                throw new WMRuntimeException(ex);
            }
            this.writtenBackupFiles.remove(path);
        }
    }

    public List<String> getModifiedFiles() {
        List<String> rtn = new ArrayList<String>();
        for (EntityInfo ei : this.modifiedEntityInfos) {
            rtn.add(this.entityNameToPath.get(ei.getEntityName()));
        }
        for (HbmQueryParser p : this.modifiedQueryParsers) {
            rtn.add(this.parserToPath.get(p));
        }

        return rtn;
    }

    public void addDataObjectTree(TreeNode root) {
        for (TreeNode n : getTypeNodes()) {
            root.addChild(n);
        }
    }

    public void addQueryTree(TreeNode root) {
        for (TreeNode n : getQueryNodes()) {
            root.addChild(n);
        }
    }

    public List<TreeNode> getQueryNodes() {
        Collection<String> queryNames = getQueryNames();
        List<TreeNode> rtn = new ArrayList<TreeNode>(queryNames.size());
        for (String queryName : queryNames) {
            TreeNode n = new TreeNode(queryName);
            rtn.add(n);
            // query nodes don't have a 'type' annotation
            n.addData(queryName);
            n.addData(queryName);
        }
        return rtn;
    }

    public List<TreeNode> getTypeNodes() {

        Collection<String> entityNames = getEntityNames();
        List<TreeNode> rtn = new ArrayList<TreeNode>(entityNames.size());

        for (String entityName : entityNames) {
            TreeNode n2 = new TreeNode(entityName);
            EntityInfo ei = getEntity(entityName);
            n2.addData(com.wavemaker.runtime.data.util.DataServiceConstants.ENTITY_NODE);
            n2.addData(entityName);
            n2.addData(StringUtils.fq(ei.getPackageName(), entityName));
            rtn.add(n2);

            for (String propertyName : getPropertyNames(entityName)) {

                PropertyInfo p = getProperty(entityName, propertyName);

                TreeNode n3 = formatTreeNode(new TreeNode(), p);

                n2.addChild(n3);

                addCompositeProperties(p, n3);
            }
        }
        return rtn;
    }

    public List<String> getMappings() {
        return this.springConfiguration.getMappings();
    }

    public String getDataPackage() {
        if (this.name.equals(CommonConstants.SALESFORCE_SERVICE)) {
            return getDataPackage_SF();
        }

        if (this.dataPackage == null) {
            throw new IllegalStateException("Cannot determine package until mapping files have been registered");
        }
        return this.dataPackage;
    }

    public String getDataPackage_SF() {
        return "com.sforce.queries";
    }

    public String getOutputPackage() {
        return DataServiceUtils.getOutputPackage(getDataPackage());
    }

    /**
     * Init the runtime engine with the current configuration.
     * 
     * @throws RuntimeException if the current configuration is invalid.
     */
    public void initRuntime() {
        DeprecatedServiceDefinition def = null;
        try {
            def = initRuntimeDataServiceDefinition();
        } finally {
            if (def != null) {
                def.dispose();
            }
        }
    }

    public boolean compareTo(DataModelConfiguration other) {
        Collection<String> c = new HashSet<String>(getEntityNames());
        for (String s : other.getEntityNames()) {
            if (!c.remove(s)) {
                return false;
            }
        }
        if (!c.isEmpty()) {
            return false;
        }
        return true;
    }

    public boolean isKnownConfiguration() {
        return this.springConfiguration.isKnownConfiguration();
    }

    public void dispose() {
        for (BaseHbmParser p : this.entityNameToHbmParser.values()) {
            p.close();
        }
    }

    public void saveEntities() {
        saveModifiedEntities(false, false);
    }

    public void validateName(String name) {
        if (!StringUtils.isValidJavaIdentifier(name)) {
            throw new AssertionError("\"" + name + "\" is not a valid java identifier");
        }
    }

    @Override
    public String toString() {
        return "Mappings: " + this.entityNameToPath + "\n\nQueries: " + this.queryFiles;
    }

    public Collection<String> getDeletedSFQueries() {
        return this.deletedSFQueries;
    }

    public void removeDeletedSFQueries(String name) {
        this.deletedSFQueries.remove(name);
    }

    public Collection<String> getDeletedSFDataObjects() {
        return this.deletedSFDataObjects;
    }

    public void removeDeletedSFDataObjects(String name) {
        this.deletedSFDataObjects.remove(name);
    }

    private void setProperties(EntityInfo entity) {
        List<String> refreshEntities = getRefreshEntities();
        String fq = StringUtils.fq(entity.getPackageName(), entity.getEntityName());

        if (entity.isRefreshEntity() && !refreshEntities.contains(fq)) {
            refreshEntities.add(fq);
            setRefreshEntities(refreshEntities);
        } else if (!entity.isRefreshEntity() && refreshEntities.contains(fq)) {
            refreshEntities.remove(fq);
            setRefreshEntities(refreshEntities);
        }
    }

    private void deleteTypes(boolean backup) {

        for (String s : new HashSet<String>(this.deletedTypes)) {

            String path = s;

            if (!path.endsWith(DataServiceConstants.JAVA_EXT)) {
                path = path + DataServiceConstants.JAVA_EXT;
            }

            if (backup) {
                backup(path);
            }

            try {
                this.fileService.deleteFile(path);
            } catch (IOException ex) {
                throw new WMRuntimeException(ex);
            }

            this.deletedTypes.remove(s);
        }
    }

    private void updateReferences(String oldEntityName, String newEntityName, Collection<PropertyInfo> relatedProperties) {
        for (PropertyInfo pi : relatedProperties) {
            EntityInfo relatedEntity = getEntity(pi.getType());
            for (PropertyInfo relp : new ArrayList<PropertyInfo>(relatedEntity.getRelatedProperties())) {
                if (relp.getType().equals(oldEntityName)) {
                    if (relp.getIsInverse()) {
                        // will be added back by updateRelated
                        relatedEntity.removeProperty(relp);
                    } else {
                        relp.types(StringUtils.fq(getDataPackage(), newEntityName));
                    }
                    this.modifiedEntityInfos.add(relatedEntity);
                }
            }
        }
    }

    private void deleteReferences(String entityName, Collection<PropertyInfo> relatedProperties) {
        for (PropertyInfo pi : relatedProperties) {
            EntityInfo relatedEntity = getEntity(pi.getType());
            for (PropertyInfo relp : new ArrayList<PropertyInfo>(relatedEntity.getRelatedProperties())) {
                if (relp.getType().equals(entityName)) {
                    relatedEntity.removeProperty(relp);
                    this.modifiedEntityInfos.add(relatedEntity);
                }
            }
        }
    }

    private void writeCfgFile(boolean backup) {

        if (backup) {
            backup(this.springConfiguration.getPath());
        }

        this.springConfiguration.write();
    }

    private void propagateSchemaChange(EntityInfo entity, String origSchema) {

        for (EntityInfo other : getEntities()) {
            if (other == entity) {
                continue;
            }
            if (!String.valueOf(other.getSchemaName()).equals(String.valueOf(entity.getSchemaName()))
                && String.valueOf(other.getSchemaName()).equals(String.valueOf(origSchema))) {
                other.setSchemaName(entity.getSchemaName());
                this.modifiedEntityInfos.add(other);
            }
        }
    }

    private void propagateCatalogChange(EntityInfo entity, String origCatalog) {

        for (EntityInfo other : getEntities()) {
            if (other == entity) {
                continue;
            }
            if (!String.valueOf(other.getCatalogName()).equals(String.valueOf(entity.getCatalogName()))
                && String.valueOf(other.getSchemaName()).equals(String.valueOf(origCatalog))) {
                other.setCatalogName(entity.getCatalogName());
                this.modifiedEntityInfos.add(other);
            }
        }
    }

    private void propagatePackageChange(EntityInfo entity, String origPackage) {

        this.dataPackage = entity.getPackageName();

        for (EntityInfo other : getEntities()) {
            if (other == entity) {
                continue;
            }
            if (!other.getPackageName().equals(entity.getPackageName()) && other.getPackageName().equals(origPackage)) {
                other.setPackageName(entity.getPackageName());
                this.modifiedEntityInfos.add(other);
            }
        }
    }

    private void addQueryDocument(String path) {
        this.queryFiles.add(path);
    }

    private void addMappingDocument(String path) {

        EntityInfo ei = initEntityInfo(path);

        if (this.dataPackage == null) {
            this.dataPackage = ei.getPackageName();
        } else {
            if (!this.dataPackage.equals(ei.getPackageName())) {
                if (DataServiceLoggers.parserLogger.isWarnEnabled()) {
                    DataServiceLoggers.parserLogger.warn(ei.getEntityName() + ": mapped class must match service class package: " + this.dataPackage
                        + ". Mapped class: " + ei.getPackageName());

                }
            }
        }

        this.entityNameToPath.put(ei.getEntityName(), path);
        this.entityInfos.put(ei.getEntityName(), ei);
        ei.setColumns(initColumns(ei.getEntityName()));
    }

    private synchronized void saveDeletedEntities(boolean backup) {

        for (String path : new HashSet<String>(this.deletedEntities)) {

            if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                DataServiceLoggers.parserLogger.info("Deleting entity at " + path);
            }

            String relPath = getRelServicePath(path);

            if (backup) {
                backup(relPath);
            }

            try {
                this.fileService.deleteFile(relPath);
            } catch (IOException ex) {
                throw new WMRuntimeException(ex);
            }

            this.deletedEntities.remove(path);
        }

    }

    private synchronized void saveModifiedEntities(boolean backup, boolean generateJavaTypes) {

        for (EntityInfo ei : new HashSet<EntityInfo>(this.modifiedEntityInfos)) {

            if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                DataServiceLoggers.parserLogger.info("Updating entity " + ei.getEntityName());
            }

            String path = getRelServicePath(this.entityNameToPath.get(ei.getEntityName()));

            writeMappingResource(ei, path, backup);

            if (generateJavaTypes) {
                writeJavaType(ei, backup);
            }

            this.modifiedEntityInfos.remove(ei);
        }

    }

    private void writeJavaType(EntityInfo entity, boolean backup) {

        Collection<EntityInfo> c = new ArrayList<EntityInfo>(1);
        c.add(entity);
        Service s = com.wavemaker.tools.data.util.DataServiceUtils.toService(c);
        s.setId(this.name);

        // id types have to be Serializable and also
        // implement equals/hashCode
        Collection<String> serializableTypes = new HashSet<String>();
        for (EntityInfo ei : getEntities()) {
            PropertyInfo id = ei.getId();
            if (id.hasCompositeProperties()) {
                serializableTypes.add(id.getFullyQualifiedType());
            }
        }

        ServiceDataObjectGenerator gen = new ServiceDataObjectGenerator(s, DataServiceConstants.DEFAULT_COLLECTION_TYPE);

        gen.setSerializableTypes(serializableTypes);
        gen.setEqualsHashCodeTypes(serializableTypes);

        while (gen.hasNext()) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try {

                String relPath = getTypePath(gen.getCurrentTypeName());

                if (backup) {
                    backup(relPath);
                }

                String path = getRelServicePath(relPath);
                gen.generateNext(baos);

                if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                    DataServiceLoggers.parserLogger.info("Writing java type " + relPath);
                }

                if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                    DataServiceLoggers.parserLogger.debug("File content==========================\n" + baos.toString()
                        + "\n==========================");
                }

                this.fileService.writeFile(path, baos.toString());
            } catch (IOException ex) {
                throw new ConfigurationException(ex);
            }
        }
    }

    private void writeMappingResource(EntityInfo ei, String path, boolean backup) {

        // we should write to a FileInputStream instead of memory
        StringWriter sw = new StringWriter();

        HbmWriter w = new HbmWriter(new PrintWriter(sw));

        w.setEntity(ei);

        w.write();

        try {

            if (backup) {
                backup(path);
            }

            if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                DataServiceLoggers.parserLogger.info("Writing mapping file " + path);
            }

            if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                DataServiceLoggers.parserLogger.debug("File content==========================\n" + sw.toString() + "\n==========================");
            }

            this.fileService.writeFile(path, sw.toString());
        } catch (IOException ex) {
            throw new ConfigurationException(ex);
        }
    }

    private synchronized void saveDeletedQueries(boolean backup) {

        for (String path : new HashSet<String>(this.deletedQueries)) {

            String relPath = getRelServicePath(path);

            if (backup) {
                backup(relPath);
            }

            if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                DataServiceLoggers.parserLogger.info("Deleting query file at " + path);
            }

            try {
                this.fileService.deleteFile(relPath);
            } catch (IOException ex) {
                throw new WMRuntimeException(ex);
            }

            this.deletedQueries.remove(path);
        }

    }

    private synchronized void saveModifiedQueries(boolean backup) {

        Collection<HbmQueryParser> s = new HashSet<HbmQueryParser>(this.modifiedQueryParsers);

        for (HbmQueryParser p : s) {

            StringWriter sw = new StringWriter();

            HbmQueryWriter w = new HbmQueryWriter(new PrintWriter(sw));

            w.setMeta(p.getMeta());
            w.setQueries(p.getQueries().values());

            w.write();

            String path = getRelServicePath(this.parserToPath.get(p));

            if (backup) {
                backup(path);
            }

            if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                DataServiceLoggers.parserLogger.info("Writing query mapping file " + path);
            }

            String fileContent = sw.toString();

            this.modifiedQueryParsers.remove(p);

            try {
                this.fileService.writeFile(path, fileContent);
            } catch (IOException ex) {
                throw new ConfigurationException(ex);
            }

            if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                DataServiceLoggers.parserLogger.debug("File content==========================\n" + fileContent + "\n==========================");
            }
        }
    }

    private void updateService(UpdateCallback callback) {

        DeprecatedServiceDefinition def = null;

        try {

            def = initRuntimeDataServiceDefinition();

            DataServiceDefinition dataDef = com.wavemaker.tools.data.util.DataServiceUtils.unwrapAndCast(def);

            dataDef.getMetaData().setServiceClassName(this.externalConfig.getServiceClass());

            for (String q : this.modifiedQueryNames) {

                DataServiceOperation op = dataDef.getOperation(q);

                if (op.requiresResultWrapper()) {
                    generateWrapperType(op, true);
                }

                String in = dataDef.inputTypesToString(q);
                String out = dataDef.outputTypeToString(q);
                if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                    DataServiceLoggers.parserLogger.debug("Updated query " + q + " InputTypes: " + in + " OutputType " + out);
                }

                QueryInfo qi = this.queryNameToQueryInfo.get(q);
                qi.setOutputType(out);
            }

            // set wrapper type names correctly for queries that
            // have not been modified
            for (String operationName : dataDef.getOperationNames()) {
                DataServiceOperation op = dataDef.getOperation(operationName);
                if (!op.isQuery() || !op.requiresResultWrapper() || this.modifiedQueryNames.contains(op.getQueryName())) {
                    continue;
                }
                generateWrapperType(op, false);
            }

            // unnecessary - just keep a Collection of the fq name around
            Collection<String> fqTypeNames = new HashSet<String>(this.outputTypes.size());
            for (BeanInfo bi : this.outputTypes.values()) {
                fqTypeNames.add(bi.getFullyQualifiedName());
            }
            dataDef.getMetaData().setHelperClassNames(fqTypeNames);

            callback.update(dataDef);
        } finally {
            if (def != null) {
                def.dispose();
            }
        }

        this.modifiedQueryNames.clear();

    }

    private String getTypePath(String fqName) {
        return StringUtils.packageToSrcFilePath(fqName) + StringUtils.JAVA_SRC_EXT;
    }

    private void generateWrapperType(DataServiceOperation op, boolean write) {

        // make sure we have types with new name
        // TODO:API
        /*
         * String oldPath = StringUtils.packageToSrcFilePath(DataServiceUtils.getOldOutputType(getDataPackage(),
         * op.getName())) + StringUtils.JAVA_SRC_EXT; oldPath = getRelServicePath(oldPath); write = write || !new
         * File(oldPath).exists();
         */

        String fqName = DataServiceUtils.getOutputType(getDataPackage(), op.getName());

        if (write) {

            String outputWrapper = this.generator.generate(fqName, op);

            String path = getTypePath(fqName);

            if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                DataServiceLoggers.parserLogger.debug("Generating return type for " + op.getName() + ": " + path);
            }

            try {
                path = getRelServicePath(path);
                this.fileService.writeFile(path, outputWrapper);
            } catch (IOException ex) {
                throw new ConfigurationException(ex);
            }
        }

        op.setOutputType(fqName);
        this.outputTypes.put(StringUtils.splitPackageAndClass(fqName).v2, this.generator.getBeanInfo());

    }

    private void backup(String path) {
        try {
            String original = null;
            try {
                original = this.fileService.readFile(path);
                // cftempfix - Different exceptions are returned fro local file system and CF file system
                // (ResourceException and
                // IllegalStateException). So I am catching Exception right now but this should be fixed when the API is
                // fixed to
                // return a consistent exception.
                /*
                 * } catch (FileNotFoundException ex) { // if the original file doesn't exist (yet), then // we can't
                 * back it up return; } catch (ResourceException ex) { // if the original file doesn't exist (yet), then
                 * // we can't back it up return;
                 */
            } catch (Exception ex) {
                return;
            }
            String backupPath = path + BACKUP_SUFFIX;
            if (DataServiceLoggers.parserLogger.isInfoEnabled()) {
                DataServiceLoggers.parserLogger.info("Writing backup file " + backupPath);
            }
            this.fileService.writeFile(backupPath, original);
            this.writtenBackupFiles.add(backupPath);
        } catch (IOException ex) {
            throw new ConfigurationException(ex);
        }
    }

    // requires all entities to be initialized
    private Map<String, TypeInfo> initValueTypesForEntity(EntityInfo ei) {

        Map<String, TypeInfo> rtn = new HashMap<String, TypeInfo>();

        if (ei.getProperties() == null) {
            return rtn;
        }

        List<PropertyInfo> props = new ArrayList<PropertyInfo>();
        props.addAll(ei.getProperties());

        while (!props.isEmpty()) {
            PropertyInfo pi = props.remove(0);
            // if this property doesn't map directly to a column,
            // and if its type is not an entity, it is a value type
            if (pi.getColumn() == null && !isEntityType(pi.getFullyQualifiedType())) {
                TypeInfo v = new TypeInfo(pi.getType(), ei.getPackageName());
                rtn.put(v.getName(), v);
            }
            if (pi.getCompositeProperties() != null) {
                props.addAll(pi.getCompositeProperties());
            }
        }

        return rtn;
    }

    private void addCompositeProperties(PropertyInfo p, TreeNode n) {

        if (p.getCompositeProperties() == null || p.getCompositeProperties().isEmpty()) {
            return;
        }

        for (PropertyInfo p2 : p.getCompositeProperties()) {
            TreeNode n2 = formatTreeNode(new TreeNode(), p2);
            n.addChild(n2);
            addCompositeProperties(p2, n2);
        }

    }

    // data has "node_type, prop_name, type, mapped col_name(for col only),
    // (PK|to-one|to-many|)(for prop only)
    private TreeNode formatTreeNode(TreeNode n, PropertyInfo p) {
        String content = p.getName() + " (" + p.getType() + ")";
        if (p.getIsId()) {
            n.setImage(DataServiceConstants.PK_IMAGE);
        }

        if (p.getIsRelated()) {
            n.addData(com.wavemaker.runtime.data.util.DataServiceConstants.RELATIONSHIP_NODE);
            if (p.getIsInverse()) {
                n.setImage(DataServiceConstants.TO_MANY_IMAGE);
            } else {
                n.setImage(DataServiceConstants.TO_ONE_IMAGE);
            }
        } else if (p.getColumn() == null) {
            n.addData(com.wavemaker.runtime.data.util.DataServiceConstants.PROPERTY_NODE);
        } else {
            n.addData(com.wavemaker.runtime.data.util.DataServiceConstants.COLUMN_NODE);
        }

        n.addData(p.getName());
        n.addData(p.getFullyQualifiedType());

        if (n.getData().get(0).equals(com.wavemaker.runtime.data.util.DataServiceConstants.COLUMN_NODE)) {
            n.addData(p.getColumn().getName());
        }

        if (p.getIsId()) {
            n.addData(PropertyInfo.PK_META);
        } else if (p.getIsRelated()) {
            if (p.getIsInverse()) {
                n.addData(RelatedInfo.Cardinality.OneToMany.toString());
            } else {
                n.addData(RelatedInfo.Cardinality.OneToOne.toString());
            }
        }

        n.setContent(content);

        return n;
    }

    private Map<String, ColumnInfo> initColumns(String entity) {

        Map<String, ColumnInfo> pkCols = new HashMap<String, ColumnInfo>();
        Map<String, ColumnInfo> fkCols = new HashMap<String, ColumnInfo>();

        Collection<ColumnInfo> allColumns = new LinkedHashSet<ColumnInfo>();

        for (PropertyInfo p : getProperties(entity)) {
            if (p.getIsRelated() && p.getIsInverse()) {
                continue;
            }
            for (ColumnInfo ci : p.allColumns()) {
                allColumns.add(ci);
                if (ci.getIsPk()) {
                    pkCols.put(ci.getName(), ci);
                }
                if (ci.getIsFk()) {
                    fkCols.put(ci.getName(), ci);
                }
            }
        }

        for (ColumnInfo fk : fkCols.values()) {
            if (pkCols.containsKey(fk.getName())) {
                ColumnInfo pk = pkCols.get(fk.getName());
                pk.setIsFk(true);
                allColumns.remove(fk);
            }
        }

        Map<String, ColumnInfo> rtn = new LinkedHashMap<String, ColumnInfo>(allColumns.size());

        for (ColumnInfo ci : allColumns) {
            rtn.put(ci.getName(), ci);
        }

        return rtn;
    }

    private void setup() {

        addRegisteredFiles();
    }

    private void setup_SF() {
        String path = "com/sforce/queries/sforce-queries.xml";
        addQueryDocument(path);
    }

    private HbmQueryParser getParserForQuery(QueryInfo qi) {

        if (this.queryNameToParser.containsKey(qi.getName())) {
            return this.queryNameToParser.get(qi.getName());
        }

        return getDefaultQueryParser();
    }

    private HbmQueryParser getDefaultQueryParser() {
        if (this.defaultQueryParser == null) {
            throw new ConfigurationException("No default query store " + "configured");
        }
        return this.defaultQueryParser;
    }

    private void addEntityToSpringFile(String path) {
        this.springConfiguration.addMapping(path);
    }

    private void removeMappingFromSpringFile(String path) {
        this.springConfiguration.removeMapping(path);
    }

    private synchronized Map<String, QueryInfo> getHibernateQueries() {

        if (this.queryNameToQueryInfo != null) {
            return this.queryNameToQueryInfo;
        }

        this.queryNameToQueryInfo = new HashMap<String, QueryInfo>();
        this.queryNameToParser = new HashMap<String, HbmQueryParser>();

        for (String path : this.queryFiles) {

            HbmQueryParser p = initHbmQueryParser(path);

            this.parserToPath.put(p, path);

            String meta = p.getMeta();

            if (meta != null && com.wavemaker.tools.data.util.DataServiceUtils.isDefaultQueryStore(meta)
                || this.name.equals(CommonConstants.SALESFORCE_SERVICE)) {
                this.defaultQueryParser = p;
            }

            Collection<QueryInfo> queryInfos = p.getQueries().values();

            for (QueryInfo q : queryInfos) {

                if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                    DataServiceLoggers.parserLogger.debug("Processing HQL query: \"" + q.getName() + "\"");
                }

                this.queryNameToQueryInfo.put(q.getName(), q);
                this.queryNameToParser.put(q.getName(), p);

                String operationName = DataServiceUtils.queryToOperationName(q.getName());
                q.setReturnsSingleResult(this.externalConfig.returnsSingleResult(operationName));
                q.setOutputType(this.externalConfig.getOutputType(operationName));
            }
        }

        return this.queryNameToQueryInfo;
    }

    private HbmParser initHbmParser(String path) {

        String relpath = getRelServicePath(path);

        if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
            DataServiceLoggers.parserLogger.debug("Parsing mapping " + relpath);
        }

        String s = null;

        try {
            s = this.fileService.readFile(relpath);
        } catch (IOException ex) {
            throw new ConfigurationException(ex);
        }

        HbmParser rtn = new HbmParser(s);

        rtn.initAll();

        EntityInfo ei = rtn.getEntity();

        this.entityNameToHbmParser.put(ei.getEntityName(), rtn);

        return rtn;
    }

    private HbmQueryParser initHbmQueryParser(String path) {

        String relpath = getRelServicePath(path);

        if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
            DataServiceLoggers.parserLogger.debug("Parsing queries " + relpath);
        }

        String s = null;

        try {
            s = this.fileService.readFile(relpath);
        } catch (IOException ex) {
            throw new ConfigurationException(ex);
        }

        HbmQueryParser rtn = new HbmQueryParser(s);

        rtn.initAll();

        return rtn;
    }

    private EntityInfo initEntityInfo(String path) {

        HbmParser parser = initHbmParser(path);

        this.parserToPath.put(parser, path);

        EntityInfo rtn = parser.getEntity();

        String fq = StringUtils.fq(rtn.getPackageName(), rtn.getEntityName());

        rtn.setRefreshEntity(getRefreshEntities().contains(fq));

        return rtn;
    }

    // return rel path starting from service root dir
    private String getRelServicePath(String relPath) {
        StringBuilder sb = new StringBuilder(this.cfgPath.length() + relPath.length() + 1);
        // sb.append(this.cfgPath).append("/").append(relPath);
        sb.append(StringUtils.appendPaths(this.cfgPath, relPath));
        return sb.toString();
    }

    private void addRegisteredFiles() {

        List<String> mappings = this.springConfiguration.getMappings();

        for (String s : mappings) {

            try {
                if (s.endsWith(DataServiceConstants.HBM_EXT)) {
                    addMappingDocument(s);
                } else if (s.endsWith(DataServiceConstants.QUERY_EXT)) {
                    addQueryDocument(s);
                } else if (s.endsWith(".hql.xml")) { // old ext used in test
                    addQueryDocument(s);
                } else {
                    throw new ConfigurationException("Unknown resource type");
                }
            } catch (RuntimeException ex) {
                if (DataServiceLoggers.parserLogger.isWarnEnabled()) {
                    String msg = "Unable to process mapping resource \"" + s + "\"";
                    if (!ObjectUtils.isNullOrEmpty(ex.getMessage())) {
                        msg += ": " + ex.getMessage();
                    }
                    DataServiceLoggers.parserLogger.warn(msg);

                    if (DataServiceLoggers.parserLogger.isDebugEnabled()) {
                        DataServiceLoggers.parserLogger.debug(StringUtils.toString(ex));
                    }
                }
            }
        }

        initEntityInfos();

    }

    // do work here that requires all entities to be initialized
    private void initEntityInfos() {

        for (EntityInfo ei : getEntities()) {
            ei.initFkColumnTypes(this);
            this.valueTypes.putAll(initValueTypesForEntity(ei));
        }

    }

    private void removeServiceClass() {
        String packageName = StringUtils.splitPackageAndClass(this.externalConfig.getServiceClass()).v1;
        for (String s : com.wavemaker.tools.data.util.DataServiceUtils.getServiceClassNames(packageName, this.name)) {
            s = StringUtils.classNameToSrcFilePath(s);
            String path = getRelServicePath(s);
            try {
                this.fileService.deleteFile(path);
            } catch (IOException ex) {
                throw new WMRuntimeException(ex);
            }
        }
    }

    private DeprecatedServiceDefinition initRuntimeDataServiceDefinition() {

        DeprecatedServiceDefinition rtn = ResourceClassLoaderUtils.runInClassLoaderContext(new Callable<DeprecatedServiceDefinition>() {

            @Override
            public DeprecatedServiceDefinition call() {
                return SpringService.initialize(DataModelConfiguration.this.cfgFile);
            }
        }, this.classLoaderFactory.getClassLoader());

        return rtn;
    }

    private void setBindParameters(QueryRunner queryRunner, Input[] inputs, String values, boolean includeNullValues) {
        List<String> names = new ArrayList<String>(inputs.length);
        List<String> types = new ArrayList<String>(inputs.length);
        List<Boolean> isList = new ArrayList<Boolean>(inputs.length);

        for (int i = 0; i < inputs.length; i++) {
            names.add(inputs[i].getParamName());
            types.add(inputs[i].getParamType());
            isList.add(inputs[i].getList());
        }

        if (includeNullValues || !ObjectUtils.isNullOrEmpty(values)) {
            queryRunner.addBindParameters(names, types, values, isList);
        }
    }
}
