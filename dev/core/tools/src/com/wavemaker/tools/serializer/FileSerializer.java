/*
 *  Copyright (C) 2007-2011 WaveMaker Software, Inc.
 *
 *  This file is part of the WaveMaker Server Runtime.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.wavemaker.tools.serializer;

import java.io.File;

import com.wavemaker.tools.service.FileService;

/**
 * This interface describes the project file serializer.
 * 
 * @author ffu
 * @version $Rev$ - $Date$
 * 
 */
public interface FileSerializer {

    /**
     * Reads a file and return an object representing contents of the file.
     * 
     * @param file
     *                The file.
     * @param fileService
     *                A FileService for the current context.
     * @return An object representing contents of the file.
     * @throws FileSerializerException
     */
    public Object readObject(FileService fileService, File file)
            throws FileSerializerException;

    /**
     * Writes the object to a file.
     * 
     * @param fileService
     *                A FileService for the current context.
     * @param object
     *            The object to be serialized and written to a file.
     * @param file
     *            The file.
     * @throws FileSerializerException
     */
    public void writeObject(FileService fileService, Object object, File file)
            throws FileSerializerException;
}
