/*
 * Copyright (C) 2008-2011 WaveMaker Software, Inc.
 *
 * This file is part of WaveMaker Studio.
 *
 * WaveMaker Studio is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License, only.
 *
 * WaveMaker Studio is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with WaveMaker Studio.  If not, see <http://www.gnu.org/licenses/>.
 */ 
dojo.provide("wm.studio.app.inspect");
dojo.require("wm.studio.app.util");

wm.bubble = function(e) {
    
	dojo.fixEvent(e);
	var t = e.target, n = "_on" + e.type;
	while (t && !t[n]){
		t = t.parentNode;
	}
	if (t) 
		t[n](e);
}

wm.dijitbubble = function(inPropName, inEvent) {
    if (studio.inspector.inspector._startInspectTime + 200 > new Date().getTime()) return; // just firing off onchange events as a result of the constructor
    var input = dijit.byId("studio-prop-panel-"+inPropName);
    if (!input) 
	return;

	var inValue = input.value;

    studio.inspector.inspector._currentInspector[inEvent](input);

    // at this point, we only use this method for ComboBoxes; there's a dijit method window.setTimeout(xxx, 0) which causes focus to be lost.  Lets put a stop to that...
    if (inEvent == "propChange") {
	window.setTimeout(function() {
	    // no domNode means its been destroyed... but we still have the id, lets see if a new dijit has replaced it
	    if (!input.domNode)
		input = dijit.byId(input.id);
	    if (input) input.focus();
	}, 10);
    }
}


wm.inspectOnChange = function(inPropName) {
    var input = dijit.byId("studio_propinspect_"+inPropName);
    if (!input || input.readOnly)  // pretty stupid that readonly nodes still fire onchange events when I click away from them!
	return;

	var inValue = input.value;
    var inspector = studio.inspector.inspector._currentInspector;
    if (!inspector._inReinspect)
	studio.inspector.inspector._currentInspector.propChange(inPropName.replace(/_\d+$/,""), input.get("value"));
}

wm.inspectOnEnter = function(event) {
    if (event.keyCode == 13)
	wm.inspectOnChange(event.target.id.replace(/(widget_)?studio_propinspect_/,""));
}


/**
	Return a Select property editor for the given property.
	@param {String} inName The property name.
	@param {Array} inOptions An array of options displayed in the Select.
	@param {Any} inDefault The default property value.
	@param {Array} inValues (Optional) An array of matching values for each option displayed in the Select.
	@returns {String} Html string for the Select property editor.
*/
makeSelectPropEdit = function(inName, inValue, inOptions, inDefault, inValues, inReadonly, isBound) {
    var html = [
	'<table class="studio_propinspect_innertable"><tr><td class="studio_propinspect_editcell">',
	'<select class="wminspector-edit" id="studio_propinspect_'+inName+'" dojoType="dijit.form.ComboBox"  name="', inName, '" id="studio-prop-panel-' + inName + '" ',
	'onKeyPress="wm.inspectOnEnter" ',
	'onChange="wm.inspectOnChange(\'' +inName + '\')">' ];
	for (var i=0, l=inOptions.length, o, v; (o=inOptions[i])||(i<l); i++) {
		v = inValues ? inValues[i] : o;
		html.push('<option', 
			' value="' + v + '"',
			(inValue==v ? ' selected="selected"' : ''), '>', 
			  //(o==inDefault ? ''+o+' (default)' : o),
			  o,
			'</option>');
	}
	html.push('</select>');
    html.push('<input class="wminspector-readonly" value="'+inValue+'" readonly="true" />');
    html.push('</td><td class="bound-prop-button">&nbsp;</td></tr></table>');
	return html.join('');
}

makeCheckPropEdit = function(inName, inValue, inDefault, inReadonly, isBound) {
	return [ 
	    '<table class="studio_propinspect_innertable"><tr><td class="studio_propinspect_editcell">',
	    '<input id="studio_propinspect_'+inName+'" ',
	    'dojoType="dijit.form.CheckBox" onChange="wm.inspectOnChange(\''+inName+'\')" type="checkbox" name="', 
	    inName, '"', 
	    (inValue==inDefault ? ' class="prop-default wminspector-edit"' : ' class="wminspector-edit"'), 
	    (inValue ? 'checked="checked"' : '') + '"/>',
	    '<input class="wminspector-readonly"  value="'+inValue+'" readonly="true" />',
	    '</td><td class="bound-prop-button">&nbsp;</td></tr></table>'
	].join('');
}
makeInputPropEdit = function(inName, inValue, inDefault, inReadonly, isBound) {
	inValue = inValue === undefined ? "" : inValue;
	// FIXME: need more escaping here likely. just doing quotes for now

	return [
	    '<table class="studio_propinspect_innertable"><tr><td class="studio_propinspect_editcell">',
	    '<input id="studio_propinspect_'+inName+'" dojoType="dijit.form.TextBox" name="', inName, '"',
	    'onKeyPress="wm.inspectOnEnter" ',
	    'onChange="wm.inspectOnChange(\''+inName+'\')"',
		(inValue==inDefault ? ' class="prop-default wminspector-edit"' : 'class="wminspector-edit"'),
	    (inReadonly === true ? ' readOnly="true"' : ''),
	    ' value="', String(inValue).replace(/\"/g,"'"), '"/>',
	    '<input class="wminspector-readonly"  value="'+inValue+'" readonly="true"/>',
	    '</td><td class="bound-prop-button">&nbsp;</td></tr></table>'
	].join('');
}
setInputPropEdit = function(inName, inValue) {
    var editor = dijit.byId("studio_propinspect_"+inName);
    if (editor)
	editor.set("value", inValue, false);
    return editor;
}
/*
makeInputPropEdit = function(inName, inValue, inDefault, inReadonly) {
	inValue = inValue === undefined ? "" : inValue;
	// FIXME: need more escaping here likely. just doing quotes for now
	inValue = String(inValue).replace(/\"/g, "&quot;") || "";
	return [
		'<input name="', inName, '"',
		'onfocus="wm.bubble(event)" onblur="wm.bubble(event)"',
		(inValue==inDefault ? ' class="prop-default"' : ''),
		(inReadonly === true ? ' readOnly="true"' : ''),
		' value="', inValue, '"/>'
	].join('');
}
*/
makeTextPropEdit = function(inName, inValue, inDefault, inRows) {
	return [
	    '<textarea  id="studio_propinspect_'+inName+'" dojoType="dijit.form.SimpleTextarea" onChange="wm.inspectOnChange(\''+inName+'\')" name="', inName, '"', ' wrap="soft" rows="', inRows||8, '"',  (inValue==inDefault ? ' class="prop-default"' : ''), '">', inValue, '</textarea>'
	].join('');
}
/*
addButtonToEdit = function(inEdit, inValue, inDefault, inContent) {
	var b = '<button class="wminspector-prop-button" type="button">' + (inContent||"&#187;") + '</button>';
	return '<table class="prop-table" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td' + (inValue==inDefault ? ' class="prop-default"' : '') + '>' + inEdit + '</td><td class="prop-button">' + b + '</td></tr></table>';
}
    */
addButtonToEdit = function(inName, inEdit, inValue, inContent) {
    //return '<button class="wminspector-prop-button" type="button">' + (inContent ? "" : "&#171;") + inName  + (inContent||"&#187;") + '</button>';
return '<button class="wminspector-prop-button" type="button">'  + inName  + '</button>';
}
makeInputButtonEdit = function(inName, inValue, inDefault, inContent) {
    //var i = makeInputPropEdit(inName, inValue, inDefault);
    //return addButtonToEdit(i, inValue, inDefault, inContent);
    return addButtonToEdit(inName, inValue, inContent);
}

makeBoundEdit = function(inName, inValue) {
    return makeInputPropEdit(inName, inValue, "", false, Boolean(inValue));
	return [
		'<table class="bound-prop-table" cellpadding="0" cellspacing="0" border="0">',
	    '<tr><td class="bound-prop">', makeInputPropEdit(inName, inValue, "", Boolean(inValue)), '</td>',
	    '<td ' + (inValue ? '' : 'style="display:none" ') + ' class="bound-prop-button"></td></tr>',
		'</table>'
	].join('');
}

makeReadonlyButtonEdit = function(inName, inValue, inDefault, inContent) {
    //var i = makeInputPropEdit(inName, inValue, inDefault, true);
    //return addButtonToEdit(i, inValue, inDefault, inContent);
return addButtonToEdit(inName, inValue, inContent);
};

inspectFileboxUrlChange = function() { 
	var v = this.value.replace(/\\/g, "/").replace(/C:\/www\/root/, ""); //"
	this.parentNode.reset();
	this.inspected.set_content(v);
}

makePictureSourcePropEdit = function(inName, inValue, inDefault) {
	return makeInputPropEdit(inName, inValue, inDefault);
}

makePropEdit = function(inComponent, inName, inValue) {
	var c = inComponent, d = c.constructor.prototype[inName];
	return c.makePropEdit(inName, inValue, d) || makeInputPropEdit(inName, inValue, d);
}

makeReferencePropEdit = function(inType, inName, inValue) {
	var list = [ "(none)" ];
	for (var i in wm.Component.byId) {
		var c = wm.Component.byId[i];
		if (c instanceof inType) {
			if (c.isOwnedBy(studio.page) || c.isOwnedBy(studio.application)) {
				list.push(c.id); //name);
			}
		}
	}
	return makeSelectPropEdit(inName, inValue, list);
}

inspect = function(inComponent, inDoFocus) {
	// call on timeout so IE can blur inspectedEditor before rebuilding inspector
	//if (inComponent)
		setTimeout(function() { _inspect(inComponent, inDoFocus) }, 1);
}

_setInspectedCaption = function(inComponent) {
	var c = inComponent;
        if (studio.application && studio.page)
	    studio.inspected.setCaption(c ? c.name  + ': ' + c._designee.declaredClass : "(none)");
}

_inspect = function(inComponent, inDoFocus) {
    if (inComponent.isDestroyed || !studio.application) return;
	var c = inspected = inComponent; 
	// update label
	_setInspectedCaption(c);
	// inspect component
	//studio.inspector.setLayerByCaption("Properties");
	studio.inspector.inspect(inComponent);
/*
	if (inDoFocus)
		studio.inspector.focusDefault();
                */	
}

// event inspection
dojo.declare("wm.EventEditor", dijit.form.ComboBox, {
    constructor: function() {
	if (!wm.EventEditor.eventActions) {
	    wm.EventEditor.eventActions =  {
		noEvent: {caption: studio.getDictionaryItem("wm.EventEditor.NO_EVENTS")},
		jsFunc: {caption: studio.getDictionaryItem("wm.EventEditor.NEW_JAVASCRIPT")},
		jsSharedFunc: {caption: studio.getDictionaryItem("wm.EventEditor.NEW_JAVASCRIPT_SHARED")},
		newService: {caption: studio.getDictionaryItem("wm.EventEditor.NEW_SERVICE")},
		newLiveVar: {caption: studio.getDictionaryItem("wm.EventEditor.NEW_LIVEVAR")},
		newNavigation: {caption: studio.getDictionaryItem("wm.EventEditor.NEW_NAVIGATION")},
		serviceVariables: {caption: studio.getDictionaryItem("wm.EventEditor.LIST_SERVICE"), list: "serviceVariable"},
		navigations: {caption: studio.getDictionaryItem("wm.EventEditor.LIST_NAVIGATION"), list: "navigationCall"},
		existingCalls: {caption: studio.getDictionaryItem("wm.EventEditor.LIST_SHARED_JAVASCRIPT"), list: "sharedEventHandlers"},
		dialogs: {caption: studio.getDictionaryItem("wm.EventEditor.LIST_DIALOGS"), list: "dialogs"},
		layers: {caption: studio.getDictionaryItem("wm.EventEditor.LIST_LAYERS"), list: "layers"},
		dashboards: {caption: studio.getDictionaryItem("wm.EventEditor.LIST_DASHBOARDS"), list: "dashboards"},
		timers: {caption: studio.getDictionaryItem("wm.EventEditor.LIST_TIMERS"), list: "timers"}
	    };
	}
    },
	isEventAction: function(inValue) {
		var ea = wm.EventEditor.eventActions;
		for (var i in ea)
			if (inValue == ea[i].caption)
				return true;
	},
	//FIXME: cache this
	generateStore: function() {
	    var sc = wm.listComponents([studio.application, studio.page], wm.ServiceVariable).sort();
			var lightboxList = wm.listComponents([studio.application, studio.page], wm.DojoLightbox);
	    var nc = wm.listComponents([studio.application, studio.page], wm.NavigationCall).sort();
      var sharedEventHandlers = eventList(this.inspected.getSharedEventLookupName(this.propName), wm.isInstanceType(studio.selected.owner, wm.Application) ? studio.appsourceEditor : studio.editArea);
	    var dialogList = wm.listComponents([studio.application, studio.page], wm.Dialog);
	    dialogList = dialogList.concat(wm.listComponents([studio.application, studio.page], wm.DojoLightbox));
	    dialogList = dialogList.concat(wm.listComponents([studio.application, studio.page], wm.PopupMenu));
	    dialogList = dialogList.sort();


	    var layerList = wm.listComponents([studio.page], wm.Layer);
	    layerList = layerList.sort();

	    var dashboardList = wm.listComponents([studio.application, studio.page], wm.Dashboard).sort();
	    //var lf = wm.listComponents([studio.application, studio.page], wm.LiveForm);
	    var timers = wm.listComponents([studio.application, studio.page], wm.Timer).sort();
	    var items=[];
	    var eventSchema = this.inspected.schema[this.propName];

	        wm.forEachProperty(wm.EventEditor.eventActions, function(o, name) {
				var n = o.caption, l = o.list;
				if (l) {
				    var a;
				    switch(l) {
					    case "navigationCall":
							if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "navigation") == -1) return;
		                   	a = nc;
							break;
		                case "serviceVariable":
							if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "service") == -1) return;
		                    a = sc;
							break;
		                case "sharedEventHandlers":
							if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "js") == -1) return;
		        	        a = sharedEventHandlers;
							break;
					    case "dialogs":
								if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "dialog") == -1) return;
								a = dialogList;
								break;
				            case "layers":
								if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "layer") == -1) return;
								a = layerList;
								break;

					    case "lightboxes":
								if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "lightbox") == -1) return;
								a = lightboxList;
								break;
					    case "liveForms":
/*
								if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "liveForm") == -1) return;
								a = lf;
								break;
*/
							case "dashboards":
								if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "dashboards") == -1) return;
								a = dashboardList;
								break;
					    case "timers":
								if (eventSchema && eventSchema.events && dojo.indexOf(eventSchema.events, "timers") == -1) return;
								a = timers;
								break;
				    }	
					
					if (a && a.length) {
						items.push({name: n, value: n});
						dojo.forEach(a, function(obj) {
						        var aa = (wm.isInstanceType(obj, wm.Component)) ? obj.getId() : obj;
							if (obj instanceof wm.Dialog){
							    items.push({name: aa + '.show', value: aa + '.show', indent: 1});
							    items.push({name: aa + '.hide', value: aa + '.hide', indent: 1});
                                                        } else {
						            items.push({name: aa, value: aa, indent:1});
                                                        }
/*
							if (obj instanceof wm.LiveForm){
								items.push({name: aa + '.beginDataInsert', value: aa + '.beginDataInsert'});
								items.push({name: aa + '.saveData', value: aa + '.saveData'});
								items.push({name: aa + '.beginDataUpdate', value: aa + '.beginDataUpdate'});
							    //items.push({name: aa + '.updateData', value: aa + '.updateData'});
								items.push({name: aa + '.cancelEdit', value: aa + '.cancelEdit'});
								items.push({name: aa + '.deleteData', value: aa + '.deleteData'});
							} else if (obj instanceof wm.Timer){
							    items.push({name: aa + ".startTimer", value: aa + ".startTimer"});
							    items.push({name: aa + ".stopTimer", value: aa + ".stopTimer"});
							} else {
								items.push({name: aa, value: aa});
							}
*/
						})
					}
				} else {
				    if (eventSchema && eventSchema.events)
					switch(name) {
						case "noEvent":
						    if ( dojo.indexOf(eventSchema.events, "disableNoEvent") != -1) return;
						case "jsFunc":
						    if (dojo.indexOf(eventSchema.events, "js") == -1) return;
						    break;
						case "jsSharedFunc":
						    if (dojo.indexOf(eventSchema.events, "sharedjs") == -1) return;
						    break;
						case "newService":
						    if ( dojo.indexOf(eventSchema.events, "service") == -1) return;
						    break;
						case "newLiveVar":
						    if ( dojo.indexOf(eventSchema.events, "service") == -1) return;
						    break;
						case "newNavigation":
						    if (dojo.indexOf(eventSchema.events, "navigation") == -1) return;
						    break;
					}
				    items.push({name: n, value: n});
				}
			});
/*
		dojo.forEach(sharedEventHandlers, function(e) {
		  items.push({name: e, value: e});
		});
*/
		return new wm.base.data.SimpleStore(items, "name");
	},
	postMixInProperties: function() {
		this.store = this.generateStore();
		this.inherited(arguments);
	},
	postCreate: function() {
		this.inherited(arguments);
		this.domNode.style.width = this.domNode.style.height = "100%";
	},
	set: function(inName,inValue) {
	  if (inName == "value" || inName == "item") {
	  	var value = inName == "value" ? inValue : inValue.name;
		var c = this.inspected, o = c.getValue(this.propName);
		if (this.isEventAction(value))
			this.doEventAction(value);
		else {
			this.inherited(arguments);
			this.inspected.setProp(this.propName, value);
		}
	  }
	},

	doEventAction: function(inEventName) {
		var ea = wm.EventEditor.eventActions, c = this.inspected, p = this.propName, v;
		switch (inEventName) {
		        case ea.noEvent.caption:
		    this.set("value","", false);			  
				break;
			case ea.jsFunc.caption:
				v = c.generateEventName(p);
		    window.setTimeout(dojo.hitch(this, function() {
		        this.set("value",v, false);
		    }), 50); // wait until after the whole clicking on an option has finished and menu been dismissed before we change the value
				try{c.updatingEvent(p,v);}catch (e){/*do nothing as this might happen if there's a component which does not extends wm.control class*/}
		                eventEdit(c, p, v, c == studio.application);
				break;
			case ea.jsSharedFunc.caption:
				v = c.generateSharedEventName(p);
		    window.setTimeout(dojo.hitch(this, function() {
			this.set("value",v, false);
		    }), 50);
				try{c.updatingEvent(p,v);}catch (e){/*do nothing as this might happen if there's a component which does not extends wm.control class*/}
				eventEdit(c, p, v, c == studio.application);
                                studio.inspector.reinspect();
				break;
			case ea.newService.caption:
				studio.newComponentButtonClick({componentType: "wm.ServiceVariable"});
		    this.set("value",studio.selected.name, false);
				break;
			case ea.newLiveVar.caption:
				studio.newComponentButtonClick({componentType: "wm.LiveVariable"});
		    this.set("value",studio.selected.name, false);
				break;
			case ea.newNavigation.caption:
				studio.newComponentButtonClick({componentType: "wm.NavigationCall"});
		    this.set("value",studio.selected.name, false);
				break;
		}
	}
});

// inspector formatting (allow widgets in inspectors)
formatEventProp = function(inComponent, inName, inValue, inNode) {
    return new wm.EventEditor({inspected: inComponent, propName: inName, value: inValue, srcNodeRef: inNode});
}

formatPropEdit = function(inComponent, inName, inValue, inNode, noEventProps) {
	// event
	if(!noEventProps &&inName.slice(0,2)=="on")
		return formatEventProp.apply(this, arguments);
	else
		return wm.fire(inComponent, "formatPropEdit", inName, inValue, inNode);
}
