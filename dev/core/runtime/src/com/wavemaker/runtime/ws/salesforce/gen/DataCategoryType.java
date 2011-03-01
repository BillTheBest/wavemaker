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
 * <p>Java class for DataCategory complex type.
 * 
 * <p>The following schema fragment specifies the expected content contained within this class.
 * 
 * <pre>
 * &lt;complexType name="DataCategory">
 *   &lt;complexContent>
 *     &lt;restriction base="{http://www.w3.org/2001/XMLSchema}anyType">
 *       &lt;sequence>
 *         &lt;element name="childCategories" type="{urn:partner.soap.sforce.com}DataCategory" maxOccurs="unbounded" minOccurs="0"/>
 *         &lt;element name="label" type="{http://www.w3.org/2001/XMLSchema}string"/>
 *         &lt;element name="name" type="{http://www.w3.org/2001/XMLSchema}string"/>
 *       &lt;/sequence>
 *     &lt;/restriction>
 *   &lt;/complexContent>
 * &lt;/complexType>
 * </pre>
 * 
 * 
 */
@XmlAccessorType(XmlAccessType.FIELD)
@XmlType(name = "DataCategory", namespace = "urn:partner.soap.sforce.com", propOrder = {
    "childCategories",
    "label",
    "name"
})
public class DataCategoryType {

    @XmlElement(namespace = "urn:partner.soap.sforce.com")
    protected List<DataCategoryType> childCategories;
    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true)
    protected String label;
    @XmlElement(namespace = "urn:partner.soap.sforce.com", required = true)
    protected String name;

    /**
     * Gets the value of the childCategories property.
     * 
     * <p>
     * This accessor method returns a reference to the live list,
     * not a snapshot. Therefore any modification you make to the
     * returned list will be present inside the JAXB object.
     * This is why there is not a <CODE>set</CODE> method for the childCategories property.
     * 
     * <p>
     * For example, to add a new item, do as follows:
     * <pre>
     *    getChildCategories().add(newItem);
     * </pre>
     * 
     * 
     * <p>
     * Objects of the following type(s) are allowed in the list
     * {@link DataCategoryType }
     * 
     * 
     */
    public List<DataCategoryType> getChildCategories() {
        if (childCategories == null) {
            childCategories = new ArrayList<DataCategoryType>();
        }
        return this.childCategories;
    }

    /**
     * Gets the value of the label property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getLabel() {
        return label;
    }

    /**
     * Sets the value of the label property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setLabel(String value) {
        this.label = value;
    }

    /**
     * Gets the value of the name property.
     * 
     * @return
     *     possible object is
     *     {@link String }
     *     
     */
    public String getName() {
        return name;
    }

    /**
     * Sets the value of the name property.
     * 
     * @param value
     *     allowed object is
     *     {@link String }
     *     
     */
    public void setName(String value) {
        this.name = value;
    }

    /**
     * Sets the value of the childCategories property.
     * 
     * @param childCategories
     *     allowed object is
     *     {@link DataCategoryType }
     *     
     */
    public void setChildCategories(List<DataCategoryType> childCategories) {
        this.childCategories = childCategories;
    }

}
