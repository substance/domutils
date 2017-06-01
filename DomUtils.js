import ElementType from 'domelementtype';
import entities from 'entities';

const booleanAttributes = {
  __proto__: null,
  allowfullscreen: true,
  async: true,
  autofocus: true,
  autoplay: true,
  checked: true,
  controls: true,
  default: true,
  defer: true,
  disabled: true,
  hidden: true,
  ismap: true,
  loop: true,
  multiple: true,
  muted: true,
  open: true,
  readonly: true,
  required: true,
  reversed: true,
  scoped: true,
  seamless: true,
  selected: true,
  typemustmatch: true
};

const unencodedElements = {
  __proto__: null,
  style: true,
  script: true,
  xmp: true,
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  noscript: true
};

const singleTag = {
  __proto__: null,
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};


export default class DomUtils {

  isTag(elem) {
    return ElementType.isTag(elem)
  }

  removeElement(elem){
    if(elem.prev) elem.prev.next = elem.next;
    if(elem.next) elem.next.prev = elem.prev;
    if(elem.parent){
      var childs = elem.parent.childNodes;
      let pos = childs.lastIndexOf(elem);
      if (pos < 0) throw new Error('Invalid state')
      childs.splice(pos, 1);
      elem.parent = null;
    }
  }

  replaceElement(elem, replacement){
    if (replacement.parent) this.removeElement(replacement);
    var prev = replacement.prev = elem.prev;
    if(prev){
      prev.next = replacement;
    }

    var next = replacement.next = elem.next;
    if(next){
      next.prev = replacement;
    }

    var parent = replacement.parent = elem.parent;
    if(parent){
      var childs = parent.childNodes;
      let pos = childs.lastIndexOf(elem);
      if (pos < 0) throw new Error('Invalid state')
      childs[pos] = replacement;
    }
  }

  appendChild(elem, child){
    if (child.parent) this.removeElement(child);
    child.parent = elem;

    if(elem.childNodes.push(child) !== 1){
      var sibling = elem.childNodes[elem.childNodes.length - 2];
      sibling.next = child;
      child.prev = sibling;
      child.next = null;
    }
  }

  append(elem, next){
    if (next.parent) this.removeElement(next);
    var parent = elem.parent,
      currNext = elem.next;

    next.next = currNext;
    next.prev = elem;
    elem.next = next;
    next.parent = parent;

    if(currNext){
      currNext.prev = next;
      if(parent){
        var childs = parent.childNodes;
        let pos = childs.lastIndexOf(currNext);
        if (pos < 0) throw new Error('Invalid state')
        childs.splice(pos, 0, next);
      }
    } else if(parent){
      parent.childNodes.push(next);
    }
  }

  prepend(elem, prev){
    if (prev.parent) this.removeElement(prev);
    var parent = elem.parent;
    if(parent){
      var childs = parent.childNodes;
      let pos = childs.lastIndexOf(elem);
      if (pos < 0) throw new Error('Invalid state')
      childs.splice(pos, 0, prev);
    }

    if(elem.prev){
      elem.prev.next = prev;
    }

    prev.parent = parent;
    prev.prev = elem.prev;
    prev.next = elem;
    elem.prev = prev;
  }


  filter(test, element, recurse, limit){
    if(!Array.isArray(element)) element = [element];

    if(typeof limit !== "number" || !isFinite(limit)){
      limit = Infinity;
    }
    return this.find(test, element, recurse !== false, limit);
  }

  find(test, elems, recurse, limit){
    var result = [], childs;

    for(var i = 0, j = elems.length; i < j; i++){
      if(test(elems[i])){
        result.push(elems[i]);
        if(--limit <= 0) break;
      }

      childs = elems[i].childNodes;
      if(recurse && childs && childs.length > 0){
        childs = this.find(test, childs, recurse, limit);
        result = result.concat(childs);
        limit -= childs.length;
        if(limit <= 0) break;
      }
    }

    return result;
  }

  findOneChild(test, elems){
    for(var i = 0, l = elems.length; i < l; i++){
      if(test(elems[i])) return elems[i];
    }

    return null;
  }

  findOne(test, elems){
    var elem = null;

    for(var i = 0, l = elems.length; i < l && !elem; i++){
      const child = elems[i];
      if(!this.isTag(child)){
        continue;
      } else if(test(child)){
        elem = child;
      } else if(child.childNodes.length > 0){
        elem = this.findOne(test, child.childNodes);
      }
    }

    return elem;
  }

  existsOne(test, elems){
    for(var i = 0, l = elems.length; i < l; i++){
      if(
        this.isTag(elems[i]) && (
          test(elems[i]) || (
            elems[i].childNodes.length > 0 &&
            this.existsOne(test, elems[i].childNodes)
          )
        )
      ){
        return true;
      }
    }

    return false;
  }

  findAll(test, elems){
    var result = [];
    for(var i = 0, j = elems.length; i < j; i++){
      if(!this.isTag(elems[i])) continue;
      if(test(elems[i])) result.push(elems[i]);

      if(elems[i].childNodes.length > 0){
        result = result.concat(this.findAll(test, elems[i].childNodes));
      }
    }
    return result;
  }



  formatAttribs(el, opts) {
    let output = [];
    const attributes = el.attributes;

    attributes.forEach((value, key) => {
      if (!value && booleanAttributes[key]) {
        output.push(key);
      } else {
        output.push(key + '="' + (opts.decodeEntities ? entities.encodeXML(value) : value) + '"');
      }
    });
    return output.join(' ')
  }

  render(dom, opts) {
    if (!Array.isArray(dom)) dom = [dom];
    opts = opts || {};

    let output = [];

    for(var i = 0; i < dom.length; i++){
      let elem = dom[i];

      if (elem.type === 'root') {
        output.push(this.render(elem.childNodes, opts));
      } else if (ElementType.isTag(elem)) {
        output.push(this.renderTag(elem, opts));
      } else if (elem.type === ElementType.Directive) {
        output.push(this.renderDirective(elem));
      } else if (elem.type === ElementType.Comment) {
        output.push(this.renderComment(elem));
      } else if (elem.type === ElementType.CDATA) {
        output.push(this.renderCdata(elem));
      } else {
        output.push(this.renderText(elem, opts));
      }
    }

    return output.join('')
  }

  renderTag(elem, opts) {

    if (elem.name === "svg") opts = {decodeEntities: opts.decodeEntities, xmlMode: true};

    let tag = '<' + elem.name;
    let attribs = this.formatAttribs(elem, opts);

    if (attribs) {
      tag += ' ' + attribs;
    }

    if (
      opts.xmlMode
      && (!elem.childNodes || elem.childNodes.length === 0)
    ) {
      tag += '/>';
    } else {
      tag += '>';
      if (elem.childNodes) {
        tag += this.render(elem.childNodes, opts);
      }

      if (!singleTag[elem.name] || opts.xmlMode) {
        tag += '</' + elem.name + '>';
      }
    }

    return tag
  }

  renderDirective(elem) {
    return '<' + elem.data + '>'
  }

  renderText(elem, opts) {
    var data = elem.data || '';

    if (opts.decodeEntities && !(elem.parent && elem.parent.name in unencodedElements)) {
      data = entities.encodeXML(data);
    }
    return data
  }

  renderCdata(elem) {
    return '<![CDATA[' + elem.childNodes[0].data + ']]>'
  }

  renderComment(elem) {
    return '<!--' + elem.data + '-->'
  }

  getInnerHTML(elem, opts){
    return elem.childNodes ? elem.childNodes.map((elem) => {
      return this.render(elem, opts);
    }).join("") : "";
  }

  getOuterHTML(elem, opts) {
    return this.render(elem, opts)
  }

  getText(elem){
    if(Array.isArray(elem)) return elem.map(e => this.getText(e)).join("");
    switch(elem.type) {
      case ElementType.Tag:
      case ElementType.Script:
      case ElementType.Style:
        return this.getText(elem.childNodes)
      case ElementType.Text:
      case ElementType.Comment:
      case ElementType.CDATA:
        return elem.data
      default:
        return ""
    }
  }



  getChildren(elem) {
    return elem.childNodes;
  }

  getParent(elem){
    return elem.parent;
  }

  getSiblings(elem){
    var parent = this.getParent(elem);
    return parent ? this.getChildren(parent) : [elem];
  }

  getAttributeValue(elem, name){
    return elem.getAttribute(name);
  }

  hasAttrib(elem, name){
    return elem.hasAttribute(name);
  }

  getName(elem){
    return elem.name
  }

  getNameWithoutNS(elem){
    return elem.nameWithoutNS
  }

}
