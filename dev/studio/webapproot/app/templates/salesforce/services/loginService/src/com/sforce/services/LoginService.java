package com.sforce.services;

import com.sforce.soap.enterprise.salesforceservice.SforceService;
import com.sforce.soap.enterprise.salesforceservice.SessionHeader;
import com.wavemaker.runtime.RuntimeAccess;

/**
 * This is a client-facing service class.  All
 * public methods will be exposed to the client.  Their return
 * values and parameters will be passed to the client or taken
 * from the client, respectively.  This will be a singleton
 * instance, shared between all requests. 
 * 
 * To log, call the superclass method log(LOG_LEVEL, String) or log(LOG_LEVEL, String, Exception).
 * LOG_LEVEL is one of FATAL, ERROR, WARN, INFO and DEBUG to modify your log level.
 * For info on these levels, look for tomcat/log4j documentation
 */
public class LoginService extends com.wavemaker.runtime.javaservice.JavaServiceSuperClass {
    /* Pass in one of FATAL, ERROR, WARN,  INFO and DEBUG to modify your log level;
     *  recommend changing this to FATAL or ERROR before deploying.  For info on these levels, look for tomcat/log4j documentation
     */

    public LoginService() {
       super(INFO);
    }

    public String logIn(String userName, String password) throws Exception {
        String result;

        LoginObject bean = (LoginObject)RuntimeAccess.getInstance().getSpringBean("loginObject");
        SforceService svc = (SforceService) RuntimeAccess.getInstance().getServiceBean("salesforceService");
        bean.setSforceService(svc);

        try {
            result = bean.logIn(userName, password);
        } catch (Exception ex) {
            log(ERROR, "Login failed", ex);
            ex.printStackTrace();
            throw ex;
        }

        return result;
    }

    public String logOut() throws Exception {
        LoginObject bean = (LoginObject)RuntimeAccess.getInstance().getSpringBean("loginObject");
        return bean.logOut();
    }

    public static SessionHeader getSessionHeader() throws Exception {
        LoginObject bean = (LoginObject)RuntimeAccess.getInstance().getSpringBean("loginObject");
        return bean.getSessionHeader();
    }

    public static SforceService getSforceService() throws Exception {
        LoginObject bean = (LoginObject)RuntimeAccess.getInstance().getSpringBean("loginObject");
        return bean.getSforceService();
    }

}