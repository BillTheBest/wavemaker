
package com.wavemaker.tools.filesystem.impl;

import java.io.InputStream;
import java.io.OutputStream;

import org.springframework.util.Assert;

import com.wavemaker.tools.filesystem.File;
import com.wavemaker.tools.filesystem.FileContent;
import com.wavemaker.tools.filesystem.Folder;

/**
 * {@link File} implementation backed by a {@link FileSystem}.
 * 
 * @author Phillip Webb
 */
public class FileSystemFile<K> extends FileSystemResource<K> implements File {

    private final FileContent content = new AbstractFileContent() {

        @Override
        public InputStream asInputStream() {
            touchParent();
            return getFileSystem().getInputStream(getKey());
        }

        @Override
        public OutputStream asOutputStream() {
            touchParent();
            return getFileSystem().getOutputStream(getKey());
        }
    };

    FileSystemFile(Path path, FileSystem<K> fileSystem, K key) {
        super(path, fileSystem, key);
        ResourceType resourceType = getFileSystem().getResourceType(key);
        Assert.state(resourceType != ResourceType.FOLDER, "Unable to access existing folder '" + super.toString() + "' as a file");
    }

    @Override
    public long getSize() {
        return getFileSystem().getSize(getKey());
    }

    @Override
    public long getLastModified() {
        return getFileSystem().getLastModified(getKey());
    }

    @Override
    public byte[] getSha1Digest() {
        return getFileSystem().getSha1Digest(getKey());
    }

    @Override
    public FileContent getContent() {
        return this.content;
    }

    @Override
    public void delete() {
        if (exists()) {
            getFileSystem().deleteFile(getKey());
        }
    }

    @Override
    public void moveTo(Folder folder) {
        Assert.notNull(folder, "Folder must not be null");
        if (exists()) {
            File destination = folder.getFile(getName());
            destination.getContent().write(getContent().asInputStream());
            getFileSystem().deleteFile(getKey());
        }
    }

    @Override
    public void copyTo(Folder folder) {
        Assert.notNull(folder, "Folder must not be null");
        if (exists()) {
            File destination = folder.getFile(getName());
            destination.getContent().write(getContent().asInputStream());
        }
    }

    @Override
    public void touch() {
        if (!exists()) {
            touchParent();
            getFileSystem().touch(getKey());
        }
    }
}
