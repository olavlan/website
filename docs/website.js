// build/dev/javascript/prelude.mjs
class CustomType {
  withFields(fields) {
    let properties = Object.keys(this).map((label) => (label in fields) ? fields[label] : this[label]);
    return new this.constructor(...properties);
  }
}

class List {
  static fromArray(array, tail) {
    let t = tail || new Empty;
    for (let i = array.length - 1;i >= 0; --i) {
      t = new NonEmpty(array[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return current !== undefined;
  }
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  countLength() {
    let current = this;
    let length = 0;
    while (current) {
      current = current.tail;
      length++;
    }
    return length - 1;
  }
}
function prepend(element, tail) {
  return new NonEmpty(element, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}

class ListIterator {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
}

class Empty extends List {
}
var List$Empty = () => new Empty;
var List$isEmpty = (value) => value instanceof Empty;

class NonEmpty extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
}
var List$NonEmpty = (head, tail) => new NonEmpty(head, tail);
var List$isNonEmpty = (value) => value instanceof NonEmpty;
var List$NonEmpty$first = (value) => value.head;
var List$NonEmpty$rest = (value) => value.tail;

class BitArray {
  bitSize;
  byteSize;
  bitOffset;
  rawBuffer;
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error("BitArray can only be constructed from a Uint8Array");
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(`BitArray bit offset is invalid: ${this.bitOffset}`);
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  byteAt(index) {
    if (index < 0 || index >= this.byteSize) {
      return;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index);
  }
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0;i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0;i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, wholeByteCount);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, wholeByteCount);
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  get buffer() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error("BitArray.buffer does not support unaligned bit arrays");
    }
    return this.rawBuffer;
  }
  get length() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error("BitArray.length does not support unaligned bit arrays");
    }
    return this.rawBuffer.length;
  }
}
function bitArrayByteAt(buffer, bitOffset, index) {
  if (bitOffset === 0) {
    return buffer[index] ?? 0;
  } else {
    const a = buffer[index] << bitOffset & 255;
    const b = buffer[index + 1] >> 8 - bitOffset;
    return a | b;
  }
}

class UtfCodepoint {
  constructor(value) {
    this.value = value;
  }
}
class Result extends CustomType {
  static isResult(data2) {
    return data2 instanceof Result;
  }
}

class Ok extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  isOk() {
    return true;
  }
}
var Result$Ok = (value) => new Ok(value);
var Result$isOk = (value) => value instanceof Ok;
var Result$Ok$0 = (value) => value[0];

class Error extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  isOk() {
    return false;
  }
}
var Result$Error = (detail) => new Error(detail);
var Result$isError = (value) => value instanceof Error;
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a = values.pop();
    let b = values.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {}
    }
    let [keys, get] = getters(a);
    const ka = keys(a);
    const kb = keys(b);
    if (ka.length !== kb.length)
      return false;
    for (let k of ka) {
      values.push(get(a, k), get(b, k));
    }
  }
  return true;
}
function getters(object) {
  if (object instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function makeError(variant, file, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}
// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap;
var tempDataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== undefined) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0;i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {}
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0;i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys = Object.keys(o);
    for (let i = 0;i < keys.length; i++) {
      const k = keys[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === undefined)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}

class Dict {
  constructor(size, root) {
    this.size = size;
    this.root = root;
  }
}
var bits = 5;
var mask = (1 << bits) - 1;
var noElementMarker = Symbol();
var generationKey = Symbol();
var emptyNode = /* @__PURE__ */ newNode(0);
var emptyDict = /* @__PURE__ */ new Dict(0, emptyNode);
var errorNil = /* @__PURE__ */ Result$Error(undefined);
function makeNode(generation, datamap, nodemap, data2) {
  return {
    datamap,
    nodemap,
    data: data2,
    [generationKey]: generation
  };
}
function newNode(generation) {
  return makeNode(generation, 0, 0, []);
}
function copyNode(node, generation) {
  if (node[generationKey] === generation) {
    return node;
  }
  const newData = node.data.slice(0);
  return makeNode(generation, node.datamap, node.nodemap, newData);
}
function copyAndSet(node, generation, idx, val) {
  if (node.data[idx] === val) {
    return node;
  }
  node = copyNode(node, generation);
  node.data[idx] = val;
  return node;
}
function copyAndInsertPair(node, generation, bit, idx, key, val) {
  const data2 = node.data;
  const length = data2.length;
  const newData = new Array(length + 2);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < idx)
    newData[writeIndex++] = data2[readIndex++];
  newData[writeIndex++] = key;
  newData[writeIndex++] = val;
  while (readIndex < length)
    newData[writeIndex++] = data2[readIndex++];
  return makeNode(generation, node.datamap | bit, node.nodemap, newData);
}
function copyAndRemovePair(node, generation, bit, idx) {
  node = copyNode(node, generation);
  const data2 = node.data;
  const length = data2.length;
  for (let w = idx, r = idx + 2;r < length; ++r, ++w) {
    data2[w] = data2[r];
  }
  data2.pop();
  data2.pop();
  node.datamap ^= bit;
  return node;
}
function make() {
  return emptyDict;
}
function from(iterable) {
  let transient = toTransient(emptyDict);
  for (const [key, value] of iterable) {
    transient = destructiveTransientInsert(key, value, transient);
  }
  return fromTransient(transient);
}
function get(dict, key) {
  const result = lookup(dict.root, key, getHash(key));
  return result !== noElementMarker ? Result$Ok(result) : errorNil;
}
function lookup(node, key, hash) {
  for (let shift = 0;shift < 32; shift += bits) {
    const data2 = node.data;
    const bit = hashbit(hash, shift);
    if (node.nodemap & bit) {
      node = data2[data2.length - 1 - index(node.nodemap, bit)];
    } else if (node.datamap & bit) {
      const dataidx = Math.imul(index(node.datamap, bit), 2);
      return isEqual(key, data2[dataidx]) ? data2[dataidx + 1] : noElementMarker;
    } else {
      return noElementMarker;
    }
  }
  const overflow = node.data;
  for (let i = 0;i < overflow.length; i += 2) {
    if (isEqual(key, overflow[i])) {
      return overflow[i + 1];
    }
  }
  return noElementMarker;
}
function toTransient(dict) {
  return {
    generation: nextGeneration(dict),
    root: dict.root,
    size: dict.size,
    dict
  };
}
function fromTransient(transient) {
  if (transient.root === transient.dict.root) {
    return transient.dict;
  }
  return new Dict(transient.size, transient.root);
}
function nextGeneration(dict) {
  const root = dict.root;
  if (root[generationKey] < Number.MAX_SAFE_INTEGER) {
    return root[generationKey] + 1;
  }
  const queue = [root];
  while (queue.length) {
    const node = queue.pop();
    node[generationKey] = 0;
    const nodeStart = data.length - popcount(node.nodemap);
    for (let i = nodeStart;i < node.data.length; ++i) {
      queue.push(node.data[i]);
    }
  }
  return 1;
}
var globalTransient = /* @__PURE__ */ toTransient(emptyDict);
function insert(dict, key, value) {
  globalTransient.generation = nextGeneration(dict);
  globalTransient.size = dict.size;
  const hash = getHash(key);
  const root = insertIntoNode(globalTransient, dict.root, key, value, hash, 0);
  if (root === dict.root) {
    return dict;
  }
  return new Dict(globalTransient.size, root);
}
function destructiveTransientInsert(key, value, transient) {
  const hash = getHash(key);
  transient.root = insertIntoNode(transient, transient.root, key, value, hash, 0);
  return transient;
}
function insertIntoNode(transient, node, key, value, hash, shift) {
  const data2 = node.data;
  const generation = transient.generation;
  if (shift > 32) {
    for (let i = 0;i < data2.length; i += 2) {
      if (isEqual(key, data2[i])) {
        return copyAndSet(node, generation, i + 1, value);
      }
    }
    transient.size += 1;
    return copyAndInsertPair(node, generation, 0, data2.length, key, value);
  }
  const bit = hashbit(hash, shift);
  if (node.nodemap & bit) {
    const nodeidx2 = data2.length - 1 - index(node.nodemap, bit);
    let child2 = data2[nodeidx2];
    child2 = insertIntoNode(transient, child2, key, value, hash, shift + bits);
    return copyAndSet(node, generation, nodeidx2, child2);
  }
  const dataidx = Math.imul(index(node.datamap, bit), 2);
  if ((node.datamap & bit) === 0) {
    transient.size += 1;
    return copyAndInsertPair(node, generation, bit, dataidx, key, value);
  }
  if (isEqual(key, data2[dataidx])) {
    return copyAndSet(node, generation, dataidx + 1, value);
  }
  const childShift = shift + bits;
  let child = emptyNode;
  child = insertIntoNode(transient, child, key, value, hash, childShift);
  const key2 = data2[dataidx];
  const value2 = data2[dataidx + 1];
  const hash2 = getHash(key2);
  child = insertIntoNode(transient, child, key2, value2, hash2, childShift);
  transient.size -= 1;
  const length = data2.length;
  const nodeidx = length - 1 - index(node.nodemap, bit);
  const newData = new Array(length - 1);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < dataidx)
    newData[writeIndex++] = data2[readIndex++];
  readIndex += 2;
  while (readIndex <= nodeidx)
    newData[writeIndex++] = data2[readIndex++];
  newData[writeIndex++] = child;
  while (readIndex < length)
    newData[writeIndex++] = data2[readIndex++];
  return makeNode(generation, node.datamap ^ bit, node.nodemap | bit, newData);
}
function destructiveTransientDelete(key, transient) {
  const hash = getHash(key);
  transient.root = deleteFromNode(transient, transient.root, key, hash, 0);
  return transient;
}
function deleteFromNode(transient, node, key, hash, shift) {
  const data2 = node.data;
  const generation = transient.generation;
  if (shift > 32) {
    for (let i = 0;i < data2.length; i += 2) {
      if (isEqual(key, data2[i])) {
        transient.size -= 1;
        return copyAndRemovePair(node, generation, 0, i);
      }
    }
    return node;
  }
  const bit = hashbit(hash, shift);
  const dataidx = Math.imul(index(node.datamap, bit), 2);
  if ((node.nodemap & bit) !== 0) {
    const nodeidx = data2.length - 1 - index(node.nodemap, bit);
    let child = data2[nodeidx];
    child = deleteFromNode(transient, child, key, hash, shift + bits);
    if (child.nodemap !== 0 || child.data.length > 2) {
      return copyAndSet(node, generation, nodeidx, child);
    }
    const length = data2.length;
    const newData = new Array(length + 1);
    let readIndex = 0;
    let writeIndex = 0;
    while (readIndex < dataidx)
      newData[writeIndex++] = data2[readIndex++];
    newData[writeIndex++] = child.data[0];
    newData[writeIndex++] = child.data[1];
    while (readIndex < nodeidx)
      newData[writeIndex++] = data2[readIndex++];
    readIndex++;
    while (readIndex < length)
      newData[writeIndex++] = data2[readIndex++];
    return makeNode(generation, node.datamap | bit, node.nodemap ^ bit, newData);
  }
  if ((node.datamap & bit) === 0 || !isEqual(key, data2[dataidx])) {
    return node;
  }
  transient.size -= 1;
  return copyAndRemovePair(node, generation, bit, dataidx);
}
function fold(dict, state, fun) {
  const queue = [dict.root];
  while (queue.length) {
    const node = queue.pop();
    const data2 = node.data;
    const edgesStart = data2.length - popcount(node.nodemap);
    for (let i = 0;i < edgesStart; i += 2) {
      state = fun(state, data2[i], data2[i + 1]);
    }
    for (let i = edgesStart;i < data2.length; ++i) {
      queue.push(data2[i]);
    }
  }
  return state;
}
function popcount(n) {
  n -= n >>> 1 & 1431655765;
  n = (n & 858993459) + (n >>> 2 & 858993459);
  return Math.imul(n + (n >>> 4) & 252645135, 16843009) >>> 24;
}
function index(bitmap, bit) {
  return popcount(bitmap & bit - 1);
}
function hashbit(hash, shift) {
  return 1 << (hash >>> shift & mask);
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
class Some extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
var Option$isSome = (value) => value instanceof Some;
var Option$Some$0 = (value) => value[0];

class None extends CustomType {
}
function to_result(option, e) {
  if (option instanceof Some) {
    let a = option[0];
    return new Ok(a);
  } else {
    return new Error(e);
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function to_list(dict) {
  return fold(dict, toList([]), (acc, key, value) => {
    return prepend([key, value], acc);
  });
}
function keys(dict) {
  return fold(dict, toList([]), (acc, key, _) => {
    return prepend(key, acc);
  });
}
function delete$(dict, key) {
  let _pipe = toTransient(dict);
  let _pipe$1 = ((_capture) => {
    return destructiveTransientDelete(key, _capture);
  })(_pipe);
  return fromTransient(_pipe$1);
}

// build/dev/javascript/gleam_stdlib/gleam/order.mjs
class Lt extends CustomType {
}
var Order$Lt = () => new Lt;
class Eq extends CustomType {
}
var Order$Eq = () => new Eq;
class Gt extends CustomType {
}
var Order$Gt = () => new Gt;

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function negate(x) {
  return -1 * x;
}
function round2(x) {
  let $ = x >= 0;
  if ($) {
    return round(x);
  } else {
    return 0 - round(negate(x));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function max(a, b) {
  let $ = a > b;
  if ($) {
    return a;
  } else {
    return b;
  }
}
function random(max2) {
  let _pipe = random_uniform() * identity(max2);
  let _pipe$1 = floor(_pipe);
  return round2(_pipe$1);
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
class Ascending extends CustomType {
}

class Descending extends CustomType {
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list) {
  return reverse_and_prepend(list, toList([]));
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list = loop$list;
    let elem = loop$elem;
    if (list instanceof Empty) {
      return false;
    } else {
      let first$1 = list.head;
      if (isEqual(first$1, elem)) {
        return true;
      } else {
        let rest$1 = list.tail;
        loop$list = rest$1;
        loop$elem = elem;
      }
    }
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let _block;
      let $ = fun(first$1);
      if ($) {
        _block = prepend(first$1, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list, predicate) {
  return filter_loop(list, predicate, toList([]));
}
function filter_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let _block;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        let first$2 = $[0];
        _block = prepend(first$2, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter_map(list, fun) {
  return filter_map_loop(list, fun, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list, fun) {
  return map_loop(list, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second = loop$second;
    if (first instanceof Empty) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first, second) {
  return append_loop(reverse(first), second);
}
function prepend2(list, item) {
  return prepend(item, list);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists instanceof Empty) {
      return reverse(acc);
    } else {
      let list = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, toList([]));
}
function fold2(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list instanceof Empty) {
      return initial;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function find_map(loop$list, loop$fun) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    if (list instanceof Empty) {
      return new Error(undefined);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        return $;
      } else {
        loop$list = rest$1;
        loop$fun = fun;
      }
    }
  }
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list = list2;
      return reverse_and_prepend(list, acc);
    } else if (list2 instanceof Empty) {
      let list = list1;
      return reverse_and_prepend(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare2(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences = loop$sequences;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (sequences instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(descending1, descending2, compare2, toList([]));
        loop$sequences = rest$1;
        loop$compare = compare2;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list = list2;
      return reverse_and_prepend(list, acc);
    } else if (list2 instanceof Empty) {
      let list = list1;
      return reverse_and_prepend(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare2(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences = loop$sequences;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (sequences instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(ascending1, ascending2, compare2, toList([]));
        loop$sequences = rest$1;
        loop$compare = compare2;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences = loop$sequences;
    let direction = loop$direction;
    let compare2 = loop$compare;
    if (sequences instanceof Empty) {
      return sequences;
    } else if (direction instanceof Ascending) {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences, compare2, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Descending;
        loop$compare = compare2;
      }
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences, compare2, toList([]));
        loop$sequences = sequences$1;
        loop$direction = new Ascending;
        loop$compare = compare2;
      }
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list = loop$list;
    let compare2 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list.head;
      let rest$1 = list.tail;
      let $ = compare2(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare2;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare2;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare2(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = new Ascending;
            } else if ($1 instanceof Eq) {
              _block$1 = new Ascending;
            } else {
              _block$1 = new Descending;
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare2;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare2(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending;
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending;
          } else {
            _block$1 = new Descending;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare2;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare2(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = new Ascending;
          } else if ($1 instanceof Eq) {
            _block$1 = new Ascending;
          } else {
            _block$1 = new Descending;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare2;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare2;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function sort(list, compare2) {
  if (list instanceof Empty) {
    return list;
  } else {
    let $ = list.tail;
    if ($ instanceof Empty) {
      return list;
    } else {
      let x = list.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare2(x, y);
      if ($1 instanceof Lt) {
        _block = new Ascending;
      } else if ($1 instanceof Eq) {
        _block = new Ascending;
      } else {
        _block = new Descending;
      }
      let direction = _block;
      let sequences$1 = sequences(rest$1, compare2, toList([x]), direction, y, toList([]));
      return merge_all(sequences$1, new Ascending, compare2);
    }
  }
}
function key_find(keyword_list, desired_key) {
  return find_map(keyword_list, (keyword) => {
    let key;
    let value;
    key = keyword[0];
    value = keyword[1];
    let $ = isEqual(key, desired_key);
    if ($) {
      return new Ok(value);
    } else {
      return new Error(undefined);
    }
  });
}
function each(loop$list, loop$f) {
  while (true) {
    let list = loop$list;
    let f = loop$f;
    if (list instanceof Empty) {
      return;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      f(first$1);
      loop$list = rest$1;
      loop$f = f;
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function replace(string, pattern, substitute) {
  let _pipe = string;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function slice(string, idx, len) {
  let $ = len <= 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = string_length(string) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_grapheme_slice(string, translated_idx, len);
      }
    } else {
      return string_grapheme_slice(string, idx, len);
    }
  }
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}
function join_loop(loop$strings, loop$separator, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let separator = loop$separator;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$separator = separator;
      loop$accumulator = accumulator + separator + string;
    }
  }
}
function join(strings, separator) {
  if (strings instanceof Empty) {
    return "";
  } else {
    let first$1 = strings.head;
    let rest = strings.tail;
    return join_loop(rest, separator, first$1);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
class DecodeError extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
}
var DecodeError$DecodeError = (expected, found, path) => new DecodeError(expected, found, path);
class Decoder extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
}
var float2 = /* @__PURE__ */ new Decoder(decode_float);
var int2 = /* @__PURE__ */ new Decoder(decode_int);
var string2 = /* @__PURE__ */ new Decoder(decode_string);
var bool = /* @__PURE__ */ new Decoder(decode_bool);
function run(data2, decoder) {
  let $ = decoder.function(data2);
  let maybe_invalid_data;
  let errors;
  maybe_invalid_data = $[0];
  errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function run_dynamic_function(data2, name, f) {
  let $ = f(data2);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let placeholder = $[0];
    return [
      placeholder,
      toList([new DecodeError(name, classify_dynamic(data2), toList([]))])
    ];
  }
}
function decode_float(data2) {
  return run_dynamic_function(data2, "Float", float);
}
function map3(decoder, transformer) {
  return new Decoder((d) => {
    let $ = decoder.function(d);
    let data2;
    let errors;
    data2 = $[0];
    errors = $[1];
    return [transformer(data2), errors];
  });
}
function decode_int(data2) {
  return run_dynamic_function(data2, "Int", int);
}
function decode_string(data2) {
  return run_dynamic_function(data2, "String", string);
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data2 = loop$data;
    let failure = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data2);
      let layer;
      let errors;
      layer = $;
      errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data2;
        loop$failure = failure;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder((dynamic_data) => {
    let $ = first.function(dynamic_data);
    let layer;
    let errors;
    layer = $;
    errors = $[1];
    if (errors instanceof Empty) {
      return layer;
    } else {
      return run_decoders(dynamic_data, layer, alternatives);
    }
  });
}
function path_segment_to_string(key) {
  let decoder = one_of(string2, toList([
    (() => {
      let _pipe = int2;
      return map3(_pipe, to_string);
    })(),
    (() => {
      let _pipe = float2;
      return map3(_pipe, float_to_string);
    })()
  ]));
  let $ = run(key, decoder);
  if ($ instanceof Ok) {
    let key$1 = $[0];
    return key$1;
  } else {
    return "<" + classify_dynamic(key) + ">";
  }
}
function push_path(layer, path) {
  let path$1 = map2(path, (key) => {
    let _pipe = key;
    let _pipe$1 = identity(_pipe);
    return path_segment_to_string(_pipe$1);
  });
  let errors = map2(layer[1], (error) => {
    return new DecodeError(error.expected, error.found, append(path$1, error.path));
  });
  return [layer[0], errors];
}
function list2(inner) {
  return new Decoder((data2) => {
    return list(data2, inner.function, (p, k) => {
      return push_path(p, toList([k]));
    }, 0, toList([]));
  });
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data2 = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = data2;
      let _pipe$1 = inner(_pipe);
      return push_path(_pipe$1, reverse(position));
    } else {
      let key = path.head;
      let path$1 = path.tail;
      let $ = index2(data2, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data2, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data2);
        let default$;
        default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError(kind, classify_dynamic(data2), toList([]))])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder((data2) => {
    let $ = index3(field_path, toList([]), field_decoder.function, data2, (data3, position) => {
      let $12 = field_decoder.function(data3);
      let default$;
      default$ = $12[0];
      let _pipe = [
        default$,
        toList([new DecodeError("Field", "Nothing", toList([]))])
      ];
      return push_path(_pipe, reverse(position));
    });
    let out;
    let errors1;
    out = $[0];
    errors1 = $[1];
    let $1 = next(out).function(data2);
    let out$1;
    let errors2;
    out$1 = $1[0];
    errors2 = $1[1];
    return [out$1, append(errors1, errors2)];
  });
}
function at(path, inner) {
  return new Decoder((data2) => {
    return index3(path, toList([]), inner.function, data2, (data3, position) => {
      let $ = inner.function(data3);
      let default$;
      default$ = $[0];
      let _pipe = [
        default$,
        toList([new DecodeError("Field", "Nothing", toList([]))])
      ];
      return push_path(_pipe, reverse(position));
    });
  });
}
function success(data2) {
  return new Decoder((_) => {
    return [data2, toList([])];
  });
}
function decode_error(expected, found) {
  return toList([
    new DecodeError(expected, classify_dynamic(found), toList([]))
  ]);
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}
function decode_bool(data2) {
  let $ = isEqual(identity(true), data2);
  if ($) {
    return [true, toList([])];
  } else {
    let $1 = isEqual(identity(false), data2);
    if ($1) {
      return [false, toList([])];
    } else {
      return [false, decode_error("Bool", data2)];
    }
  }
}
function fold_dict(acc, key, value, key_decoder, value_decoder) {
  let $ = key_decoder(key);
  let $1 = $[1];
  if ($1 instanceof Empty) {
    let key_decoded = $[0];
    let $2 = value_decoder(value);
    let $3 = $2[1];
    if ($3 instanceof Empty) {
      let value$1 = $2[0];
      let dict$1 = insert(acc[0], key_decoded, value$1);
      return [dict$1, acc[1]];
    } else {
      let errors = $3;
      let key_identifier = path_segment_to_string(key);
      return push_path([make(), errors], toList([key_identifier]));
    }
  } else {
    let errors = $1;
    return push_path([make(), errors], toList(["keys"]));
  }
}
function dict2(key, value) {
  return new Decoder((data2) => {
    let $ = dict(data2);
    if ($ instanceof Ok) {
      let dict$1 = $[0];
      return fold(dict$1, [make(), toList([])], (a, k, v) => {
        let $1 = a[1];
        if ($1 instanceof Empty) {
          return fold_dict(a, k, v, key.function, value.function);
        } else {
          return a;
        }
      });
    } else {
      return [make(), decode_error("Dict", data2)];
    }
  });
}
function optional(inner) {
  return new Decoder((data2) => {
    let $ = is_null(data2);
    if ($) {
      return [new None, toList([])];
    } else {
      let $1 = inner.function(data2);
      let data$1;
      let errors;
      data$1 = $1[0];
      errors = $1[1];
      return [new Some(data$1), errors];
    }
  });
}
function then$(decoder, next) {
  return new Decoder((dynamic_data) => {
    let $ = decoder.function(dynamic_data);
    let data2;
    let errors;
    data2 = $[0];
    errors = $[1];
    let decoder$1 = next(data2);
    let $1 = decoder$1.function(dynamic_data);
    let layer;
    let data$1;
    layer = $1;
    data$1 = $1[0];
    if (errors instanceof Empty) {
      return layer;
    } else {
      return [data$1, errors];
    }
  });
}
function failure(placeholder, name) {
  return new Decoder((d) => {
    return [placeholder, decode_error(name, d)];
  });
}
function new_primitive_decoder(name, decoding_function) {
  return new Decoder((d) => {
    let $ = decoding_function(d);
    if ($ instanceof Ok) {
      let t = $[0];
      return [t, toList([])];
    } else {
      let placeholder = $[0];
      return [
        placeholder,
        toList([new DecodeError(name, classify_dynamic(d), toList([]))])
      ];
    }
  });
}
function recursive(inner) {
  return new Decoder((data2) => {
    let decoder = inner();
    return decoder.function(data2);
  });
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = undefined;
function identity(x) {
  return x;
}
function parse_int(value) {
  if (/^[-+]?(\d+)$/.test(value)) {
    return Result$Ok(parseInt(value));
  } else {
    return Result$Error(Nil);
  }
}
function parse_float(value) {
  if (/^[-+]?(\d+)\.(\d+)([eE][-+]?\d+)?$/.test(value)) {
    return Result$Ok(parseFloat(value));
  } else {
    return Result$Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function string_replace(string3, target, substitute) {
  return string3.replaceAll(target, substitute);
}
function string_length(string3) {
  if (string3 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string3.match(/./gsu).length;
  }
}
function graphemes(string3) {
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    return arrayToList(Array.from(iterator).map((item) => item.segment));
  } else {
    return arrayToList(string3.match(/./gsu));
  }
}
var segmenter = undefined;
function graphemes_iterator(string3) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter;
    return segmenter.segment(string3)[Symbol.iterator]();
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string3) {
  return string3.toLowerCase();
}
function split(xs, pattern) {
  return arrayToList(xs.split(pattern));
}
function string_grapheme_slice(string3, idx, len) {
  if (len <= 0 || idx >= string3.length) {
    return "";
  }
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === undefined) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string3.match(/./gsu).slice(idx, idx + len).join("");
  }
}
function string_codeunit_slice(str, from2, length2) {
  return str.slice(from2, from2 + length2);
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  "\t",
  `
`,
  "\v",
  "\f",
  "\r",
  "",
  "\u2028",
  "\u2029"
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function floor(float3) {
  return Math.floor(float3);
}
function round(float3) {
  return Math.round(float3);
}
function random_uniform() {
  const random_uniform_result = Math.random();
  if (random_uniform_result === 1) {
    return random_uniform();
  }
  return random_uniform_result;
}
function classify_dynamic(data2) {
  if (typeof data2 === "string") {
    return "String";
  } else if (typeof data2 === "boolean") {
    return "Bool";
  } else if (isResult(data2)) {
    return "Result";
  } else if (isList(data2)) {
    return "List";
  } else if (data2 instanceof BitArray) {
    return "BitArray";
  } else if (data2 instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data2)) {
    return "Int";
  } else if (Array.isArray(data2)) {
    return `Array`;
  } else if (typeof data2 === "number") {
    return "Float";
  } else if (data2 === null) {
    return "Nil";
  } else if (data2 === undefined) {
    return "Nil";
  } else {
    const type = typeof data2;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
var MIN_I32 = -(2 ** 31);
var MAX_I32 = 2 ** 31 - 1;
var U32 = 2 ** 32;
var MAX_SAFE = Number.MAX_SAFE_INTEGER;
var MIN_SAFE = Number.MIN_SAFE_INTEGER;
function float_to_string(float3) {
  const string3 = float3.toString().replace("+", "");
  if (string3.indexOf(".") >= 0) {
    return string3;
  } else {
    const index4 = string3.indexOf("e");
    if (index4 >= 0) {
      return string3.slice(0, index4) + ".0" + string3.slice(index4);
    } else {
      return string3 + ".0";
    }
  }
}

class Inspector {
  #references = new Set;
  inspect(v) {
    const t = typeof v;
    if (v === true)
      return "True";
    if (v === false)
      return "False";
    if (v === null)
      return "//js(null)";
    if (v === undefined)
      return "Nil";
    if (t === "string")
      return this.#string(v);
    if (t === "bigint" || Number.isInteger(v))
      return v.toString();
    if (t === "number")
      return float_to_string(v);
    if (v instanceof UtfCodepoint)
      return this.#utfCodepoint(v);
    if (v instanceof BitArray)
      return this.#bit_array(v);
    if (v instanceof RegExp)
      return `//js(${v})`;
    if (v instanceof Date)
      return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error)
      return `//js(${v.toString()})`;
    if (v instanceof Function) {
      const args = [];
      for (const i of Array(v.length).keys())
        args.push(String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (isList(v)) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (v instanceof Dict) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body = props.length ? " " + props.join(", ") + " " : "";
    const head = name === "Object" ? "" : name + " ";
    return `//js(${head}{${body}})`;
  }
  #dict(map4) {
    let body = "dict.from_list([";
    let first = true;
    body = fold(map4, body, (body2, key, value) => {
      if (!first)
        body2 = body2 + ", ";
      first = false;
      return body2 + "#(" + this.inspect(key) + ", " + this.inspect(value) + ")";
    });
    return body + "])";
  }
  #customType(record) {
    const props = Object.keys(record).map((label) => {
      const value = this.inspect(record[label]);
      return isNaN(parseInt(label)) ? `${label}: ${value}` : value;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list3) {
    if (List$isEmpty(list3)) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list3;
    while (List$isNonEmpty(current)) {
      let element = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element);
      if (char_out) {
        if (Number.isInteger(element) && element >= 32 && element <= 126) {
          char_out += String.fromCharCode(element);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0;i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case `
`:
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "\t":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += "\\\"";
          break;
        default:
          if (char < " " || char > "~" && char < " ") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
  }
  #bit_array(bits2) {
    if (bits2.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0;i < bits2.byteSize - 1; i++) {
      acc += bits2.byteAt(i).toString();
      acc += ", ";
    }
    if (bits2.byteSize * 8 === bits2.bitSize) {
      acc += bits2.byteAt(bits2.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits2.bitSize % 8;
      acc += bits2.byteAt(bits2.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
}
function index2(data2, key) {
  if (data2 instanceof Dict) {
    const result = get(data2, key);
    return Result$Ok(result.isOk() ? new Some(result[0]) : new None);
  }
  if (data2 instanceof WeakMap || data2 instanceof Map) {
    const token = {};
    const entry = data2.get(key, token);
    if (entry === token)
      return Result$Ok(new None);
    return Result$Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && isList(data2)) {
    let i = 0;
    for (const value of data2) {
      if (i === key)
        return Result$Ok(new Some(value));
      i++;
    }
    return Result$Error("Indexable");
  }
  if (key_is_int && Array.isArray(data2) || data2 && typeof data2 === "object" || data2 && Object.getPrototypeOf(data2) === Object.prototype) {
    if (key in data2)
      return Result$Ok(new Some(data2[key]));
    return Result$Ok(new None);
  }
  return Result$Error(key_is_int ? "Indexable" : "Dict");
}
function list(data2, decode, pushPath, index4, emptyList) {
  if (!(isList(data2) || Array.isArray(data2))) {
    const error = DecodeError$DecodeError("List", classify_dynamic(data2), emptyList);
    return [emptyList, arrayToList([error])];
  }
  const decoded = [];
  for (const element of data2) {
    const layer = decode(element);
    const [out, errors] = layer;
    if (List$isNonEmpty(errors)) {
      const [_, errors2] = pushPath(layer, index4.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index4++;
  }
  return [arrayToList(decoded), emptyList];
}
function dict(data2) {
  if (data2 instanceof Dict) {
    return Result$Ok(data2);
  }
  if (data2 instanceof Map || data2 instanceof WeakMap) {
    return Result$Ok(from(data2));
  }
  if (data2 == null) {
    return Result$Error("Dict");
  }
  if (typeof data2 !== "object") {
    return Result$Error("Dict");
  }
  const proto = Object.getPrototypeOf(data2);
  if (proto === Object.prototype || proto === null) {
    return Result$Ok(from(Object.entries(data2)));
  }
  return Result$Error("Dict");
}
function float(data2) {
  if (typeof data2 === "number")
    return Result$Ok(data2);
  return Result$Error(0);
}
function int(data2) {
  if (Number.isInteger(data2))
    return Result$Ok(data2);
  return Result$Error(0);
}
function string(data2) {
  if (typeof data2 === "string")
    return Result$Ok(data2);
  return Result$Error("");
}
function is_null(data2) {
  return data2 === null || data2 === undefined;
}
function arrayToList(array) {
  let list3 = List$Empty();
  let i = array.length;
  while (i--) {
    list3 = List$NonEmpty(array[i], list3);
  }
  return list3;
}
function isList(data2) {
  return List$isEmpty(data2) || List$isNonEmpty(data2);
}
function isResult(data2) {
  return Result$isOk(data2) || Result$isError(data2);
}
// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function is_error(result) {
  if (result instanceof Ok) {
    return false;
  } else {
    return true;
  }
}
function map4(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    return result;
  }
}
function map_error(result, fun) {
  if (result instanceof Ok) {
    return result;
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return fun(x);
  } else {
    return result;
  }
}
function lazy_or(first, second) {
  if (first instanceof Ok) {
    return first;
  } else {
    return second();
  }
}
function replace_error(result, error) {
  if (result instanceof Ok) {
    return result;
  } else {
    return new Error(error);
  }
}
// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}
// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function object(entries) {
  return Object.fromEntries(entries);
}
function identity3(x) {
  return x;
}
function array(list3) {
  const array2 = [];
  while (List$isNonEmpty(list3)) {
    array2.push(List$NonEmpty$first(list3));
    list3 = List$NonEmpty$rest(list3);
  }
  return array2;
}
function do_null() {
  return null;
}
function decode(string3) {
  try {
    const result = JSON.parse(string3);
    return Result$Ok(result);
  } catch (err) {
    return Result$Error(getJsonDecodeError(err, string3));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr))
    return DecodeError$UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
    if (result)
      return result;
  }
  return DecodeError$UnexpectedByte("");
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  return DecodeError$UnexpectedByte(byte);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  return DecodeError$UnexpectedByte(byte);
}
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
  return DecodeError$UnexpectedByte(byte);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[2]);
  return DecodeError$UnexpectedByte(byte);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string3) {
  if (line === 1)
    return column - 1;
  let currentLn = 1;
  let position = 0;
  string3.split("").find((char, idx) => {
    if (char === `
`)
      currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
class UnexpectedEndOfInput extends CustomType {
}
var DecodeError$UnexpectedEndOfInput = () => new UnexpectedEndOfInput;
class UnexpectedByte extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
var DecodeError$UnexpectedByte = ($0) => new UnexpectedByte($0);
class UnableToDecode extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
function do_parse(json, decoder) {
  return try$(decode(json), (dynamic_value) => {
    let _pipe = run(dynamic_value, decoder);
    return map_error(_pipe, (var0) => {
      return new UnableToDecode(var0);
    });
  });
}
function parse(json, decoder) {
  return do_parse(json, decoder);
}
function string3(input) {
  return identity3(input);
}
function bool2(input) {
  return identity3(input);
}
function int3(input) {
  return identity3(input);
}
function null$() {
  return do_null();
}
function object2(entries) {
  return object(entries);
}
function preprocessed_array(from2) {
  return array(from2);
}
function array2(entries, inner_type) {
  let _pipe = entries;
  let _pipe$1 = map2(_pipe, inner_type);
  return preprocessed_array(_pipe$1);
}
function dict3(dict4, keys2, values2) {
  return object2(fold(dict4, toList([]), (acc, k, v) => {
    return prepend([keys2(k), values2(v)], acc);
  }));
}
// build/dev/javascript/houdini/houdini.ffi.mjs
function escape(string4) {
  return string4.replaceAll(/[><&"']/g, (replaced) => {
    switch (replaced) {
      case ">":
        return "&gt;";
      case "<":
        return "&lt;";
      case "'":
        return "&#39;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return replaced;
    }
  });
}

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = /* @__PURE__ */ toList([]);
var error_nil = /* @__PURE__ */ new Error(undefined);

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ Order$Gt();
var LT = /* @__PURE__ */ Order$Lt();
var EQ = /* @__PURE__ */ Order$Eq();
function compare2(a, b) {
  if (a.name === b.name) {
    return EQ;
  } else if (a.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
class Attribute extends CustomType {
  constructor(kind, name, value) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value;
  }
}
class Property extends CustomType {
  constructor(kind, name, value) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value;
  }
}
class Event2 extends CustomType {
  constructor(kind, name, handler, include, prevent_default, stop_propagation, debounce, throttle) {
    super();
    this.kind = kind;
    this.name = name;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.debounce = debounce;
    this.throttle = throttle;
  }
}
class Handler extends CustomType {
  constructor(prevent_default, stop_propagation, message) {
    super();
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.message = message;
  }
}
class Never extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
}
class Possible extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
}
var attribute_kind = 0;
var property_kind = 1;
var event_kind = 2;
var never_kind = 0;
var never = /* @__PURE__ */ new Never(never_kind);
var possible_kind = 1;
var possible = /* @__PURE__ */ new Possible(possible_kind);
var always_kind = 2;
function attribute(name, value) {
  return new Attribute(attribute_kind, name, value);
}
function property(name, value) {
  return new Property(property_kind, name, value);
}
function event(name, handler, include, prevent_default, stop_propagation, debounce, throttle) {
  return new Event2(event_kind, name, handler, include, prevent_default, stop_propagation, debounce, throttle);
}
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes instanceof Empty) {
      return merged;
    } else {
      let $ = attributes.head;
      if ($ instanceof Attribute) {
        let $1 = $.name;
        if ($1 === "") {
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = merged;
        } else if ($1 === "class") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "class") {
                  let kind = $.kind;
                  let class1 = $2;
                  let rest = $3.tail;
                  let class2 = $4.value;
                  let value = class1 + " " + class2;
                  let attribute$1 = new Attribute(kind, "class", value);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else if ($1 === "style") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "style") {
                  let kind = $.kind;
                  let style1 = $2;
                  let rest = $3.tail;
                  let style2 = $4.value;
                  let value = style1 + ";" + style2;
                  let attribute$1 = new Attribute(kind, "style", value);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else {
          let attribute$1 = $;
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      } else {
        let attribute$1 = $;
        let rest = attributes.tail;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      }
    }
  }
}
function prepare(attributes) {
  if (attributes instanceof Empty) {
    return attributes;
  } else {
    let $ = attributes.tail;
    if ($ instanceof Empty) {
      return attributes;
    } else {
      let _pipe = attributes;
      let _pipe$1 = sort(_pipe, (a, b) => {
        return compare2(b, a);
      });
      return merge(_pipe$1, empty_list);
    }
  }
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name, value) {
  return attribute(name, value);
}
function property2(name, value) {
  return property(name, value);
}
function boolean_attribute(name, value) {
  if (value) {
    return attribute2(name, "");
  } else {
    return property2(name, bool2(false));
  }
}
function class$(name) {
  return attribute2("class", name);
}
function id(value) {
  return attribute2("id", value);
}
function inert(is_inert) {
  return boolean_attribute("inert", is_inert);
}
function title(text) {
  return attribute2("title", text);
}
function href(url) {
  return attribute2("href", url);
}
function name(element_name) {
  return attribute2("name", element_name);
}

// build/dev/javascript/lustre/lustre/effect.mjs
class Effect extends CustomType {
  constructor(synchronous, before_paint, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint;
    this.after_paint = after_paint;
  }
}

class Actions extends CustomType {
  constructor(dispatch, emit, select, root, provide) {
    super();
    this.dispatch = dispatch;
    this.emit = emit;
    this.select = select;
    this.root = root;
    this.provide = provide;
  }
}
var empty = /* @__PURE__ */ new Effect(/* @__PURE__ */ toList([]), /* @__PURE__ */ toList([]), /* @__PURE__ */ toList([]));
function none() {
  return empty;
}
function from2(effect) {
  let task = (actions) => {
    let dispatch = actions.dispatch;
    return effect(dispatch);
  };
  return new Effect(toList([task]), empty.before_paint, empty.after_paint);
}
function before_paint(effect) {
  let task = (actions) => {
    let root = actions.root();
    let dispatch = actions.dispatch;
    return effect(dispatch, root);
  };
  return new Effect(empty.synchronous, toList([task]), empty.after_paint);
}
function after_paint(effect) {
  let task = (actions) => {
    let root = actions.root();
    let dispatch = actions.dispatch;
    return effect(dispatch, root);
  };
  return new Effect(empty.synchronous, empty.before_paint, toList([task]));
}
function event2(name2, data2) {
  let task = (actions) => {
    return actions.emit(name2, data2);
  };
  return new Effect(toList([task]), empty.before_paint, empty.after_paint);
}
function provide(key, value) {
  let task = (actions) => {
    return actions.provide(key, value);
  };
  return new Effect(toList([task]), empty.before_paint, empty.after_paint);
}
function batch(effects) {
  return fold2(effects, empty, (acc, eff) => {
    return new Effect(fold2(eff.synchronous, acc.synchronous, prepend2), fold2(eff.before_paint, acc.before_paint, prepend2), fold2(eff.after_paint, acc.after_paint, prepend2));
  });
}
function perform(effect, dispatch, emit, select, root, provide2) {
  let actions = new Actions(dispatch, emit, select, root, provide2);
  return each(effect.synchronous, (run2) => {
    return run2(actions);
  });
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get2(map5, key) {
  return map5?.get(key);
}
function get_or_compute(map5, key, compute) {
  return map5?.get(key) ?? compute();
}
function has_key(map5, key) {
  return map5 && map5.has(key);
}
function insert2(map5, key, value) {
  map5 ??= new Map;
  map5.set(key, value);
  return map5;
}
function remove(map5, key) {
  map5?.delete(key);
  return map5;
}

// build/dev/javascript/lustre/lustre/internals/ref.ffi.mjs
function sameValueZero(x, y) {
  if (typeof x === "number" && typeof y === "number") {
    return x === y || x !== x && y !== y;
  }
  return x === y;
}

// build/dev/javascript/lustre/lustre/internals/ref.mjs
function equal_lists(loop$xs, loop$ys) {
  while (true) {
    let xs = loop$xs;
    let ys = loop$ys;
    if (xs instanceof Empty) {
      if (ys instanceof Empty) {
        return true;
      } else {
        return false;
      }
    } else if (ys instanceof Empty) {
      return false;
    } else {
      let x = xs.head;
      let xs$1 = xs.tail;
      let y = ys.head;
      let ys$1 = ys.tail;
      let $ = sameValueZero(x, y);
      if ($) {
        loop$xs = xs$1;
        loop$ys = ys$1;
      } else {
        return $;
      }
    }
  }
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
class Fragment extends CustomType {
  constructor(kind, key, children, keyed_children) {
    super();
    this.kind = kind;
    this.key = key;
    this.children = children;
    this.keyed_children = keyed_children;
  }
}
class Element2 extends CustomType {
  constructor(kind, key, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
}
class Text extends CustomType {
  constructor(kind, key, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.content = content;
  }
}
class UnsafeInnerHtml extends CustomType {
  constructor(kind, key, namespace, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
}
class Map2 extends CustomType {
  constructor(kind, key, mapper, child) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.child = child;
  }
}
class Memo extends CustomType {
  constructor(kind, key, dependencies, view) {
    super();
    this.kind = kind;
    this.key = key;
    this.dependencies = dependencies;
    this.view = view;
  }
}
var fragment_kind = 0;
var element_kind = 1;
var text_kind = 2;
var unsafe_inner_html_kind = 3;
var map_kind = 4;
var memo_kind = 5;
function fragment(key, children, keyed_children) {
  return new Fragment(fragment_kind, key, children, keyed_children);
}
function element(key, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element2(element_kind, key, namespace, tag, prepare(attributes), children, keyed_children, self_closing, void$);
}
function is_void_html_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function text(key, content) {
  return new Text(text_kind, key, content);
}
function unsafe_inner_html(key, namespace, tag, attributes, inner_html) {
  return new UnsafeInnerHtml(unsafe_inner_html_kind, key, namespace, tag, prepare(attributes), inner_html);
}
function map5(element2, mapper) {
  if (element2 instanceof Map2) {
    let child_mapper = element2.mapper;
    return new Map2(map_kind, element2.key, (handler) => {
      return identity2(mapper)(child_mapper(handler));
    }, identity2(element2.child));
  } else {
    return new Map2(map_kind, element2.key, identity2(mapper), identity2(element2));
  }
}
function memo(key, dependencies, view) {
  return new Memo(memo_kind, key, dependencies, view);
}
function to_keyed(key, node) {
  if (node instanceof Fragment) {
    return new Fragment(node.kind, key, node.children, node.keyed_children);
  } else if (node instanceof Element2) {
    return new Element2(node.kind, key, node.namespace, node.tag, node.attributes, node.children, node.keyed_children, node.self_closing, node.void);
  } else if (node instanceof Text) {
    return new Text(node.kind, key, node.content);
  } else if (node instanceof UnsafeInnerHtml) {
    return new UnsafeInnerHtml(node.kind, key, node.namespace, node.tag, node.attributes, node.inner_html);
  } else if (node instanceof Map2) {
    let child = node.child;
    return new Map2(node.kind, key, node.mapper, to_keyed(key, child));
  } else {
    let view = node.view;
    return new Memo(node.kind, key, node.dependencies, () => {
      return to_keyed(key, view());
    });
  }
}

// build/dev/javascript/lustre/lustre/element.mjs
function element2(tag, attributes, children) {
  return element("", "", tag, attributes, children, empty2(), false, is_void_html_element(tag, ""));
}
function text2(content) {
  return text("", content);
}
function none2() {
  return text("", "");
}
function fragment2(children) {
  return fragment("", children, empty2());
}
function unsafe_raw_html(namespace, tag, attributes, inner_html) {
  return unsafe_inner_html("", namespace, tag, attributes, inner_html);
}
function memo2(dependencies, view) {
  return memo("", dependencies, view);
}
function ref(value) {
  return identity2(value);
}
function map6(element3, f) {
  return map5(element3, f);
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function style(attrs, css) {
  return unsafe_raw_html("", "style", attrs, css);
}
function article(attrs, children) {
  return element2("article", attrs, children);
}
function h1(attrs, children) {
  return element2("h1", attrs, children);
}
function h2(attrs, children) {
  return element2("h2", attrs, children);
}
function h3(attrs, children) {
  return element2("h3", attrs, children);
}
function h4(attrs, children) {
  return element2("h4", attrs, children);
}
function h5(attrs, children) {
  return element2("h5", attrs, children);
}
function h6(attrs, children) {
  return element2("h6", attrs, children);
}
function main(attrs, children) {
  return element2("main", attrs, children);
}
function nav(attrs, children) {
  return element2("nav", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function li(attrs, children) {
  return element2("li", attrs, children);
}
function p(attrs, children) {
  return element2("p", attrs, children);
}
function pre(attrs, children) {
  return element2("pre", attrs, children);
}
function ul(attrs, children) {
  return element2("ul", attrs, children);
}
function a(attrs, children) {
  return element2("a", attrs, children);
}
function code(attrs, children) {
  return element2("code", attrs, children);
}
function span(attrs, children) {
  return element2("span", attrs, children);
}
function slot(attrs, fallback) {
  return element2("slot", attrs, fallback);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
class Set2 extends CustomType {
  constructor(dict4) {
    super();
    this.dict = dict4;
  }
}
var token = undefined;
function new$2() {
  return new Set2(make());
}
function insert3(set, member) {
  return new Set2(insert(set.dict, member, token));
}
function delete$2(set, member) {
  return new Set2(delete$(set.dict, member));
}
function to_list2(set) {
  return keys(set.dict);
}
function from_list2(members) {
  let dict4 = fold2(members, make(), (m, k) => {
    return insert(m, k, token);
  });
  return new Set2(dict4);
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
class Patch extends CustomType {
  constructor(index4, removed, changes, children) {
    super();
    this.index = index4;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
}
class ReplaceText extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
}
class ReplaceInnerHtml extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
}
class Update extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
}
class Move extends CustomType {
  constructor(kind, key, before) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
  }
}
class Replace extends CustomType {
  constructor(kind, index4, with$) {
    super();
    this.kind = kind;
    this.index = index4;
    this.with = with$;
  }
}
class Remove extends CustomType {
  constructor(kind, index4) {
    super();
    this.kind = kind;
    this.index = index4;
  }
}
class Insert extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
}
var replace_text_kind = 0;
var replace_inner_html_kind = 1;
var update_kind = 2;
var move_kind = 3;
var remove_kind = 4;
var replace_kind = 5;
var insert_kind = 6;
function new$4(index4, removed, changes, children) {
  return new Patch(index4, removed, changes, children);
}
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
function move(key, before) {
  return new Move(move_kind, key, before);
}
function remove2(index4) {
  return new Remove(remove_kind, index4);
}
function replace2(index4, with$) {
  return new Replace(replace_kind, index4, with$);
}
function insert4(children, before) {
  return new Insert(insert_kind, children, before);
}

// build/dev/javascript/lustre/lustre/runtime/transport.mjs
class Mount extends CustomType {
  constructor(kind, open_shadow_root, will_adopt_styles, observed_attributes, observed_properties, requested_contexts, provided_contexts, vdom, memos) {
    super();
    this.kind = kind;
    this.open_shadow_root = open_shadow_root;
    this.will_adopt_styles = will_adopt_styles;
    this.observed_attributes = observed_attributes;
    this.observed_properties = observed_properties;
    this.requested_contexts = requested_contexts;
    this.provided_contexts = provided_contexts;
    this.vdom = vdom;
    this.memos = memos;
  }
}
class Reconcile extends CustomType {
  constructor(kind, patch, memos) {
    super();
    this.kind = kind;
    this.patch = patch;
    this.memos = memos;
  }
}
class Emit extends CustomType {
  constructor(kind, name2, data2) {
    super();
    this.kind = kind;
    this.name = name2;
    this.data = data2;
  }
}
class Provide extends CustomType {
  constructor(kind, key, value) {
    super();
    this.kind = kind;
    this.key = key;
    this.value = value;
  }
}
class Batch extends CustomType {
  constructor(kind, messages) {
    super();
    this.kind = kind;
    this.messages = messages;
  }
}
var ServerMessage$isBatch = (value) => value instanceof Batch;
class AttributeChanged extends CustomType {
  constructor(kind, name2, value) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value;
  }
}
var ServerMessage$isAttributeChanged = (value) => value instanceof AttributeChanged;
class PropertyChanged extends CustomType {
  constructor(kind, name2, value) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value;
  }
}
var ServerMessage$isPropertyChanged = (value) => value instanceof PropertyChanged;
class EventFired extends CustomType {
  constructor(kind, path, name2, event3) {
    super();
    this.kind = kind;
    this.path = path;
    this.name = name2;
    this.event = event3;
  }
}
var ServerMessage$isEventFired = (value) => value instanceof EventFired;
class ContextProvided extends CustomType {
  constructor(kind, key, value) {
    super();
    this.kind = kind;
    this.key = key;
    this.value = value;
  }
}
var ServerMessage$isContextProvided = (value) => value instanceof ContextProvided;
var mount_kind = 0;
var reconcile_kind = 1;
var emit_kind = 2;
var provide_kind = 3;
function mount(open_shadow_root, will_adopt_styles, observed_attributes, observed_properties, requested_contexts, provided_contexts, vdom, memos) {
  return new Mount(mount_kind, open_shadow_root, will_adopt_styles, observed_attributes, observed_properties, requested_contexts, provided_contexts, vdom, memos);
}
function reconcile(patch, memos) {
  return new Reconcile(reconcile_kind, patch, memos);
}
function emit(name2, data2) {
  return new Emit(emit_kind, name2, data2);
}
function provide2(key, value) {
  return new Provide(provide_kind, key, value);
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
class Root extends CustomType {
}

class Key extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
}

class Index extends CustomType {
  constructor(index4, parent) {
    super();
    this.index = index4;
    this.parent = parent;
  }
}

class Subtree extends CustomType {
  constructor(parent) {
    super();
    this.parent = parent;
  }
}
var separator_subtree = "\r";
var separator_element = "\t";
var separator_event = `
`;
var root = /* @__PURE__ */ new Root;
function finish_to_string(acc) {
  if (acc instanceof Empty) {
    return "";
  } else {
    let segments = acc.tail;
    return concat2(segments);
  }
}
function do_to_string(loop$full, loop$path, loop$acc) {
  while (true) {
    let full = loop$full;
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      return finish_to_string(acc);
    } else if (path instanceof Key) {
      let key = path.key;
      let parent = path.parent;
      loop$full = full;
      loop$path = parent;
      loop$acc = prepend(separator_element, prepend(key, acc));
    } else if (path instanceof Index) {
      let index4 = path.index;
      let parent = path.parent;
      let acc$1 = prepend(separator_element, prepend(to_string(index4), acc));
      loop$full = full;
      loop$path = parent;
      loop$acc = acc$1;
    } else if (!full) {
      return finish_to_string(acc);
    } else {
      let parent = path.parent;
      if (acc instanceof Empty) {
        loop$full = full;
        loop$path = parent;
        loop$acc = acc;
      } else {
        let acc$1 = acc.tail;
        loop$full = full;
        loop$path = parent;
        loop$acc = prepend(separator_subtree, acc$1);
      }
    }
  }
}
function to_string3(path) {
  return do_to_string(true, path, empty_list);
}
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return $;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string3(path), candidates);
  }
}
function split_subtree_path(path) {
  return split2(path, separator_subtree);
}
function add2(parent, index4, key) {
  if (key === "") {
    return new Index(index4, parent);
  } else {
    return new Key(key, parent);
  }
}
function subtree(path) {
  return new Subtree(path);
}
function event3(path, event4) {
  return do_to_string(false, path, prepend(separator_event, prepend(event4, empty_list)));
}
function child(path) {
  return do_to_string(false, path, empty_list);
}

// build/dev/javascript/lustre/lustre/vdom/cache.mjs
class Cache extends CustomType {
  constructor(events, vdoms, old_vdoms, dispatched_paths, next_dispatched_paths) {
    super();
    this.events = events;
    this.vdoms = vdoms;
    this.old_vdoms = old_vdoms;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
}

class Events extends CustomType {
  constructor(handlers, children) {
    super();
    this.handlers = handlers;
    this.children = children;
  }
}

class Child extends CustomType {
  constructor(mapper, events) {
    super();
    this.mapper = mapper;
    this.events = events;
  }
}

class AddedChildren extends CustomType {
  constructor(handlers, children, vdoms) {
    super();
    this.handlers = handlers;
    this.children = children;
    this.vdoms = vdoms;
  }
}

class DecodedEvent extends CustomType {
  constructor(path, handler) {
    super();
    this.path = path;
    this.handler = handler;
  }
}

class DispatchedEvent extends CustomType {
  constructor(path) {
    super();
    this.path = path;
  }
}
function compose_mapper(mapper, child_mapper) {
  return (msg) => {
    return mapper(child_mapper(msg));
  };
}
function new_events() {
  return new Events(empty2(), empty2());
}
function new$5() {
  return new Cache(new_events(), empty2(), empty2(), empty_list, empty_list);
}
function do_add_event(handlers, path, name2, handler) {
  return insert2(handlers, event3(path, name2), handler);
}
function add_attributes(handlers, path, attributes) {
  return fold2(attributes, handlers, (events, attribute3) => {
    if (attribute3 instanceof Event2) {
      let name2 = attribute3.name;
      let handler = attribute3.handler;
      return do_add_event(events, path, name2, handler);
    } else {
      return events;
    }
  });
}
function do_add_children(loop$handlers, loop$children, loop$vdoms, loop$parent, loop$child_index, loop$nodes) {
  while (true) {
    let handlers = loop$handlers;
    let children = loop$children;
    let vdoms = loop$vdoms;
    let parent = loop$parent;
    let child_index = loop$child_index;
    let nodes = loop$nodes;
    let next = child_index + 1;
    if (nodes instanceof Empty) {
      return new AddedChildren(handlers, children, vdoms);
    } else {
      let $ = nodes.head;
      if ($ instanceof Fragment) {
        let rest = nodes.tail;
        let key = $.key;
        let nodes$1 = $.children;
        let path = add2(parent, child_index, key);
        let $1 = do_add_children(handlers, children, vdoms, path, 0, nodes$1);
        let handlers$1;
        let children$1;
        let vdoms$1;
        handlers$1 = $1.handlers;
        children$1 = $1.children;
        vdoms$1 = $1.vdoms;
        loop$handlers = handlers$1;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else if ($ instanceof Element2) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes = $.attributes;
        let nodes$1 = $.children;
        let path = add2(parent, child_index, key);
        let handlers$1 = add_attributes(handlers, path, attributes);
        let $1 = do_add_children(handlers$1, children, vdoms, path, 0, nodes$1);
        let handlers$2;
        let children$1;
        let vdoms$1;
        handlers$2 = $1.handlers;
        children$1 = $1.children;
        vdoms$1 = $1.vdoms;
        loop$handlers = handlers$2;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else if ($ instanceof Text) {
        let rest = nodes.tail;
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else if ($ instanceof UnsafeInnerHtml) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes = $.attributes;
        let path = add2(parent, child_index, key);
        let handlers$1 = add_attributes(handlers, path, attributes);
        loop$handlers = handlers$1;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else if ($ instanceof Map2) {
        let rest = nodes.tail;
        let key = $.key;
        let mapper = $.mapper;
        let child2 = $.child;
        let path = add2(parent, child_index, key);
        let added = do_add_children(empty2(), empty2(), vdoms, subtree(path), 0, prepend(child2, empty_list));
        let vdoms$1 = added.vdoms;
        let child_events = new Events(added.handlers, added.children);
        let child$1 = new Child(mapper, child_events);
        let children$1 = insert2(children, child(path), child$1);
        loop$handlers = handlers;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else {
        let rest = nodes.tail;
        let view = $.view;
        let child_node = view();
        let vdoms$1 = insert2(vdoms, view, child_node);
        let next$1 = child_index;
        let rest$1 = prepend(child_node, rest);
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next$1;
        loop$nodes = rest$1;
      }
    }
  }
}
function add_children(cache, events, path, child_index, nodes) {
  let vdoms = cache.vdoms;
  let handlers;
  let children;
  handlers = events.handlers;
  children = events.children;
  let $ = do_add_children(handlers, children, vdoms, path, child_index, nodes);
  let handlers$1;
  let children$1;
  let vdoms$1;
  handlers$1 = $.handlers;
  children$1 = $.children;
  vdoms$1 = $.vdoms;
  return [
    new Cache(cache.events, vdoms$1, cache.old_vdoms, cache.dispatched_paths, cache.next_dispatched_paths),
    new Events(handlers$1, children$1)
  ];
}
function add_child(cache, events, parent, index4, child2) {
  let children = prepend(child2, empty_list);
  return add_children(cache, events, parent, index4, children);
}
function from_node(root2) {
  let cache = new$5();
  let $ = add_child(cache, cache.events, root, 0, root2);
  let cache$1;
  let events$1;
  cache$1 = $[0];
  events$1 = $[1];
  return new Cache(events$1, cache$1.vdoms, cache$1.old_vdoms, cache$1.dispatched_paths, cache$1.next_dispatched_paths);
}
function tick(cache) {
  return new Cache(cache.events, empty2(), cache.vdoms, cache.next_dispatched_paths, empty_list);
}
function events(cache) {
  return cache.events;
}
function update_events(cache, events2) {
  return new Cache(events2, cache.vdoms, cache.old_vdoms, cache.dispatched_paths, cache.next_dispatched_paths);
}
function memos(cache) {
  return cache.vdoms;
}
function get_old_memo(cache, old, new$6) {
  return get_or_compute(cache.old_vdoms, old, new$6);
}
function keep_memo(cache, old, new$6) {
  let node = get_or_compute(cache.old_vdoms, old, new$6);
  let vdoms = insert2(cache.vdoms, new$6, node);
  return new Cache(cache.events, vdoms, cache.old_vdoms, cache.dispatched_paths, cache.next_dispatched_paths);
}
function add_memo(cache, new$6, node) {
  let vdoms = insert2(cache.vdoms, new$6, node);
  return new Cache(cache.events, vdoms, cache.old_vdoms, cache.dispatched_paths, cache.next_dispatched_paths);
}
function get_subtree(events2, path, old_mapper) {
  let child2 = get_or_compute(events2.children, path, () => {
    return new Child(old_mapper, new_events());
  });
  return child2.events;
}
function update_subtree(parent, path, mapper, events2) {
  let new_child = new Child(mapper, events2);
  let children = insert2(parent.children, path, new_child);
  return new Events(parent.handlers, children);
}
function add_event(events2, path, name2, handler) {
  let handlers = do_add_event(events2.handlers, path, name2, handler);
  return new Events(handlers, events2.children);
}
function do_remove_event(handlers, path, name2) {
  return remove(handlers, event3(path, name2));
}
function remove_event(events2, path, name2) {
  let handlers = do_remove_event(events2.handlers, path, name2);
  return new Events(handlers, events2.children);
}
function remove_attributes(handlers, path, attributes) {
  return fold2(attributes, handlers, (events2, attribute3) => {
    if (attribute3 instanceof Event2) {
      let name2 = attribute3.name;
      return do_remove_event(events2, path, name2);
    } else {
      return events2;
    }
  });
}
function do_remove_children(loop$handlers, loop$children, loop$vdoms, loop$parent, loop$index, loop$nodes) {
  while (true) {
    let handlers = loop$handlers;
    let children = loop$children;
    let vdoms = loop$vdoms;
    let parent = loop$parent;
    let index4 = loop$index;
    let nodes = loop$nodes;
    let next = index4 + 1;
    if (nodes instanceof Empty) {
      return new Events(handlers, children);
    } else {
      let $ = nodes.head;
      if ($ instanceof Fragment) {
        let rest = nodes.tail;
        let key = $.key;
        let nodes$1 = $.children;
        let path = add2(parent, index4, key);
        let $1 = do_remove_children(handlers, children, vdoms, path, 0, nodes$1);
        let handlers$1;
        let children$1;
        handlers$1 = $1.handlers;
        children$1 = $1.children;
        loop$handlers = handlers$1;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else if ($ instanceof Element2) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes = $.attributes;
        let nodes$1 = $.children;
        let path = add2(parent, index4, key);
        let handlers$1 = remove_attributes(handlers, path, attributes);
        let $1 = do_remove_children(handlers$1, children, vdoms, path, 0, nodes$1);
        let handlers$2;
        let children$1;
        handlers$2 = $1.handlers;
        children$1 = $1.children;
        loop$handlers = handlers$2;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else if ($ instanceof Text) {
        let rest = nodes.tail;
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else if ($ instanceof UnsafeInnerHtml) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes = $.attributes;
        let path = add2(parent, index4, key);
        let handlers$1 = remove_attributes(handlers, path, attributes);
        loop$handlers = handlers$1;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else if ($ instanceof Map2) {
        let rest = nodes.tail;
        let key = $.key;
        let path = add2(parent, index4, key);
        let children$1 = remove(children, child(path));
        loop$handlers = handlers;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else {
        let rest = nodes.tail;
        let view = $.view;
        let $1 = has_key(vdoms, view);
        if ($1) {
          let child2 = get2(vdoms, view);
          let nodes$1 = prepend(child2, rest);
          loop$handlers = handlers;
          loop$children = children;
          loop$vdoms = vdoms;
          loop$parent = parent;
          loop$index = index4;
          loop$nodes = nodes$1;
        } else {
          loop$handlers = handlers;
          loop$children = children;
          loop$vdoms = vdoms;
          loop$parent = parent;
          loop$index = next;
          loop$nodes = rest;
        }
      }
    }
  }
}
function remove_child(cache, events2, parent, child_index, child2) {
  return do_remove_children(events2.handlers, events2.children, cache.old_vdoms, parent, child_index, prepend(child2, empty_list));
}
function replace_child(cache, events2, parent, child_index, prev, next) {
  let events$1 = remove_child(cache, events2, parent, child_index, prev);
  return add_child(cache, events$1, parent, child_index, next);
}
function get_handler(loop$events, loop$path, loop$mapper) {
  while (true) {
    let events2 = loop$events;
    let path = loop$path;
    let mapper = loop$mapper;
    if (path instanceof Empty) {
      return error_nil;
    } else {
      let $ = path.tail;
      if ($ instanceof Empty) {
        let key = path.head;
        let $1 = has_key(events2.handlers, key);
        if ($1) {
          let handler = get2(events2.handlers, key);
          return new Ok(map3(handler, (handler2) => {
            return new Handler(handler2.prevent_default, handler2.stop_propagation, identity2(mapper)(handler2.message));
          }));
        } else {
          return error_nil;
        }
      } else {
        let key = path.head;
        let path$1 = $;
        let $1 = has_key(events2.children, key);
        if ($1) {
          let child2 = get2(events2.children, key);
          let mapper$1 = compose_mapper(mapper, child2.mapper);
          loop$events = child2.events;
          loop$path = path$1;
          loop$mapper = mapper$1;
        } else {
          return error_nil;
        }
      }
    }
  }
}
function decode2(cache, path, name2, event4) {
  let parts = split_subtree_path(path + separator_event + name2);
  let $ = get_handler(cache.events, parts, identity2);
  if ($ instanceof Ok) {
    let handler = $[0];
    let $1 = run(event4, handler);
    if ($1 instanceof Ok) {
      let handler$1 = $1[0];
      return new DecodedEvent(path, handler$1);
    } else {
      return new DispatchedEvent(path);
    }
  } else {
    return new DispatchedEvent(path);
  }
}
function dispatch(cache, event4) {
  let next_dispatched_paths = prepend(event4.path, cache.next_dispatched_paths);
  let cache$1 = new Cache(cache.events, cache.vdoms, cache.old_vdoms, cache.dispatched_paths, next_dispatched_paths);
  if (event4 instanceof DecodedEvent) {
    let handler = event4.handler;
    return [cache$1, new Ok(handler)];
  } else {
    return [cache$1, error_nil];
  }
}
function handle(cache, path, name2, event4) {
  let _pipe = decode2(cache, path, name2, event4);
  return ((_capture) => {
    return dispatch(cache, _capture);
  })(_pipe);
}
function has_dispatched_events(cache, path) {
  return matches(path, cache.dispatched_paths);
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
class ClientDispatchedMessage extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
}
var Message$isClientDispatchedMessage = (value) => value instanceof ClientDispatchedMessage;
class ClientRegisteredCallback extends CustomType {
  constructor(callback) {
    super();
    this.callback = callback;
  }
}
var Message$isClientRegisteredCallback = (value) => value instanceof ClientRegisteredCallback;
class ClientDeregisteredCallback extends CustomType {
  constructor(callback) {
    super();
    this.callback = callback;
  }
}
var Message$isClientDeregisteredCallback = (value) => value instanceof ClientDeregisteredCallback;
class EffectDispatchedMessage extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
}
var Message$EffectDispatchedMessage = (message) => new EffectDispatchedMessage(message);
var Message$isEffectDispatchedMessage = (value) => value instanceof EffectDispatchedMessage;
class EffectEmitEvent extends CustomType {
  constructor(name2, data2) {
    super();
    this.name = name2;
    this.data = data2;
  }
}
var Message$EffectEmitEvent = (name2, data2) => new EffectEmitEvent(name2, data2);
var Message$isEffectEmitEvent = (value) => value instanceof EffectEmitEvent;
class EffectProvidedValue extends CustomType {
  constructor(key, value) {
    super();
    this.key = key;
    this.value = value;
  }
}
var Message$EffectProvidedValue = (key, value) => new EffectProvidedValue(key, value);
var Message$isEffectProvidedValue = (value) => value instanceof EffectProvidedValue;
class SystemRequestedShutdown extends CustomType {
}
var Message$isSystemRequestedShutdown = (value) => value instanceof SystemRequestedShutdown;

// build/dev/javascript/lustre/lustre/runtime/app.mjs
class App extends CustomType {
  constructor(name2, init, update2, view, config2) {
    super();
    this.name = name2;
    this.init = init;
    this.update = update2;
    this.view = view;
    this.config = config2;
  }
}
class Config2 extends CustomType {
  constructor(open_shadow_root, adopt_styles, delegates_focus, attributes, properties, contexts, is_form_associated, on_form_autofill, on_form_reset, on_form_restore, on_connect, on_adopt, on_disconnect) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.delegates_focus = delegates_focus;
    this.attributes = attributes;
    this.properties = properties;
    this.contexts = contexts;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
    this.on_connect = on_connect;
    this.on_adopt = on_adopt;
    this.on_disconnect = on_disconnect;
  }
}
class Option extends CustomType {
  constructor(apply) {
    super();
    this.apply = apply;
  }
}
var default_config = /* @__PURE__ */ new Config2(true, true, false, empty_list, empty_list, empty_list, false, /* @__PURE__ */ new None, /* @__PURE__ */ new None, /* @__PURE__ */ new None, /* @__PURE__ */ new None, /* @__PURE__ */ new None, /* @__PURE__ */ new None);
function configure(options) {
  return fold2(options, default_config, (config2, option) => {
    return option.apply(config2);
  });
}

// build/dev/javascript/lustre/lustre/internals/equals.ffi.mjs
var isEqual2 = (a2, b) => {
  if (a2 === b) {
    return true;
  }
  if (a2 == null || b == null) {
    return false;
  }
  const type = typeof a2;
  if (type !== typeof b) {
    return false;
  }
  if (type !== "object") {
    return false;
  }
  const ctor = a2.constructor;
  if (ctor !== b.constructor) {
    return false;
  }
  if (Array.isArray(a2)) {
    return areArraysEqual(a2, b);
  }
  return areObjectsEqual(a2, b);
};
var areArraysEqual = (a2, b) => {
  let index4 = a2.length;
  if (index4 !== b.length) {
    return false;
  }
  while (index4--) {
    if (!isEqual2(a2[index4], b[index4])) {
      return false;
    }
  }
  return true;
};
var areObjectsEqual = (a2, b) => {
  const properties = Object.keys(a2);
  let index4 = properties.length;
  if (Object.keys(b).length !== index4) {
    return false;
  }
  while (index4--) {
    const property3 = properties[index4];
    if (!Object.hasOwn(b, property3)) {
      return false;
    }
    if (!isEqual2(a2[property3], b[property3])) {
      return false;
    }
  }
  return true;
};

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
class Diff extends CustomType {
  constructor(patch, cache) {
    super();
    this.patch = patch;
    this.cache = cache;
  }
}
class PartialDiff extends CustomType {
  constructor(patch, cache, events2) {
    super();
    this.patch = patch;
    this.cache = cache;
    this.events = events2;
  }
}

class AttributeChange extends CustomType {
  constructor(added, removed, events2) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events2;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let events2 = loop$events;
    let old = loop$old;
    let new$6 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (old instanceof Empty) {
      if (new$6 instanceof Empty) {
        return new AttributeChange(added, removed, events2);
      } else {
        let $ = new$6.head;
        if ($ instanceof Event2) {
          let next = $;
          let new$1 = new$6.tail;
          let name2 = $.name;
          let handler = $.handler;
          let events$1 = add_event(events2, path, name2, handler);
          let added$1 = prepend(next, added);
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events$1;
          loop$old = old;
          loop$new = new$1;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let next = $;
          let new$1 = new$6.tail;
          let added$1 = prepend(next, added);
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events2;
          loop$old = old;
          loop$new = new$1;
          loop$added = added$1;
          loop$removed = removed;
        }
      }
    } else if (new$6 instanceof Empty) {
      let $ = old.head;
      if ($ instanceof Event2) {
        let prev = $;
        let old$1 = old.tail;
        let name2 = $.name;
        let events$1 = remove_event(events2, path, name2);
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events$1;
        loop$old = old$1;
        loop$new = new$6;
        loop$added = added;
        loop$removed = removed$1;
      } else {
        let prev = $;
        let old$1 = old.tail;
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events2;
        loop$old = old$1;
        loop$new = new$6;
        loop$added = added;
        loop$removed = removed$1;
      }
    } else {
      let prev = old.head;
      let remaining_old = old.tail;
      let next = new$6.head;
      let remaining_new = new$6.tail;
      let $ = compare2(prev, next);
      if ($ instanceof Lt) {
        if (prev instanceof Event2) {
          let name2 = prev.name;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = remove_event(events2, path, name2);
          loop$old = remaining_old;
          loop$new = new$6;
          loop$added = added;
          loop$removed = prepend(prev, removed);
        } else {
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events2;
          loop$old = remaining_old;
          loop$new = new$6;
          loop$added = added;
          loop$removed = prepend(prev, removed);
        }
      } else if ($ instanceof Eq) {
        if (prev instanceof Attribute) {
          if (next instanceof Attribute) {
            let _block;
            let $1 = next.name;
            if ($1 === "value") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "checked") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "selected") {
              _block = controlled || prev.value !== next.value;
            } else {
              _block = prev.value !== next.value;
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (next instanceof Event2) {
            let name2 = next.name;
            let handler = next.handler;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = add_event(events2, path, name2, handler);
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next, added);
            loop$removed = prepend(prev, removed);
          } else {
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next, added);
            loop$removed = prepend(prev, removed);
          }
        } else if (prev instanceof Property) {
          if (next instanceof Property) {
            let _block;
            let $1 = next.name;
            if ($1 === "scrollLeft") {
              _block = true;
            } else if ($1 === "scrollRight") {
              _block = true;
            } else if ($1 === "value") {
              _block = controlled || !isEqual2(prev.value, next.value);
            } else if ($1 === "checked") {
              _block = controlled || !isEqual2(prev.value, next.value);
            } else if ($1 === "selected") {
              _block = controlled || !isEqual2(prev.value, next.value);
            } else {
              _block = !isEqual2(prev.value, next.value);
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (next instanceof Event2) {
            let name2 = next.name;
            let handler = next.handler;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = add_event(events2, path, name2, handler);
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next, added);
            loop$removed = prepend(prev, removed);
          } else {
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next, added);
            loop$removed = prepend(prev, removed);
          }
        } else if (next instanceof Event2) {
          let name2 = next.name;
          let handler = next.handler;
          let has_changes = prev.prevent_default.kind !== next.prevent_default.kind || prev.stop_propagation.kind !== next.stop_propagation.kind || prev.debounce !== next.debounce || prev.throttle !== next.throttle;
          let _block;
          if (has_changes) {
            _block = prepend(next, added);
          } else {
            _block = added;
          }
          let added$1 = _block;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = add_event(events2, path, name2, handler);
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let name2 = prev.name;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = remove_event(events2, path, name2);
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = prepend(next, added);
          loop$removed = prepend(prev, removed);
        }
      } else if (next instanceof Event2) {
        let name2 = next.name;
        let handler = next.handler;
        loop$controlled = controlled;
        loop$path = path;
        loop$events = add_event(events2, path, name2, handler);
        loop$old = old;
        loop$new = remaining_new;
        loop$added = prepend(next, added);
        loop$removed = removed;
      } else {
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events2;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = prepend(next, added);
        loop$removed = removed;
      }
    }
  }
}
function is_controlled(cache, namespace, tag, path) {
  if (tag === "input" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else if (tag === "select" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else if (tag === "textarea" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else {
    return false;
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$changes, loop$children, loop$path, loop$cache, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$6 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let changes = loop$changes;
    let children = loop$children;
    let path = loop$path;
    let cache = loop$cache;
    let events2 = loop$events;
    if (old instanceof Empty) {
      if (new$6 instanceof Empty) {
        let patch = new Patch(patch_index, removed, changes, children);
        return new PartialDiff(patch, cache, events2);
      } else {
        let $ = add_children(cache, events2, path, node_index, new$6);
        let cache$1;
        let events$1;
        cache$1 = $[0];
        events$1 = $[1];
        let insert5 = insert4(new$6, node_index - moved_offset);
        let changes$1 = prepend(insert5, changes);
        let patch = new Patch(patch_index, removed, changes$1, children);
        return new PartialDiff(patch, cache$1, events$1);
      }
    } else if (new$6 instanceof Empty) {
      let prev = old.head;
      let old$1 = old.tail;
      let _block;
      let $ = prev.key === "" || !has_key(moved, prev.key);
      if ($) {
        _block = removed + 1;
      } else {
        _block = removed;
      }
      let removed$1 = _block;
      let events$1 = remove_child(cache, events2, path, node_index, prev);
      loop$old = old$1;
      loop$old_keyed = old_keyed;
      loop$new = new$6;
      loop$new_keyed = new_keyed;
      loop$moved = moved;
      loop$moved_offset = moved_offset;
      loop$removed = removed$1;
      loop$node_index = node_index;
      loop$patch_index = patch_index;
      loop$changes = changes;
      loop$children = children;
      loop$path = path;
      loop$cache = cache;
      loop$events = events$1;
    } else {
      let prev = old.head;
      let next = new$6.head;
      if (prev.key !== next.key) {
        let old_remaining = old.tail;
        let new_remaining = new$6.tail;
        let next_did_exist = has_key(old_keyed, next.key);
        let prev_does_exist = has_key(new_keyed, prev.key);
        if (prev_does_exist) {
          if (next_did_exist) {
            let $ = has_key(moved, prev.key);
            if ($) {
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$6;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            } else {
              let match = get2(old_keyed, next.key);
              let before = node_index - moved_offset;
              let changes$1 = prepend(move(next.key, before), changes);
              let moved$1 = insert2(moved, next.key, undefined);
              loop$old = prepend(match, old);
              loop$old_keyed = old_keyed;
              loop$new = new$6;
              loop$new_keyed = new_keyed;
              loop$moved = moved$1;
              loop$moved_offset = moved_offset + 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes$1;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            }
          } else {
            let before = node_index - moved_offset;
            let $ = add_child(cache, events2, path, node_index, next);
            let cache$1;
            let events$1;
            cache$1 = $[0];
            events$1 = $[1];
            let insert5 = insert4(toList([next]), before);
            let changes$1 = prepend(insert5, changes);
            loop$old = old;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset + 1;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes$1;
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if (next_did_exist) {
          let index4 = node_index - moved_offset;
          let changes$1 = prepend(remove2(index4), changes);
          let events$1 = remove_child(cache, events2, path, node_index, prev);
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new$6;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset - 1;
          loop$removed = removed;
          loop$node_index = node_index;
          loop$patch_index = patch_index;
          loop$changes = changes$1;
          loop$children = children;
          loop$path = path;
          loop$cache = cache;
          loop$events = events$1;
        } else {
          let change = replace2(node_index - moved_offset, next);
          let $ = replace_child(cache, events2, path, node_index, prev, next);
          let cache$1;
          let events$1;
          cache$1 = $[0];
          events$1 = $[1];
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$changes = prepend(change, changes);
          loop$children = children;
          loop$path = path;
          loop$cache = cache$1;
          loop$events = events$1;
        }
      } else {
        let $ = old.head;
        if ($ instanceof Fragment) {
          let $1 = new$6.head;
          if ($1 instanceof Fragment) {
            let prev2 = $;
            let old$1 = old.tail;
            let next2 = $1;
            let new$1 = new$6.tail;
            let $2 = do_diff(prev2.children, prev2.keyed_children, next2.children, next2.keyed_children, empty2(), 0, 0, 0, node_index, empty_list, empty_list, add2(path, node_index, next2.key), cache, events2);
            let patch;
            let cache$1;
            let events$1;
            patch = $2.patch;
            cache$1 = $2.cache;
            events$1 = $2.events;
            let _block;
            let $3 = patch.changes;
            if ($3 instanceof Empty) {
              let $4 = patch.children;
              if ($4 instanceof Empty) {
                let $5 = patch.removed;
                if ($5 === 0) {
                  _block = children;
                } else {
                  _block = prepend(patch, children);
                }
              } else {
                _block = prepend(patch, children);
              }
            } else {
              _block = prepend(patch, children);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$6.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1;
            let events$1;
            cache$1 = $2[0];
            events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Element2) {
          let $1 = new$6.head;
          if ($1 instanceof Element2) {
            let prev2 = $;
            let next2 = $1;
            if (prev2.namespace === next2.namespace && prev2.tag === next2.tag) {
              let old$1 = old.tail;
              let new$1 = new$6.tail;
              let child_path = add2(path, node_index, next2.key);
              let controlled = is_controlled(cache, next2.namespace, next2.tag, child_path);
              let $2 = diff_attributes(controlled, child_path, events2, prev2.attributes, next2.attributes, empty_list, empty_list);
              let added_attrs;
              let removed_attrs;
              let events$1;
              added_attrs = $2.added;
              removed_attrs = $2.removed;
              events$1 = $2.events;
              let _block;
              if (added_attrs instanceof Empty && removed_attrs instanceof Empty) {
                _block = empty_list;
              } else {
                _block = toList([update(added_attrs, removed_attrs)]);
              }
              let initial_child_changes = _block;
              let $3 = do_diff(prev2.children, prev2.keyed_children, next2.children, next2.keyed_children, empty2(), 0, 0, 0, node_index, initial_child_changes, empty_list, child_path, cache, events$1);
              let patch;
              let cache$1;
              let events$2;
              patch = $3.patch;
              cache$1 = $3.cache;
              events$2 = $3.events;
              let _block$1;
              let $4 = patch.changes;
              if ($4 instanceof Empty) {
                let $5 = patch.children;
                if ($5 instanceof Empty) {
                  let $6 = patch.removed;
                  if ($6 === 0) {
                    _block$1 = children;
                  } else {
                    _block$1 = prepend(patch, children);
                  }
                } else {
                  _block$1 = prepend(patch, children);
                }
              } else {
                _block$1 = prepend(patch, children);
              }
              let children$1 = _block$1;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children$1;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events$2;
            } else {
              let prev3 = $;
              let old_remaining = old.tail;
              let next3 = $1;
              let new_remaining = new$6.tail;
              let change = replace2(node_index - moved_offset, next3);
              let $2 = replace_child(cache, events2, path, node_index, prev3, next3);
              let cache$1;
              let events$1;
              cache$1 = $2[0];
              events$1 = $2[1];
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events$1;
            }
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$6.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1;
            let events$1;
            cache$1 = $2[0];
            events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Text) {
          let $1 = new$6.head;
          if ($1 instanceof Text) {
            let prev2 = $;
            let next2 = $1;
            if (prev2.content === next2.content) {
              let old$1 = old.tail;
              let new$1 = new$6.tail;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            } else {
              let old$1 = old.tail;
              let next3 = $1;
              let new$1 = new$6.tail;
              let child2 = new$4(node_index, 0, toList([replace_text(next3.content)]), empty_list);
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = prepend(child2, children);
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            }
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$6.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1;
            let events$1;
            cache$1 = $2[0];
            events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof UnsafeInnerHtml) {
          let $1 = new$6.head;
          if ($1 instanceof UnsafeInnerHtml) {
            let prev2 = $;
            let old$1 = old.tail;
            let next2 = $1;
            let new$1 = new$6.tail;
            let child_path = add2(path, node_index, next2.key);
            let $2 = diff_attributes(false, child_path, events2, prev2.attributes, next2.attributes, empty_list, empty_list);
            let added_attrs;
            let removed_attrs;
            let events$1;
            added_attrs = $2.added;
            removed_attrs = $2.removed;
            events$1 = $2.events;
            let _block;
            if (added_attrs instanceof Empty && removed_attrs instanceof Empty) {
              _block = empty_list;
            } else {
              _block = toList([update(added_attrs, removed_attrs)]);
            }
            let child_changes = _block;
            let _block$1;
            let $3 = prev2.inner_html === next2.inner_html;
            if ($3) {
              _block$1 = child_changes;
            } else {
              _block$1 = prepend(replace_inner_html(next2.inner_html), child_changes);
            }
            let child_changes$1 = _block$1;
            let _block$2;
            if (child_changes$1 instanceof Empty) {
              _block$2 = children;
            } else {
              _block$2 = prepend(new$4(node_index, 0, child_changes$1, toList([])), children);
            }
            let children$1 = _block$2;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache;
            loop$events = events$1;
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$6.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1;
            let events$1;
            cache$1 = $2[0];
            events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Map2) {
          let $1 = new$6.head;
          if ($1 instanceof Map2) {
            let prev2 = $;
            let old$1 = old.tail;
            let next2 = $1;
            let new$1 = new$6.tail;
            let child_path = add2(path, node_index, next2.key);
            let child_key = child(child_path);
            let $2 = do_diff(prepend(prev2.child, empty_list), empty2(), prepend(next2.child, empty_list), empty2(), empty2(), 0, 0, 0, node_index, empty_list, empty_list, subtree(child_path), cache, get_subtree(events2, child_key, prev2.mapper));
            let patch;
            let cache$1;
            let child_events;
            patch = $2.patch;
            cache$1 = $2.cache;
            child_events = $2.events;
            let events$1 = update_subtree(events2, child_key, next2.mapper, child_events);
            let _block;
            let $3 = patch.changes;
            if ($3 instanceof Empty) {
              let $4 = patch.children;
              if ($4 instanceof Empty) {
                let $5 = patch.removed;
                if ($5 === 0) {
                  _block = children;
                } else {
                  _block = prepend(patch, children);
                }
              } else {
                _block = prepend(patch, children);
              }
            } else {
              _block = prepend(patch, children);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$6.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1;
            let events$1;
            cache$1 = $2[0];
            events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else {
          let $1 = new$6.head;
          if ($1 instanceof Memo) {
            let prev2 = $;
            let old$1 = old.tail;
            let next2 = $1;
            let new$1 = new$6.tail;
            let $2 = equal_lists(prev2.dependencies, next2.dependencies);
            if ($2) {
              let cache$1 = keep_memo(cache, prev2.view, next2.view);
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events2;
            } else {
              let prev_node = get_old_memo(cache, prev2.view, prev2.view);
              let next_node = next2.view();
              let cache$1 = add_memo(cache, next2.view, next_node);
              loop$old = prepend(prev_node, old$1);
              loop$old_keyed = old_keyed;
              loop$new = prepend(next_node, new$1);
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events2;
            }
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$6.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1;
            let events$1;
            cache$1 = $2[0];
            events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        }
      }
    }
  }
}
function diff(cache, old, new$6) {
  let cache$1 = tick(cache);
  let $ = do_diff(prepend(old, empty_list), empty2(), prepend(new$6, empty_list), empty2(), empty2(), 0, 0, 0, 0, empty_list, empty_list, root, cache$1, events(cache$1));
  let patch;
  let cache$2;
  let events2;
  patch = $.patch;
  cache$2 = $.cache;
  events2 = $.events;
  return new Diff(patch, update_events(cache$2, events2));
}

// build/dev/javascript/lustre/lustre/internals/list.ffi.mjs
var toList2 = (arr) => arr.reduceRight((xs, x) => List$NonEmpty(x, xs), empty_list);
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0;i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4;List$NonEmpty$rest(list4); list4 = List$NonEmpty$rest(list4)) {
      callback(List$NonEmpty$first(list4));
    }
  }
};
var append4 = (a2, b) => {
  if (!List$NonEmpty$rest(a2)) {
    return b;
  } else if (!List$NonEmpty$rest(b)) {
    return a2;
  } else {
    return append(a2, b);
  }
};

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var setTimeout2 = globalThis.setTimeout;
var clearTimeout2 = globalThis.clearTimeout;
var createElementNS = (ns, name2) => globalThis.document.createElementNS(ns, name2);
var createTextNode = (data2) => globalThis.document.createTextNode(data2);
var createComment = (data2) => globalThis.document.createComment(data2);
var createDocumentFragment = () => globalThis.document.createDocumentFragment();
var insertBefore = (parent, node, reference) => parent.insertBefore(node, reference);
var moveBefore = SUPPORTS_MOVE_BEFORE ? (parent, node, reference) => parent.moveBefore(node, reference) : insertBefore;
var removeChild = (parent, child2) => parent.removeChild(child2);
var getAttribute = (node, name2) => node.getAttribute(name2);
var setAttribute = (node, name2, value) => node.setAttribute(name2, value);
var removeAttribute = (node, name2) => node.removeAttribute(name2);
var addEventListener = (node, name2, handler, options) => node.addEventListener(name2, handler, options);
var removeEventListener = (node, name2, handler) => node.removeEventListener(name2, handler);
var setInnerHtml = (node, innerHtml) => node.innerHTML = innerHtml;
var setData = (node, data2) => node.data = data2;
var meta = Symbol("lustre");

class MetadataNode {
  constructor(kind, parent, node, key) {
    this.kind = kind;
    this.key = key;
    this.parent = parent;
    this.children = [];
    this.node = node;
    this.endNode = null;
    this.handlers = new Map;
    this.throttles = new Map;
    this.debouncers = new Map;
  }
  get isVirtual() {
    return this.kind === fragment_kind || this.kind === map_kind;
  }
  get parentNode() {
    return this.isVirtual ? this.node.parentNode : this.node;
  }
}
var insertMetadataChild = (kind, parent, node, index4, key) => {
  const child2 = new MetadataNode(kind, parent, node, key);
  node[meta] = child2;
  parent?.children.splice(index4, 0, child2);
  return child2;
};
var getPath = (node) => {
  let path = "";
  for (let current = node[meta];current.parent; current = current.parent) {
    const separator = current.parent && current.parent.kind === map_kind ? separator_subtree : separator_element;
    if (current.key) {
      path = `${separator}${current.key}${path}`;
    } else {
      const index4 = current.parent.children.indexOf(current);
      path = `${separator}${index4}${path}`;
    }
  }
  return path.slice(1);
};

class Reconciler {
  #root = null;
  #decodeEvent;
  #dispatch;
  #debug = false;
  constructor(root2, decodeEvent, dispatch2, { debug = false } = {}) {
    this.#root = root2;
    this.#decodeEvent = decodeEvent;
    this.#dispatch = dispatch2;
    this.#debug = debug;
  }
  mount(vdom) {
    insertMetadataChild(element_kind, null, this.#root, 0, null);
    this.#insertChild(this.#root, null, this.#root[meta], 0, vdom);
  }
  push(patch, memos2 = null) {
    this.#memos = memos2;
    this.#stack.push({ node: this.#root[meta], patch });
    this.#reconcile();
  }
  #memos;
  #stack = [];
  #reconcile() {
    const stack = this.#stack;
    while (stack.length) {
      const { node, patch } = stack.pop();
      const { children: childNodes } = node;
      const { changes, removed, children: childPatches } = patch;
      iterate(changes, (change) => this.#patch(node, change));
      if (removed) {
        this.#removeChildren(node, childNodes.length - removed, removed);
      }
      iterate(childPatches, (childPatch) => {
        const child2 = childNodes[childPatch.index | 0];
        this.#stack.push({ node: child2, patch: childPatch });
      });
    }
  }
  #patch(node, change) {
    switch (change.kind) {
      case replace_text_kind:
        this.#replaceText(node, change);
        break;
      case replace_inner_html_kind:
        this.#replaceInnerHtml(node, change);
        break;
      case update_kind:
        this.#update(node, change);
        break;
      case move_kind:
        this.#move(node, change);
        break;
      case remove_kind:
        this.#remove(node, change);
        break;
      case replace_kind:
        this.#replace(node, change);
        break;
      case insert_kind:
        this.#insert(node, change);
        break;
    }
  }
  #insert(parent, { children, before }) {
    const fragment3 = createDocumentFragment();
    const beforeEl = this.#getReference(parent, before);
    this.#insertChildren(fragment3, null, parent, before | 0, children);
    insertBefore(parent.parentNode, fragment3, beforeEl);
  }
  #replace(parent, { index: index4, with: child2 }) {
    this.#removeChildren(parent, index4 | 0, 1);
    const beforeEl = this.#getReference(parent, index4);
    this.#insertChild(parent.parentNode, beforeEl, parent, index4 | 0, child2);
  }
  #getReference(node, index4) {
    index4 = index4 | 0;
    const { children } = node;
    const childCount = children.length;
    if (index4 < childCount)
      return children[index4].node;
    if (node.endNode)
      return node.endNode;
    if (!node.isVirtual)
      return null;
    while (node.isVirtual && node.children.length) {
      if (node.endNode)
        return node.endNode.nextSibling;
      node = node.children[node.children.length - 1];
    }
    return node.node.nextSibling;
  }
  #move(parent, { key, before }) {
    before = before | 0;
    const { children, parentNode } = parent;
    const beforeEl = children[before].node;
    let prev = children[before];
    for (let i = before + 1;i < children.length; ++i) {
      const next = children[i];
      children[i] = prev;
      prev = next;
      if (next.key === key) {
        children[before] = next;
        break;
      }
    }
    this.#moveChild(parentNode, prev, beforeEl);
  }
  #moveChildren(domParent, children, beforeEl) {
    for (let i = 0;i < children.length; ++i) {
      this.#moveChild(domParent, children[i], beforeEl);
    }
  }
  #moveChild(domParent, child2, beforeEl) {
    moveBefore(domParent, child2.node, beforeEl);
    if (child2.isVirtual) {
      this.#moveChildren(domParent, child2.children, beforeEl);
    }
    if (child2.endNode) {
      moveBefore(domParent, child2.endNode, beforeEl);
    }
  }
  #remove(parent, { index: index4 }) {
    this.#removeChildren(parent, index4, 1);
  }
  #removeChildren(parent, index4, count) {
    const { children, parentNode } = parent;
    const deleted = children.splice(index4, count);
    for (let i = 0;i < deleted.length; ++i) {
      const child2 = deleted[i];
      const { node, endNode, isVirtual, children: nestedChildren } = child2;
      removeChild(parentNode, node);
      if (endNode) {
        removeChild(parentNode, endNode);
      }
      this.#removeDebouncers(child2);
      if (isVirtual) {
        deleted.push(...nestedChildren);
      }
    }
  }
  #removeDebouncers(node) {
    const { debouncers, children } = node;
    for (const { timeout } of debouncers.values()) {
      if (timeout) {
        clearTimeout2(timeout);
      }
    }
    debouncers.clear();
    iterate(children, (child2) => this.#removeDebouncers(child2));
  }
  #update({ node, handlers, throttles, debouncers }, { added, removed }) {
    iterate(removed, ({ name: name2 }) => {
      if (handlers.delete(name2)) {
        removeEventListener(node, name2, handleEvent);
        this.#updateDebounceThrottle(throttles, name2, 0);
        this.#updateDebounceThrottle(debouncers, name2, 0);
      } else {
        removeAttribute(node, name2);
        SYNCED_ATTRIBUTES[name2]?.removed?.(node, name2);
      }
    });
    iterate(added, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #replaceText({ node }, { content }) {
    setData(node, content ?? "");
  }
  #replaceInnerHtml({ node }, { inner_html }) {
    setInnerHtml(node, inner_html ?? "");
  }
  #insertChildren(domParent, beforeEl, metaParent, index4, children) {
    iterate(children, (child2) => this.#insertChild(domParent, beforeEl, metaParent, index4++, child2));
  }
  #insertChild(domParent, beforeEl, metaParent, index4, vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = this.#createElement(metaParent, index4, vnode);
        this.#insertChildren(node, null, node[meta], 0, vnode.children);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case text_kind: {
        const node = this.#createTextNode(metaParent, index4, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case fragment_kind: {
        const marker = "lustre:fragment";
        const head = this.#createHead(marker, metaParent, index4, vnode);
        insertBefore(domParent, head, beforeEl);
        this.#insertChildren(domParent, beforeEl, head[meta], 0, vnode.children);
        if (this.#debug) {
          head[meta].endNode = createComment(` /${marker} `);
          insertBefore(domParent, head[meta].endNode, beforeEl);
        }
        break;
      }
      case unsafe_inner_html_kind: {
        const node = this.#createElement(metaParent, index4, vnode);
        this.#replaceInnerHtml({ node }, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case map_kind: {
        const head = this.#createHead("lustre:map", metaParent, index4, vnode);
        insertBefore(domParent, head, beforeEl);
        this.#insertChild(domParent, beforeEl, head[meta], 0, vnode.child);
        break;
      }
      case memo_kind: {
        const child2 = this.#memos?.get(vnode.view) ?? vnode.view();
        this.#insertChild(domParent, beforeEl, metaParent, index4, child2);
        break;
      }
    }
  }
  #createElement(parent, index4, { kind, key, tag, namespace, attributes }) {
    const node = createElementNS(namespace || NAMESPACE_HTML, tag);
    insertMetadataChild(kind, parent, node, index4, key);
    if (this.#debug && key) {
      setAttribute(node, "data-lustre-key", key);
    }
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
    return node;
  }
  #createTextNode(parent, index4, { kind, key, content }) {
    const node = createTextNode(content ?? "");
    insertMetadataChild(kind, parent, node, index4, key);
    return node;
  }
  #createHead(marker, parent, index4, { kind, key }) {
    const node = this.#debug ? createComment(markerComment(marker, key)) : createTextNode("");
    insertMetadataChild(kind, parent, node, index4, key);
    return node;
  }
  #createAttribute(node, attribute3) {
    const { debouncers, handlers, throttles } = node[meta];
    const {
      kind,
      name: name2,
      value,
      prevent_default: prevent,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute3;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value ?? "";
        if (name2 === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        } else if (name2 === "virtual:defaultChecked") {
          node.defaultChecked = true;
          return;
        } else if (name2 === "virtual:defaultSelected") {
          node.defaultSelected = true;
          return;
        }
        if (valueOrDefault !== getAttribute(node, name2)) {
          setAttribute(node, name2, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name2]?.added?.(node, valueOrDefault);
        break;
      }
      case property_kind:
        node[name2] = value;
        break;
      case event_kind: {
        if (handlers.has(name2)) {
          removeEventListener(node, name2, handleEvent);
        }
        const passive = prevent.kind === never_kind;
        addEventListener(node, name2, handleEvent, { passive });
        this.#updateDebounceThrottle(throttles, name2, throttleDelay);
        this.#updateDebounceThrottle(debouncers, name2, debounceDelay);
        handlers.set(name2, (event4) => this.#handleEvent(attribute3, event4));
        break;
      }
    }
  }
  #updateDebounceThrottle(map7, name2, delay) {
    const debounceOrThrottle = map7.get(name2);
    if (delay > 0) {
      if (debounceOrThrottle) {
        debounceOrThrottle.delay = delay;
      } else {
        map7.set(name2, { delay });
      }
    } else if (debounceOrThrottle) {
      const { timeout } = debounceOrThrottle;
      if (timeout) {
        clearTimeout2(timeout);
      }
      map7.delete(name2);
    }
  }
  #handleEvent(attribute3, event4) {
    const { currentTarget, type } = event4;
    const { debouncers, throttles } = currentTarget[meta];
    const path = getPath(currentTarget);
    const {
      prevent_default: prevent,
      stop_propagation: stop,
      include
    } = attribute3;
    if (prevent.kind === always_kind)
      event4.preventDefault();
    if (stop.kind === always_kind)
      event4.stopPropagation();
    if (type === "submit") {
      event4.detail ??= {};
      event4.detail.formData = [
        ...new FormData(event4.target, event4.submitter).entries()
      ];
    }
    const data2 = this.#decodeEvent(event4, path, type, include);
    const throttle = throttles.get(type);
    if (throttle) {
      const now = Date.now();
      const last = throttle.last || 0;
      if (now > last + throttle.delay) {
        throttle.last = now;
        throttle.lastEvent = event4;
        this.#dispatch(event4, data2);
      }
    }
    const debounce = debouncers.get(type);
    if (debounce) {
      clearTimeout2(debounce.timeout);
      debounce.timeout = setTimeout2(() => {
        if (event4 === throttles.get(type)?.lastEvent)
          return;
        this.#dispatch(event4, data2);
      }, debounce.delay);
    }
    if (!throttle && !debounce) {
      this.#dispatch(event4, data2);
    }
  }
}
var markerComment = (marker, key) => {
  if (key) {
    return ` ${marker} key="${escape(key)}" `;
  } else {
    return ` ${marker} `;
  }
};
var handleEvent = (event4) => {
  const { currentTarget, type } = event4;
  const handler = currentTarget[meta].handlers.get(type);
  handler(event4);
};
var syncedBooleanAttribute = (name2) => {
  return {
    added(node) {
      node[name2] = true;
    },
    removed(node) {
      node[name2] = false;
    }
  };
};
var syncedAttribute = (name2) => {
  return {
    added(node, value) {
      node[name2] = value;
    }
  };
};
var SYNCED_ATTRIBUTES = {
  checked: syncedBooleanAttribute("checked"),
  selected: syncedBooleanAttribute("selected"),
  value: syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => {
        node.focus?.();
      });
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/element/keyed.mjs
function do_extract_keyed_children(loop$key_children_pairs, loop$keyed_children, loop$children) {
  while (true) {
    let key_children_pairs = loop$key_children_pairs;
    let keyed_children = loop$keyed_children;
    let children = loop$children;
    if (key_children_pairs instanceof Empty) {
      return [keyed_children, reverse(children)];
    } else {
      let rest = key_children_pairs.tail;
      let key = key_children_pairs.head[0];
      let element$1 = key_children_pairs.head[1];
      let keyed_element = to_keyed(key, element$1);
      let _block;
      if (key === "") {
        _block = keyed_children;
      } else {
        _block = insert2(keyed_children, key, keyed_element);
      }
      let keyed_children$1 = _block;
      let children$1 = prepend(keyed_element, children);
      loop$key_children_pairs = rest;
      loop$keyed_children = keyed_children$1;
      loop$children = children$1;
    }
  }
}
function extract_keyed_children(children) {
  return do_extract_keyed_children(children, empty2(), empty_list);
}
function element3(tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children;
  let children$1;
  keyed_children = $[0];
  children$1 = $[1];
  return element("", "", tag, attributes, children$1, keyed_children, false, is_void_html_element(tag, ""));
}
function namespaced2(namespace, tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children;
  let children$1;
  keyed_children = $[0];
  children$1 = $[1];
  return element("", namespace, tag, attributes, children$1, keyed_children, false, is_void_html_element(tag, namespace));
}
function fragment3(children) {
  let $ = extract_keyed_children(children);
  let keyed_children;
  let children$1;
  keyed_children = $[0];
  children$1 = $[1];
  return fragment("", children$1, keyed_children);
}

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root2) => {
  const rootMeta = insertMetadataChild(element_kind, null, root2, 0, null);
  for (let child2 = root2.firstChild;child2; child2 = child2.nextSibling) {
    const result = virtualiseChild(rootMeta, root2, child2, 0);
    if (result)
      return result.vnode;
  }
  const placeholder = globalThis.document.createTextNode("");
  insertMetadataChild(text_kind, rootMeta, placeholder, 0, null);
  root2.insertBefore(placeholder, root2.firstChild);
  return none2();
};
var virtualiseChild = (meta2, domParent, child2, index4) => {
  if (child2.nodeType === COMMENT_NODE) {
    const data2 = child2.data.trim();
    if (data2.startsWith("lustre:fragment")) {
      return virtualiseFragment(meta2, domParent, child2, index4);
    }
    if (data2.startsWith("lustre:map")) {
      return virtualiseMap(meta2, domParent, child2, index4);
    }
    if (data2.startsWith("lustre:memo")) {
      return virtualiseMemo(meta2, domParent, child2, index4);
    }
    return null;
  }
  if (child2.nodeType === ELEMENT_NODE) {
    return virtualiseElement(meta2, child2, index4);
  }
  if (child2.nodeType === TEXT_NODE) {
    return virtualiseText(meta2, child2, index4);
  }
  return null;
};
var virtualiseElement = (metaParent, node, index4) => {
  const key = node.getAttribute("data-lustre-key") ?? "";
  if (key) {
    node.removeAttribute("data-lustre-key");
  }
  const meta2 = insertMetadataChild(element_kind, metaParent, node, index4, key);
  const tag = node.localName;
  const namespace = node.namespaceURI;
  const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
  if (isHtmlElement && INPUT_ELEMENTS.includes(tag)) {
    virtualiseInputEvents(tag, node);
  }
  const attributes = virtualiseAttributes(node);
  const children = [];
  for (let childNode = node.firstChild;childNode; ) {
    const child2 = virtualiseChild(meta2, node, childNode, children.length);
    if (child2) {
      children.push([child2.key, child2.vnode]);
      childNode = child2.next;
    } else {
      childNode = childNode.nextSibling;
    }
  }
  const vnode = isHtmlElement ? element3(tag, attributes, toList3(children)) : namespaced2(namespace, tag, attributes, toList3(children));
  return childResult(key, vnode, node.nextSibling);
};
var virtualiseText = (meta2, node, index4) => {
  insertMetadataChild(text_kind, meta2, node, index4, null);
  return childResult("", text2(node.data), node.nextSibling);
};
var virtualiseFragment = (metaParent, domParent, node, index4) => {
  const key = parseKey(node.data);
  const meta2 = insertMetadataChild(fragment_kind, metaParent, node, index4, key);
  const children = [];
  node = node.nextSibling;
  while (node && (node.nodeType !== COMMENT_NODE || node.data.trim() !== "/lustre:fragment")) {
    const child2 = virtualiseChild(meta2, domParent, node, children.length);
    if (child2) {
      children.push([child2.key, child2.vnode]);
      node = child2.next;
    } else {
      node = node.nextSibling;
    }
  }
  meta2.endNode = node;
  const vnode = fragment3(toList3(children));
  return childResult(key, vnode, node?.nextSibling);
};
var virtualiseMap = (metaParent, domParent, node, index4) => {
  const key = parseKey(node.data);
  const meta2 = insertMetadataChild(map_kind, metaParent, node, index4, key);
  const child2 = virtualiseNextChild(meta2, domParent, node, 0);
  if (!child2)
    return null;
  const vnode = map6(child2.vnode, (x) => x);
  return childResult(key, vnode, child2.next);
};
var virtualiseMemo = (meta2, domParent, node, index4) => {
  const key = parseKey(node.data);
  const child2 = virtualiseNextChild(meta2, domParent, node, index4);
  if (!child2)
    return null;
  domParent.removeChild(node);
  const vnode = memo2(toList3([ref({})]), () => child2.vnode);
  return childResult(key, vnode, child2.next);
};
var virtualiseNextChild = (meta2, domParent, node, index4) => {
  while (true) {
    node = node.nextSibling;
    if (!node)
      return null;
    const child2 = virtualiseChild(meta2, domParent, node, index4);
    if (child2)
      return child2;
  }
};
var childResult = (key, vnode, next) => {
  return { key, vnode, next };
};
var virtualiseAttributes = (node) => {
  const attributes = [];
  for (let i = 0;i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    if (attr.name !== "xmlns") {
      attributes.push(attribute2(attr.localName, attr.value));
    }
  }
  return toList3(attributes);
};
var INPUT_ELEMENTS = ["input", "select", "textarea"];
var virtualiseInputEvents = (tag, node) => {
  const value = node.value;
  const checked = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked)
    return;
  if (tag === "input" && node.type === "radio" && !checked)
    return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value)
    return;
  queueMicrotask(() => {
    node.value = value;
    node.checked = checked;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (globalThis.document.activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var parseKey = (data2) => {
  const keyMatch = data2.match(/key="([^"]*)"/);
  if (!keyMatch)
    return "";
  return unescapeKey(keyMatch[1]);
};
var unescapeKey = (key) => {
  return key.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'");
};
var toList3 = (arr) => arr.reduceRight((xs, x) => List$NonEmpty(x, xs), empty_list);

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!globalThis.document;
class Runtime {
  constructor(root2, [model, effects], view, update2, options) {
    this.root = root2;
    this.#model = model;
    this.#view = view;
    this.#update = update2;
    this.root.addEventListener("context-request", (event4) => {
      if (!(event4.context && event4.callback))
        return;
      if (!this.#contexts.has(event4.context))
        return;
      event4.stopImmediatePropagation();
      const context = this.#contexts.get(event4.context);
      if (event4.subscribe) {
        const unsubscribe = () => {
          context.subscribers = context.subscribers.filter((subscriber) => subscriber !== event4.callback);
        };
        context.subscribers.push([event4.callback, unsubscribe]);
        event4.callback(context.value, unsubscribe);
      } else {
        event4.callback(context.value);
      }
    });
    const decodeEvent = (event4, path, name2) => decode2(this.#cache, path, name2, event4);
    const dispatch2 = (event4, data2) => {
      const [cache, result] = dispatch(this.#cache, data2);
      this.#cache = cache;
      if (Result$isOk(result)) {
        const handler = Result$Ok$0(result);
        if (handler.stop_propagation)
          event4.stopPropagation();
        if (handler.prevent_default)
          event4.preventDefault();
        this.dispatch(handler.message, false);
      }
    };
    this.#reconciler = new Reconciler(this.root, decodeEvent, dispatch2, options);
    this.#vdom = virtualise(this.root);
    this.#cache = new$5();
    this.#handleEffects(effects);
    this.#render();
  }
  root = null;
  dispatch(msg, shouldFlush = false) {
    if (this.#shouldQueue) {
      this.#queue.push(msg);
    } else {
      const [model, effects] = this.#update(this.#model, msg);
      this.#model = model;
      this.#tick(effects, shouldFlush);
    }
  }
  emit(event4, data2) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(new CustomEvent(event4, {
      detail: data2,
      bubbles: true,
      composed: true
    }));
  }
  provide(key, value) {
    if (!this.#contexts.has(key)) {
      this.#contexts.set(key, { value, subscribers: [] });
    } else {
      const context = this.#contexts.get(key);
      if (isEqual2(context.value, value)) {
        return;
      }
      context.value = value;
      for (let i = context.subscribers.length - 1;i >= 0; i--) {
        const [subscriber, unsubscribe] = context.subscribers[i];
        if (!subscriber) {
          context.subscribers.splice(i, 1);
          continue;
        }
        subscriber(value, unsubscribe);
      }
    }
  }
  #model;
  #view;
  #update;
  #vdom;
  #cache;
  #reconciler;
  #contexts = new Map;
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #actions = {
    dispatch: (msg) => this.dispatch(msg),
    emit: (event4, data2) => this.emit(event4, data2),
    select: () => {},
    root: () => this.root,
    provide: (key, value) => this.provide(key, value)
  };
  #tick(effects, shouldFlush = false) {
    this.#handleEffects(effects);
    if (!this.#renderTimer) {
      if (shouldFlush) {
        this.#renderTimer = "sync";
        queueMicrotask(() => this.#render());
      } else {
        this.#renderTimer = window.requestAnimationFrame(() => this.#render());
      }
    }
  }
  #handleEffects(effects) {
    this.#shouldQueue = true;
    while (true) {
      iterate(effects.synchronous, (effect) => effect(this.#actions));
      this.#beforePaint = append4(this.#beforePaint, effects.before_paint);
      this.#afterPaint = append4(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length)
        break;
      const msg = this.#queue.shift();
      [this.#model, effects] = this.#update(this.#model, msg);
    }
    this.#shouldQueue = false;
  }
  #render() {
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, cache } = diff(this.#cache, this.#vdom, next);
    this.#cache = cache;
    this.#vdom = next;
    this.#reconciler.push(patch, memos(cache));
    if (List$isNonEmpty(this.#beforePaint)) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => {
        this.#tick(effects, true);
      });
    }
    if (List$isNonEmpty(this.#afterPaint)) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      window.requestAnimationFrame(() => this.#tick(effects, true));
    }
  }
}
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
var copiedStyleSheets = new WeakMap;
async function adoptStylesheets(shadowRoot) {
  const pendingParentStylesheets = [];
  for (const node of globalThis.document.querySelectorAll("link[rel=stylesheet], style")) {
    if (node.sheet)
      continue;
    pendingParentStylesheets.push(new Promise((resolve, reject) => {
      node.addEventListener("load", resolve);
      node.addEventListener("error", reject);
    }));
  }
  await Promise.allSettled(pendingParentStylesheets);
  if (!shadowRoot.host.isConnected) {
    return [];
  }
  shadowRoot.adoptedStyleSheets = shadowRoot.host.getRootNode().adoptedStyleSheets;
  const pending = [];
  for (const sheet of globalThis.document.styleSheets) {
    try {
      shadowRoot.adoptedStyleSheets.push(sheet);
    } catch {
      try {
        let copiedSheet = copiedStyleSheets.get(sheet);
        if (!copiedSheet) {
          copiedSheet = new CSSStyleSheet;
          for (const rule of sheet.cssRules) {
            copiedSheet.insertRule(rule.cssText, copiedSheet.cssRules.length);
          }
          copiedStyleSheets.set(sheet, copiedSheet);
        }
        shadowRoot.adoptedStyleSheets.push(copiedSheet);
      } catch {
        const node = sheet.ownerNode.cloneNode();
        shadowRoot.prepend(node);
        pending.push(node);
      }
    }
  }
  return pending;
}

class ContextRequestEvent extends Event {
  constructor(context, callback, subscribe) {
    super("context-request", { bubbles: true, composed: true });
    this.context = context;
    this.callback = callback;
    this.subscribe = subscribe;
  }
}

// build/dev/javascript/lustre/lustre/runtime/client/component.ffi.mjs
var make_component = ({ init, update: update2, view, config: config2 }, name2) => {
  if (!is_browser())
    return Result$Error(Error$NotABrowser());
  if (!name2.includes("-"))
    return Result$Error(Error$BadComponentName(name2));
  if (globalThis.customElements.get(name2)) {
    return Result$Error(Error$ComponentAlreadyRegistered(name2));
  }
  const attributes = new Map;
  const observedAttributes = [];
  iterate(config2.attributes, ([name3, decoder]) => {
    if (attributes.has(name3))
      return;
    attributes.set(name3, decoder);
    observedAttributes.push(name3);
  });
  const [model, effects] = init(undefined);
  const component = class Component extends globalThis.HTMLElement {
    static get observedAttributes() {
      return observedAttributes;
    }
    static formAssociated = config2.is_form_associated;
    #runtime;
    #adoptedStyleNodes = [];
    #contextSubscriptions = new Map;
    constructor() {
      super();
      this.internals = this.attachInternals();
      if (!this.internals.shadowRoot) {
        this.attachShadow({
          mode: config2.open_shadow_root ? "open" : "closed",
          delegatesFocus: config2.delegates_focus
        });
      }
      if (config2.adopt_styles) {
        this.#adoptStyleSheets();
      }
      this.#runtime = new Runtime(this.internals.shadowRoot, [model, effects], view, update2);
    }
    connectedCallback() {
      this.#requestContexts();
      if (Option$isSome(config2.on_connect)) {
        this.dispatch(Option$Some$0(config2.on_connect));
      }
    }
    adoptedCallback() {
      if (config2.adopt_styles) {
        this.#adoptStyleSheets();
      }
      this.#unsubscribeContexts();
      if (Option$isSome(config2.on_adopt)) {
        this.dispatch(Option$Some$0(config2.on_adopt));
      }
    }
    disconnectedCallback() {
      this.#unsubscribeContexts();
      if (Option$isSome(config2.on_disconnect)) {
        this.dispatch(Option$Some$0(config2.on_disconnect));
      }
    }
    attributeChangedCallback(name3, _, value) {
      const decoded = attributes.get(name3)(value ?? "");
      if (Result$isOk(decoded)) {
        this.dispatch(Result$Ok$0(decoded), true);
      }
    }
    formResetCallback() {
      if (Option$isSome(config2.on_form_reset)) {
        this.dispatch(Option$Some$0(config2.on_form_reset));
      }
    }
    formStateRestoreCallback(state, reason) {
      switch (reason) {
        case "restore":
          if (Option$isSome(config2.on_form_restore)) {
            this.dispatch(Option$Some$0(config2.on_form_restore)(state));
          }
          break;
        case "autocomplete":
          if (Option$isSome(config2.on_form_autofill)) {
            this.dispatch(Option$Some$0(config2.on_form_autofill)(state));
          }
          break;
      }
    }
    send(message) {
      if (Message$isEffectDispatchedMessage(message)) {
        this.dispatch(message.message, false);
      } else if (Message$isEffectEmitEvent(message)) {
        this.emit(message.name, message.data);
      } else if (Message$isSystemRequestedShutdown(message)) {}
    }
    dispatch(msg, shouldFlush = false) {
      this.#runtime.dispatch(msg, shouldFlush);
    }
    emit(event4, data2) {
      this.#runtime.emit(event4, data2);
    }
    provide(key, value) {
      this.#runtime.provide(key, value);
    }
    #requestContexts() {
      const requested = new Set;
      iterate(config2.contexts, ([key, decoder]) => {
        if (!key)
          return;
        if (requested.has(key))
          return;
        this.dispatchEvent(new ContextRequestEvent(key, (value, unsubscribe) => {
          const previousUnsubscribe = this.#contextSubscriptions.get(key);
          if (previousUnsubscribe !== unsubscribe) {
            previousUnsubscribe?.();
          }
          const decoded = run(value, decoder);
          this.#contextSubscriptions.set(key, unsubscribe);
          if (Result$isOk(decoded)) {
            this.dispatch(Result$Ok$0(decoded), true);
          }
        }, true));
        requested.add(key);
      });
    }
    #unsubscribeContexts() {
      for (const [_, unsubscribe] of this.#contextSubscriptions) {
        unsubscribe?.();
      }
      this.#contextSubscriptions.clear();
    }
    async#adoptStyleSheets() {
      while (this.#adoptedStyleNodes.length) {
        this.#adoptedStyleNodes.pop().remove();
        this.shadowRoot.firstChild.remove();
      }
      this.#adoptedStyleNodes = await adoptStylesheets(this.internals.shadowRoot);
    }
  };
  iterate(config2.properties, ([name3, decoder]) => {
    if (Object.hasOwn(component.prototype, name3)) {
      return;
    }
    Object.defineProperty(component.prototype, name3, {
      get() {
        return this[`_${name3}`];
      },
      set(value) {
        this[`_${name3}`] = value;
        const decoded = run(value, decoder);
        if (Result$isOk(decoded)) {
          this.dispatch(Result$Ok$0(decoded), true);
        }
      }
    });
  });
  globalThis.customElements.define(name2, component);
  return Result$Ok(undefined);
};
var set_form_value = (root2, value) => {
  if (!is_browser())
    return;
  if (root2 instanceof ShadowRoot) {
    root2.host.internals.setFormValue(value);
  }
};
var clear_form_value = (root2) => {
  if (!is_browser())
    return;
  if (root2 instanceof ShadowRoot) {
    root2.host.internals.setFormValue(undefined);
  }
};
var set_pseudo_state = (root2, value) => {
  if (!is_browser())
    return;
  if (root2 instanceof ShadowRoot) {
    root2.host.internals.states.add(value);
  }
};
var remove_pseudo_state = (root2, value) => {
  if (!is_browser())
    return;
  if (root2 instanceof ShadowRoot) {
    root2.host.internals.states.delete(value);
  }
};

// build/dev/javascript/lustre/lustre/component.mjs
function on_attribute_change(name2, decoder) {
  return new Option((config2) => {
    let attributes = prepend([name2, decoder], config2.attributes);
    return new Config2(config2.open_shadow_root, config2.adopt_styles, config2.delegates_focus, attributes, config2.properties, config2.contexts, config2.is_form_associated, config2.on_form_autofill, config2.on_form_reset, config2.on_form_restore, config2.on_connect, config2.on_adopt, config2.on_disconnect);
  });
}
function on_property_change(name2, decoder) {
  return new Option((config2) => {
    let properties = prepend([name2, decoder], config2.properties);
    return new Config2(config2.open_shadow_root, config2.adopt_styles, config2.delegates_focus, config2.attributes, properties, config2.contexts, config2.is_form_associated, config2.on_form_autofill, config2.on_form_reset, config2.on_form_restore, config2.on_connect, config2.on_adopt, config2.on_disconnect);
  });
}
function on_context_change(key, decoder) {
  return new Option((config2) => {
    let contexts = prepend([key, decoder], config2.contexts);
    return new Config2(config2.open_shadow_root, config2.adopt_styles, config2.delegates_focus, config2.attributes, config2.properties, contexts, config2.is_form_associated, config2.on_form_autofill, config2.on_form_reset, config2.on_form_restore, config2.on_connect, config2.on_adopt, config2.on_disconnect);
  });
}
function form_associated() {
  return new Option((config2) => {
    return new Config2(config2.open_shadow_root, config2.adopt_styles, config2.delegates_focus, config2.attributes, config2.properties, config2.contexts, true, config2.on_form_autofill, config2.on_form_reset, config2.on_form_restore, config2.on_connect, config2.on_adopt, config2.on_disconnect);
  });
}
function adopt_styles(adopt) {
  return new Option((config2) => {
    return new Config2(config2.open_shadow_root, adopt, config2.delegates_focus, config2.attributes, config2.properties, config2.contexts, config2.is_form_associated, config2.on_form_autofill, config2.on_form_reset, config2.on_form_restore, config2.on_connect, config2.on_adopt, config2.on_disconnect);
  });
}
function default_slot(attributes, fallback) {
  return slot(attributes, fallback);
}
function named_slot(name2, attributes, fallback) {
  return slot(prepend(attribute2("name", name2), attributes), fallback);
}
function set_form_value2(value) {
  return before_paint((_, root2) => {
    return set_form_value(root2, value);
  });
}
function clear_form_value2() {
  return before_paint((_, root2) => {
    return clear_form_value(root2);
  });
}
function set_pseudo_state2(value) {
  return before_paint((_, root2) => {
    return set_pseudo_state(root2, value);
  });
}
function remove_pseudo_state2(value) {
  return before_paint((_, root2) => {
    return remove_pseudo_state(root2, value);
  });
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
class Spa {
  #runtime;
  constructor(root2, [init, effects], update2, view) {
    this.#runtime = new Runtime(root2, [init, effects], view, update2);
  }
  send(message) {
    if (Message$isEffectDispatchedMessage(message)) {
      this.dispatch(message.message, false);
    } else if (Message$isEffectEmitEvent(message)) {
      this.emit(message.name, message.data);
    } else if (Message$isSystemRequestedShutdown(message)) {}
  }
  dispatch(msg) {
    this.#runtime.dispatch(msg);
  }
  emit(event4, data2) {
    this.#runtime.emit(event4, data2);
  }
}
var start = ({ init, update: update2, view }, selector, flags) => {
  if (!is_browser())
    return Result$Error(Error$NotABrowser());
  const root2 = selector instanceof HTMLElement ? selector : globalThis.document.querySelector(selector);
  if (!root2)
    return Result$Error(Error$ElementNotFound(selector));
  return Result$Ok(new Spa(root2, init(flags), update2, view));
};

// build/dev/javascript/lustre/lustre/runtime/server/runtime.ffi.mjs
class Runtime2 {
  #model;
  #update;
  #view;
  #config;
  #vdom;
  #cache;
  #providers = make();
  #callbacks = /* @__PURE__ */ new Set;
  constructor(_, init, update2, view, config2, start_arguments) {
    const [model, effects] = init(start_arguments);
    this.#model = model;
    this.#update = update2;
    this.#view = view;
    this.#config = config2;
    this.#vdom = this.#view(this.#model);
    this.#cache = from_node(this.#vdom);
    this.#handle_effect(effects);
  }
  send(msg) {
    if (Message$isClientDispatchedMessage(msg)) {
      const { message } = msg;
      const next = this.#handle_client_message(message);
      const diff2 = diff(this.#cache, this.#vdom, next);
      this.#vdom = next;
      this.#cache = diff2.cache;
      this.broadcast(reconcile(diff2.patch, memos(diff2.cache)));
    } else if (Message$isClientRegisteredCallback(msg)) {
      const { callback } = msg;
      this.#callbacks.add(callback);
      callback(mount(this.#config.open_shadow_root, this.#config.adopt_styles, keys(this.#config.attributes), keys(this.#config.properties), keys(this.#config.contexts), this.#providers, this.#vdom, memos(this.#cache)));
      if (Option$isSome(config.on_connect)) {
        this.#dispatch(Option$Some$0(config.on_connect));
      }
    } else if (Message$isClientDeregisteredCallback(msg)) {
      const { callback } = msg;
      this.#callbacks.delete(callback);
      if (Option$isSome(config.on_disconnect)) {
        this.#dispatch(Option$Some$0(config.on_disconnect));
      }
    } else if (Message$isEffectDispatchedMessage(msg)) {
      const { message } = msg;
      const [model, effect] = this.#update(this.#model, message);
      const next = this.#view(model);
      const diff2 = diff(this.#cache, this.#vdom, next);
      this.#handle_effect(effect);
      this.#model = model;
      this.#vdom = next;
      this.#cache = diff2.cache;
      this.broadcast(reconcile(diff2.patch, memos(diff2.cache)));
    } else if (Message$isEffectEmitEvent(msg)) {
      const { name: name2, data: data2 } = msg;
      this.broadcast(emit(name2, data2));
    } else if (Message$isEffectProvidedValue(msg)) {
      const { key, value } = msg;
      const existing = get(this.#providers, key);
      if (Result$isOk(existing) && isEqual2(Result$Ok$0(existing), value)) {
        return;
      }
      this.#providers = insert(this.#providers, key, value);
      this.broadcast(provide2(key, value));
    } else if (Message$isSystemRequestedShutdown(msg)) {
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#config = null;
      this.#vdom = null;
      this.#cache = null;
      this.#providers = null;
      this.#callbacks.clear();
    }
  }
  broadcast(msg) {
    for (const callback of this.#callbacks) {
      callback(msg);
    }
  }
  #handle_client_message(msg) {
    if (ServerMessage$isBatch(msg)) {
      const { messages } = msg;
      let model = this.#model;
      let effect = none();
      for (let list4 = messages;List$NonEmpty$rest(list4); list4 = List$NonEmpty$rest(list4)) {
        const result = this.#handle_client_message(List$NonEmpty$first(list4));
        if (Result$isOk(result)) {
          model = Result$Ok$0(result)[0];
          effect = batch(toList2([effect, Result$Ok$0(result)[1]]));
          break;
        }
      }
      this.#handle_effect(effect);
      this.#model = model;
      return this.#view(model);
    } else if (ServerMessage$isAttributeChanged(msg)) {
      const { name: name2, value } = msg;
      const result = this.#handle_attribute_change(name2, value);
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      return this.#dispatch(Result$Ok$0(result));
    } else if (ServerMessage$isPropertyChanged(msg)) {
      const { name: name2, value } = msg;
      const result = this.#handle_properties_change(name2, value);
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      return this.#dispatch(Result$Ok$0(result));
    } else if (ServerMessage$isEventFired(msg)) {
      const { path, name: name2, event: event4 } = msg;
      const [cache, result] = handle(this.#cache, path, name2, event4);
      this.#cache = cache;
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      const { message } = Result$Ok$0(result);
      return this.#dispatch(message);
    } else if (ServerMessage$isContextProvided(msg)) {
      const { key, value } = msg;
      let result = get(this.#config.contexts, key);
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      result = run(value, Result$Ok$0(result));
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      return this.#dispatch(Result$Ok$0(result));
    }
  }
  #dispatch(msg) {
    const [model, effects] = this.#update(this.#model, msg);
    this.#handle_effect(effects);
    this.#model = model;
    return this.#view(this.#model);
  }
  #handle_attribute_change(name2, value) {
    const result = get(this.#config.attributes, name2);
    if (!Result$isOk(result)) {
      return result;
    }
    return Result$Ok$0(result)(value);
  }
  #handle_properties_change(name2, value) {
    const result = get(this.#config.properties, name2);
    if (!Result$isOk(result)) {
      return result;
    }
    return Result$Ok$0(result)(value);
  }
  #handle_effect(effect) {
    const dispatch2 = (message) => this.send(Message$EffectDispatchedMessage(message));
    const emit2 = (name2, data2) => this.send(Message$EffectEmitEvent(name2, data2));
    const select = () => {
      return;
    };
    const internals = () => {
      return;
    };
    const provide3 = (key, value) => this.send(Message$EffectProvidedValue(key, value));
    globalThis.queueMicrotask(() => {
      perform(effect, dispatch2, emit2, select, internals, provide3);
    });
  }
}

// build/dev/javascript/lustre/lustre.mjs
class BadComponentName extends CustomType {
  constructor(name2) {
    super();
    this.name = name2;
  }
}
var Error$BadComponentName = (name2) => new BadComponentName(name2);
class ComponentAlreadyRegistered extends CustomType {
  constructor(name2) {
    super();
    this.name = name2;
  }
}
var Error$ComponentAlreadyRegistered = (name2) => new ComponentAlreadyRegistered(name2);
class ElementNotFound extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
}
var Error$ElementNotFound = (selector) => new ElementNotFound(selector);
class NotABrowser extends CustomType {
}
var Error$NotABrowser = () => new NotABrowser;
function application(init, update2, view) {
  return new App(new None, init, update2, view, default_config);
}
function component(init, update2, view, options) {
  return new App(new None, init, update2, view, configure(options));
}
function start4(app, selector, arguments$) {
  return guard(!is_browser(), new Error(new NotABrowser), () => {
    return start(app, selector, arguments$);
  });
}
// build/dev/javascript/lustre_ui/lustre/ui/accordion/context.mjs
class ItemContext extends CustomType {
  constructor(name2, panel, open) {
    super();
    this.name = name2;
    this.panel = panel;
    this.open = open;
  }
}
function on_item_change(handler) {
  return on_context_change("accordion/item", field("name", string2, (name2) => {
    return field("panel", string2, (panel) => {
      return field("open", bool, (open) => {
        return success(handler(new ItemContext(name2, panel, open)));
      });
    });
  }));
}
function provide3(open) {
  return provide("accordion", object2(toList([
    [
      "open",
      (() => {
        let _pipe = open;
        let _pipe$1 = to_list2(_pipe);
        return array2(_pipe$1, string3);
      })()
    ]
  ])));
}
function provide_item(name2, panel, open) {
  return provide("accordion/item", object2(toList([
    ["name", string3(name2)],
    ["panel", string3(panel)],
    ["open", bool2(open)]
  ])));
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/element.ffi.mjs
function coerce(value) {
  return value;
}
function createHtmlElement(tag) {
  return document.createElement(tag);
}
function attribute3(element4, name2) {
  if (element4.hasAttribute(name2)) {
    return Result$Ok(element4.getAttribute(name2));
  } else {
    return Result$Error(undefined);
  }
}
function boundingClientRect(element4) {
  const rect = element4.getBoundingClientRect();
  return [rect.left, rect.top, rect.width, rect.height];
}
function closest(element4, selector) {
  const result = element4.closest(selector);
  if (result !== null) {
    return Result$Ok(result);
  } else {
    return Result$Error(undefined);
  }
}
function contains2(parent, child2) {
  return parent.contains(child2);
}
function host(element4) {
  const root2 = element4 instanceof ShadowRoot ? element4 : element4.getRootNode();
  if (root2 instanceof ShadowRoot) {
    return Result$Ok(root2.host);
  } else {
    return Result$Error(undefined);
  }
}
function is(element4, other) {
  return element4.isSameNode(other);
}
function isHtmlElement(node) {
  return node instanceof HTMLElement;
}
function matches2(element4, selector) {
  return element4.matches(selector);
}
function querySelector(element4, selector) {
  const result = element4.querySelector(selector);
  if (result !== null) {
    return Result$Ok(result);
  } else {
    return Result$Error(undefined);
  }
}
function querySelectorAll(element4, selector) {
  return List.fromArray(Array.from(element4.querySelectorAll(selector)));
}
function tag(element4) {
  return element4.tagName.toLowerCase();
}
function focus(element4) {
  element4.focus();
}
function setAttribute2(element4, key, value) {
  element4.setAttribute(key, value);
}
function removeAttribute2(element4, key) {
  element4.removeAttribute(key);
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/element.mjs
function decoder() {
  return new_primitive_decoder("HtmlElement", (value2) => {
    let $ = isHtmlElement(value2);
    if ($) {
      return new Ok(coerce(value2));
    } else {
      return new Error(createHtmlElement("div"));
    }
  });
}
function nil() {
  return createHtmlElement("div");
}
function focus2(element4) {
  return from2((_) => {
    return focus(element4);
  });
}

// build/dev/javascript/lustre_ui/lustre_ui/shortid.mjs
var digits = "0123456789";
var letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var alphabet = letters + digits;
var alphabet_size = 62;
var letters_size = 52;
function do_new(id2, length2) {
  return guard(length2 <= 0, id2, () => {
    let index4 = random(alphabet_size - 1);
    let character = slice(alphabet, index4, 1);
    return do_new(id2 + character, length2 - 1);
  });
}
function new$6(length2) {
  return guard(length2 <= 0, "", () => {
    let index4 = random(letters_size - 1);
    let character = slice(letters, index4, 1);
    return do_new("lustre-" + character, length2 - 1);
  });
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/web_component.ffi.mjs
function getComponentElement(shadowRoot) {
  return shadowRoot.host;
}
function addEventListener2(element4, name2, handler) {
  element4.addEventListener(name2, handler);
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/web_component.mjs
function tabbable(component2, enabled) {
  return setAttribute2(component2, "tabindex", (() => {
    if (enabled) {
      return "0";
    } else {
      return "-1";
    }
  })());
}
function ensure_id(component2) {
  let $ = attribute3(component2, "id");
  if ($ instanceof Ok) {
    let $1 = $[0];
    if ($1 === "") {
      return setAttribute2(component2, "id", new$6(6));
    } else {
      return;
    }
  } else {
    return setAttribute2(component2, "id", new$6(6));
  }
}
function role(component2, value2) {
  return setAttribute2(component2, "role", value2);
}
function aria_controls(component2, value2) {
  return setAttribute2(component2, "aria-controls", join(value2, " "));
}
function aria_describedby(component2, value2) {
  return setAttribute2(component2, "aria-describedby", join(value2, " "));
}
function aria_disabled(component2, value2) {
  return setAttribute2(component2, "aria-disabled", (() => {
    if (value2) {
      return "true";
    } else {
      return "false";
    }
  })());
}
function aria_expanded(component2, value2) {
  return setAttribute2(component2, "aria-expanded", (() => {
    if (value2) {
      return "true";
    } else {
      return "false";
    }
  })());
}
function aria_labelledby(component2, value2) {
  return setAttribute2(component2, "aria-labelledby", join(value2, " "));
}
function aria_level(component2, value2) {
  return setAttribute2(component2, "aria-level", to_string(value2));
}
function aria_orientation(component2, value2) {
  return setAttribute2(component2, "aria-orientation", value2);
}
function aria_pressed(component2, value2) {
  return setAttribute2(component2, "aria-pressed", (() => {
    if (value2) {
      return "true";
    } else {
      return "false";
    }
  })());
}
function aria_selected(component2, value2) {
  return setAttribute2(component2, "aria-selected", (() => {
    if (value2) {
      return "true";
    } else {
      return "false";
    }
  })());
}
function id2(component2, value2) {
  return setAttribute2(component2, "id", value2);
}
function tabindex(component2, value2) {
  return setAttribute2(component2, "tabindex", to_string(value2));
}
function before_paint2(run2) {
  return before_paint((dispatch2, shadow_root) => {
    let component2 = getComponentElement(shadow_root);
    return run2(dispatch2, shadow_root, component2);
  });
}
function after_paint2(run2) {
  return after_paint((dispatch2, shadow_root) => {
    let component2 = getComponentElement(shadow_root);
    return run2(dispatch2, shadow_root, component2);
  });
}
function toggle_psuedo_state(name2, on) {
  if (on) {
    return set_pseudo_state2(name2);
  } else {
    return remove_pseudo_state2(name2);
  }
}

// build/dev/javascript/lustre_ui/lustre/ui/accordion/heading.mjs
class Model extends CustomType {
  constructor(open) {
    super();
    this.open = open;
  }
}

class AccordionItemProvidedContext extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
var tag2 = "lustre-accordion-heading";
function element4(attributes, children) {
  return element2(tag2, attributes, children);
}
function view(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: block;
      }
      `),
    default_slot(toList([]), toList([]))
  ]));
}
function update2(_, message) {
  let context = message[0];
  let model = new Model(context.open);
  let _block;
  let $ = context.open;
  if ($) {
    _block = set_pseudo_state2("open");
  } else {
    _block = remove_pseudo_state2("open");
  }
  let effect = _block;
  return [model, effect];
}
function init(_) {
  let model = new Model(false);
  let effect = before_paint2((_2, _1, component2) => {
    role(component2, "heading");
    let $ = attribute3(component2, "aria-level");
    if ($ instanceof Ok) {
      let $1 = $[0];
      if ($1 === "") {
        return aria_level(component2, 3);
      } else {
        return;
      }
    } else {
      return aria_level(component2, 3);
    }
  });
  return [model, effect];
}
function register() {
  let component2 = component(init, update2, view, toList([
    adopt_styles(false),
    on_item_change((var0) => {
      return new AccordionItemProvidedContext(var0);
    })
  ]));
  return make_component(component2, tag2);
}

// build/dev/javascript/lustre/lustre/event.mjs
function emit2(event4, data2) {
  return event2(event4, data2);
}
function on(name2, handler) {
  return event(name2, map3(handler, (msg) => {
    return new Handler(false, false, msg);
  }), empty_list, never, never, 0, 0);
}
function advanced(name2, handler) {
  return event(name2, handler, empty_list, possible, possible, 0, 0);
}
function handler(message, prevent_default, stop_propagation) {
  return new Handler(prevent_default, stop_propagation, message);
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/event.ffi.mjs
function preventDefault(event4) {
  if (event4 instanceof Event) {
    event4.preventDefault();
  }
}

// build/dev/javascript/lustre_ui/lustre/ui/accordion/trigger.mjs
class Model2 extends CustomType {
}

class AccordionItemProvidedContext2 extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}

class UserActivatedTrigger extends CustomType {
}
var tag3 = "lustre-accordion-trigger";
function element5(attributes, children) {
  return element2(tag3, attributes, children);
}
function view2(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        cursor: default;
        display: inline;
        user-select: none;
      }
      `),
    default_slot(toList([]), toList([]))
  ]));
}
function emit_activate() {
  return emit2("accordion/trigger:activate", object2(toList([])));
}
function update3(model, message) {
  if (message instanceof AccordionItemProvidedContext2) {
    let context = message[0];
    let effect = batch(toList([
      before_paint2((_, _1, element6) => {
        aria_controls(element6, toList([context.panel]));
        return aria_expanded(element6, context.open);
      }),
      toggle_psuedo_state("open", context.open)
    ]));
    return [model, effect];
  } else {
    return [model, emit_activate()];
  }
}
function init2(_) {
  let model = new Model2;
  let effect = before_paint2((dispatch2, _2, component2) => {
    role(component2, "button");
    tabindex(component2, 0);
    addEventListener2(component2, "click", (_3) => {
      return dispatch2(new UserActivatedTrigger);
    });
    return addEventListener2(component2, "keydown", (event4) => {
      let $ = run(event4, at(toList(["key"]), string2));
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 === "Enter") {
          preventDefault(event4);
          return dispatch2(new UserActivatedTrigger);
        } else if ($1 === " ") {
          preventDefault(event4);
          return dispatch2(new UserActivatedTrigger);
        } else {
          return;
        }
      } else {
        return;
      }
    });
  });
  return [model, effect];
}
function register2() {
  let component2 = component(init2, update3, view2, toList([
    adopt_styles(false),
    on_item_change((var0) => {
      return new AccordionItemProvidedContext2(var0);
    })
  ]));
  return make_component(component2, tag3);
}
function on_activate(handler2) {
  return on("accordion/trigger:activate", success(handler2));
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/document.ffi.mjs
function activeElement() {
  const element6 = document.activeElement;
  if (element6 !== null) {
    return Result$Ok(element6);
  } else {
    return Result$Error(undefined);
  }
}

// build/dev/javascript/lustre_ui/lustre/ui/accordion/panel.ffi.mjs
function animate(shadowRoot, open, dispatch2) {
  if (!(shadowRoot instanceof ShadowRoot))
    return;
  const panel = shadowRoot.host;
  if (open) {
    dispatch2([`${panel.scrollWidth}px`, `${panel.scrollHeight}px`]);
    window.requestAnimationFrame(() => {
      Promise.all(panel.getAnimations().map((a2) => a2.finished)).then(() => dispatch2(["auto", "auto"])).catch(() => {});
    });
  } else {
    dispatch2([`${panel.scrollWidth}px`, `${panel.scrollHeight}px`]);
    window.requestAnimationFrame(() => {
      dispatch2(["0px", "0px"]);
    });
  }
}

// build/dev/javascript/lustre_ui/lustre/ui/accordion/panel.mjs
class Model3 extends CustomType {
  constructor(id3, open, force_mount, width, height) {
    super();
    this.id = id3;
    this.open = open;
    this.force_mount = force_mount;
    this.width = width;
    this.height = height;
  }
}

class Collapsed extends CustomType {
}

class Indeterminate extends CustomType {
}

class Expanded extends CustomType {
}

class AccordionItemProvidedContext3 extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}

class PanelMeasuredDimensions extends CustomType {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }
}

class ParentSetId extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}
var tag4 = "lustre-accordion-panel";
function element6(attributes, children) {
  return element2(tag4, attributes, children);
}
function view3(model) {
  return fragment2(toList([
    style(toList([]), (() => {
      let _pipe = `
      :host {
        --accordion-panel-width: \${width};
        --accordion-panel-height: \${height};

        display: block;
      }
      `;
      let _pipe$1 = replace(_pipe, "${width}", model.width);
      return replace(_pipe$1, "${height}", model.height);
    })()),
    default_slot(toList([inert(model.open instanceof Collapsed)]), toList([]))
  ]));
}
function emit_identify(id3) {
  return emit2("accordion/panel:identify", string3(id3));
}
function redirect_focus() {
  return before_paint2((_, _1, component2) => {
    let result = try$(activeElement(), (active) => {
      return guard(!contains2(component2, active), new Error(undefined), () => {
        return try$(closest(component2, "lustre-accordion"), (root3) => {
          return try$(querySelector(root3, tag3), (trigger) => {
            return new Ok(trigger);
          });
        });
      });
    });
    if (result instanceof Ok) {
      let trigger = result[0];
      return focus(trigger);
    } else {
      return;
    }
  });
}
function animate2(open) {
  return before_paint((dispatch2, shadow_root) => {
    return animate(shadow_root, open, (_use0) => {
      let width;
      let height;
      width = _use0[0];
      height = _use0[1];
      return dispatch2(new PanelMeasuredDimensions(width, height));
    });
  });
}
function update4(model, message) {
  if (message instanceof AccordionItemProvidedContext3) {
    let $ = message[0].open;
    if ($) {
      let $1 = model.open;
      if ($1 instanceof Collapsed) {
        let model$1 = new Model3(model.id, new Expanded, model.force_mount, model.width, model.height);
        let effect = batch(toList([set_pseudo_state2("open"), animate2(true)]));
        return [model$1, effect];
      } else if ($1 instanceof Indeterminate) {
        let model$1 = new Model3(model.id, new Expanded, model.force_mount, "auto", "auto");
        let effect = set_pseudo_state2("open");
        return [model$1, effect];
      } else {
        return [model, none()];
      }
    } else {
      let $1 = model.open;
      if ($1 instanceof Collapsed) {
        return [model, none()];
      } else if ($1 instanceof Indeterminate) {
        let model$1 = new Model3(model.id, new Collapsed, model.force_mount, "0px", "0px");
        let effect = batch(toList([remove_pseudo_state2("open"), redirect_focus()]));
        return [model$1, effect];
      } else {
        let model$1 = new Model3(model.id, new Collapsed, model.force_mount, model.width, model.height);
        let effect = batch(toList([
          remove_pseudo_state2("open"),
          animate2(false),
          redirect_focus()
        ]));
        return [model$1, effect];
      }
    }
  } else if (message instanceof PanelMeasuredDimensions) {
    let width = message.width;
    let height = message.height;
    let model$1 = new Model3(model.id, model.open, model.force_mount, width, height);
    let effect = none();
    return [model$1, effect];
  } else {
    let value2 = message.value;
    let model$1 = new Model3(value2, model.open, model.force_mount, model.width, model.height);
    let effect = emit_identify(model$1.id);
    return [model$1, effect];
  }
}
function init3(_) {
  let model = new Model3("", new Indeterminate, false, "0px", "0px");
  let effect = before_paint2((_2, _1, element7) => {
    role(element7, "region");
    let $ = attribute3(element7, "id");
    if ($ instanceof Ok) {
      let $1 = $[0];
      if ($1 === "") {
        return id2(element7, new$6(6));
      } else {
        return;
      }
    } else {
      return id2(element7, new$6(6));
    }
  });
  return [model, effect];
}
function register3() {
  let component2 = component(init3, update4, view3, toList([
    adopt_styles(false),
    on_item_change((var0) => {
      return new AccordionItemProvidedContext3(var0);
    }),
    on_attribute_change("id", (value2) => {
      return new Ok(new ParentSetId(value2));
    })
  ]));
  return make_component(component2, tag4);
}
function on_identify(handler2) {
  return on("accordion/panel:identify", field("detail", string2, (id3) => {
    return success(handler2(id3));
  }));
}

// build/dev/javascript/lustre_ui/lustre_ui/prop.mjs
class Prop extends CustomType {
  constructor(value2, controlled, touched) {
    super();
    this.value = value2;
    this.controlled = controlled;
    this.touched = touched;
  }
}
function new$8(value2) {
  return new Prop(value2, false, false);
}
function default$(prop, value2) {
  let $ = prop.controlled || prop.touched;
  if ($) {
    return prop;
  } else {
    return new Prop(value2, prop.controlled, prop.touched);
  }
}
function control(prop, value2) {
  return new Prop(value2, true, prop.touched);
}
function touch(prop, value2) {
  return new Prop(value2, prop.controlled, true);
}

// build/dev/javascript/lustre_ui/lustre/ui/accordion/item.mjs
class Model4 extends CustomType {
  constructor(name2, panel, accordion, open) {
    super();
    this.name = name2;
    this.panel = panel;
    this.accordion = accordion;
    this.open = open;
  }
}

class AccordionProvidedContext extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
}

class ParentSetDefaultOpen extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentSetName extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentSetOpen extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentToggledDefaultOpen extends CustomType {
}

class UserPressedTrigger extends CustomType {
}

class UserSetPanelId extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}
var tag5 = "lustre-accordion-item";
function element7(attributes, children) {
  return element2(tag5, attributes, children);
}
function name2(value2) {
  return name(value2);
}
function on_change(handler2) {
  return on("accordion/item:change", subfield(toList(["detail", "id"]), string2, (id3) => {
    return subfield(toList(["detail", "open"]), bool, (open) => {
      return success(handler2(id3, open));
    });
  }));
}
function emit_change(id3, open) {
  let _block;
  if (open) {
    _block = "accordion/item:show";
  } else {
    _block = "accordion/item:hide";
  }
  let show_hide = _block;
  return batch(toList([
    emit2(show_hide, object2(toList([["id", string3(id3)]]))),
    emit2("accordion/item:change", object2(toList([["id", string3(id3)], ["open", bool2(open)]])))
  ]));
}
function view4(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: block;
      }
      `),
    default_slot(toList([
      on_identify((var0) => {
        return new UserSetPanelId(var0);
      }),
      on_activate(new UserPressedTrigger)
    ]), toList([]))
  ]));
}
function divert_focus() {
  return before_paint2((_, _1, component2) => {
    let $ = try$(activeElement(), (active) => {
      return try$(closest(active, tag5), (item) => {
        return guard(!is(item, component2), new Error(undefined), () => {
          return try$(querySelector(component2, tag2 + " > " + tag3), (trigger) => {
            return new Ok(focus(trigger));
          });
        });
      });
    });
    return;
  });
}
function update5(model, message) {
  if (message instanceof AccordionProvidedContext) {
    if (model.open.controlled) {
      return [model, none()];
    } else {
      let all = message.all;
      let _block;
      let _record = model.open;
      _block = new Prop(contains(all, model.name), _record.controlled, true);
      let open$1 = _block;
      let model$1 = new Model4(model.name, model.panel, new Some(all), open$1);
      let _block$1;
      let $ = model$1.open.value;
      if ($) {
        _block$1 = batch(toList([
          provide_item(model$1.name, model$1.panel, open$1.value),
          set_pseudo_state2("open")
        ]));
      } else {
        _block$1 = batch(toList([
          provide_item(model$1.name, model$1.panel, open$1.value),
          remove_pseudo_state2("open"),
          divert_focus()
        ]));
      }
      let effect = _block$1;
      return [model$1, effect];
    }
  } else if (message instanceof ParentSetDefaultOpen) {
    let value2 = message.value;
    let $ = model.open.controlled || model.open.touched;
    if ($) {
      return [model, none()];
    } else {
      let _block;
      let _record = model.open;
      _block = new Prop(value2, _record.controlled, _record.touched);
      let open$1 = _block;
      let model$1 = new Model4(model.name, model.panel, model.accordion, open$1);
      let _block$1;
      let $1 = model$1.open.value;
      if ($1) {
        _block$1 = batch(toList([
          provide_item(model$1.name, model$1.panel, open$1.value),
          set_pseudo_state2("open")
        ]));
      } else {
        _block$1 = batch(toList([
          provide_item(model$1.name, model$1.panel, open$1.value),
          remove_pseudo_state2("open"),
          divert_focus()
        ]));
      }
      let effect = _block$1;
      return [model$1, effect];
    }
  } else if (message instanceof ParentSetName) {
    let value2 = message.value;
    let model$1 = new Model4(value2, model.panel, model.accordion, model.open);
    let effect = provide_item(model$1.name, model$1.panel, model$1.open.value);
    return [model$1, effect];
  } else if (message instanceof ParentSetOpen) {
    let value2 = message.value;
    let open$1 = new Prop(value2, true, true);
    let model$1 = new Model4(model.name, model.panel, model.accordion, open$1);
    let _block;
    let $ = model$1.open.value;
    if ($) {
      _block = batch(toList([
        provide_item(model$1.name, model$1.panel, open$1.value),
        set_pseudo_state2("open")
      ]));
    } else {
      _block = batch(toList([
        provide_item(model$1.name, model$1.panel, open$1.value),
        remove_pseudo_state2("open"),
        divert_focus()
      ]));
    }
    let effect = _block;
    return [model$1, effect];
  } else if (message instanceof ParentToggledDefaultOpen) {
    let $ = model.open.controlled || model.open.touched;
    if ($) {
      return [model, none()];
    } else {
      let _block;
      let _record = model.open;
      _block = new Prop(!model.open.value, _record.controlled, _record.touched);
      let open$1 = _block;
      let model$1 = new Model4(model.name, model.panel, model.accordion, open$1);
      let _block$1;
      let $1 = model$1.open.value;
      if ($1) {
        _block$1 = batch(toList([
          provide_item(model$1.name, model$1.panel, open$1.value),
          set_pseudo_state2("open")
        ]));
      } else {
        _block$1 = batch(toList([
          provide_item(model$1.name, model$1.panel, open$1.value),
          remove_pseudo_state2("open"),
          divert_focus()
        ]));
      }
      let effect = _block$1;
      return [model$1, effect];
    }
  } else if (message instanceof UserPressedTrigger) {
    let $ = model.open.controlled;
    if ($) {
      let next = !model.open.value;
      let effect = emit_change(model.name, next);
      return [model, effect];
    } else {
      let _block;
      let _record = model.open;
      _block = new Prop(!model.open.value, _record.controlled, true);
      let open$1 = _block;
      let model$1 = new Model4(model.name, model.panel, model.accordion, open$1);
      let _block$1;
      let $1 = model$1.open.value;
      if ($1) {
        _block$1 = batch(toList([
          emit_change(model$1.name, model$1.open.value),
          provide_item(model$1.name, model$1.panel, model$1.open.value),
          set_pseudo_state2("open")
        ]));
      } else {
        _block$1 = batch(toList([
          emit_change(model$1.name, model$1.open.value),
          provide_item(model$1.name, model$1.panel, model$1.open.value),
          remove_pseudo_state2("open"),
          divert_focus()
        ]));
      }
      let effect = _block$1;
      return [model$1, effect];
    }
  } else {
    let value2 = message.value;
    let model$1 = new Model4(model.name, value2, model.accordion, model.open);
    let effect = provide_item(model$1.name, model$1.panel, model$1.open.value);
    return [model$1, effect];
  }
}
function init4(_) {
  let open$1 = new Prop(false, false, false);
  let model = new Model4("", "", new None, open$1);
  let effect = batch(toList([
    provide_item(model.name, model.panel, false),
    before_paint2((dispatch2, _2, component2) => {
      let _block;
      let _pipe = component2;
      let _pipe$1 = querySelector(_pipe, tag4);
      _block = try$(_pipe$1, (_capture) => {
        return attribute3(_capture, "id");
      });
      let result = _block;
      if (result instanceof Ok) {
        let id3 = result[0];
        return dispatch2(new UserSetPanelId(id3));
      } else {
        return;
      }
    })
  ]));
  return [model, effect];
}
function register4() {
  let component2 = component(init4, update5, view4, toList([
    adopt_styles(false),
    on_context_change("accordion", field("open", list2(string2), (all) => {
      return success(new AccordionProvidedContext(all));
    })),
    on_attribute_change("name", (value2) => {
      return new Ok(new ParentSetName(value2));
    }),
    on_attribute_change("open", (value2) => {
      if (value2 === "true") {
        return new Ok(new ParentSetDefaultOpen(true));
      } else if (value2 === "false") {
        return new Ok(new ParentSetDefaultOpen(false));
      } else if (value2 === "") {
        return new Ok(new ParentToggledDefaultOpen);
      } else {
        return new Error(undefined);
      }
    }),
    on_property_change("open", (() => {
      let _pipe = bool;
      return map3(_pipe, (var0) => {
        return new ParentSetOpen(var0);
      });
    })())
  ]));
  return make_component(component2, tag5);
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/find.ffi.mjs
function createTreeWalker(root3, pierceShadowRoot, matcher) {
  return document.createTreeWalker(root3, NodeFilter.SHOW_ELEMENT, (node) => {
    const filter3 = matcher(node);
    if (Filter$isAccept(filter3)) {
      return NodeFilter.FILTER_ACCEPT;
    } else if (Filter$isReject(filter3)) {
      return NodeFilter.FILTER_REJECT;
    } else if (pierceShadowRoot && (node.shadowRoot || node instanceof HTMLSlotElement)) {
      return NodeFilter.FILTER_ACCEPT;
    } else {
      return NodeFilter.FILTER_SKIP;
    }
  });
}
function findFirstDescendant(root3, pierceShadowRoot, matcher) {
  let walker = createTreeWalker(root3, pierceShadowRoot, matcher);
  let current = null;
  while (current = walker.nextNode()) {
    if (Filter$isAccept(matcher(current))) {
      return Result$Ok(current);
    }
    if (pierceShadowRoot && current.shadowRoot) {
      const firstDescendantInShadowRoot = findFirstDescendant(current.shadowRoot, pierceShadowRoot, matcher);
      if (Result$isOk(firstDescendantInShadowRoot)) {
        return firstDescendantInShadowRoot;
      }
    } else if (pierceShadowRoot && current instanceof HTMLSlotElement) {
      const assignedNodes = current.assignedElements();
      for (const assignedNode of assignedNodes) {
        const firstDescendantInAssignedNode = findFirstDescendant(assignedNode, pierceShadowRoot, matcher);
        if (Result$isOk(firstDescendantInAssignedNode)) {
          return firstDescendantInAssignedNode;
        }
      }
    } else {
      return Result$Ok(current);
    }
  }
  return Result$Error(undefined);
}
function findPreviousDescendant(root3, before, pierceShadowRoot, matcher) {
  return findNextDescendant(root3, before, pierceShadowRoot, matcher, {
    reverse: true
  });
}
function findNextDescendant(root3, after, pierceShadowRoot, matcher, { reverse: reverse3 = false } = {}) {
  let walker = createTreeWalker(root3, pierceShadowRoot, matcher);
  let current = null;
  if (after !== null)
    walker.currentNode = after;
  while (current = reverse3 ? walker.previousNode() : walker.nextNode()) {
    if (Filter$isAccept(matcher(current))) {
      return Result$Ok(current);
    }
    if (pierceShadowRoot && current.shadowRoot) {
      const nextDescendantInShadowRoot = findNextDescendant(current.shadowRoot, reverse3 ? Result$Ok$0(findLastDescendant(current.shadowRoot, pierceShadowRoot, matcher)) ?? null : null, pierceShadowRoot, matcher, { reverse: reverse3 });
      if (Result$isOk(nextDescendantInShadowRoot)) {
        return nextDescendantInShadowRoot;
      }
    } else if (pierceShadowRoot && current instanceof HTMLSlotElement) {
      const assignedNodes = current.assignedElements();
      for (let i = reverse3 ? assignedNodes.length - 1 : 0;reverse3 ? i >= 0 : i < assignedNodes.length; reverse3 ? i-- : i++) {
        const assignedNode = assignedNodes[i];
        const nextDescendantInAssignedNode = findNextDescendant(assignedNode, reverse3 ? Result$Ok$0(findLastDescendant(assignedNode, pierceShadowRoot, matcher)) ?? null : null, pierceShadowRoot, matcher, { reverse: reverse3 });
        if (Result$isOk(nextDescendantInAssignedNode)) {
          return nextDescendantInAssignedNode;
        }
      }
    } else {
      return Result$Ok(current);
    }
  }
  return Result$Error(undefined);
}
function findLastDescendant(root3, pierceShadowRoot, matcher) {
  let walker = createTreeWalker(root3, pierceShadowRoot, matcher);
  let current = null;
  let last = null;
  while (current = walker.nextNode()) {
    if (Filter$isAccept(matcher(current))) {
      last = current;
    } else if (pierceShadowRoot && current.shadowRoot) {
      const lastDescendantInShadowRoot = findLastDescendant(current.shadowRoot, pierceShadowRoot, matcher);
      if (Result$isOk(lastDescendantInShadowRoot)) {
        last = Result$Ok$0(lastDescendantInShadowRoot);
      }
    } else if (pierceShadowRoot && current instanceof HTMLSlotElement) {
      const assignedNodes = current.assignedElements();
      for (let i = assignedNodes.length - 1;i >= 0; i--) {
        const assignedNode = assignedNodes[i];
        const lastDescendantInAssignedNode = findLastDescendant(assignedNode, pierceShadowRoot, matcher);
        if (Result$isOk(lastDescendantInAssignedNode)) {
          last = Result$Ok$0(lastDescendantInAssignedNode);
        }
      }
    } else {
      last = current;
    }
  }
  return last ? Result$Ok(last) : Result$Error(undefined);
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/find.mjs
class Accept extends CustomType {
}
var Filter$isAccept = (value2) => value2 instanceof Accept;

class Skip extends CustomType {
}
class Reject extends CustomType {
}
var Filter$isReject = (value2) => value2 instanceof Reject;
var not_neg_tabindex = ':not([tabindex^="-"])';
var not_inert = ":not([inert]):not([inert] *)";
var not_disabled = ":not(:disabled)";
var tabbable2 = /* @__PURE__ */ toList([
  "a[href]" + not_inert + not_neg_tabindex,
  "area[href]" + not_inert + not_neg_tabindex,
  'input:not([type="hidden"]):not([type="radio"])' + not_inert + not_neg_tabindex + not_disabled,
  'input[type="radio"]' + not_inert + not_neg_tabindex + not_disabled,
  "select" + not_inert + not_neg_tabindex + not_disabled,
  "textarea" + not_inert + not_neg_tabindex + not_disabled,
  "button" + not_inert + not_neg_tabindex + not_disabled,
  "details" + not_inert + " > summary:first-of-type" + not_neg_tabindex,
  "details:not(:has(> summary))" + not_inert + not_neg_tabindex,
  "iframe" + not_inert + not_neg_tabindex,
  "audio[controls]" + not_inert + not_neg_tabindex,
  "video[controls]" + not_inert + not_neg_tabindex,
  "[contenteditable]" + not_inert + not_neg_tabindex,
  "[tabindex]" + not_inert + not_neg_tabindex
]);
function is_tabbable(element8) {
  return matches2(element8, join(tabbable2, ", "));
}
function previous_descendant(root3, target, pierce_shadow_roots, wrap, filter3) {
  let previous = findPreviousDescendant(root3, target, pierce_shadow_roots, filter3);
  return guard(!wrap, previous, () => {
    return lazy_or(previous, () => {
      return findLastDescendant(root3, pierce_shadow_roots, filter3);
    });
  });
}
function next_descendant(root3, target, pierce_shadow_roots, wrap, filter3) {
  let next = findNextDescendant(root3, target, pierce_shadow_roots, filter3);
  return guard(!wrap, next, () => {
    return lazy_or(next, () => {
      return findFirstDescendant(root3, pierce_shadow_roots, filter3);
    });
  });
}

// build/dev/javascript/lustre_ui/lustre/ui/accordion/root.mjs
class Model5 extends CustomType {
  constructor(focused, orientation, loop, multiple, open) {
    super();
    this.focused = focused;
    this.orientation = orientation;
    this.loop = loop;
    this.multiple = multiple;
    this.open = open;
  }
}

class Horizontal extends CustomType {
}

class Vertical extends CustomType {
}

class ParentSetDefaultValue extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentSetLabel extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentSetLoop extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentSetMultiple extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentSetOrientation extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentSetValue extends CustomType {
  constructor(value2) {
    super();
    this.value = value2;
  }
}

class ParentToggledLoop extends CustomType {
}

class ParentToggledMultiple extends CustomType {
}

class UserNavigatedFocus extends CustomType {
  constructor(next) {
    super();
    this.next = next;
  }
}

class UserToggledItem extends CustomType {
  constructor(id3, open) {
    super();
    this.id = id3;
    this.open = open;
  }
}
var tag6 = "lustre-accordion";
function emit_change2(open) {
  return emit2("accordion:change", (() => {
    let _pipe = open;
    let _pipe$1 = to_list2(_pipe);
    return array2(_pipe$1, string3);
  })());
}
function handle_keydown(orientation, loop) {
  return field("key", string2, (key) => {
    return field("currentTarget", then$(decoder(), (slot2) => {
      let $ = host(slot2);
      if ($ instanceof Ok) {
        let element$1 = $[0];
        return success(element$1);
      } else {
        return failure(nil(), "");
      }
    }), (accordion) => {
      let selector = (element8) => {
        let $ = tag(element8);
        let tag$1 = $;
        if (tag$1 === tag3) {
          return new Accept;
        } else {
          let tag$12 = $;
          if (tag$12 === tag4) {
            return new Reject;
          } else {
            return new Skip;
          }
        }
      };
      return field("target", then$(decoder(), (target) => {
        let $ = closest(target, tag3);
        if ($ instanceof Ok) {
          let element$1 = $[0];
          return success(element$1);
        } else {
          return failure(nil(), "");
        }
      }), (trigger) => {
        let _block;
        if (key === "Home") {
          _block = findFirstDescendant(accordion, false, selector);
        } else if (key === "ArrowUp" && orientation instanceof Vertical) {
          _block = previous_descendant(accordion, trigger, false, loop, selector);
        } else if (key === "ArrowLeft" && orientation instanceof Horizontal) {
          _block = previous_descendant(accordion, trigger, false, loop, selector);
        } else if (key === "ArrowDown" && orientation instanceof Vertical) {
          _block = next_descendant(accordion, trigger, false, loop, selector);
        } else if (key === "ArrowRight" && orientation instanceof Horizontal) {
          _block = next_descendant(accordion, trigger, false, loop, selector);
        } else if (key === "End") {
          _block = findLastDescendant(accordion, false, selector);
        } else {
          _block = new Error(undefined);
        }
        let result = _block;
        return then$((() => {
          if (result instanceof Ok) {
            let element$1 = result[0];
            return success(element$1);
          } else {
            return failure(nil(), "");
          }
        })(), (next) => {
          return success(handler(new UserNavigatedFocus(next), true, true));
        });
      });
    });
  });
}
function view5(model) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: block;
      }
      `),
    default_slot(toList([
      advanced("keydown", handle_keydown(model.orientation, model.loop)),
      on_change((var0, var1) => {
        return new UserToggledItem(var0, var1);
      })
    ]), toList([]))
  ]));
}
function update6(model, message) {
  if (message instanceof ParentSetDefaultValue) {
    let value$1 = message.value;
    let $ = model.open.controlled || model.open.touched;
    if ($) {
      return [model, none()];
    } else {
      let _block;
      let _record = model.open;
      _block = new Prop(from_list2(value$1), _record.controlled, _record.touched);
      let open = _block;
      let model$1 = new Model5(model.focused, model.orientation, model.loop, model.multiple, open);
      let effect = provide3(open.value);
      return [model$1, effect];
    }
  } else if (message instanceof ParentSetLabel) {
    let value$1 = message.value;
    let effect = before_paint2((_, _1, component2) => {
      if (value$1 === "") {
        return removeAttribute2(component2, "role");
      } else {
        return role(component2, "region");
      }
    });
    return [model, effect];
  } else if (message instanceof ParentSetLoop) {
    let value$1 = message.value;
    let model$1 = new Model5(model.focused, model.orientation, value$1, model.multiple, model.open);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentSetMultiple) {
    let value$1 = message.value;
    let model$1 = new Model5(model.focused, model.orientation, model.loop, value$1, model.open);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentSetOrientation) {
    let value$1 = message.value;
    let model$1 = new Model5(model.focused, value$1, model.loop, model.multiple, model.open);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentSetValue) {
    let value$1 = message.value;
    let _block;
    let _record = model.open;
    _block = new Prop(from_list2(value$1), true, _record.touched);
    let open = _block;
    let model$1 = new Model5(model.focused, model.orientation, model.loop, model.multiple, open);
    let effect = provide3(open.value);
    return [model$1, effect];
  } else if (message instanceof ParentToggledLoop) {
    let model$1 = new Model5(model.focused, model.orientation, !model.loop, model.multiple, model.open);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentToggledMultiple) {
    let model$1 = new Model5(model.focused, model.orientation, model.loop, !model.multiple, model.open);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof UserNavigatedFocus) {
    let next = message.next;
    let effect = focus2(next);
    return [model, effect];
  } else {
    let id3 = message.id;
    let open = message.open;
    let _block;
    if (open) {
      if (model.multiple) {
        _block = insert3(model.open.value, id3);
      } else {
        _block = from_list2(toList([id3]));
      }
    } else if (model.multiple) {
      _block = delete$2(model.open.value, id3);
    } else {
      _block = new$2();
    }
    let next = _block;
    return guard(model.open.controlled, [model, emit_change2(next)], () => {
      let _block$1;
      let _record = model.open;
      _block$1 = new Prop(next, _record.controlled, true);
      let open$1 = _block$1;
      let model$1 = new Model5(model.focused, model.orientation, model.loop, model.multiple, open$1);
      let effect = batch(toList([provide3(next), emit_change2(next)]));
      return [model$1, effect];
    });
  }
}
function init5(_) {
  let model = new Model5(new None, new Vertical, false, false, new Prop(new$2(), false, false));
  let effect = batch(toList([
    provide3(model.open.value),
    before_paint2((dispatch2, _2, component2) => {
      let $ = attribute3(component2, "aria-orientation");
      if ($ instanceof Ok) {
        let $12 = $[0];
        if ($12 === "horizontal") {} else if ($12 === "vertical") {} else {
          aria_orientation(component2, "vertical");
        }
      } else {
        aria_orientation(component2, "vertical");
      }
      let $1 = attribute3(component2, "value");
      if ($1 instanceof Ok) {
        let $2 = $1[0];
        if ($2 === "") {
          let selector = tag5 + '[open]:not([open="false"])';
          let _block;
          let _pipe = component2;
          let _pipe$1 = querySelectorAll(_pipe, selector);
          _block = filter_map(_pipe$1, (_capture) => {
            return attribute3(_capture, "name");
          });
          let default_open = _block;
          return dispatch2(new ParentSetDefaultValue(default_open));
        } else {
          return;
        }
      } else {
        let selector = tag5 + '[open]:not([open="false"])';
        let _block;
        let _pipe = component2;
        let _pipe$1 = querySelectorAll(_pipe, selector);
        _block = filter_map(_pipe$1, (_capture) => {
          return attribute3(_capture, "name");
        });
        let default_open = _block;
        return dispatch2(new ParentSetDefaultValue(default_open));
      }
    })
  ]));
  return [model, effect];
}
function register5() {
  let component2 = component(init5, update6, view5, toList([
    adopt_styles(false),
    on_attribute_change("loop", (_) => {
      return new Ok(new ParentToggledLoop);
    }),
    on_attribute_change("aria-label", (value2) => {
      return new Ok(new ParentSetLabel(value2));
    }),
    on_attribute_change("aria-orientation", (value2) => {
      if (value2 === "horizontal") {
        return new Ok(new ParentSetOrientation(new Horizontal));
      } else if (value2 === "vertical") {
        return new Ok(new ParentSetOrientation(new Vertical));
      } else if (value2 === "") {
        return new Ok(new ParentSetOrientation(new Vertical));
      } else {
        return new Error(undefined);
      }
    }),
    on_attribute_change("type", (value2) => {
      if (value2 === "single") {
        return new Ok(new ParentSetMultiple(false));
      } else if (value2 === "") {
        return new Ok(new ParentSetMultiple(false));
      } else if (value2 === "multiple") {
        return new Ok(new ParentSetMultiple(true));
      } else {
        return new Error(undefined);
      }
    }),
    on_attribute_change("value", (value2) => {
      return new Ok(new ParentSetDefaultValue(split2(value2, " ")));
    }),
    on_property_change("value", (() => {
      let _pipe = list2(string2);
      return map3(_pipe, (var0) => {
        return new ParentSetValue(var0);
      });
    })())
  ]));
  return make_component(component2, tag6);
}

// build/dev/javascript/lustre_ui/lustre/ui/accordion.mjs
class Item extends CustomType {
  constructor(name3, attributes, heading, panel) {
    super();
    this.name = name3;
    this.attributes = attributes;
    this.heading = heading;
    this.panel = panel;
  }
}

class Trigger extends CustomType {
  constructor(attributes, children) {
    super();
    this.attributes = attributes;
    this.children = children;
  }
}

class Panel extends CustomType {
  constructor(attributes, children) {
    super();
    this.attributes = attributes;
    this.children = children;
  }
}
function panel(attributes, children) {
  return new Panel(attributes, children);
}
function trigger(attributes, children) {
  return new Trigger(attributes, children);
}
function heading(attributes, trigger2) {
  return element4(attributes, toList([element5(trigger2.attributes, trigger2.children)]));
}
function item(name3, attributes, heading2, panel2) {
  return new Item(name3, attributes, heading2, panel2);
}
function register6() {
  return try$(register5(), (_) => {
    return try$(register4(), (_2) => {
      return try$(register(), (_3) => {
        return try$(register2(), (_4) => {
          return try$(register3(), (_5) => {
            return new Ok(undefined);
          });
        });
      });
    });
  });
}
function view6(attributes, children) {
  return element3(tag6, attributes, filter_map(children, (_use0) => {
    let name3;
    let attributes$1;
    let heading$1;
    let panel$1;
    name3 = _use0.name;
    attributes$1 = _use0.attributes;
    heading$1 = _use0.heading;
    panel$1 = _use0.panel;
    return guard(name3 === "", new Error(undefined), () => {
      let html = element7(prepend(name2(name3), attributes$1), toList([
        heading$1,
        element6(panel$1.attributes, panel$1.children)
      ]));
      return new Ok([name3, html]);
    });
  }));
}

// build/dev/javascript/lustre_ui/lustre/ui/tabs/context.mjs
class Context extends CustomType {
  constructor(orientation2, active, all) {
    super();
    this.orientation = orientation2;
    this.active = active;
    this.all = all;
  }
}
class Horizontal2 extends CustomType {
}
class Vertical2 extends CustomType {
}
class Tab extends CustomType {
  constructor(name3, trigger2, panel2) {
    super();
    this.name = name3;
    this.trigger = trigger2;
    this.panel = panel2;
  }
}
function new$9() {
  return new Context(new Horizontal2, new None, make());
}
function tab_decoder() {
  return field("name", string2, (name3) => {
    return field("trigger", string2, (trigger2) => {
      return field("panel", string2, (panel2) => {
        return success(new Tab(name3, trigger2, panel2));
      });
    });
  });
}
function on_change2(handler2) {
  return on_context_change("tabs", field("orientation", then$(string2, (value3) => {
    if (value3 === "horizontal") {
      return success(new Horizontal2);
    } else if (value3 === "vertical") {
      return success(new Vertical2);
    } else {
      return failure(new Horizontal2, "Orientation");
    }
  }), (orientation2) => {
    return field("active", optional(tab_decoder()), (active) => {
      return field("all", dict2(string2, tab_decoder()), (all) => {
        return success(handler2(new Context(orientation2, active, all)));
      });
    });
  }));
}
function tab_to_json(tab) {
  return object2(toList([
    ["name", string3(tab.name)],
    ["trigger", string3(tab.trigger)],
    ["panel", string3(tab.panel)]
  ]));
}
function orientation_to_json(orientation2) {
  if (orientation2 instanceof Horizontal2) {
    return string3("horizontal");
  } else {
    return string3("vertical");
  }
}
function provide4(context) {
  return provide("tabs", object2(toList([
    ["orientation", orientation_to_json(context.orientation)],
    [
      "active",
      (() => {
        let $ = context.active;
        if ($ instanceof Some) {
          let tab = $[0];
          return tab_to_json(tab);
        } else {
          return null$();
        }
      })()
    ],
    ["all", dict3(context.all, identity2, tab_to_json)]
  ])));
}

// build/dev/javascript/lustre_ui/lustre/ui/tabs/content.mjs
class Model6 extends CustomType {
  constructor(active) {
    super();
    this.active = active;
  }
}

class TabsProvidedContext extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}
var tag7 = "lustre-tabs-content";
function view7(model) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: block;
      }
      `),
    (() => {
      let $ = model.active;
      if ($ instanceof Some) {
        let tab = $[0];
        return named_slot(tab.name, toList([]), toList([]));
      } else {
        return none2();
      }
    })()
  ]));
}
function update7(_, message) {
  let value3 = message.value;
  let model = new Model6(value3.active);
  let effect = none();
  return [model, effect];
}
function init6(_) {
  let model = new Model6(new None);
  let effect = none();
  return [model, effect];
}
function register7() {
  let component2 = component(init6, update7, view7, toList([
    on_change2((var0) => {
      return new TabsProvidedContext(var0);
    })
  ]));
  return make_component(component2, tag7);
}

// build/dev/javascript/lustre_ui/lustre/ui/tabs/trigger.mjs
class Model7 extends CustomType {
  constructor(name3, id3, active) {
    super();
    this.name = name3;
    this.id = id3;
    this.active = active;
  }
}

class ParentRemovedId extends CustomType {
}

class ParentRemovedName extends CustomType {
}

class ParentSetId2 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class ParentSetName2 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class TabsProvidedContext2 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class UserActivatedTrigger2 extends CustomType {
}
var tag8 = "lustre-tabs-trigger";
function on_identify2(handler2) {
  return on("tabs/trigger:identify", subfield(toList(["detail", "previous_name"]), optional(string2), (previous) => {
    return subfield(toList(["detail", "name"]), string2, (name3) => {
      return subfield(toList(["detail", "id"]), string2, (id3) => {
        return success(handler2(previous, name3, id3));
      });
    });
  }));
}
function emit_identify2(previous_name, name3, id3) {
  return emit2("tabs/trigger:identify", object2(toList([
    [
      "previous_name",
      (() => {
        if (previous_name instanceof Some) {
          let name$1 = previous_name[0];
          return string3(name$1);
        } else {
          return null$();
        }
      })()
    ],
    ["name", string3(name3)],
    ["id", string3(id3)]
  ])));
}
function on_activate2(handler2) {
  return on("tabs/trigger:activate", subfield(toList(["detail", "name"]), string2, (name3) => {
    return success(handler2(name3));
  }));
}
function emit_activate2(name3) {
  return emit2("tabs/trigger:activate", object2(toList([["name", string3(name3)]])));
}
function view8(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        cursor: default;
        display: inline;
        user-select: none;
      }
      `),
    default_slot(toList([]), toList([]))
  ]));
}
function activate(name3, active) {
  if (active instanceof Some) {
    let tab = active[0];
    if (tab.name === name3) {
      return batch(toList([
        set_pseudo_state2("active"),
        before_paint2((_, _1, component2) => {
          tabbable(component2, true);
          return aria_selected(component2, true);
        })
      ]));
    } else {
      return batch(toList([
        remove_pseudo_state2("active"),
        before_paint2((_, _1, component2) => {
          tabbable(component2, false);
          return aria_selected(component2, false);
        })
      ]));
    }
  } else {
    return batch(toList([
      remove_pseudo_state2("active"),
      before_paint2((_, _1, component2) => {
        tabbable(component2, false);
        return aria_selected(component2, false);
      })
    ]));
  }
}
function update8(model, message) {
  if (message instanceof ParentRemovedId) {
    let effect = before_paint2((_, _1, component2) => {
      return ensure_id(component2);
    });
    return [model, effect];
  } else if (message instanceof ParentRemovedName) {
    let model$1 = new Model7("", model.id, model.active);
    let effect = activate(model$1.name, model$1.active);
    return [model$1, effect];
  } else if (message instanceof ParentSetId2) {
    let $ = message.value;
    if ($ === "") {
      let effect = before_paint2((_, _1, component2) => {
        return ensure_id(component2);
      });
      return [model, effect];
    } else {
      let value3 = $;
      let model$1 = new Model7(model.name, value3, model.active);
      let _block;
      let $1 = model$1.name !== "";
      if ($1) {
        _block = emit_identify2(new None, model$1.name, model$1.id);
      } else {
        _block = none();
      }
      let effect = _block;
      return [model$1, effect];
    }
  } else if (message instanceof ParentSetName2) {
    let $ = message.value;
    if ($ === "") {
      let model$1 = new Model7("", model.id, model.active);
      let effect = activate(model$1.name, model$1.active);
      return [model$1, effect];
    } else {
      let value3 = $;
      let _block;
      let $1 = model.name;
      if ($1 === "") {
        _block = new None;
      } else {
        let name$1 = $1;
        if (name$1 === value3) {
          _block = new None;
        } else {
          let name$12 = $1;
          _block = new Some(name$12);
        }
      }
      let previous = _block;
      let model$1 = new Model7(value3, model.id, model.active);
      let effect = batch(toList([
        activate(model$1.name, model$1.active),
        (() => {
          let $2 = model$1.id !== "";
          if ($2) {
            return emit_identify2(previous, model$1.name, model$1.id);
          } else {
            return none();
          }
        })()
      ]));
      return [model$1, effect];
    }
  } else if (message instanceof TabsProvidedContext2) {
    let value3 = message.value;
    let model$1 = new Model7(model.name, model.id, value3.active);
    let effect = batch(toList([
      activate(model$1.name, model$1.active),
      before_paint2((_, _1, component2) => {
        let $ = get(value3.all, model$1.name);
        if ($ instanceof Ok) {
          let tab = $[0];
          return aria_controls(component2, toList([tab.panel]));
        } else {
          return aria_controls(component2, toList([]));
        }
      })
    ]));
    return [model$1, effect];
  } else {
    return [model, emit_activate2(model.name)];
  }
}
function init7(_) {
  let model = new Model7("", "", new None);
  let effect = before_paint2((dispatch2, _2, component2) => {
    role(component2, "tab");
    ensure_id(component2);
    tabbable(component2, false);
    addEventListener2(component2, "click", (_3) => {
      return dispatch2(new UserActivatedTrigger2);
    });
    return addEventListener2(component2, "keydown", (event4) => {
      let $ = run(event4, at(toList(["key"]), string2));
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 === "Enter") {
          preventDefault(event4);
          return dispatch2(new UserActivatedTrigger2);
        } else if ($1 === " ") {
          preventDefault(event4);
          return dispatch2(new UserActivatedTrigger2);
        } else {
          return;
        }
      } else {
        return;
      }
    });
  });
  return [model, effect];
}
function register8() {
  let component2 = component(init7, update8, view8, toList([
    on_change2((var0) => {
      return new TabsProvidedContext2(var0);
    }),
    on_attribute_change("id", (value3) => {
      if (value3 === "") {
        return new Ok(new ParentRemovedId);
      } else {
        let id3 = value3;
        return new Ok(new ParentSetId2(id3));
      }
    }),
    on_attribute_change("name", (value3) => {
      if (value3 === "") {
        return new Ok(new ParentRemovedName);
      } else {
        let name$1 = value3;
        return new Ok(new ParentSetName2(name$1));
      }
    })
  ]));
  return make_component(component2, tag8);
}

// build/dev/javascript/lustre_ui/lustre/ui/tabs/list.mjs
class Model8 extends CustomType {
  constructor(mode, orientation2, loop2) {
    super();
    this.mode = mode;
    this.orientation = orientation2;
    this.loop = loop2;
  }
}

class Automatic extends CustomType {
}
class Manual extends CustomType {
}
class ParentSetMode extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class ParentSetOrientation2 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class ParentToggledLoop2 extends CustomType {
}

class TabsProvidedContext3 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class UserActivatedTrigger3 extends CustomType {
  constructor(name3) {
    super();
    this.name = name3;
  }
}

class UserNavigatedFocus2 extends CustomType {
  constructor(next) {
    super();
    this.next = next;
  }
}
var tag9 = "lustre-tabs-list";
function on_select(handler2) {
  return on("tabs/list:select", subfield(toList(["detail", "name"]), string2, (name3) => {
    return success(handler2(name3));
  }));
}
function emit_select(name3) {
  return emit2("tabs/list:select", object2(toList([["name", string3(name3)]])));
}
function handle_keydown2(orientation2, loop2) {
  return field("key", string2, (key) => {
    return field("currentTarget", then$(decoder(), (slot2) => {
      let $ = host(slot2);
      if ($ instanceof Ok) {
        let element$1 = $[0];
        return success(element$1);
      } else {
        return failure(nil(), "");
      }
    }), (tabs_list) => {
      return field("target", then$(decoder(), (target) => {
        let $ = closest(target, tag8);
        if ($ instanceof Ok) {
          let element$1 = $[0];
          return success(element$1);
        } else {
          return failure(nil(), "");
        }
      }), (trigger2) => {
        let selector = (element8) => {
          let $ = tag(element8);
          if ($ === "lustre-tabs-trigger") {
            return new Accept;
          } else {
            return new Skip;
          }
        };
        let _block;
        if (key === "Home") {
          let _pipe = findFirstDescendant(tabs_list, false, selector);
          _block = map4(_pipe, (var0) => {
            return new UserNavigatedFocus2(var0);
          });
        } else if (key === "ArrowUp" && orientation2 instanceof Vertical2) {
          let _pipe = previous_descendant(tabs_list, trigger2, false, loop2, selector);
          _block = map4(_pipe, (var0) => {
            return new UserNavigatedFocus2(var0);
          });
        } else if (key === "ArrowLeft" && orientation2 instanceof Horizontal2) {
          let _pipe = previous_descendant(tabs_list, trigger2, false, loop2, selector);
          _block = map4(_pipe, (var0) => {
            return new UserNavigatedFocus2(var0);
          });
        } else if (key === "ArrowDown" && orientation2 instanceof Vertical2) {
          let _pipe = next_descendant(tabs_list, trigger2, false, loop2, selector);
          _block = map4(_pipe, (var0) => {
            return new UserNavigatedFocus2(var0);
          });
        } else if (key === "ArrowRight" && orientation2 instanceof Horizontal2) {
          let _pipe = next_descendant(tabs_list, trigger2, false, loop2, selector);
          _block = map4(_pipe, (var0) => {
            return new UserNavigatedFocus2(var0);
          });
        } else if (key === "End") {
          let _pipe = findLastDescendant(tabs_list, false, selector);
          _block = map4(_pipe, (var0) => {
            return new UserNavigatedFocus2(var0);
          });
        } else {
          _block = new Error(undefined);
        }
        let result = _block;
        if (result instanceof Ok) {
          let message = result[0];
          return success(handler(message, true, true));
        } else {
          return failure(handler(new UserNavigatedFocus2(nil()), false, false), "");
        }
      });
    });
  });
}
function view9(model) {
  let handle_focusin = field("target", decoder(), (target) => {
    let result = try$(closest(target, tag8), (trigger2) => {
      return try$(attribute3(trigger2, "name"), (name3) => {
        return new Ok(name3);
      });
    });
    if (result instanceof Ok && model.mode instanceof Automatic) {
      let trigger2 = result[0];
      return success(new UserActivatedTrigger3(trigger2));
    } else {
      return failure(new UserActivatedTrigger3(""), "");
    }
  });
  fragment2(toList([
    style(toList([]), `
      :host {
        display: block;
      }
      `)
  ]));
  return default_slot(toList([
    on_activate2((var0) => {
      return new UserActivatedTrigger3(var0);
    }),
    on("focusin", handle_focusin),
    advanced("keydown", handle_keydown2(model.orientation.value, model.loop))
  ]), toList([]));
}
function update9(model, message) {
  if (message instanceof ParentSetMode) {
    let value3 = message.value;
    let model$1 = new Model8(value3, model.orientation, model.loop);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentSetOrientation2) {
    let value3 = message.value;
    let model$1 = new Model8(model.mode, control(model.orientation, value3), model.loop);
    let effect = before_paint2((_, _1, component2) => {
      return aria_orientation(component2, (() => {
        if (value3 instanceof Horizontal2) {
          return "horizontal";
        } else {
          return "vertical";
        }
      })());
    });
    return [model$1, effect];
  } else if (message instanceof ParentToggledLoop2) {
    let model$1 = new Model8(model.mode, model.orientation, !model.loop);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof TabsProvidedContext3) {
    let context = message.value;
    return guard(model.orientation.controlled, [model, none()], () => {
      let orientation$1 = default$(model.orientation, context.orientation);
      let model$1 = new Model8(model.mode, orientation$1, model.loop);
      let effect = before_paint2((_, _1, component2) => {
        return aria_orientation(component2, (() => {
          let $ = orientation$1.value;
          if ($ instanceof Horizontal2) {
            return "horizontal";
          } else {
            return "vertical";
          }
        })());
      });
      return [model$1, effect];
    });
  } else if (message instanceof UserActivatedTrigger3) {
    let name3 = message.name;
    let effect = emit_select(name3);
    return [model, effect];
  } else {
    let next = message.next;
    let effect = focus2(next);
    return [model, effect];
  }
}
function init8(_) {
  let model = new Model8(new Automatic, new$8(new Horizontal2), false);
  let effect = before_paint2((_2, _1, component2) => {
    return role(component2, "tablist");
  });
  return [model, effect];
}
function register9() {
  let component2 = component(init8, update9, view9, toList([
    on_attribute_change("orientation", (value3) => {
      if (value3 === "vertical") {
        return new Ok(new ParentSetOrientation2(new Vertical2));
      } else {
        return new Ok(new ParentSetOrientation2(new Horizontal2));
      }
    }),
    on_attribute_change("loop", (_) => {
      return new Ok(new ParentToggledLoop2);
    }),
    on_attribute_change("mode", (value3) => {
      if (value3 === "manual") {
        return new Ok(new ParentSetMode(new Manual));
      } else {
        return new Ok(new ParentSetMode(new Automatic));
      }
    })
  ]));
  return make_component(component2, tag9);
}

// build/dev/javascript/lustre_ui/lustre/ui/tabs/panel.mjs
class Model9 extends CustomType {
  constructor(name3, id3, context) {
    super();
    this.name = name3;
    this.id = id3;
    this.context = context;
  }
}

class ParentRemovedId2 extends CustomType {
}

class ParentRemovedName2 extends CustomType {
}

class ParentSetId3 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class ParentSetName3 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class TabsProvidedContext4 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}
var tag10 = "lustre-tabs-panel";
function on_identify3(handler2) {
  return on("tabs/panel:identify", subfield(toList(["detail", "previous_name"]), optional(string2), (previous_name) => {
    return subfield(toList(["detail", "name"]), string2, (name3) => {
      return subfield(toList(["detail", "id"]), string2, (id3) => {
        return success(handler2(previous_name, name3, id3));
      });
    });
  }));
}
function emit_identify3(previous_name, name3, id3) {
  return emit2("tabs/panel:identify", object2(toList([
    [
      "previous_name",
      (() => {
        if (previous_name instanceof Some) {
          let name$1 = previous_name[0];
          return string3(name$1);
        } else {
          return null$();
        }
      })()
    ],
    ["name", string3(name3)],
    ["id", string3(id3)]
  ])));
}
function emit_open(name3) {
  return emit2("tabs/panel:open", object2(toList([["name", string3(name3)]])));
}
function emit_close(name3) {
  return emit2("tabs/panel:close", object2(toList([["name", string3(name3)]])));
}
function view10(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: block;
      }
      `),
    slot(toList([]), toList([]))
  ]));
}
function update10(model, message) {
  if (message instanceof ParentRemovedId2) {
    let model$1 = new Model9(model.name, "", model.context);
    let effect = before_paint2((_, _1, component2) => {
      return id2(component2, new$6(6));
    });
    return [model$1, effect];
  } else if (message instanceof ParentRemovedName2) {
    let model$1 = new Model9("", model.id, model.context);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentSetId3) {
    let value3 = message.value;
    let model$1 = new Model9(model.name, value3, model.context);
    let effect = emit_identify3(new None, model$1.name, model$1.id);
    return [model$1, effect];
  } else if (message instanceof ParentSetName3) {
    let value3 = message.value;
    let _block;
    let $ = model.name;
    if ($ === "") {
      _block = new None;
    } else {
      let name3 = $;
      if (name3 === value3) {
        _block = new None;
      } else {
        let name4 = $;
        _block = new Some(name4);
      }
    }
    let prev = _block;
    let model$1 = new Model9(value3, model.id, model.context);
    let effect = emit_identify3(prev, model$1.name, model$1.id);
    return [model$1, effect];
  } else {
    let context = message.value;
    let prev = model.context.active;
    let _block;
    let $1 = context.active;
    if (prev instanceof Some) {
      if ($1 instanceof Some) {
        let old = prev[0];
        if (old.name === model.name) {
          let new$10 = $1[0];
          _block = [false, !isEqual(old, new$10)];
        } else {
          let new$10 = $1[0];
          if (new$10.name === model.name) {
            let old2 = prev[0];
            _block = [!isEqual(old2, new$10), false];
          } else {
            _block = [false, false];
          }
        }
      } else {
        let old = prev[0];
        _block = [false, old.name === model.name];
      }
    } else if ($1 instanceof Some) {
      let new$10 = $1[0];
      _block = [new$10.name === model.name, false];
    } else {
      _block = [false, false];
    }
    let $ = _block;
    let did_open;
    let did_close;
    did_open = $[0];
    did_close = $[1];
    let model$1 = new Model9(model.name, model.id, context);
    let effect = batch(toList([
      before_paint2((_, _1, component2) => {
        let $2 = get(context.all, model$1.name);
        if ($2 instanceof Ok) {
          let tab = $2[0];
          return aria_labelledby(component2, toList([tab.trigger]));
        } else {
          return;
        }
      }),
      before_paint2((_, _1, component2) => {
        return guard(!did_open, undefined, () => {
          let first_tabbable_child = findFirstDescendant(component2, true, (element8) => {
            let $2 = is_tabbable(element8);
            if ($2) {
              return new Accept;
            } else {
              return new Skip;
            }
          });
          return tabbable(component2, is_error(first_tabbable_child));
        });
      }),
      batch((() => {
        if (did_open) {
          return toList([
            emit_open(model$1.name),
            set_pseudo_state2("active")
          ]);
        } else {
          return toList([]);
        }
      })()),
      batch((() => {
        if (did_close) {
          return toList([
            emit_close(model$1.name),
            remove_pseudo_state2("active")
          ]);
        } else {
          return toList([]);
        }
      })())
    ]));
    return [model$1, effect];
  }
}
function init9(_) {
  let model = new Model9("", "", new$9());
  let effect = before_paint2((_2, _1, component2) => {
    ensure_id(component2);
    return role(component2, "tabpanel");
  });
  return [model, effect];
}
function register10() {
  let component2 = component(init9, update10, view10, toList([
    on_change2((var0) => {
      return new TabsProvidedContext4(var0);
    }),
    on_attribute_change("id", (value3) => {
      if (value3 === "") {
        return new Ok(new ParentRemovedId2);
      } else {
        let id3 = value3;
        return new Ok(new ParentSetId3(id3));
      }
    }),
    on_attribute_change("slot", (value3) => {
      if (value3 === "") {
        return new Ok(new ParentRemovedName2);
      } else {
        let name3 = value3;
        return new Ok(new ParentSetName3(name3));
      }
    })
  ]));
  return make_component(component2, tag10);
}

// build/dev/javascript/lustre_ui/lustre/ui/tabs/root.mjs
class Model10 extends CustomType {
  constructor(context, active) {
    super();
    this.context = context;
    this.active = active;
  }
}

class ParentSetDefaultValue2 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class ParentSetOrientation3 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class ParentSetValue2 extends CustomType {
  constructor(value3) {
    super();
    this.value = value3;
  }
}

class UserSelectedTab extends CustomType {
  constructor(name3) {
    super();
    this.name = name3;
  }
}

class UserSetPanelId2 extends CustomType {
  constructor(prev, name3, id3) {
    super();
    this.prev = prev;
    this.name = name3;
    this.id = id3;
  }
}

class UserSetTriggerId extends CustomType {
  constructor(prev, name3, id3) {
    super();
    this.prev = prev;
    this.name = name3;
    this.id = id3;
  }
}
var tag11 = "lustre-tabs";
function emit_change3(name3) {
  return emit2("tabs:change", object2(toList([["name", string3(name3)]])));
}
function view11(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: block;
      }
      `),
    default_slot(toList([
      on_select((var0) => {
        return new UserSelectedTab(var0);
      }),
      on_identify2((var0, var1, var2) => {
        return new UserSetTriggerId(var0, var1, var2);
      }),
      on_identify3((var0, var1, var2) => {
        return new UserSetPanelId2(var0, var1, var2);
      })
    ]), toList([]))
  ]));
}
function divert_focus2(name3) {
  return before_paint2((_, _1, component2) => {
    let $ = try$(activeElement(), (active) => {
      return try$(closest(active, tag7), (content) => {
        return guard(!contains2(component2, content), new Error(undefined), () => {
          return try$(querySelector(component2, (() => {
            let _pipe = '${list} > ${trigger}[name="${name}":not([aria-selected="true"])';
            let _pipe$1 = replace(_pipe, "${list}", tag9);
            let _pipe$2 = replace(_pipe$1, "${trigger}", tag8);
            return replace(_pipe$2, "${name}", name3);
          })()), (trigger2) => {
            return new Ok(focus(trigger2));
          });
        });
      });
    });
    return;
  });
}
function update11(model, message) {
  if (message instanceof ParentSetDefaultValue2) {
    let value$1 = message.value;
    let $ = model.active.controlled || model.active.touched;
    if ($) {
      return [model, none()];
    } else {
      let _block;
      let _record = model.active;
      _block = new Prop(new Some(value$1), _record.controlled, _record.touched);
      let active = _block;
      let _block$1;
      let $1 = get(model.context.all, value$1);
      if ($1 instanceof Ok) {
        let tab2 = $1[0];
        _block$1 = new Some(tab2);
      } else {
        _block$1 = new Some(new Tab(value$1, "", ""));
      }
      let tab = _block$1;
      let _block$2;
      let _record$1 = model.context;
      _block$2 = new Context(_record$1.orientation, tab, _record$1.all);
      let context = _block$2;
      let model$1 = new Model10(context, active);
      let effect = batch(toList([provide4(context), divert_focus2(value$1)]));
      return [model$1, effect];
    }
  } else if (message instanceof ParentSetOrientation3) {
    let value$1 = message.value;
    let _block;
    let _record = model.context;
    _block = new Context(value$1, _record.active, _record.all);
    let context = _block;
    let model$1 = new Model10(context, model.active);
    let effect = provide4(context);
    return [model$1, effect];
  } else if (message instanceof ParentSetValue2) {
    let value$1 = message.value;
    let _block;
    let _record = model.active;
    _block = new Prop(new Some(value$1), true, _record.touched);
    let active = _block;
    let _block$1;
    let $ = get(model.context.all, value$1);
    if ($ instanceof Ok) {
      let tab2 = $[0];
      _block$1 = new Some(tab2);
    } else {
      _block$1 = new Some(new Tab(value$1, "", ""));
    }
    let tab = _block$1;
    let _block$2;
    let _record$1 = model.context;
    _block$2 = new Context(_record$1.orientation, tab, _record$1.all);
    let context = _block$2;
    let model$1 = new Model10(context, active);
    let effect = batch(toList([provide4(context), divert_focus2(value$1)]));
    return [model$1, effect];
  } else if (message instanceof UserSelectedTab) {
    let name3 = message.name;
    return guard(isEqual(model.active.value, new Some(name3)), [model, none()], () => {
      return guard(model.active.controlled, [model, emit_change3(name3)], () => {
        let _block;
        let _record = model.active;
        _block = new Prop(new Some(name3), _record.controlled, true);
        let active = _block;
        let _block$1;
        let $ = get(model.context.all, name3);
        if ($ instanceof Ok) {
          let tab2 = $[0];
          _block$1 = new Some(tab2);
        } else {
          _block$1 = new Some(new Tab(name3, "", ""));
        }
        let tab = _block$1;
        let _block$2;
        let _record$1 = model.context;
        _block$2 = new Context(_record$1.orientation, tab, _record$1.all);
        let context = _block$2;
        let model$1 = new Model10(context, active);
        let effect = batch(toList([
          provide4(context),
          emit_change3(name3),
          divert_focus2(name3)
        ]));
        return [model$1, effect];
      });
    });
  } else if (message instanceof UserSetPanelId2) {
    let prev = message.prev;
    let name3 = message.name;
    let panel2 = message.id;
    let _block;
    let _pipe = prev;
    let _pipe$1 = to_result(_pipe, undefined);
    _block = try$(_pipe$1, (_capture) => {
      return get(model.context.all, _capture);
    });
    let prev$1 = _block;
    let _block$1;
    let $ = get(model.context.all, name3);
    if ($ instanceof Ok) {
      let tab = $[0];
      _block$1 = new Tab(tab.name, tab.trigger, panel2);
    } else if (prev$1 instanceof Ok) {
      let tab = prev$1[0];
      _block$1 = new Tab(tab.name, tab.trigger, panel2);
    } else {
      _block$1 = new Tab(name3, "", panel2);
    }
    let next = _block$1;
    let _block$2;
    if (prev$1 instanceof Ok) {
      let prev$2 = prev$1[0];
      let _pipe$2 = model.context.all;
      let _pipe$3 = delete$(_pipe$2, prev$2.name);
      _block$2 = insert(_pipe$3, name3, next);
    } else {
      let _pipe$2 = model.context.all;
      _block$2 = insert(_pipe$2, name3, next);
    }
    let all = _block$2;
    let _block$3;
    let $1 = model.context.active;
    if ($1 instanceof Some) {
      if (prev$1 instanceof Ok) {
        let tab = $1[0];
        let prev$2 = prev$1[0];
        if (tab.name === prev$2.name) {
          _block$3 = new None;
        } else {
          let tab2 = $1[0];
          if (tab2.name === name3) {
            _block$3 = new Some(next);
          } else {
            _block$3 = model.context.active;
          }
        }
      } else {
        let tab = $1[0];
        if (tab.name === name3) {
          _block$3 = new Some(next);
        } else {
          _block$3 = model.context.active;
        }
      }
    } else {
      _block$3 = model.context.active;
    }
    let active = _block$3;
    let _block$4;
    let _record = model.context;
    _block$4 = new Context(_record.orientation, active, all);
    let context = _block$4;
    let model$1 = new Model10(context, model.active);
    let effect = provide4(context);
    return [model$1, effect];
  } else {
    let prev = message.prev;
    let name3 = message.name;
    let trigger2 = message.id;
    let _block;
    let _pipe = prev;
    let _pipe$1 = to_result(_pipe, undefined);
    _block = try$(_pipe$1, (_capture) => {
      return get(model.context.all, _capture);
    });
    let prev$1 = _block;
    let _block$1;
    let $ = get(model.context.all, name3);
    if ($ instanceof Ok) {
      let tab = $[0];
      _block$1 = new Tab(tab.name, trigger2, tab.panel);
    } else if (prev$1 instanceof Ok) {
      let tab = prev$1[0];
      _block$1 = new Tab(tab.name, trigger2, tab.panel);
    } else {
      _block$1 = new Tab(name3, trigger2, "");
    }
    let next = _block$1;
    let _block$2;
    if (prev$1 instanceof Ok) {
      let prev$2 = prev$1[0];
      let _pipe$2 = model.context.all;
      let _pipe$3 = delete$(_pipe$2, prev$2.name);
      _block$2 = insert(_pipe$3, name3, next);
    } else {
      let _pipe$2 = model.context.all;
      _block$2 = insert(_pipe$2, name3, next);
    }
    let all = _block$2;
    let _block$3;
    let $1 = model.context.active;
    if ($1 instanceof Some) {
      if (prev$1 instanceof Ok) {
        let tab = $1[0];
        let prev$2 = prev$1[0];
        if (tab.name === prev$2.name) {
          _block$3 = new None;
        } else {
          let tab2 = $1[0];
          if (tab2.name === name3) {
            _block$3 = new Some(next);
          } else {
            _block$3 = model.context.active;
          }
        }
      } else {
        let tab = $1[0];
        if (tab.name === name3) {
          _block$3 = new Some(next);
        } else {
          _block$3 = model.context.active;
        }
      }
    } else {
      _block$3 = model.context.active;
    }
    let active = _block$3;
    let _block$4;
    let _record = model.context;
    _block$4 = new Context(_record.orientation, active, all);
    let context = _block$4;
    let model$1 = new Model10(context, model.active);
    let effect = provide4(context);
    return [model$1, effect];
  }
}
function init10(_) {
  let context = new$9();
  let model = new Model10(context, new Prop(new None, false, false));
  let effect = batch(toList([
    provide4(model.context),
    before_paint2((dispatch2, _2, component2) => {
      let $ = attribute3(component2, "value");
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 === "") {
          let _block;
          let _pipe = component2;
          let _pipe$1 = querySelector(_pipe, tag8 + '[name]:not([name=""])');
          _block = try$(_pipe$1, (_capture) => {
            return attribute3(_capture, "name");
          });
          let initial_tab = _block;
          if (initial_tab instanceof Ok) {
            let name3 = initial_tab[0];
            return dispatch2(new ParentSetDefaultValue2(name3));
          } else {
            return;
          }
        } else {
          return;
        }
      } else {
        let _block;
        let _pipe = component2;
        let _pipe$1 = querySelector(_pipe, tag8 + '[name]:not([name=""])');
        _block = try$(_pipe$1, (_capture) => {
          return attribute3(_capture, "name");
        });
        let initial_tab = _block;
        if (initial_tab instanceof Ok) {
          let name3 = initial_tab[0];
          return dispatch2(new ParentSetDefaultValue2(name3));
        } else {
          return;
        }
      }
    })
  ]));
  return [model, effect];
}
function register11() {
  let component2 = component(init10, update11, view11, toList([
    on_attribute_change("value", (value3) => {
      return new Ok(new ParentSetDefaultValue2(value3));
    }),
    on_attribute_change("orientation", (value3) => {
      if (value3 === "horizontal") {
        return new Ok(new ParentSetOrientation3(new Horizontal2));
      } else if (value3 === "vertical") {
        return new Ok(new ParentSetOrientation3(new Vertical2));
      } else {
        return new Ok(new ParentSetOrientation3(new Horizontal2));
      }
    }),
    on_property_change("value", (() => {
      let _pipe = string2;
      return map3(_pipe, (var0) => {
        return new ParentSetValue2(var0);
      });
    })())
  ]));
  return make_component(component2, tag11);
}

// build/dev/javascript/lustre_ui/lustre/ui/tabs/indicator.mjs
class Model11 extends CustomType {
  constructor(x, y, width, height) {
    super();
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
}

class TabsProvidedContext5 extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}

class TriggerProvidedBounds extends CustomType {
  constructor(left, top, width, height) {
    super();
    this.left = left;
    this.top = top;
    this.width = width;
    this.height = height;
  }
}
var tag12 = "lustre-tabs-indicator";
function view12(model) {
  return fragment2(toList([
    style(toList([]), (() => {
      let _pipe = `
      :host {
        display: inline;

        --indicator-x: \${x}px;
        --indicator-y: \${y}px;
        --indicator-width: \${width}px;
        --indicator-height: \${height}px;
      }
      `;
      let _pipe$1 = replace(_pipe, "${x}", float_to_string(model.x));
      let _pipe$2 = replace(_pipe$1, "${y}", float_to_string(model.y));
      let _pipe$3 = replace(_pipe$2, "${width}", float_to_string(model.width));
      return replace(_pipe$3, "${height}", float_to_string(model.height));
    })()),
    default_slot(toList([inert(true)]), toList([]))
  ]));
}
function update12(model, message) {
  if (message instanceof TabsProvidedContext5) {
    let $ = message[0].active;
    if ($ instanceof Some) {
      let active = $[0];
      let effect = before_paint2((dispatch2, _, component2) => {
        let result = try$(closest(component2, tag11), (root3) => {
          return try$((() => {
            let _pipe = querySelector(root3, tag9);
            return map4(_pipe, boundingClientRect);
          })(), (list4) => {
            let selector = tag8 + '[name="' + active.name + '"]';
            return try$((() => {
              let _pipe = querySelector(root3, selector);
              return map4(_pipe, boundingClientRect);
            })(), (trigger2) => {
              let x = trigger2[0] - list4[0];
              let y = trigger2[1] - list4[1];
              return new Ok([x, y, trigger2[2], trigger2[3]]);
            });
          });
        });
        if (result instanceof Ok) {
          let bounds = result[0];
          return dispatch2(new TriggerProvidedBounds(bounds[0], bounds[1], bounds[2], bounds[3]));
        } else {
          return;
        }
      });
      return [model, effect];
    } else {
      let model$1 = new Model11(0, 0, 0, 0);
      let effect = none();
      return [model$1, effect];
    }
  } else {
    let left = message.left;
    let top = message.top;
    let width = message.width;
    let height = message.height;
    let model$1 = new Model11(left, top, width, height);
    let effect = none();
    return [model$1, effect];
  }
}
function init11(_) {
  let model = new Model11(0, 0, 0, 0);
  let effect = before_paint2((_2, _1, component2) => {
    return role(component2, "presentation");
  });
  return [model, effect];
}
function register12() {
  let component2 = component(init11, update12, view12, toList([
    on_change2((var0) => {
      return new TabsProvidedContext5(var0);
    })
  ]));
  return make_component(component2, tag12);
}

// build/dev/javascript/lustre_ui/lustre/ui/tabs.mjs
function register13() {
  return try$(register11(), (_) => {
    return try$(register9(), (_2) => {
      return try$(register8(), (_3) => {
        return try$(register12(), (_4) => {
          return try$(register7(), (_5) => {
            return try$(register10(), (_6) => {
              return new Ok(undefined);
            });
          });
        });
      });
    });
  });
}

// build/dev/javascript/lustre_ui/lustre/ui/toggle/context.mjs
class GroupContext extends CustomType {
  constructor(value4, disabled) {
    super();
    this.value = value4;
    this.disabled = disabled;
  }
}
function on_group_change(handler2) {
  return on_context_change("toggle/group", field("value", optional(string2), (value4) => {
    return field("disabled", bool, (disabled) => {
      return success(handler2(new GroupContext(value4, disabled)));
    });
  }));
}
function provide_group(value4, disabled) {
  return provide("toggle/group", object2(toList([
    [
      "value",
      (() => {
        if (value4 instanceof Some) {
          let v = value4[0];
          return string3(v);
        } else {
          return null$();
        }
      })()
    ],
    ["disabled", bool2(disabled)]
  ])));
}

// build/dev/javascript/lustre_ui/lustre/ui/toggle/group.mjs
class Model12 extends CustomType {
  constructor(value4, disabled, orientation3, loop3) {
    super();
    this.value = value4;
    this.disabled = disabled;
    this.orientation = orientation3;
    this.loop = loop3;
  }
}

class Horizontal3 extends CustomType {
}

class Vertical3 extends CustomType {
}

class ParentSetDefaultValue3 extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}

class ParentSetDisabled extends CustomType {
}

class ParentSetLoop2 extends CustomType {
}

class ParentSetOrientation4 extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}

class ParentSetValue3 extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}

class ParentToggledDisabled extends CustomType {
}

class ParentToggledLoop3 extends CustomType {
}

class UserNavigatedFocus3 extends CustomType {
  constructor(next) {
    super();
    this.next = next;
  }
}

class UserToggledItem2 extends CustomType {
  constructor(value4, pressed) {
    super();
    this.value = value4;
    this.pressed = pressed;
  }
}
var tag13 = "lustre-toggle-group";
function emit_change4(value4) {
  return emit2("toggle/group:change", (() => {
    if (value4 instanceof Some) {
      let v = value4[0];
      return string3(v);
    } else {
      return null$();
    }
  })());
}
function handle_keydown3(orientation3, loop3) {
  return field("key", string2, (key) => {
    return field("currentTarget", then$(decoder(), (slot3) => {
      let $ = host(slot3);
      if ($ instanceof Ok) {
        let element$1 = $[0];
        return success(element$1);
      } else {
        return failure(nil(), "");
      }
    }), (group2) => {
      return field("target", then$(decoder(), (target) => {
        let $ = closest(target, "lustre-toggle");
        if ($ instanceof Ok) {
          let element$1 = $[0];
          return success(element$1);
        } else {
          return failure(nil(), "");
        }
      }), (trigger2) => {
        let selector = (element12) => {
          let $ = tag(element12);
          if ($ === "lustre-toggle") {
            return new Accept;
          } else {
            return new Skip;
          }
        };
        let _block;
        if (orientation3 instanceof Horizontal3) {
          if (key === "ArrowLeft") {
            _block = previous_descendant(group2, trigger2, false, loop3, selector);
          } else if (key === "ArrowRight") {
            _block = next_descendant(group2, trigger2, false, loop3, selector);
          } else {
            _block = new Error(undefined);
          }
        } else if (key === "ArrowUp") {
          _block = previous_descendant(group2, trigger2, false, loop3, selector);
        } else if (key === "ArrowDown") {
          _block = next_descendant(group2, trigger2, false, loop3, selector);
        } else {
          _block = new Error(undefined);
        }
        let result = _block;
        return then$((() => {
          if (result instanceof Ok) {
            let element$1 = result[0];
            return success(element$1);
          } else {
            return failure(nil(), "");
          }
        })(), (next) => {
          return success(handler(new UserNavigatedFocus3(next), true, true));
        });
      });
    });
  });
}
function view13(model) {
  let handle_press = field("target", decoder(), (target) => {
    return field("detail", bool, (pressed) => {
      let $ = attribute3(target, "value");
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 === "") {
          return failure(new UserToggledItem2("", pressed), "");
        } else {
          let value$1 = $1;
          return success(new UserToggledItem2(value$1, pressed));
        }
      } else {
        return failure(new UserToggledItem2("", pressed), "");
      }
    });
  });
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: inline;
      }
      `),
    default_slot(toList([
      on("toggle:press", handle_press),
      advanced("keydown", handle_keydown3(model.orientation, model.loop))
    ]), toList([]))
  ]));
}
function update13(model, message) {
  if (message instanceof ParentSetDefaultValue3) {
    let value$1 = message[0];
    let $ = model.value.controlled || model.value.touched;
    if ($) {
      return [model, none()];
    } else {
      let value$2 = default$(model.value, value$1);
      let model$1 = new Model12(value$2, model.disabled, model.orientation, model.loop);
      let effect = none();
      return [model$1, effect];
    }
  } else if (message instanceof ParentSetDisabled) {
    let model$1 = new Model12(model.value, true, model.orientation, model.loop);
    let effect = batch(toList([
      toggle_psuedo_state("disabled", model$1.disabled),
      provide_group(model$1.value.value, model$1.disabled)
    ]));
    return [model$1, effect];
  } else if (message instanceof ParentSetLoop2) {
    let model$1 = new Model12(model.value, model.disabled, model.orientation, true);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentSetOrientation4) {
    let value$1 = message[0];
    let model$1 = new Model12(model.value, model.disabled, value$1, model.loop);
    let effect = before_paint2((_, _1, component2) => {
      return aria_orientation(component2, (() => {
        if (value$1 instanceof Horizontal3) {
          return "horizontal";
        } else {
          return "vertical";
        }
      })());
    });
    return [model$1, effect];
  } else if (message instanceof ParentSetValue3) {
    let value$1 = message[0];
    let value$2 = control(model.value, value$1);
    let model$1 = new Model12(value$2, model.disabled, model.orientation, model.loop);
    let _block;
    let $ = value$2.value;
    if ($ instanceof Some) {
      let v = $[0];
      _block = batch(toList([
        provide_group(value$2.value, model$1.disabled),
        set_form_value2(v)
      ]));
    } else {
      _block = batch(toList([
        provide_group(value$2.value, model$1.disabled),
        clear_form_value2()
      ]));
    }
    let effect = _block;
    return [model$1, effect];
  } else if (message instanceof ParentToggledDisabled) {
    let model$1 = new Model12(model.value, !model.disabled, model.orientation, model.loop);
    let effect = batch(toList([
      toggle_psuedo_state("disabled", model$1.disabled),
      provide_group(model$1.value.value, model$1.disabled)
    ]));
    return [model$1, effect];
  } else if (message instanceof ParentToggledLoop3) {
    let model$1 = new Model12(model.value, model.disabled, model.orientation, !model.loop);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof UserNavigatedFocus3) {
    let next = message.next;
    let effect = focus2(next);
    return [model, effect];
  } else {
    let value$1 = message.value;
    let pressed = message.pressed;
    let _block;
    if (pressed) {
      _block = new Some(value$1);
    } else {
      _block = new None;
    }
    let next = _block;
    return guard(model.value.controlled, [model, emit_change4(next)], () => {
      let model$1 = new Model12(touch(model.value, next), model.disabled, model.orientation, model.loop);
      let effect = batch(toList([
        provide_group(next, model$1.disabled),
        emit_change4(next),
        (() => {
          if (next instanceof Some) {
            let v = next[0];
            return set_form_value2(v);
          } else {
            return clear_form_value2();
          }
        })()
      ]));
      return [model$1, effect];
    });
  }
}
function init12(_) {
  let model = new Model12(new$8(new None), false, new Horizontal3, false);
  let effect = batch(toList([
    provide_group(model.value.value, model.disabled),
    before_paint2((_2, _1, component2) => {
      role(component2, "group");
      let $ = attribute3(component2, "orientation");
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 === "horizontal") {
          let orientation$1 = $1;
          return aria_orientation(component2, orientation$1);
        } else if ($1 === "vertical") {
          let orientation$1 = $1;
          return aria_orientation(component2, orientation$1);
        } else {
          return aria_orientation(component2, "horizontal");
        }
      } else {
        return aria_orientation(component2, "horizontal");
      }
    })
  ]));
  return [model, effect];
}
function register14() {
  let component2 = component(init12, update13, view13, toList([
    adopt_styles(false),
    form_associated(),
    on_attribute_change("disabled", (value4) => {
      if (value4 === "") {
        return new Ok(new ParentToggledDisabled);
      } else {
        return new Ok(new ParentSetDisabled);
      }
    }),
    on_attribute_change("loop", (value4) => {
      if (value4 === "") {
        return new Ok(new ParentToggledLoop3);
      } else {
        return new Ok(new ParentSetLoop2);
      }
    }),
    on_attribute_change("orientation", (value4) => {
      if (value4 === "horizontal") {
        return new Ok(new ParentSetOrientation4(new Horizontal3));
      } else if (value4 === "vertical") {
        return new Ok(new ParentSetOrientation4(new Vertical3));
      } else if (value4 === "") {
        return new Ok(new ParentSetOrientation4(new Vertical3));
      } else {
        return new Error(undefined);
      }
    }),
    on_attribute_change("value", (value4) => {
      if (value4 === "") {
        return new Ok(new ParentSetDefaultValue3(new None));
      } else {
        return new Ok(new ParentSetDefaultValue3(new Some(value4)));
      }
    }),
    on_property_change("value", then$(optional(string2), (value4) => {
      if (value4 instanceof Some) {
        let $ = value4[0];
        if ($ === "") {
          return success(new ParentSetValue3(new None));
        } else {
          return success(new ParentSetValue3(value4));
        }
      } else {
        return success(new ParentSetValue3(value4));
      }
    }))
  ]));
  return make_component(component2, tag13);
}

// build/dev/javascript/lustre_ui/lustre/ui/toggle/root.mjs
class Model13 extends CustomType {
  constructor(pressed, value4, disabled) {
    super();
    this.pressed = pressed;
    this.value = value4;
    this.disabled = disabled;
  }
}

class ParentRemovedTabindex extends CustomType {
}

class ParentSetDefaultPressed extends CustomType {
  constructor(value4) {
    super();
    this.value = value4;
  }
}

class ParentSetDisabled2 extends CustomType {
}

class ParentSetPressed extends CustomType {
  constructor(value4) {
    super();
    this.value = value4;
  }
}

class ParentSetValue4 extends CustomType {
  constructor(value4) {
    super();
    this.value = value4;
  }
}

class ParentToggledDefaultPressed extends CustomType {
}

class ParentToggledDisabled2 extends CustomType {
}

class ToggleGroupProvidedContext extends CustomType {
  constructor(context) {
    super();
    this.context = context;
  }
}

class UserPressedToggle extends CustomType {
}
var tag14 = "lustre-toggle";
function emit_press(pressed) {
  return emit2("toggle:press", bool2(pressed));
}
function view14(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: inline;
        cursor: default;
        user-select: none;
        -webkit-user-select: none;
      }
      `),
    default_slot(toList([]), toList([]))
  ]));
}
function update14(model, message) {
  if (message instanceof ParentRemovedTabindex) {
    let effect = before_paint2((_, _1, component2) => {
      return tabindex(component2, 0);
    });
    return [model, effect];
  } else if (message instanceof ParentSetDefaultPressed) {
    let value$1 = message.value;
    let pressed$1 = default$(model.pressed, value$1);
    let did_change = pressed$1.value !== model.pressed.value;
    return guard(!did_change, [model, none()], () => {
      let model$1 = new Model13(pressed$1, model.value, model.disabled);
      let _block;
      let $ = model$1.pressed.value;
      if ($) {
        _block = batch(toList([
          set_form_value2(model$1.value),
          set_pseudo_state2("pressed"),
          before_paint2((_, _1, component2) => {
            return aria_pressed(component2, true);
          })
        ]));
      } else {
        _block = batch(toList([
          clear_form_value2(),
          remove_pseudo_state2("pressed"),
          before_paint2((_, _1, component2) => {
            return aria_pressed(component2, false);
          })
        ]));
      }
      let effect = _block;
      return [model$1, effect];
    });
  } else if (message instanceof ParentSetDisabled2) {
    let disabled$1 = control(model.disabled, true);
    let model$1 = new Model13(model.pressed, model.value, disabled$1);
    let effect = batch(toList([
      before_paint2((_, _1, component2) => {
        return aria_disabled(component2, model$1.disabled.value);
      }),
      toggle_psuedo_state("disabled", model$1.disabled.value)
    ]));
    return [model$1, effect];
  } else if (message instanceof ParentSetPressed) {
    let value$1 = message.value;
    let pressed$1 = control(model.pressed, value$1);
    let did_change = pressed$1.value !== model.pressed.value;
    let model$1 = new Model13(pressed$1, model.value, model.disabled);
    return guard(!did_change, [model$1, none()], () => {
      let _block;
      if (value$1) {
        _block = batch(toList([
          set_form_value2(model$1.value),
          set_pseudo_state2("pressed"),
          before_paint2((_, _1, component2) => {
            return aria_pressed(component2, true);
          })
        ]));
      } else {
        _block = batch(toList([
          clear_form_value2(),
          remove_pseudo_state2("pressed"),
          before_paint2((_, _1, component2) => {
            return aria_pressed(component2, false);
          })
        ]));
      }
      let effect = _block;
      return [model$1, effect];
    });
  } else if (message instanceof ParentSetValue4) {
    let value$1 = message.value;
    let model$1 = new Model13(model.pressed, value$1, model.disabled);
    let _block;
    let $ = model$1.pressed.value;
    if ($) {
      _block = set_form_value2(value$1);
    } else {
      _block = none();
    }
    let effect = _block;
    return [model$1, effect];
  } else if (message instanceof ParentToggledDefaultPressed) {
    let pressed$1 = default$(model.pressed, !model.pressed.value);
    let did_change = pressed$1.value !== model.pressed.value;
    return guard(!did_change, [model, none()], () => {
      let model$1 = new Model13(pressed$1, model.value, model.disabled);
      let _block;
      let $ = model$1.pressed.value;
      if ($) {
        _block = batch(toList([
          set_form_value2(model$1.value),
          set_pseudo_state2("pressed"),
          before_paint2((_, _1, component2) => {
            return aria_pressed(component2, true);
          })
        ]));
      } else {
        _block = batch(toList([
          clear_form_value2(),
          remove_pseudo_state2("pressed"),
          before_paint2((_, _1, component2) => {
            return aria_pressed(component2, false);
          })
        ]));
      }
      let effect = _block;
      return [model$1, effect];
    });
  } else if (message instanceof ParentToggledDisabled2) {
    let disabled$1 = control(model.disabled, !model.disabled.value);
    let model$1 = new Model13(model.pressed, model.value, disabled$1);
    let effect = batch(toList([
      before_paint2((_, _1, component2) => {
        return aria_disabled(component2, model$1.disabled.value);
      }),
      toggle_psuedo_state("disabled", model$1.disabled.value)
    ]));
    return [model$1, effect];
  } else if (message instanceof ToggleGroupProvidedContext) {
    if (model.pressed.controlled) {
      return [model, none()];
    } else {
      let context = message.context;
      let pressed$1 = touch(model.pressed, isEqual(context.value, new Some(model.value)));
      let disabled$1 = touch(model.disabled, context.disabled);
      let model$1 = new Model13(pressed$1, model.value, disabled$1);
      let effect = batch(toList([
        toggle_psuedo_state("pressed", model$1.pressed.value),
        before_paint2((_, _1, component2) => {
          aria_disabled(component2, model$1.disabled.value);
          aria_pressed(component2, model$1.pressed.value);
          return tabindex(component2, (() => {
            let $ = model$1.pressed.value;
            if ($) {
              return 0;
            } else if (context.value instanceof None) {
              return 0;
            } else {
              return -1;
            }
          })());
        }),
        toggle_psuedo_state("disabled", model$1.disabled.value)
      ]));
      return [model$1, effect];
    }
  } else if (model.disabled.value) {
    return [model, none()];
  } else if (model.pressed.controlled) {
    let effect = emit_press(!model.pressed.value);
    return [model, effect];
  } else {
    let pressed$1 = touch(model.pressed, !model.pressed.value);
    return guard(pressed$1.controlled, [model, emit_press(pressed$1.value)], () => {
      let model$1 = new Model13(pressed$1, model.value, model.disabled);
      let _block;
      let $ = model$1.pressed.value;
      if ($) {
        _block = batch(toList([
          emit_press(true),
          set_form_value2(model$1.value),
          set_pseudo_state2("pressed"),
          before_paint2((_, _1, component2) => {
            return aria_pressed(component2, true);
          })
        ]));
      } else {
        _block = batch(toList([
          emit_press(false),
          clear_form_value2(),
          remove_pseudo_state2("pressed"),
          before_paint2((_, _1, component2) => {
            return aria_pressed(component2, false);
          })
        ]));
      }
      let effect = _block;
      return [model$1, effect];
    });
  }
}
function init13(_) {
  let model = new Model13(new$8(false), "on", new$8(false));
  let effect = before_paint2((dispatch2, _2, component2) => {
    aria_pressed(component2, false);
    role(component2, "button");
    tabindex(component2, 0);
    addEventListener2(component2, "click", (_3) => {
      return dispatch2(new UserPressedToggle);
    });
    return addEventListener2(component2, "keydown", (event4) => {
      let $ = run(event4, at(toList(["key"]), string2));
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 === "Enter") {
          preventDefault(event4);
          return dispatch2(new UserPressedToggle);
        } else if ($1 === " ") {
          preventDefault(event4);
          return dispatch2(new UserPressedToggle);
        } else {
          return;
        }
      } else {
        return;
      }
    });
  });
  return [model, effect];
}
function register15() {
  let component2 = component(init13, update14, view14, toList([
    adopt_styles(false),
    form_associated(),
    on_group_change((var0) => {
      return new ToggleGroupProvidedContext(var0);
    }),
    on_attribute_change("disabled", (value4) => {
      if (value4 === "") {
        return new Ok(new ParentToggledDisabled2);
      } else {
        return new Ok(new ParentSetDisabled2);
      }
    }),
    on_attribute_change("pressed", (value4) => {
      if (value4 === "") {
        return new Ok(new ParentToggledDefaultPressed);
      } else {
        return new Ok(new ParentSetDefaultPressed(true));
      }
    }),
    on_attribute_change("tabindex", (value4) => {
      if (value4 === "") {
        return new Ok(new ParentRemovedTabindex);
      } else {
        return new Error(undefined);
      }
    }),
    on_attribute_change("value", (value4) => {
      if (value4 === "") {
        return new Ok(new ParentSetValue4("on"));
      } else {
        return new Ok(new ParentSetValue4(value4));
      }
    }),
    on_property_change("pressed", (() => {
      let _pipe = bool;
      return map3(_pipe, (var0) => {
        return new ParentSetPressed(var0);
      });
    })())
  ]));
  return make_component(component2, tag14);
}

// build/dev/javascript/lustre_ui/lustre/ui/toggle.mjs
function register16() {
  return try$(register15(), (_) => {
    return try$(register14(), (_2) => {
      return new Ok(undefined);
    });
  });
}

// build/dev/javascript/lustre_ui/lustre/ui/tooltip/context.mjs
class Context2 extends CustomType {
  constructor(popover, open2, delay) {
    super();
    this.popover = popover;
    this.open = open2;
    this.delay = delay;
  }
}
function provide5(popover, open2, delay) {
  return provide("tooltip", object2(toList([
    ["popover", string3(popover)],
    ["open", bool2(open2)],
    ["delay", int3(delay)]
  ])));
}
function on_change4(handler2) {
  return on_context_change("tooltip", field("popover", string2, (popover) => {
    return field("open", bool, (open2) => {
      return field("delay", int2, (delay) => {
        return success(handler2(new Context2(popover, open2, delay)));
      });
    });
  }));
}

// build/dev/javascript/lustre_ui/lustre_ui/vendor/floating_ui/utils.ffi.mjs
var min2 = Math.min;
var max2 = Math.max;
var round3 = Math.round;
var createCoords = (v) => ({
  x: v,
  y: v
});
var oppositeSideMap = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
var oppositeAlignmentMap = {
  start: "end",
  end: "start"
};
function clamp2(start5, value5, end) {
  return max2(start5, min2(value5, end));
}
function evaluate(value5, param) {
  return typeof value5 === "function" ? value5(param) : value5;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
var yAxisSides = /* @__PURE__ */ new Set(["top", "bottom"]);
function getSideAxis(placement) {
  return yAxisSides.has(getSide(placement)) ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === undefined) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length2 = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length2] > rects.floating[length2]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [
    getOppositeAlignmentPlacement(placement),
    oppositePlacement,
    getOppositeAlignmentPlacement(oppositePlacement)
  ];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.replace(/start|end/g, (alignment) => oppositeAlignmentMap[alignment]);
}
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
  switch (side) {
    case "top":
    case "bottom":
      if (rtl)
        return isStart ? rlPlacement : lrPlacement;
      return isStart ? lrPlacement : rlPlacement;
    case "left":
    case "right":
      return isStart ? tbPlacement : btPlacement;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list4 = getSideList(getSide(placement), direction === "start", rtl);
  if (alignment) {
    list4 = list4.map((side) => side + "-" + alignment);
    if (flipAlignment) {
      list4 = list4.concat(list4.map(getOppositeAlignmentPlacement));
    }
  }
  return list4;
}
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, (side) => oppositeSideMap[side]);
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const { x, y, width, height } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

// build/dev/javascript/lustre_ui/lustre_ui/vendor/floating_ui/core.ffi.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let { reference, floating } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case "start":
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case "end":
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}
var computePosition = async (reference, floating, config2) => {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform
  } = config2;
  const validMiddleware = middleware.filter(Boolean);
  const rtl = await (platform.isRTL == null ? undefined : platform.isRTL(floating));
  let rects = await platform.getElementRects({
    reference,
    floating,
    strategy
  });
  let { x, y } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let middlewareData = {};
  let resetCount = 0;
  for (let i = 0;i < validMiddleware.length; i++) {
    const { name: name4, fn } = validMiddleware[i];
    const {
      x: nextX,
      y: nextY,
      data: data2,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData = {
      ...middlewareData,
      [name4]: {
        ...middlewareData[name4],
        ...data2
      }
    };
    if (reset && resetCount <= 50) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({ x, y } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === undefined) {
    options = {};
  }
  const { x, y, platform, rects, elements, strategy } = state;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element13 = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform.getClippingRect({
    element: ((_await$platform$isEle = await (platform.isElement == null ? undefined : platform.isElement(element13))) != null ? _await$platform$isEle : true) ? element13 : element13.contextElement || await (platform.getDocumentElement == null ? undefined : platform.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform.getOffsetParent == null ? undefined : platform.getOffsetParent(elements.floating));
  const offsetScale = await (platform.isElement == null ? undefined : platform.isElement(offsetParent)) ? await (platform.getScale == null ? undefined : platform.getScale(offsetParent)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
var flip = function(options) {
  if (options === undefined) {
    options = {};
  }
  return {
    name: "flip",
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = "bestFit",
        fallbackAxisSideDirection = "none",
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform.isRTL == null ? undefined : platform.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements2 = [initialPlacement, ...fallbackPlacements];
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? undefined : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides2 = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
      }
      overflowsData = [
        ...overflowsData,
        {
          placement,
          overflows
        }
      ];
      if (!overflows.every((side2) => side2 <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? undefined : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements2[nextIndex];
        if (nextPlacement) {
          const ignoreCrossAxisOverflow = checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false;
          if (!ignoreCrossAxisOverflow || overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) {
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }
        }
        let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a2, b) => a2.overflows[1] - b.overflows[1])[0]) == null ? undefined : _overflowsData$filter.placement;
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case "bestFit": {
              var _overflowsData$filter2;
              const placement2 = (_overflowsData$filter2 = overflowsData.filter((d) => {
                if (hasFallbackAxisSideDirection) {
                  const currentSideAxis = getSideAxis(d.placement);
                  return currentSideAxis === initialSideAxis || currentSideAxis === "y";
                }
                return true;
              }).map((d) => [
                d.placement,
                d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)
              ]).sort((a2, b) => a2[1] - b[1])[0]) == null ? undefined : _overflowsData$filter2[0];
              if (placement2) {
                resetPlacement = placement2;
              }
              break;
            }
            case "initialPlacement":
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};
var originSides = /* @__PURE__ */ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
  const { placement, platform, elements } = state;
  const rtl = await (platform.isRTL == null ? undefined : platform.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = originSides.has(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);
  let { mainAxis, crossAxis, alignmentAxis } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
var offset = function(options) {
  if (options === undefined) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const { x, y, placement, middlewareData } = state;
      const diffCoords = await convertValueToCoords(state, options);
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? undefined : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};
var shift = function(options) {
  if (options === undefined) {
    options = {};
  }
  return {
    name: "shift",
    options,
    async fn(state) {
      const { x, y, placement } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: (_ref) => {
            let { x: x2, y: y2 } = _ref;
            return {
              x: x2,
              y: y2
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(getSide(placement));
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      if (checkMainAxis) {
        const minSide = mainAxis === "y" ? "top" : "left";
        const maxSide = mainAxis === "y" ? "bottom" : "right";
        const min3 = mainAxisCoord + overflow[minSide];
        const max3 = mainAxisCoord - overflow[maxSide];
        mainAxisCoord = clamp2(min3, mainAxisCoord, max3);
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === "y" ? "top" : "left";
        const maxSide = crossAxis === "y" ? "bottom" : "right";
        const min3 = crossAxisCoord + overflow[minSide];
        const max3 = crossAxisCoord - overflow[maxSide];
        crossAxisCoord = clamp2(min3, crossAxisCoord, max3);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
};

// build/dev/javascript/lustre_ui/lustre_ui/vendor/floating_ui/dom-utils.ffi.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? undefined : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? undefined : _ref.documentElement;
}
function isNode(value5) {
  if (!hasWindow()) {
    return false;
  }
  return value5 instanceof Node || value5 instanceof getWindow(value5).Node;
}
function isElement(value5) {
  if (!hasWindow()) {
    return false;
  }
  return value5 instanceof Element || value5 instanceof getWindow(value5).Element;
}
function isHTMLElement(value5) {
  if (!hasWindow()) {
    return false;
  }
  return value5 instanceof HTMLElement || value5 instanceof getWindow(value5).HTMLElement;
}
function isShadowRoot2(value5) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value5 instanceof ShadowRoot || value5 instanceof getWindow(value5).ShadowRoot;
}
var invalidOverflowDisplayValues = /* @__PURE__ */ new Set([
  "inline",
  "contents"
]);
function isOverflowElement(element13) {
  const { overflow, overflowX, overflowY, display } = getComputedStyle2(element13);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !invalidOverflowDisplayValues.has(display);
}
var tableElements = /* @__PURE__ */ new Set(["table", "td", "th"]);
function isTableElement(element13) {
  return tableElements.has(getNodeName(element13));
}
var topLayerSelectors = [":popover-open", ":modal"];
function isTopLayer(element13) {
  return topLayerSelectors.some((selector) => {
    try {
      return element13.matches(selector);
    } catch (_e) {
      return false;
    }
  });
}
var transformProperties = [
  "transform",
  "translate",
  "scale",
  "rotate",
  "perspective"
];
var willChangeValues = [
  "transform",
  "translate",
  "scale",
  "rotate",
  "perspective",
  "filter"
];
var containValues = ["paint", "layout", "strict", "content"];
function isContainingBlock(elementOrCss) {
  const webkit = isWebKit();
  const css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
  return transformProperties.some((value5) => css[value5] ? css[value5] !== "none" : false) || (css.containerType ? css.containerType !== "normal" : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== "none" : false) || !webkit && (css.filter ? css.filter !== "none" : false) || willChangeValues.some((value5) => (css.willChange || "").includes(value5)) || containValues.some((value5) => (css.contain || "").includes(value5));
}
function getContainingBlock(element13) {
  let currentNode = getParentNode(element13);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (typeof CSS === "undefined" || !CSS.supports)
    return false;
  return CSS.supports("-webkit-backdrop-filter", "none");
}
var lastTraversableNodeNames = /* @__PURE__ */ new Set([
  "html",
  "body",
  "#document"
]);
function isLastTraversableNode(node) {
  return lastTraversableNodeNames.has(getNodeName(node));
}
function getComputedStyle2(element13) {
  return getWindow(element13).getComputedStyle(element13);
}
function getNodeScroll(element13) {
  if (isElement(element13)) {
    return {
      scrollLeft: element13.scrollLeft,
      scrollTop: element13.scrollTop
    };
  }
  return {
    scrollLeft: element13.scrollX,
    scrollTop: element13.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = node.assignedSlot || node.parentNode || isShadowRoot2(node) && node.host || getDocumentElement(node);
  return isShadowRoot2(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list4, traverseIframes) {
  var _node$ownerDocument2;
  if (list4 === undefined) {
    list4 = [];
  }
  if (traverseIframes === undefined) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? undefined : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list4.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  }
  return list4.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

// build/dev/javascript/lustre_ui/lustre_ui/vendor/floating_ui/dom.ffi.mjs
function getCssDimensions(element13) {
  const css = getComputedStyle2(element13);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element13);
  const offsetWidth = hasOffset ? element13.offsetWidth : width;
  const offsetHeight = hasOffset ? element13.offsetHeight : height;
  const shouldFallback = round3(width) !== offsetWidth || round3(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element13) {
  return !isElement(element13) ? element13.contextElement : element13;
}
function getScale(element13) {
  const domElement = unwrapElement(element13);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const { width, height, $ } = getCssDimensions(domElement);
  let x = ($ ? round3(rect.width) : rect.width) / width;
  let y = ($ ? round3(rect.height) : rect.height) / height;
  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}
var noOffsets = /* @__PURE__ */ createCoords(0);
function getVisualOffsets(element13) {
  const win = getWindow(element13);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element13, isFixed, floatingOffsetParent) {
  if (isFixed === undefined) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element13)) {
    return false;
  }
  return isFixed;
}
function getBoundingClientRect(element13, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === undefined) {
    includeScale = false;
  }
  if (isFixedStrategy === undefined) {
    isFixedStrategy = false;
  }
  const clientRect = element13.getBoundingClientRect();
  const domElement = unwrapElement(element13);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element13);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle2(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}
function getWindowScrollBarX(element13, rect) {
  const leftScroll = getNodeScroll(element13).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element13)).left + leftScroll;
  }
  return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
  const y = htmlRect.top + scroll.scrollTop;
  return {
    x,
    y
  };
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let { elements, rect, offsetParent, strategy } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}
function getClientRects(element13) {
  return Array.from(element13.getClientRects());
}
function getDocumentRect(element13) {
  const html = getDocumentElement(element13);
  const scroll = getNodeScroll(element13);
  const body = element13.ownerDocument.body;
  const width = max2(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max2(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element13);
  const y = -scroll.scrollTop;
  if (getComputedStyle2(body).direction === "rtl") {
    x += max2(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element13, strategy) {
  const win = getWindow(element13);
  const html = getDocumentElement(element13);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html);
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument;
    const body = doc.body;
    const bodyStyles = getComputedStyle(body);
    const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
    const clippingStableScrollbarWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
    if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
      width -= clippingStableScrollbarWidth;
    }
  } else if (windowScrollbarX <= SCROLLBAR_MAX) {
    width += windowScrollbarX;
  }
  return {
    width,
    height,
    x,
    y
  };
}
var absoluteOrFixed = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function getInnerBoundingClientRect(element13, strategy) {
  const clientRect = getBoundingClientRect(element13, true, strategy === "fixed");
  const top = clientRect.top + element13.clientTop;
  const left = clientRect.left + element13.clientLeft;
  const scale = isHTMLElement(element13) ? getScale(element13) : createCoords(1);
  const width = element13.clientWidth * scale.x;
  const height = element13.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element13, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element13, strategy);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element13));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element13);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element13, stopNode) {
  const parentNode = getParentNode(element13);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle2(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
function getClippingElementAncestors(element13, cache) {
  const cachedResult = cache.get(element13);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element13, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle2(element13).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element13) : element13;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle2(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && absoluteOrFixed.has(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element13, currentNode);
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element13, result);
  return result;
}
function getClippingRect(_ref) {
  let { element: element13, boundary, rootBoundary, strategy } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element13) ? [] : getClippingElementAncestors(element13, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstClippingAncestor = clippingAncestors[0];
  const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
    const rect = getClientRectFromClippingAncestor(element13, clippingAncestor, strategy);
    accRect.top = max2(rect.top, accRect.top);
    accRect.right = min2(rect.right, accRect.right);
    accRect.bottom = min2(rect.bottom, accRect.bottom);
    accRect.left = max2(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromClippingAncestor(element13, firstClippingAncestor, strategy));
  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top
  };
}
function getDimensions(element13) {
  const { width, height } = getCssDimensions(element13);
  return {
    width,
    height
  };
}
function getRectRelativeToOffsetParent(element13, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element13, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  function setLeftRTLScrollbarOffset() {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      setLeftRTLScrollbarOffset();
    }
  }
  if (isFixed && !isOffsetParentAnElement && documentElement) {
    setLeftRTLScrollbarOffset();
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}
function isStaticPositioned(element13) {
  return getComputedStyle2(element13).position === "static";
}
function getTrueOffsetParent(element13, polyfill) {
  if (!isHTMLElement(element13) || getComputedStyle2(element13).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element13);
  }
  let rawOffsetParent = element13.offsetParent;
  if (getDocumentElement(element13) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}
function getOffsetParent(element13, polyfill) {
  const win = getWindow(element13);
  if (isTopLayer(element13)) {
    return win;
  }
  if (!isHTMLElement(element13)) {
    let svgOffsetParent = getParentNode(element13);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element13, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element13) || win;
}
var getElementRects = async function(data2) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data2.floating);
  return {
    reference: getRectRelativeToOffsetParent(data2.reference, await getOffsetParentFn(data2.floating), data2.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};
function isRTL(element13) {
  return getComputedStyle2(element13).direction === "rtl";
}
var platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
var offset2 = offset;
var shift2 = shift;
var flip2 = flip;
var computePosition2 = (reference, floating, options) => {
  const cache = new Map;
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

// build/dev/javascript/lustre_ui/lustre/ui/tooltip/popover.ffi.mjs
function showPopover(popover, offset3, side, align, dispatch2) {
  popover.showPopover();
  calculatePosition(popover, offset3, side, align, dispatch2, true);
}
function calculatePosition(popover, offset_amount, side, align, dispatch2, open2 = false) {
  const root3 = popover.closest("lustre-tooltip");
  const trigger2 = root3?.querySelector("lustre-tooltip-trigger");
  if (!root3 || !trigger2)
    return;
  if (!open2) {
    popover.showPopover();
  }
  const middleware = [offset2(offset_amount)];
  const flipMiddleware = flip2({
    crossAxis: "alignment",
    fallbackAxisSideDirection: "end"
  });
  const shiftMiddleware = shift2();
  if (align) {
    middleware.push(flipMiddleware, shiftMiddleware);
  } else {
    middleware.push(shiftMiddleware, flipMiddleware);
  }
  const placement = align ? `${side}-${align}` : side;
  computePosition2(trigger2, popover, { middleware, placement }).then(({ x, y }) => {
    dispatch2(x, y);
    if (!open2) {
      popover.hidePopover();
    }
  });
}
function hidePopover(popover) {
  Promise.all(popover.getAnimations().map((a2) => a2.finished)).then(() => popover.hidePopover()).catch(() => {});
}

// build/dev/javascript/lustre_ui/lustre/ui/tooltip/popover.mjs
class Model14 extends CustomType {
  constructor(open2, x, y, offset3, side, align) {
    super();
    this.open = open2;
    this.x = x;
    this.y = y;
    this.offset = offset3;
    this.side = side;
    this.align = align;
  }
}

class DomCalculatedPosition extends CustomType {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
}

class ParentResetAlign extends CustomType {
}

class ParentResetOffset extends CustomType {
}

class ParentResetSide extends CustomType {
}

class ParentSetAlign extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class ParentSetDefaultOpen2 extends CustomType {
}

class ParentSetId4 extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class ParentSetOffset extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class ParentSetOpen2 extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class ParentSetSide extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class ParentToggledDefaultOpen2 extends CustomType {
}

class TooltipProvidedContext extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}
var tag15 = "lustre-tooltip-popover";
var alignments = /* @__PURE__ */ toList(["start", "end"]);
var sides2 = /* @__PURE__ */ toList(["top", "right", "bottom", "left"]);
function element13(attributes, children) {
  return element2(tag15, attributes, children);
}
function side(value5) {
  return attribute2("side", value5);
}
function on_identify4(handler2) {
  return on("tooltip/popover:identify", field("detail", string2, (id3) => {
    return success(handler2(id3));
  }));
}
function emit_identify4(id3) {
  return emit2("tooltip/popover:identify", string3(id3));
}
function view15(model) {
  return fragment2(toList([
    style(toList([]), (() => {
      let _pipe = `
      :host {
        --tooltip-popover-x: \${x}px;
        --tooltip-popover-y: \${y}px;
      }
      `;
      let _pipe$1 = replace(_pipe, "${x}", float_to_string(model.x));
      return replace(_pipe$1, "${y}", float_to_string(model.y));
    })()),
    default_slot(toList([inert(true)]), toList([]))
  ]));
}
function hide_popover() {
  return after_paint2((_, _1, component2) => {
    return hidePopover(component2);
  });
}
function show_popover(offset3, side2, align) {
  return before_paint2((dispatch2, _, component2) => {
    return showPopover(component2, offset3, side2, unwrap(align, ""), (x, y) => {
      return dispatch2(new DomCalculatedPosition(x, y));
    });
  });
}
function remove_pseudo_states(side2, alignment) {
  return batch(toList([
    (() => {
      let _pipe = sides2;
      let _pipe$1 = filter(_pipe, (s) => {
        return s !== side2;
      });
      let _pipe$2 = map2(_pipe$1, remove_pseudo_state2);
      return batch(_pipe$2);
    })(),
    (() => {
      let _pipe = alignments;
      let _pipe$1 = filter(_pipe, (a2) => {
        return !isEqual(new Some(a2), alignment);
      });
      let _pipe$2 = map2(_pipe$1, remove_pseudo_state2);
      return batch(_pipe$2);
    })()
  ]));
}
function set_placement_pseudo_state(side2, align) {
  return batch(toList([
    set_pseudo_state2(side2),
    (() => {
      if (align instanceof Some) {
        let align$1 = align[0];
        return set_pseudo_state2(align$1);
      } else {
        return none();
      }
    })(),
    remove_pseudo_states(side2, align)
  ]));
}
function recalculate_position(offset3, side2, align) {
  return before_paint2((dispatch2, _, component2) => {
    return calculatePosition(component2, offset3, side2, unwrap(align, ""), (x, y) => {
      return dispatch2(new DomCalculatedPosition(x, y));
    });
  });
}
function update15(model, message) {
  if (message instanceof DomCalculatedPosition) {
    let x = message.x;
    let y = message.y;
    echo([x, y], undefined, "src/lustre/ui/tooltip/popover.gleam", 189);
    let model$1 = new Model14(model.open, x, y, model.offset, model.side, model.align);
    let _block;
    let $ = model$1.open.value;
    if ($) {
      _block = set_pseudo_state2("open");
    } else {
      _block = none();
    }
    let effect = _block;
    return [model$1, effect];
  } else if (message instanceof ParentResetAlign) {
    let model$1 = new Model14(model.open, model.x, model.y, model.offset, model.side, new None);
    let effect = batch(toList([
      recalculate_position(model$1.offset, model$1.side, model$1.align),
      set_placement_pseudo_state(model$1.side, model$1.align)
    ]));
    return [model$1, effect];
  } else if (message instanceof ParentResetOffset) {
    let model$1 = new Model14(model.open, model.x, model.y, 0, model.side, model.align);
    let effect = recalculate_position(model$1.offset, model$1.side, model$1.align);
    return [model$1, effect];
  } else if (message instanceof ParentResetSide) {
    let model$1 = new Model14(model.open, model.x, model.y, model.offset, "top", model.align);
    let effect = batch(toList([
      recalculate_position(model$1.offset, model$1.side, model$1.align),
      set_placement_pseudo_state(model$1.side, model$1.align)
    ]));
    return [model$1, effect];
  } else if (message instanceof ParentSetAlign) {
    let value5 = message.value;
    let model$1 = new Model14(model.open, model.x, model.y, model.offset, model.side, new Some(value5));
    let effect = batch(toList([
      recalculate_position(model$1.offset, model$1.side, model$1.align),
      set_placement_pseudo_state(model$1.side, model$1.align)
    ]));
    return [model$1, effect];
  } else if (message instanceof ParentSetDefaultOpen2) {
    return guard(model.open.controlled, [model, none()], () => {
      return guard(model.open.touched, [model, none()], () => {
        return guard(model.open.value, [model, none()], () => {
          let open$1 = default$(model.open, true);
          let model$1 = new Model14(open$1, model.x, model.y, model.offset, model.side, model.align);
          let effect = batch((() => {
            let $ = open$1.value;
            if ($) {
              return toList([
                show_popover(model$1.offset, model$1.side, model$1.align)
              ]);
            } else {
              return toList([
                hide_popover(),
                remove_pseudo_state2("open")
              ]);
            }
          })());
          return [model$1, effect];
        });
      });
    });
  } else if (message instanceof ParentSetId4) {
    let $ = message.value;
    if ($ === "") {
      let effect = before_paint2((_, _1, component2) => {
        return ensure_id(component2);
      });
      return [model, effect];
    } else {
      let value5 = $;
      let effect = emit_identify4(value5);
      return [model, effect];
    }
  } else if (message instanceof ParentSetOffset) {
    let value5 = message.value;
    let model$1 = new Model14(model.open, model.x, model.y, value5, model.side, model.align);
    let effect = recalculate_position(model$1.offset, model$1.side, model$1.align);
    return [model$1, effect];
  } else if (message instanceof ParentSetOpen2) {
    let value5 = message.value;
    let prev = model.open.value;
    let open$1 = control(model.open, value5);
    let model$1 = new Model14(open$1, model.x, model.y, model.offset, model.side, model.align);
    return guard(prev === open$1.value, [model$1, none()], () => {
      let effect = batch((() => {
        let $ = open$1.value;
        if ($) {
          return toList([
            show_popover(model$1.offset, model$1.side, model$1.align)
          ]);
        } else {
          return toList([
            hide_popover(),
            remove_pseudo_state2("open")
          ]);
        }
      })());
      return [model$1, effect];
    });
  } else if (message instanceof ParentSetSide) {
    let value5 = message.value;
    let model$1 = new Model14(model.open, model.x, model.y, model.offset, value5, model.align);
    let effect = batch(toList([
      recalculate_position(model$1.offset, model$1.side, model$1.align),
      set_placement_pseudo_state(model$1.side, model$1.align)
    ]));
    return [model$1, effect];
  } else if (message instanceof ParentToggledDefaultOpen2) {
    return guard(model.open.controlled, [model, none()], () => {
      return guard(model.open.touched, [model, none()], () => {
        let open$1 = default$(model.open, !model.open.value);
        let model$1 = new Model14(open$1, model.x, model.y, model.offset, model.side, model.align);
        let effect = batch((() => {
          let $ = open$1.value;
          if ($) {
            return toList([
              show_popover(model$1.offset, model$1.side, model$1.align)
            ]);
          } else {
            return toList([
              hide_popover(),
              remove_pseudo_state2("open")
            ]);
          }
        })());
        return [model$1, effect];
      });
    });
  } else {
    let open$1 = message.value.open;
    return guard(model.open.controlled, [model, none()], () => {
      return guard(open$1 === model.open.value, [model, none()], () => {
        let model$1 = new Model14(touch(model.open, open$1), model.x, model.y, model.offset, model.side, model.align);
        let effect = batch((() => {
          if (open$1) {
            return toList([
              show_popover(model$1.offset, model$1.side, model$1.align)
            ]);
          } else {
            return toList([
              hide_popover(),
              remove_pseudo_state2("open")
            ]);
          }
        })());
        return [model$1, effect];
      });
    });
  }
}
function init14(_) {
  let model = new Model14(new$8(false), 0, 0, 0, "top", new None);
  let effect = batch(toList([
    recalculate_position(model.offset, model.side, model.align),
    set_placement_pseudo_state(model.side, model.align),
    before_paint2((_2, _1, component2) => {
      ensure_id(component2);
      role(component2, "tooltip");
      return setAttribute2(component2, "popover", "hint");
    })
  ]));
  return [model, effect];
}
function register17() {
  let component2 = component(init14, update15, view15, toList([
    on_change4((var0) => {
      return new TooltipProvidedContext(var0);
    }),
    on_attribute_change("id", (value5) => {
      return new Ok(new ParentSetId4(value5));
    }),
    on_attribute_change("offset", (value5) => {
      let _block;
      let _pipe = parse_int(value5);
      let _pipe$1 = map4(_pipe, identity);
      _block = lazy_or(_pipe$1, () => {
        return parse_float(value5);
      });
      let number = _block;
      if (number instanceof Ok) {
        let value$1 = number[0];
        return new Ok(new ParentSetOffset(value$1));
      } else {
        return new Ok(new ParentResetOffset);
      }
    }),
    on_attribute_change("side", (value5) => {
      if (value5 === "top") {
        return new Ok(new ParentSetSide(value5));
      } else if (value5 === "right") {
        return new Ok(new ParentSetSide(value5));
      } else if (value5 === "bottom") {
        return new Ok(new ParentSetSide(value5));
      } else if (value5 === "left") {
        return new Ok(new ParentSetSide(value5));
      } else {
        return new Ok(new ParentResetSide);
      }
    }),
    on_attribute_change("align", (value5) => {
      if (value5 === "start") {
        return new Ok(new ParentSetAlign(value5));
      } else if (value5 === "end") {
        return new Ok(new ParentSetAlign(value5));
      } else {
        return new Ok(new ParentResetAlign);
      }
    }),
    on_attribute_change("open", (value5) => {
      if (value5 === "") {
        return new Ok(new ParentToggledDefaultOpen2);
      } else {
        return new Ok(new ParentSetDefaultOpen2);
      }
    }),
    on_property_change("open", (() => {
      let _pipe = bool;
      return map3(_pipe, (var0) => {
        return new ParentSetOpen2(var0);
      });
    })())
  ]));
  return make_component(component2, tag15);
}
function echo(value5, message, file, line) {
  const grey = "\x1B[90m";
  const reset_color = "\x1B[39m";
  const file_line = `${file}:${line}`;
  const inspector = new Echo$Inspector;
  const string_value = inspector.inspect(value5);
  const string_message = message === undefined ? "" : " " + message;
  if (globalThis.process?.stderr?.write) {
    const string5 = `${grey}${file_line}${reset_color}${string_message}
${string_value}
`;
    globalThis.process.stderr.write(string5);
  } else if (globalThis.Deno) {
    const string5 = `${grey}${file_line}${reset_color}${string_message}
${string_value}
`;
    globalThis.Deno.stderr.writeSync(new TextEncoder().encode(string5));
  } else {
    const string5 = `${file_line}${string_message}
${string_value}`;
    globalThis.console.log(string5);
  }
  return value5;
}

class Echo$Inspector {
  #references = new globalThis.Set;
  #isDict(value5) {
    try {
      const empty_dict = make();
      const dict_class = empty_dict.constructor;
      return value5 instanceof dict_class;
    } catch {
      return false;
    }
  }
  #float(float3) {
    const string5 = float3.toString().replace("+", "");
    if (string5.indexOf(".") >= 0) {
      return string5;
    } else {
      const index4 = string5.indexOf("e");
      if (index4 >= 0) {
        return string5.slice(0, index4) + ".0" + string5.slice(index4);
      } else {
        return string5 + ".0";
      }
    }
  }
  inspect(v) {
    const t = typeof v;
    if (v === true)
      return "True";
    if (v === false)
      return "False";
    if (v === null)
      return "//js(null)";
    if (v === undefined)
      return "Nil";
    if (t === "string")
      return this.#string(v);
    if (t === "bigint" || globalThis.Number.isInteger(v))
      return v.toString();
    if (t === "number")
      return this.#float(v);
    if (v instanceof UtfCodepoint)
      return this.#utfCodepoint(v);
    if (v instanceof BitArray)
      return this.#bit_array(v);
    if (v instanceof globalThis.RegExp)
      return `//js(${v})`;
    if (v instanceof globalThis.Date)
      return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error)
      return `//js(${v.toString()})`;
    if (v instanceof globalThis.Function) {
      const args = [];
      for (const i of globalThis.Array(v.length).keys())
        args.push(globalThis.String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (globalThis.Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (v instanceof List) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (this.#isDict(v)) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name4 = globalThis.Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of globalThis.Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body = props.length ? " " + props.join(", ") + " " : "";
    const head = name4 === "Object" ? "" : name4 + " ";
    return `//js(${head}{${body}})`;
  }
  #dict(map7) {
    let body = "dict.from_list([";
    let first = true;
    let key_value_pairs = fold(map7, [], (pairs, key, value5) => {
      pairs.push([key, value5]);
      return pairs;
    });
    key_value_pairs.sort();
    key_value_pairs.forEach(([key, value5]) => {
      if (!first)
        body = body + ", ";
      body = body + "#(" + this.inspect(key) + ", " + this.inspect(value5) + ")";
      first = false;
    });
    return body + "])";
  }
  #customType(record) {
    const props = globalThis.Object.keys(record).map((label2) => {
      const value5 = this.inspect(record[label2]);
      return isNaN(parseInt(label2)) ? `${label2}: ${value5}` : value5;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list4) {
    if (list4 instanceof Empty) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list4;
    while (current instanceof NonEmpty) {
      let element14 = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element14);
      if (char_out) {
        if (globalThis.Number.isInteger(element14) && element14 >= 32 && element14 <= 126) {
          char_out += globalThis.String.fromCharCode(element14);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0;i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case `
`:
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "\t":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += "\\\"";
          break;
        default:
          if (char < " " || char > "~" && char < " ") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${globalThis.String.fromCodePoint(codepoint2.value)})`;
  }
  #bit_array(bits2) {
    if (bits2.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0;i < bits2.byteSize - 1; i++) {
      acc += bits2.byteAt(i).toString();
      acc += ", ";
    }
    if (bits2.byteSize * 8 === bits2.bitSize) {
      acc += bits2.byteAt(bits2.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits2.bitSize % 8;
      acc += bits2.byteAt(bits2.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/window.ffi.mjs
function setTimeout3(after, callback) {
  return window.setTimeout(callback, after);
}
function cancelTimeout(timeoutId) {
  window.clearTimeout(timeoutId);
}

// build/dev/javascript/lustre_ui/lustre_ui/dom/window.mjs
function set_timeout(after, with_timeout_id, do$) {
  return from2((dispatch2) => {
    let timeout_id = setTimeout3(after, () => {
      return do$(dispatch2);
    });
    return dispatch2(with_timeout_id(timeout_id));
  });
}
function cancel_timeout(timeout_id) {
  return from2((_) => {
    return cancelTimeout(timeout_id);
  });
}

// build/dev/javascript/lustre_ui/lustre/ui/tooltip/trigger.mjs
class Model15 extends CustomType {
  constructor(open2, delay, timeout) {
    super();
    this.open = open2;
    this.delay = delay;
    this.timeout = timeout;
  }
}

class TooltipProvidedContext2 extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class UserActivatedTrigger4 extends CustomType {
}

class UserDismissedTrigger extends CustomType {
}

class UserIntentToActivateTrigger extends CustomType {
}

class UserResetDelay extends CustomType {
}

class UserSetDelay extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class WindowScheduledTimer extends CustomType {
  constructor(id3) {
    super();
    this.id = id3;
  }
}
var tag16 = "lustre-tooltip-trigger";
function element14(attributes, children) {
  return element2(tag16, attributes, children);
}
function on_activate3(handler2) {
  return on("tooltip/trigger:activate", success(handler2));
}
function emit_activate3() {
  return emit2("tooltip/trigger:activate", null$());
}
function on_dismiss(handler2) {
  return on("tooltip/trigger:dismiss", success(handler2));
}
function emit_dismiss() {
  return emit2("tooltip/trigger:dismiss", null$());
}
function view16(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: inline-block;
      }
      `),
    default_slot(toList([]), toList([]))
  ]));
}
function cancel_activation_timeout(timeout) {
  if (timeout instanceof Some) {
    let id3 = timeout[0];
    return cancel_timeout(id3);
  } else {
    return none();
  }
}
function update16(model, message) {
  if (message instanceof TooltipProvidedContext2) {
    let context = message.value;
    let delay$1 = default$(model.delay, context.delay);
    let model$1 = new Model15(context.open, delay$1, model.timeout);
    let effect = batch(toList([
      toggle_psuedo_state("open", context.open),
      before_paint2((_, _1, component2) => {
        return aria_describedby(component2, toList([context.popover]));
      })
    ]));
    return [model$1, effect];
  } else if (message instanceof UserActivatedTrigger4) {
    let timeout = model.timeout;
    let model$1 = new Model15(model.open, model.delay, new None);
    let effect = batch(toList([emit_activate3(), cancel_activation_timeout(timeout)]));
    return [model$1, effect];
  } else if (message instanceof UserDismissedTrigger) {
    let timeout = model.timeout;
    let model$1 = new Model15(model.open, model.delay, new None);
    let effect = batch(toList([emit_dismiss(), cancel_activation_timeout(timeout)]));
    return [model$1, effect];
  } else if (message instanceof UserIntentToActivateTrigger) {
    if (model.delay.value === 0) {
      let timeout = model.timeout;
      let model$1 = new Model15(model.open, model.delay, new None);
      let effect = batch(toList([emit_activate3(), cancel_activation_timeout(timeout)]));
      return [model$1, effect];
    } else {
      let _block;
      let $ = model.timeout;
      if ($ instanceof Some) {
        _block = none();
      } else if (model.open) {
        _block = none();
      } else {
        _block = set_timeout(model.delay.value, (var0) => {
          return new WindowScheduledTimer(var0);
        }, (dispatch2) => {
          return dispatch2(new UserActivatedTrigger4);
        });
      }
      let effect = _block;
      return [model, effect];
    }
  } else if (message instanceof UserResetDelay) {
    let _block;
    let $ = model.delay.controlled;
    if ($) {
      _block = control(model.delay, 50);
    } else {
      _block = default$(model.delay, 50);
    }
    let delay$1 = _block;
    let model$1 = new Model15(model.open, delay$1, model.timeout);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof UserSetDelay) {
    let value5 = message.value;
    let delay$1 = control(model.delay, max(value5, 0));
    let model$1 = new Model15(model.open, delay$1, model.timeout);
    let effect = none();
    return [model$1, effect];
  } else {
    let id3 = message.id;
    let existing = model.timeout;
    let model$1 = new Model15(model.open, model.delay, new Some(id3));
    let effect = cancel_activation_timeout(existing);
    return [model$1, effect];
  }
}
function init15(_) {
  let model = new Model15(false, new$8(50), new None);
  let effect = before_paint2((dispatch2, _2, component2) => {
    addEventListener2(component2, "mouseenter", (_3) => {
      return dispatch2(new UserIntentToActivateTrigger);
    });
    addEventListener2(component2, "mouseleave", (_3) => {
      return dispatch2(new UserDismissedTrigger);
    });
    addEventListener2(component2, "focusin", (_3) => {
      return dispatch2(new UserActivatedTrigger4);
    });
    return addEventListener2(component2, "focusout", (_3) => {
      return dispatch2(new UserDismissedTrigger);
    });
  });
  return [model, effect];
}
function register18() {
  let component2 = component(init15, update16, view16, toList([
    on_change4((var0) => {
      return new TooltipProvidedContext2(var0);
    })
  ]));
  return make_component(component2, tag16);
}

// build/dev/javascript/lustre_ui/lustre/ui/tooltip/root.mjs
class Model16 extends CustomType {
  constructor(popover, open2, delay) {
    super();
    this.popover = popover;
    this.open = open2;
    this.delay = delay;
  }
}

class ParentResetDelay extends CustomType {
}

class ParentSetDefaultOpen3 extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class ParentSetDelay extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class ParentSetOpen3 extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}

class UserActivatedTrigger5 extends CustomType {
}

class UserDismissedTrigger2 extends CustomType {
}

class UserSetPopoverId extends CustomType {
  constructor(value5) {
    super();
    this.value = value5;
  }
}
var tag17 = "lustre-tooltip";
function element15(attributes, children) {
  return element2(tag17, attributes, children);
}
function emit_change5(open2) {
  return emit2("tooltip:change", bool2(open2));
}
function view17(_) {
  return fragment2(toList([
    style(toList([]), `
      :host {
        display: contents;
      }
      `),
    default_slot(toList([
      on_activate3(new UserActivatedTrigger5),
      on_dismiss(new UserDismissedTrigger2),
      on_identify4((var0) => {
        return new UserSetPopoverId(var0);
      })
    ]), toList([]))
  ]));
}
function update17(model, message) {
  if (message instanceof ParentResetDelay) {
    let model$1 = new Model16(model.popover, model.open, 50);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentSetDefaultOpen3) {
    let value5 = message.value;
    let $ = model.open.controlled || model.open.touched;
    if ($) {
      return [model, none()];
    } else {
      let _block;
      let _record = model.open;
      _block = new Prop(value5, _record.controlled, _record.touched);
      let open$1 = _block;
      let model$1 = new Model16(model.popover, open$1, model.delay);
      let effect = provide5(model$1.popover, model$1.open.value, 50);
      return [model$1, effect];
    }
  } else if (message instanceof ParentSetDelay) {
    let value5 = message.value;
    let model$1 = new Model16(model.popover, model.open, value5);
    let effect = none();
    return [model$1, effect];
  } else if (message instanceof ParentSetOpen3) {
    let value5 = message.value;
    let model$1 = new Model16(model.popover, control(model.open, value5), model.delay);
    let effect = provide5(model$1.popover, model$1.open.value, 50);
    return [model$1, effect];
  } else if (message instanceof UserActivatedTrigger5) {
    let $ = model.open.controlled;
    if ($) {
      let effect = emit_change5(true);
      return [model, effect];
    } else {
      let open$1 = touch(model.open, true);
      let model$1 = new Model16(model.popover, open$1, model.delay);
      let effect = batch(toList([
        provide5(model$1.popover, model$1.open.value, 50),
        emit_change5(model$1.open.value)
      ]));
      return [model$1, effect];
    }
  } else if (message instanceof UserDismissedTrigger2) {
    let $ = model.open.controlled;
    if ($) {
      let effect = emit_change5(false);
      return [model, effect];
    } else {
      let open$1 = touch(model.open, false);
      let model$1 = new Model16(model.popover, open$1, model.delay);
      let effect = batch(toList([
        provide5(model$1.popover, model$1.open.value, 50),
        emit_change5(model$1.open.value)
      ]));
      return [model$1, effect];
    }
  } else {
    let value5 = message.value;
    let model$1 = new Model16(value5, model.open, model.delay);
    let effect = provide5(model$1.popover, model$1.open.value, 50);
    return [model$1, effect];
  }
}
function init16(_) {
  let model = new Model16("", new$8(false), 50);
  let effect = batch(toList([
    provide5("", false, 50),
    before_paint2((dispatch2, _2, component2) => {
      let $ = attribute3(component2, "value");
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 === "") {
          let selector = 'lustre-tooltip-popover[open="true"]';
          let $2 = querySelector(component2, selector);
          if ($2 instanceof Ok) {
            return dispatch2(new ParentSetDefaultOpen3(true));
          } else {
            return;
          }
        } else {
          return;
        }
      } else {
        let selector = 'lustre-tooltip-popover[open="true"]';
        let $1 = querySelector(component2, selector);
        if ($1 instanceof Ok) {
          return dispatch2(new ParentSetDefaultOpen3(true));
        } else {
          return;
        }
      }
    })
  ]));
  return [model, effect];
}
function register19() {
  let component2 = component(init16, update17, view17, toList([
    on_attribute_change("delay", (value5) => {
      let $ = parse_int(value5);
      if ($ instanceof Ok) {
        let number = $[0];
        if (number < 0) {
          return new Ok(new ParentSetDelay(0));
        } else {
          let number2 = $[0];
          return new Ok(new ParentSetDelay(number2));
        }
      } else {
        return new Ok(new ParentResetDelay);
      }
    }),
    on_attribute_change("open", (value5) => {
      if (value5 === "true") {
        return new Ok(new ParentSetDefaultOpen3(true));
      } else if (value5 === "false") {
        return new Ok(new ParentSetDefaultOpen3(false));
      } else if (value5 === "") {
        return new Ok(new ParentSetDefaultOpen3(false));
      } else {
        return new Error(undefined);
      }
    }),
    on_property_change("open", (() => {
      let _pipe = bool;
      return map3(_pipe, (var0) => {
        return new ParentSetOpen3(var0);
      });
    })())
  ]));
  return make_component(component2, tag17);
}

// build/dev/javascript/lustre_ui/lustre/ui/tooltip.mjs
class Popover extends CustomType {
  constructor(attributes, children) {
    super();
    this.attributes = attributes;
    this.children = children;
  }
}

class Trigger2 extends CustomType {
  constructor(attributes, children) {
    super();
    this.attributes = attributes;
    this.children = children;
  }
}
function popover(attributes, children) {
  return new Popover(attributes, children);
}
function trigger2(attributes, children) {
  return new Trigger2(attributes, children);
}
function register20() {
  return try$(register19(), (_) => {
    return try$(register18(), (_2) => {
      return try$(register17(), (_3) => {
        return new Ok(undefined);
      });
    });
  });
}
function view18(attributes, popover2, trigger3) {
  return element15(attributes, toList([
    element14(trigger3.attributes, trigger3.children),
    element13(popover2.attributes, popover2.children)
  ]));
}

// build/dev/javascript/lustre_ui/lustre/ui.mjs
function register21() {
  return try$(register6(), (_) => {
    return try$(register13(), (_2) => {
      return try$(register16(), (_3) => {
        return try$(register20(), (_4) => {
          return new Ok(undefined);
        });
      });
    });
  });
}
// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
class Uri extends CustomType {
  constructor(scheme, userinfo, host2, port, path, query, fragment4) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host2;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment4;
  }
}
var empty3 = /* @__PURE__ */ new Uri(/* @__PURE__ */ new None, /* @__PURE__ */ new None, /* @__PURE__ */ new None, /* @__PURE__ */ new None, "", /* @__PURE__ */ new None, /* @__PURE__ */ new None);
function parse_fragment(rest, pieces) {
  return new Ok(new Uri(pieces.scheme, pieces.userinfo, pieces.host, pieces.port, pieces.path, pieces.query, new Some(rest)));
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size4 = loop$size;
    if (uri_string.charCodeAt(0) === 35) {
      if (size4 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let query = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, pieces.host, pieces.port, pieces.path, new Some(query), pieces.fragment);
        return parse_fragment(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(new Uri(pieces.scheme, pieces.userinfo, pieces.host, pieces.port, pieces.path, new Some(original), pieces.fragment));
    } else {
      let $ = pop_codeunit(uri_string);
      let rest;
      rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size4 + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size4 = loop$size;
    let $ = uri_string.charCodeAt(0);
    if ($ === 63) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size4);
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, pieces.host, pieces.port, path, pieces.query, pieces.fragment);
      return parse_query_with_question_mark(rest, pieces$1);
    } else if ($ === 35) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size4);
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, pieces.host, pieces.port, path, pieces.query, pieces.fragment);
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(new Uri(pieces.scheme, pieces.userinfo, pieces.host, pieces.port, original, pieces.query, pieces.fragment));
    } else {
      let $1 = pop_codeunit(uri_string);
      let rest;
      rest = $1[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size4 + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    let $ = uri_string.charCodeAt(0);
    if ($ === 48) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if ($ === 49) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if ($ === 50) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if ($ === 51) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if ($ === 52) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if ($ === 53) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if ($ === 54) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if ($ === 55) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if ($ === 56) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if ($ === 57) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if ($ === 63) {
      let rest = uri_string.slice(1);
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, pieces.host, new Some(port), pieces.path, pieces.query, pieces.fragment);
      return parse_query_with_question_mark(rest, pieces$1);
    } else if ($ === 35) {
      let rest = uri_string.slice(1);
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, pieces.host, new Some(port), pieces.path, pieces.query, pieces.fragment);
      return parse_fragment(rest, pieces$1);
    } else if ($ === 47) {
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, pieces.host, new Some(port), pieces.path, pieces.query, pieces.fragment);
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(new Uri(pieces.scheme, pieces.userinfo, pieces.host, new Some(port), pieces.path, pieces.query, pieces.fragment));
    } else {
      return new Error(undefined);
    }
  }
}
function parse_port(uri_string, pieces) {
  let $ = uri_string.charCodeAt(0);
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string === ":") {
    return new Ok(pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else if ($ === 63) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith(":?")) {
    let rest = uri_string.slice(2);
    return parse_query_with_question_mark(rest, pieces);
  } else if ($ === 35) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith(":#")) {
    let rest = uri_string.slice(2);
    return parse_fragment(rest, pieces);
  } else if ($ === 47) {
    return parse_path(uri_string, pieces);
  } else if ($ === 58) {
    let rest = uri_string.slice(1);
    if (rest.charCodeAt(0) === 47) {
      return parse_path(rest, pieces);
    } else {
      return new Error(undefined);
    }
  } else {
    return new Error(undefined);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size4 = loop$size;
    let $ = uri_string.charCodeAt(0);
    if (uri_string === "") {
      return new Ok(new Uri(pieces.scheme, pieces.userinfo, new Some(original), pieces.port, pieces.path, pieces.query, pieces.fragment));
    } else if ($ === 58) {
      let host2 = string_codeunit_slice(original, 0, size4);
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(host2), pieces.port, pieces.path, pieces.query, pieces.fragment);
      return parse_port(uri_string, pieces$1);
    } else if ($ === 47) {
      let host2 = string_codeunit_slice(original, 0, size4);
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(host2), pieces.port, pieces.path, pieces.query, pieces.fragment);
      return parse_path(uri_string, pieces$1);
    } else if ($ === 63) {
      let rest = uri_string.slice(1);
      let host2 = string_codeunit_slice(original, 0, size4);
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(host2), pieces.port, pieces.path, pieces.query, pieces.fragment);
      return parse_query_with_question_mark(rest, pieces$1);
    } else if ($ === 35) {
      let rest = uri_string.slice(1);
      let host2 = string_codeunit_slice(original, 0, size4);
      let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(host2), pieces.port, pieces.path, pieces.query, pieces.fragment);
      return parse_fragment(rest, pieces$1);
    } else {
      let $1 = pop_codeunit(uri_string);
      let rest;
      rest = $1[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size4 + 1;
    }
  }
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size4 = loop$size;
    let $ = uri_string.charCodeAt(0);
    if (uri_string === "") {
      return new Ok(new Uri(pieces.scheme, pieces.userinfo, new Some(uri_string), pieces.port, pieces.path, pieces.query, pieces.fragment));
    } else if ($ === 93) {
      if (size4 === 0) {
        let rest = uri_string.slice(1);
        return parse_port(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host2 = string_codeunit_slice(original, 0, size4 + 1);
        let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(host2), pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_port(rest, pieces$1);
      }
    } else if ($ === 47) {
      if (size4 === 0) {
        return parse_path(uri_string, pieces);
      } else {
        let host2 = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(host2), pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_path(uri_string, pieces$1);
      }
    } else if ($ === 63) {
      if (size4 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host2 = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(host2), pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if ($ === 35) {
      if (size4 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let host2 = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(host2), pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_fragment(rest, pieces$1);
      }
    } else {
      let $1 = pop_codeunit(uri_string);
      let char;
      let rest;
      char = $1[0];
      rest = $1[1];
      let $2 = is_valid_host_within_brackets_char(char);
      if ($2) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size4 + 1;
      } else {
        return parse_host_outside_of_brackets_loop(original, original, pieces, 0);
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  let $ = uri_string.charCodeAt(0);
  if ($ === 91) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if ($ === 58) {
    let pieces$1 = new Uri(pieces.scheme, pieces.userinfo, new Some(""), pieces.port, pieces.path, pieces.query, pieces.fragment);
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(new Uri(pieces.scheme, pieces.userinfo, new Some(""), pieces.port, pieces.path, pieces.query, pieces.fragment));
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size4 = loop$size;
    let $ = uri_string.charCodeAt(0);
    if ($ === 64) {
      if (size4 === 0) {
        let rest = uri_string.slice(1);
        return parse_host(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let userinfo = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(pieces.scheme, new Some(userinfo), pieces.host, pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_host(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if ($ === 47) {
      return parse_host(original, pieces);
    } else if ($ === 63) {
      return parse_host(original, pieces);
    } else if ($ === 35) {
      return parse_host(original, pieces);
    } else {
      let $1 = pop_codeunit(uri_string);
      let rest;
      rest = $1[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size4 + 1;
    }
  }
}
function parse_authority_pieces(string5, pieces) {
  return parse_userinfo_loop(string5, string5, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(new Uri(pieces.scheme, pieces.userinfo, new Some(""), pieces.port, pieces.path, pieces.query, pieces.fragment));
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size4 = loop$size;
    let $ = uri_string.charCodeAt(0);
    if ($ === 47) {
      if (size4 === 0) {
        return parse_authority_with_slashes(uri_string, pieces);
      } else {
        let scheme = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(new Some(lowercase(scheme)), pieces.userinfo, pieces.host, pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_authority_with_slashes(uri_string, pieces$1);
      }
    } else if ($ === 63) {
      if (size4 === 0) {
        let rest = uri_string.slice(1);
        return parse_query_with_question_mark(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(new Some(lowercase(scheme)), pieces.userinfo, pieces.host, pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_query_with_question_mark(rest, pieces$1);
      }
    } else if ($ === 35) {
      if (size4 === 0) {
        let rest = uri_string.slice(1);
        return parse_fragment(rest, pieces);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(new Some(lowercase(scheme)), pieces.userinfo, pieces.host, pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_fragment(rest, pieces$1);
      }
    } else if ($ === 58) {
      if (size4 === 0) {
        return new Error(undefined);
      } else {
        let rest = uri_string.slice(1);
        let scheme = string_codeunit_slice(original, 0, size4);
        let pieces$1 = new Uri(new Some(lowercase(scheme)), pieces.userinfo, pieces.host, pieces.port, pieces.path, pieces.query, pieces.fragment);
        return parse_authority_with_slashes(rest, pieces$1);
      }
    } else if (uri_string === "") {
      return new Ok(new Uri(pieces.scheme, pieces.userinfo, pieces.host, pieces.port, original, pieces.query, pieces.fragment));
    } else {
      let $1 = pop_codeunit(uri_string);
      let rest;
      rest = $1[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size4 + 1;
    }
  }
}
function parse2(uri_string) {
  return parse_scheme_loop(uri_string, uri_string, empty3, 0);
}
function remove_dot_segments_loop(loop$input, loop$accumulator) {
  while (true) {
    let input = loop$input;
    let accumulator = loop$accumulator;
    if (input instanceof Empty) {
      return reverse(accumulator);
    } else {
      let segment = input.head;
      let rest = input.tail;
      let _block;
      if (segment === "") {
        _block = accumulator;
      } else if (segment === ".") {
        _block = accumulator;
      } else if (segment === "..") {
        if (accumulator instanceof Empty) {
          _block = accumulator;
        } else {
          let accumulator$12 = accumulator.tail;
          _block = accumulator$12;
        }
      } else {
        let segment$1 = segment;
        let accumulator$12 = accumulator;
        _block = prepend(segment$1, accumulator$12);
      }
      let accumulator$1 = _block;
      loop$input = rest;
      loop$accumulator = accumulator$1;
    }
  }
}
function remove_dot_segments(input) {
  return remove_dot_segments_loop(input, toList([]));
}
function path_segments(path) {
  return remove_dot_segments(split2(path, "/"));
}
function to_string4(uri) {
  let _block;
  let $ = uri.fragment;
  if ($ instanceof Some) {
    let fragment4 = $[0];
    _block = toList(["#", fragment4]);
  } else {
    _block = toList([]);
  }
  let parts = _block;
  let _block$1;
  let $1 = uri.query;
  if ($1 instanceof Some) {
    let query = $1[0];
    _block$1 = prepend("?", prepend(query, parts));
  } else {
    _block$1 = parts;
  }
  let parts$1 = _block$1;
  let parts$2 = prepend(uri.path, parts$1);
  let _block$2;
  let $2 = uri.host;
  let $3 = starts_with(uri.path, "/");
  if ($2 instanceof Some && !$3) {
    let host2 = $2[0];
    if (host2 !== "") {
      _block$2 = prepend("/", parts$2);
    } else {
      _block$2 = parts$2;
    }
  } else {
    _block$2 = parts$2;
  }
  let parts$3 = _block$2;
  let _block$3;
  let $4 = uri.host;
  let $5 = uri.port;
  if ($4 instanceof Some && $5 instanceof Some) {
    let port = $5[0];
    _block$3 = prepend(":", prepend(to_string(port), parts$3));
  } else {
    _block$3 = parts$3;
  }
  let parts$4 = _block$3;
  let _block$4;
  let $6 = uri.scheme;
  let $7 = uri.userinfo;
  let $8 = uri.host;
  if ($6 instanceof Some) {
    if ($7 instanceof Some) {
      if ($8 instanceof Some) {
        let s = $6[0];
        let u = $7[0];
        let h = $8[0];
        _block$4 = prepend(s, prepend("://", prepend(u, prepend("@", prepend(h, parts$4)))));
      } else {
        let s = $6[0];
        _block$4 = prepend(s, prepend(":", parts$4));
      }
    } else if ($8 instanceof Some) {
      let s = $6[0];
      let h = $8[0];
      _block$4 = prepend(s, prepend("://", prepend(h, parts$4)));
    } else {
      let s = $6[0];
      _block$4 = prepend(s, prepend(":", parts$4));
    }
  } else if ($7 instanceof None && $8 instanceof Some) {
    let h = $8[0];
    _block$4 = prepend("//", prepend(h, parts$4));
  } else {
    _block$4 = parts$4;
  }
  let parts$5 = _block$4;
  return concat2(parts$5);
}
// build/dev/javascript/modem/modem.ffi.mjs
var defaults = {
  handle_external_links: false,
  handle_internal_links: true
};
var initial_location = globalThis?.window?.location?.href;
var do_initial_uri = () => {
  if (!initial_location) {
    return new Error(undefined);
  } else {
    return new Ok(uri_from_url(new URL(initial_location)));
  }
};
var do_init = (dispatch2, options = defaults) => {
  document.addEventListener("click", (event4) => {
    const a2 = find_anchor(event4.target);
    if (!a2)
      return;
    try {
      const url = new URL(a2.href);
      const uri = uri_from_url(url);
      const is_external = url.host !== window.location.host || a2.target === "_blank";
      if (!options.handle_external_links && is_external)
        return;
      if (!options.handle_internal_links && !is_external)
        return;
      event4.preventDefault();
      if (!is_external) {
        window.history.pushState({}, "", a2.href);
        window.requestAnimationFrame(() => {
          if (url.hash) {
            document.getElementById(url.hash.slice(1))?.scrollIntoView();
          } else {
            window.scrollTo(0, 0);
          }
        });
      }
      return dispatch2(uri);
    } catch {
      return;
    }
  });
  window.addEventListener("popstate", (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    const uri = uri_from_url(url);
    window.requestAnimationFrame(() => {
      if (url.hash) {
        document.getElementById(url.hash.slice(1))?.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    });
    dispatch2(uri);
  });
  window.addEventListener("modem-push", ({ detail }) => {
    dispatch2(detail);
  });
  window.addEventListener("modem-replace", ({ detail }) => {
    dispatch2(detail);
  });
};
var find_anchor = (el) => {
  if (!el || el.tagName === "BODY") {
    return null;
  } else if (el.tagName === "A") {
    return el;
  } else {
    return find_anchor(el.parentElement);
  }
};
var uri_from_url = (url) => {
  return new Uri(url.protocol ? new Some(url.protocol.slice(0, -1)) : new None, new None, url.hostname ? new Some(url.hostname) : new None, url.port ? new Some(Number(url.port)) : new None, url.pathname, url.search ? new Some(url.search.slice(1)) : new None, url.hash ? new Some(url.hash.slice(1)) : new None);
};

// build/dev/javascript/modem/modem.mjs
function init17(handler2) {
  return from2((dispatch2) => {
    return guard(!is_browser(), undefined, () => {
      return do_init((uri) => {
        let _pipe = uri;
        let _pipe$1 = handler2(_pipe);
        return dispatch2(_pipe$1);
      });
    });
  });
}
// build/dev/javascript/pandi/pandi/pandoc.mjs
class Attributes extends CustomType {
  constructor(id3, classes, keyvalues) {
    super();
    this.id = id3;
    this.classes = classes;
    this.keyvalues = keyvalues;
  }
}
class Header extends CustomType {
  constructor(level, attributes, content) {
    super();
    this.level = level;
    this.attributes = attributes;
    this.content = content;
  }
}
class Para extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
}
class Plain extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
}
class CodeBlock extends CustomType {
  constructor(attributes, text4) {
    super();
    this.attributes = attributes;
    this.text = text4;
  }
}
class Div extends CustomType {
  constructor(attributes, content) {
    super();
    this.attributes = attributes;
    this.content = content;
  }
}
class BulletList extends CustomType {
  constructor(items) {
    super();
    this.items = items;
  }
}
class Str extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
}
class Space extends CustomType {
}
class Span extends CustomType {
  constructor(attributes, content) {
    super();
    this.attributes = attributes;
    this.content = content;
  }
}
class Link extends CustomType {
  constructor(attributes, content, target) {
    super();
    this.attributes = attributes;
    this.content = content;
    this.target = target;
  }
}
class Target extends CustomType {
  constructor(url, title2) {
    super();
    this.url = url;
    this.title = title2;
  }
}
class Document extends CustomType {
  constructor(blocks, meta2) {
    super();
    this.blocks = blocks;
    this.meta = meta2;
  }
}

// build/dev/javascript/pandi/pandi/decode.mjs
function target_decoder() {
  return field(0, string2, (url) => {
    return field(1, string2, (title2) => {
      return success(new Target(url, title2));
    });
  });
}
function decode_c_at(index4, decoder2, next) {
  return field("c", at(toList([index4]), decoder2), (value5) => {
    return next(value5);
  });
}
function keyvalue_decoder() {
  return field(0, string2, (key) => {
    return field(1, string2, (value5) => {
      return success([key, value5]);
    });
  });
}
function attributes_decoder() {
  return field(0, string2, (id3) => {
    return field(1, list2(string2), (classes) => {
      return field(2, list2(keyvalue_decoder()), (keyvalues) => {
        return success(new Attributes(id3, classes, keyvalues));
      });
    });
  });
}
function space_decoder() {
  return success(new Space);
}
function str_decoder() {
  return field("c", string2, (content) => {
    return success(new Str(content));
  });
}
function link_decoder() {
  return decode_c_at(0, attributes_decoder(), (attributes) => {
    return decode_c_at(1, list2(recursive(inline_decoder)), (content) => {
      return decode_c_at(2, target_decoder(), (target) => {
        return success(new Link(attributes, content, target));
      });
    });
  });
}
function span_decoder() {
  return decode_c_at(0, attributes_decoder(), (attributes) => {
    return decode_c_at(1, list2(recursive(inline_decoder)), (content) => {
      return success(new Span(attributes, content));
    });
  });
}
function inline_decoder() {
  return field("t", string2, (t) => {
    if (t === "Str") {
      return str_decoder();
    } else if (t === "Space") {
      return space_decoder();
    } else if (t === "Span") {
      return span_decoder();
    } else if (t === "Link") {
      return link_decoder();
    } else {
      return failure(new Space, "Inline");
    }
  });
}
function meta_value_decoder() {
  return field("c", list2(inline_decoder()), (content) => {
    if (content instanceof Empty) {
      return failure("", "pd.MetaInlines");
    } else {
      let $ = content.tail;
      if ($ instanceof Empty) {
        let $1 = content.head;
        if ($1 instanceof Str) {
          let val = $1.content;
          return success(val);
        } else {
          return failure("", "pd.MetaInlines");
        }
      } else {
        return failure("", "pd.MetaInlines");
      }
    }
  });
}
function meta_decoder() {
  let _pipe = dict2(string2, meta_value_decoder());
  return map3(_pipe, to_list);
}
function code_block_decoder() {
  return decode_c_at(0, attributes_decoder(), (attributes) => {
    return decode_c_at(1, string2, (text4) => {
      return success(new CodeBlock(attributes, text4));
    });
  });
}
function plain_decoder() {
  return field("c", list2(inline_decoder()), (content) => {
    return success(new Plain(content));
  });
}
function para_decoder() {
  return field("c", list2(inline_decoder()), (content) => {
    return success(new Para(content));
  });
}
function header_decoder() {
  return decode_c_at(0, int2, (level) => {
    return decode_c_at(1, attributes_decoder(), (attributes) => {
      return decode_c_at(2, list2(inline_decoder()), (content) => {
        return success(new Header(level, attributes, content));
      });
    });
  });
}
function bullet_list_decoder() {
  return field("c", list2(list2(recursive(block_decoder))), (items) => {
    return success(new BulletList(items));
  });
}
function div_decoder() {
  return decode_c_at(0, attributes_decoder(), (attributes) => {
    return decode_c_at(1, list2(recursive(block_decoder)), (content) => {
      return success(new Div(attributes, content));
    });
  });
}
function block_decoder() {
  return field("t", string2, (t) => {
    if (t === "Header") {
      return header_decoder();
    } else if (t === "Para") {
      return para_decoder();
    } else if (t === "Plain") {
      return plain_decoder();
    } else if (t === "CodeBlock") {
      return code_block_decoder();
    } else if (t === "Div") {
      return div_decoder();
    } else if (t === "BulletList") {
      return bullet_list_decoder();
    } else {
      return failure(new Para(toList([])), "Block");
    }
  });
}
function document_decoder() {
  return field("blocks", list2(block_decoder()), (blocks) => {
    return field("meta", meta_decoder(), (meta2) => {
      return success(new Document(blocks, meta2));
    });
  });
}
// build/dev/javascript/gleam_http/gleam/http.mjs
class Get extends CustomType {
}
class Post extends CustomType {
}
class Head extends CustomType {
}
class Put extends CustomType {
}
class Delete extends CustomType {
}
class Trace extends CustomType {
}
class Connect extends CustomType {
}
class Options extends CustomType {
}
class Patch2 extends CustomType {
}
class Http extends CustomType {
}
class Https extends CustomType {
}
function method_to_string(method) {
  if (method instanceof Get) {
    return "GET";
  } else if (method instanceof Post) {
    return "POST";
  } else if (method instanceof Head) {
    return "HEAD";
  } else if (method instanceof Put) {
    return "PUT";
  } else if (method instanceof Delete) {
    return "DELETE";
  } else if (method instanceof Trace) {
    return "TRACE";
  } else if (method instanceof Connect) {
    return "CONNECT";
  } else if (method instanceof Options) {
    return "OPTIONS";
  } else if (method instanceof Patch2) {
    return "PATCH";
  } else {
    let method$1 = method[0];
    return method$1;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http);
  } else if ($ === "https") {
    return new Ok(new Https);
  } else {
    return new Error(undefined);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
class Request extends CustomType {
  constructor(method, headers, body, scheme, host2, port, path, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.scheme = scheme;
    this.host = host2;
    this.port = port;
    this.path = path;
    this.query = query;
  }
}
function to_uri(request) {
  return new Uri(new Some(scheme_to_string(request.scheme)), new None, new Some(request.host), request.port, request.path, request.query, new None);
}
function from_uri(uri) {
  return try$((() => {
    let _pipe = uri.scheme;
    let _pipe$1 = unwrap(_pipe, "");
    return scheme_from_string(_pipe$1);
  })(), (scheme) => {
    return try$((() => {
      let _pipe = uri.host;
      return to_result(_pipe, undefined);
    })(), (host2) => {
      let req = new Request(new Get, toList([]), "", scheme, host2, uri.port, uri.path, uri.query);
      return new Ok(req);
    });
  });
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
class Response extends CustomType {
  constructor(status, headers, body) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
}
var Response$Response = (status, headers, body) => new Response(status, headers, body);
function set_body(response, body) {
  return new Response(response.status, response.headers, body);
}
function get_header(response, key) {
  return key_find(response.headers, lowercase(key));
}
function map8(response, transform) {
  let _pipe = response.body;
  let _pipe$1 = transform(_pipe);
  return ((_capture) => {
    return set_body(response, _capture);
  })(_pipe$1);
}
// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
class PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value5) {
    return value5 instanceof Promise ? new PromiseLayer(value5) : value5;
  }
  static unwrap(value5) {
    return value5 instanceof PromiseLayer ? value5.promise : value5;
  }
}
function resolve(value5) {
  return Promise.resolve(PromiseLayer.wrap(value5));
}
function then_await(promise, fn) {
  return promise.then((value5) => fn(PromiseLayer.unwrap(value5)));
}
function map_promise(promise, fn) {
  return promise.then((value5) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value5))));
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(_pipe, (a2) => {
    callback(a2);
    return a2;
  });
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(_pipe, (result) => {
    if (result instanceof Ok) {
      let a2 = result[0];
      return callback(a2);
    } else {
      let e = result[0];
      return resolve(new Error(e));
    }
  });
}
// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return Result$Ok(await fetch(request));
  } catch (error) {
    return Result$Error(FetchError$NetworkError(error.toString()));
  }
}
function from_fetch_response(response) {
  let headers = [...response.headers].reverse();
  return Response$Response(response.status, arrayToList2(headers), response);
}
function request_common(request) {
  let url = to_string4(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers;
  for (let [k, v] of headersList)
    headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body;
  try {
    body = await response.body.text();
  } catch (error) {
    return Result$Error(FetchError$UnableToReadBody());
  }
  return Result$Ok(map8(response, () => body));
}
function arrayToList2(array3) {
  let list4 = List$Empty();
  for (const element16 of array3) {
    list4 = List$NonEmpty(element16, list4);
  }
  return list4;
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
class NetworkError extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
var FetchError$NetworkError = ($0) => new NetworkError($0);
class UnableToReadBody extends CustomType {
}
var FetchError$UnableToReadBody = () => new UnableToReadBody;
function send2(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(_pipe$2, (resp) => {
    return resolve(new Ok(from_fetch_response(resp)));
  });
}
// build/dev/javascript/rsvp/rsvp.ffi.mjs
var from_relative_url = (url_string) => {
  if (!globalThis.location)
    return new Error(undefined);
  const url = new URL(url_string, globalThis.location.href);
  const uri = uri_from_url2(url);
  return new Ok(uri);
};
var uri_from_url2 = (url) => {
  const optional2 = (value5) => value5 ? new Some(value5) : new None;
  return new Uri(optional2(url.protocol?.slice(0, -1)), new None, optional2(url.hostname), optional2(url.port && Number(url.port)), url.pathname, optional2(url.search?.slice(1)), optional2(url.hash?.slice(1)));
};

// build/dev/javascript/rsvp/rsvp.mjs
class BadBody extends CustomType {
}
class BadUrl extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class HttpError extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class NetworkError2 extends CustomType {
}
class UnhandledResponse extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class Handler2 extends CustomType {
  constructor(run2) {
    super();
    this.run = run2;
  }
}
function expect_ok_response(handler2) {
  return new Handler2((result) => {
    return handler2(try$(result, (response) => {
      let $ = response.status;
      let code2 = $;
      if (code2 >= 200 && code2 < 300) {
        return new Ok(response);
      } else {
        let code3 = $;
        if (code3 >= 400 && code3 < 600) {
          return new Error(new HttpError(response));
        } else {
          return new Error(new UnhandledResponse(response));
        }
      }
    }));
  });
}
function expect_text_response(handler2) {
  return expect_ok_response((result) => {
    return handler2(try$(result, (response) => {
      let $ = get_header(response, "content-type");
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1.startsWith("text/")) {
          return new Ok(response);
        } else {
          return new Error(new UnhandledResponse(response));
        }
      } else {
        return new Error(new UnhandledResponse(response));
      }
    }));
  });
}
function expect_text(handler2) {
  return expect_text_response((result) => {
    let _pipe = result;
    let _pipe$1 = map4(_pipe, (response) => {
      return response.body;
    });
    return handler2(_pipe$1);
  });
}
function reject(err, handler2) {
  return from2((dispatch2) => {
    let _pipe = new Error(err);
    let _pipe$1 = handler2.run(_pipe);
    return dispatch2(_pipe$1);
  });
}
function do_send(request, handler2) {
  return from2((dispatch2) => {
    let _pipe = send2(request);
    let _pipe$1 = try_await(_pipe, read_text_body);
    let _pipe$2 = map_promise(_pipe$1, (_capture) => {
      return map_error(_capture, (error) => {
        if (error instanceof NetworkError) {
          return new NetworkError2;
        } else if (error instanceof UnableToReadBody) {
          return new BadBody;
        } else {
          return new BadBody;
        }
      });
    });
    let _pipe$3 = map_promise(_pipe$2, handler2.run);
    tap(_pipe$3, dispatch2);
    return;
  });
}
function send3(request, handler2) {
  return do_send(request, handler2);
}
function to_uri2(uri_string) {
  let _block;
  if (uri_string.startsWith("./")) {
    _block = from_relative_url(uri_string);
  } else if (uri_string.charCodeAt(0) === 47) {
    _block = from_relative_url(uri_string);
  } else {
    _block = parse2(uri_string);
  }
  let _pipe = _block;
  return replace_error(_pipe, new BadUrl(uri_string));
}
function get3(url, handler2) {
  let $ = to_uri2(url);
  if ($ instanceof Ok) {
    let uri = $[0];
    let $1 = from_uri(uri);
    if ($1 instanceof Ok) {
      let request = $1[0];
      return send3(request, handler2);
    } else {
      return reject(new BadUrl(url), handler2);
    }
  } else {
    let err = $[0];
    return reject(err, handler2);
  }
}

// build/dev/javascript/website/route.mjs
class Index2 extends CustomType {
}
class Posts extends CustomType {
}
class PostById extends CustomType {
  constructor(id3) {
    super();
    this.id = id3;
  }
}
class About extends CustomType {
}
class NotFound extends CustomType {
  constructor(uri) {
    super();
    this.uri = uri;
  }
}
var base_path = "/website";
function parse_route(uri) {
  let segments = path_segments(uri.path);
  let _block;
  if (segments instanceof Empty) {
    _block = segments;
  } else {
    let $ = segments.head;
    if ($ === "website") {
      let rest = segments.tail;
      _block = rest;
    } else {
      _block = segments;
    }
  }
  let path = _block;
  if (path instanceof Empty) {
    return new Index2;
  } else {
    let $ = path.tail;
    if ($ instanceof Empty) {
      let $1 = path.head;
      if ($1 === "") {
        return new Index2;
      } else if ($1 === "posts") {
        return new Posts;
      } else if ($1 === "about") {
        return new About;
      } else {
        return new NotFound(uri);
      }
    } else {
      let $1 = $.tail;
      if ($1 instanceof Empty) {
        let $2 = path.head;
        if ($2 === "posts") {
          let post_id = $.head;
          return new PostById(post_id);
        } else {
          return new NotFound(uri);
        }
      } else {
        return new NotFound(uri);
      }
    }
  }
}
function href2(route) {
  let _block;
  if (route instanceof Index2) {
    _block = base_path + "/";
  } else if (route instanceof Posts) {
    _block = base_path + "/posts";
  } else if (route instanceof PostById) {
    let post_id = route.id;
    _block = base_path + "/posts/" + post_id;
  } else if (route instanceof About) {
    _block = base_path + "/about";
  } else {
    _block = base_path + "/404";
  }
  let url = _block;
  return href(url);
}

// build/dev/javascript/website/model.mjs
class Model17 extends CustomType {
  constructor(posts, route) {
    super();
    this.posts = posts;
    this.route = route;
  }
}
class UserNavigatedTo extends CustomType {
  constructor(route) {
    super();
    this.route = route;
  }
}
class BlogFetched extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
class BlogPost extends CustomType {
  constructor(title2, date_created, document2) {
    super();
    this.title = title2;
    this.date_created = date_created;
    this.document = document2;
  }
}
var blog_url = "https://raw.githubusercontent.com/olavlan/blog/master/blog.json";
function fetch_blog() {
  return get3(blog_url, expect_text((var0) => {
    return new BlogFetched(var0);
  }));
}
function init18(_) {
  let _block;
  let $ = do_initial_uri();
  if ($ instanceof Ok) {
    let uri = $[0];
    _block = parse_route(uri);
  } else {
    _block = new Index2;
  }
  let route = _block;
  let modem_effect = init17((uri) => {
    let _pipe = parse_route(uri);
    return new UserNavigatedTo(_pipe);
  });
  return [
    new Model17(new Error(undefined), route),
    batch(toList([modem_effect, fetch_blog()]))
  ];
}
function blog_post_decoder() {
  return field("title", string2, (title2) => {
    return field("date_created", string2, (date_created) => {
      return field("pandoc", document_decoder(), (document2) => {
        return success(new BlogPost(title2, date_created, document2));
      });
    });
  });
}
function blog_decoder() {
  return field("posts", dict2(string2, blog_post_decoder()), (posts) => {
    return success(posts);
  });
}
function update18(model, message2) {
  if (message2 instanceof UserNavigatedTo) {
    let route = message2.route;
    return [new Model17(model.posts, route), none()];
  } else {
    let $ = message2[0];
    if ($ instanceof Ok) {
      let body = $[0];
      let _block;
      let _pipe = body;
      _block = parse(_pipe, blog_decoder());
      let decoded = _block;
      if (decoded instanceof Ok) {
        let posts = decoded[0];
        return [new Model17(new Ok(posts), model.route), none()];
      } else {
        return [new Model17(new Error(undefined), model.route), none()];
      }
    } else {
      return [new Model17(new Error(undefined), model.route), none()];
    }
  }
}

// build/dev/javascript/pandi/pandi/lustre.mjs
function attributes_to_lustre(attrs) {
  let _block;
  let $ = attrs.id;
  if ($ === "") {
    _block = toList([]);
  } else {
    let id4 = $;
    _block = toList([id(id4)]);
  }
  let id3 = _block;
  let _block$1;
  let $1 = attrs.classes;
  if ($1 instanceof Empty) {
    _block$1 = $1;
  } else {
    let classes2 = $1;
    _block$1 = toList([class$(join(classes2, " "))]);
  }
  let classes = _block$1;
  let keyvalues = map2(attrs.keyvalues, (kv) => {
    return attribute2(kv[0], kv[1]);
  });
  return flatten(toList([id3, classes, keyvalues]));
}
function inline_to_lustre_with(inline2, inline_renderer, meta2) {
  let $ = inline_renderer(inline2, meta2);
  if ($ instanceof Some) {
    let el = $[0];
    return el;
  } else {
    if (inline2 instanceof Str) {
      let content = inline2.content;
      return text3(content);
    } else if (inline2 instanceof Space) {
      return text3(" ");
    } else if (inline2 instanceof Span) {
      let attrs = inline2.attributes;
      let content = inline2.content;
      let inlines = map2(content, (_capture) => {
        return inline_to_lustre_with(_capture, inline_renderer, meta2);
      });
      let attributes = attributes_to_lustre(attrs);
      return span(attributes, inlines);
    } else {
      let attrs = inline2.attributes;
      let content = inline2.content;
      let target = inline2.target;
      let inlines = map2(content, (_capture) => {
        return inline_to_lustre_with(_capture, inline_renderer, meta2);
      });
      let attributes = attributes_to_lustre(attrs);
      let href3 = href(target.url);
      let _block;
      let $1 = target.title;
      if ($1 === "") {
        _block = toList([]);
      } else {
        let title3 = $1;
        _block = toList([title(title3)]);
      }
      let title2 = _block;
      return a(flatten(toList([attributes, toList([href3]), title2])), inlines);
    }
  }
}
function block_to_lustre_with(block, block_renderer, inline_renderer, meta2) {
  let $ = block_renderer(block, meta2);
  if ($ instanceof Some) {
    let el = $[0];
    return el;
  } else {
    if (block instanceof Header) {
      let level = block.level;
      let attrs = block.attributes;
      let content = block.content;
      let inlines = map2(content, (_capture) => {
        return inline_to_lustre_with(_capture, inline_renderer, meta2);
      });
      let attrs$1 = attributes_to_lustre(attrs);
      if (level === 1) {
        return h1(attrs$1, inlines);
      } else if (level === 2) {
        return h2(attrs$1, inlines);
      } else if (level === 4) {
        return h4(attrs$1, inlines);
      } else if (level === 5) {
        return h5(attrs$1, inlines);
      } else {
        return h6(attrs$1, inlines);
      }
    } else if (block instanceof Para) {
      let content = block.content;
      let inlines = map2(content, (_capture) => {
        return inline_to_lustre_with(_capture, inline_renderer, meta2);
      });
      return p(toList([]), inlines);
    } else if (block instanceof Plain) {
      let content = block.content;
      let inlines = map2(content, (_capture) => {
        return inline_to_lustre_with(_capture, inline_renderer, meta2);
      });
      return span(toList([]), inlines);
    } else if (block instanceof CodeBlock) {
      let attrs = block.attributes;
      let text4 = block.text;
      let attributes = attributes_to_lustre(attrs);
      return pre(attributes, toList([code(toList([]), toList([text3(text4)]))]));
    } else if (block instanceof Div) {
      let attrs = block.attributes;
      let content = block.content;
      let blocks = map2(content, (_capture) => {
        return block_to_lustre_with(_capture, block_renderer, inline_renderer, meta2);
      });
      let attributes = attributes_to_lustre(attrs);
      return div(attributes, blocks);
    } else {
      let items = block.items;
      let list_items = map2(items, (item2) => {
        let blocks = map2(item2, (_capture) => {
          return block_to_lustre_with(_capture, block_renderer, inline_renderer, meta2);
        });
        return li(toList([]), blocks);
      });
      return ul(toList([]), list_items);
    }
  }
}
function block_to_lustre(block) {
  return block_to_lustre_with(block, (_, _1) => {
    return new None;
  }, (_, _1) => {
    return new None;
  }, toList([]));
}
function inline_to_lustre(inline2) {
  return inline_to_lustre_with(inline2, (_, _1) => {
    return new None;
  }, toList([]));
}
function blocks_to_lustre_with(blocks, block_renderer, inline_renderer, meta2) {
  let elements = map2(blocks, (_capture) => {
    return block_to_lustre_with(_capture, block_renderer, inline_renderer, meta2);
  });
  return fragment2(elements);
}
function to_lustre_with(document2, block_renderer, inline_renderer) {
  return blocks_to_lustre_with(document2.blocks, block_renderer, inline_renderer, document2.meta);
}

// build/dev/javascript/website/view.mjs
var tooltip_popover_class = `flex flex-col px-2 py-1 rounded-md bg-black text-white text-xs shadow
  opacity-0 scale-99 [:state(open)]:opacity-100 [:state(open)]:scale-100

  [:state(top)]:left-(--tooltip-popover-x) [:state(top)]:top-[calc(var(--tooltip-popover-y)+10px)] [:state(top)]:transition-[top_opacity_transform]
  [:state(top):state(open)]:top-(--tooltip-popover-y)

  [:state(bottom)]:left-(--tooltip-popover-x) [:state(bottom)]:top-[calc(var(--tooltip-popover-y)-10px)] [:state(bottom)]:transition-[top_opacity_transform]
  [:state(bottom):state(open)]:top-(--tooltip-popover-y)

  [:state(left)]:top-(--tooltip-popover-y) [:state(left)]:left-[calc(var(--tooltip-popover-x)+10px)] [:state(left)]:transition-[left_opacity_transform]
  [:state(left):state(open)]:left-(--tooltip-popover-x)

  [:state(right)]:top-(--tooltip-popover-y) [:state(right)]:left-[calc(var(--tooltip-popover-x)-10px)] [:state(right)]:transition-[left_opacity_transform]
  [:state(right):state(open)]:left-(--tooltip-popover-x)`;
var accordion_panel_class = "h-(--accordion-panel-height) overflow-hidden transition-[height] ease-out";
var accordion_trigger_class = `block w-full bg-gray-50 p-2 text-left
  hover:bg-gray-100
  focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800`;
var accordion_item_class = "border-b border-gray-100";
var accordion_class = "w-lg";
function paragraph(text4) {
  return p(toList([]), toList([text3(text4)]));
}
function title2(title3) {
  return h2(toList([]), toList([text3(title3)]));
}
function view_not_found() {
  return toList([title2("Not found"), paragraph("Nothing was found here.")]);
}
function view_about() {
  return toList([
    title2("Me"),
    paragraph("I'm a homely person in my thirties living in the outskirts of Oslo with my partner and cat.")
  ]);
}
function link(target, title3) {
  return a(toList([href2(target)]), toList([text3(title3)]));
}
function definition(definition_text, content) {
  return view18(toList([]), popover(toList([class$(tooltip_popover_class), side("top")]), toList([text3(definition_text)])), trigger2(toList([]), (() => {
    let _pipe = content;
    return map2(_pipe, inline_to_lustre);
  })()));
}
function inline_renderer() {
  return (inline2, _) => {
    if (inline2 instanceof Span) {
      let $ = inline2.attributes.keyvalues;
      if ($ instanceof Empty) {
        return new None;
      } else {
        let $1 = $.tail;
        if ($1 instanceof Empty) {
          let $2 = $.head[0];
          if ($2 === "definition") {
            let content = inline2.content;
            let definition_text = $.head[1];
            return new Some(definition(definition_text, content));
          } else {
            return new None;
          }
        } else {
          return new None;
        }
      }
    } else {
      return new None;
    }
  };
}
function expandable_box(header, content) {
  return view6(toList([class$(accordion_class)]), toList([
    item("test", toList([class$(accordion_item_class)]), heading(toList([]), trigger(toList([class$(accordion_trigger_class)]), (() => {
      let _pipe = header;
      return map2(_pipe, inline_to_lustre);
    })())), panel(toList([class$(accordion_panel_class)]), (() => {
      let _pipe = content;
      return map2(_pipe, block_to_lustre);
    })()))
  ]));
}
function block_renderer() {
  return (block, _) => {
    if (block instanceof Div) {
      let $ = block.content;
      if ($ instanceof Empty) {
        return new None;
      } else {
        let $1 = $.head;
        if ($1 instanceof Header) {
          let $2 = $1.level;
          if ($2 === 1) {
            let rest = $.tail;
            let inlines = $1.content;
            return new Some(expandable_box(inlines, rest));
          } else {
            return new None;
          }
        } else {
          return new None;
        }
      }
    } else {
      return new None;
    }
  };
}
function view_post(model, post_id) {
  let $ = model.posts;
  if ($ instanceof Ok) {
    let posts = $[0];
    let $1 = get(posts, post_id);
    if ($1 instanceof Ok) {
      let post = $1[0];
      return toList([
        article(toList([]), toList([
          to_lustre_with(post.document, block_renderer(), inline_renderer())
        ])),
        p(toList([]), toList([link(new Posts, "<- Go back")]))
      ]);
    } else {
      return view_not_found();
    }
  } else {
    return toList([title2("Loading...")]);
  }
}
function summary(title3, route, text4) {
  return article(toList([]), toList([h3(toList([]), toList([link(route, title3)])), paragraph(text4)]));
}
function view_post_summary(entry) {
  let id3;
  let post;
  id3 = entry[0];
  post = entry[1];
  return summary(post.title, new PostById(id3), post.date_created);
}
function view_post_list(model) {
  let $ = model.posts;
  if ($ instanceof Ok) {
    let posts = $[0];
    let _block;
    let _pipe = to_list(posts);
    _block = map2(_pipe, view_post_summary);
    let entries = _block;
    return prepend(title2("Posts"), entries);
  } else {
    return toList([title2("Loading...")]);
  }
}
function view_index() {
  return toList([
    title2("olavlan"),
    paragraph("Here I post about things that interest me, which is currently functional programming, typing and Gleam.")
  ]);
}
function view_menu_item(target, current, text4) {
  let _block;
  if (current instanceof PostById && target instanceof Posts) {
    _block = true;
  } else {
    _block = isEqual(current, target);
  }
  let is_active = _block;
  let _block$1;
  if (is_active) {
    _block$1 = text3(text4);
  } else {
    _block$1 = link(target, text4);
  }
  let inline2 = _block$1;
  return li(toList([]), toList([inline2]));
}
function view20(model) {
  return div(toList([]), toList([
    nav(toList([]), toList([
      h1(toList([]), toList([link(new Index2, "My little website")])),
      ul(toList([]), toList([
        view_menu_item(new Posts, model.route, "Posts"),
        view_menu_item(new About, model.route, "About")
      ]))
    ])),
    main(toList([]), (() => {
      let $ = model.route;
      if ($ instanceof Index2) {
        return view_index();
      } else if ($ instanceof Posts) {
        return view_post_list(model);
      } else if ($ instanceof PostById) {
        let post_id = $.id;
        return view_post(model, post_id);
      } else if ($ instanceof About) {
        return view_about();
      } else {
        return view_not_found();
      }
    })())
  ]));
}

// build/dev/javascript/website/website.mjs
var FILEPATH = "src/website.gleam";
function main2() {
  let $ = register21();
  if (!($ instanceof Ok)) {
    throw makeError("let_assert", FILEPATH, "website", 7, "main", "Pattern match failed, no pattern matched the value.", { value: $, start: 75, end: 109, pattern_start: 86, pattern_end: 93 });
  }
  let app = application(init18, update18, view20);
  let $1 = start4(app, "#app", undefined);
  if (!($1 instanceof Ok)) {
    throw makeError("let_assert", FILEPATH, "website", 9, "main", "Pattern match failed, no pattern matched the value.", { value: $1, start: 180, end: 229, pattern_start: 191, pattern_end: 196 });
  }
  return;
}

// .lustre/build/website.mjs
main2();
