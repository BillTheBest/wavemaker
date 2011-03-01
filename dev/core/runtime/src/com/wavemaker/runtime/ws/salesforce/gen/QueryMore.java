/*
 * Copyright (C) 2011 WaveMaker Software, Inc.
 *
 * This file is part of WaveMaker Enterprise.
 *  You may not use this file in any manner except through written agreement with WaveMaker Software, Inc.
 *
 */ 


package com.wavemaker.runtime.ws.salesforce.gen;

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
 *         &lt;element name="queryLocator" type="{urn:partner.soap.sforce.com}QueryLocator"/>
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
    "queryLocator"
})
@XmlRootElement(name = "queryMore", namespace = "urn:partner.soap.sforce.com")
public class QueryMore {

    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true)
    protected String queryLocator;

    /**
     * Gets the value of the queryLocator property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getQueryLocator() {
        return queryLocator;
    }

    /**
     * Sets the value of the queryLocator property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setQueryLocator(String value) {
        this.queryLocator = value;
    }

}
