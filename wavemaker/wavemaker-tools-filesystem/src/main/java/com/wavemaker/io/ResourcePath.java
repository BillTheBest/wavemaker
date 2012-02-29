
package com.wavemaker.io;

import org.springframework.util.Assert;
import org.springframework.util.ObjectUtils;

/**
 * A file or folder path.
 * 
 * @author Phillip Webb
 */
public final class ResourcePath {

    private final ResourcePath parent;

    private final String name;

    /**
     * Create a new root path instance.
     */
    public ResourcePath() {
        this(null, "");
    }

    /**
     * Private constructor used to create a nested path.
     * 
     * @param parent the parent
     * @param name the name of the path element
     * @see #get(String)
     */
    private ResourcePath(ResourcePath parent, String name) {
        Assert.notNull(name, "Name must not be null");
        this.parent = parent;
        this.name = name;
    }

    /**
     * Returns the name of the path element.
     * 
     * @return the name
     */
    public String getName() {
        return this.name;
    }

    /**
     * Returns the full path value.
     * 
     * @return the path value
     */
    @Override
    public String toString() {
        if (this.parent != null) {
            return this.parent + "/" + this.name;
        }
        return this.name;
    }

    /**
     * Get a new path relative to this one.
     * 
     * @param path the path to obtain.
     * @return a new path
     */
    public ResourcePath get(String path) {
        Assert.hasLength(path, "Path must not be empty");
        ResourcePath rtn = this;
        if (path.startsWith("/")) {
            rtn = new ResourcePath();
            path = path.substring(1);
        }
        while (path.indexOf("/") != -1) {
            rtn = rtn.newPath(path.substring(0, path.indexOf("/")));
            path = path.substring(path.indexOf("/") + 1);
        }
        return rtn.newPath(path);
    }

    /**
     * Internal factory method used to create a new path item.
     * 
     * @param name the name of the path
     * @return the new Path element
     */
    private ResourcePath newPath(String name) {
        if ("".equals(name)) {
            return this;
        }
        if ("..".equals(name)) {
            Assert.state(this.parent != null);
            return this.parent;
        }
        return new ResourcePath(this, name);
    }

    /**
     * Returns the parent of the path or <tt>null</tt> if this is a root path.
     * 
     * @return the parent or <tt>null</tt>
     */
    public ResourcePath getParent() {
        return this.parent;
    }

    @Override
    public int hashCode() {
        return toString().hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null) {
            return false;
        }
        if (obj == this) {
            return true;
        }
        if (obj instanceof ResourcePath) {
            ResourcePath other = (ResourcePath) obj;
            return ObjectUtils.nullSafeEquals(getParent(), other.getParent()) && this.name.equals(other.name);
        }
        return false;
    }
}
