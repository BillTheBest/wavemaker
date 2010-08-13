/*
 *  Copyright (C) 2007-2010 WaveMaker Software, Inc.
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
package com.wavemaker.tools.service;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.io.Writer;


/**
 * Abstraction for reading and writing files.  Each FileService handles encoding
 * issues (reading and writing files using its defined encoding), and it also
 * knows about a root (enabling relative path operations).
 *
 * @author Simon Toens
 * @author Matt Small
 * @version $Rev$ - $Date$
 */
public interface FileService {
    
    /**
     * Return the current encoding for this FileService.
     */
    String getEncoding();
    
    /**
     * Return the root for this FileService.
     */
    File getFileServiceRoot();

    /**
     * Write the specified contents to a relative path.
     * 
     * @param path
     *                The relative path (according to the FileService) to write
     *                to.
     * @param data
     *                The data to write (using the FileService's encoding).
     * @throws IOException
     */
    void writeFile(String path, String data)
        throws IOException;

    /**
     * Write the specified contents to an absolute path.
     * 
     * @param file
     *                The absolute path to write to.
     * @param data
     *                The data to write (using the FileService's encoding).
     * @throws IOException
     */
    void writeFile(File file, String data)
        throws IOException;
    
    /**
     * Read arbitrary data from a file.
     * 
     * @param path
     *                The relative path to read from.
     * @return
     *                The data read.
     * @throws IOException
     */
    String readFile(String path)
        throws IOException;
    
    /**
     * Read arbitrary data from a file.
     * 
     * @param path
     *                The absolute path to read from.
     * @return
     *                The data read.
     * @throws IOException
     */
    String readFile(File file)
        throws IOException;

    /**
     * Delete a file at the specified path.
     * @param path The path to delete.
     * @return True iff the file delete was successful.
     */
    boolean deleteFile(String path);
    
    /**
     * Get a Reader for the specified relative path, using this FileService's
     * encoding.
     */
    Reader getReader(String path)
            throws UnsupportedEncodingException, FileNotFoundException;
    
    /**
     * Get a Reader for the specified file, using this FileService's encoding.
     */
    Reader getReader(File file)
            throws UnsupportedEncodingException, FileNotFoundException;
    
    /**
     * Get a Writer for the specified relative path, using this FileService's
     * encoding.
     */
    Writer getWriter(String path)
            throws UnsupportedEncodingException, FileNotFoundException;
    
    /**
     * Get a Writer for the specified file, using this FileService's encoding.
     */
    Writer getWriter(File file)
            throws UnsupportedEncodingException, FileNotFoundException;
    
    /**
     * Returns true iff the file exists.
     */
    boolean fileExists(String path);
    
    /**
     * Return true iff the file exists.
     */
    boolean fileExists(File file);
}