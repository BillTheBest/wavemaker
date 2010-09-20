
package com.wavemaker.runtime.ws.salesforce.gen;

import java.util.ArrayList;
import java.util.List;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;


/**
 * <p>Java class for anonymous complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType>
 *   &lt;complexContent>
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType">
 *       &lt;sequence>
 *         &lt;element name="sObjects" type="{urn:sobject.partner.soap.sforce.com}sObject" maxOccurs="unbounded" minOccurs="0"/>
 *       &lt;/sequence>
 *     &lt;/restriction>
 *   &lt;/complexContent>
 * &lt;/complexType>
 * </pre>
 * 
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "", propOrder = {
    "sObjects"
})
@XmlRootElement(name = "update", namespace = "urn:partner.soap.sforce.com")
public class Update {

    @XmlElement(namespace = "urn:partner.soap.sforce.com")
    protected List<SObjectType> sObjects;

    /**
     * Gets the value of the sObjects property.
     * 
     * <p>
     * This accessor method returns a reference to the live list,
     * not a snapshot. Therefore any modification you make to the
     * returned list will be present inside the JAXB object.
     * This is why there is not a <CODE>set</CODE> method for the sObjects property.
     * 
     * <p>
     * For example, to add a new item, do as follows:
     * <pre>
     *    getSObjects().add(newItem);
     * </pre>
     * 
     * 
     * <p>
     * Objects of the following type(s) are allowed in the list
     * {@link SObjectType }
     * 
     * 
     */
    public List<SObjectType> getSObjects() {
        if (sObjects == null) {
            sObjects = new ArrayList<SObjectType>();
        }
        return this.sObjects;
    }

    /**
     * Sets the value of the sObjects property.
     * 
     * @param sObjects
     *     allowed object is
     *     {@link SObjectType }
     *     
     */
    public void setSObjects(List<SObjectType> sObjects) {
        this.sObjects = sObjects;
    }

}
