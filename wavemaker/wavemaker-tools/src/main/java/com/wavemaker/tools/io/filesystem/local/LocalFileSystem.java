
package com.wavemaker.tools.io.filesystem.local;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.util.Assert;

import com.wavemaker.tools.io.exception.ResourceException;
import com.wavemaker.tools.io.filesystem.FileSystem;
import com.wavemaker.tools.io.filesystem.JailedResourcePath;
import com.wavemaker.tools.io.filesystem.ResourceType;

/**
 * {@link FileSystem} implementation backed by standard {@link File java.io.File}s.
 * 
 * @author Phillip Webb
 */
public class LocalFileSystem implements FileSystem<LocalFileSystemKey> {

    private final File root;

    public LocalFileSystem(File root) {
        Assert.notNull(root, "Root must not be null");
        if (!root.exists()) {
            if (!root.mkdirs()) {
                throw new IllegalStateException("Unable to create root folder " + root);
            }
        }
        Assert.state(root.isDirectory(), "The root '" + root + "' does not reference a directory");
        this.root = root;
    }

    @Override
    public LocalFileSystemKey getKey(JailedResourcePath path) {
        return new LocalFileSystemKey(this.root, path);
    }

    @Override
    public JailedResourcePath getPath(LocalFileSystemKey key) {
        return key.getPath();
    }

    @Override
    public ResourceType getResourceType(LocalFileSystemKey key) {
        File file = key.getFile();
        if (!file.exists()) {
            return ResourceType.DOES_NOT_EXIST;
        }
        return file.isDirectory() ? ResourceType.FOLDER : ResourceType.FILE;
    }

    @Override
    public void createFile(LocalFileSystemKey key) {
        File file = key.getFile();
        try {
            if (!file.createNewFile()) {
                throw new ResourceException("Unable to create file " + file);
            }
        } catch (IOException e) {
            throw new ResourceException(e);
        }
    }

    @Override
    public void createFolder(LocalFileSystemKey key) {
        File file = key.getFile();
        if (!file.mkdir()) {
            throw new ResourceException("Unable to create folder " + file);
        }
    }

    @Override
    public Iterable<String> list(LocalFileSystemKey key) {
        File[] files = key.getFile().listFiles();
        Assert.state(files != null, "Unable to list files for " + key.getFile());
        List<String> filenames = new ArrayList<String>();
        for (File file : files) {
            if (file.exists()) {
                filenames.add(file.getName());
            }
        }
        return Collections.unmodifiableList(filenames);
    }

    @Override
    public long getSize(LocalFileSystemKey key) {
        return key.getFile().length();
    }

    @Override
    public long getLastModified(LocalFileSystemKey key) {
        return key.getFile().lastModified();
    }

    @Override
    public InputStream getInputStream(LocalFileSystemKey key) {
        try {
            return new FileInputStream(key.getFile());
        } catch (FileNotFoundException e) {
            throw new ResourceException(e);
        }
    }

    @Override
    public OutputStream getOutputStream(LocalFileSystemKey key) {
        try {
            return new FileOutputStream(key.getFile(), false);
        } catch (FileNotFoundException e) {
            throw new ResourceException(e);
        }
    }

    @Override
    public void delete(LocalFileSystemKey key) {
        File file = key.getFile();
        if (!file.delete()) {
            throw new ResourceException("Unable to delete " + file);
        }
    }

    @Override
    public LocalFileSystemKey rename(LocalFileSystemKey key, String name) {
        File file = key.getFile();
        File dest = new File(file.getParentFile(), name);
        if (!file.renameTo(dest)) {
            throw new ResourceException("Unable to rename file '" + file + "' to '" + dest + "'");
        }
        JailedResourcePath newPath = key.getPath().getParent().get(name);
        return new LocalFileSystemKey(this.root, newPath);
    }

    @Override
    public int hashCode() {
        return this.root.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == this) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        LocalFileSystem other = (LocalFileSystem) obj;
        return this.root.equals(other.root);
    }
}
