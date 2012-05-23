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

import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Properties;
import java.util.concurrent.Callable;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hibernate.cfg.Configuration;
import org.hibernate.dialect.Dialect;
import org.hibernate.tool.hbm2ddl.DatabaseMetadata;
import org.hibernate.tool.hbm2ddl.SchemaExport;
import org.hibernate.tool.hbm2ddl.SchemaUpdate;
import org.springframework.util.ReflectionUtils;

import com.wavemaker.common.MessageResource;
import com.wavemaker.common.util.CastUtils;
import com.wavemaker.common.util.IOUtils;
import com.wavemaker.common.util.ObjectUtils;
import com.wavemaker.common.util.Tuple;
import com.wavemaker.runtime.data.DataServiceRuntimeException;
import com.wavemaker.runtime.data.util.JDBCUtils;
import com.wavemaker.tools.common.ConfigurationException;
import com.wavemaker.tools.data.parser.HbmParser;
import com.wavemaker.tools.io.Folder;
import com.wavemaker.tools.io.Resource;
import com.wavemaker.tools.io.ResourceOperation;
import com.wavemaker.tools.io.filesystem.FileSystem;
import com.wavemaker.tools.io.local.LocalFolder;
import com.wavemaker.tools.util.ResourceClassLoaderUtils;

/**
 * @author Simon Toens
 */
public class ExportDB extends BaseDataModelSetup {

    private static final Log log = LogFactory.getLog(BaseDataModelSetup.class);

    private static final String HBM_FILES_DIR_SYSTEM_PROPERTY = SYSTEM_PROPERTY_PREFIX + "hbmFilesDir";

    private Folder hbmFilesDir = null;

    private boolean exportToDatabase = false;

    private List<Throwable> errors = null;

    private boolean verbose = false;

    private boolean overrideTable = false;

    private String ddl = null;

    private Folder classesDir = null;

    public void setClassesDir(Folder classesDir) {
        this.classesDir = classesDir;
    }

    public void setVerbose(boolean verbose) {
        this.verbose = verbose;
    }

    public void setOverrideTable(boolean val) {
        this.overrideTable = val;
    }

    public List<Throwable> getErrors() {
        return this.errors;
    }

    public void setHbmFilesDir(Folder hbmFilesDir) {
        this.hbmFilesDir = hbmFilesDir;
    }

    public void addProperties(Properties properties) {
        this.properties.putAll(properties);
    }

    public void setExportToDB(boolean exportToDatabase) {
        this.exportToDatabase = exportToDatabase;
    }

    public String getDDL() {
        return this.ddl;
    }

    @Override
    protected void customRun() {

        init();

        final Configuration cfg = new Configuration();

        // cfg.addDirectory(this.hbmFilesDir);

        this.hbmFilesDir.performOperationRecursively(new ResourceOperation<com.wavemaker.tools.io.File>() {

            @Override
            public void perform(com.wavemaker.tools.io.File file) {
                if (file.getName().endsWith(".hbm.xml")) {
                    cfg.addInputStream(file.getContent().asInputStream());
                }
            }
        });

        Properties connectionProperties = getHibernateConnectionProperties();

        cfg.addProperties(connectionProperties);

        SchemaExport export = null;
        SchemaUpdate update = null;
        File ddlFile = null;

        try {
            if (this.overrideTable) {
                Callable<SchemaExport> t = new Callable<SchemaExport>() {

                    @Override
                    public SchemaExport call() {
                        return new SchemaExport(cfg);
                    }
                };

                if (this.classesDir == null) {
                    try {
                        export = t.call();
                    } catch (Exception e) {
                        ReflectionUtils.rethrowRuntimeException(e);
                    }
                } else {
                    export = ResourceClassLoaderUtils.runInClassLoaderContext(t, this.classesDir);
                }

                ddlFile = File.createTempFile("ddl", ".sql");
                ddlFile.deleteOnExit();

                export.setOutputFile(ddlFile.getAbsolutePath());
                export.setDelimiter(";");
                export.setFormat(true);

                String extraddl = prepareForExport(this.exportToDatabase);

                export.create(this.verbose, this.exportToDatabase);

                this.errors = CastUtils.cast(export.getExceptions());
                this.errors = filterError(this.errors, connectionProperties);

                this.ddl = IOUtils.read(ddlFile);

                if (!ObjectUtils.isNullOrEmpty(extraddl)) {
                    this.ddl = extraddl + "\n" + this.ddl;
                }
            } else {
                Callable<SchemaUpdate> t = new Callable<SchemaUpdate>() {

                    @Override
                    public SchemaUpdate call() {
                        return new SchemaUpdate(cfg);
                    }
                };

                if (this.classesDir == null) {
                    try {
                        update = t.call();
                    } catch (Exception e) {
                        ReflectionUtils.rethrowRuntimeException(e);
                    }
                } else {
                    update = ResourceClassLoaderUtils.runInClassLoaderContext(t, this.classesDir);
                }

                prepareForExport(this.exportToDatabase);

                Connection conn = JDBCUtils.getConnection(this.connectionUrl, this.username, this.password, this.driverClassName);

                Dialect dialect = Dialect.getDialect(connectionProperties);

                DatabaseMetadata meta = new DatabaseMetadata(conn, dialect);

                String[] updateSQL = cfg.generateSchemaUpdateScript(dialect, meta);

                update.execute(this.verbose, this.exportToDatabase);

                this.errors = CastUtils.cast(update.getExceptions());
                StringBuilder sb = new StringBuilder();
                for (String line : updateSQL) {
                    sb = sb.append(line);
                    sb = sb.append("\n");
                }
                this.ddl = sb.toString();

            }
        } catch (IOException ex) {
            throw new DataServiceRuntimeException(ex);
        } catch (SQLException qex) {
            throw new DataServiceRuntimeException(qex);
        } finally {
            try {
                ddlFile.delete();
            } catch (Exception ignore) {
            }
        }
    }

    // The DDL Hibernate creates includes "alter table" statement on the top, which causes an error message (Table not
    // found)
    // to be displayed after the DB is exported properly. Let's hide the error message because it is too misleading.
    // This is not a perfect solution but we have no other way round until Hibernate fixes this problem.

    private List<Throwable> filterError(List<Throwable> errors, Properties props) {
        List<Throwable> rtn = new ArrayList<Throwable>();
        String dialect = (String) props.get(".dialect");
        String dbType;
        if (dialect == null) {
            return rtn;
        }
        if (dialect.contains("MySQL")) {
            dbType = "mysql";
        } else if (dialect.contains("HSQL")) {
            dbType = "hsql";
        } else {
            return rtn;
        }

        for (Throwable t : errors) {
            String msg = t.getMessage();
            if (dbType.equals("mysql") && msg.substring(0, 5).equals("Table") && msg.lastIndexOf("doesn't exist") == msg.length() - 13
                || dbType.equals("hsql") && msg.substring(0, 16).equals("Table not found:") && msg.contains("in statement [alter table")) {
                continue;
            } else {
                rtn.add(t);
            }
        }

        return rtn;
    }

    @Override
    protected boolean customInit(Collection<String> requiredProperties) {

        checkHbmFilesDir(requiredProperties);

        checkRevengNamingStrategy();

        return initConnection(requiredProperties, true);
    }

    @Override
    protected void customDispose() {
    }

    private String prepareForExport(boolean run) {

        if (!isMySQL() && !isPostgres()) {
            return null;
        }

        // For export to MySQL or Postgres, we attempt to create the
        // database. For Postgres, we should also create the schema.
        // And we should expand this logic to include other supported
        // database types.

        Tuple.Two<String, String> t = getMappedSchemaAndCatalog();
        String schemaName = t.v1, catalogName = t.v2;
        String urlDBName = getDatabaseNameFromConnectionUrl();
        String url = this.connectionUrl;

        if (isMySQL() && !ObjectUtils.isNullOrEmpty(schemaName)) {
            throw new ConfigurationException(MessageResource.UNSET_SCHEMA, "MySQL");
        }

        if (!ObjectUtils.isNullOrEmpty(urlDBName)) {
            url = this.connectionUrl.substring(0, this.connectionUrl.indexOf(urlDBName));
            if (isPostgres()) {
                url += "postgres";
            }
            if (ObjectUtils.isNullOrEmpty(catalogName)) {
                catalogName = urlDBName;
            } else if (!ObjectUtils.isNullOrEmpty(catalogName) && !catalogName.equals(urlDBName)) {
                throw new ConfigurationException(MessageResource.MISMATCH_CATALOG_DBNAME, urlDBName, catalogName);
            }
        } else if (ObjectUtils.isNullOrEmpty(catalogName)) {
            throw new ConfigurationException(MessageResource.CATALOG_SHOULD_BE_SET);
        }

        String ddl = null;
        if (isMySQL()) {
            ddl = "create database if not exists ";
        } else {
            ddl = "create database ";
        }

        ddl += catalogName;

        try {
            if (run) {
                runDDL(ddl, url);
            }
        } catch (RuntimeException ex) {
            log.warn("Unable to create database " + catalogName + " - it's possible it already exists.", ex);
        }

        return ddl;
    }

    private void checkHbmFilesDir(Collection<String> requiredProperties) {
        // cftempfix - For now, we assume that no properties are supposed to be set to represent directories.
        if (this.hbmFilesDir.getResourceOrigin().equals(FileSystem.ResourceOrigin.LOCAL_FILE_SYSTEM)) {
            if (this.hbmFilesDir == null) {
                String s = this.properties.getProperty(HBM_FILES_DIR_SYSTEM_PROPERTY);
                if (s != null) {
                    setHbmFilesDir(new LocalFolder(new File(s)));
                }
            }

            if (this.hbmFilesDir == null) {
                requiredProperties.add(HBM_FILES_DIR_SYSTEM_PROPERTY);
            }
        }
    }

    private String getDatabaseNameFromConnectionUrl() {
        return JDBCUtils.getMySQLDatabaseName(this.connectionUrl);
    }

    private Tuple.Two<String, String> getMappedSchemaAndCatalog() {
        for (Resource s : this.hbmFilesDir.list()) {
            // File f = new File(this.hbmFilesDir, s);
            if (s instanceof com.wavemaker.tools.io.File) {
                com.wavemaker.tools.io.File f = (com.wavemaker.tools.io.File) s;
                HbmParser p = null;
                try {
                    Reader reader = new InputStreamReader(f.getContent().asInputStream());
                    p = new HbmParser(reader);
                    // rely on the fact that all mapping files have the same
                    // schema and catalog
                    return Tuple.tuple(p.getEntity().getSchemaName(), p.getEntity().getCatalogName());
                } catch (RuntimeException ignore) {
                } finally {
                    try {
                        p.close();
                    } catch (RuntimeException ignore) {
                    }
                }
            }
        }
        return null;
    }
}
