
package com.wavemaker.io.filesystem.java;

import java.io.File;

import com.wavemaker.io.filesystem.FileSystemPath;

public class JavaFileSystemKey {

    private final FileSystemPath path;

    private final File file;

    public JavaFileSystemKey(File root, FileSystemPath path) {
        this.path = path;
        this.file = new File(root, path.toString());
    }

    public FileSystemPath getPath() {
        return this.path;
    }

    public File getFile() {
        return this.file;
    }
}
