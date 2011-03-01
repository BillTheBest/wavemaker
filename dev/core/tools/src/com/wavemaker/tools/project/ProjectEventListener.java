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
package com.wavemaker.tools.project;

/**
 * EventListener for Project events.
 * 
 * @author small
 * @version $Rev$ - $Date$
 *
 */
public interface ProjectEventListener {

    /**
     * Called when a project is closed.  Note that this is not guaranteed;
     * the user can simply go away, and this may never be called.
     * 
     * @param p
     */
    public void closeProject(Project p);
    
    /**
     * Called when a project is opened (after the project is created, but before
     * it is set as the ProjectManager's currentProject).
     * 
     * @param p
     */
    public void openProject(Project p);
}