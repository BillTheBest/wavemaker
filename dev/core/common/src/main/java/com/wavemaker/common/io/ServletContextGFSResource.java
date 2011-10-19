/*
 *  Copyright (C) 2007-2011 VMware, Inc. All rights reserved.
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

package com.wavemaker.common.io;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

import javax.servlet.ServletContext;

import org.springframework.util.Assert;
//import org.springframework.util.StringUtils;

import com.mongodb.gridfs.GridFS;

/**
 * @author Ed Callahan
 *
 */


public class ServletContextGFSResource extends GFSResource {

private ServletContext servletContext;

	/**
	 * @param gfs
	 * @param path
	 */
	public ServletContextGFSResource(GridFS gfs, ServletContext servletContext, String path) {
        //this(gfs, servletContext, StringUtils.getFilename(path), path); //Resource with a file
		super(gfs,path); //Resource without a File		
		Assert.notNull(servletContext, "Cannot resolve ServletContextResource without ServletContext");
        this.servletContext = servletContext;
	}

	/**
	 * @param gfs
	 * @param in
	 * @param filename
	 * @param path
	 */
	public ServletContextGFSResource(GridFS gfs, ServletContext servletContext, String filename,
			String path) {
		super(gfs, servletContext.getResourceAsStream(path), filename, path);		
		Assert.notNull(servletContext, "Cannot resolve ServletContextResource without ServletContext");
        this.servletContext = servletContext;
	}

	@Override
	public InputStream getInputStream() throws IOException {
        InputStream is = this.servletContext.getResourceAsStream(this.path);
        if (is == null) {
            throw new FileNotFoundException("Could not open servletContext " + this.path + " " + this.filename );
        }
        return is;
	}
	
	public ServletContext getServletContext() {
		return this.servletContext;
	}
	
}
