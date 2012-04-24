
package com.wavemaker.tools.security;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;

import org.springframework.util.Assert;
import org.springframework.util.StringUtils;
import org.springframework.web.util.WebUtils;

import com.wavemaker.tools.cloudfoundry.spinup.authentication.SharedSecret;
import com.wavemaker.tools.cloudfoundry.spinup.authentication.SharedSecretPropagation;
import com.wavemaker.tools.cloudfoundry.spinup.authentication.TransportToken;
import com.wavemaker.tools.cloudfoundry.spinup.authentication.TransportTokenDigestMismatchException;

/**
 * A servlet {@link Filter} that implements Security on cloud foundry.
 * 
 * @see LocalSecurityFilter
 * @author Phillip Webb
 */
public class CloudFoundrySecurityFilter implements Filter {

    private final SharedSecretPropagation propagation = new SharedSecretPropagation();

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        verifyAuthentication((HttpServletRequest) request);
        chain.doFilter(request, response);
    }

    private void verifyAuthentication(HttpServletRequest request) throws TransportTokenDigestMismatchException {
        Cookie cookie = WebUtils.getCookie(request, "wavemaker_authentication_token");
        Assert.state(cookie != null, "Unable to find cookie");
        Assert.state(StringUtils.hasLength(cookie.getValue()), "Cookie has no value");
        SharedSecret sharedSecret = this.propagation.getForSelf(true);
        sharedSecret.decrypt(TransportToken.decode(cookie.getValue()));
    }

    @Override
    public void destroy() {
    }
}
