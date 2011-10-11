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

package com.wavemaker.runtime.server;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.view.JsonView;

import com.wavemaker.common.MessageResource;
import com.wavemaker.common.WMException;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.json.JSONArray;
import com.wavemaker.json.JSONObject;
import com.wavemaker.json.JSONUnmarshaller;
import com.wavemaker.json.type.reflect.ReflectTypeUtils;
import com.wavemaker.runtime.server.view.TypedView;
import com.wavemaker.runtime.service.ServiceWire;
import com.wavemaker.runtime.service.TypedServiceReturn;
import com.wavemaker.runtime.service.response.ErrorResponse;

/**
 * Controller (in the MVC sense) implementing a JSON interface and view onto the AG framework.
 * 
 * @author Matt Small
 * @version $Rev$ - $Date$
 */
public class JSONRPCController extends ControllerBase {

    /** Logger for this class and subclasses */
    protected final Logger logger = Logger.getLogger(getClass());

    /*
     * (non-Javadoc)
     * 
     * @see com.wavemaker.runtime.server.ControllerBase#executeRequest(javax.servlet.http.HttpServletRequest,
     * javax.servlet.http.HttpServletResponse)
     */
    @Override
    protected ModelAndView executeRequest(HttpServletRequest request, HttpServletResponse response) throws IOException, WMException {

        String serviceName = ServerUtils.getServiceName(request);
        ModelAndView ret = null;
        String method = null;
        JSONArray params = null;
        // int callId = -1;

        String input;
        if (0 == request.getContentLength() || null == request.getInputStream()) {
            input = "";
        } else {
            input = ServerUtils.readInput(request);
        }

        if (this.logger.isDebugEnabled()) {
            this.logger.debug("Request body: '" + input + "'");
        }

        JSONObject jsonReq = (JSONObject) JSONUnmarshaller.unmarshal(input, getInternalRuntime().getJSONState());

        if (null == jsonReq) {
            throw new WMRuntimeException(MessageResource.FAILED_TO_PARSE_REQUEST, input);
        } else if (!jsonReq.containsKey(ServerConstants.METHOD) || !jsonReq.containsKey(ServerConstants.ID)) {
            throw new WMRuntimeException(MessageResource.SERVER_NOMETHODORID, input);
        }

        method = (String) jsonReq.get(ServerConstants.METHOD);
        // callId = jsonReq.getInt("id");
        params = null;
        if (jsonReq.containsKey(ServerConstants.PARAMETERS)) {
            Object rawParams = jsonReq.get(ServerConstants.PARAMETERS);

            if (rawParams instanceof JSONArray) {
                params = (JSONArray) rawParams;
            } else if (null == rawParams) {
                params = new JSONArray();
            } else if (rawParams instanceof JSONObject) {
                JSONObject tjo = (JSONObject) rawParams;
                if (tjo.isEmpty()) {
                    params = new JSONArray();
                } else {
                    throw new WMRuntimeException(MessageResource.JSONRPC_CONTROLLER_BAD_PARAMS_NON_EMPTY, tjo, jsonReq);
                }
            } else {
                throw new WMRuntimeException(MessageResource.JSONRPC_CONTROLLER_BAD_PARAMS_UNKNOWN_TYPE, rawParams.getClass(), jsonReq);
            }
        } else {
            params = new JSONArray();
        }

        if (this.logger.isInfoEnabled()) {
            this.logger.info("Invoke Service: " + serviceName + ", Method: " + method);
            if (this.logger.isDebugEnabled()) {
                this.logger.debug("Method " + method + " Parameters: " + params);
            }
        }

        ServiceWire sw = this.getServiceManager().getServiceWire(serviceName);
        if (null == sw) {
            throw new WMRuntimeException(MessageResource.NO_SERVICEWIRE, serviceName);
        }
        TypedServiceReturn reflInvokeRef = invokeMethod(sw, method, params, null);

        if (this.logger.isDebugEnabled()) {
            this.logger.debug("method " + method + " result: " + reflInvokeRef);
        }

        JsonView jv = getView();
        ret = getModelAndView(jv, reflInvokeRef);

        return ret;
    }

    /*
     * (non-Javadoc)
     * 
     * @see com.wavemaker.runtime.server.ControllerBase#getView()
     */
    @Override
    protected JsonView getView() {

        JsonView ret = new JsonView();
        ret.setJsonConfig(getInternalRuntime().getJSONState());
        return ret;
    }

    /*
     * (non-Javadoc)
     * 
     * @see com.wavemaker.runtime.server.ControllerBase#handleError(java.lang.String, java.lang.Throwable)
     */
    @Override
    protected ModelAndView handleError(final String message, Throwable t) {

        TypedView view = getView();

        ErrorResponse er = new ErrorResponse() {

            @Override
            public String getError() {
                return message;
            }
        };

        TypedServiceReturn tsr = new TypedServiceReturn();
        tsr.setReturnValue(er);
        tsr.setReturnType(ReflectTypeUtils.getFieldDefinition(er.getClass(), getInternalRuntime().getJSONState().getTypeState(), false, null));

        return getModelAndView(view, tsr);
    }
}