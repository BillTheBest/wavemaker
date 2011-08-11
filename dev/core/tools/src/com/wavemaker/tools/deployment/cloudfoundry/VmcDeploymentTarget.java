package com.wavemaker.tools.deployment.cloudfoundry;

import static org.springframework.util.StringUtils.hasText;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.cloudfoundry.client.lib.CloudApplication;
import org.cloudfoundry.client.lib.CloudFoundryClient;
import org.cloudfoundry.client.lib.CloudFoundryException;
import org.cloudfoundry.client.lib.CloudService;
import org.cloudfoundry.client.lib.UploadStatusCallback;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpRequest;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.util.Assert;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.RestClientException;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.tools.deployment.AppInfo;
import com.wavemaker.tools.deployment.DeploymentDB;
import com.wavemaker.tools.deployment.DeploymentInfo;
import com.wavemaker.tools.deployment.DeploymentTarget;

public class VmcDeploymentTarget implements DeploymentTarget {

    public static final String SUCCESS_RESULT = "SUCCESS";
    
    public static final String TOKEN_EXPIRED_RESULT = "ERROR: CloudFoundry login token expired";
    
	public static final String VMC_USERNAME_PROPERTY = "username";
	
	public static final String VMC_PASSWORD_PROPERTY = "password";
	
	public static final String VMC_URL_PROPERTY = "url";
	
	public static final Map<String, String> CONFIGURABLE_PROPERTIES;

	private static final String DEFAULT_URL = "https://api.cloudfoundry.com";
	
	private static final String HREF_TEMPLATE = "<a href=\"url\" target=\"_blank\">url</a>";
	
	private static final String SERVICE_TYPE = "database";
	
    private static final String SERVICE_TIER = "free";
	
    private static final String MYSQL_SERVICE_VENDOR = "mysql";
	
	private static final String MYSQL_SERVICE_VERSION = "5.1";
	
	private static final String POSTGRES_SERVICE_VENDOR = "postgres";
    
    private static final String POSTGRES_SERVICE_VERSION = "9.0";
	
	private static final Log log = LogFactory.getLog(VmcDeploymentTarget.class);
	
	static {
		Map<String, String> props = new LinkedHashMap<String, String>();
		props.put(VMC_USERNAME_PROPERTY, "username@mydomain.com");
		props.put(VMC_PASSWORD_PROPERTY, "password");
		props.put(VMC_URL_PROPERTY, DEFAULT_URL);
		CONFIGURABLE_PROPERTIES = Collections.unmodifiableMap(props);
	}
	
	public String validateDeployment(DeploymentInfo deploymentInfo) {
	    CloudFoundryClient client = getClient(deploymentInfo);
	    
	    List<String> uris = new ArrayList<String>();
        String url = deploymentInfo.getTarget();
        if (!hasText(url)){
            url = DEFAULT_URL;
        }
        uris.add(url.replace("api", deploymentInfo.getApplicationName()));
        
        try {
            client.createApplication(deploymentInfo.getApplicationName(), CloudApplication.SPRING, client.getDefaultApplicationMemory(CloudApplication.SPRING), uris, null, true);
            return "SUCCESS";
        } catch (CloudFoundryException ex) {
            if (HttpStatus.FORBIDDEN == ex.getStatusCode()) {
                return TOKEN_EXPIRED_RESULT;
            } else if (HttpStatus.BAD_REQUEST == ex.getStatusCode()) {
                return "ERROR: "+ex.getDescription();
            } else {
                throw ex;
            }
        }
	}
	
	public String deploy(File webapp, DeploymentInfo deploymentInfo) {
		
		CloudFoundryClient client = getClient(deploymentInfo);
		
		validateWar(webapp);
		
		List<String> uris = new ArrayList<String>();
		String url = deploymentInfo.getTarget();
		if (!hasText(url)){
			url = DEFAULT_URL;
		}
		uris.add(url.replace("api", deploymentInfo.getApplicationName()));
		
		try {
		    client.createApplication(deploymentInfo.getApplicationName(), CloudApplication.SPRING, client.getDefaultApplicationMemory(CloudApplication.SPRING), uris, null, true);
		} catch (CloudFoundryException ex) {
		    if (HttpStatus.FORBIDDEN == ex.getStatusCode()) {
		        return TOKEN_EXPIRED_RESULT;
		    } else if (HttpStatus.BAD_REQUEST == ex.getStatusCode()) {
		        return "ERROR: "+ex.getDescription();
		    } else {
		        throw ex;
		    }
		}
		
		setupServices(client, deploymentInfo);
		
		Timer timer = new Timer();
		try {
			client.uploadApplication(deploymentInfo.getApplicationName(), webapp, new LoggingStatusCallback(timer));
		} catch (IOException ex) {
			throw new WMRuntimeException("Error ocurred while trying to upload WAR file.", ex);
		}
		
		log.info("Application upload completed in " + timer.stop() + "ms");
		
		CloudApplication application = client.getApplication(deploymentInfo.getApplicationName());
		if(application.getState().equals(CloudApplication.AppState.STARTED)) {
			doRestart(deploymentInfo, client);
		} else {
			doStart(deploymentInfo, client);
		}
		return SUCCESS_RESULT;
	}

	/**
     * @param deploymentInfo
     */
    private void setupServices(CloudFoundryClient client, DeploymentInfo deploymentInfo) {
        if (CollectionUtils.isEmpty(deploymentInfo.getDatabases())) {
            return;
        }
        
        CloudApplication app = client.getApplication(deploymentInfo.getApplicationName());
        
        for (DeploymentDB db : deploymentInfo.getDatabases()) {
            if (app.getServices().contains(db.getDbName())) {
                //service binding already exists
                continue;
            }
            try {
                CloudService service = client.getService(db.getDbName());
                Assert.state(MYSQL_SERVICE_VENDOR.equals(service.getVendor()), "There is already a service provisioned with the name '"+db.getDbName()+"' but it is not a MySQL service.");
            } catch (CloudFoundryException ex) {
                if (ex.getStatusCode() != HttpStatus.NOT_FOUND) {
                    throw ex;
                }
                client.createService(createMySqlService(db));
            }
            client.bindService(deploymentInfo.getApplicationName(), db.getDbName());
        }
    }

    /**
     * @param db
     * @return
     */
    private CloudService createMySqlService(DeploymentDB db) {
        CloudService mysql = new CloudService();
        mysql.setType(SERVICE_TYPE);
        mysql.setVendor(MYSQL_SERVICE_VENDOR);
        mysql.setTier(SERVICE_TIER);
        mysql.setVersion(MYSQL_SERVICE_VERSION);
        mysql.setName(db.getDbName());
        return mysql;
    }

    public String undeploy(DeploymentInfo deploymentInfo) {
		CloudFoundryClient client = getClient(deploymentInfo);
		log.info("Deleting application "+deploymentInfo.getApplicationName());
		Timer timer = new Timer();
		timer.start();
		client.deleteApplication(deploymentInfo.getApplicationName());
		log.info("Application "+deploymentInfo.getApplicationName()+" deleted successfully in "+timer.stop()+"ms");
		return SUCCESS_RESULT;
	}

	public String redeploy(DeploymentInfo deploymentInfo) {
		CloudFoundryClient client = getClient(deploymentInfo);
		doRestart(deploymentInfo, client);
		return SUCCESS_RESULT;
	}

	public String start(DeploymentInfo deploymentInfo) {
		CloudFoundryClient client = getClient(deploymentInfo);
		doStart(deploymentInfo, client);
		return SUCCESS_RESULT;
	}

	public String stop(DeploymentInfo deploymentInfo) {
		CloudFoundryClient client = getClient(deploymentInfo);
		log.info("Stopping application "+deploymentInfo.getApplicationName());
		Timer timer = new Timer();
		timer.start();
		client.stopApplication(deploymentInfo.getApplicationName());
		log.info("Application "+deploymentInfo.getApplicationName()+" stopped successfully in "+timer.stop()+"ms");
		return SUCCESS_RESULT;
	}

	public List<AppInfo> listDeploymentNames(DeploymentInfo deploymentInfo) {
		CloudFoundryClient client = getClient(deploymentInfo);
		List<AppInfo> infoList = new ArrayList<AppInfo>();
		List<CloudApplication> cloudApps = client.getApplications();
		for(CloudApplication app : cloudApps) {
			String href = HREF_TEMPLATE.replaceAll("url", "http://"+app.getUris().get(0));
			infoList.add(new AppInfo(app.getName(), href, app.getState().toString()));
		}
		return infoList;
	}

	public Map<String, String> getConfigurableProperties() {
		return CONFIGURABLE_PROPERTIES;
	}
	
	private void doRestart(DeploymentInfo deploymentInfo, CloudFoundryClient client) {
		log.info("Restarting application "+deploymentInfo.getApplicationName());
		Timer timer = new Timer();
		timer.start();
		client.restartApplication(deploymentInfo.getApplicationName());
		log.info("Application "+deploymentInfo.getApplicationName()+" restarted successfully in "+timer.stop()+"ms");
	}
	
	private void doStart(DeploymentInfo deploymentInfo, CloudFoundryClient client) {
		log.info("Starting application "+deploymentInfo.getApplicationName());
		Timer timer = new Timer();
		timer.start();
		client.startApplication(deploymentInfo.getApplicationName());
		log.info("Application "+deploymentInfo.getApplicationName()+" started successfully in "+timer.stop()+"ms");
	}
	
	private CloudFoundryClient getClient(DeploymentInfo deploymentInfo) {
		Assert.hasText(deploymentInfo.getToken(), "CloudFoundry login token not supplied.");
		String url = deploymentInfo.getTarget();
		
		if (!hasText(url)){
			url = DEFAULT_URL;
		}
		
		try {
			CloudFoundryClient client = new CloudFoundryClient(null, null, deploymentInfo.getToken(), new URL(url), new ProtocolCheckingClientHttpRequestFactory());
			return client;
		} catch (MalformedURLException ex) {
			throw new WMRuntimeException("CloudFoundry target URL is invalid", ex);
		}
	}
	
	private void validateWar(File war) {
		Assert.notNull(war, "war cannot be null");
		Assert.isTrue(war.exists(), "war does not exist");
		Assert.isTrue(!war.isDirectory(), "war cannot be a directory");
	}
	
	private static final class LoggingStatusCallback implements UploadStatusCallback {

		private Timer timer;
		
		public LoggingStatusCallback(Timer timer) {
			this.timer = timer;
		}
		
		public void onCheckResources() {
			log.info("Preparing to upload to CloudFoundry - comparing resources...");
		}

		public void onMatchedFileNames(Set<String> fileNames) {
			log.info(fileNames.size()+ " files already cached...");
		}

		public void onProcessMatchedResources(int length) {
			log.info("Uploading "+length+" bytes...");
			timer.start();
		}	
	}
	
	private static final class Timer {
		
		private long startTime;
		
		public void start() {
			startTime = System.currentTimeMillis();
		}
		
		public long stop() {
			return System.currentTimeMillis() - startTime;
		}
	}
	
	private static final class ProtocolCheckingClientHttpRequestFactory implements ClientHttpRequestFactory {

	    private ClientHttpRequestFactory delegate = new SimpleClientHttpRequestFactory();
	    
        /** 
         * {@inheritDoc}
         */
        public ClientHttpRequest createRequest(URI uri, HttpMethod method) throws IOException {
            try {
                return delegate.createRequest(uri, method);
            } catch (RestClientException clientException) {
                if (uri.getScheme().startsWith("https")) {
                    try {
                        URI httpUri = new URI("http", uri.getHost(), uri.getPath(), uri.getFragment());
                        return delegate.createRequest(httpUri, method);
                    } catch (URISyntaxException uriException) {
                        //throw original client exception in this case
                    }
                }
                throw clientException;
            }
         }
	    
	}

}
