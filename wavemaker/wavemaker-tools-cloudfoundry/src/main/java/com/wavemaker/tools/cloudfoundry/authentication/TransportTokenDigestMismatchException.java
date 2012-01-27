
package com.wavemaker.tools.cloudfoundry.authentication;

/**
 * Exception thrown when a {@link TransportToken} digest does not match.
 * 
 * @author Phillip Webb
 */
public class TransportTokenDigestMismatchException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /**
     * Create a new digest mismatch exception.
     * 
     * @param message
     */
    public TransportTokenDigestMismatchException(String message) {
        super(message);
    }

}
