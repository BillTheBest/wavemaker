/*
 * Copyright (C) 2011 VMWare, Inc. All rights reserved.
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

package com.wavemaker.studio.warp;

import java.util.List;

import com.wavemaker.runtime.service.annotations.ExposeToClient;
import com.wavemaker.runtime.service.annotations.HideFromClient;
import com.wavemaker.tools.ws.infoteria.FlowSupport;

/**
 * Login service class for Asteria Flow Designer Server
 */
@ExposeToClient
public class FlowService {

    private LoginService warpLoginService;

    private FlowSupport flowSupport;

    public String listProjects(String host, String port, String userName, String password, String domain) throws Exception {
        String sessionId = this.warpLoginService.logIn(host, port, userName, password, domain);

        return this.flowSupport.listProjects(host, port, sessionId);
    }

    public String listFlows(String host, String port, String projectName, String userName, String password, String domain) throws Exception {
        String sessionId = this.warpLoginService.logIn(host, port, userName, password, domain);

        return this.flowSupport.listFlows(host, port, projectName, sessionId);
    }

    public String listAllFlows(String host, String port, String userName, String password, String domain) throws Exception {
        String sessionId = this.warpLoginService.logIn(host, port, userName, password, domain);

        return this.flowSupport.listAllFlows(host, port, sessionId);
    }

    public void importFlows(String host, String port, String userName, String password, String domain, String projectName, String sessionId)
        throws Exception {
        importFlows(host, port, userName, password, domain, projectName, null, sessionId);
    }

    public void importFlows(String host, String port, String userName, String password, String domain, String projectName, List<String> flows,
        String sessionId) throws Exception {
        sessionId = this.warpLoginService.logIn(host, port, userName, password, domain);

        this.flowSupport.importFlows(host, port, userName, password, domain, projectName, flows, sessionId);
    }

    @HideFromClient
    public void setWarpLoginService(LoginService loginService) {
        this.warpLoginService = loginService;
    }

    @HideFromClient
    public void setFlowSupport(FlowSupport flowSupport) {
        this.flowSupport = flowSupport;
    }
}
