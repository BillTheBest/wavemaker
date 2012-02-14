
package com.wavemaker.tools.filesystem;

/**
 * A file that may be stored on a physical disk or using some other mechanism. This interface provides read-only access
 * to files, for a mutable variant see {@link MutableFile}.
 * 
 * @see Folder
 * @see MutableFile
 * 
 * @author Phillip Webb
 */
public interface File extends Resource {

    /**
     * Returns the size in bytes of the virtual file.
     * 
     * @return the size in bytes
     */
    long getSize();

    /**
     * Gets the time this file object was last modified. The time is measured in milliseconds since the epoch (00:00:00
     * GMT, January 1, 1970).
     * 
     * @return the time this file object was last modified; or 0 if the file object does not exist, if an I/O error
     *         occurred, or if the operation is not supported
     */
    long getLastModified();

    /**
     * Provides access to file content.
     * 
     * @return the file content
     */
    FileContent getContent();
}
