
package com.wavemaker.tools.filesystem.impl;

import com.wavemaker.tools.filesystem.File;
import com.wavemaker.tools.filesystem.FileContent;
import com.wavemaker.tools.filesystem.Folder;

public class FileSystemFile<R> extends FileSystemResource<R> implements File {

    public FileSystemFile(FileSystem<R> fileSystem, R root, Path path) {
        super(fileSystem, root, path);
    }

    @Override
    public long getSize() {
        // TODO Auto-generated method stub
        return 0;
    }

    @Override
    public long getLastModified() {
        // TODO Auto-generated method stub
        return 0;
    }

    @Override
    public byte[] getSha1Digest() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public FileContent getContent() {
        // TODO Auto-generated method stub
        return null;
    }

    @Override
    public void copyTo(Folder folder) {
        // TODO Auto-generated method stub

    }

    @Override
    public void moveTo(Folder folder) {
        // TODO Auto-generated method stub

    }

    @Override
    public void touch() {
        // TODO Auto-generated method stub

    }

    @Override
    public void delete() {
        // TODO Auto-generated method stub

    }

}
