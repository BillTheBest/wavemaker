
package com.wavemaker.tools.io;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.net.URLConnection;
import java.net.URLStreamHandler;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.wavemaker.tools.io.exception.ResourceTypeMismatchException;

/**
 * Factory class that can be used to construct a {@link URL} for a given {@link Resource}. The {@link URL}s returned
 * from this class can be used to access file content using the {@link URL#openStream()} method, however, the URL cannot
 * be serialized. URLs can be used with a {@link URLClassLoader}.
 * 
 * @author Phillip Webb
 */
public abstract class ResourceURL {

    public static final String PROTOCOL = "rfs";

    /**
     * Get a URL for the given {@link Resource}.
     * 
     * @param resource the resource
     * @return a URL for the resource
     * @throws MalformedURLException
     */
    public static URL get(Resource resource) throws MalformedURLException {
        String spec = getSpec(resource);
        ResourceURLStreamHandler handler = new ResourceURLStreamHandler(resource);
        return new URL(null, spec, handler);
    }

    /**
     * Get a {@link List} of {@link URL}s for the given {@link Resource}s.
     * 
     * @param resources
     * @return
     * @throws MalformedURLException
     */
    public static List<URL> getForResources(Iterable<? extends Resource> resources) throws MalformedURLException {
        List<URL> urls = new ArrayList<URL>();
        for (Resource resource : resources) {
            urls.add(get(resource));
        }
        return Collections.unmodifiableList(urls);
    }

    private static String getSpec(Resource resource) {
        return PROTOCOL + ":" + resource.toString();
    }

    /**
     * Internal {@link URLStreamHandler} used with {@link Resource} URLs.
     */
    private static class ResourceURLStreamHandler extends URLStreamHandler {

        private final Folder root;

        public ResourceURLStreamHandler(Resource resource) {
            this.root = findRoot(resource);
        }

        @Override
        protected void parseURL(URL u, String spec, int start, int limit) {
            super.parseURL(u, spec, start, limit);
        }

        private Folder findRoot(Resource resource) {
            Resource root = resource;
            while (root.getParent() != null) {
                root = root.getParent();
            }
            return (Folder) root;
        }

        @Override
        protected URLConnection openConnection(URL url) throws IOException {
            String path = url.getPath();
            try {
                File file = this.root.getFile(path);
                if (!file.exists()) {
                    throw new IOException("File '" + file + "' does not exist");
                }
                return new FileURLConnection(url, file);
            } catch (ResourceTypeMismatchException e) {
                throw new IOException("Unable to open URL connection to folder '" + path + "'", e);
            }
        }
    }

    /**
     * Internal {@link URLConnection} used with {@link Resource} URLs.
     */
    private static class FileURLConnection extends URLConnection {

        private final File file;

        public FileURLConnection(URL url, File file) {
            super(url);
            this.file = file;
        }

        @Override
        public void connect() throws IOException {
        }

        @Override
        public InputStream getInputStream() throws IOException {
            return this.file.getContent().asInputStream();
        }
    }
}
