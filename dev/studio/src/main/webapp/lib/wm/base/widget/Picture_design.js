dojo.provide("wm.base.widget.Picture_design");
dojo.require("wm.base.widget.Picture");
dojo.require("wm.base.Control_design");
wm.Object.extendSchema(wm.Picture, {
    source: { type: "String", bindable: 1, group: "common", order: 1, focus: 1, subtype: "File", extensionMatch: ["jpg","jpeg","gif","png","tiff"], simpleBindTarget: true, doc: 1},
/*    hint: { group: "common", order: 2, doc: 1},*/
    link: { type: "String", bindable: 1, doc: 1},
    aspect: { group: "layout", order: 50, options: ["none","h","v"]},
    setSource: {method:1, doc: 1},
    setHint: {method:1, doc: 1},
    setLink: {method:1, doc: 1},


    imageList: {group: "display"},
    imageIndex: { group: "display"},
    editImageIndex: { group: "display"},
    setCaption: {method:1,doc: 1},
    setImageIndex: {method:1,doc: 1}

});

// design-time 
dojo.extend(wm.Picture, {
        scrim: true,
        themeable: false,
        themeableDemoProps: {source: "images/add.png"},
});
/*
makePictureSourcePropEdit = function(inName, inValue, inDefault) {
	var i = makeInputPropEdit(inName, inValue, inDefault);
	var f = '<form class="inspector-filebox"><input class="inspector-fileinput" onchange="inspectFileboxUrlChange.call(this)" size="1" type="file"/></form>';
	return '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td>' + i + '</td><td>' + f + '</td></tr></table>';
}

*/