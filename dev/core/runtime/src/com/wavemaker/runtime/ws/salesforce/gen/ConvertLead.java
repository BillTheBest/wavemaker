/*
 * Copyright (C) 2011 WaveMaker Software, Inc.
 *
 * This file is part of WaveMaker Enterprise.
 *  You may not use this file in any manner except through written agreement with WaveMaker Software, Inc.
 *
 */ 


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
 *         &lt;element name="leadConverts" type="{urn:partner.soap.sforce.com}LeadConvert" maxOccurs="unbounded" minOccurs="0"/>
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
    "leadConverts"
})
@XmlRootElement(name = "convertLead", namespace = "urn:partner.soap.sforce.com")
public class ConvertLead {

    @XmlElement(namespace = "urn:partner.soap.sforce.com")
    protected List<LeadConvertType> leadConverts;

    /**
     * Gets the value of the leadConverts property.
     * 
     * <p>
     * This accessor method returns a reference to the live list,
     * not a snapshot. Therefore any modification you make to the
     * returned list will be present inside the JAXB object.
     * This is why there is not a <CODE>set</CODE> method for the leadConverts property.
     * 
     * <p>
     * For example, to add a new item, do as follows:
     * <pre>
     *    getLeadConverts().add(newItem);
     * </pre>
     * 
     * 
     * <p>
     * Objects of the following type(s) are allowed in the list
     * {@link LeadConvertType }
     * 
     * 
     */
    public List<LeadConvertType> getLeadConverts() {
        if (leadConverts == null) {
            leadConverts = new ArrayList<LeadConvertType>();
        }
        return this.leadConverts;
    }

    /**
     * Sets the value of the leadConverts property.
     * 
     * @param leadConverts
     *     allowed object is
     *     {@link LeadConvertType }
     *     
     */
    public void setLeadConverts(List<LeadConvertType> leadConverts) {
        this.leadConverts = leadConverts;
    }

}
