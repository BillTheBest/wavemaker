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
import javax.xml.bind.annotation.XmlType;


/**
 * <p>Java class for DescribeLayoutResult complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="DescribeLayoutResult">
 *   &lt;complexContent>
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType">
 *       &lt;sequence>
 *         &lt;element name="layouts" type="{urn:partner.soap.sforce.com}DescribeLayout" maxOccurs="unbounded"/>
 *         &lt;element name="recordTypeMappings" type="{urn:partner.soap.sforce.com}RecordTypeMapping" maxOccurs="unbounded" minOccurs="0"/>
 *         &lt;element name="recordTypeSelectorRequired" type="{http://www.w3.org/2001/XMLSchema}boolean"/>
 *       &lt;/sequence>
 *     &lt;/restriction>
 *   &lt;/complexContent>
 * &lt;/complexType>
 * </pre>
 * 
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "DescribeLayoutResult", namespace = "urn:partner.soap.sforce.com", propOrder = {
    "layouts",
    "recordTypeMappings",
    "recordTypeSelectorRequired"
})
public class DescribeLayoutResultType {

    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true)
    protected List<DescribeLayoutType> layouts;
    @XmlElement(namespace = "urn:partner.soap.sforce.com")
    protected List<RecordTypeMappingType> recordTypeMappings;
    @XmlElement(namespace = "urn:partner.soap.sforce.com")
    protected boolean recordTypeSelectorRequired;

    /**
     * Gets the value of the layouts property.
     * 
     * <p>
     * This accessor method returns a reference to the live list,
     * not a snapshot. Therefore any modification you make to the
     * returned list will be present inside the JAXB object.
     * This is why there is not a <CODE>set</CODE> method for the layouts property.
     * 
     * <p>
     * For example, to add a new item, do as follows:
     * <pre>
     *    getLayouts().add(newItem);
     * </pre>
     * 
     * 
     * <p>
     * Objects of the following type(s) are allowed in the list
     * {@link DescribeLayoutType }
     * 
     * 
     */
    public List<DescribeLayoutType> getLayouts() {
        if (layouts == null) {
            layouts = new ArrayList<DescribeLayoutType>();
        }
        return this.layouts;
    }

    /**
     * Gets the value of the recordTypeMappings property.
     * 
     * <p>
     * This accessor method returns a reference to the live list,
     * not a snapshot. Therefore any modification you make to the
     * returned list will be present inside the JAXB object.
     * This is why there is not a <CODE>set</CODE> method for the recordTypeMappings property.
     * 
     * <p>
     * For example, to add a new item, do as follows:
     * <pre>
     *    getRecordTypeMappings().add(newItem);
     * </pre>
     * 
     * 
     * <p>
     * Objects of the following type(s) are allowed in the list
     * {@link RecordTypeMappingType }
     * 
     * 
     */
    public List<RecordTypeMappingType> getRecordTypeMappings() {
        if (recordTypeMappings == null) {
            recordTypeMappings = new ArrayList<RecordTypeMappingType>();
        }
        return this.recordTypeMappings;
    }

    /**
     * Gets the value of the recordTypeSelectorRequired property.
     * 
     */
    public boolean isRecordTypeSelectorRequired() {
        return recordTypeSelectorRequired;
    }

    /**
     * Sets the value of the recordTypeSelectorRequired property.
     * 
     */
    public void setRecordTypeSelectorRequired(boolean value) {
        this.recordTypeSelectorRequired = value;
    }

    /**
     * Sets the value of the layouts property.
     * 
     * @param layouts
     *     allowed object is
     *     {@link DescribeLayoutType }
     *     
     */
    public void setLayouts(List<DescribeLayoutType> layouts) {
        this.layouts = layouts;
    }

    /**
     * Sets the value of the recordTypeMappings property.
     * 
     * @param recordTypeMappings
     *     allowed object is
     *     {@link RecordTypeMappingType }
     *     
     */
    public void setRecordTypeMappings(List<RecordTypeMappingType> recordTypeMappings) {
        this.recordTypeMappings = recordTypeMappings;
    }

}
