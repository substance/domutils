let ElementType = require("domelementtype")
let serialize = require("./serialize")
let isTag = ElementType.isTag

module.exports = {
	getInnerHTML: getInnerHTML,
	getOuterHTML: serialize,
	getText: getText
};

function getInnerHTML(elem, opts){
	return elem.childNodes ? elem.childNodes.map(function(elem){
		return serialize(elem, opts);
	}).join("") : "";
}

function getText(elem){
	if(Array.isArray(elem)) return elem.map(getText).join("");
	switch(elem.type) {
		case ElementType.Tag:
		case ElementType.Script:
		case ElementType.Style:
			return getText(elem.childNodes)
		case ElementType.Text:
		case ElementType.Comment:
		case ElementType.CDATA:
			return elem.data
		default:
			return ""
	}
}
