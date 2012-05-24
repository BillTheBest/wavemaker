
package com.wavemaker.tools.io;

import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertThat;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import com.wavemaker.tools.io.local.LocalFolder;

/**
 * Tests for {@link ResourceOperations}.
 * 
 * @author Phillip Webb
 */
public class ResourceOperationsTest {

    @Rule
    public TemporaryFolder temporaryFolder = new TemporaryFolder();

    @Test
    public void shouldCopyKeepingStructure() throws Exception {
        Folder from = new LocalFolder(this.temporaryFolder.newFolder("from"));
        Folder destination = new LocalFolder(this.temporaryFolder.newFolder("to"));

        from.getFile("/a/b/c/d.txt").getContent().write("d");
        from.getFile("/a/b/c/d.bak").getContent().write("~d");
        from.getFile("/a/b/c/e.txt").getContent().write("e");
        from.getFile("/a/b/f/g.txt").getContent().write("g");

        Folder source = from.getFolder("a");
        source.performOperationRecursively(ResourceOperations.copyFilesKeepingSameFolderStructure(source, destination,
            Including.fileNames().notEnding(".bak")));

        assertThat(destination.getFile("b/c/d.txt").getContent().asString(), is("d"));
        assertThat(destination.getFile("b/c/d.bak").exists(), is(false));
        assertThat(destination.getFile("b/c/e.txt").getContent().asString(), is("e"));
        assertThat(destination.getFile("b/f/g.txt").getContent().asString(), is("g"));
    }
}
