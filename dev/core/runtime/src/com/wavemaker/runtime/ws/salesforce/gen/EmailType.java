
package com.wavemaker.runtime.ws.salesforce.gen;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlSeeAlso;
import javax.xml.bind.annotation.XmlType;


/**
 * <p>Java class for Email complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="Email">
 *   &lt;complexContent>
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType">
 *       &lt;sequence>
 *         &lt;element name="bccSender" type="{http://www.w3.org/2001/XMLSchema}boolean"/>
 *         &lt;element name="emailPriority" type="{urn:partner.soap.sforce.com}EmailPriority"/>
 *         &lt;element name="replyTo" type="{http://www.w3.org/2001/XMLSchema}string"/>
 *         &lt;element name="saveAsActivity" type="{http://www.w3.org/2001/XMLSchema}boolean"/>
 *         &lt;element name="senderDisplayName" type="{http://www.w3.org/2001/XMLSchema}string"/>
 *         &lt;element name="subject" type="{http://www.w3.org/2001/XMLSchema}string"/>
 *         &lt;element name="useSignature" type="{http://www.w3.org/2001/XMLSchema}boolean"/>
 *       &lt;/sequence>
 *     &lt;/restriction>
 *   &lt;/complexContent>
 * &lt;/complexType>
 * </pre>
 * 
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "Email", namespace = "urn:partner.soap.sforce.com", propOrder = {
    "bccSender",
    "emailPriority",
    "replyTo",
    "saveAsActivity",
    "senderDisplayName",
    "subject",
    "useSignature"
})
@XmlSeeAlso({
    MassEmailMessageType.class,
    SingleEmailMessageType.class
})
public class EmailType {

    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true, type = Boolean.class, nillable = true)
    protected Boolean bccSender;
    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true, nillable = true)
    protected EmailPriorityType emailPriority;
    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true, nillable = true)
    protected String replyTo;
    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true, type = Boolean.class, nillable = true)
    protected Boolean saveAsActivity;
    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true, nillable = true)
    protected String senderDisplayName;
    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true, nillable = true)
    protected String subject;
    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true, type = Boolean.class, nillable = true)
    protected Boolean useSignature;

    /**
     * Gets the value of the bccSender property.
     * 
     * @return
     *     possible object is
     *     {@link Boolean }
     *     
     */
    public Boolean getBccSender() {
        return bccSender;
    }

    /**
     * Sets the value of the bccSender property.
     * 
     * @param value
     *     allowed object is
     *     {@link Boolean }
     *     
     */
    public void setBccSender(Boolean value) {
        this.bccSender = value;
    }

    /**
     * Gets the value of the emailPriority property.
     * 
     * @return
     *     possible object is
     *     {@link EmailPriorityType }
     *     
     */
    public EmailPriorityType getEmailPriority() {
        return emailPriority;
    }

    /**
     * Sets the value of the emailPriority property.
     * 
     * @param value
     *     allowed object is
     *     {@link EmailPriorityType }
     *     
     */
    public void setEmailPriority(EmailPriorityType value) {
        this.emailPriority = value;
    }

    /**
     * Gets the value of the replyTo property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getReplyTo() {
        return replyTo;
    }

    /**
     * Sets the value of the replyTo property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setReplyTo(String value) {
        this.replyTo = value;
    }

    /**
     * Gets the value of the saveAsActivity property.
     * 
     * @return
     *     possible object is
     *     {@link Boolean }
     *     
     */
    public Boolean getSaveAsActivity() {
        return saveAsActivity;
    }

    /**
     * Sets the value of the saveAsActivity property.
     * 
     * @param value
     *     allowed object is
     *     {@link Boolean }
     *     
     */
    public void setSaveAsActivity(Boolean value) {
        this.saveAsActivity = value;
    }

    /**
     * Gets the value of the senderDisplayName property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getSenderDisplayName() {
        return senderDisplayName;
    }

    /**
     * Sets the value of the senderDisplayName property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setSenderDisplayName(String value) {
        this.senderDisplayName = value;
    }

    /**
     * Gets the value of the subject property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getSubject() {
        return subject;
    }

    /**
     * Sets the value of the subject property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setSubject(String value) {
        this.subject = value;
    }

    /**
     * Gets the value of the useSignature property.
     * 
     * @return
     *     possible object is
     *     {@link Boolean }
     *     
     */
    public Boolean getUseSignature() {
        return useSignature;
    }

    /**
     * Sets the value of the useSignature property.
     * 
     * @param value
     *     allowed object is
     *     {@link Boolean }
     *     
     */
    public void setUseSignature(Boolean value) {
        this.useSignature = value;
    }

}
