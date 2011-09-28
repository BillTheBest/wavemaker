/*
 * Copyright (C) 2010-2011 VMWare, Inc. All rights reserved.
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

package com.wavemaker.studio;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Hashtable;

import org.apache.log4j.Logger;
import org.springframework.core.io.FileSystemResource;
import org.springframework.web.multipart.MultipartFile;

import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.IOUtils;
import com.wavemaker.runtime.server.DownloadResponse;
import com.wavemaker.runtime.server.FileUploadResponse;
import com.wavemaker.runtime.server.ParamName;
import com.wavemaker.runtime.service.annotations.HideFromClient;
import com.wavemaker.tools.project.LocalStudioConfiguration;
import com.wavemaker.tools.project.ProjectManager;

/**
 * This is a client-facing service class. All public methods will be exposed to
 * the client. Their return values and parameters will be passed to the client
 * or taken from the client, respectively. This will be a singleton instance,
 * shared between all requests.
 */
public class ResourceFileService {
	protected final Logger logger = Logger.getLogger(getClass());

	private ProjectManager projectManager;

	// Used by spring
	@HideFromClient
	public void setProjectManager(ProjectManager manager) {
		this.projectManager = manager;
	}

	@HideFromClient
	protected File getProjectDir() {
		File projectDir;
		try {
			projectDir = this.projectManager.getCurrentProject()
					.getWebAppRoot().getFile();
		} catch (IOException e) {
			throw new WMRuntimeException(e);
		}
		return projectDir;
	}

	/*
	 * Gets the project's resources folder; initializes it if it doesn't yet
	 * exist
	 */
	@HideFromClient
	private File getResourcesDir() {
		File dir = new File(getProjectDir(), "resources");
		if (!dir.exists()) {
			dir.mkdir();
			new File(dir, "images").mkdir();
			new File(dir, "images/imagelists").mkdir();
			new File(dir, "images/buttons").mkdir();
			new File(dir, "images/logos").mkdir();
			new File(dir, "javascript").mkdir();
			new File(dir, "css").mkdir();
			new File(dir, "htmlcontent").mkdir();
		}
		return dir;
	}

	/* Respond's to user request to download a resource file */
	public DownloadResponse downloadFile(
			@ParamName(name = "folder") String folderpath,
			@ParamName(name = "filename") String filename) throws IOException {

		boolean isZip = false;
		File resourceDir = this.getResourcesDir();
		File parentDir = new File(resourceDir, folderpath);
		File localFile = new File(parentDir, filename);
		if (localFile.isDirectory()) {
			localFile = com.wavemaker.tools.project.ResourceManager
					.createZipFile(localFile, projectManager.getTmpDir().getFile());
			if (localFile == null)
				return (DownloadResponse) null;
			isZip = true;
			filename = localFile.getName();
		}

		return com.wavemaker.tools.project.ResourceManager.downloadFile(
				localFile, filename, isZip);

	}

	/*
	 * Respond's to user's request to rename/move a file. Will append a number
	 * to the name if there is already a file with the requested name
	 */
	public String renameFile(@ParamName(name = "from") String from,
			@ParamName(name = "to") String to,
			@ParamName(name = "overwrite") boolean overwrite) {
		File resourceDir = this.getResourcesDir();

		File dest = new File(resourceDir, to);
		if (!overwrite) {
			int lastIndexOfPeriod = to.lastIndexOf(".");
			String to1 = (lastIndexOfPeriod != -1) ? to.substring(0,
					to.lastIndexOf(".")) : to;
			String to_ext = (lastIndexOfPeriod != -1) ? to.substring(to
					.lastIndexOf(".") + 1) : "";
			for (int i = 0; i < 1000 && dest.exists(); i++)
				dest = new File(resourceDir, to1 + i
						+ ((lastIndexOfPeriod != -1) ? "." : "") + to_ext);
		}

		try {
			File f = new File(resourceDir, from);
			if (f.renameTo(dest))
				return dest.getName();
		} catch (Exception e) {
		}
		return "";
	}

	/*
	 * Moves a file that was uploaded to the tmp folder to the requested
	 * destination. All uploads go to tmp folder
	 */
	public String moveNewFile(@ParamName(name = "from") String from,
			@ParamName(name = "to") String to,
			@ParamName(name = "overwrite") boolean overwrite) {
		File resourceDir = this.getResourcesDir();

		File dest = new File(resourceDir, to);

		if (!overwrite) {
			String to1 = (to.lastIndexOf(".") != -1) ? to.substring(0,
					to.lastIndexOf(".")) : to;
			String to_ext = (to.lastIndexOf(".") != -1) ? to.substring(to
					.lastIndexOf(".") + 1) : "";
			for (int i = 0; i < 1000 && dest.exists(); i++)
				dest = new File(resourceDir, to1 + i + "." + to_ext);
		}
		try {
			File f = new File(projectManager.getTmpDir().getFile(), from);
			if (f.renameTo(dest)) {
				return dest.getName();
			}
		} catch (Exception e) {
		}
		return "";
	}

	/*
	 * Create a folder; name should have the full relative path within the
	 * resources folder
	 */
	public boolean createFolder(@ParamName(name = "name") String name) {
		File resourceDir = this.getResourcesDir();
		try {
			File f = new File(resourceDir, name);
			return f.mkdir();
		} catch (Exception e) {
			return false;
		}
	}

	/*
	 * Delete the file; name should be the full relative path within resources
	 * folder
	 */
	public boolean deleteFile(@ParamName(name = "name") String name) {
		File resourceDir = this.getResourcesDir();
		try {
			File f = new File(resourceDir, name);
			IOUtils.deleteRecursive(f);
			return !f.exists();
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

	/*
	 * Send the client a datastruct listing all contents of the resources
	 * folder. WARNING: At some point we may want to support larger projects by
	 * NOT sending it all at once
	 */
	public Hashtable getResourceFolder() {
		File resourceDir = this.getResourcesDir();
		Hashtable P = new Hashtable();
		P.put("files", com.wavemaker.tools.project.ResourceManager.getListing(
				resourceDir, new File(resourceDir, ".includeJars")));
		P.put("file", resourceDir.getName());
		P.put("type", "folder");
		return P;
	}

	public FileUploadResponse uploadFile(
			@ParamName(name = "file") MultipartFile file, String path)
			throws IOException {
		// System.out.println("UPLOAD FILE");
		// System.out.println("UPLOAD FILE:" + file.getOriginalFilename());
		FileUploadResponse ret = new FileUploadResponse();
		try {
			File dir = new File(getResourcesDir(), path);
			File outputFile = new File(dir, file.getOriginalFilename()
					.replaceAll("[^a-zA-Z0-9.-_ ]", ""));
			// System.out.println("OUTPUT FILE:" +
			// outputFile.getAbsolutePath());
			FileOutputStream fos = new FileOutputStream(outputFile);
			IOUtils.copy(file.getInputStream(), fos);
			file.getInputStream().close();
			fos.close();
			ret.setPath(outputFile.getAbsolutePath());
			ret.setError("");
			ret.setWidth("");
			ret.setHeight("");

		} catch (Exception e) {
			ret.setError(e.getMessage());
		}
		return ret;
	}

	/*
	 * public boolean unzipFile(@ParamName(name="file") String file) { File
	 * zipfile = new File(this.getResourcesDir().getAbsolutePath() + "/" +
	 * file); File zipfolder =
	 * com.wavemaker.tools.project.ResourceManager.unzipFile(zipfile); return
	 * (zipfolder.exists() && zipfolder.isDirectory()); }
	 */
	/**
	 * Unzips a zip file in the tmp folder and moves it to the specified
	 * location. NOTE: Will not overwrite an existing folder at that location;
	 * instead will rename to avoid collision NOTE:
	 * 
	 * @see ProjectManager#openProject(String)
	 * @return An OpenProjectReturn object containing the current web path, as
	 *         well as any upgrades that were performed.
	 */
	public boolean unzipAndMoveNewFile(@ParamName(name = "file") String path) {
		File zipfile = new File(getResourcesDir(), path);
		File zipfolder;
		try {
			zipfolder = com.wavemaker.tools.project.ResourceManager
					.unzipFile(new LocalStudioConfiguration(), new FileSystemResource(zipfile)).getFile();
		} catch (IOException e) {
			throw new WMRuntimeException(e);
		}
		return zipfolder.exists() && zipfolder.isDirectory();
	}

	public boolean changeClassPath(String inPath, boolean isInClassPath) {
		try {
			if (inPath.indexOf("/") == 0)
				inPath = inPath.substring(1);
			String inFileName = inPath
					.substring(inPath.lastIndexOf("/") != -1 ? inPath
							.lastIndexOf("/") + 1 : 0);
			File f = new File(this.getResourcesDir(), ".includeJars");
			String fileContents;
			StringBuffer newFile = new StringBuffer("");
			String[] fileList;

			if (f.exists())
				fileContents = IOUtils.read(f);
			else
				fileContents = "";
			fileList = fileContents.split("\n");

			boolean found = false;
			for (int i = 0; i < fileList.length; i++) {
				boolean addFile = true;
				if (inPath.equals(fileList[i])) {
					if (isInClassPath) {
						found = true;
					} else {
						addFile = false;
					}
				}
				if (addFile) {
					if (newFile.length() > 0)
						newFile.append("\n");
					newFile.append(fileList[i]);
				}

			}

			File destFile = new File(getProjectDir(), "../lib/" + inFileName);
			if (isInClassPath && !found) {
				if (newFile.length() > 0)
					newFile.append("\n");
				newFile.append(inPath);
				File sourceFile = new File(this.getResourcesDir(), inPath);
				IOUtils.copy(sourceFile, destFile);
			} else if (!isInClassPath) {
				destFile.delete();
			}

			IOUtils.write(f, newFile.toString());

		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
		return true;
	}

}
