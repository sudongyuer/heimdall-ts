var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getAugmentedNamespace(n) {
  if (n.__esModule)
    return n;
  var a = Object.defineProperty({}, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
var build$3 = {};
var RSocketClient$1 = {};
var build$2 = {};
var Flowable$1 = {};
var FlowableMapOperator$1 = {};
Object.defineProperty(FlowableMapOperator$1, "__esModule", { value: true });
FlowableMapOperator$1.default = void 0;
class FlowableMapOperator {
  constructor(subscriber, fn) {
    this._fn = fn;
    this._subscriber = subscriber;
    this._subscription = null;
  }
  onComplete() {
    this._subscriber.onComplete();
  }
  onError(error) {
    this._subscriber.onError(error);
  }
  onNext(t) {
    try {
      this._subscriber.onNext(this._fn(t));
    } catch (e) {
      if (!this._subscription) {
        throw new Error("subscription is null");
      }
      this._subscription.cancel();
      this._subscriber.onError(e);
    }
  }
  onSubscribe(subscription) {
    this._subscription = subscription;
    this._subscriber.onSubscribe(subscription);
  }
}
FlowableMapOperator$1.default = FlowableMapOperator;
var FlowableTakeOperator$1 = {};
Object.defineProperty(FlowableTakeOperator$1, "__esModule", { value: true });
FlowableTakeOperator$1.default = void 0;
class FlowableTakeOperator {
  constructor(subscriber, toTake) {
    this._subscriber = subscriber;
    this._subscription = null;
    this._toTake = toTake;
  }
  onComplete() {
    this._subscriber.onComplete();
  }
  onError(error) {
    this._subscriber.onError(error);
  }
  onNext(t) {
    try {
      this._subscriber.onNext(t);
      if (--this._toTake === 0) {
        this._cancelAndComplete();
      }
    } catch (e) {
      if (!this._subscription) {
        throw new Error("subscription is null");
      }
      this._subscription.cancel();
      this._subscriber.onError(e);
    }
  }
  onSubscribe(subscription) {
    this._subscription = subscription;
    this._subscriber.onSubscribe(subscription);
    if (this._toTake <= 0) {
      this._cancelAndComplete();
    }
  }
  _cancelAndComplete() {
    if (!this._subscription) {
      throw new Error("subscription is null");
    }
    this._subscription.cancel();
    this._subscriber.onComplete();
  }
}
FlowableTakeOperator$1.default = FlowableTakeOperator;
function invariant$1(condition, format, ...args) {
  if (!condition) {
    let error;
    if (format === void 0) {
      error = new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");
    } else {
      let argIndex = 0;
      error = new Error(format.replace(/%s/g, () => String(args[argIndex++])));
      error.name = "Invariant Violation";
    }
    error.framesToPop = 1;
    throw error;
  }
}
var Invariant$1 = invariant$1;
Object.defineProperty(Flowable$1, "__esModule", { value: true });
Flowable$1.default = void 0;
var _FlowableMapOperator = _interopRequireDefault$a(FlowableMapOperator$1);
var _FlowableTakeOperator = _interopRequireDefault$a(FlowableTakeOperator$1);
var _Invariant$7 = _interopRequireDefault$a(Invariant$1);
function _interopRequireDefault$a(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _defineProperty$7(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
class Flowable {
  static just(...values) {
    return new Flowable((subscriber) => {
      let cancelled = false;
      let i = 0;
      subscriber.onSubscribe({
        cancel: () => {
          cancelled = true;
        },
        request: (n) => {
          while (!cancelled && n > 0 && i < values.length) {
            subscriber.onNext(values[i++]);
            n--;
          }
          if (!cancelled && i == values.length) {
            subscriber.onComplete();
          }
        }
      });
    });
  }
  static error(error) {
    return new Flowable((subscriber) => {
      subscriber.onSubscribe({
        cancel: () => {
        },
        request: () => {
          subscriber.onError(error);
        }
      });
    });
  }
  static never() {
    return new Flowable((subscriber) => {
      subscriber.onSubscribe({
        cancel: () => {
        },
        request: () => {
        }
      });
    });
  }
  constructor(source, max = Number.MAX_SAFE_INTEGER) {
    this._max = max;
    this._source = source;
  }
  subscribe(subscriberOrCallback) {
    let partialSubscriber;
    if (typeof subscriberOrCallback === "function") {
      partialSubscriber = this._wrapCallback(subscriberOrCallback);
    } else {
      partialSubscriber = subscriberOrCallback;
    }
    const subscriber = new FlowableSubscriber(partialSubscriber, this._max);
    this._source(subscriber);
  }
  lift(onSubscribeLift) {
    return new Flowable((subscriber) => this._source(onSubscribeLift(subscriber)));
  }
  map(fn) {
    return this.lift((subscriber) => new _FlowableMapOperator.default(subscriber, fn));
  }
  take(toTake) {
    return this.lift((subscriber) => new _FlowableTakeOperator.default(subscriber, toTake));
  }
  _wrapCallback(callback) {
    const max = this._max;
    return {
      onNext: callback,
      onSubscribe(subscription) {
        subscription.request(max);
      }
    };
  }
}
Flowable$1.default = Flowable;
class FlowableSubscriber {
  constructor(subscriber, max) {
    _defineProperty$7(this, "_cancel", () => {
      if (!this._active) {
        return;
      }
      this._active = false;
      if (this._subscription) {
        this._subscription.cancel();
      }
    });
    _defineProperty$7(this, "_request", (n) => {
      (0, _Invariant$7.default)(Number.isInteger(n) && n >= 1 && n <= this._max, "Flowable: Expected request value to be an integer with a value greater than 0 and less than or equal to %s, got `%s`.", this._max, n);
      if (!this._active) {
        return;
      }
      if (n === this._max) {
        this._pending = this._max;
      } else {
        this._pending += n;
        if (this._pending >= this._max) {
          this._pending = this._max;
        }
      }
      if (this._subscription) {
        this._subscription.request(n);
      }
    });
    this._active = false;
    this._max = max;
    this._pending = 0;
    this._started = false;
    this._subscriber = subscriber || {};
    this._subscription = null;
  }
  onComplete() {
    if (!this._active) {
      console.warn("Flowable: Invalid call to onComplete(): %s.", this._started ? "onComplete/onError was already called" : "onSubscribe has not been called");
      return;
    }
    this._active = false;
    this._started = true;
    try {
      if (this._subscriber.onComplete) {
        this._subscriber.onComplete();
      }
    } catch (error) {
      if (this._subscriber.onError) {
        this._subscriber.onError(error);
      }
    }
  }
  onError(error) {
    if (this._started && !this._active) {
      console.warn("Flowable: Invalid call to onError(): %s.", this._active ? "onComplete/onError was already called" : "onSubscribe has not been called");
      return;
    }
    this._active = false;
    this._started = true;
    this._subscriber.onError && this._subscriber.onError(error);
  }
  onNext(data) {
    if (!this._active) {
      console.warn("Flowable: Invalid call to onNext(): %s.", this._active ? "onComplete/onError was already called" : "onSubscribe has not been called");
      return;
    }
    if (this._pending === 0) {
      console.warn("Flowable: Invalid call to onNext(), all request()ed values have been published.");
      return;
    }
    if (this._pending !== this._max) {
      this._pending--;
    }
    try {
      this._subscriber.onNext && this._subscriber.onNext(data);
    } catch (error) {
      if (this._subscription) {
        this._subscription.cancel();
      }
      this.onError(error);
    }
  }
  onSubscribe(subscription) {
    if (this._started) {
      console.warn("Flowable: Invalid call to onSubscribe(): already called.");
      return;
    }
    this._active = true;
    this._started = true;
    this._subscription = subscription;
    try {
      this._subscriber.onSubscribe && this._subscriber.onSubscribe({
        cancel: this._cancel,
        request: this._request
      });
    } catch (error) {
      this.onError(error);
    }
  }
}
var Single$1 = {};
Object.defineProperty(Single$1, "__esModule", { value: true });
Single$1.default = void 0;
class Single {
  static of(value) {
    return new Single((subscriber) => {
      subscriber.onSubscribe();
      subscriber.onComplete(value);
    });
  }
  static error(error) {
    return new Single((subscriber) => {
      subscriber.onSubscribe();
      subscriber.onError(error);
    });
  }
  static never() {
    return new Single((subscriber) => {
      subscriber.onSubscribe();
    });
  }
  constructor(source) {
    this._source = source;
  }
  subscribe(partialSubscriber) {
    const subscriber = new FutureSubscriber(partialSubscriber);
    try {
      this._source(subscriber);
    } catch (error) {
      subscriber.onError(error);
    }
  }
  flatMap(fn) {
    return new Single((subscriber) => {
      let currentCancel;
      const cancel = () => {
        currentCancel && currentCancel();
        currentCancel = null;
      };
      this._source({
        onComplete: (value) => {
          fn(value).subscribe({
            onComplete: (mapValue) => {
              subscriber.onComplete(mapValue);
            },
            onError: (error) => subscriber.onError(error),
            onSubscribe: (_cancel) => {
              currentCancel = _cancel;
            }
          });
        },
        onError: (error) => subscriber.onError(error),
        onSubscribe: (_cancel) => {
          currentCancel = _cancel;
          subscriber.onSubscribe(cancel);
        }
      });
    });
  }
  map(fn) {
    return new Single((subscriber) => {
      return this._source({
        onComplete: (value) => subscriber.onComplete(fn(value)),
        onError: (error) => subscriber.onError(error),
        onSubscribe: (cancel) => subscriber.onSubscribe(cancel)
      });
    });
  }
  then(successFn, errorFn) {
    this.subscribe({
      onComplete: successFn || (() => {
      }),
      onError: errorFn || (() => {
      })
    });
  }
}
Single$1.default = Single;
class FutureSubscriber {
  constructor(subscriber) {
    this._active = false;
    this._started = false;
    this._subscriber = subscriber || {};
  }
  onComplete(value) {
    if (!this._active) {
      console.warn("Single: Invalid call to onComplete(): %s.", this._started ? "onComplete/onError was already called" : "onSubscribe has not been called");
      return;
    }
    this._active = false;
    this._started = true;
    try {
      if (this._subscriber.onComplete) {
        this._subscriber.onComplete(value);
      }
    } catch (error) {
      if (this._subscriber.onError) {
        this._subscriber.onError(error);
      }
    }
  }
  onError(error) {
    if (this._started && !this._active) {
      console.warn("Single: Invalid call to onError(): %s.", this._active ? "onComplete/onError was already called" : "onSubscribe has not been called");
      return;
    }
    this._active = false;
    this._started = true;
    this._subscriber.onError && this._subscriber.onError(error);
  }
  onSubscribe(cancel) {
    if (this._started) {
      console.warn("Single: Invalid call to onSubscribe(): already called.");
      return;
    }
    this._active = true;
    this._started = true;
    try {
      this._subscriber.onSubscribe && this._subscriber.onSubscribe(() => {
        if (!this._active) {
          return;
        }
        this._active = false;
        cancel && cancel();
      });
    } catch (error) {
      this.onError(error);
    }
  }
}
var FlowableProcessor$1 = {};
Object.defineProperty(FlowableProcessor$1, "__esModule", { value: true });
FlowableProcessor$1.default = void 0;
class FlowableProcessor {
  constructor(source, fn) {
    this._source = source;
    this._transformer = fn;
    this._done = false;
    this._mappers = [];
  }
  onSubscribe(subscription) {
    this._subscription = subscription;
  }
  onNext(t) {
    if (!this._sink) {
      console.warn("premature onNext for processor, dropping value");
      return;
    }
    let val = t;
    if (this._transformer) {
      val = this._transformer(t);
    }
    const finalVal = this._mappers.reduce((interimVal, mapper) => mapper(interimVal), val);
    this._sink.onNext(finalVal);
  }
  onError(error) {
    this._error = error;
    if (!this._sink) {
      console.warn("premature onError for processor, marking complete/errored");
    } else {
      this._sink.onError(error);
    }
  }
  onComplete() {
    this._done = true;
    if (!this._sink) {
      console.warn("premature onError for processor, marking complete");
    } else {
      this._sink.onComplete();
    }
  }
  subscribe(subscriber) {
    if (this._source.subscribe) {
      this._source.subscribe(this);
    }
    this._sink = subscriber;
    this._sink.onSubscribe(this);
    if (this._error) {
      this._sink.onError(this._error);
    } else if (this._done) {
      this._sink.onComplete();
    }
  }
  map(fn) {
    this._mappers.push(fn);
    return this;
  }
  request(n) {
    this._subscription && this._subscription.request(n);
  }
  cancel() {
    this._subscription && this._subscription.cancel();
  }
}
FlowableProcessor$1.default = FlowableProcessor;
var FlowableTimer = {};
Object.defineProperty(FlowableTimer, "__esModule", { value: true });
FlowableTimer.every = every;
var _Flowable = _interopRequireDefault$9(Flowable$1);
function _interopRequireDefault$9(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function every(ms) {
  return new _Flowable.default((subscriber) => {
    let intervalId = null;
    let pending = 0;
    subscriber.onSubscribe({
      cancel: () => {
        if (intervalId != null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      },
      request: (n) => {
        if (n < Number.MAX_SAFE_INTEGER) {
          pending += n;
        } else {
          pending = Number.MAX_SAFE_INTEGER;
        }
        if (intervalId != null) {
          return;
        }
        intervalId = setInterval(() => {
          if (pending > 0) {
            if (pending !== Number.MAX_SAFE_INTEGER) {
              pending--;
            }
            subscriber.onNext(Date.now());
          }
        }, ms);
      }
    });
  });
}
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  Object.defineProperty(exports, "Flowable", {
    enumerable: true,
    get: function() {
      return _Flowable2.default;
    }
  });
  Object.defineProperty(exports, "Single", {
    enumerable: true,
    get: function() {
      return _Single.default;
    }
  });
  Object.defineProperty(exports, "FlowableProcessor", {
    enumerable: true,
    get: function() {
      return _FlowableProcessor.default;
    }
  });
  Object.defineProperty(exports, "every", {
    enumerable: true,
    get: function() {
      return _FlowableTimer.every;
    }
  });
  var _Flowable2 = _interopRequireDefault2(Flowable$1);
  var _Single = _interopRequireDefault2(Single$1);
  var _FlowableProcessor = _interopRequireDefault2(FlowableProcessor$1);
  var _FlowableTimer = FlowableTimer;
  function _interopRequireDefault2(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
})(build$2);
function invariant(condition, format, ...args) {
  if (!condition) {
    let error;
    if (format === void 0) {
      error = new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");
    } else {
      let argIndex = 0;
      error = new Error(format.replace(/%s/g, () => String(args[argIndex++])));
      error.name = "Invariant Violation";
    }
    error.framesToPop = 1;
    throw error;
  }
}
var Invariant = invariant;
var RSocketFrame = {};
Object.defineProperty(RSocketFrame, "__esModule", { value: true });
RSocketFrame.isIgnore = isIgnore;
RSocketFrame.isMetadata = isMetadata;
RSocketFrame.isComplete = isComplete;
RSocketFrame.isNext = isNext;
RSocketFrame.isRespond = isRespond;
RSocketFrame.isResumeEnable = isResumeEnable;
RSocketFrame.isLease = isLease;
RSocketFrame.isFollows = isFollows;
RSocketFrame.isResumePositionFrameType = isResumePositionFrameType;
RSocketFrame.getFrameTypeName = getFrameTypeName;
RSocketFrame.createErrorFromFrame = createErrorFromFrame;
RSocketFrame.getErrorCodeExplanation = getErrorCodeExplanation;
RSocketFrame.printFrame = printFrame;
RSocketFrame.MAX_VERSION = RSocketFrame.MAX_TTL = RSocketFrame.MAX_STREAM_ID = RSocketFrame.MAX_RESUME_LENGTH = RSocketFrame.MAX_REQUEST_N = RSocketFrame.MAX_REQUEST_COUNT = RSocketFrame.MAX_MIME_LENGTH = RSocketFrame.MAX_METADATA_LENGTH = RSocketFrame.MAX_LIFETIME = RSocketFrame.MAX_KEEPALIVE = RSocketFrame.MAX_CODE = RSocketFrame.FRAME_TYPE_OFFFSET = RSocketFrame.FLAGS_MASK = RSocketFrame.ERROR_EXPLANATIONS = RSocketFrame.ERROR_CODES = RSocketFrame.FLAGS = RSocketFrame.FRAME_TYPE_NAMES = RSocketFrame.FRAME_TYPES = RSocketFrame.CONNECTION_STREAM_ID = void 0;
function ownKeys$2(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread$2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys$2(Object(source), true).forEach(function(key) {
        _defineProperty$6(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys$2(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function _defineProperty$6(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
const CONNECTION_STREAM_ID = 0;
RSocketFrame.CONNECTION_STREAM_ID = CONNECTION_STREAM_ID;
const FRAME_TYPES = {
  CANCEL: 9,
  ERROR: 11,
  EXT: 63,
  KEEPALIVE: 3,
  LEASE: 2,
  METADATA_PUSH: 12,
  PAYLOAD: 10,
  REQUEST_CHANNEL: 7,
  REQUEST_FNF: 5,
  REQUEST_N: 8,
  REQUEST_RESPONSE: 4,
  REQUEST_STREAM: 6,
  RESERVED: 0,
  RESUME: 13,
  RESUME_OK: 14,
  SETUP: 1
};
RSocketFrame.FRAME_TYPES = FRAME_TYPES;
const FRAME_TYPE_NAMES = {};
RSocketFrame.FRAME_TYPE_NAMES = FRAME_TYPE_NAMES;
for (const name in FRAME_TYPES) {
  const value = FRAME_TYPES[name];
  FRAME_TYPE_NAMES[value] = name;
}
const FLAGS = {
  COMPLETE: 64,
  FOLLOWS: 128,
  IGNORE: 512,
  LEASE: 64,
  METADATA: 256,
  NEXT: 32,
  RESPOND: 128,
  RESUME_ENABLE: 128
};
RSocketFrame.FLAGS = FLAGS;
const ERROR_CODES = {
  APPLICATION_ERROR: 513,
  CANCELED: 515,
  CONNECTION_CLOSE: 258,
  CONNECTION_ERROR: 257,
  INVALID: 516,
  INVALID_SETUP: 1,
  REJECTED: 514,
  REJECTED_RESUME: 4,
  REJECTED_SETUP: 3,
  RESERVED: 0,
  RESERVED_EXTENSION: 4294967295,
  UNSUPPORTED_SETUP: 2
};
RSocketFrame.ERROR_CODES = ERROR_CODES;
const ERROR_EXPLANATIONS = {};
RSocketFrame.ERROR_EXPLANATIONS = ERROR_EXPLANATIONS;
for (const explanation in ERROR_CODES) {
  const code2 = ERROR_CODES[explanation];
  ERROR_EXPLANATIONS[code2] = explanation;
}
const FLAGS_MASK = 1023;
RSocketFrame.FLAGS_MASK = FLAGS_MASK;
const FRAME_TYPE_OFFFSET = 10;
RSocketFrame.FRAME_TYPE_OFFFSET = FRAME_TYPE_OFFFSET;
const MAX_CODE = 2147483647;
RSocketFrame.MAX_CODE = MAX_CODE;
const MAX_KEEPALIVE = 2147483647;
RSocketFrame.MAX_KEEPALIVE = MAX_KEEPALIVE;
const MAX_LIFETIME = 2147483647;
RSocketFrame.MAX_LIFETIME = MAX_LIFETIME;
const MAX_METADATA_LENGTH = 16777215;
RSocketFrame.MAX_METADATA_LENGTH = MAX_METADATA_LENGTH;
const MAX_MIME_LENGTH = 255;
RSocketFrame.MAX_MIME_LENGTH = MAX_MIME_LENGTH;
const MAX_REQUEST_COUNT = 2147483647;
RSocketFrame.MAX_REQUEST_COUNT = MAX_REQUEST_COUNT;
const MAX_REQUEST_N = 2147483647;
RSocketFrame.MAX_REQUEST_N = MAX_REQUEST_N;
const MAX_RESUME_LENGTH = 65535;
RSocketFrame.MAX_RESUME_LENGTH = MAX_RESUME_LENGTH;
const MAX_STREAM_ID = 2147483647;
RSocketFrame.MAX_STREAM_ID = MAX_STREAM_ID;
const MAX_TTL = 2147483647;
RSocketFrame.MAX_TTL = MAX_TTL;
const MAX_VERSION = 65535;
RSocketFrame.MAX_VERSION = MAX_VERSION;
function isIgnore(flags) {
  return (flags & FLAGS.IGNORE) === FLAGS.IGNORE;
}
function isMetadata(flags) {
  return (flags & FLAGS.METADATA) === FLAGS.METADATA;
}
function isComplete(flags) {
  return (flags & FLAGS.COMPLETE) === FLAGS.COMPLETE;
}
function isNext(flags) {
  return (flags & FLAGS.NEXT) === FLAGS.NEXT;
}
function isRespond(flags) {
  return (flags & FLAGS.RESPOND) === FLAGS.RESPOND;
}
function isResumeEnable(flags) {
  return (flags & FLAGS.RESUME_ENABLE) === FLAGS.RESUME_ENABLE;
}
function isLease(flags) {
  return (flags & FLAGS.LEASE) === FLAGS.LEASE;
}
function isFollows(flags) {
  return (flags & FLAGS.FOLLOWS) === FLAGS.FOLLOWS;
}
function isResumePositionFrameType(type) {
  return type === FRAME_TYPES.CANCEL || type === FRAME_TYPES.ERROR || type === FRAME_TYPES.PAYLOAD || type === FRAME_TYPES.REQUEST_CHANNEL || type === FRAME_TYPES.REQUEST_FNF || type === FRAME_TYPES.REQUEST_RESPONSE || type === FRAME_TYPES.REQUEST_STREAM || type === FRAME_TYPES.REQUEST_N;
}
function getFrameTypeName(type) {
  const name = FRAME_TYPE_NAMES[type];
  return name != null ? name : toHex(type);
}
function sprintf(format, ...args) {
  let index = 0;
  return format.replace(/%s/g, (match) => args[index++]);
}
function createErrorFromFrame(frame) {
  const { code: code2, message } = frame;
  const explanation = getErrorCodeExplanation(code2);
  const error = new Error(sprintf("RSocket error %s (%s): %s. See error `source` property for details.", toHex(code2), explanation, message));
  error.source = {
    code: code2,
    explanation,
    message
  };
  return error;
}
function getErrorCodeExplanation(code2) {
  const explanation = ERROR_EXPLANATIONS[code2];
  if (explanation != null) {
    return explanation;
  } else if (code2 <= 768) {
    return "RESERVED (PROTOCOL)";
  } else {
    return "RESERVED (APPLICATION)";
  }
}
function printFrame(frame) {
  const obj = _objectSpread$2({}, frame);
  obj.type = getFrameTypeName(frame.type) + ` (${toHex(frame.type)})`;
  const flagNames = [];
  for (const name in FLAGS) {
    const flag = FLAGS[name];
    if ((frame.flags & flag) === flag) {
      flagNames.push(name);
    }
  }
  if (!flagNames.length) {
    flagNames.push("NO FLAGS");
  }
  obj.flags = flagNames.join(" | ") + ` (${toHex(frame.flags)})`;
  if (frame.type === FRAME_TYPES.ERROR) {
    obj.code = getErrorCodeExplanation(frame.code) + ` (${toHex(frame.code)})`;
  }
  return JSON.stringify(obj, null, 2);
}
function toHex(n) {
  return "0x" + n.toString(16);
}
var RSocketVersion = {};
Object.defineProperty(RSocketVersion, "__esModule", { value: true });
RSocketVersion.MINOR_VERSION = RSocketVersion.MAJOR_VERSION = void 0;
const MAJOR_VERSION = 1;
RSocketVersion.MAJOR_VERSION = MAJOR_VERSION;
const MINOR_VERSION = 0;
RSocketVersion.MINOR_VERSION = MINOR_VERSION;
var RSocketMachine = {};
var RSocketSerialization = {};
var LiteBuffer$1 = {};
var buffer = {};
var base64Js = {};
base64Js.byteLength = byteLength$1;
base64Js.toByteArray = toByteArray;
base64Js.fromByteArray = fromByteArray;
var lookup = [];
var revLookup = [];
var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i];
  revLookup[code.charCodeAt(i)] = i;
}
revLookup["-".charCodeAt(0)] = 62;
revLookup["_".charCodeAt(0)] = 63;
function getLens(b64) {
  var len = b64.length;
  if (len % 4 > 0) {
    throw new Error("Invalid string. Length must be a multiple of 4");
  }
  var validLen = b64.indexOf("=");
  if (validLen === -1)
    validLen = len;
  var placeHoldersLen = validLen === len ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
}
function byteLength$1(b64) {
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function _byteLength(b64, validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function toByteArray(b64) {
  var tmp;
  var lens = getLens(b64);
  var validLen = lens[0];
  var placeHoldersLen = lens[1];
  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
  var curByte = 0;
  var len = placeHoldersLen > 0 ? validLen - 4 : validLen;
  var i;
  for (i = 0; i < len; i += 4) {
    tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
    arr[curByte++] = tmp >> 16 & 255;
    arr[curByte++] = tmp >> 8 & 255;
    arr[curByte++] = tmp & 255;
  }
  if (placeHoldersLen === 2) {
    tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
    arr[curByte++] = tmp & 255;
  }
  if (placeHoldersLen === 1) {
    tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
    arr[curByte++] = tmp >> 8 & 255;
    arr[curByte++] = tmp & 255;
  }
  return arr;
}
function tripletToBase64(num) {
  return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
  var tmp;
  var output = [];
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16 & 16711680) + (uint8[i + 1] << 8 & 65280) + (uint8[i + 2] & 255);
    output.push(tripletToBase64(tmp));
  }
  return output.join("");
}
function fromByteArray(uint8) {
  var tmp;
  var len = uint8.length;
  var extraBytes = len % 3;
  var parts = [];
  var maxChunkLength = 16383;
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
  }
  if (extraBytes === 1) {
    tmp = uint8[len - 1];
    parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1];
    parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
  }
  return parts.join("");
}
var ieee754 = {};
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
ieee754.read = function(buffer2, offset, isLE, mLen, nBytes) {
  var e, m;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var nBits = -7;
  var i = isLE ? nBytes - 1 : 0;
  var d = isLE ? -1 : 1;
  var s = buffer2[offset + i];
  i += d;
  e = s & (1 << -nBits) - 1;
  s >>= -nBits;
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer2[offset + i], i += d, nBits -= 8) {
  }
  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer2[offset + i], i += d, nBits -= 8) {
  }
  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : (s ? -1 : 1) * Infinity;
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};
ieee754.write = function(buffer2, value, offset, isLE, mLen, nBytes) {
  var e, m, c;
  var eLen = nBytes * 8 - mLen - 1;
  var eMax = (1 << eLen) - 1;
  var eBias = eMax >> 1;
  var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
  var i = isLE ? 0 : nBytes - 1;
  var d = isLE ? 1 : -1;
  var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  value = Math.abs(value);
  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }
    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }
  for (; mLen >= 8; buffer2[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {
  }
  e = e << mLen | m;
  eLen += mLen;
  for (; eLen > 0; buffer2[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {
  }
  buffer2[offset + i - d] |= s * 128;
};
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
(function(exports) {
  const base64 = base64Js;
  const ieee754$1 = ieee754;
  const customInspectSymbol = typeof Symbol === "function" && typeof Symbol["for"] === "function" ? Symbol["for"]("nodejs.util.inspect.custom") : null;
  exports.Buffer = Buffer2;
  exports.SlowBuffer = SlowBuffer;
  exports.INSPECT_MAX_BYTES = 50;
  const K_MAX_LENGTH = 2147483647;
  exports.kMaxLength = K_MAX_LENGTH;
  Buffer2.TYPED_ARRAY_SUPPORT = typedArraySupport();
  if (!Buffer2.TYPED_ARRAY_SUPPORT && typeof console !== "undefined" && typeof console.error === "function") {
    console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
  }
  function typedArraySupport() {
    try {
      const arr = new Uint8Array(1);
      const proto = { foo: function() {
        return 42;
      } };
      Object.setPrototypeOf(proto, Uint8Array.prototype);
      Object.setPrototypeOf(arr, proto);
      return arr.foo() === 42;
    } catch (e) {
      return false;
    }
  }
  Object.defineProperty(Buffer2.prototype, "parent", {
    enumerable: true,
    get: function() {
      if (!Buffer2.isBuffer(this))
        return void 0;
      return this.buffer;
    }
  });
  Object.defineProperty(Buffer2.prototype, "offset", {
    enumerable: true,
    get: function() {
      if (!Buffer2.isBuffer(this))
        return void 0;
      return this.byteOffset;
    }
  });
  function createBuffer2(length) {
    if (length > K_MAX_LENGTH) {
      throw new RangeError('The value "' + length + '" is invalid for option "size"');
    }
    const buf = new Uint8Array(length);
    Object.setPrototypeOf(buf, Buffer2.prototype);
    return buf;
  }
  function Buffer2(arg, encodingOrOffset, length) {
    if (typeof arg === "number") {
      if (typeof encodingOrOffset === "string") {
        throw new TypeError('The "string" argument must be of type string. Received type number');
      }
      return allocUnsafe(arg);
    }
    return from(arg, encodingOrOffset, length);
  }
  Buffer2.poolSize = 8192;
  function from(value, encodingOrOffset, length) {
    if (typeof value === "string") {
      return fromString(value, encodingOrOffset);
    }
    if (ArrayBuffer.isView(value)) {
      return fromArrayView(value);
    }
    if (value == null) {
      throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
    }
    if (isInstance2(value, ArrayBuffer) || value && isInstance2(value.buffer, ArrayBuffer)) {
      return fromArrayBuffer(value, encodingOrOffset, length);
    }
    if (typeof SharedArrayBuffer !== "undefined" && (isInstance2(value, SharedArrayBuffer) || value && isInstance2(value.buffer, SharedArrayBuffer))) {
      return fromArrayBuffer(value, encodingOrOffset, length);
    }
    if (typeof value === "number") {
      throw new TypeError('The "value" argument must not be of type number. Received type number');
    }
    const valueOf = value.valueOf && value.valueOf();
    if (valueOf != null && valueOf !== value) {
      return Buffer2.from(valueOf, encodingOrOffset, length);
    }
    const b = fromObject(value);
    if (b)
      return b;
    if (typeof Symbol !== "undefined" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function") {
      return Buffer2.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
    }
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
  }
  Buffer2.from = function(value, encodingOrOffset, length) {
    return from(value, encodingOrOffset, length);
  };
  Object.setPrototypeOf(Buffer2.prototype, Uint8Array.prototype);
  Object.setPrototypeOf(Buffer2, Uint8Array);
  function assertSize(size) {
    if (typeof size !== "number") {
      throw new TypeError('"size" argument must be of type number');
    } else if (size < 0) {
      throw new RangeError('The value "' + size + '" is invalid for option "size"');
    }
  }
  function alloc(size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer2(size);
    }
    if (fill !== void 0) {
      return typeof encoding === "string" ? createBuffer2(size).fill(fill, encoding) : createBuffer2(size).fill(fill);
    }
    return createBuffer2(size);
  }
  Buffer2.alloc = function(size, fill, encoding) {
    return alloc(size, fill, encoding);
  };
  function allocUnsafe(size) {
    assertSize(size);
    return createBuffer2(size < 0 ? 0 : checked(size) | 0);
  }
  Buffer2.allocUnsafe = function(size) {
    return allocUnsafe(size);
  };
  Buffer2.allocUnsafeSlow = function(size) {
    return allocUnsafe(size);
  };
  function fromString(string, encoding) {
    if (typeof encoding !== "string" || encoding === "") {
      encoding = "utf8";
    }
    if (!Buffer2.isEncoding(encoding)) {
      throw new TypeError("Unknown encoding: " + encoding);
    }
    const length = byteLength2(string, encoding) | 0;
    let buf = createBuffer2(length);
    const actual = buf.write(string, encoding);
    if (actual !== length) {
      buf = buf.slice(0, actual);
    }
    return buf;
  }
  function fromArrayLike2(array) {
    const length = array.length < 0 ? 0 : checked(array.length) | 0;
    const buf = createBuffer2(length);
    for (let i = 0; i < length; i += 1) {
      buf[i] = array[i] & 255;
    }
    return buf;
  }
  function fromArrayView(arrayView) {
    if (isInstance2(arrayView, Uint8Array)) {
      const copy = new Uint8Array(arrayView);
      return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
    }
    return fromArrayLike2(arrayView);
  }
  function fromArrayBuffer(array, byteOffset, length) {
    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('"offset" is outside of buffer bounds');
    }
    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('"length" is outside of buffer bounds');
    }
    let buf;
    if (byteOffset === void 0 && length === void 0) {
      buf = new Uint8Array(array);
    } else if (length === void 0) {
      buf = new Uint8Array(array, byteOffset);
    } else {
      buf = new Uint8Array(array, byteOffset, length);
    }
    Object.setPrototypeOf(buf, Buffer2.prototype);
    return buf;
  }
  function fromObject(obj) {
    if (Buffer2.isBuffer(obj)) {
      const len = checked(obj.length) | 0;
      const buf = createBuffer2(len);
      if (buf.length === 0) {
        return buf;
      }
      obj.copy(buf, 0, 0, len);
      return buf;
    }
    if (obj.length !== void 0) {
      if (typeof obj.length !== "number" || numberIsNaN(obj.length)) {
        return createBuffer2(0);
      }
      return fromArrayLike2(obj);
    }
    if (obj.type === "Buffer" && Array.isArray(obj.data)) {
      return fromArrayLike2(obj.data);
    }
  }
  function checked(length) {
    if (length >= K_MAX_LENGTH) {
      throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
    }
    return length | 0;
  }
  function SlowBuffer(length) {
    if (+length != length) {
      length = 0;
    }
    return Buffer2.alloc(+length);
  }
  Buffer2.isBuffer = function isBuffer(b) {
    return b != null && b._isBuffer === true && b !== Buffer2.prototype;
  };
  Buffer2.compare = function compare(a, b) {
    if (isInstance2(a, Uint8Array))
      a = Buffer2.from(a, a.offset, a.byteLength);
    if (isInstance2(b, Uint8Array))
      b = Buffer2.from(b, b.offset, b.byteLength);
    if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
      throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
    }
    if (a === b)
      return 0;
    let x = a.length;
    let y = b.length;
    for (let i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }
    if (x < y)
      return -1;
    if (y < x)
      return 1;
    return 0;
  };
  Buffer2.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return true;
      default:
        return false;
    }
  };
  Buffer2.concat = function concat(list, length) {
    if (!Array.isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }
    if (list.length === 0) {
      return Buffer2.alloc(0);
    }
    let i;
    if (length === void 0) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }
    const buffer2 = Buffer2.allocUnsafe(length);
    let pos = 0;
    for (i = 0; i < list.length; ++i) {
      let buf = list[i];
      if (isInstance2(buf, Uint8Array)) {
        if (pos + buf.length > buffer2.length) {
          if (!Buffer2.isBuffer(buf))
            buf = Buffer2.from(buf);
          buf.copy(buffer2, pos);
        } else {
          Uint8Array.prototype.set.call(buffer2, buf, pos);
        }
      } else if (!Buffer2.isBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      } else {
        buf.copy(buffer2, pos);
      }
      pos += buf.length;
    }
    return buffer2;
  };
  function byteLength2(string, encoding) {
    if (Buffer2.isBuffer(string)) {
      return string.length;
    }
    if (ArrayBuffer.isView(string) || isInstance2(string, ArrayBuffer)) {
      return string.byteLength;
    }
    if (typeof string !== "string") {
      throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string);
    }
    const len = string.length;
    const mustMatch = arguments.length > 2 && arguments[2] === true;
    if (!mustMatch && len === 0)
      return 0;
    let loweredCase = false;
    for (; ; ) {
      switch (encoding) {
        case "ascii":
        case "latin1":
        case "binary":
          return len;
        case "utf8":
        case "utf-8":
          return utf8ToBytes2(string).length;
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return len * 2;
        case "hex":
          return len >>> 1;
        case "base64":
          return base64ToBytes(string).length;
        default:
          if (loweredCase) {
            return mustMatch ? -1 : utf8ToBytes2(string).length;
          }
          encoding = ("" + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer2.byteLength = byteLength2;
  function slowToString(encoding, start, end) {
    let loweredCase = false;
    if (start === void 0 || start < 0) {
      start = 0;
    }
    if (start > this.length) {
      return "";
    }
    if (end === void 0 || end > this.length) {
      end = this.length;
    }
    if (end <= 0) {
      return "";
    }
    end >>>= 0;
    start >>>= 0;
    if (end <= start) {
      return "";
    }
    if (!encoding)
      encoding = "utf8";
    while (true) {
      switch (encoding) {
        case "hex":
          return hexSlice(this, start, end);
        case "utf8":
        case "utf-8":
          return utf8Slice2(this, start, end);
        case "ascii":
          return asciiSlice(this, start, end);
        case "latin1":
        case "binary":
          return latin1Slice(this, start, end);
        case "base64":
          return base64Slice(this, start, end);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return utf16leSlice(this, start, end);
        default:
          if (loweredCase)
            throw new TypeError("Unknown encoding: " + encoding);
          encoding = (encoding + "").toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer2.prototype._isBuffer = true;
  function swap(b, n, m) {
    const i = b[n];
    b[n] = b[m];
    b[m] = i;
  }
  Buffer2.prototype.swap16 = function swap16() {
    const len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    }
    for (let i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }
    return this;
  };
  Buffer2.prototype.swap32 = function swap32() {
    const len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 32-bits");
    }
    for (let i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }
    return this;
  };
  Buffer2.prototype.swap64 = function swap64() {
    const len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError("Buffer size must be a multiple of 64-bits");
    }
    for (let i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }
    return this;
  };
  Buffer2.prototype.toString = function toString() {
    const length = this.length;
    if (length === 0)
      return "";
    if (arguments.length === 0)
      return utf8Slice2(this, 0, length);
    return slowToString.apply(this, arguments);
  };
  Buffer2.prototype.toLocaleString = Buffer2.prototype.toString;
  Buffer2.prototype.equals = function equals(b) {
    if (!Buffer2.isBuffer(b))
      throw new TypeError("Argument must be a Buffer");
    if (this === b)
      return true;
    return Buffer2.compare(this, b) === 0;
  };
  Buffer2.prototype.inspect = function inspect() {
    let str = "";
    const max = exports.INSPECT_MAX_BYTES;
    str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim();
    if (this.length > max)
      str += " ... ";
    return "<Buffer " + str + ">";
  };
  if (customInspectSymbol) {
    Buffer2.prototype[customInspectSymbol] = Buffer2.prototype.inspect;
  }
  Buffer2.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (isInstance2(target, Uint8Array)) {
      target = Buffer2.from(target, target.offset, target.byteLength);
    }
    if (!Buffer2.isBuffer(target)) {
      throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target);
    }
    if (start === void 0) {
      start = 0;
    }
    if (end === void 0) {
      end = target ? target.length : 0;
    }
    if (thisStart === void 0) {
      thisStart = 0;
    }
    if (thisEnd === void 0) {
      thisEnd = this.length;
    }
    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError("out of range index");
    }
    if (thisStart >= thisEnd && start >= end) {
      return 0;
    }
    if (thisStart >= thisEnd) {
      return -1;
    }
    if (start >= end) {
      return 1;
    }
    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target)
      return 0;
    let x = thisEnd - thisStart;
    let y = end - start;
    const len = Math.min(x, y);
    const thisCopy = this.slice(thisStart, thisEnd);
    const targetCopy = target.slice(start, end);
    for (let i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break;
      }
    }
    if (x < y)
      return -1;
    if (y < x)
      return 1;
    return 0;
  };
  function bidirectionalIndexOf(buffer2, val, byteOffset, encoding, dir) {
    if (buffer2.length === 0)
      return -1;
    if (typeof byteOffset === "string") {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 2147483647) {
      byteOffset = 2147483647;
    } else if (byteOffset < -2147483648) {
      byteOffset = -2147483648;
    }
    byteOffset = +byteOffset;
    if (numberIsNaN(byteOffset)) {
      byteOffset = dir ? 0 : buffer2.length - 1;
    }
    if (byteOffset < 0)
      byteOffset = buffer2.length + byteOffset;
    if (byteOffset >= buffer2.length) {
      if (dir)
        return -1;
      else
        byteOffset = buffer2.length - 1;
    } else if (byteOffset < 0) {
      if (dir)
        byteOffset = 0;
      else
        return -1;
    }
    if (typeof val === "string") {
      val = Buffer2.from(val, encoding);
    }
    if (Buffer2.isBuffer(val)) {
      if (val.length === 0) {
        return -1;
      }
      return arrayIndexOf(buffer2, val, byteOffset, encoding, dir);
    } else if (typeof val === "number") {
      val = val & 255;
      if (typeof Uint8Array.prototype.indexOf === "function") {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer2, val, byteOffset);
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer2, val, byteOffset);
        }
      }
      return arrayIndexOf(buffer2, [val], byteOffset, encoding, dir);
    }
    throw new TypeError("val must be string, number or Buffer");
  }
  function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    let indexSize = 1;
    let arrLength = arr.length;
    let valLength = val.length;
    if (encoding !== void 0) {
      encoding = String(encoding).toLowerCase();
      if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
        if (arr.length < 2 || val.length < 2) {
          return -1;
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }
    function read(buf, i2) {
      if (indexSize === 1) {
        return buf[i2];
      } else {
        return buf.readUInt16BE(i2 * indexSize);
      }
    }
    let i;
    if (dir) {
      let foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1)
            foundIndex = i;
          if (i - foundIndex + 1 === valLength)
            return foundIndex * indexSize;
        } else {
          if (foundIndex !== -1)
            i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength)
        byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        let found = true;
        for (let j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break;
          }
        }
        if (found)
          return i;
      }
    }
    return -1;
  }
  Buffer2.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };
  Buffer2.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };
  Buffer2.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };
  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    const remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }
    const strLen = string.length;
    if (length > strLen / 2) {
      length = strLen / 2;
    }
    let i;
    for (i = 0; i < length; ++i) {
      const parsed = parseInt(string.substr(i * 2, 2), 16);
      if (numberIsNaN(parsed))
        return i;
      buf[offset + i] = parsed;
    }
    return i;
  }
  function utf8Write2(buf, string, offset, length) {
    return blitBuffer2(utf8ToBytes2(string, buf.length - offset), buf, offset, length);
  }
  function asciiWrite(buf, string, offset, length) {
    return blitBuffer2(asciiToBytes(string), buf, offset, length);
  }
  function base64Write(buf, string, offset, length) {
    return blitBuffer2(base64ToBytes(string), buf, offset, length);
  }
  function ucs2Write(buf, string, offset, length) {
    return blitBuffer2(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }
  Buffer2.prototype.write = function write(string, offset, length, encoding) {
    if (offset === void 0) {
      encoding = "utf8";
      length = this.length;
      offset = 0;
    } else if (length === void 0 && typeof offset === "string") {
      encoding = offset;
      length = this.length;
      offset = 0;
    } else if (isFinite(offset)) {
      offset = offset >>> 0;
      if (isFinite(length)) {
        length = length >>> 0;
        if (encoding === void 0)
          encoding = "utf8";
      } else {
        encoding = length;
        length = void 0;
      }
    } else {
      throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
    }
    const remaining = this.length - offset;
    if (length === void 0 || length > remaining)
      length = remaining;
    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
      throw new RangeError("Attempt to write outside buffer bounds");
    }
    if (!encoding)
      encoding = "utf8";
    let loweredCase = false;
    for (; ; ) {
      switch (encoding) {
        case "hex":
          return hexWrite(this, string, offset, length);
        case "utf8":
        case "utf-8":
          return utf8Write2(this, string, offset, length);
        case "ascii":
        case "latin1":
        case "binary":
          return asciiWrite(this, string, offset, length);
        case "base64":
          return base64Write(this, string, offset, length);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return ucs2Write(this, string, offset, length);
        default:
          if (loweredCase)
            throw new TypeError("Unknown encoding: " + encoding);
          encoding = ("" + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };
  Buffer2.prototype.toJSON = function toJSON() {
    return {
      type: "Buffer",
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };
  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return base64.fromByteArray(buf);
    } else {
      return base64.fromByteArray(buf.slice(start, end));
    }
  }
  function utf8Slice2(buf, start, end) {
    end = Math.min(buf.length, end);
    const res = [];
    let i = start;
    while (i < end) {
      const firstByte = buf[i];
      let codePoint = null;
      let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
      if (i + bytesPerSequence <= end) {
        let secondByte, thirdByte, fourthByte, tempCodePoint;
        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 128) {
              codePoint = firstByte;
            }
            break;
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 192) === 128) {
              tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
              if (tempCodePoint > 127) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
              tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
              if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
              tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
              if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                codePoint = tempCodePoint;
              }
            }
        }
      }
      if (codePoint === null) {
        codePoint = 65533;
        bytesPerSequence = 1;
      } else if (codePoint > 65535) {
        codePoint -= 65536;
        res.push(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      res.push(codePoint);
      i += bytesPerSequence;
    }
    return decodeCodePointsArray2(res);
  }
  const MAX_ARGUMENTS_LENGTH2 = 4096;
  function decodeCodePointsArray2(codePoints) {
    const len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH2) {
      return String.fromCharCode.apply(String, codePoints);
    }
    let res = "";
    let i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH2));
    }
    return res;
  }
  function asciiSlice(buf, start, end) {
    let ret = "";
    end = Math.min(buf.length, end);
    for (let i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 127);
    }
    return ret;
  }
  function latin1Slice(buf, start, end) {
    let ret = "";
    end = Math.min(buf.length, end);
    for (let i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret;
  }
  function hexSlice(buf, start, end) {
    const len = buf.length;
    if (!start || start < 0)
      start = 0;
    if (!end || end < 0 || end > len)
      end = len;
    let out = "";
    for (let i = start; i < end; ++i) {
      out += hexSliceLookupTable[buf[i]];
    }
    return out;
  }
  function utf16leSlice(buf, start, end) {
    const bytes = buf.slice(start, end);
    let res = "";
    for (let i = 0; i < bytes.length - 1; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res;
  }
  Buffer2.prototype.slice = function slice(start, end) {
    const len = this.length;
    start = ~~start;
    end = end === void 0 ? len : ~~end;
    if (start < 0) {
      start += len;
      if (start < 0)
        start = 0;
    } else if (start > len) {
      start = len;
    }
    if (end < 0) {
      end += len;
      if (end < 0)
        end = 0;
    } else if (end > len) {
      end = len;
    }
    if (end < start)
      end = start;
    const newBuf = this.subarray(start, end);
    Object.setPrototypeOf(newBuf, Buffer2.prototype);
    return newBuf;
  };
  function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0)
      throw new RangeError("offset is not uint");
    if (offset + ext > length)
      throw new RangeError("Trying to access beyond buffer length");
  }
  Buffer2.prototype.readUintLE = Buffer2.prototype.readUIntLE = function readUIntLE(offset, byteLength3, noAssert) {
    offset = offset >>> 0;
    byteLength3 = byteLength3 >>> 0;
    if (!noAssert)
      checkOffset(offset, byteLength3, this.length);
    let val = this[offset];
    let mul = 1;
    let i = 0;
    while (++i < byteLength3 && (mul *= 256)) {
      val += this[offset + i] * mul;
    }
    return val;
  };
  Buffer2.prototype.readUintBE = Buffer2.prototype.readUIntBE = function readUIntBE(offset, byteLength3, noAssert) {
    offset = offset >>> 0;
    byteLength3 = byteLength3 >>> 0;
    if (!noAssert) {
      checkOffset(offset, byteLength3, this.length);
    }
    let val = this[offset + --byteLength3];
    let mul = 1;
    while (byteLength3 > 0 && (mul *= 256)) {
      val += this[offset + --byteLength3] * mul;
    }
    return val;
  };
  Buffer2.prototype.readUint8 = Buffer2.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 1, this.length);
    return this[offset];
  };
  Buffer2.prototype.readUint16LE = Buffer2.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };
  Buffer2.prototype.readUint16BE = Buffer2.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };
  Buffer2.prototype.readUint32LE = Buffer2.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
  };
  Buffer2.prototype.readUint32BE = Buffer2.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };
  Buffer2.prototype.readBigUInt64LE = defineBigIntMethod(function readBigUInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first2 = this[offset];
    const last = this[offset + 7];
    if (first2 === void 0 || last === void 0) {
      boundsError(offset, this.length - 8);
    }
    const lo = first2 + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24;
    const hi = this[++offset] + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + last * 2 ** 24;
    return BigInt(lo) + (BigInt(hi) << BigInt(32));
  });
  Buffer2.prototype.readBigUInt64BE = defineBigIntMethod(function readBigUInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first2 = this[offset];
    const last = this[offset + 7];
    if (first2 === void 0 || last === void 0) {
      boundsError(offset, this.length - 8);
    }
    const hi = first2 * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
    const lo = this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last;
    return (BigInt(hi) << BigInt(32)) + BigInt(lo);
  });
  Buffer2.prototype.readIntLE = function readIntLE(offset, byteLength3, noAssert) {
    offset = offset >>> 0;
    byteLength3 = byteLength3 >>> 0;
    if (!noAssert)
      checkOffset(offset, byteLength3, this.length);
    let val = this[offset];
    let mul = 1;
    let i = 0;
    while (++i < byteLength3 && (mul *= 256)) {
      val += this[offset + i] * mul;
    }
    mul *= 128;
    if (val >= mul)
      val -= Math.pow(2, 8 * byteLength3);
    return val;
  };
  Buffer2.prototype.readIntBE = function readIntBE(offset, byteLength3, noAssert) {
    offset = offset >>> 0;
    byteLength3 = byteLength3 >>> 0;
    if (!noAssert)
      checkOffset(offset, byteLength3, this.length);
    let i = byteLength3;
    let mul = 1;
    let val = this[offset + --i];
    while (i > 0 && (mul *= 256)) {
      val += this[offset + --i] * mul;
    }
    mul *= 128;
    if (val >= mul)
      val -= Math.pow(2, 8 * byteLength3);
    return val;
  };
  Buffer2.prototype.readInt8 = function readInt8(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 1, this.length);
    if (!(this[offset] & 128))
      return this[offset];
    return (255 - this[offset] + 1) * -1;
  };
  Buffer2.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 2, this.length);
    const val = this[offset] | this[offset + 1] << 8;
    return val & 32768 ? val | 4294901760 : val;
  };
  Buffer2.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 2, this.length);
    const val = this[offset + 1] | this[offset] << 8;
    return val & 32768 ? val | 4294901760 : val;
  };
  Buffer2.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };
  Buffer2.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };
  Buffer2.prototype.readBigInt64LE = defineBigIntMethod(function readBigInt64LE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first2 = this[offset];
    const last = this[offset + 7];
    if (first2 === void 0 || last === void 0) {
      boundsError(offset, this.length - 8);
    }
    const val = this[offset + 4] + this[offset + 5] * 2 ** 8 + this[offset + 6] * 2 ** 16 + (last << 24);
    return (BigInt(val) << BigInt(32)) + BigInt(first2 + this[++offset] * 2 ** 8 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 24);
  });
  Buffer2.prototype.readBigInt64BE = defineBigIntMethod(function readBigInt64BE(offset) {
    offset = offset >>> 0;
    validateNumber(offset, "offset");
    const first2 = this[offset];
    const last = this[offset + 7];
    if (first2 === void 0 || last === void 0) {
      boundsError(offset, this.length - 8);
    }
    const val = (first2 << 24) + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + this[++offset];
    return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 2 ** 24 + this[++offset] * 2 ** 16 + this[++offset] * 2 ** 8 + last);
  });
  Buffer2.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return ieee754$1.read(this, offset, true, 23, 4);
  };
  Buffer2.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 4, this.length);
    return ieee754$1.read(this, offset, false, 23, 4);
  };
  Buffer2.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 8, this.length);
    return ieee754$1.read(this, offset, true, 52, 8);
  };
  Buffer2.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    offset = offset >>> 0;
    if (!noAssert)
      checkOffset(offset, 8, this.length);
    return ieee754$1.read(this, offset, false, 52, 8);
  };
  function checkInt(buf, value, offset, ext, max, min) {
    if (!Buffer2.isBuffer(buf))
      throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min)
      throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length)
      throw new RangeError("Index out of range");
  }
  Buffer2.prototype.writeUintLE = Buffer2.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength3, noAssert) {
    value = +value;
    offset = offset >>> 0;
    byteLength3 = byteLength3 >>> 0;
    if (!noAssert) {
      const maxBytes = Math.pow(2, 8 * byteLength3) - 1;
      checkInt(this, value, offset, byteLength3, maxBytes, 0);
    }
    let mul = 1;
    let i = 0;
    this[offset] = value & 255;
    while (++i < byteLength3 && (mul *= 256)) {
      this[offset + i] = value / mul & 255;
    }
    return offset + byteLength3;
  };
  Buffer2.prototype.writeUintBE = Buffer2.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength3, noAssert) {
    value = +value;
    offset = offset >>> 0;
    byteLength3 = byteLength3 >>> 0;
    if (!noAssert) {
      const maxBytes = Math.pow(2, 8 * byteLength3) - 1;
      checkInt(this, value, offset, byteLength3, maxBytes, 0);
    }
    let i = byteLength3 - 1;
    let mul = 1;
    this[offset + i] = value & 255;
    while (--i >= 0 && (mul *= 256)) {
      this[offset + i] = value / mul & 255;
    }
    return offset + byteLength3;
  };
  Buffer2.prototype.writeUint8 = Buffer2.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 1, 255, 0);
    this[offset] = value & 255;
    return offset + 1;
  };
  Buffer2.prototype.writeUint16LE = Buffer2.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 2, 65535, 0);
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    return offset + 2;
  };
  Buffer2.prototype.writeUint16BE = Buffer2.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 2, 65535, 0);
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
    return offset + 2;
  };
  Buffer2.prototype.writeUint32LE = Buffer2.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 4, 4294967295, 0);
    this[offset + 3] = value >>> 24;
    this[offset + 2] = value >>> 16;
    this[offset + 1] = value >>> 8;
    this[offset] = value & 255;
    return offset + 4;
  };
  Buffer2.prototype.writeUint32BE = Buffer2.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 4, 4294967295, 0);
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
    return offset + 4;
  };
  function wrtBigUInt64LE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);
    let lo = Number(value & BigInt(4294967295));
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    lo = lo >> 8;
    buf[offset++] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(4294967295));
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    hi = hi >> 8;
    buf[offset++] = hi;
    return offset;
  }
  function wrtBigUInt64BE(buf, value, offset, min, max) {
    checkIntBI(value, min, max, buf, offset, 7);
    let lo = Number(value & BigInt(4294967295));
    buf[offset + 7] = lo;
    lo = lo >> 8;
    buf[offset + 6] = lo;
    lo = lo >> 8;
    buf[offset + 5] = lo;
    lo = lo >> 8;
    buf[offset + 4] = lo;
    let hi = Number(value >> BigInt(32) & BigInt(4294967295));
    buf[offset + 3] = hi;
    hi = hi >> 8;
    buf[offset + 2] = hi;
    hi = hi >> 8;
    buf[offset + 1] = hi;
    hi = hi >> 8;
    buf[offset] = hi;
    return offset + 8;
  }
  Buffer2.prototype.writeBigUInt64LE = defineBigIntMethod(function writeBigUInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
  });
  Buffer2.prototype.writeBigUInt64BE = defineBigIntMethod(function writeBigUInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
  });
  Buffer2.prototype.writeIntLE = function writeIntLE(value, offset, byteLength3, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
      const limit = Math.pow(2, 8 * byteLength3 - 1);
      checkInt(this, value, offset, byteLength3, limit - 1, -limit);
    }
    let i = 0;
    let mul = 1;
    let sub = 0;
    this[offset] = value & 255;
    while (++i < byteLength3 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = (value / mul >> 0) - sub & 255;
    }
    return offset + byteLength3;
  };
  Buffer2.prototype.writeIntBE = function writeIntBE(value, offset, byteLength3, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
      const limit = Math.pow(2, 8 * byteLength3 - 1);
      checkInt(this, value, offset, byteLength3, limit - 1, -limit);
    }
    let i = byteLength3 - 1;
    let mul = 1;
    let sub = 0;
    this[offset + i] = value & 255;
    while (--i >= 0 && (mul *= 256)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = (value / mul >> 0) - sub & 255;
    }
    return offset + byteLength3;
  };
  Buffer2.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 1, 127, -128);
    if (value < 0)
      value = 255 + value + 1;
    this[offset] = value & 255;
    return offset + 1;
  };
  Buffer2.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 2, 32767, -32768);
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    return offset + 2;
  };
  Buffer2.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 2, 32767, -32768);
    this[offset] = value >>> 8;
    this[offset + 1] = value & 255;
    return offset + 2;
  };
  Buffer2.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 4, 2147483647, -2147483648);
    this[offset] = value & 255;
    this[offset + 1] = value >>> 8;
    this[offset + 2] = value >>> 16;
    this[offset + 3] = value >>> 24;
    return offset + 4;
  };
  Buffer2.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert)
      checkInt(this, value, offset, 4, 2147483647, -2147483648);
    if (value < 0)
      value = 4294967295 + value + 1;
    this[offset] = value >>> 24;
    this[offset + 1] = value >>> 16;
    this[offset + 2] = value >>> 8;
    this[offset + 3] = value & 255;
    return offset + 4;
  };
  Buffer2.prototype.writeBigInt64LE = defineBigIntMethod(function writeBigInt64LE(value, offset = 0) {
    return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  });
  Buffer2.prototype.writeBigInt64BE = defineBigIntMethod(function writeBigInt64BE(value, offset = 0) {
    return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  });
  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length)
      throw new RangeError("Index out of range");
    if (offset < 0)
      throw new RangeError("Index out of range");
  }
  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }
    ieee754$1.write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }
  Buffer2.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };
  Buffer2.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };
  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    value = +value;
    offset = offset >>> 0;
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }
    ieee754$1.write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }
  Buffer2.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };
  Buffer2.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  };
  Buffer2.prototype.copy = function copy(target, targetStart, start, end) {
    if (!Buffer2.isBuffer(target))
      throw new TypeError("argument should be a Buffer");
    if (!start)
      start = 0;
    if (!end && end !== 0)
      end = this.length;
    if (targetStart >= target.length)
      targetStart = target.length;
    if (!targetStart)
      targetStart = 0;
    if (end > 0 && end < start)
      end = start;
    if (end === start)
      return 0;
    if (target.length === 0 || this.length === 0)
      return 0;
    if (targetStart < 0) {
      throw new RangeError("targetStart out of bounds");
    }
    if (start < 0 || start >= this.length)
      throw new RangeError("Index out of range");
    if (end < 0)
      throw new RangeError("sourceEnd out of bounds");
    if (end > this.length)
      end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }
    const len = end - start;
    if (this === target && typeof Uint8Array.prototype.copyWithin === "function") {
      this.copyWithin(targetStart, start, end);
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
    }
    return len;
  };
  Buffer2.prototype.fill = function fill(val, start, end, encoding) {
    if (typeof val === "string") {
      if (typeof start === "string") {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === "string") {
        encoding = end;
        end = this.length;
      }
      if (encoding !== void 0 && typeof encoding !== "string") {
        throw new TypeError("encoding must be a string");
      }
      if (typeof encoding === "string" && !Buffer2.isEncoding(encoding)) {
        throw new TypeError("Unknown encoding: " + encoding);
      }
      if (val.length === 1) {
        const code2 = val.charCodeAt(0);
        if (encoding === "utf8" && code2 < 128 || encoding === "latin1") {
          val = code2;
        }
      }
    } else if (typeof val === "number") {
      val = val & 255;
    } else if (typeof val === "boolean") {
      val = Number(val);
    }
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError("Out of range index");
    }
    if (end <= start) {
      return this;
    }
    start = start >>> 0;
    end = end === void 0 ? this.length : end >>> 0;
    if (!val)
      val = 0;
    let i;
    if (typeof val === "number") {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      const bytes = Buffer2.isBuffer(val) ? val : Buffer2.from(val, encoding);
      const len = bytes.length;
      if (len === 0) {
        throw new TypeError('The value "' + val + '" is invalid for argument "value"');
      }
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }
    return this;
  };
  const errors = {};
  function E(sym, getMessage, Base) {
    errors[sym] = class NodeError extends Base {
      constructor() {
        super();
        Object.defineProperty(this, "message", {
          value: getMessage.apply(this, arguments),
          writable: true,
          configurable: true
        });
        this.name = `${this.name} [${sym}]`;
        this.stack;
        delete this.name;
      }
      get code() {
        return sym;
      }
      set code(value) {
        Object.defineProperty(this, "code", {
          configurable: true,
          enumerable: true,
          value,
          writable: true
        });
      }
      toString() {
        return `${this.name} [${sym}]: ${this.message}`;
      }
    };
  }
  E("ERR_BUFFER_OUT_OF_BOUNDS", function(name) {
    if (name) {
      return `${name} is outside of buffer bounds`;
    }
    return "Attempt to access memory outside buffer bounds";
  }, RangeError);
  E("ERR_INVALID_ARG_TYPE", function(name, actual) {
    return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
  }, TypeError);
  E("ERR_OUT_OF_RANGE", function(str, range, input) {
    let msg = `The value of "${str}" is out of range.`;
    let received = input;
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input));
    } else if (typeof input === "bigint") {
      received = String(input);
      if (input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32))) {
        received = addNumericalSeparator(received);
      }
      received += "n";
    }
    msg += ` It must be ${range}. Received ${received}`;
    return msg;
  }, RangeError);
  function addNumericalSeparator(val) {
    let res = "";
    let i = val.length;
    const start = val[0] === "-" ? 1 : 0;
    for (; i >= start + 4; i -= 3) {
      res = `_${val.slice(i - 3, i)}${res}`;
    }
    return `${val.slice(0, i)}${res}`;
  }
  function checkBounds(buf, offset, byteLength3) {
    validateNumber(offset, "offset");
    if (buf[offset] === void 0 || buf[offset + byteLength3] === void 0) {
      boundsError(offset, buf.length - (byteLength3 + 1));
    }
  }
  function checkIntBI(value, min, max, buf, offset, byteLength3) {
    if (value > max || value < min) {
      const n = typeof min === "bigint" ? "n" : "";
      let range;
      if (byteLength3 > 3) {
        if (min === 0 || min === BigInt(0)) {
          range = `>= 0${n} and < 2${n} ** ${(byteLength3 + 1) * 8}${n}`;
        } else {
          range = `>= -(2${n} ** ${(byteLength3 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength3 + 1) * 8 - 1}${n}`;
        }
      } else {
        range = `>= ${min}${n} and <= ${max}${n}`;
      }
      throw new errors.ERR_OUT_OF_RANGE("value", range, value);
    }
    checkBounds(buf, offset, byteLength3);
  }
  function validateNumber(value, name) {
    if (typeof value !== "number") {
      throw new errors.ERR_INVALID_ARG_TYPE(name, "number", value);
    }
  }
  function boundsError(value, length, type) {
    if (Math.floor(value) !== value) {
      validateNumber(value, type);
      throw new errors.ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
    }
    if (length < 0) {
      throw new errors.ERR_BUFFER_OUT_OF_BOUNDS();
    }
    throw new errors.ERR_OUT_OF_RANGE(type || "offset", `>= ${type ? 1 : 0} and <= ${length}`, value);
  }
  const INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
  function base64clean(str) {
    str = str.split("=")[0];
    str = str.trim().replace(INVALID_BASE64_RE, "");
    if (str.length < 2)
      return "";
    while (str.length % 4 !== 0) {
      str = str + "=";
    }
    return str;
  }
  function utf8ToBytes2(string, units) {
    units = units || Infinity;
    let codePoint;
    const length = string.length;
    let leadSurrogate = null;
    const bytes = [];
    for (let i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);
      if (codePoint > 55295 && codePoint < 57344) {
        if (!leadSurrogate) {
          if (codePoint > 56319) {
            if ((units -= 3) > -1)
              bytes.push(239, 191, 189);
            continue;
          } else if (i + 1 === length) {
            if ((units -= 3) > -1)
              bytes.push(239, 191, 189);
            continue;
          }
          leadSurrogate = codePoint;
          continue;
        }
        if (codePoint < 56320) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          leadSurrogate = codePoint;
          continue;
        }
        codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
      } else if (leadSurrogate) {
        if ((units -= 3) > -1)
          bytes.push(239, 191, 189);
      }
      leadSurrogate = null;
      if (codePoint < 128) {
        if ((units -= 1) < 0)
          break;
        bytes.push(codePoint);
      } else if (codePoint < 2048) {
        if ((units -= 2) < 0)
          break;
        bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
      } else if (codePoint < 65536) {
        if ((units -= 3) < 0)
          break;
        bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
      } else if (codePoint < 1114112) {
        if ((units -= 4) < 0)
          break;
        bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
      } else {
        throw new Error("Invalid code point");
      }
    }
    return bytes;
  }
  function asciiToBytes(str) {
    const byteArray = [];
    for (let i = 0; i < str.length; ++i) {
      byteArray.push(str.charCodeAt(i) & 255);
    }
    return byteArray;
  }
  function utf16leToBytes(str, units) {
    let c, hi, lo;
    const byteArray = [];
    for (let i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0)
        break;
      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }
    return byteArray;
  }
  function base64ToBytes(str) {
    return base64.toByteArray(base64clean(str));
  }
  function blitBuffer2(src, dst, offset, length) {
    let i;
    for (i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length)
        break;
      dst[i + offset] = src[i];
    }
    return i;
  }
  function isInstance2(obj, type) {
    return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
  }
  function numberIsNaN(obj) {
    return obj !== obj;
  }
  const hexSliceLookupTable = function() {
    const alphabet = "0123456789abcdef";
    const table = new Array(256);
    for (let i = 0; i < 16; ++i) {
      const i16 = i * 16;
      for (let j = 0; j < 16; ++j) {
        table[i16 + j] = alphabet[i] + alphabet[j];
      }
    }
    return table;
  }();
  function defineBigIntMethod(fn) {
    return typeof BigInt === "undefined" ? BufferBigIntNotDefined : fn;
  }
  function BufferBigIntNotDefined() {
    throw new Error("BigInt not supported");
  }
})(buffer);
Object.defineProperty(LiteBuffer$1, "__esModule", { value: true });
LiteBuffer$1.LiteBuffer = LiteBuffer$1.Buffer = void 0;
var _buffer = _interopRequireDefault$8(buffer);
function _interopRequireDefault$8(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
const hasGlobalBuffer = typeof commonjsGlobal !== "undefined" && commonjsGlobal.hasOwnProperty("Buffer");
const hasBufferModule = _buffer.default.hasOwnProperty("Buffer");
function notImplemented(msg) {
  const message = msg ? `Not implemented: ${msg}` : "Not implemented";
  throw new Error(message);
}
function normalizeEncoding(enc) {
  if (enc == null || enc === "utf8" || enc === "utf-8") {
    return "utf8";
  }
  return slowCases(enc);
}
function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}
function slowCases(enc) {
  switch (enc.length) {
    case 4:
      if (enc === "UTF8") {
        return "utf8";
      }
      if (enc === "ucs2" || enc === "UCS2") {
        return "utf16le";
      }
      enc = `${enc}`.toLowerCase();
      if (enc === "utf8") {
        return "utf8";
      }
      if (enc === "ucs2") {
        return "utf16le";
      }
      break;
    case 3:
      if (enc === "hex" || enc === "HEX" || `${enc}`.toLowerCase() === "hex") {
        return "hex";
      }
      break;
    case 5:
      if (enc === "ascii") {
        return "ascii";
      }
      if (enc === "ucs-2") {
        return "utf16le";
      }
      if (enc === "UTF-8") {
        return "utf8";
      }
      if (enc === "ASCII") {
        return "ascii";
      }
      if (enc === "UCS-2") {
        return "utf16le";
      }
      enc = `${enc}`.toLowerCase();
      if (enc === "utf-8") {
        return "utf8";
      }
      if (enc === "ascii") {
        return "ascii";
      }
      if (enc === "ucs-2") {
        return "utf16le";
      }
      break;
    case 6:
      if (enc === "base64") {
        return "base64";
      }
      if (enc === "latin1" || enc === "binary") {
        return "latin1";
      }
      if (enc === "BASE64") {
        return "base64";
      }
      if (enc === "LATIN1" || enc === "BINARY") {
        return "latin1";
      }
      enc = `${enc}`.toLowerCase();
      if (enc === "base64") {
        return "base64";
      }
      if (enc === "latin1" || enc === "binary") {
        return "latin1";
      }
      break;
    case 7:
      if (enc === "utf16le" || enc === "UTF16LE" || `${enc}`.toLowerCase() === "utf16le") {
        return "utf16le";
      }
      break;
    case 8:
      if (enc === "utf-16le" || enc === "UTF-16LE" || `${enc}`.toLowerCase() === "utf-16le") {
        return "utf16le";
      }
      break;
    default:
      if (enc === "") {
        return "utf8";
      }
  }
}
const notImplementedEncodings = [
  "base64",
  "hex",
  "ascii",
  "binary",
  "latin1",
  "ucs2",
  "utf16le"
];
function checkEncoding(encoding = "utf8", strict = true) {
  if (typeof encoding !== "string" || strict && encoding === "") {
    if (!strict) {
      return "utf8";
    }
    throw new TypeError(`Unknown encoding: ${encoding}`);
  }
  const normalized = normalizeEncoding(encoding);
  if (normalized === void 0) {
    throw new TypeError(`Unknown encoding: ${encoding}`);
  }
  if (notImplementedEncodings.includes(encoding)) {
    notImplemented(`"${encoding}" encoding`);
  }
  return normalized;
}
const encodingOps = {
  ascii: {
    byteLength: (string) => string.length
  },
  base64: {
    byteLength: (string) => base64ByteLength(string, string.length)
  },
  hex: {
    byteLength: (string) => string.length >>> 1
  },
  latin1: {
    byteLength: (string) => string.length
  },
  ucs2: {
    byteLength: (string) => string.length * 2
  },
  utf16le: {
    byteLength: (string) => string.length * 2
  },
  utf8: {
    byteLength: (string) => utf8ToBytes(string).length
  }
};
function base64ByteLength(str, bytes) {
  if (str.charCodeAt(bytes - 1) === 61) {
    bytes--;
  }
  if (bytes > 1 && str.charCodeAt(bytes - 1) === 61) {
    bytes--;
  }
  return bytes * 3 >>> 2;
}
const MAX_ARGUMENTS_LENGTH = 4096;
function decodeCodePointsArray(codePoints) {
  const len = codePoints.length;
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints);
  }
  let res = "";
  let i = 0;
  while (i < len) {
    res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
  }
  return res;
}
function utf8ToBytes(str, pUnits = Infinity) {
  let units = pUnits;
  let codePoint;
  const length = str.length;
  let leadSurrogate = null;
  const bytes = [];
  for (let i = 0; i < length; ++i) {
    codePoint = str.charCodeAt(i);
    if (codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1) {
            bytes.push(239, 191, 189);
          }
          continue;
        } else if (i + 1 === length) {
          if ((units -= 3) > -1) {
            bytes.push(239, 191, 189);
          }
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1) {
          bytes.push(239, 191, 189);
        }
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1) {
        bytes.push(239, 191, 189);
      }
    }
    leadSurrogate = null;
    if (codePoint < 128) {
      if ((units -= 1) < 0) {
        break;
      }
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0) {
        break;
      }
      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0) {
        break;
      }
      bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0) {
        break;
      }
      bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else {
      throw new Error("Invalid code point");
    }
  }
  return bytes;
}
function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  const res = [];
  let i = start;
  while (i < end) {
    const firstByte = buf[i];
    let codePoint = null;
    let bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 128) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 192) === 128) {
            tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
            if (tempCodePoint > 127) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
            if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
            tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
            if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
              codePoint = tempCodePoint;
            }
          }
      }
    }
    if (codePoint === null) {
      codePoint = 65533;
      bytesPerSequence = 1;
    } else if (codePoint > 65535) {
      codePoint -= 65536;
      res.push(codePoint >>> 10 & 1023 | 55296);
      codePoint = 56320 | codePoint & 1023;
    }
    res.push(codePoint);
    i += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}
function utf8Write(buf, input, offset, length) {
  return blitBuffer(utf8ToBytes(input, buf.length - offset), buf, offset, length);
}
function blitBuffer(src, dst, offset, length) {
  let i = 0;
  for (; i < length; ++i) {
    if (i + offset >= dst.length || i >= src.length) {
      break;
    }
    dst[i + offset] = src[i];
  }
  return i;
}
class Buffer$1 extends Uint8Array {
  constructor(value, byteOffset, length) {
    if (typeof value == "number") {
      super(value);
    } else {
      const offset = byteOffset || 0;
      const realLength = length || (isInstance(value, Array) ? value.length : value.byteLength);
      super(value, offset, realLength);
    }
  }
  static alloc(size, fill = 0, encoding = "utf8") {
    if (typeof size !== "number") {
      throw new TypeError(`The "size" argument must be of type number. Received type ${typeof size}`);
    }
    const buf = new Buffer$1(size);
    if (size === 0) {
      return buf;
    }
    let bufFill;
    if (typeof fill === "string") {
      encoding = checkEncoding(encoding);
      if (fill.length === 1 && encoding === "utf8") {
        buf.fill(fill.charCodeAt(0));
      } else {
        bufFill = Buffer$1.from(fill, encoding);
      }
    } else if (typeof fill === "number") {
      buf.fill(fill);
    } else if (isInstance(fill, Uint8Array)) {
      if (fill.length === 0) {
        throw new TypeError(`The argument "value" is invalid. Received ${fill.constructor.name} []`);
      }
      bufFill = fill;
    }
    if (bufFill) {
      if (bufFill.length > buf.length) {
        bufFill = bufFill.subarray(0, buf.length);
      }
      let offset = 0;
      while (offset < size) {
        buf.set(bufFill, offset);
        offset += bufFill.length;
        if (offset + bufFill.length >= size) {
          break;
        }
      }
      if (offset !== size) {
        buf.set(bufFill.subarray(0, size - offset), offset);
      }
    }
    return buf;
  }
  static allocUnsafe(size) {
    return new Buffer$1(size);
  }
  static byteLength(string, encoding = "utf8") {
    if (typeof string != "string") {
      return string.byteLength;
    }
    encoding = normalizeEncoding(encoding) || "utf8";
    return encodingOps[encoding].byteLength(string);
  }
  static concat(list, totalLength) {
    if (totalLength == void 0) {
      totalLength = 0;
      for (const buf of list) {
        totalLength += buf.length;
      }
    }
    const buffer2 = new Buffer$1(totalLength);
    let pos = 0;
    for (const buf of list) {
      buffer2.set(buf, pos);
      pos += buf.length;
    }
    return buffer2;
  }
  static from(value, byteOffsetOrEncoding, length) {
    const offset = typeof byteOffsetOrEncoding === "string" ? void 0 : byteOffsetOrEncoding;
    let encoding = typeof byteOffsetOrEncoding === "string" ? byteOffsetOrEncoding : void 0;
    if (typeof value === "string" || value.constructor.name === "String") {
      value = value.toString();
      encoding = checkEncoding(encoding, false);
      switch (encoding) {
        case "utf8":
          if (typeof TextEncoder !== "undefined") {
            return new Buffer$1(new TextEncoder().encode(value).buffer);
          }
          return new Buffer$1(utf8ToBytes(value));
        default:
          throw new TypeError("Unknown encoding: " + encoding);
      }
    }
    return new Buffer$1(value, offset, length);
  }
  static isBuffer(obj) {
    return isInstance(obj, Buffer$1) || !hasGlobalBuffer && hasBufferModule && isInstance(obj, Uint8Array);
  }
  static isEncoding(encoding) {
    return typeof encoding === "string" && encoding.length !== 0 && normalizeEncoding(encoding) !== void 0;
  }
  copy(targetBuffer, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
    const sourceBuffer = this.subarray(sourceStart, sourceEnd);
    targetBuffer.set(sourceBuffer, targetStart);
    return sourceBuffer.length;
  }
  equals(otherBuffer) {
    if (!isInstance(otherBuffer, Uint8Array)) {
      throw new TypeError(`The "otherBuffer" argument must be an instance of Buffer or Uint8Array. Received type ${typeof otherBuffer}`);
    }
    if (this === otherBuffer) {
      return true;
    }
    if (this.byteLength !== otherBuffer.byteLength) {
      return false;
    }
    for (let i = 0; i < this.length; i++) {
      if (this[i] !== otherBuffer[i]) {
        return false;
      }
    }
    return true;
  }
  readDoubleBE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset);
  }
  readDoubleLE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset, true);
  }
  readFloatBE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset);
  }
  readFloatLE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset, true);
  }
  readInt8(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt8(offset);
  }
  readInt16BE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset);
  }
  readInt16LE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset, true);
  }
  readInt32BE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset);
  }
  readInt32LE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset, true);
  }
  readUInt8(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint8(offset);
  }
  readUInt16BE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset);
  }
  readUInt16LE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset, true);
  }
  readUInt32BE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset);
  }
  readUInt32LE(offset = 0) {
    return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset, true);
  }
  slice(begin = 0, end = this.length) {
    return this.subarray(begin, end);
  }
  subarray(begin = 0, end = this.length) {
    return new Buffer$1(super.subarray(begin, end));
  }
  toJSON() {
    return { data: Array.from(this), type: "Buffer" };
  }
  toString(encoding = "utf8", start = 0, end = this.length) {
    encoding = checkEncoding(encoding);
    if (typeof TextDecoder !== "undefined") {
      const b = this.subarray(start, end);
      return new TextDecoder().decode(b);
    }
    return this.slowToString(encoding, start, end);
  }
  slowToString(encoding = "utf8", start = 0, end = this.length) {
    if (start === void 0 || start < 0) {
      start = 0;
    }
    if (start > this.length) {
      return "";
    }
    if (end === void 0 || end > this.length) {
      end = this.length;
    }
    if (end <= 0) {
      return "";
    }
    end >>>= 0;
    start >>>= 0;
    if (end <= start) {
      return "";
    }
    encoding = checkEncoding(encoding);
    switch (encoding) {
      case "utf8":
        return utf8Slice(this, start, end);
      default:
        throw new TypeError("Unsupported encoding: " + encoding);
    }
  }
  write(string, offset = 0, length = this.length, encoding = "utf8") {
    encoding = checkEncoding(encoding);
    switch (encoding) {
      case "utf8":
        if (typeof TextEncoder !== "undefined") {
          const resultArray = new TextEncoder().encode(string);
          this.set(resultArray, offset);
          return resultArray.byteLength > length - offset ? length - offset : resultArray.byteLength;
        }
        return utf8Write(this, string, offset, length);
      default:
        throw new TypeError("Unknown encoding: " + encoding);
    }
  }
  writeDoubleBE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value);
    return offset + 8;
  }
  writeDoubleLE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value, true);
    return offset + 8;
  }
  writeFloatBE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value);
    return offset + 4;
  }
  writeFloatLE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value, true);
    return offset + 4;
  }
  writeInt8(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setInt8(offset, value);
    return offset + 1;
  }
  writeInt16BE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset, value);
    return offset + 2;
  }
  writeInt16LE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset, value, true);
    return offset + 2;
  }
  writeInt32BE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value);
    return offset + 4;
  }
  writeInt32LE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setInt32(offset, value, true);
    return offset + 4;
  }
  writeUInt8(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setUint8(offset, value);
    return offset + 1;
  }
  writeUInt16BE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset, value);
    return offset + 2;
  }
  writeUInt16LE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset, value, true);
    return offset + 2;
  }
  writeUInt32BE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value);
    return offset + 4;
  }
  writeUInt32LE(value, offset = 0) {
    new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value, true);
    return offset + 4;
  }
}
LiteBuffer$1.Buffer = Buffer$1;
if (!hasGlobalBuffer) {
  if (hasBufferModule) {
    Object.defineProperty(_buffer.default, "Buffer", {
      configurable: true,
      enumerable: false,
      value: Buffer$1,
      writable: true
    });
  }
  Object.defineProperty(window, "Buffer", {
    configurable: true,
    enumerable: false,
    value: Buffer$1,
    writable: true
  });
}
const LiteBuffer = hasGlobalBuffer ? commonjsGlobal.Buffer : Buffer$1;
LiteBuffer$1.LiteBuffer = LiteBuffer;
Object.defineProperty(RSocketSerialization, "__esModule", { value: true });
RSocketSerialization.IdentitySerializers = RSocketSerialization.IdentitySerializer = RSocketSerialization.JsonSerializers = RSocketSerialization.JsonSerializer = void 0;
var _LiteBuffer$5 = LiteBuffer$1;
var _Invariant$6 = _interopRequireDefault$7(Invariant);
function _interopRequireDefault$7(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
const JsonSerializer = {
  deserialize: (data) => {
    let str;
    if (data == null) {
      return null;
    } else if (typeof data === "string") {
      str = data;
    } else if (_LiteBuffer$5.LiteBuffer.isBuffer(data)) {
      const buffer2 = data;
      str = buffer2.toString("utf8");
    } else {
      const buffer2 = _LiteBuffer$5.LiteBuffer.from(data);
      str = buffer2.toString("utf8");
    }
    return JSON.parse(str);
  },
  serialize: JSON.stringify
};
RSocketSerialization.JsonSerializer = JsonSerializer;
const JsonSerializers = {
  data: JsonSerializer,
  metadata: JsonSerializer
};
RSocketSerialization.JsonSerializers = JsonSerializers;
const IdentitySerializer = {
  deserialize: (data) => {
    (0, _Invariant$6.default)(data == null || typeof data === "string" || _LiteBuffer$5.LiteBuffer.isBuffer(data) || data instanceof Uint8Array, "RSocketSerialization: Expected data to be a string, Buffer, or Uint8Array. Got `%s`.", data);
    return data;
  },
  serialize: (data) => data
};
RSocketSerialization.IdentitySerializer = IdentitySerializer;
const IdentitySerializers = {
  data: IdentitySerializer,
  metadata: IdentitySerializer
};
RSocketSerialization.IdentitySerializers = IdentitySerializers;
var RSocketLease = {};
Object.defineProperty(RSocketLease, "__esModule", { value: true });
RSocketLease.ResponderLeaseHandler = RSocketLease.RequesterLeaseHandler = RSocketLease.Leases = RSocketLease.Lease = void 0;
var _Invariant$5 = _interopRequireDefault$6(Invariant);
var _rsocketFlowable$4 = build$2;
var _RSocketFrame$6 = RSocketFrame;
function _interopRequireDefault$6(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _defineProperty$5(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
class Lease {
  constructor(timeToLiveMillis, allowedRequests, metadata) {
    (0, _Invariant$5.default)(timeToLiveMillis > 0, "Lease time-to-live must be positive");
    (0, _Invariant$5.default)(allowedRequests > 0, "Lease allowed requests must be positive");
    this.timeToLiveMillis = timeToLiveMillis;
    this.allowedRequests = allowedRequests;
    this.startingAllowedRequests = allowedRequests;
    this.expiry = Date.now() + timeToLiveMillis;
    this.metadata = metadata;
  }
  expired() {
    return Date.now() > this.expiry;
  }
  valid() {
    return this.allowedRequests > 0 && !this.expired();
  }
  _use() {
    if (this.expired()) {
      return false;
    }
    const allowed = this.allowedRequests;
    const success = allowed > 0;
    if (success) {
      this.allowedRequests = allowed - 1;
    }
    return success;
  }
}
RSocketLease.Lease = Lease;
class Leases {
  constructor() {
    _defineProperty$5(this, "_sender", () => _rsocketFlowable$4.Flowable.never());
    _defineProperty$5(this, "_receiver", (leases) => {
    });
  }
  sender(sender) {
    this._sender = sender;
    return this;
  }
  receiver(receiver) {
    this._receiver = receiver;
    return this;
  }
  stats(stats) {
    this._stats = stats;
    return this;
  }
}
RSocketLease.Leases = Leases;
class RequesterLeaseHandler {
  constructor(leaseReceiver) {
    _defineProperty$5(this, "_requestN", -1);
    leaseReceiver(new _rsocketFlowable$4.Flowable((subscriber) => {
      if (this._subscriber) {
        subscriber.onError(new Error("only 1 subscriber is allowed"));
        return;
      }
      if (this.isDisposed()) {
        subscriber.onComplete();
        return;
      }
      this._subscriber = subscriber;
      subscriber.onSubscribe({
        cancel: () => {
          this.dispose();
        },
        request: (n) => {
          if (n <= 0) {
            subscriber.onError(new Error(`request demand must be positive: ${n}`));
          }
          if (!this.isDisposed()) {
            const curReqN = this._requestN;
            this._onRequestN(curReqN);
            this._requestN = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, curReqN) + n);
          }
        }
      });
    }));
  }
  use() {
    const l = this._lease;
    return l ? l._use() : false;
  }
  errorMessage() {
    return _errorMessage(this._lease);
  }
  receive(frame) {
    if (!this.isDisposed()) {
      const timeToLiveMillis = frame.ttl;
      const requestCount = frame.requestCount;
      const metadata = frame.metadata;
      this._onLease(new Lease(timeToLiveMillis, requestCount, metadata));
    }
  }
  availability() {
    const l = this._lease;
    if (l && l.valid()) {
      return l.allowedRequests / l.startingAllowedRequests;
    }
    return 0;
  }
  dispose() {
    if (!this._isDisposed) {
      this._isDisposed = true;
      const s = this._subscriber;
      if (s) {
        s.onComplete();
      }
    }
  }
  isDisposed() {
    return this._isDisposed;
  }
  _onRequestN(requestN) {
    const l = this._lease;
    const s = this._subscriber;
    if (requestN < 0 && l && s) {
      s.onNext(l);
    }
  }
  _onLease(lease) {
    const s = this._subscriber;
    const newReqN = this._requestN - 1;
    if (newReqN >= 0 && s) {
      s.onNext(lease);
    }
    this._requestN = Math.max(-1, newReqN);
    this._lease = lease;
  }
}
RSocketLease.RequesterLeaseHandler = RequesterLeaseHandler;
class ResponderLeaseHandler {
  constructor(leaseSender, stats, errorConsumer) {
    this._leaseSender = leaseSender;
    this._stats = stats;
    this._errorConsumer = errorConsumer;
  }
  use() {
    const l = this._lease;
    const success = l ? l._use() : false;
    this._onStatsEvent(success);
    return success;
  }
  errorMessage() {
    return _errorMessage(this._lease);
  }
  send(send) {
    let subscription;
    let isDisposed;
    this._leaseSender(this._stats).subscribe({
      onComplete: () => this._onStatsEvent(),
      onError: (error) => {
        this._onStatsEvent();
        const errConsumer = this._errorConsumer;
        if (errConsumer) {
          errConsumer(error);
        }
      },
      onNext: (lease) => {
        this._lease = lease;
        send(lease);
      },
      onSubscribe: (s) => {
        if (isDisposed) {
          s.cancel();
          return;
        }
        s.request(_RSocketFrame$6.MAX_REQUEST_N);
        subscription = s;
      }
    });
    return {
      dispose() {
        if (!isDisposed) {
          isDisposed = true;
          this._onStatsEvent();
          if (subscription) {
            subscription.cancel();
          }
        }
      },
      isDisposed() {
        return isDisposed;
      }
    };
  }
  _onStatsEvent(success) {
    const s = this._stats;
    if (s) {
      const event = success === void 0 ? "Terminate" : success ? "Accept" : "Reject";
      s.onEvent(event);
    }
  }
}
RSocketLease.ResponderLeaseHandler = ResponderLeaseHandler;
function _errorMessage(lease) {
  if (!lease) {
    return "Lease was not received yet";
  }
  if (lease.valid()) {
    return "Missing leases";
  } else {
    const isExpired = lease.expired();
    const requests = lease.allowedRequests;
    return `Missing leases. Expired: ${isExpired.toString()}, allowedRequests: ${requests}`;
  }
}
Object.defineProperty(RSocketMachine, "__esModule", { value: true });
RSocketMachine.createServerMachine = createServerMachine;
RSocketMachine.createClientMachine = createClientMachine;
var _rsocketFlowable$3 = build$2;
var _RSocketFrame$5 = RSocketFrame;
var _RSocketSerialization$2 = RSocketSerialization;
function ownKeys$1(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread$1(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys$1(Object(source), true).forEach(function(key) {
        _defineProperty$4(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys$1(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function _defineProperty$4(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
class ResponderWrapper {
  constructor(responder) {
    this._responder = responder || {};
  }
  setResponder(responder) {
    this._responder = responder || {};
  }
  fireAndForget(payload) {
    if (this._responder.fireAndForget) {
      try {
        this._responder.fireAndForget(payload);
      } catch (error) {
        console.error("fireAndForget threw an exception", error);
      }
    }
  }
  requestResponse(payload) {
    let error;
    if (this._responder.requestResponse) {
      try {
        return this._responder.requestResponse(payload);
      } catch (_error) {
        console.error("requestResponse threw an exception", _error);
        error = _error;
      }
    }
    return _rsocketFlowable$3.Single.error(error || new Error("not implemented"));
  }
  requestStream(payload) {
    let error;
    if (this._responder.requestStream) {
      try {
        return this._responder.requestStream(payload);
      } catch (_error) {
        console.error("requestStream threw an exception", _error);
        error = _error;
      }
    }
    return _rsocketFlowable$3.Flowable.error(error || new Error("not implemented"));
  }
  requestChannel(payloads) {
    let error;
    if (this._responder.requestChannel) {
      try {
        return this._responder.requestChannel(payloads);
      } catch (_error) {
        console.error("requestChannel threw an exception", _error);
        error = _error;
      }
    }
    return _rsocketFlowable$3.Flowable.error(error || new Error("not implemented"));
  }
  metadataPush(payload) {
    let error;
    if (this._responder.metadataPush) {
      try {
        return this._responder.metadataPush(payload);
      } catch (_error) {
        console.error("metadataPush threw an exception", _error);
        error = _error;
      }
    }
    return _rsocketFlowable$3.Single.error(error || new Error("not implemented"));
  }
}
function createServerMachine(connection, connectionPublisher, keepAliveTimeout, serializers, errorHandler, requesterLeaseHandler, responderLeaseHandler) {
  return new RSocketMachineImpl("SERVER", connection, connectionPublisher, keepAliveTimeout, serializers, void 0, errorHandler, requesterLeaseHandler, responderLeaseHandler);
}
function createClientMachine(connection, connectionPublisher, keepAliveTimeout, serializers, requestHandler, errorHandler, requesterLeaseHandler, responderLeaseHandler) {
  return new RSocketMachineImpl("CLIENT", connection, connectionPublisher, keepAliveTimeout, serializers, requestHandler, errorHandler, requesterLeaseHandler, responderLeaseHandler);
}
class RSocketMachineImpl {
  constructor(role, connection, connectionPublisher, keepAliveTimeout, serializers, requestHandler, errorHandler, requesterLeaseHandler, responderLeaseHandler) {
    _defineProperty$4(this, "_connectionAvailability", 1);
    _defineProperty$4(this, "_handleTransportClose", () => {
      this._handleError(new Error("RSocket: The connection was closed."));
    });
    _defineProperty$4(this, "_handleError", (error) => {
      this._receivers.forEach((receiver) => {
        receiver.onError(error);
      });
      this._receivers.clear();
      this._subscriptions.forEach((subscription) => {
        subscription.cancel();
      });
      this._subscriptions.clear();
      this._connectionAvailability = 0;
      this._dispose(this._requesterLeaseHandler, this._responderLeaseSenderDisposable);
      const handle = this._keepAliveTimerHandle;
      if (handle) {
        clearTimeout(handle);
        this._keepAliveTimerHandle = null;
      }
    });
    _defineProperty$4(this, "_handleFrame", (frame) => {
      const { streamId } = frame;
      if (streamId === _RSocketFrame$5.CONNECTION_STREAM_ID) {
        this._handleConnectionFrame(frame);
      } else {
        this._handleStreamFrame(streamId, frame);
      }
    });
    this._connection = connection;
    this._requesterLeaseHandler = requesterLeaseHandler;
    this._responderLeaseHandler = responderLeaseHandler;
    this._nextStreamId = role === "CLIENT" ? 1 : 2;
    this._receivers = /* @__PURE__ */ new Map();
    this._subscriptions = /* @__PURE__ */ new Map();
    this._serializers = serializers || _RSocketSerialization$2.IdentitySerializers;
    this._requestHandler = new ResponderWrapper(requestHandler);
    this._errorHandler = errorHandler;
    connectionPublisher({
      onComplete: this._handleTransportClose,
      onError: this._handleError,
      onNext: this._handleFrame,
      onSubscribe: (subscription) => subscription.request(Number.MAX_SAFE_INTEGER)
    });
    const responderHandler = this._responderLeaseHandler;
    if (responderHandler) {
      this._responderLeaseSenderDisposable = responderHandler.send(this._leaseFrameSender());
    }
    this._connection.connectionStatus().subscribe({
      onNext: (status) => {
        if (status.kind === "CLOSED") {
          this._handleTransportClose();
        } else if (status.kind === "ERROR") {
          this._handleError(status.error);
        }
      },
      onSubscribe: (subscription) => subscription.request(Number.MAX_SAFE_INTEGER)
    });
    const MIN_TICK_DURATION = 100;
    this._keepAliveLastReceivedMillis = Date.now();
    const keepAliveHandler = () => {
      const now = Date.now();
      const noKeepAliveDuration = now - this._keepAliveLastReceivedMillis;
      if (noKeepAliveDuration >= keepAliveTimeout) {
        this._handleConnectionError(new Error(`No keep-alive acks for ${keepAliveTimeout} millis`));
      } else {
        this._keepAliveTimerHandle = setTimeout(keepAliveHandler, Math.max(MIN_TICK_DURATION, keepAliveTimeout - noKeepAliveDuration));
      }
    };
    this._keepAliveTimerHandle = setTimeout(keepAliveHandler, keepAliveTimeout);
  }
  setRequestHandler(requestHandler) {
    this._requestHandler.setResponder(requestHandler);
  }
  close() {
    this._connection.close();
  }
  connectionStatus() {
    return this._connection.connectionStatus();
  }
  availability() {
    const r = this._requesterLeaseHandler;
    const requesterAvailability = r ? r.availability() : 1;
    return Math.min(this._connectionAvailability, requesterAvailability);
  }
  fireAndForget(payload) {
    if (this._useLeaseOrError(this._requesterLeaseHandler)) {
      return;
    }
    const streamId = this._getNextStreamId(this._receivers);
    const data = this._serializers.data.serialize(payload.data);
    const metadata = this._serializers.metadata.serialize(payload.metadata);
    const frame = {
      data,
      flags: payload.metadata !== void 0 ? _RSocketFrame$5.FLAGS.METADATA : 0,
      metadata,
      streamId,
      type: _RSocketFrame$5.FRAME_TYPES.REQUEST_FNF
    };
    this._connection.sendOne(frame);
  }
  requestResponse(payload) {
    const leaseError = this._useLeaseOrError(this._requesterLeaseHandler);
    if (leaseError) {
      return _rsocketFlowable$3.Single.error(new Error(leaseError));
    }
    const streamId = this._getNextStreamId(this._receivers);
    return new _rsocketFlowable$3.Single((subscriber) => {
      this._receivers.set(streamId, {
        onComplete: () => {
        },
        onError: (error) => subscriber.onError(error),
        onNext: (data2) => subscriber.onComplete(data2)
      });
      const data = this._serializers.data.serialize(payload.data);
      const metadata = this._serializers.metadata.serialize(payload.metadata);
      const frame = {
        data,
        flags: payload.metadata !== void 0 ? _RSocketFrame$5.FLAGS.METADATA : 0,
        metadata,
        streamId,
        type: _RSocketFrame$5.FRAME_TYPES.REQUEST_RESPONSE
      };
      this._connection.sendOne(frame);
      subscriber.onSubscribe(() => {
        this._receivers.delete(streamId);
        const cancelFrame = {
          flags: 0,
          streamId,
          type: _RSocketFrame$5.FRAME_TYPES.CANCEL
        };
        this._connection.sendOne(cancelFrame);
      });
    });
  }
  requestStream(payload) {
    const leaseError = this._useLeaseOrError(this._requesterLeaseHandler);
    if (leaseError) {
      return _rsocketFlowable$3.Flowable.error(new Error(leaseError));
    }
    const streamId = this._getNextStreamId(this._receivers);
    return new _rsocketFlowable$3.Flowable((subscriber) => {
      this._receivers.set(streamId, subscriber);
      let initialized = false;
      subscriber.onSubscribe({
        cancel: () => {
          this._receivers.delete(streamId);
          if (!initialized) {
            return;
          }
          const cancelFrame = {
            flags: 0,
            streamId,
            type: _RSocketFrame$5.FRAME_TYPES.CANCEL
          };
          this._connection.sendOne(cancelFrame);
        },
        request: (n) => {
          if (n > _RSocketFrame$5.MAX_REQUEST_N) {
            n = _RSocketFrame$5.MAX_REQUEST_N;
          }
          if (initialized) {
            const requestNFrame = {
              flags: 0,
              requestN: n,
              streamId,
              type: _RSocketFrame$5.FRAME_TYPES.REQUEST_N
            };
            this._connection.sendOne(requestNFrame);
          } else {
            initialized = true;
            const data = this._serializers.data.serialize(payload.data);
            const metadata = this._serializers.metadata.serialize(payload.metadata);
            const requestStreamFrame = {
              data,
              flags: payload.metadata !== void 0 ? _RSocketFrame$5.FLAGS.METADATA : 0,
              metadata,
              requestN: n,
              streamId,
              type: _RSocketFrame$5.FRAME_TYPES.REQUEST_STREAM
            };
            this._connection.sendOne(requestStreamFrame);
          }
        }
      });
    }, _RSocketFrame$5.MAX_REQUEST_N);
  }
  requestChannel(payloads) {
    const leaseError = this._useLeaseOrError(this._requesterLeaseHandler);
    if (leaseError) {
      return _rsocketFlowable$3.Flowable.error(new Error(leaseError));
    }
    const streamId = this._getNextStreamId(this._receivers);
    let payloadsSubscribed = false;
    return new _rsocketFlowable$3.Flowable((subscriber) => {
      try {
        this._receivers.set(streamId, subscriber);
        let initialized = false;
        subscriber.onSubscribe({
          cancel: () => {
            this._receivers.delete(streamId);
            if (!initialized) {
              return;
            }
            const cancelFrame = {
              flags: 0,
              streamId,
              type: _RSocketFrame$5.FRAME_TYPES.CANCEL
            };
            this._connection.sendOne(cancelFrame);
          },
          request: (n) => {
            if (n > _RSocketFrame$5.MAX_REQUEST_N) {
              n = _RSocketFrame$5.MAX_REQUEST_N;
            }
            if (initialized) {
              const requestNFrame = {
                flags: 0,
                requestN: n,
                streamId,
                type: _RSocketFrame$5.FRAME_TYPES.REQUEST_N
              };
              this._connection.sendOne(requestNFrame);
            } else {
              if (!payloadsSubscribed) {
                payloadsSubscribed = true;
                payloads.subscribe({
                  onComplete: () => {
                    this._sendStreamComplete(streamId);
                  },
                  onError: (error) => {
                    this._sendStreamError(streamId, error.message);
                  },
                  onNext: (payload) => {
                    const data = this._serializers.data.serialize(payload.data);
                    const metadata = this._serializers.metadata.serialize(payload.metadata);
                    if (!initialized) {
                      initialized = true;
                      const requestChannelFrame = {
                        data,
                        flags: payload.metadata !== void 0 ? _RSocketFrame$5.FLAGS.METADATA : 0,
                        metadata,
                        requestN: n,
                        streamId,
                        type: _RSocketFrame$5.FRAME_TYPES.REQUEST_CHANNEL
                      };
                      this._connection.sendOne(requestChannelFrame);
                    } else {
                      const payloadFrame = {
                        data,
                        flags: _RSocketFrame$5.FLAGS.NEXT | (payload.metadata !== void 0 ? _RSocketFrame$5.FLAGS.METADATA : 0),
                        metadata,
                        streamId,
                        type: _RSocketFrame$5.FRAME_TYPES.PAYLOAD
                      };
                      this._connection.sendOne(payloadFrame);
                    }
                  },
                  onSubscribe: (subscription) => {
                    this._subscriptions.set(streamId, subscription);
                    subscription.request(1);
                  }
                });
              } else {
                console.warn("RSocketClient: re-entrant call to request n before initial channel established.");
              }
            }
          }
        });
      } catch (err) {
        console.warn("Exception while subscribing to channel flowable:" + err);
      }
    }, _RSocketFrame$5.MAX_REQUEST_N);
  }
  metadataPush(payload) {
    return new _rsocketFlowable$3.Single((subscriber) => {
      const metadata = this._serializers.metadata.serialize(payload.metadata);
      const frame = {
        flags: 0,
        metadata,
        streamId: 0,
        type: _RSocketFrame$5.FRAME_TYPES.METADATA_PUSH
      };
      this._connection.sendOne(frame);
      subscriber.onSubscribe(() => {
      });
      subscriber.onComplete();
    });
  }
  _getNextStreamId(streamIds) {
    const streamId = this._nextStreamId;
    do {
      this._nextStreamId = this._nextStreamId + 2 & _RSocketFrame$5.MAX_STREAM_ID;
    } while (this._nextStreamId === 0 || streamIds.has(streamId));
    return streamId;
  }
  _useLeaseOrError(leaseHandler) {
    if (leaseHandler) {
      if (!leaseHandler.use()) {
        return leaseHandler.errorMessage();
      }
    }
  }
  _leaseFrameSender() {
    return (lease) => this._connection.sendOne({
      flags: 0,
      metadata: lease.metadata,
      requestCount: lease.allowedRequests,
      streamId: _RSocketFrame$5.CONNECTION_STREAM_ID,
      ttl: lease.timeToLiveMillis,
      type: _RSocketFrame$5.FRAME_TYPES.LEASE
    });
  }
  _dispose(...disposables) {
    disposables.forEach((d) => {
      if (d) {
        d.dispose();
      }
    });
  }
  _isRequest(frameType) {
    switch (frameType) {
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_FNF:
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_RESPONSE:
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_STREAM:
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_CHANNEL:
        return true;
      default:
        return false;
    }
  }
  _handleConnectionError(error) {
    this._handleError(error);
    this._connection.close();
    const errorHandler = this._errorHandler;
    if (errorHandler) {
      errorHandler(error);
    }
  }
  _handleConnectionFrame(frame) {
    switch (frame.type) {
      case _RSocketFrame$5.FRAME_TYPES.ERROR:
        const error = (0, _RSocketFrame$5.createErrorFromFrame)(frame);
        this._handleConnectionError(error);
        break;
      case _RSocketFrame$5.FRAME_TYPES.EXT:
        break;
      case _RSocketFrame$5.FRAME_TYPES.KEEPALIVE:
        this._keepAliveLastReceivedMillis = Date.now();
        if ((0, _RSocketFrame$5.isRespond)(frame.flags)) {
          this._connection.sendOne(_objectSpread$1(_objectSpread$1({}, frame), {}, {
            flags: frame.flags ^ _RSocketFrame$5.FLAGS.RESPOND,
            lastReceivedPosition: 0
          }));
        }
        break;
      case _RSocketFrame$5.FRAME_TYPES.LEASE:
        const r = this._requesterLeaseHandler;
        if (r) {
          r.receive(frame);
        }
        break;
      case _RSocketFrame$5.FRAME_TYPES.METADATA_PUSH:
        this._handleMetadataPush(frame);
        break;
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_CHANNEL:
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_FNF:
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_RESPONSE:
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_STREAM:
        break;
      case _RSocketFrame$5.FRAME_TYPES.RESERVED:
        break;
      case _RSocketFrame$5.FRAME_TYPES.RESUME:
      case _RSocketFrame$5.FRAME_TYPES.RESUME_OK:
        break;
    }
  }
  _handleStreamFrame(streamId, frame) {
    if (this._isRequest(frame.type)) {
      const leaseError = this._useLeaseOrError(this._responderLeaseHandler);
      if (leaseError) {
        this._sendStreamError(streamId, leaseError);
        return;
      }
    }
    switch (frame.type) {
      case _RSocketFrame$5.FRAME_TYPES.CANCEL:
        this._handleCancel(streamId, frame);
        break;
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_N:
        this._handleRequestN(streamId, frame);
        break;
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_FNF:
        this._handleFireAndForget(streamId, frame);
        break;
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_RESPONSE:
        this._handleRequestResponse(streamId, frame);
        break;
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_STREAM:
        this._handleRequestStream(streamId, frame);
        break;
      case _RSocketFrame$5.FRAME_TYPES.REQUEST_CHANNEL:
        this._handleRequestChannel(streamId, frame);
        break;
      case _RSocketFrame$5.FRAME_TYPES.ERROR:
        const error = (0, _RSocketFrame$5.createErrorFromFrame)(frame);
        this._handleStreamError(streamId, error);
        break;
      case _RSocketFrame$5.FRAME_TYPES.PAYLOAD:
        const receiver = this._receivers.get(streamId);
        if (receiver != null) {
          if ((0, _RSocketFrame$5.isNext)(frame.flags)) {
            const payload = {
              data: this._serializers.data.deserialize(frame.data),
              metadata: this._serializers.metadata.deserialize(frame.metadata)
            };
            receiver.onNext(payload);
          }
          if ((0, _RSocketFrame$5.isComplete)(frame.flags)) {
            this._receivers.delete(streamId);
            receiver.onComplete();
          }
        }
        break;
    }
  }
  _handleCancel(streamId, frame) {
    const subscription = this._subscriptions.get(streamId);
    if (subscription) {
      subscription.cancel();
      this._subscriptions.delete(streamId);
    }
  }
  _handleRequestN(streamId, frame) {
    const subscription = this._subscriptions.get(streamId);
    if (subscription) {
      subscription.request(frame.requestN);
    }
  }
  _handleFireAndForget(streamId, frame) {
    const payload = this._deserializePayload(frame);
    this._requestHandler.fireAndForget(payload);
  }
  _handleRequestResponse(streamId, frame) {
    const payload = this._deserializePayload(frame);
    this._requestHandler.requestResponse(payload).subscribe({
      onComplete: (payload2) => {
        this._sendStreamPayload(streamId, payload2, true);
      },
      onError: (error) => this._sendStreamError(streamId, error.message),
      onSubscribe: (cancel) => {
        const subscription = {
          cancel,
          request: () => {
          }
        };
        this._subscriptions.set(streamId, subscription);
      }
    });
  }
  _handleRequestStream(streamId, frame) {
    const payload = this._deserializePayload(frame);
    this._requestHandler.requestStream(payload).subscribe({
      onComplete: () => this._sendStreamComplete(streamId),
      onError: (error) => this._sendStreamError(streamId, error.message),
      onNext: (payload2) => this._sendStreamPayload(streamId, payload2),
      onSubscribe: (subscription) => {
        this._subscriptions.set(streamId, subscription);
        subscription.request(frame.requestN);
      }
    });
  }
  _handleRequestChannel(streamId, frame) {
    const existingSubscription = this._subscriptions.get(streamId);
    if (existingSubscription) {
      return;
    }
    const payloads = new _rsocketFlowable$3.Flowable((subscriber) => {
      let firstRequest = true;
      subscriber.onSubscribe({
        cancel: () => {
          this._receivers.delete(streamId);
          const cancelFrame = {
            flags: 0,
            streamId,
            type: _RSocketFrame$5.FRAME_TYPES.CANCEL
          };
          this._connection.sendOne(cancelFrame);
        },
        request: (n) => {
          if (n > _RSocketFrame$5.MAX_REQUEST_N) {
            n = _RSocketFrame$5.MAX_REQUEST_N;
          }
          if (firstRequest) {
            n--;
          }
          if (n > 0) {
            const requestNFrame = {
              flags: 0,
              requestN: n,
              streamId,
              type: _RSocketFrame$5.FRAME_TYPES.REQUEST_N
            };
            this._connection.sendOne(requestNFrame);
          }
          if (firstRequest && n >= 0) {
            firstRequest = false;
            subscriber.onNext(frame);
          }
        }
      });
    }, _RSocketFrame$5.MAX_REQUEST_N);
    const framesToPayloads = new _rsocketFlowable$3.FlowableProcessor(payloads, (frame2) => this._deserializePayload(frame2));
    this._receivers.set(streamId, framesToPayloads);
    this._requestHandler.requestChannel(framesToPayloads).subscribe({
      onComplete: () => this._sendStreamComplete(streamId),
      onError: (error) => this._sendStreamError(streamId, error.message),
      onNext: (payload) => this._sendStreamPayload(streamId, payload),
      onSubscribe: (subscription) => {
        this._subscriptions.set(streamId, subscription);
        subscription.request(frame.requestN);
      }
    });
  }
  _handleMetadataPush(frame) {
    const payload = this._deserializeMetadataPushPayload(frame);
    this._requestHandler.metadataPush(payload).subscribe({
      onComplete: () => {
      },
      onError: (error) => {
      },
      onSubscribe: (cancel) => {
      }
    });
  }
  _sendStreamComplete(streamId) {
    this._subscriptions.delete(streamId);
    this._connection.sendOne({
      data: null,
      flags: _RSocketFrame$5.FLAGS.COMPLETE,
      metadata: null,
      streamId,
      type: _RSocketFrame$5.FRAME_TYPES.PAYLOAD
    });
  }
  _sendStreamError(streamId, errorMessage) {
    this._subscriptions.delete(streamId);
    this._connection.sendOne({
      code: _RSocketFrame$5.ERROR_CODES.APPLICATION_ERROR,
      flags: 0,
      message: errorMessage,
      streamId,
      type: _RSocketFrame$5.FRAME_TYPES.ERROR
    });
    const error = new Error(`terminated from the requester: ${errorMessage}`);
    this._handleStreamError(streamId, error);
  }
  _sendStreamPayload(streamId, payload, complete = false) {
    let flags = _RSocketFrame$5.FLAGS.NEXT;
    if (complete) {
      flags |= _RSocketFrame$5.FLAGS.COMPLETE;
      this._subscriptions.delete(streamId);
    }
    const data = this._serializers.data.serialize(payload.data);
    const metadata = this._serializers.metadata.serialize(payload.metadata);
    this._connection.sendOne({
      data,
      flags,
      metadata,
      streamId,
      type: _RSocketFrame$5.FRAME_TYPES.PAYLOAD
    });
  }
  _deserializePayload(frame) {
    return deserializePayload$1(this._serializers, frame);
  }
  _deserializeMetadataPushPayload(frame) {
    return deserializeMetadataPushPayload(this._serializers, frame);
  }
  _handleStreamError(streamId, error) {
    const receiver = this._receivers.get(streamId);
    if (receiver != null) {
      this._receivers.delete(streamId);
      receiver.onError(error);
    }
  }
}
function deserializePayload$1(serializers, frame) {
  return {
    data: serializers.data.deserialize(frame.data),
    metadata: serializers.metadata.deserialize(frame.metadata)
  };
}
function deserializeMetadataPushPayload(serializers, frame) {
  return {
    data: null,
    metadata: serializers.metadata.deserialize(frame.metadata)
  };
}
var ReassemblyDuplexConnection$1 = {};
Object.defineProperty(ReassemblyDuplexConnection$1, "__esModule", { value: true });
ReassemblyDuplexConnection$1.ReassemblyDuplexConnection = void 0;
var _LiteBuffer$4 = LiteBuffer$1;
var _RSocketFrame$4 = RSocketFrame;
function _defineProperty$3(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
class ReassemblyDuplexConnection {
  constructor(source) {
    this._source = source;
  }
  sendOne(frame) {
    this._source.sendOne(frame);
  }
  send(input) {
    this._source.send(input);
  }
  receive() {
    return this._source.receive().lift((actual) => new ReassemblySubscriber(actual));
  }
  close() {
    this._source.close();
  }
  connect() {
    this._source.connect();
  }
  connectionStatus() {
    return this._source.connectionStatus();
  }
}
ReassemblyDuplexConnection$1.ReassemblyDuplexConnection = ReassemblyDuplexConnection;
class ReassemblySubscriber {
  constructor(actual) {
    _defineProperty$3(this, "_framesReassemblyMap", /* @__PURE__ */ new Map());
    this._actual = actual;
  }
  request(n) {
    this._subscription.request(n);
  }
  cancel() {
    this._subscription.cancel();
    this._framesReassemblyMap.clear();
  }
  onSubscribe(s) {
    if (this._subscription == null) {
      this._subscription = s;
      this._actual.onSubscribe(this);
    } else {
      s.cancel();
    }
  }
  onComplete() {
    this._actual.onComplete();
  }
  onError(error) {
    this._actual.onError(error);
  }
  onNext(frame) {
    const streamId = frame.streamId;
    if (streamId !== _RSocketFrame$4.CONNECTION_STREAM_ID) {
      const hasFollowsFlag = (0, _RSocketFrame$4.isFollows)(frame.flags);
      const hasCompleteFlag = (0, _RSocketFrame$4.isComplete)(frame.flags);
      const isCancelOrError = frame.type === _RSocketFrame$4.FRAME_TYPES.ERROR || frame.type === _RSocketFrame$4.FRAME_TYPES.CANCEL;
      const storedFrame = this._framesReassemblyMap.get(streamId);
      if (storedFrame) {
        if (isCancelOrError) {
          this._framesReassemblyMap.delete(streamId);
        } else {
          if (storedFrame.metadata && frame.metadata) {
            storedFrame.metadata = concatContent(storedFrame.metadata, frame.metadata);
          }
          if (storedFrame.data && frame.data) {
            storedFrame.data = concatContent(storedFrame.data, frame.data);
          } else if (!storedFrame.data && frame.data) {
            storedFrame.data = frame.data;
          }
          if (!hasFollowsFlag || hasCompleteFlag) {
            if (hasCompleteFlag) {
              storedFrame.flags |= _RSocketFrame$4.FLAGS.COMPLETE;
            }
            this._framesReassemblyMap.delete(streamId);
            this._actual.onNext(storedFrame);
          }
          return;
        }
      } else if (hasFollowsFlag && !hasCompleteFlag && !isCancelOrError) {
        this._framesReassemblyMap.set(streamId, frame);
        return;
      }
    }
    this._actual.onNext(frame);
  }
}
const concatContent = (a, b) => {
  switch (a.constructor.name) {
    case "String":
      return a + b;
    case "Uint8Array":
      const result = new Uint8Array(a.length + b.length);
      result.set(a);
      result.set(b, a.length);
      return result;
    default:
      return _LiteBuffer$4.LiteBuffer.concat([a, b]);
  }
};
Object.defineProperty(RSocketClient$1, "__esModule", { value: true });
RSocketClient$1.default = void 0;
var _rsocketFlowable$2 = build$2;
var _Invariant$4 = _interopRequireDefault$5(Invariant);
var _RSocketFrame$3 = RSocketFrame;
var _RSocketVersion = RSocketVersion;
var _RSocketMachine$1 = RSocketMachine;
var _RSocketLease$1 = RSocketLease;
var _RSocketSerialization$1 = RSocketSerialization;
var _ReassemblyDuplexConnection$1 = ReassemblyDuplexConnection$1;
function _interopRequireDefault$5(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
class RSocketClient {
  constructor(config2) {
    this._checkConfig(config2);
    this._cancel = null;
    this._config = config2;
    this._connection = null;
    this._socket = null;
  }
  close() {
    this._config.transport.close();
  }
  connect() {
    (0, _Invariant$4.default)(!this._connection, "RSocketClient: Unexpected call to connect(), already connected.");
    this._connection = new _rsocketFlowable$2.Single((subscriber) => {
      const transport = this._config.transport;
      let subscription;
      transport.connectionStatus().subscribe({
        onNext: (status) => {
          if (status.kind === "CONNECTED") {
            subscription && subscription.cancel();
            subscriber.onComplete(new RSocketClientSocket(this._config, new _ReassemblyDuplexConnection$1.ReassemblyDuplexConnection(transport)));
          } else if (status.kind === "ERROR") {
            subscription && subscription.cancel();
            subscriber.onError(status.error);
          } else if (status.kind === "CLOSED") {
            subscription && subscription.cancel();
            subscriber.onError(new Error("RSocketClient: Connection closed."));
          }
        },
        onSubscribe: (_subscription) => {
          subscription = _subscription;
          subscriber.onSubscribe(() => {
            _subscription.cancel();
            transport.close();
          });
          subscription.request(Number.MAX_SAFE_INTEGER);
        }
      });
      transport.connect();
    });
    return this._connection;
  }
  _checkConfig(config2) {
    const setup = config2.setup;
    const keepAlive = setup && setup.keepAlive;
    try {
      const navigator = window && window.navigator;
      if (keepAlive > 3e4 && navigator && navigator.userAgent && (navigator.userAgent.includes("Trident") || navigator.userAgent.includes("Edg"))) {
        console.warn("rsocket-js: Due to a browser bug, Internet Explorer and Edge users may experience WebSocket instability with keepAlive values longer than 30 seconds.");
      }
    } catch (e) {
    }
  }
}
RSocketClient$1.default = RSocketClient;
class RSocketClientSocket {
  constructor(config2, connection) {
    let requesterLeaseHandler;
    let responderLeaseHandler;
    const leasesSupplier = config2.leases;
    if (leasesSupplier) {
      const lease = leasesSupplier();
      requesterLeaseHandler = new _RSocketLease$1.RequesterLeaseHandler(lease._receiver);
      responderLeaseHandler = new _RSocketLease$1.ResponderLeaseHandler(lease._sender, lease._stats);
    }
    const { keepAlive, lifetime } = config2.setup;
    this._machine = (0, _RSocketMachine$1.createClientMachine)(connection, (subscriber) => connection.receive().subscribe(subscriber), lifetime, config2.serializers, config2.responder, config2.errorHandler, requesterLeaseHandler, responderLeaseHandler);
    connection.sendOne(this._buildSetupFrame(config2));
    const keepAliveFrames = (0, _rsocketFlowable$2.every)(keepAlive).map(() => ({
      data: null,
      flags: _RSocketFrame$3.FLAGS.RESPOND,
      lastReceivedPosition: 0,
      streamId: _RSocketFrame$3.CONNECTION_STREAM_ID,
      type: _RSocketFrame$3.FRAME_TYPES.KEEPALIVE
    }));
    connection.send(keepAliveFrames);
  }
  fireAndForget(payload) {
    this._machine.fireAndForget(payload);
  }
  requestResponse(payload) {
    return this._machine.requestResponse(payload);
  }
  requestStream(payload) {
    return this._machine.requestStream(payload);
  }
  requestChannel(payloads) {
    return this._machine.requestChannel(payloads);
  }
  metadataPush(payload) {
    return this._machine.metadataPush(payload);
  }
  close() {
    this._machine.close();
  }
  connectionStatus() {
    return this._machine.connectionStatus();
  }
  availability() {
    return this._machine.availability();
  }
  _buildSetupFrame(config2) {
    const {
      dataMimeType,
      keepAlive,
      lifetime,
      metadataMimeType,
      payload
    } = config2.setup;
    const serializers = config2.serializers || _RSocketSerialization$1.IdentitySerializers;
    const data = payload ? serializers.data.serialize(payload.data) : void 0;
    const metadata = payload ? serializers.metadata.serialize(payload.metadata) : void 0;
    let flags = 0;
    if (metadata !== void 0) {
      flags |= _RSocketFrame$3.FLAGS.METADATA;
    }
    return {
      data,
      dataMimeType,
      flags: flags | (config2.leases ? _RSocketFrame$3.FLAGS.LEASE : 0),
      keepAlive,
      lifetime,
      majorVersion: _RSocketVersion.MAJOR_VERSION,
      metadata,
      metadataMimeType,
      minorVersion: _RSocketVersion.MINOR_VERSION,
      resumeToken: null,
      streamId: _RSocketFrame$3.CONNECTION_STREAM_ID,
      type: _RSocketFrame$3.FRAME_TYPES.SETUP
    };
  }
}
var RSocketServer$1 = {};
Object.defineProperty(RSocketServer$1, "__esModule", { value: true });
RSocketServer$1.default = void 0;
var _Invariant$3 = _interopRequireDefault$4(Invariant);
var _RSocketFrame$2 = RSocketFrame;
var _RSocketSerialization = RSocketSerialization;
var _RSocketMachine = RSocketMachine;
var _RSocketLease = RSocketLease;
var _ReassemblyDuplexConnection = ReassemblyDuplexConnection$1;
function _interopRequireDefault$4(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _defineProperty$2(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
class RSocketServer {
  constructor(config2) {
    _defineProperty$2(this, "_handleTransportComplete", () => {
      this._handleTransportError(new Error("RSocketServer: Connection closed unexpectedly."));
    });
    _defineProperty$2(this, "_handleTransportError", (error) => {
      this._connections.forEach((connection) => {
        connection.close();
      });
    });
    _defineProperty$2(this, "_handleTransportConnection", (connection) => {
      const swapper = new SubscriberSwapper();
      let subscription;
      connection = new _ReassemblyDuplexConnection.ReassemblyDuplexConnection(connection);
      connection.receive().subscribe(swapper.swap({
        onError: (error) => console.error(error),
        onNext: (frame) => {
          switch (frame.type) {
            case _RSocketFrame$2.FRAME_TYPES.RESUME:
              connection.sendOne({
                code: _RSocketFrame$2.ERROR_CODES.REJECTED_RESUME,
                flags: 0,
                message: "RSocketServer: RESUME not supported.",
                streamId: _RSocketFrame$2.CONNECTION_STREAM_ID,
                type: _RSocketFrame$2.FRAME_TYPES.ERROR
              });
              connection.close();
              break;
            case _RSocketFrame$2.FRAME_TYPES.SETUP:
              if (this._setupLeaseError(frame)) {
                connection.sendOne({
                  code: _RSocketFrame$2.ERROR_CODES.INVALID_SETUP,
                  flags: 0,
                  message: "RSocketServer: LEASE not supported.",
                  streamId: _RSocketFrame$2.CONNECTION_STREAM_ID,
                  type: _RSocketFrame$2.FRAME_TYPES.ERROR
                });
                connection.close();
                break;
              }
              const serializers = this._getSerializers();
              let requesterLeaseHandler;
              let responderLeaseHandler;
              const leasesSupplier = this._config.leases;
              if (leasesSupplier) {
                const lease = leasesSupplier();
                requesterLeaseHandler = new _RSocketLease.RequesterLeaseHandler(lease._receiver);
                responderLeaseHandler = new _RSocketLease.ResponderLeaseHandler(lease._sender, lease._stats);
              }
              const serverMachine = (0, _RSocketMachine.createServerMachine)(connection, (subscriber) => {
                swapper.swap(subscriber);
              }, frame.lifetime, serializers, this._config.errorHandler, requesterLeaseHandler, responderLeaseHandler);
              try {
                const requestHandler = this._config.getRequestHandler(serverMachine, deserializePayload(serializers, frame));
                serverMachine.setRequestHandler(requestHandler);
                this._connections.add(serverMachine);
                connection.connectionStatus().subscribe({
                  onNext: (status) => {
                    if (status.kind === "CLOSED" || status.kind === "ERROR") {
                      this._connections.delete(serverMachine);
                    }
                  },
                  onSubscribe: (subscription2) => subscription2.request(Number.MAX_SAFE_INTEGER)
                });
              } catch (error) {
                connection.sendOne({
                  code: _RSocketFrame$2.ERROR_CODES.REJECTED_SETUP,
                  flags: 0,
                  message: "Application rejected setup, reason: " + error.message,
                  streamId: _RSocketFrame$2.CONNECTION_STREAM_ID,
                  type: _RSocketFrame$2.FRAME_TYPES.ERROR
                });
                connection.close();
              }
              break;
            default:
              (0, _Invariant$3.default)(false, "RSocketServer: Expected first frame to be SETUP or RESUME, got `%s`.", (0, _RSocketFrame$2.getFrameTypeName)(frame.type));
          }
        },
        onSubscribe: (_subscription) => {
          subscription = _subscription;
          subscription.request(1);
        }
      }));
    });
    this._config = config2;
    this._connections = /* @__PURE__ */ new Set();
    this._started = false;
    this._subscription = null;
  }
  start() {
    (0, _Invariant$3.default)(!this._started, "RSocketServer: Unexpected call to start(), already started.");
    this._started = true;
    this._config.transport.start().subscribe({
      onComplete: this._handleTransportComplete,
      onError: this._handleTransportError,
      onNext: this._handleTransportConnection,
      onSubscribe: (subscription) => {
        this._subscription = subscription;
        subscription.request(Number.MAX_SAFE_INTEGER);
      }
    });
  }
  stop() {
    if (this._subscription) {
      this._subscription.cancel();
    }
    this._config.transport.stop();
    this._handleTransportError(new Error("RSocketServer: Connection terminated via stop()."));
  }
  _getSerializers() {
    return this._config.serializers || _RSocketSerialization.IdentitySerializers;
  }
  _setupLeaseError(frame) {
    const clientLeaseEnabled = (frame.flags & _RSocketFrame$2.FLAGS.LEASE) === _RSocketFrame$2.FLAGS.LEASE;
    const serverLeaseEnabled = this._config.leases;
    return clientLeaseEnabled && !serverLeaseEnabled;
  }
}
RSocketServer$1.default = RSocketServer;
class SubscriberSwapper {
  constructor(target) {
    this._target = target;
  }
  swap(next) {
    this._target = next;
    if (this._subscription) {
      this._target.onSubscribe && this._target.onSubscribe(this._subscription);
    }
    return this;
  }
  onComplete() {
    (0, _Invariant$3.default)(this._target, "must have target");
    this._target.onComplete && this._target.onComplete();
  }
  onError(error) {
    (0, _Invariant$3.default)(this._target, "must have target");
    this._target.onError && this._target.onError(error);
  }
  onNext(value) {
    (0, _Invariant$3.default)(this._target, "must have target");
    this._target.onNext && this._target.onNext(value);
  }
  onSubscribe(subscription) {
    (0, _Invariant$3.default)(this._target, "must have target");
    this._subscription = subscription;
    this._target.onSubscribe && this._target.onSubscribe(subscription);
  }
}
function deserializePayload(serializers, frame) {
  return {
    data: serializers.data.deserialize(frame.data),
    metadata: serializers.metadata.deserialize(frame.metadata)
  };
}
var RSocketResumableTransport$1 = {};
var build$1 = {};
var ReactiveSocketTypes = {};
Object.defineProperty(ReactiveSocketTypes, "__esModule", { value: true });
ReactiveSocketTypes.CONNECTION_STATUS = void 0;
const CONNECTION_STATUS = {
  CLOSED: Object.freeze({ kind: "CLOSED" }),
  CONNECTED: Object.freeze({ kind: "CONNECTED" }),
  CONNECTING: Object.freeze({ kind: "CONNECTING" }),
  NOT_CONNECTED: Object.freeze({ kind: "NOT_CONNECTED" })
};
ReactiveSocketTypes.CONNECTION_STATUS = CONNECTION_STATUS;
var ReactiveStreamTypes = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var require$$1 = /* @__PURE__ */ getAugmentedNamespace(ReactiveStreamTypes);
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var _ReactiveSocketTypes = ReactiveSocketTypes;
  Object.keys(_ReactiveSocketTypes).forEach(function(key) {
    if (key === "default" || key === "__esModule")
      return;
    if (key in exports && exports[key] === _ReactiveSocketTypes[key])
      return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function() {
        return _ReactiveSocketTypes[key];
      }
    });
  });
  var _ReactiveStreamTypes = require$$1;
  Object.keys(_ReactiveStreamTypes).forEach(function(key) {
    if (key === "default" || key === "__esModule")
      return;
    if (key in exports && exports[key] === _ReactiveStreamTypes[key])
      return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function() {
        return _ReactiveStreamTypes[key];
      }
    });
  });
})(build$1);
var RSocketBinaryFraming = {};
var RSocketEncoding = {};
var RSocketBufferUtils = {};
Object.defineProperty(RSocketBufferUtils, "__esModule", {
  value: true
});
RSocketBufferUtils.readUInt24BE = readUInt24BE;
RSocketBufferUtils.writeUInt24BE = writeUInt24BE;
RSocketBufferUtils.readUInt64BE = readUInt64BE;
RSocketBufferUtils.writeUInt64BE = writeUInt64BE;
RSocketBufferUtils.byteLength = byteLength;
RSocketBufferUtils.createBuffer = RSocketBufferUtils.toBuffer = void 0;
var _LiteBuffer$3 = LiteBuffer$1;
const BITWISE_OVERFLOW = 4294967296;
function readUInt24BE(buffer2, offset) {
  const val1 = buffer2.readUInt8(offset) << 16;
  const val2 = buffer2.readUInt8(offset + 1) << 8;
  const val3 = buffer2.readUInt8(offset + 2);
  return val1 | val2 | val3;
}
function writeUInt24BE(buffer2, value, offset) {
  offset = buffer2.writeUInt8(value >>> 16, offset);
  offset = buffer2.writeUInt8(value >>> 8 & 255, offset);
  return buffer2.writeUInt8(value & 255, offset);
}
function readUInt64BE(buffer2, offset) {
  const high = buffer2.readUInt32BE(offset);
  const low = buffer2.readUInt32BE(offset + 4);
  return high * BITWISE_OVERFLOW + low;
}
function writeUInt64BE(buffer2, value, offset) {
  const high = value / BITWISE_OVERFLOW | 0;
  const low = value % BITWISE_OVERFLOW;
  offset = buffer2.writeUInt32BE(high, offset);
  return buffer2.writeUInt32BE(low, offset);
}
function byteLength(data, encoding) {
  if (data == null) {
    return 0;
  }
  return _LiteBuffer$3.LiteBuffer.byteLength(data, encoding);
}
const toBuffer = typeof _LiteBuffer$3.LiteBuffer.from === "function" ? (...args) => {
  if (args[0] instanceof _LiteBuffer$3.LiteBuffer) {
    return args[0];
  }
  return _LiteBuffer$3.LiteBuffer.from.apply(_LiteBuffer$3.LiteBuffer, args);
} : (...args) => {
  if (args[0] instanceof _LiteBuffer$3.LiteBuffer) {
    return args[0];
  }
  return new (_LiteBuffer$3.LiteBuffer.bind.apply(_LiteBuffer$3.LiteBuffer, [
    _LiteBuffer$3.LiteBuffer,
    ...args
  ]))();
};
RSocketBufferUtils.toBuffer = toBuffer;
const createBuffer = typeof _LiteBuffer$3.LiteBuffer.alloc === "function" ? (length) => _LiteBuffer$3.LiteBuffer.alloc(length) : (length) => new _LiteBuffer$3.LiteBuffer(length).fill(0);
RSocketBufferUtils.createBuffer = createBuffer;
Object.defineProperty(RSocketEncoding, "__esModule", { value: true });
RSocketEncoding.BufferEncoders = RSocketEncoding.Utf8Encoders = RSocketEncoding.BufferEncoder = RSocketEncoding.UTF8Encoder = void 0;
var _RSocketBufferUtils$4 = RSocketBufferUtils;
var _Invariant$2 = _interopRequireDefault$3(Invariant);
function _interopRequireDefault$3(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
const UTF8Encoder = {
  byteLength: (value) => (0, _RSocketBufferUtils$4.byteLength)(value, "utf8"),
  decode: (buffer2, start, end) => {
    return buffer2.toString("utf8", start, end);
  },
  encode: (value, buffer2, start, end) => {
    (0, _Invariant$2.default)(typeof value === "string", "RSocketEncoding: Expected value to be a string, got `%s`.", value);
    buffer2.write(value, start, end - start, "utf8");
    return end;
  }
};
RSocketEncoding.UTF8Encoder = UTF8Encoder;
const BufferEncoder = {
  byteLength: (value) => {
    (0, _Invariant$2.default)(Buffer.isBuffer(value), "RSocketEncoding: Expected value to be a buffer, got `%s`.", value);
    return value.length;
  },
  decode: (buffer2, start, end) => {
    return buffer2.slice(start, end);
  },
  encode: (value, buffer2, start, end) => {
    (0, _Invariant$2.default)(Buffer.isBuffer(value), "RSocketEncoding: Expected value to be a buffer, got `%s`.", value);
    value.copy(buffer2, start, 0, value.length);
    return end;
  }
};
RSocketEncoding.BufferEncoder = BufferEncoder;
const Utf8Encoders = {
  data: UTF8Encoder,
  dataMimeType: UTF8Encoder,
  message: UTF8Encoder,
  metadata: UTF8Encoder,
  metadataMimeType: UTF8Encoder,
  resumeToken: UTF8Encoder
};
RSocketEncoding.Utf8Encoders = Utf8Encoders;
const BufferEncoders = {
  data: BufferEncoder,
  dataMimeType: UTF8Encoder,
  message: UTF8Encoder,
  metadata: BufferEncoder,
  metadataMimeType: UTF8Encoder,
  resumeToken: BufferEncoder
};
RSocketEncoding.BufferEncoders = BufferEncoders;
Object.defineProperty(RSocketBinaryFraming, "__esModule", { value: true });
RSocketBinaryFraming.deserializeFrameWithLength = deserializeFrameWithLength;
RSocketBinaryFraming.deserializeFrames = deserializeFrames;
RSocketBinaryFraming.serializeFrameWithLength = serializeFrameWithLength;
RSocketBinaryFraming.deserializeFrame = deserializeFrame;
RSocketBinaryFraming.serializeFrame = serializeFrame;
RSocketBinaryFraming.sizeOfFrame = sizeOfFrame;
var _Invariant$1 = _interopRequireDefault$2(Invariant);
var _RSocketFrame$1 = RSocketFrame;
var _RSocketEncoding = RSocketEncoding;
var _RSocketBufferUtils$3 = RSocketBufferUtils;
function _interopRequireDefault$2(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
const FRAME_HEADER_SIZE = 6;
const UINT24_SIZE = 3;
function deserializeFrameWithLength(buffer2, encoders) {
  const frameLength = (0, _RSocketBufferUtils$3.readUInt24BE)(buffer2, 0);
  return deserializeFrame(buffer2.slice(UINT24_SIZE, UINT24_SIZE + frameLength), encoders);
}
function deserializeFrames(buffer2, encoders) {
  const frames = [];
  let offset = 0;
  while (offset + UINT24_SIZE < buffer2.length) {
    const frameLength = (0, _RSocketBufferUtils$3.readUInt24BE)(buffer2, offset);
    const frameStart = offset + UINT24_SIZE;
    const frameEnd = frameStart + frameLength;
    if (frameEnd > buffer2.length) {
      break;
    }
    const frameBuffer = buffer2.slice(frameStart, frameEnd);
    const frame = deserializeFrame(frameBuffer, encoders);
    frames.push(frame);
    offset = frameEnd;
  }
  return [frames, buffer2.slice(offset, buffer2.length)];
}
function serializeFrameWithLength(frame, encoders) {
  const buffer2 = serializeFrame(frame, encoders);
  const lengthPrefixed = (0, _RSocketBufferUtils$3.createBuffer)(buffer2.length + UINT24_SIZE);
  (0, _RSocketBufferUtils$3.writeUInt24BE)(lengthPrefixed, buffer2.length, 0);
  buffer2.copy(lengthPrefixed, UINT24_SIZE, 0, buffer2.length);
  return lengthPrefixed;
}
function deserializeFrame(buffer2, encoders) {
  encoders = encoders || _RSocketEncoding.Utf8Encoders;
  let offset = 0;
  const streamId = buffer2.readInt32BE(offset);
  offset += 4;
  (0, _Invariant$1.default)(streamId >= 0, "RSocketBinaryFraming: Invalid frame, expected a positive stream id, got `%s.", streamId);
  const typeAndFlags = buffer2.readUInt16BE(offset);
  offset += 2;
  const type = typeAndFlags >>> _RSocketFrame$1.FRAME_TYPE_OFFFSET;
  const flags = typeAndFlags & _RSocketFrame$1.FLAGS_MASK;
  switch (type) {
    case _RSocketFrame$1.FRAME_TYPES.SETUP:
      return deserializeSetupFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.PAYLOAD:
      return deserializePayloadFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.ERROR:
      return deserializeErrorFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.KEEPALIVE:
      return deserializeKeepAliveFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_FNF:
      return deserializeRequestFnfFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_RESPONSE:
      return deserializeRequestResponseFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_STREAM:
      return deserializeRequestStreamFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_CHANNEL:
      return deserializeRequestChannelFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.METADATA_PUSH:
      return deserializeMetadataPushFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_N:
      return deserializeRequestNFrame(buffer2, streamId, flags);
    case _RSocketFrame$1.FRAME_TYPES.RESUME:
      return deserializeResumeFrame(buffer2, streamId, flags, encoders);
    case _RSocketFrame$1.FRAME_TYPES.RESUME_OK:
      return deserializeResumeOkFrame(buffer2, streamId, flags);
    case _RSocketFrame$1.FRAME_TYPES.CANCEL:
      return deserializeCancelFrame(buffer2, streamId, flags);
    case _RSocketFrame$1.FRAME_TYPES.LEASE:
      return deserializeLeaseFrame(buffer2, streamId, flags, encoders);
    default:
      (0, _Invariant$1.default)(false, "RSocketBinaryFraming: Unsupported frame type `%s`.", (0, _RSocketFrame$1.getFrameTypeName)(type));
  }
}
function serializeFrame(frame, encoders) {
  encoders = encoders || _RSocketEncoding.Utf8Encoders;
  switch (frame.type) {
    case _RSocketFrame$1.FRAME_TYPES.SETUP:
      return serializeSetupFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.PAYLOAD:
      return serializePayloadFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.ERROR:
      return serializeErrorFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.KEEPALIVE:
      return serializeKeepAliveFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_FNF:
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_RESPONSE:
      return serializeRequestFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_STREAM:
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_CHANNEL:
      return serializeRequestManyFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.METADATA_PUSH:
      return serializeMetadataPushFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_N:
      return serializeRequestNFrame(frame);
    case _RSocketFrame$1.FRAME_TYPES.RESUME:
      return serializeResumeFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.RESUME_OK:
      return serializeResumeOkFrame(frame);
    case _RSocketFrame$1.FRAME_TYPES.CANCEL:
      return serializeCancelFrame(frame);
    case _RSocketFrame$1.FRAME_TYPES.LEASE:
      return serializeLeaseFrame(frame, encoders);
    default:
      (0, _Invariant$1.default)(false, "RSocketBinaryFraming: Unsupported frame type `%s`.", (0, _RSocketFrame$1.getFrameTypeName)(frame.type));
  }
}
function sizeOfFrame(frame, encoders) {
  encoders = encoders || _RSocketEncoding.Utf8Encoders;
  switch (frame.type) {
    case _RSocketFrame$1.FRAME_TYPES.SETUP:
      return sizeOfSetupFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.PAYLOAD:
      return sizeOfPayloadFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.ERROR:
      return sizeOfErrorFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.KEEPALIVE:
      return sizeOfKeepAliveFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_FNF:
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_RESPONSE:
      return sizeOfRequestFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_STREAM:
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_CHANNEL:
      return sizeOfRequestManyFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.METADATA_PUSH:
      return sizeOfMetadataPushFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.REQUEST_N:
      return sizeOfRequestNFrame();
    case _RSocketFrame$1.FRAME_TYPES.RESUME:
      return sizeOfResumeFrame(frame, encoders);
    case _RSocketFrame$1.FRAME_TYPES.RESUME_OK:
      return sizeOfResumeOkFrame();
    case _RSocketFrame$1.FRAME_TYPES.CANCEL:
      return sizeOfCancelFrame();
    case _RSocketFrame$1.FRAME_TYPES.LEASE:
      return sizeOfLeaseFrame(frame, encoders);
    default:
      (0, _Invariant$1.default)(false, "RSocketBinaryFraming: Unsupported frame type `%s`.", (0, _RSocketFrame$1.getFrameTypeName)(frame.type));
  }
}
const SETUP_FIXED_SIZE = 14;
const RESUME_TOKEN_LENGTH_SIZE = 2;
function serializeSetupFrame(frame, encoders) {
  const resumeTokenLength = frame.resumeToken != null ? encoders.resumeToken.byteLength(frame.resumeToken) : 0;
  const metadataMimeTypeLength = frame.metadataMimeType != null ? encoders.metadataMimeType.byteLength(frame.metadataMimeType) : 0;
  const dataMimeTypeLength = frame.dataMimeType != null ? encoders.dataMimeType.byteLength(frame.dataMimeType) : 0;
  const payloadLength = getPayloadLength(frame, encoders);
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + SETUP_FIXED_SIZE + (resumeTokenLength ? RESUME_TOKEN_LENGTH_SIZE + resumeTokenLength : 0) + metadataMimeTypeLength + dataMimeTypeLength + payloadLength);
  let offset = writeHeader(frame, buffer2);
  offset = buffer2.writeUInt16BE(frame.majorVersion, offset);
  offset = buffer2.writeUInt16BE(frame.minorVersion, offset);
  offset = buffer2.writeUInt32BE(frame.keepAlive, offset);
  offset = buffer2.writeUInt32BE(frame.lifetime, offset);
  if (frame.flags & _RSocketFrame$1.FLAGS.RESUME_ENABLE) {
    offset = buffer2.writeUInt16BE(resumeTokenLength, offset);
    if (frame.resumeToken != null) {
      offset = encoders.resumeToken.encode(frame.resumeToken, buffer2, offset, offset + resumeTokenLength);
    }
  }
  offset = buffer2.writeUInt8(metadataMimeTypeLength, offset);
  if (frame.metadataMimeType != null) {
    offset = encoders.metadataMimeType.encode(frame.metadataMimeType, buffer2, offset, offset + metadataMimeTypeLength);
  }
  offset = buffer2.writeUInt8(dataMimeTypeLength, offset);
  if (frame.dataMimeType != null) {
    offset = encoders.dataMimeType.encode(frame.dataMimeType, buffer2, offset, offset + dataMimeTypeLength);
  }
  writePayload(frame, buffer2, encoders, offset);
  return buffer2;
}
function sizeOfSetupFrame(frame, encoders) {
  const resumeTokenLength = frame.resumeToken != null ? encoders.resumeToken.byteLength(frame.resumeToken) : 0;
  const metadataMimeTypeLength = frame.metadataMimeType != null ? encoders.metadataMimeType.byteLength(frame.metadataMimeType) : 0;
  const dataMimeTypeLength = frame.dataMimeType != null ? encoders.dataMimeType.byteLength(frame.dataMimeType) : 0;
  const payloadLength = getPayloadLength(frame, encoders);
  return FRAME_HEADER_SIZE + SETUP_FIXED_SIZE + (resumeTokenLength ? RESUME_TOKEN_LENGTH_SIZE + resumeTokenLength : 0) + metadataMimeTypeLength + dataMimeTypeLength + payloadLength;
}
function deserializeSetupFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId === 0, "RSocketBinaryFraming: Invalid SETUP frame, expected stream id to be 0.");
  const length = buffer2.length;
  let offset = FRAME_HEADER_SIZE;
  const majorVersion = buffer2.readUInt16BE(offset);
  offset += 2;
  const minorVersion = buffer2.readUInt16BE(offset);
  offset += 2;
  const keepAlive = buffer2.readInt32BE(offset);
  offset += 4;
  (0, _Invariant$1.default)(keepAlive >= 0 && keepAlive <= _RSocketFrame$1.MAX_KEEPALIVE, "RSocketBinaryFraming: Invalid SETUP frame, expected keepAlive to be >= 0 and <= %s. Got `%s`.", _RSocketFrame$1.MAX_KEEPALIVE, keepAlive);
  const lifetime = buffer2.readInt32BE(offset);
  offset += 4;
  (0, _Invariant$1.default)(lifetime >= 0 && lifetime <= _RSocketFrame$1.MAX_LIFETIME, "RSocketBinaryFraming: Invalid SETUP frame, expected lifetime to be >= 0 and <= %s. Got `%s`.", _RSocketFrame$1.MAX_LIFETIME, lifetime);
  let resumeToken = null;
  if (flags & _RSocketFrame$1.FLAGS.RESUME_ENABLE) {
    const resumeTokenLength = buffer2.readInt16BE(offset);
    offset += 2;
    (0, _Invariant$1.default)(resumeTokenLength >= 0 && resumeTokenLength <= _RSocketFrame$1.MAX_RESUME_LENGTH, "RSocketBinaryFraming: Invalid SETUP frame, expected resumeToken length to be >= 0 and <= %s. Got `%s`.", _RSocketFrame$1.MAX_RESUME_LENGTH, resumeTokenLength);
    resumeToken = encoders.resumeToken.decode(buffer2, offset, offset + resumeTokenLength);
    offset += resumeTokenLength;
  }
  const metadataMimeTypeLength = buffer2.readUInt8(offset);
  offset += 1;
  const metadataMimeType = encoders.metadataMimeType.decode(buffer2, offset, offset + metadataMimeTypeLength);
  offset += metadataMimeTypeLength;
  const dataMimeTypeLength = buffer2.readUInt8(offset);
  offset += 1;
  const dataMimeType = encoders.dataMimeType.decode(buffer2, offset, offset + dataMimeTypeLength);
  offset += dataMimeTypeLength;
  const frame = {
    data: null,
    dataMimeType,
    flags,
    keepAlive,
    length,
    lifetime,
    majorVersion,
    metadata: null,
    metadataMimeType,
    minorVersion,
    resumeToken,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.SETUP
  };
  readPayload(buffer2, frame, encoders, offset);
  return frame;
}
const ERROR_FIXED_SIZE = 4;
function serializeErrorFrame(frame, encoders) {
  const messageLength = frame.message != null ? encoders.message.byteLength(frame.message) : 0;
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + ERROR_FIXED_SIZE + messageLength);
  let offset = writeHeader(frame, buffer2);
  offset = buffer2.writeUInt32BE(frame.code, offset);
  if (frame.message != null) {
    encoders.message.encode(frame.message, buffer2, offset, offset + messageLength);
  }
  return buffer2;
}
function sizeOfErrorFrame(frame, encoders) {
  const messageLength = frame.message != null ? encoders.message.byteLength(frame.message) : 0;
  return FRAME_HEADER_SIZE + ERROR_FIXED_SIZE + messageLength;
}
function deserializeErrorFrame(buffer2, streamId, flags, encoders) {
  const length = buffer2.length;
  let offset = FRAME_HEADER_SIZE;
  const code2 = buffer2.readInt32BE(offset);
  offset += 4;
  (0, _Invariant$1.default)(code2 >= 0 && code2 <= _RSocketFrame$1.MAX_CODE, "RSocketBinaryFraming: Invalid ERROR frame, expected code to be >= 0 and <= %s. Got `%s`.", _RSocketFrame$1.MAX_CODE, code2);
  const messageLength = buffer2.length - offset;
  let message = "";
  if (messageLength > 0) {
    message = encoders.message.decode(buffer2, offset, offset + messageLength);
    offset += messageLength;
  }
  return {
    code: code2,
    flags,
    length,
    message,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.ERROR
  };
}
const KEEPALIVE_FIXED_SIZE = 8;
function serializeKeepAliveFrame(frame, encoders) {
  const dataLength = frame.data != null ? encoders.data.byteLength(frame.data) : 0;
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + KEEPALIVE_FIXED_SIZE + dataLength);
  let offset = writeHeader(frame, buffer2);
  offset = (0, _RSocketBufferUtils$3.writeUInt64BE)(buffer2, frame.lastReceivedPosition, offset);
  if (frame.data != null) {
    encoders.data.encode(frame.data, buffer2, offset, offset + dataLength);
  }
  return buffer2;
}
function sizeOfKeepAliveFrame(frame, encoders) {
  const dataLength = frame.data != null ? encoders.data.byteLength(frame.data) : 0;
  return FRAME_HEADER_SIZE + KEEPALIVE_FIXED_SIZE + dataLength;
}
function deserializeKeepAliveFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId === 0, "RSocketBinaryFraming: Invalid KEEPALIVE frame, expected stream id to be 0.");
  const length = buffer2.length;
  let offset = FRAME_HEADER_SIZE;
  const lastReceivedPosition = (0, _RSocketBufferUtils$3.readUInt64BE)(buffer2, offset);
  offset += 8;
  let data = null;
  if (offset < buffer2.length) {
    data = encoders.data.decode(buffer2, offset, buffer2.length);
  }
  return {
    data,
    flags,
    lastReceivedPosition,
    length,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.KEEPALIVE
  };
}
const LEASE_FIXED_SIZE = 8;
function serializeLeaseFrame(frame, encoders) {
  const metaLength = frame.metadata != null ? encoders.metadata.byteLength(frame.metadata) : 0;
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + LEASE_FIXED_SIZE + metaLength);
  let offset = writeHeader(frame, buffer2);
  offset = buffer2.writeUInt32BE(frame.ttl, offset);
  offset = buffer2.writeUInt32BE(frame.requestCount, offset);
  if (frame.metadata != null) {
    encoders.metadata.encode(frame.metadata, buffer2, offset, offset + metaLength);
  }
  return buffer2;
}
function sizeOfLeaseFrame(frame, encoders) {
  const metaLength = frame.metadata != null ? encoders.metadata.byteLength(frame.metadata) : 0;
  return FRAME_HEADER_SIZE + LEASE_FIXED_SIZE + metaLength;
}
function deserializeLeaseFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId === 0, "RSocketBinaryFraming: Invalid LEASE frame, expected stream id to be 0.");
  const length = buffer2.length;
  let offset = FRAME_HEADER_SIZE;
  const ttl = buffer2.readUInt32BE(offset);
  offset += 4;
  const requestCount = buffer2.readUInt32BE(offset);
  offset += 4;
  let metadata = null;
  if (offset < buffer2.length) {
    metadata = encoders.metadata.decode(buffer2, offset, buffer2.length);
  }
  return {
    flags,
    length,
    metadata,
    requestCount,
    streamId,
    ttl,
    type: _RSocketFrame$1.FRAME_TYPES.LEASE
  };
}
function serializeRequestFrame(frame, encoders) {
  const payloadLength = getPayloadLength(frame, encoders);
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + payloadLength);
  const offset = writeHeader(frame, buffer2);
  writePayload(frame, buffer2, encoders, offset);
  return buffer2;
}
function sizeOfRequestFrame(frame, encoders) {
  const payloadLength = getPayloadLength(frame, encoders);
  return FRAME_HEADER_SIZE + payloadLength;
}
function serializeMetadataPushFrame(frame, encoders) {
  const metadata = frame.metadata;
  if (metadata != null) {
    const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + encoders.metadata.byteLength(metadata));
    const offset = writeHeader(frame, buffer2);
    encoders.metadata.encode(metadata, buffer2, offset, buffer2.length);
    return buffer2;
  } else {
    const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE);
    writeHeader(frame, buffer2);
    return buffer2;
  }
}
function sizeOfMetadataPushFrame(frame, encoders) {
  return FRAME_HEADER_SIZE + (frame.metadata != null ? encoders.metadata.byteLength(frame.metadata) : 0);
}
function deserializeRequestFnfFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId > 0, "RSocketBinaryFraming: Invalid REQUEST_FNF frame, expected stream id to be > 0.");
  const length = buffer2.length;
  const frame = {
    data: null,
    flags,
    length,
    metadata: null,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.REQUEST_FNF
  };
  readPayload(buffer2, frame, encoders, FRAME_HEADER_SIZE);
  return frame;
}
function deserializeRequestResponseFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId > 0, "RSocketBinaryFraming: Invalid REQUEST_RESPONSE frame, expected stream id to be > 0.");
  const length = buffer2.length;
  const frame = {
    data: null,
    flags,
    length,
    metadata: null,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.REQUEST_RESPONSE
  };
  readPayload(buffer2, frame, encoders, FRAME_HEADER_SIZE);
  return frame;
}
function deserializeMetadataPushFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId === 0, "RSocketBinaryFraming: Invalid METADATA_PUSH frame, expected stream id to be 0.");
  const length = buffer2.length;
  return {
    flags,
    length,
    metadata: length === FRAME_HEADER_SIZE ? null : encoders.metadata.decode(buffer2, FRAME_HEADER_SIZE, length),
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.METADATA_PUSH
  };
}
const REQUEST_MANY_HEADER = 4;
function serializeRequestManyFrame(frame, encoders) {
  const payloadLength = getPayloadLength(frame, encoders);
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + REQUEST_MANY_HEADER + payloadLength);
  let offset = writeHeader(frame, buffer2);
  offset = buffer2.writeUInt32BE(frame.requestN, offset);
  writePayload(frame, buffer2, encoders, offset);
  return buffer2;
}
function sizeOfRequestManyFrame(frame, encoders) {
  const payloadLength = getPayloadLength(frame, encoders);
  return FRAME_HEADER_SIZE + REQUEST_MANY_HEADER + payloadLength;
}
function deserializeRequestStreamFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId > 0, "RSocketBinaryFraming: Invalid REQUEST_STREAM frame, expected stream id to be > 0.");
  const length = buffer2.length;
  let offset = FRAME_HEADER_SIZE;
  const requestN = buffer2.readInt32BE(offset);
  offset += 4;
  (0, _Invariant$1.default)(requestN > 0, "RSocketBinaryFraming: Invalid REQUEST_STREAM frame, expected requestN to be > 0, got `%s`.", requestN);
  const frame = {
    data: null,
    flags,
    length,
    metadata: null,
    requestN,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.REQUEST_STREAM
  };
  readPayload(buffer2, frame, encoders, offset);
  return frame;
}
function deserializeRequestChannelFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId > 0, "RSocketBinaryFraming: Invalid REQUEST_CHANNEL frame, expected stream id to be > 0.");
  const length = buffer2.length;
  let offset = FRAME_HEADER_SIZE;
  const requestN = buffer2.readInt32BE(offset);
  offset += 4;
  (0, _Invariant$1.default)(requestN > 0, "RSocketBinaryFraming: Invalid REQUEST_STREAM frame, expected requestN to be > 0, got `%s`.", requestN);
  const frame = {
    data: null,
    flags,
    length,
    metadata: null,
    requestN,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.REQUEST_CHANNEL
  };
  readPayload(buffer2, frame, encoders, offset);
  return frame;
}
const REQUEST_N_HEADER = 4;
function serializeRequestNFrame(frame, encoders) {
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + REQUEST_N_HEADER);
  const offset = writeHeader(frame, buffer2);
  buffer2.writeUInt32BE(frame.requestN, offset);
  return buffer2;
}
function sizeOfRequestNFrame(frame, encoders) {
  return FRAME_HEADER_SIZE + REQUEST_N_HEADER;
}
function deserializeRequestNFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId > 0, "RSocketBinaryFraming: Invalid REQUEST_N frame, expected stream id to be > 0.");
  const length = buffer2.length;
  const requestN = buffer2.readInt32BE(FRAME_HEADER_SIZE);
  (0, _Invariant$1.default)(requestN > 0, "RSocketBinaryFraming: Invalid REQUEST_STREAM frame, expected requestN to be > 0, got `%s`.", requestN);
  return {
    flags,
    length,
    requestN,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.REQUEST_N
  };
}
function serializeCancelFrame(frame, encoders) {
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE);
  writeHeader(frame, buffer2);
  return buffer2;
}
function sizeOfCancelFrame(frame, encoders) {
  return FRAME_HEADER_SIZE;
}
function deserializeCancelFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId > 0, "RSocketBinaryFraming: Invalid CANCEL frame, expected stream id to be > 0.");
  const length = buffer2.length;
  return {
    flags,
    length,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.CANCEL
  };
}
function serializePayloadFrame(frame, encoders) {
  const payloadLength = getPayloadLength(frame, encoders);
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + payloadLength);
  const offset = writeHeader(frame, buffer2);
  writePayload(frame, buffer2, encoders, offset);
  return buffer2;
}
function sizeOfPayloadFrame(frame, encoders) {
  const payloadLength = getPayloadLength(frame, encoders);
  return FRAME_HEADER_SIZE + payloadLength;
}
function deserializePayloadFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId > 0, "RSocketBinaryFraming: Invalid PAYLOAD frame, expected stream id to be > 0.");
  const length = buffer2.length;
  const frame = {
    data: null,
    flags,
    length,
    metadata: null,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.PAYLOAD
  };
  readPayload(buffer2, frame, encoders, FRAME_HEADER_SIZE);
  return frame;
}
const RESUME_FIXED_SIZE = 22;
function serializeResumeFrame(frame, encoders) {
  const resumeTokenLength = encoders.resumeToken.byteLength(frame.resumeToken);
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + RESUME_FIXED_SIZE + resumeTokenLength);
  let offset = writeHeader(frame, buffer2);
  offset = buffer2.writeUInt16BE(frame.majorVersion, offset);
  offset = buffer2.writeUInt16BE(frame.minorVersion, offset);
  offset = buffer2.writeUInt16BE(resumeTokenLength, offset);
  offset = encoders.resumeToken.encode(frame.resumeToken, buffer2, offset, offset + resumeTokenLength);
  offset = (0, _RSocketBufferUtils$3.writeUInt64BE)(buffer2, frame.serverPosition, offset);
  (0, _RSocketBufferUtils$3.writeUInt64BE)(buffer2, frame.clientPosition, offset);
  return buffer2;
}
function sizeOfResumeFrame(frame, encoders) {
  const resumeTokenLength = encoders.resumeToken.byteLength(frame.resumeToken);
  return FRAME_HEADER_SIZE + RESUME_FIXED_SIZE + resumeTokenLength;
}
function deserializeResumeFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId === 0, "RSocketBinaryFraming: Invalid RESUME frame, expected stream id to be 0.");
  const length = buffer2.length;
  let offset = FRAME_HEADER_SIZE;
  const majorVersion = buffer2.readUInt16BE(offset);
  offset += 2;
  const minorVersion = buffer2.readUInt16BE(offset);
  offset += 2;
  const resumeTokenLength = buffer2.readInt16BE(offset);
  offset += 2;
  (0, _Invariant$1.default)(resumeTokenLength >= 0 && resumeTokenLength <= _RSocketFrame$1.MAX_RESUME_LENGTH, "RSocketBinaryFraming: Invalid SETUP frame, expected resumeToken length to be >= 0 and <= %s. Got `%s`.", _RSocketFrame$1.MAX_RESUME_LENGTH, resumeTokenLength);
  const resumeToken = encoders.resumeToken.decode(buffer2, offset, offset + resumeTokenLength);
  offset += resumeTokenLength;
  const serverPosition = (0, _RSocketBufferUtils$3.readUInt64BE)(buffer2, offset);
  offset += 8;
  const clientPosition = (0, _RSocketBufferUtils$3.readUInt64BE)(buffer2, offset);
  offset += 8;
  return {
    clientPosition,
    flags,
    length,
    majorVersion,
    minorVersion,
    resumeToken,
    serverPosition,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.RESUME
  };
}
const RESUME_OK_FIXED_SIZE = 8;
function serializeResumeOkFrame(frame, encoders) {
  const buffer2 = (0, _RSocketBufferUtils$3.createBuffer)(FRAME_HEADER_SIZE + RESUME_OK_FIXED_SIZE);
  const offset = writeHeader(frame, buffer2);
  (0, _RSocketBufferUtils$3.writeUInt64BE)(buffer2, frame.clientPosition, offset);
  return buffer2;
}
function sizeOfResumeOkFrame(frame, encoders) {
  return FRAME_HEADER_SIZE + RESUME_OK_FIXED_SIZE;
}
function deserializeResumeOkFrame(buffer2, streamId, flags, encoders) {
  (0, _Invariant$1.default)(streamId === 0, "RSocketBinaryFraming: Invalid RESUME frame, expected stream id to be 0.");
  const length = buffer2.length;
  const clientPosition = (0, _RSocketBufferUtils$3.readUInt64BE)(buffer2, FRAME_HEADER_SIZE);
  return {
    clientPosition,
    flags,
    length,
    streamId,
    type: _RSocketFrame$1.FRAME_TYPES.RESUME_OK
  };
}
function writeHeader(frame, buffer2) {
  const offset = buffer2.writeInt32BE(frame.streamId, 0);
  return buffer2.writeUInt16BE(frame.type << _RSocketFrame$1.FRAME_TYPE_OFFFSET | frame.flags & _RSocketFrame$1.FLAGS_MASK, offset);
}
function getPayloadLength(frame, encoders) {
  let payloadLength = 0;
  if (frame.data != null) {
    payloadLength += encoders.data.byteLength(frame.data);
  }
  if ((0, _RSocketFrame$1.isMetadata)(frame.flags)) {
    payloadLength += UINT24_SIZE;
    if (frame.metadata != null) {
      payloadLength += encoders.metadata.byteLength(frame.metadata);
    }
  }
  return payloadLength;
}
function writePayload(frame, buffer2, encoders, offset) {
  if ((0, _RSocketFrame$1.isMetadata)(frame.flags)) {
    if (frame.metadata != null) {
      const metaLength = encoders.metadata.byteLength(frame.metadata);
      offset = (0, _RSocketBufferUtils$3.writeUInt24BE)(buffer2, metaLength, offset);
      offset = encoders.metadata.encode(frame.metadata, buffer2, offset, offset + metaLength);
    } else {
      offset = (0, _RSocketBufferUtils$3.writeUInt24BE)(buffer2, 0, offset);
    }
  }
  if (frame.data != null) {
    encoders.data.encode(frame.data, buffer2, offset, buffer2.length);
  }
}
function readPayload(buffer2, frame, encoders, offset) {
  if ((0, _RSocketFrame$1.isMetadata)(frame.flags)) {
    const metaLength = (0, _RSocketBufferUtils$3.readUInt24BE)(buffer2, offset);
    offset += UINT24_SIZE;
    if (metaLength > 0) {
      frame.metadata = encoders.metadata.decode(buffer2, offset, offset + metaLength);
      offset += metaLength;
    }
  }
  if (offset < buffer2.length) {
    frame.data = encoders.data.decode(buffer2, offset, buffer2.length);
  }
}
Object.defineProperty(RSocketResumableTransport$1, "__esModule", { value: true });
RSocketResumableTransport$1.default = void 0;
var _rsocketFlowable$1 = build$2;
var _Invariant = _interopRequireDefault$1(Invariant);
var _RSocketFrame = RSocketFrame;
var _rsocketTypes$1 = build$1;
var _RSocketBinaryFraming = RSocketBinaryFraming;
function _interopRequireDefault$1(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function(key) {
        _defineProperty$1(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function _defineProperty$1(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
class RSocketResumableTransport {
  constructor(source, options, encoders) {
    (0, _Invariant.default)(options.bufferSize >= 0, "RSocketResumableTransport: bufferSize option must be >= 0, got `%s`.", options.bufferSize);
    this._encoders = encoders;
    this._bufferSize = options.bufferSize;
    this._sentFramesSize = 0;
    this._position = {
      client: 0,
      server: 0
    };
    this._currentConnection = null;
    this._statusSubscription = null;
    this._receiveSubscription = null;
    this._receivers = /* @__PURE__ */ new Set();
    this._resumeToken = options.resumeToken;
    this._sessionTimeoutMillis = options.sessionDurationSeconds * 1e3;
    this._sessionTimeoutHandle = null;
    this._senders = /* @__PURE__ */ new Set();
    this._sentFrames = [];
    this._setupFrame = null;
    this._source = source;
    this._status = _rsocketTypes$1.CONNECTION_STATUS.NOT_CONNECTED;
    this._statusSubscribers = /* @__PURE__ */ new Set();
  }
  close() {
    this._close();
  }
  connect() {
    (0, _Invariant.default)(!this._isTerminated(), "RSocketResumableTransport: Cannot connect(), connection terminated (%s: %s).", this._status.kind, this._status.kind === "ERROR" ? this._status.error.message : "no message");
    try {
      this._disconnect();
      this._currentConnection = null;
      this._receiveSubscription = null;
      this._statusSubscription = null;
      this._setConnectionStatus(_rsocketTypes$1.CONNECTION_STATUS.CONNECTING);
      const connection = this._source();
      connection.connectionStatus().subscribe({
        onNext: (status) => {
          if (status.kind === this._status.kind) {
            return;
          }
          if (status.kind === "CONNECTED") {
            if (this._sessionTimeoutHandle) {
              clearTimeout(this._sessionTimeoutHandle);
              this._sessionTimeoutHandle = null;
            }
            if (this._setupFrame == null) {
              this._handleConnected(connection);
            } else {
              this._handleResume(connection);
            }
          } else if (this._isTerminationStatus(status)) {
            if (!this._sessionTimeoutHandle) {
              this._sessionTimeoutHandle = setTimeout(() => this._close(this._resumeTimeoutError()), this._sessionTimeoutMillis);
            }
            this._disconnect();
            this._setConnectionStatus(_rsocketTypes$1.CONNECTION_STATUS.NOT_CONNECTED);
          }
        },
        onSubscribe: (subscription) => {
          this._statusSubscription = subscription;
          subscription.request(Number.MAX_SAFE_INTEGER);
        }
      });
      connection.connect();
    } catch (error) {
      this._close(error);
    }
  }
  connectionStatus() {
    return new _rsocketFlowable$1.Flowable((subscriber) => {
      subscriber.onSubscribe({
        cancel: () => {
          this._statusSubscribers.delete(subscriber);
        },
        request: () => {
          this._statusSubscribers.add(subscriber);
          subscriber.onNext(this._status);
        }
      });
    });
  }
  receive() {
    return new _rsocketFlowable$1.Flowable((subject) => {
      let added = false;
      subject.onSubscribe({
        cancel: () => {
          this._receivers.delete(subject);
        },
        request: () => {
          if (!added) {
            added = true;
            this._receivers.add(subject);
          }
        }
      });
    });
  }
  sendOne(frame) {
    try {
      this._writeFrame(frame);
    } catch (error) {
      this._close(error);
    }
  }
  send(frames) {
    let subscription;
    frames.subscribe({
      onComplete: () => {
        subscription && this._senders.delete(subscription);
      },
      onError: (error) => {
        subscription && this._senders.delete(subscription);
        this._close(error);
      },
      onNext: (frame) => this._writeFrame(frame),
      onSubscribe: (_subscription) => {
        subscription = _subscription;
        this._senders.add(subscription);
        subscription.request(Number.MAX_SAFE_INTEGER);
      }
    });
  }
  _close(error) {
    if (this._isTerminated()) {
      return;
    }
    if (error) {
      this._setConnectionStatus({ error, kind: "ERROR" });
    } else {
      this._setConnectionStatus(_rsocketTypes$1.CONNECTION_STATUS.CLOSED);
    }
    const receivers = this._receivers;
    receivers.forEach((r) => r.onComplete());
    receivers.clear();
    const senders = this._senders;
    senders.forEach((s) => s.cancel());
    senders.clear();
    this._sentFrames.length = 0;
    this._disconnect();
  }
  _disconnect() {
    if (this._statusSubscription) {
      this._statusSubscription.cancel();
      this._statusSubscription = null;
    }
    if (this._receiveSubscription) {
      this._receiveSubscription.cancel();
      this._receiveSubscription = null;
    }
    if (this._currentConnection) {
      this._currentConnection.close();
      this._currentConnection = null;
    }
  }
  _handleConnected(connection) {
    this._currentConnection = connection;
    this._flushFrames();
    this._setConnectionStatus(_rsocketTypes$1.CONNECTION_STATUS.CONNECTED);
    connection.receive().subscribe({
      onNext: (frame) => {
        try {
          this._receiveFrame(frame);
        } catch (error) {
          this._close(error);
        }
      },
      onSubscribe: (subscription) => {
        this._receiveSubscription = subscription;
        subscription.request(Number.MAX_SAFE_INTEGER);
      }
    });
  }
  _handleResume(connection) {
    connection.receive().take(1).subscribe({
      onNext: (frame) => {
        try {
          if (frame.type === _RSocketFrame.FRAME_TYPES.RESUME_OK) {
            const { clientPosition } = frame;
            if (clientPosition < this._position.client) {
              this._close(this._nonResumableStateError());
              return;
            }
            let removeSize = clientPosition - this._position.client;
            let index = 0;
            while (removeSize > 0) {
              const frameSize = this._onReleasedTailFrame(this._sentFrames[index]);
              if (!frameSize) {
                this._close(this._absentLengthError(frame));
                return;
              }
              removeSize -= frameSize;
              index++;
            }
            if (removeSize !== 0) {
              this._close(this._inconsistentImpliedPositionError());
              return;
            }
            if (index > 0) {
              this._sentFrames.splice(0, index);
            }
            this._handleConnected(connection);
          } else {
            const error = frame.type === _RSocketFrame.FRAME_TYPES.ERROR ? (0, _RSocketFrame.createErrorFromFrame)(frame) : new Error("RSocketResumableTransport: Resumption failed for an unspecified reason.");
            this._close(error);
          }
        } catch (error) {
          this._close(error);
        }
      },
      onSubscribe: (subscription) => {
        this._receiveSubscription = subscription;
        subscription.request(1);
      }
    });
    const setupFrame = this._setupFrame;
    (0, _Invariant.default)(setupFrame, "RSocketResumableTransport: Cannot resume, setup frame has not been sent.");
    connection.sendOne({
      clientPosition: this._position.client,
      flags: 0,
      majorVersion: setupFrame.majorVersion,
      minorVersion: setupFrame.minorVersion,
      resumeToken: this._resumeToken,
      serverPosition: this._position.server,
      streamId: _RSocketFrame.CONNECTION_STREAM_ID,
      type: _RSocketFrame.FRAME_TYPES.RESUME
    });
  }
  _absentLengthError(frame) {
    return new Error("RSocketResumableTransport: absent frame.length for type " + frame.type);
  }
  _inconsistentImpliedPositionError() {
    return new Error("RSocketResumableTransport: local frames are inconsistent with remote implied position");
  }
  _nonResumableStateError() {
    return new Error("RSocketResumableTransport: resumption failed, server is missing frames that are no longer in the client buffer.");
  }
  _resumeTimeoutError() {
    return new Error("RSocketResumableTransport: resumable session timed out");
  }
  _isTerminated() {
    return this._isTerminationStatus(this._status);
  }
  _isTerminationStatus(status) {
    const kind = status.kind;
    return kind === "CLOSED" || kind === "ERROR";
  }
  _setConnectionStatus(status) {
    if (status.kind === this._status.kind) {
      return;
    }
    this._status = status;
    this._statusSubscribers.forEach((subscriber) => subscriber.onNext(status));
  }
  _receiveFrame(frame) {
    if ((0, _RSocketFrame.isResumePositionFrameType)(frame.type)) {
      if (frame.length) {
        this._position.server += frame.length;
      }
    }
    this._receivers.forEach((subscriber) => subscriber.onNext(frame));
  }
  _flushFrames() {
    this._sentFrames.forEach((frame) => {
      const connection = this._currentConnection;
      if (connection) {
        connection.sendOne(frame);
      }
    });
  }
  _onReleasedTailFrame(frame) {
    const removedFrameSize = frame.length;
    if (removedFrameSize) {
      this._sentFramesSize -= removedFrameSize;
      this._position.client += removedFrameSize;
      return removedFrameSize;
    }
  }
  _writeFrame(frame) {
    if (frame.type === _RSocketFrame.FRAME_TYPES.SETUP) {
      frame = _objectSpread(_objectSpread({}, frame), {}, {
        flags: frame.flags | _RSocketFrame.FLAGS.RESUME_ENABLE,
        resumeToken: this._resumeToken
      });
      this._setupFrame = frame;
    }
    frame.length = (0, _RSocketBinaryFraming.sizeOfFrame)(frame, this._encoders);
    if ((0, _RSocketFrame.isResumePositionFrameType)(frame.type)) {
      let available = this._bufferSize - this._sentFramesSize;
      const frameSize = frame.length;
      if (frameSize) {
        while (available < frameSize) {
          const removedFrame = this._sentFrames.shift();
          if (removedFrame) {
            const removedFrameSize = this._onReleasedTailFrame(removedFrame);
            if (!removedFrameSize) {
              this._close(this._absentLengthError(frame));
              return;
            }
            available += removedFrameSize;
          } else {
            break;
          }
        }
        if (available >= frameSize) {
          this._sentFrames.push(frame);
          this._sentFramesSize += frameSize;
        } else {
          this._position.client += frameSize;
        }
      } else {
        this._close(this._absentLengthError(frame));
        return;
      }
    }
    const currentConnection = this._currentConnection;
    if (currentConnection) {
      currentConnection.sendOne(frame);
    }
  }
}
RSocketResumableTransport$1.default = RSocketResumableTransport;
var WellKnownMimeType$1 = {};
Object.defineProperty(WellKnownMimeType$1, "__esModule", { value: true });
WellKnownMimeType$1.TYPES_BY_MIME_STRING = WellKnownMimeType$1.TYPES_BY_MIME_ID = WellKnownMimeType$1.MESSAGE_RSOCKET_COMPOSITE_METADATA = WellKnownMimeType$1.MESSAGE_RSOCKET_ROUTING = WellKnownMimeType$1.MESSAGE_RSOCKET_TRACING_ZIPKIN = WellKnownMimeType$1.MESSAGE_RSOCKET_AUTHENTICATION = WellKnownMimeType$1.MESSAGE_RSOCKET_ACCEPT_MIMETYPES = WellKnownMimeType$1.MESSAGE_RSOCKET_MIMETYPE = WellKnownMimeType$1.APPLICATION_CLOUDEVENTS_JSON = WellKnownMimeType$1.APPLICATION_JAVA_OBJECT = WellKnownMimeType$1.APPLICATION_HESSIAN = WellKnownMimeType$1.VIDEO_VP8 = WellKnownMimeType$1.VIDEO_H265 = WellKnownMimeType$1.VIDEO_H264 = WellKnownMimeType$1.TEXT_XML = WellKnownMimeType$1.TEXT_PLAIN = WellKnownMimeType$1.TEXT_HTML = WellKnownMimeType$1.TEXT_CSV = WellKnownMimeType$1.TEXT_CSS = WellKnownMimeType$1.MULTIPART_MIXED = WellKnownMimeType$1.IMAGE_TIFF = WellKnownMimeType$1.IMAGE_PNG = WellKnownMimeType$1.IMAGE_JPEG = WellKnownMimeType$1.IMAGE_HEIF = WellKnownMimeType$1.IMAGE_HEIF_SEQUENCE = WellKnownMimeType$1.IMAGE_HEIC = WellKnownMimeType$1.IMAGE_HEIC_SEQUENCE = WellKnownMimeType$1.IMAGE_GIG = WellKnownMimeType$1.IMAGE_BMP = WellKnownMimeType$1.AUDIO_VORBIS = WellKnownMimeType$1.AUDIO_OPUS = WellKnownMimeType$1.AUDIO_OGG = WellKnownMimeType$1.AUDIO_MPEG = WellKnownMimeType$1.AUDIO_MPEG3 = WellKnownMimeType$1.AUDIO_MP4 = WellKnownMimeType$1.AUDIO_MP3 = WellKnownMimeType$1.AUDIO_AAC = WellKnownMimeType$1.APPLICATION_ZIP = WellKnownMimeType$1.APPLICATION_XML = WellKnownMimeType$1.APPLICATION_PROTOBUF = WellKnownMimeType$1.APPLICATION_THRIFT = WellKnownMimeType$1.APPLICATION_PDF = WellKnownMimeType$1.APPLICATION_OCTET_STREAM = WellKnownMimeType$1.APPLICATION_JSON = WellKnownMimeType$1.APPLICATION_JAVASCRIPT = WellKnownMimeType$1.APPLICATION_GZIP = WellKnownMimeType$1.APPLICATION_GRAPHQL = WellKnownMimeType$1.APPLICATION_CBOR = WellKnownMimeType$1.APPLICATION_AVRO = WellKnownMimeType$1.UNKNOWN_RESERVED_MIME_TYPE = WellKnownMimeType$1.UNPARSEABLE_MIME_TYPE = WellKnownMimeType$1.default = void 0;
class WellKnownMimeType {
  constructor(str, identifier) {
    this._string = str;
    this._identifier = identifier;
  }
  static fromIdentifier(id) {
    if (id < 0 || id > 127) {
      return UNPARSEABLE_MIME_TYPE;
    }
    return TYPES_BY_MIME_ID[id];
  }
  static fromString(mimeType) {
    if (!mimeType) {
      throw new Error("type must be non-null");
    }
    if (mimeType === UNKNOWN_RESERVED_MIME_TYPE.string) {
      return UNPARSEABLE_MIME_TYPE;
    }
    return TYPES_BY_MIME_STRING.get(mimeType) || UNPARSEABLE_MIME_TYPE;
  }
  get identifier() {
    return this._identifier;
  }
  get string() {
    return this._string;
  }
  toString() {
    return this._string;
  }
}
WellKnownMimeType$1.default = WellKnownMimeType;
const UNPARSEABLE_MIME_TYPE = new WellKnownMimeType("UNPARSEABLE_MIME_TYPE_DO_NOT_USE", -2);
WellKnownMimeType$1.UNPARSEABLE_MIME_TYPE = UNPARSEABLE_MIME_TYPE;
const UNKNOWN_RESERVED_MIME_TYPE = new WellKnownMimeType("UNKNOWN_YET_RESERVED_DO_NOT_USE", -1);
WellKnownMimeType$1.UNKNOWN_RESERVED_MIME_TYPE = UNKNOWN_RESERVED_MIME_TYPE;
const APPLICATION_AVRO = new WellKnownMimeType("application/avro", 0);
WellKnownMimeType$1.APPLICATION_AVRO = APPLICATION_AVRO;
const APPLICATION_CBOR = new WellKnownMimeType("application/cbor", 1);
WellKnownMimeType$1.APPLICATION_CBOR = APPLICATION_CBOR;
const APPLICATION_GRAPHQL = new WellKnownMimeType("application/graphql", 2);
WellKnownMimeType$1.APPLICATION_GRAPHQL = APPLICATION_GRAPHQL;
const APPLICATION_GZIP = new WellKnownMimeType("application/gzip", 3);
WellKnownMimeType$1.APPLICATION_GZIP = APPLICATION_GZIP;
const APPLICATION_JAVASCRIPT = new WellKnownMimeType("application/javascript", 4);
WellKnownMimeType$1.APPLICATION_JAVASCRIPT = APPLICATION_JAVASCRIPT;
const APPLICATION_JSON = new WellKnownMimeType("application/json", 5);
WellKnownMimeType$1.APPLICATION_JSON = APPLICATION_JSON;
const APPLICATION_OCTET_STREAM = new WellKnownMimeType("application/octet-stream", 6);
WellKnownMimeType$1.APPLICATION_OCTET_STREAM = APPLICATION_OCTET_STREAM;
const APPLICATION_PDF = new WellKnownMimeType("application/pdf", 7);
WellKnownMimeType$1.APPLICATION_PDF = APPLICATION_PDF;
const APPLICATION_THRIFT = new WellKnownMimeType("application/vnd.apache.thrift.binary", 8);
WellKnownMimeType$1.APPLICATION_THRIFT = APPLICATION_THRIFT;
const APPLICATION_PROTOBUF = new WellKnownMimeType("application/vnd.google.protobuf", 9);
WellKnownMimeType$1.APPLICATION_PROTOBUF = APPLICATION_PROTOBUF;
const APPLICATION_XML = new WellKnownMimeType("application/xml", 10);
WellKnownMimeType$1.APPLICATION_XML = APPLICATION_XML;
const APPLICATION_ZIP = new WellKnownMimeType("application/zip", 11);
WellKnownMimeType$1.APPLICATION_ZIP = APPLICATION_ZIP;
const AUDIO_AAC = new WellKnownMimeType("audio/aac", 12);
WellKnownMimeType$1.AUDIO_AAC = AUDIO_AAC;
const AUDIO_MP3 = new WellKnownMimeType("audio/mp3", 13);
WellKnownMimeType$1.AUDIO_MP3 = AUDIO_MP3;
const AUDIO_MP4 = new WellKnownMimeType("audio/mp4", 14);
WellKnownMimeType$1.AUDIO_MP4 = AUDIO_MP4;
const AUDIO_MPEG3 = new WellKnownMimeType("audio/mpeg3", 15);
WellKnownMimeType$1.AUDIO_MPEG3 = AUDIO_MPEG3;
const AUDIO_MPEG = new WellKnownMimeType("audio/mpeg", 16);
WellKnownMimeType$1.AUDIO_MPEG = AUDIO_MPEG;
const AUDIO_OGG = new WellKnownMimeType("audio/ogg", 17);
WellKnownMimeType$1.AUDIO_OGG = AUDIO_OGG;
const AUDIO_OPUS = new WellKnownMimeType("audio/opus", 18);
WellKnownMimeType$1.AUDIO_OPUS = AUDIO_OPUS;
const AUDIO_VORBIS = new WellKnownMimeType("audio/vorbis", 19);
WellKnownMimeType$1.AUDIO_VORBIS = AUDIO_VORBIS;
const IMAGE_BMP = new WellKnownMimeType("image/bmp", 20);
WellKnownMimeType$1.IMAGE_BMP = IMAGE_BMP;
const IMAGE_GIG = new WellKnownMimeType("image/gif", 21);
WellKnownMimeType$1.IMAGE_GIG = IMAGE_GIG;
const IMAGE_HEIC_SEQUENCE = new WellKnownMimeType("image/heic-sequence", 22);
WellKnownMimeType$1.IMAGE_HEIC_SEQUENCE = IMAGE_HEIC_SEQUENCE;
const IMAGE_HEIC = new WellKnownMimeType("image/heic", 23);
WellKnownMimeType$1.IMAGE_HEIC = IMAGE_HEIC;
const IMAGE_HEIF_SEQUENCE = new WellKnownMimeType("image/heif-sequence", 24);
WellKnownMimeType$1.IMAGE_HEIF_SEQUENCE = IMAGE_HEIF_SEQUENCE;
const IMAGE_HEIF = new WellKnownMimeType("image/heif", 25);
WellKnownMimeType$1.IMAGE_HEIF = IMAGE_HEIF;
const IMAGE_JPEG = new WellKnownMimeType("image/jpeg", 26);
WellKnownMimeType$1.IMAGE_JPEG = IMAGE_JPEG;
const IMAGE_PNG = new WellKnownMimeType("image/png", 27);
WellKnownMimeType$1.IMAGE_PNG = IMAGE_PNG;
const IMAGE_TIFF = new WellKnownMimeType("image/tiff", 28);
WellKnownMimeType$1.IMAGE_TIFF = IMAGE_TIFF;
const MULTIPART_MIXED = new WellKnownMimeType("multipart/mixed", 29);
WellKnownMimeType$1.MULTIPART_MIXED = MULTIPART_MIXED;
const TEXT_CSS = new WellKnownMimeType("text/css", 30);
WellKnownMimeType$1.TEXT_CSS = TEXT_CSS;
const TEXT_CSV = new WellKnownMimeType("text/csv", 31);
WellKnownMimeType$1.TEXT_CSV = TEXT_CSV;
const TEXT_HTML = new WellKnownMimeType("text/html", 32);
WellKnownMimeType$1.TEXT_HTML = TEXT_HTML;
const TEXT_PLAIN = new WellKnownMimeType("text/plain", 33);
WellKnownMimeType$1.TEXT_PLAIN = TEXT_PLAIN;
const TEXT_XML = new WellKnownMimeType("text/xml", 34);
WellKnownMimeType$1.TEXT_XML = TEXT_XML;
const VIDEO_H264 = new WellKnownMimeType("video/H264", 35);
WellKnownMimeType$1.VIDEO_H264 = VIDEO_H264;
const VIDEO_H265 = new WellKnownMimeType("video/H265", 36);
WellKnownMimeType$1.VIDEO_H265 = VIDEO_H265;
const VIDEO_VP8 = new WellKnownMimeType("video/VP8", 37);
WellKnownMimeType$1.VIDEO_VP8 = VIDEO_VP8;
const APPLICATION_HESSIAN = new WellKnownMimeType("application/x-hessian", 38);
WellKnownMimeType$1.APPLICATION_HESSIAN = APPLICATION_HESSIAN;
const APPLICATION_JAVA_OBJECT = new WellKnownMimeType("application/x-java-object", 39);
WellKnownMimeType$1.APPLICATION_JAVA_OBJECT = APPLICATION_JAVA_OBJECT;
const APPLICATION_CLOUDEVENTS_JSON = new WellKnownMimeType("application/cloudevents+json", 40);
WellKnownMimeType$1.APPLICATION_CLOUDEVENTS_JSON = APPLICATION_CLOUDEVENTS_JSON;
const MESSAGE_RSOCKET_MIMETYPE = new WellKnownMimeType("message/x.rsocket.mime-type.v0", 122);
WellKnownMimeType$1.MESSAGE_RSOCKET_MIMETYPE = MESSAGE_RSOCKET_MIMETYPE;
const MESSAGE_RSOCKET_ACCEPT_MIMETYPES = new WellKnownMimeType("message/x.rsocket.accept-mime-types.v0", 123);
WellKnownMimeType$1.MESSAGE_RSOCKET_ACCEPT_MIMETYPES = MESSAGE_RSOCKET_ACCEPT_MIMETYPES;
const MESSAGE_RSOCKET_AUTHENTICATION = new WellKnownMimeType("message/x.rsocket.authentication.v0", 124);
WellKnownMimeType$1.MESSAGE_RSOCKET_AUTHENTICATION = MESSAGE_RSOCKET_AUTHENTICATION;
const MESSAGE_RSOCKET_TRACING_ZIPKIN = new WellKnownMimeType("message/x.rsocket.tracing-zipkin.v0", 125);
WellKnownMimeType$1.MESSAGE_RSOCKET_TRACING_ZIPKIN = MESSAGE_RSOCKET_TRACING_ZIPKIN;
const MESSAGE_RSOCKET_ROUTING = new WellKnownMimeType("message/x.rsocket.routing.v0", 126);
WellKnownMimeType$1.MESSAGE_RSOCKET_ROUTING = MESSAGE_RSOCKET_ROUTING;
const MESSAGE_RSOCKET_COMPOSITE_METADATA = new WellKnownMimeType("message/x.rsocket.composite-metadata.v0", 127);
WellKnownMimeType$1.MESSAGE_RSOCKET_COMPOSITE_METADATA = MESSAGE_RSOCKET_COMPOSITE_METADATA;
const TYPES_BY_MIME_ID = new Array(128);
WellKnownMimeType$1.TYPES_BY_MIME_ID = TYPES_BY_MIME_ID;
const TYPES_BY_MIME_STRING = /* @__PURE__ */ new Map();
WellKnownMimeType$1.TYPES_BY_MIME_STRING = TYPES_BY_MIME_STRING;
const ALL_MIME_TYPES$1 = [
  UNPARSEABLE_MIME_TYPE,
  UNKNOWN_RESERVED_MIME_TYPE,
  APPLICATION_AVRO,
  APPLICATION_CBOR,
  APPLICATION_GRAPHQL,
  APPLICATION_GZIP,
  APPLICATION_JAVASCRIPT,
  APPLICATION_JSON,
  APPLICATION_OCTET_STREAM,
  APPLICATION_PDF,
  APPLICATION_THRIFT,
  APPLICATION_PROTOBUF,
  APPLICATION_XML,
  APPLICATION_ZIP,
  AUDIO_AAC,
  AUDIO_MP3,
  AUDIO_MP4,
  AUDIO_MPEG3,
  AUDIO_MPEG,
  AUDIO_OGG,
  AUDIO_OPUS,
  AUDIO_VORBIS,
  IMAGE_BMP,
  IMAGE_GIG,
  IMAGE_HEIC_SEQUENCE,
  IMAGE_HEIC,
  IMAGE_HEIF_SEQUENCE,
  IMAGE_HEIF,
  IMAGE_JPEG,
  IMAGE_PNG,
  IMAGE_TIFF,
  MULTIPART_MIXED,
  TEXT_CSS,
  TEXT_CSV,
  TEXT_HTML,
  TEXT_PLAIN,
  TEXT_XML,
  VIDEO_H264,
  VIDEO_H265,
  VIDEO_VP8,
  APPLICATION_HESSIAN,
  APPLICATION_JAVA_OBJECT,
  APPLICATION_CLOUDEVENTS_JSON,
  MESSAGE_RSOCKET_MIMETYPE,
  MESSAGE_RSOCKET_ACCEPT_MIMETYPES,
  MESSAGE_RSOCKET_AUTHENTICATION,
  MESSAGE_RSOCKET_TRACING_ZIPKIN,
  MESSAGE_RSOCKET_ROUTING,
  MESSAGE_RSOCKET_COMPOSITE_METADATA
];
TYPES_BY_MIME_ID.fill(UNKNOWN_RESERVED_MIME_TYPE);
for (const value of ALL_MIME_TYPES$1) {
  if (value.identifier >= 0) {
    TYPES_BY_MIME_ID[value.identifier] = value;
    TYPES_BY_MIME_STRING.set(value.string, value);
  }
}
if (Object.seal) {
  Object.seal(TYPES_BY_MIME_ID);
}
var WellKnownAuthType$1 = {};
Object.defineProperty(WellKnownAuthType$1, "__esModule", { value: true });
WellKnownAuthType$1.TYPES_BY_AUTH_STRING = WellKnownAuthType$1.TYPES_BY_AUTH_ID = WellKnownAuthType$1.BEARER = WellKnownAuthType$1.SIMPLE = WellKnownAuthType$1.UNKNOWN_RESERVED_AUTH_TYPE = WellKnownAuthType$1.UNPARSEABLE_AUTH_TYPE = WellKnownAuthType$1.default = void 0;
class WellKnownAuthType {
  constructor(str, identifier) {
    this._string = str;
    this._identifier = identifier;
  }
  static fromIdentifier(id) {
    if (id < 0 || id > 127) {
      return UNPARSEABLE_AUTH_TYPE;
    }
    return TYPES_BY_AUTH_ID[id];
  }
  static fromString(authTypeString) {
    if (!authTypeString) {
      throw new Error("type must be non-null");
    }
    if (authTypeString === UNKNOWN_RESERVED_AUTH_TYPE.string) {
      return UNPARSEABLE_AUTH_TYPE;
    }
    return TYPES_BY_AUTH_STRING.get(authTypeString) || UNPARSEABLE_AUTH_TYPE;
  }
  get identifier() {
    return this._identifier;
  }
  get string() {
    return this._string;
  }
  toString() {
    return this._string;
  }
}
WellKnownAuthType$1.default = WellKnownAuthType;
const UNPARSEABLE_AUTH_TYPE = new WellKnownAuthType("UNPARSEABLE_AUTH_TYPE_DO_NOT_USE", -2);
WellKnownAuthType$1.UNPARSEABLE_AUTH_TYPE = UNPARSEABLE_AUTH_TYPE;
const UNKNOWN_RESERVED_AUTH_TYPE = new WellKnownAuthType("UNKNOWN_YET_RESERVED_DO_NOT_USE", -1);
WellKnownAuthType$1.UNKNOWN_RESERVED_AUTH_TYPE = UNKNOWN_RESERVED_AUTH_TYPE;
const SIMPLE = new WellKnownAuthType("simple", 0);
WellKnownAuthType$1.SIMPLE = SIMPLE;
const BEARER = new WellKnownAuthType("bearer", 1);
WellKnownAuthType$1.BEARER = BEARER;
const TYPES_BY_AUTH_ID = new Array(128);
WellKnownAuthType$1.TYPES_BY_AUTH_ID = TYPES_BY_AUTH_ID;
const TYPES_BY_AUTH_STRING = /* @__PURE__ */ new Map();
WellKnownAuthType$1.TYPES_BY_AUTH_STRING = TYPES_BY_AUTH_STRING;
const ALL_MIME_TYPES = [
  UNPARSEABLE_AUTH_TYPE,
  UNKNOWN_RESERVED_AUTH_TYPE,
  SIMPLE,
  BEARER
];
TYPES_BY_AUTH_ID.fill(UNKNOWN_RESERVED_AUTH_TYPE);
for (const value of ALL_MIME_TYPES) {
  if (value.identifier >= 0) {
    TYPES_BY_AUTH_ID[value.identifier] = value;
    TYPES_BY_AUTH_STRING.set(value.string, value);
  }
}
if (Object.seal) {
  Object.seal(TYPES_BY_AUTH_ID);
}
var CompositeMetadata$1 = {};
Object.defineProperty(CompositeMetadata$1, "__esModule", { value: true });
CompositeMetadata$1.encodeCompositeMetadata = encodeCompositeMetadata;
CompositeMetadata$1.encodeAndAddCustomMetadata = encodeAndAddCustomMetadata;
CompositeMetadata$1.encodeAndAddWellKnownMetadata = encodeAndAddWellKnownMetadata;
CompositeMetadata$1.decodeMimeAndContentBuffersSlices = decodeMimeAndContentBuffersSlices;
CompositeMetadata$1.decodeMimeTypeFromMimeBuffer = decodeMimeTypeFromMimeBuffer;
CompositeMetadata$1.encodeCustomMetadataHeader = encodeCustomMetadataHeader;
CompositeMetadata$1.encodeWellKnownMetadataHeader = encodeWellKnownMetadataHeader;
CompositeMetadata$1.decodeCompositeMetadata = decodeCompositeMetadata;
CompositeMetadata$1.WellKnownMimeTypeEntry = CompositeMetadata$1.ReservedMimeTypeEntry = CompositeMetadata$1.ExplicitMimeTimeEntry = CompositeMetadata$1.CompositeMetadata = void 0;
var _LiteBuffer$2 = LiteBuffer$1;
var _RSocketBufferUtils$2 = RSocketBufferUtils;
var _WellKnownMimeType = _interopRequireWildcard$1(WellKnownMimeType$1);
function _getRequireWildcardCache$1() {
  if (typeof WeakMap !== "function")
    return null;
  var cache = /* @__PURE__ */ new WeakMap();
  _getRequireWildcardCache$1 = function() {
    return cache;
  };
  return cache;
}
function _interopRequireWildcard$1(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
    return { default: obj };
  }
  var cache = _getRequireWildcardCache$1();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
class CompositeMetadata {
  constructor(buffer2) {
    this._buffer = buffer2;
  }
  iterator() {
    return decodeCompositeMetadata(this._buffer);
  }
  [Symbol.iterator]() {
    return decodeCompositeMetadata(this._buffer);
  }
}
CompositeMetadata$1.CompositeMetadata = CompositeMetadata;
function encodeCompositeMetadata(metadata) {
  let encodedCompositeMetadata = (0, _RSocketBufferUtils$2.createBuffer)(0);
  for (const [metadataKey, metadataValue] of metadata) {
    const metadataRealValue = typeof metadataValue === "function" ? metadataValue() : metadataValue;
    if (metadataKey instanceof _WellKnownMimeType.default || typeof metadataKey === "number" || metadataKey.constructor.name === "WellKnownMimeType") {
      encodedCompositeMetadata = encodeAndAddWellKnownMetadata(encodedCompositeMetadata, metadataKey, metadataRealValue);
    } else {
      encodedCompositeMetadata = encodeAndAddCustomMetadata(encodedCompositeMetadata, metadataKey, metadataRealValue);
    }
  }
  return encodedCompositeMetadata;
}
function encodeAndAddCustomMetadata(compositeMetaData, customMimeType, metadata) {
  return _LiteBuffer$2.LiteBuffer.concat([
    compositeMetaData,
    encodeCustomMetadataHeader(customMimeType, metadata.byteLength),
    metadata
  ]);
}
function encodeAndAddWellKnownMetadata(compositeMetadata, knownMimeType, metadata) {
  let mimeTypeId;
  if (Number.isInteger(knownMimeType)) {
    mimeTypeId = knownMimeType;
  } else {
    mimeTypeId = knownMimeType.identifier;
  }
  return _LiteBuffer$2.LiteBuffer.concat([
    compositeMetadata,
    encodeWellKnownMetadataHeader(mimeTypeId, metadata.byteLength),
    metadata
  ]);
}
function decodeMimeAndContentBuffersSlices(compositeMetadata, entryIndex) {
  const mimeIdOrLength = compositeMetadata.readInt8(entryIndex);
  let mime;
  let toSkip = entryIndex;
  if ((mimeIdOrLength & STREAM_METADATA_KNOWN_MASK) === STREAM_METADATA_KNOWN_MASK) {
    mime = compositeMetadata.slice(toSkip, toSkip + 1);
    toSkip += 1;
  } else {
    const mimeLength = (mimeIdOrLength & 255) + 1;
    if (compositeMetadata.byteLength > toSkip + mimeLength) {
      mime = compositeMetadata.slice(toSkip, toSkip + mimeLength + 1);
      toSkip += mimeLength + 1;
    } else {
      throw new Error("Metadata is malformed. Inappropriately formed Mime Length");
    }
  }
  if (compositeMetadata.byteLength >= toSkip + 3) {
    const metadataLength = (0, _RSocketBufferUtils$2.readUInt24BE)(compositeMetadata, toSkip);
    toSkip += 3;
    if (compositeMetadata.byteLength >= metadataLength + toSkip) {
      const metadata = compositeMetadata.slice(toSkip, toSkip + metadataLength);
      return [mime, metadata];
    } else {
      throw new Error("Metadata is malformed. Inappropriately formed Metadata Length or malformed content");
    }
  } else {
    throw new Error("Metadata is malformed. Metadata Length is absent or malformed");
  }
}
function decodeMimeTypeFromMimeBuffer(flyweightMimeBuffer) {
  if (flyweightMimeBuffer.length < 2) {
    throw new Error("Unable to decode explicit MIME type");
  }
  return flyweightMimeBuffer.toString("ascii", 1);
}
function encodeCustomMetadataHeader(customMime, metadataLength) {
  const metadataHeader = (0, _RSocketBufferUtils$2.createBuffer)(4 + customMime.length);
  const customMimeLength = metadataHeader.write(customMime, 1);
  if (!isAscii(metadataHeader, 1)) {
    throw new Error("Custom mime type must be US_ASCII characters only");
  }
  if (customMimeLength < 1 || customMimeLength > 128) {
    throw new Error("Custom mime type must have a strictly positive length that fits on 7 unsigned bits, ie 1-128");
  }
  metadataHeader.writeUInt8(customMimeLength - 1);
  (0, _RSocketBufferUtils$2.writeUInt24BE)(metadataHeader, metadataLength, customMimeLength + 1);
  return metadataHeader;
}
function encodeWellKnownMetadataHeader(mimeType, metadataLength) {
  const buffer2 = _LiteBuffer$2.LiteBuffer.alloc(4);
  buffer2.writeUInt8(mimeType | STREAM_METADATA_KNOWN_MASK);
  (0, _RSocketBufferUtils$2.writeUInt24BE)(buffer2, metadataLength, 1);
  return buffer2;
}
function* decodeCompositeMetadata(buffer2) {
  const length = buffer2.byteLength;
  let entryIndex = 0;
  while (entryIndex < length) {
    const headerAndData = decodeMimeAndContentBuffersSlices(buffer2, entryIndex);
    const header = headerAndData[0];
    const data = headerAndData[1];
    entryIndex = computeNextEntryIndex(entryIndex, header, data);
    if (!isWellKnownMimeType(header)) {
      const typeString = decodeMimeTypeFromMimeBuffer(header);
      if (!typeString) {
        throw new Error("MIME type cannot be null");
      }
      yield new ExplicitMimeTimeEntry(data, typeString);
      continue;
    }
    const id = decodeMimeIdFromMimeBuffer(header);
    const type = _WellKnownMimeType.default.fromIdentifier(id);
    if (_WellKnownMimeType.UNKNOWN_RESERVED_MIME_TYPE === type) {
      yield new ReservedMimeTypeEntry(data, id);
      continue;
    }
    yield new WellKnownMimeTypeEntry(data, type);
  }
}
class ExplicitMimeTimeEntry {
  constructor(content, type) {
    this._content = content;
    this._type = type;
  }
  get content() {
    return this._content;
  }
  get mimeType() {
    return this._type;
  }
}
CompositeMetadata$1.ExplicitMimeTimeEntry = ExplicitMimeTimeEntry;
class ReservedMimeTypeEntry {
  constructor(content, type) {
    this._content = content;
    this._type = type;
  }
  get content() {
    return this._content;
  }
  get mimeType() {
    return void 0;
  }
  get type() {
    return this._type;
  }
}
CompositeMetadata$1.ReservedMimeTypeEntry = ReservedMimeTypeEntry;
class WellKnownMimeTypeEntry {
  constructor(content, type) {
    this._content = content;
    this._type = type;
  }
  get content() {
    return this._content;
  }
  get mimeType() {
    return this._type.string;
  }
  get type() {
    return this._type;
  }
}
CompositeMetadata$1.WellKnownMimeTypeEntry = WellKnownMimeTypeEntry;
function decodeMimeIdFromMimeBuffer(mimeBuffer) {
  if (!isWellKnownMimeType(mimeBuffer)) {
    return _WellKnownMimeType.UNPARSEABLE_MIME_TYPE.identifier;
  }
  return mimeBuffer.readInt8() & STREAM_METADATA_LENGTH_MASK;
}
function computeNextEntryIndex(currentEntryIndex, headerSlice, contentSlice) {
  return currentEntryIndex + headerSlice.byteLength + 3 + contentSlice.byteLength;
}
function isWellKnownMimeType(header) {
  return header.byteLength === 1;
}
const STREAM_METADATA_KNOWN_MASK = 128;
const STREAM_METADATA_LENGTH_MASK = 127;
function isAscii(buffer2, offset) {
  let isAscii2 = true;
  for (let i = offset, length = buffer2.length; i < length; i++) {
    if (buffer2[i] > 127) {
      isAscii2 = false;
      break;
    }
  }
  return isAscii2;
}
var RoutingMetadata$1 = {};
Object.defineProperty(RoutingMetadata$1, "__esModule", { value: true });
RoutingMetadata$1.encodeRoutes = encodeRoutes;
RoutingMetadata$1.encodeRoute = encodeRoute;
RoutingMetadata$1.decodeRoutes = decodeRoutes;
RoutingMetadata$1.RoutingMetadata = void 0;
var _LiteBuffer$1 = LiteBuffer$1;
var _RSocketBufferUtils$1 = RSocketBufferUtils;
class RoutingMetadata {
  constructor(buffer2) {
    this._buffer = buffer2;
  }
  iterator() {
    return decodeRoutes(this._buffer);
  }
  [Symbol.iterator]() {
    return decodeRoutes(this._buffer);
  }
}
RoutingMetadata$1.RoutingMetadata = RoutingMetadata;
function encodeRoutes(...routes) {
  if (routes.length < 1) {
    throw new Error("routes should be non empty array");
  }
  return _LiteBuffer$1.LiteBuffer.concat(routes.map((route) => encodeRoute(route)));
}
function encodeRoute(route) {
  const encodedRoute = (0, _RSocketBufferUtils$1.toBuffer)(route, "utf8");
  if (encodedRoute.length > 255) {
    throw new Error(`route length should fit into unsigned byte length but the given one is ${encodedRoute.length}`);
  }
  const encodedLength = (0, _RSocketBufferUtils$1.createBuffer)(1);
  encodedLength.writeUInt8(encodedRoute.length);
  return _LiteBuffer$1.LiteBuffer.concat([encodedLength, encodedRoute]);
}
function* decodeRoutes(routeMetadataBuffer) {
  const length = routeMetadataBuffer.byteLength;
  let offset = 0;
  while (offset < length) {
    const routeLength = routeMetadataBuffer.readUInt8(offset++);
    if (offset + routeLength > length) {
      throw new Error(`Malformed RouteMetadata. Offset(${offset}) + RouteLength(${routeLength}) is greater than TotalLength`);
    }
    const route = routeMetadataBuffer.toString("utf8", offset, offset + routeLength);
    offset += routeLength;
    yield route;
  }
}
var AuthMetadata = {};
Object.defineProperty(AuthMetadata, "__esModule", { value: true });
AuthMetadata.encodeWellKnownAuthMetadata = encodeWellKnownAuthMetadata;
AuthMetadata.encodeCustomAuthMetadata = encodeCustomAuthMetadata;
AuthMetadata.encodeSimpleAuthMetadata = encodeSimpleAuthMetadata;
AuthMetadata.encodeBearerAuthMetadata = encodeBearerAuthMetadata;
AuthMetadata.decodeAuthMetadata = decodeAuthMetadata;
AuthMetadata.decodeSimpleAuthPayload = decodeSimpleAuthPayload;
var _LiteBuffer = LiteBuffer$1;
var _RSocketBufferUtils = RSocketBufferUtils;
var _WellKnownAuthType = _interopRequireWildcard(WellKnownAuthType$1);
function _getRequireWildcardCache() {
  if (typeof WeakMap !== "function")
    return null;
  var cache = /* @__PURE__ */ new WeakMap();
  _getRequireWildcardCache = function() {
    return cache;
  };
  return cache;
}
function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
    return { default: obj };
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
const authTypeIdBytesLength = 1;
const customAuthTypeBytesLength = 1;
const usernameLengthBytesLength = 2;
const streamMetadataKnownMask = 128;
const streamMetadataLengthMask = 127;
function encodeWellKnownAuthMetadata(authType, authPayloadBuffer) {
  if (authType === _WellKnownAuthType.UNPARSEABLE_AUTH_TYPE || authType === _WellKnownAuthType.UNKNOWN_RESERVED_AUTH_TYPE) {
    throw new Error(`Illegal WellKnownAuthType[${authType.toString()}]. Only allowed AuthType should be used`);
  }
  const buffer2 = (0, _RSocketBufferUtils.createBuffer)(authTypeIdBytesLength);
  buffer2.writeUInt8(authType.identifier | streamMetadataKnownMask);
  return _LiteBuffer.LiteBuffer.concat([buffer2, authPayloadBuffer]);
}
function encodeCustomAuthMetadata(customAuthType, authPayloadBuffer) {
  const customAuthTypeBuffer = (0, _RSocketBufferUtils.toBuffer)(customAuthType);
  if (customAuthTypeBuffer.byteLength !== customAuthType.length) {
    throw new Error("Custom auth type must be US_ASCII characters only");
  }
  if (customAuthTypeBuffer.byteLength < 1 || customAuthTypeBuffer.byteLength > 128) {
    throw new Error("Custom auth type must have a strictly positive length that fits on 7 unsigned bits, ie 1-128");
  }
  const buffer2 = (0, _RSocketBufferUtils.createBuffer)(customAuthTypeBytesLength + customAuthTypeBuffer.byteLength);
  buffer2.writeUInt8(customAuthTypeBuffer.byteLength - 1);
  buffer2.write(customAuthType, customAuthTypeBytesLength);
  return _LiteBuffer.LiteBuffer.concat([buffer2, authPayloadBuffer]);
}
function encodeSimpleAuthMetadata(username, password) {
  const usernameBuffer = (0, _RSocketBufferUtils.toBuffer)(username);
  const passwordBuffer = (0, _RSocketBufferUtils.toBuffer)(password);
  const usernameLength = usernameBuffer.byteLength;
  if (usernameLength > 65535) {
    throw new Error(`Username should be shorter than or equal to 65535 bytes length in UTF-8 encoding but the given was ${usernameLength}`);
  }
  const capacity = authTypeIdBytesLength + usernameLengthBytesLength;
  const buffer2 = (0, _RSocketBufferUtils.createBuffer)(capacity);
  buffer2.writeUInt8(_WellKnownAuthType.SIMPLE.identifier | streamMetadataKnownMask);
  buffer2.writeUInt16BE(usernameLength, 1);
  return _LiteBuffer.LiteBuffer.concat([
    buffer2,
    usernameBuffer,
    passwordBuffer
  ]);
}
function encodeBearerAuthMetadata(token) {
  const tokenBuffer = (0, _RSocketBufferUtils.toBuffer)(token);
  const buffer2 = (0, _RSocketBufferUtils.createBuffer)(authTypeIdBytesLength);
  buffer2.writeUInt8(_WellKnownAuthType.BEARER.identifier | streamMetadataKnownMask);
  return _LiteBuffer.LiteBuffer.concat([buffer2, tokenBuffer]);
}
function decodeAuthMetadata(metadata) {
  if (metadata.byteLength < 1) {
    throw new Error("Unable to decode Auth metadata. Not enough readable bytes");
  }
  const lengthOrId = metadata.readUInt8();
  const normalizedId = lengthOrId & streamMetadataLengthMask;
  if (normalizedId !== lengthOrId) {
    const authType = _WellKnownAuthType.default.fromIdentifier(normalizedId);
    return {
      payload: metadata.slice(1),
      type: {
        identifier: authType.identifier,
        string: authType.string
      }
    };
  } else {
    const realLength = lengthOrId + 1;
    if (metadata.byteLength < realLength + customAuthTypeBytesLength) {
      throw new Error("Unable to decode custom Auth type. Malformed length or auth type string");
    }
    const customAuthTypeString = metadata.toString("utf8", customAuthTypeBytesLength, customAuthTypeBytesLength + realLength);
    const payload = metadata.slice(realLength + customAuthTypeBytesLength);
    return {
      payload,
      type: {
        identifier: _WellKnownAuthType.UNPARSEABLE_AUTH_TYPE.identifier,
        string: customAuthTypeString
      }
    };
  }
}
function decodeSimpleAuthPayload(authPayload) {
  if (authPayload.byteLength < usernameLengthBytesLength) {
    throw new Error("Unable to decode Simple Auth Payload. Not enough readable bytes");
  }
  const usernameLength = authPayload.readUInt16BE();
  if (authPayload.byteLength < usernameLength + usernameLengthBytesLength) {
    throw new Error("Unable to decode Simple Auth Payload. Not enough readable bytes");
  }
  const username = authPayload.slice(usernameLengthBytesLength, usernameLengthBytesLength + usernameLength);
  const password = authPayload.slice(usernameLengthBytesLength + usernameLength);
  return { password, username };
}
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  Object.defineProperty(exports, "RSocketClient", {
    enumerable: true,
    get: function() {
      return _RSocketClient.default;
    }
  });
  Object.defineProperty(exports, "RSocketServer", {
    enumerable: true,
    get: function() {
      return _RSocketServer.default;
    }
  });
  Object.defineProperty(exports, "RSocketResumableTransport", {
    enumerable: true,
    get: function() {
      return _RSocketResumableTransport.default;
    }
  });
  Object.defineProperty(exports, "WellKnownMimeType", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.default;
    }
  });
  Object.defineProperty(exports, "UNPARSEABLE_MIME_TYPE", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.UNPARSEABLE_MIME_TYPE;
    }
  });
  Object.defineProperty(exports, "UNKNOWN_RESERVED_MIME_TYPE", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.UNKNOWN_RESERVED_MIME_TYPE;
    }
  });
  Object.defineProperty(exports, "APPLICATION_AVRO", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_AVRO;
    }
  });
  Object.defineProperty(exports, "APPLICATION_CBOR", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_CBOR;
    }
  });
  Object.defineProperty(exports, "APPLICATION_GRAPHQL", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_GRAPHQL;
    }
  });
  Object.defineProperty(exports, "APPLICATION_GZIP", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_GZIP;
    }
  });
  Object.defineProperty(exports, "APPLICATION_JAVASCRIPT", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_JAVASCRIPT;
    }
  });
  Object.defineProperty(exports, "APPLICATION_JSON", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_JSON;
    }
  });
  Object.defineProperty(exports, "APPLICATION_OCTET_STREAM", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_OCTET_STREAM;
    }
  });
  Object.defineProperty(exports, "APPLICATION_PDF", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_PDF;
    }
  });
  Object.defineProperty(exports, "APPLICATION_THRIFT", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_THRIFT;
    }
  });
  Object.defineProperty(exports, "APPLICATION_PROTOBUF", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_PROTOBUF;
    }
  });
  Object.defineProperty(exports, "APPLICATION_XML", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_XML;
    }
  });
  Object.defineProperty(exports, "APPLICATION_ZIP", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_ZIP;
    }
  });
  Object.defineProperty(exports, "AUDIO_AAC", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.AUDIO_AAC;
    }
  });
  Object.defineProperty(exports, "AUDIO_MP3", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.AUDIO_MP3;
    }
  });
  Object.defineProperty(exports, "AUDIO_MP4", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.AUDIO_MP4;
    }
  });
  Object.defineProperty(exports, "AUDIO_MPEG3", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.AUDIO_MPEG3;
    }
  });
  Object.defineProperty(exports, "AUDIO_MPEG", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.AUDIO_MPEG;
    }
  });
  Object.defineProperty(exports, "AUDIO_OGG", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.AUDIO_OGG;
    }
  });
  Object.defineProperty(exports, "AUDIO_OPUS", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.AUDIO_OPUS;
    }
  });
  Object.defineProperty(exports, "AUDIO_VORBIS", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.AUDIO_VORBIS;
    }
  });
  Object.defineProperty(exports, "IMAGE_BMP", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_BMP;
    }
  });
  Object.defineProperty(exports, "IMAGE_GIG", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_GIG;
    }
  });
  Object.defineProperty(exports, "IMAGE_HEIC_SEQUENCE", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_HEIC_SEQUENCE;
    }
  });
  Object.defineProperty(exports, "IMAGE_HEIC", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_HEIC;
    }
  });
  Object.defineProperty(exports, "IMAGE_HEIF_SEQUENCE", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_HEIF_SEQUENCE;
    }
  });
  Object.defineProperty(exports, "IMAGE_HEIF", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_HEIF;
    }
  });
  Object.defineProperty(exports, "IMAGE_JPEG", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_JPEG;
    }
  });
  Object.defineProperty(exports, "IMAGE_PNG", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_PNG;
    }
  });
  Object.defineProperty(exports, "IMAGE_TIFF", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.IMAGE_TIFF;
    }
  });
  Object.defineProperty(exports, "MULTIPART_MIXED", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.MULTIPART_MIXED;
    }
  });
  Object.defineProperty(exports, "TEXT_CSS", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.TEXT_CSS;
    }
  });
  Object.defineProperty(exports, "TEXT_CSV", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.TEXT_CSV;
    }
  });
  Object.defineProperty(exports, "TEXT_HTML", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.TEXT_HTML;
    }
  });
  Object.defineProperty(exports, "TEXT_PLAIN", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.TEXT_PLAIN;
    }
  });
  Object.defineProperty(exports, "TEXT_XML", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.TEXT_XML;
    }
  });
  Object.defineProperty(exports, "VIDEO_H264", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.VIDEO_H264;
    }
  });
  Object.defineProperty(exports, "VIDEO_H265", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.VIDEO_H265;
    }
  });
  Object.defineProperty(exports, "VIDEO_VP8", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.VIDEO_VP8;
    }
  });
  Object.defineProperty(exports, "APPLICATION_HESSIAN", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_HESSIAN;
    }
  });
  Object.defineProperty(exports, "APPLICATION_JAVA_OBJECT", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_JAVA_OBJECT;
    }
  });
  Object.defineProperty(exports, "APPLICATION_CLOUDEVENTS_JSON", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.APPLICATION_CLOUDEVENTS_JSON;
    }
  });
  Object.defineProperty(exports, "MESSAGE_RSOCKET_MIMETYPE", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.MESSAGE_RSOCKET_MIMETYPE;
    }
  });
  Object.defineProperty(exports, "MESSAGE_RSOCKET_ACCEPT_MIMETYPES", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.MESSAGE_RSOCKET_ACCEPT_MIMETYPES;
    }
  });
  Object.defineProperty(exports, "MESSAGE_RSOCKET_AUTHENTICATION", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.MESSAGE_RSOCKET_AUTHENTICATION;
    }
  });
  Object.defineProperty(exports, "MESSAGE_RSOCKET_TRACING_ZIPKIN", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.MESSAGE_RSOCKET_TRACING_ZIPKIN;
    }
  });
  Object.defineProperty(exports, "MESSAGE_RSOCKET_ROUTING", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.MESSAGE_RSOCKET_ROUTING;
    }
  });
  Object.defineProperty(exports, "MESSAGE_RSOCKET_COMPOSITE_METADATA", {
    enumerable: true,
    get: function() {
      return _WellKnownMimeType2.MESSAGE_RSOCKET_COMPOSITE_METADATA;
    }
  });
  Object.defineProperty(exports, "WellKnownAuthType", {
    enumerable: true,
    get: function() {
      return _WellKnownAuthType2.default;
    }
  });
  Object.defineProperty(exports, "UNPARSEABLE_AUTH_TYPE", {
    enumerable: true,
    get: function() {
      return _WellKnownAuthType2.UNPARSEABLE_AUTH_TYPE;
    }
  });
  Object.defineProperty(exports, "UNKNOWN_RESERVED_AUTH_TYPE", {
    enumerable: true,
    get: function() {
      return _WellKnownAuthType2.UNKNOWN_RESERVED_AUTH_TYPE;
    }
  });
  Object.defineProperty(exports, "SIMPLE", {
    enumerable: true,
    get: function() {
      return _WellKnownAuthType2.SIMPLE;
    }
  });
  Object.defineProperty(exports, "BEARER", {
    enumerable: true,
    get: function() {
      return _WellKnownAuthType2.BEARER;
    }
  });
  Object.defineProperty(exports, "CONNECTION_STREAM_ID", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.CONNECTION_STREAM_ID;
    }
  });
  Object.defineProperty(exports, "ERROR_CODES", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.ERROR_CODES;
    }
  });
  Object.defineProperty(exports, "ERROR_EXPLANATIONS", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.ERROR_EXPLANATIONS;
    }
  });
  Object.defineProperty(exports, "FLAGS_MASK", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.FLAGS_MASK;
    }
  });
  Object.defineProperty(exports, "FLAGS", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.FLAGS;
    }
  });
  Object.defineProperty(exports, "FRAME_TYPE_OFFFSET", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.FRAME_TYPE_OFFFSET;
    }
  });
  Object.defineProperty(exports, "FRAME_TYPES", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.FRAME_TYPES;
    }
  });
  Object.defineProperty(exports, "MAX_CODE", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.MAX_CODE;
    }
  });
  Object.defineProperty(exports, "MAX_KEEPALIVE", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.MAX_KEEPALIVE;
    }
  });
  Object.defineProperty(exports, "MAX_LIFETIME", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.MAX_LIFETIME;
    }
  });
  Object.defineProperty(exports, "MAX_MIME_LENGTH", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.MAX_MIME_LENGTH;
    }
  });
  Object.defineProperty(exports, "MAX_RESUME_LENGTH", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.MAX_RESUME_LENGTH;
    }
  });
  Object.defineProperty(exports, "MAX_STREAM_ID", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.MAX_STREAM_ID;
    }
  });
  Object.defineProperty(exports, "MAX_VERSION", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.MAX_VERSION;
    }
  });
  Object.defineProperty(exports, "createErrorFromFrame", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.createErrorFromFrame;
    }
  });
  Object.defineProperty(exports, "getErrorCodeExplanation", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.getErrorCodeExplanation;
    }
  });
  Object.defineProperty(exports, "isComplete", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.isComplete;
    }
  });
  Object.defineProperty(exports, "isIgnore", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.isIgnore;
    }
  });
  Object.defineProperty(exports, "isLease", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.isLease;
    }
  });
  Object.defineProperty(exports, "isMetadata", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.isMetadata;
    }
  });
  Object.defineProperty(exports, "isNext", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.isNext;
    }
  });
  Object.defineProperty(exports, "isRespond", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.isRespond;
    }
  });
  Object.defineProperty(exports, "isResumeEnable", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.isResumeEnable;
    }
  });
  Object.defineProperty(exports, "printFrame", {
    enumerable: true,
    get: function() {
      return _RSocketFrame2.printFrame;
    }
  });
  Object.defineProperty(exports, "deserializeFrame", {
    enumerable: true,
    get: function() {
      return _RSocketBinaryFraming2.deserializeFrame;
    }
  });
  Object.defineProperty(exports, "deserializeFrameWithLength", {
    enumerable: true,
    get: function() {
      return _RSocketBinaryFraming2.deserializeFrameWithLength;
    }
  });
  Object.defineProperty(exports, "deserializeFrames", {
    enumerable: true,
    get: function() {
      return _RSocketBinaryFraming2.deserializeFrames;
    }
  });
  Object.defineProperty(exports, "serializeFrame", {
    enumerable: true,
    get: function() {
      return _RSocketBinaryFraming2.serializeFrame;
    }
  });
  Object.defineProperty(exports, "serializeFrameWithLength", {
    enumerable: true,
    get: function() {
      return _RSocketBinaryFraming2.serializeFrameWithLength;
    }
  });
  Object.defineProperty(exports, "byteLength", {
    enumerable: true,
    get: function() {
      return _RSocketBufferUtils2.byteLength;
    }
  });
  Object.defineProperty(exports, "createBuffer", {
    enumerable: true,
    get: function() {
      return _RSocketBufferUtils2.createBuffer;
    }
  });
  Object.defineProperty(exports, "readUInt24BE", {
    enumerable: true,
    get: function() {
      return _RSocketBufferUtils2.readUInt24BE;
    }
  });
  Object.defineProperty(exports, "toBuffer", {
    enumerable: true,
    get: function() {
      return _RSocketBufferUtils2.toBuffer;
    }
  });
  Object.defineProperty(exports, "writeUInt24BE", {
    enumerable: true,
    get: function() {
      return _RSocketBufferUtils2.writeUInt24BE;
    }
  });
  Object.defineProperty(exports, "BufferEncoders", {
    enumerable: true,
    get: function() {
      return _RSocketEncoding2.BufferEncoders;
    }
  });
  Object.defineProperty(exports, "BufferEncoder", {
    enumerable: true,
    get: function() {
      return _RSocketEncoding2.BufferEncoder;
    }
  });
  Object.defineProperty(exports, "Utf8Encoders", {
    enumerable: true,
    get: function() {
      return _RSocketEncoding2.Utf8Encoders;
    }
  });
  Object.defineProperty(exports, "UTF8Encoder", {
    enumerable: true,
    get: function() {
      return _RSocketEncoding2.UTF8Encoder;
    }
  });
  Object.defineProperty(exports, "IdentitySerializer", {
    enumerable: true,
    get: function() {
      return _RSocketSerialization2.IdentitySerializer;
    }
  });
  Object.defineProperty(exports, "IdentitySerializers", {
    enumerable: true,
    get: function() {
      return _RSocketSerialization2.IdentitySerializers;
    }
  });
  Object.defineProperty(exports, "JsonSerializer", {
    enumerable: true,
    get: function() {
      return _RSocketSerialization2.JsonSerializer;
    }
  });
  Object.defineProperty(exports, "JsonSerializers", {
    enumerable: true,
    get: function() {
      return _RSocketSerialization2.JsonSerializers;
    }
  });
  Object.defineProperty(exports, "Leases", {
    enumerable: true,
    get: function() {
      return _RSocketLease2.Leases;
    }
  });
  Object.defineProperty(exports, "Lease", {
    enumerable: true,
    get: function() {
      return _RSocketLease2.Lease;
    }
  });
  Object.defineProperty(exports, "CompositeMetadata", {
    enumerable: true,
    get: function() {
      return _CompositeMetadata.CompositeMetadata;
    }
  });
  Object.defineProperty(exports, "ReservedMimeTypeEntry", {
    enumerable: true,
    get: function() {
      return _CompositeMetadata.ReservedMimeTypeEntry;
    }
  });
  Object.defineProperty(exports, "WellKnownMimeTypeEntry", {
    enumerable: true,
    get: function() {
      return _CompositeMetadata.WellKnownMimeTypeEntry;
    }
  });
  Object.defineProperty(exports, "ExplicitMimeTimeEntry", {
    enumerable: true,
    get: function() {
      return _CompositeMetadata.ExplicitMimeTimeEntry;
    }
  });
  Object.defineProperty(exports, "encodeAndAddCustomMetadata", {
    enumerable: true,
    get: function() {
      return _CompositeMetadata.encodeAndAddCustomMetadata;
    }
  });
  Object.defineProperty(exports, "encodeAndAddWellKnownMetadata", {
    enumerable: true,
    get: function() {
      return _CompositeMetadata.encodeAndAddWellKnownMetadata;
    }
  });
  Object.defineProperty(exports, "encodeCompositeMetadata", {
    enumerable: true,
    get: function() {
      return _CompositeMetadata.encodeCompositeMetadata;
    }
  });
  Object.defineProperty(exports, "decodeCompositeMetadata", {
    enumerable: true,
    get: function() {
      return _CompositeMetadata.decodeCompositeMetadata;
    }
  });
  Object.defineProperty(exports, "RoutingMetadata", {
    enumerable: true,
    get: function() {
      return _RoutingMetadata.RoutingMetadata;
    }
  });
  Object.defineProperty(exports, "encodeRoute", {
    enumerable: true,
    get: function() {
      return _RoutingMetadata.encodeRoute;
    }
  });
  Object.defineProperty(exports, "encodeRoutes", {
    enumerable: true,
    get: function() {
      return _RoutingMetadata.encodeRoutes;
    }
  });
  Object.defineProperty(exports, "decodeRoutes", {
    enumerable: true,
    get: function() {
      return _RoutingMetadata.decodeRoutes;
    }
  });
  Object.defineProperty(exports, "encodeSimpleAuthMetadata", {
    enumerable: true,
    get: function() {
      return _AuthMetadata.encodeSimpleAuthMetadata;
    }
  });
  Object.defineProperty(exports, "encodeBearerAuthMetadata", {
    enumerable: true,
    get: function() {
      return _AuthMetadata.encodeBearerAuthMetadata;
    }
  });
  Object.defineProperty(exports, "encodeWellKnownAuthMetadata", {
    enumerable: true,
    get: function() {
      return _AuthMetadata.encodeWellKnownAuthMetadata;
    }
  });
  Object.defineProperty(exports, "encodeCustomAuthMetadata", {
    enumerable: true,
    get: function() {
      return _AuthMetadata.encodeCustomAuthMetadata;
    }
  });
  Object.defineProperty(exports, "decodeSimpleAuthPayload", {
    enumerable: true,
    get: function() {
      return _AuthMetadata.decodeSimpleAuthPayload;
    }
  });
  Object.defineProperty(exports, "decodeAuthMetadata", {
    enumerable: true,
    get: function() {
      return _AuthMetadata.decodeAuthMetadata;
    }
  });
  var _RSocketClient = _interopRequireDefault2(RSocketClient$1);
  var _RSocketServer = _interopRequireDefault2(RSocketServer$1);
  var _RSocketResumableTransport = _interopRequireDefault2(RSocketResumableTransport$1);
  var _WellKnownMimeType2 = _interopRequireWildcard2(WellKnownMimeType$1);
  var _WellKnownAuthType2 = _interopRequireWildcard2(WellKnownAuthType$1);
  var _RSocketFrame2 = RSocketFrame;
  var _RSocketBinaryFraming2 = RSocketBinaryFraming;
  var _RSocketBufferUtils2 = RSocketBufferUtils;
  var _RSocketEncoding2 = RSocketEncoding;
  var _RSocketSerialization2 = RSocketSerialization;
  var _RSocketLease2 = RSocketLease;
  var _CompositeMetadata = CompositeMetadata$1;
  var _RoutingMetadata = RoutingMetadata$1;
  var _AuthMetadata = AuthMetadata;
  function _getRequireWildcardCache2() {
    if (typeof WeakMap !== "function")
      return null;
    var cache = /* @__PURE__ */ new WeakMap();
    _getRequireWildcardCache2 = function() {
      return cache;
    };
    return cache;
  }
  function _interopRequireWildcard2(obj) {
    if (obj && obj.__esModule) {
      return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
      return { default: obj };
    }
    var cache = _getRequireWildcardCache2();
    if (cache && cache.has(obj)) {
      return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
        if (desc && (desc.get || desc.set)) {
          Object.defineProperty(newObj, key, desc);
        } else {
          newObj[key] = obj[key];
        }
      }
    }
    newObj.default = obj;
    if (cache) {
      cache.set(obj, newObj);
    }
    return newObj;
  }
  function _interopRequireDefault2(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
})(build$3);
var build = {};
var RSocketWebSocketClient$1 = {};
Object.defineProperty(RSocketWebSocketClient$1, "__esModule", { value: true });
RSocketWebSocketClient$1.default = void 0;
var _rsocketFlowable = build$2;
var _rsocketCore = build$3;
var _rsocketTypes = build$1;
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
class RSocketWebSocketClient {
  constructor(options, encoders) {
    _defineProperty(this, "_handleClosed", (e) => {
      this._close(new Error(e.reason || "RSocketWebSocketClient: Socket closed unexpectedly."));
    });
    _defineProperty(this, "_handleError", (e) => {
      this._close(e.error);
    });
    _defineProperty(this, "_handleOpened", () => {
      this._setConnectionStatus(_rsocketTypes.CONNECTION_STATUS.CONNECTED);
    });
    _defineProperty(this, "_handleMessage", (message) => {
      try {
        const frame = this._readFrame(message);
        this._receivers.forEach((subscriber) => subscriber.onNext(frame));
      } catch (error) {
        this._close(error);
      }
    });
    this._encoders = encoders;
    this._options = options;
    this._receivers = /* @__PURE__ */ new Set();
    this._senders = /* @__PURE__ */ new Set();
    this._socket = null;
    this._status = _rsocketTypes.CONNECTION_STATUS.NOT_CONNECTED;
    this._statusSubscribers = /* @__PURE__ */ new Set();
  }
  close() {
    this._close();
  }
  connect() {
    if (this._status.kind !== "NOT_CONNECTED") {
      throw new Error("RSocketWebSocketClient: Cannot connect(), a connection is already established.");
    }
    this._setConnectionStatus(_rsocketTypes.CONNECTION_STATUS.CONNECTING);
    const wsCreator = this._options.wsCreator;
    const url = this._options.url;
    this._socket = wsCreator ? wsCreator(url) : new WebSocket(url);
    const socket = this._socket;
    socket.binaryType = "arraybuffer";
    socket.addEventListener("close", this._handleClosed);
    socket.addEventListener("error", this._handleError);
    socket.addEventListener("open", this._handleOpened);
    socket.addEventListener("message", this._handleMessage);
  }
  connectionStatus() {
    return new _rsocketFlowable.Flowable((subscriber) => {
      subscriber.onSubscribe({
        cancel: () => {
          this._statusSubscribers.delete(subscriber);
        },
        request: () => {
          this._statusSubscribers.add(subscriber);
          subscriber.onNext(this._status);
        }
      });
    });
  }
  receive() {
    return new _rsocketFlowable.Flowable((subject) => {
      subject.onSubscribe({
        cancel: () => {
          this._receivers.delete(subject);
        },
        request: () => {
          this._receivers.add(subject);
        }
      });
    });
  }
  sendOne(frame) {
    this._writeFrame(frame);
  }
  send(frames) {
    let subscription;
    frames.subscribe({
      onComplete: () => {
        subscription && this._senders.delete(subscription);
      },
      onError: (error) => {
        subscription && this._senders.delete(subscription);
        this._close(error);
      },
      onNext: (frame) => this._writeFrame(frame),
      onSubscribe: (_subscription) => {
        subscription = _subscription;
        this._senders.add(subscription);
        subscription.request(Number.MAX_SAFE_INTEGER);
      }
    });
  }
  _close(error) {
    if (this._status.kind === "CLOSED" || this._status.kind === "ERROR") {
      return;
    }
    const status = error ? { error, kind: "ERROR" } : _rsocketTypes.CONNECTION_STATUS.CLOSED;
    this._setConnectionStatus(status);
    this._receivers.forEach((subscriber) => {
      if (error) {
        subscriber.onError(error);
      } else {
        subscriber.onComplete();
      }
    });
    this._receivers.clear();
    this._senders.forEach((subscription) => subscription.cancel());
    this._senders.clear();
    const socket = this._socket;
    if (socket) {
      socket.removeEventListener("close", this._handleClosed);
      socket.removeEventListener("error", this._handleError);
      socket.removeEventListener("open", this._handleOpened);
      socket.removeEventListener("message", this._handleMessage);
      socket.close();
      this._socket = null;
    }
  }
  _setConnectionStatus(status) {
    this._status = status;
    this._statusSubscribers.forEach((subscriber) => subscriber.onNext(status));
  }
  _readFrame(message) {
    const buffer2 = (0, _rsocketCore.toBuffer)(message.data);
    const frame = this._options.lengthPrefixedFrames ? (0, _rsocketCore.deserializeFrameWithLength)(buffer2, this._encoders) : (0, _rsocketCore.deserializeFrame)(buffer2, this._encoders);
    return frame;
  }
  _writeFrame(frame) {
    try {
      if (false)
        ;
      const buffer2 = this._options.lengthPrefixedFrames ? (0, _rsocketCore.serializeFrameWithLength)(frame, this._encoders) : (0, _rsocketCore.serializeFrame)(frame, this._encoders);
      if (!this._socket) {
        throw new Error("RSocketWebSocketClient: Cannot send frame, not connected.");
      }
      this._socket.send(buffer2);
    } catch (error) {
      this._close(error);
    }
  }
}
RSocketWebSocketClient$1.default = RSocketWebSocketClient;
Object.defineProperty(build, "__esModule", { value: true });
var default_1 = build.default = void 0;
var _RSocketWebSocketClient = _interopRequireDefault(RSocketWebSocketClient$1);
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
var _default = _RSocketWebSocketClient.default;
default_1 = build.default = _default;
var ClientType;
(function(ClientType2) {
  ClientType2["Browser"] = "browser";
  ClientType2["Android"] = "android";
  ClientType2["IOS"] = "ios";
  ClientType2["API"] = "api";
})(ClientType || (ClientType = {}));
class AsgardClientConfig {
  constructor(url, clientId = "", token = "", type = ClientType.Browser, keepAlive = 6e4, lifetime = 18e4) {
    __publicField(this, "funConnect", null);
    __publicField(this, "clientType", "");
    __publicField(this, "token", "");
    __publicField(this, "clientId", "");
    __publicField(this, "keepAlive");
    __publicField(this, "lifetime");
    __publicField(this, "url", "ws://localhost");
    __publicField(this, "_listener", null);
    this.keepAlive = keepAlive;
    this.lifetime = lifetime;
    this.clientId = clientId;
    this.token = token;
    this.url = url;
    this.clientType = type;
  }
  connectionConfig(config2) {
    return this;
  }
  resumeListener(listener) {
    this._listener = listener;
    return this;
  }
}
__publicField(AsgardClientConfig, "dataMimeType", build$3.APPLICATION_JSON.string);
__publicField(AsgardClientConfig, "metadataMimeType", build$3.MESSAGE_RSOCKET_COMPOSITE_METADATA.string);
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      if (Object.prototype.hasOwnProperty.call(b2, p))
        d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
          return t;
        if (y = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m)
    return m.call(o);
  if (o && typeof o.length === "number")
    return {
      next: function() {
        if (o && i >= o.length)
          o = void 0;
        return { value: o && o[i++], done: !o };
      }
    };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m)
    return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
      ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"]))
        m.call(i);
    } finally {
      if (e)
        throw e.error;
    }
  }
  return ar;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function verb(n) {
    if (g[n])
      i[n] = function(v) {
        return new Promise(function(a, b) {
          q.push([n, v, a, b]) > 1 || resume(n, v);
        });
      };
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length)
      resume(q[0][0], q[0][1]);
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator)
    throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function(v) {
      return new Promise(function(resolve, reject) {
        v = o[n](v), settle(resolve, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve, reject, d, v) {
    Promise.resolve(v).then(function(v2) {
      resolve({ value: v2, done: d });
    }, reject);
  }
}
function isFunction(value) {
  return typeof value === "function";
}
function createErrorClass(createImpl) {
  var _super = function(instance) {
    Error.call(instance);
    instance.stack = new Error().stack;
  };
  var ctorFunc = createImpl(_super);
  ctorFunc.prototype = Object.create(Error.prototype);
  ctorFunc.prototype.constructor = ctorFunc;
  return ctorFunc;
}
var UnsubscriptionError = createErrorClass(function(_super) {
  return function UnsubscriptionErrorImpl(errors) {
    _super(this);
    this.message = errors ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function(err, i) {
      return i + 1 + ") " + err.toString();
    }).join("\n  ") : "";
    this.name = "UnsubscriptionError";
    this.errors = errors;
  };
});
function arrRemove(arr, item) {
  if (arr) {
    var index = arr.indexOf(item);
    0 <= index && arr.splice(index, 1);
  }
}
var Subscription = function() {
  function Subscription2(initialTeardown) {
    this.initialTeardown = initialTeardown;
    this.closed = false;
    this._parentage = null;
    this._teardowns = null;
  }
  Subscription2.prototype.unsubscribe = function() {
    var e_1, _a, e_2, _b;
    var errors;
    if (!this.closed) {
      this.closed = true;
      var _parentage = this._parentage;
      if (_parentage) {
        this._parentage = null;
        if (Array.isArray(_parentage)) {
          try {
            for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
              var parent_1 = _parentage_1_1.value;
              parent_1.remove(this);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return))
                _a.call(_parentage_1);
            } finally {
              if (e_1)
                throw e_1.error;
            }
          }
        } else {
          _parentage.remove(this);
        }
      }
      var initialTeardown = this.initialTeardown;
      if (isFunction(initialTeardown)) {
        try {
          initialTeardown();
        } catch (e) {
          errors = e instanceof UnsubscriptionError ? e.errors : [e];
        }
      }
      var _teardowns = this._teardowns;
      if (_teardowns) {
        this._teardowns = null;
        try {
          for (var _teardowns_1 = __values(_teardowns), _teardowns_1_1 = _teardowns_1.next(); !_teardowns_1_1.done; _teardowns_1_1 = _teardowns_1.next()) {
            var teardown_1 = _teardowns_1_1.value;
            try {
              execTeardown(teardown_1);
            } catch (err) {
              errors = errors !== null && errors !== void 0 ? errors : [];
              if (err instanceof UnsubscriptionError) {
                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
              } else {
                errors.push(err);
              }
            }
          }
        } catch (e_2_1) {
          e_2 = { error: e_2_1 };
        } finally {
          try {
            if (_teardowns_1_1 && !_teardowns_1_1.done && (_b = _teardowns_1.return))
              _b.call(_teardowns_1);
          } finally {
            if (e_2)
              throw e_2.error;
          }
        }
      }
      if (errors) {
        throw new UnsubscriptionError(errors);
      }
    }
  };
  Subscription2.prototype.add = function(teardown) {
    var _a;
    if (teardown && teardown !== this) {
      if (this.closed) {
        execTeardown(teardown);
      } else {
        if (teardown instanceof Subscription2) {
          if (teardown.closed || teardown._hasParent(this)) {
            return;
          }
          teardown._addParent(this);
        }
        (this._teardowns = (_a = this._teardowns) !== null && _a !== void 0 ? _a : []).push(teardown);
      }
    }
  };
  Subscription2.prototype._hasParent = function(parent) {
    var _parentage = this._parentage;
    return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
  };
  Subscription2.prototype._addParent = function(parent) {
    var _parentage = this._parentage;
    this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
  };
  Subscription2.prototype._removeParent = function(parent) {
    var _parentage = this._parentage;
    if (_parentage === parent) {
      this._parentage = null;
    } else if (Array.isArray(_parentage)) {
      arrRemove(_parentage, parent);
    }
  };
  Subscription2.prototype.remove = function(teardown) {
    var _teardowns = this._teardowns;
    _teardowns && arrRemove(_teardowns, teardown);
    if (teardown instanceof Subscription2) {
      teardown._removeParent(this);
    }
  };
  Subscription2.EMPTY = function() {
    var empty = new Subscription2();
    empty.closed = true;
    return empty;
  }();
  return Subscription2;
}();
var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
  return value instanceof Subscription || value && "closed" in value && isFunction(value.remove) && isFunction(value.add) && isFunction(value.unsubscribe);
}
function execTeardown(teardown) {
  if (isFunction(teardown)) {
    teardown();
  } else {
    teardown.unsubscribe();
  }
}
var config = {
  onUnhandledError: null,
  onStoppedNotification: null,
  Promise: void 0,
  useDeprecatedSynchronousErrorHandling: false,
  useDeprecatedNextContext: false
};
var timeoutProvider = {
  setTimeout: function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var delegate = timeoutProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) || setTimeout).apply(void 0, __spreadArray([], __read(args)));
  },
  clearTimeout: function(handle) {
    var delegate = timeoutProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
  },
  delegate: void 0
};
function reportUnhandledError(err) {
  timeoutProvider.setTimeout(function() {
    var onUnhandledError = config.onUnhandledError;
    if (onUnhandledError) {
      onUnhandledError(err);
    } else {
      throw err;
    }
  });
}
function noop() {
}
var COMPLETE_NOTIFICATION = function() {
  return createNotification("C", void 0, void 0);
}();
function errorNotification(error) {
  return createNotification("E", void 0, error);
}
function nextNotification(value) {
  return createNotification("N", value, void 0);
}
function createNotification(kind, value, error) {
  return {
    kind,
    value,
    error
  };
}
var context = null;
function errorContext(cb) {
  if (config.useDeprecatedSynchronousErrorHandling) {
    var isRoot = !context;
    if (isRoot) {
      context = { errorThrown: false, error: null };
    }
    cb();
    if (isRoot) {
      var _a = context, errorThrown = _a.errorThrown, error = _a.error;
      context = null;
      if (errorThrown) {
        throw error;
      }
    }
  } else {
    cb();
  }
}
var Subscriber = function(_super) {
  __extends(Subscriber2, _super);
  function Subscriber2(destination) {
    var _this = _super.call(this) || this;
    _this.isStopped = false;
    if (destination) {
      _this.destination = destination;
      if (isSubscription(destination)) {
        destination.add(_this);
      }
    } else {
      _this.destination = EMPTY_OBSERVER;
    }
    return _this;
  }
  Subscriber2.create = function(next, error, complete) {
    return new SafeSubscriber(next, error, complete);
  };
  Subscriber2.prototype.next = function(value) {
    if (this.isStopped) {
      handleStoppedNotification(nextNotification(value), this);
    } else {
      this._next(value);
    }
  };
  Subscriber2.prototype.error = function(err) {
    if (this.isStopped) {
      handleStoppedNotification(errorNotification(err), this);
    } else {
      this.isStopped = true;
      this._error(err);
    }
  };
  Subscriber2.prototype.complete = function() {
    if (this.isStopped) {
      handleStoppedNotification(COMPLETE_NOTIFICATION, this);
    } else {
      this.isStopped = true;
      this._complete();
    }
  };
  Subscriber2.prototype.unsubscribe = function() {
    if (!this.closed) {
      this.isStopped = true;
      _super.prototype.unsubscribe.call(this);
      this.destination = null;
    }
  };
  Subscriber2.prototype._next = function(value) {
    this.destination.next(value);
  };
  Subscriber2.prototype._error = function(err) {
    try {
      this.destination.error(err);
    } finally {
      this.unsubscribe();
    }
  };
  Subscriber2.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  };
  return Subscriber2;
}(Subscription);
var _bind = Function.prototype.bind;
function bind(fn, thisArg) {
  return _bind.call(fn, thisArg);
}
var ConsumerObserver = function() {
  function ConsumerObserver2(partialObserver) {
    this.partialObserver = partialObserver;
  }
  ConsumerObserver2.prototype.next = function(value) {
    var partialObserver = this.partialObserver;
    if (partialObserver.next) {
      try {
        partialObserver.next(value);
      } catch (error) {
        handleUnhandledError(error);
      }
    }
  };
  ConsumerObserver2.prototype.error = function(err) {
    var partialObserver = this.partialObserver;
    if (partialObserver.error) {
      try {
        partialObserver.error(err);
      } catch (error) {
        handleUnhandledError(error);
      }
    } else {
      handleUnhandledError(err);
    }
  };
  ConsumerObserver2.prototype.complete = function() {
    var partialObserver = this.partialObserver;
    if (partialObserver.complete) {
      try {
        partialObserver.complete();
      } catch (error) {
        handleUnhandledError(error);
      }
    }
  };
  return ConsumerObserver2;
}();
var SafeSubscriber = function(_super) {
  __extends(SafeSubscriber2, _super);
  function SafeSubscriber2(observerOrNext, error, complete) {
    var _this = _super.call(this) || this;
    var partialObserver;
    if (isFunction(observerOrNext) || !observerOrNext) {
      partialObserver = {
        next: observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : void 0,
        error: error !== null && error !== void 0 ? error : void 0,
        complete: complete !== null && complete !== void 0 ? complete : void 0
      };
    } else {
      var context_1;
      if (_this && config.useDeprecatedNextContext) {
        context_1 = Object.create(observerOrNext);
        context_1.unsubscribe = function() {
          return _this.unsubscribe();
        };
        partialObserver = {
          next: observerOrNext.next && bind(observerOrNext.next, context_1),
          error: observerOrNext.error && bind(observerOrNext.error, context_1),
          complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
        };
      } else {
        partialObserver = observerOrNext;
      }
    }
    _this.destination = new ConsumerObserver(partialObserver);
    return _this;
  }
  return SafeSubscriber2;
}(Subscriber);
function handleUnhandledError(error) {
  {
    reportUnhandledError(error);
  }
}
function defaultErrorHandler(err) {
  throw err;
}
function handleStoppedNotification(notification, subscriber) {
  var onStoppedNotification = config.onStoppedNotification;
  onStoppedNotification && timeoutProvider.setTimeout(function() {
    return onStoppedNotification(notification, subscriber);
  });
}
var EMPTY_OBSERVER = {
  closed: true,
  next: noop,
  error: defaultErrorHandler,
  complete: noop
};
var observable = function() {
  return typeof Symbol === "function" && Symbol.observable || "@@observable";
}();
function identity(x) {
  return x;
}
function pipeFromArray(fns) {
  if (fns.length === 0) {
    return identity;
  }
  if (fns.length === 1) {
    return fns[0];
  }
  return function piped(input) {
    return fns.reduce(function(prev, fn) {
      return fn(prev);
    }, input);
  };
}
var Observable = function() {
  function Observable2(subscribe) {
    if (subscribe) {
      this._subscribe = subscribe;
    }
  }
  Observable2.prototype.lift = function(operator) {
    var observable2 = new Observable2();
    observable2.source = this;
    observable2.operator = operator;
    return observable2;
  };
  Observable2.prototype.subscribe = function(observerOrNext, error, complete) {
    var _this = this;
    var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
    errorContext(function() {
      var _a = _this, operator = _a.operator, source = _a.source;
      subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
    });
    return subscriber;
  };
  Observable2.prototype._trySubscribe = function(sink) {
    try {
      return this._subscribe(sink);
    } catch (err) {
      sink.error(err);
    }
  };
  Observable2.prototype.forEach = function(next, promiseCtor) {
    var _this = this;
    promiseCtor = getPromiseCtor(promiseCtor);
    return new promiseCtor(function(resolve, reject) {
      var subscriber = new SafeSubscriber({
        next: function(value) {
          try {
            next(value);
          } catch (err) {
            reject(err);
            subscriber.unsubscribe();
          }
        },
        error: reject,
        complete: resolve
      });
      _this.subscribe(subscriber);
    });
  };
  Observable2.prototype._subscribe = function(subscriber) {
    var _a;
    return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
  };
  Observable2.prototype[observable] = function() {
    return this;
  };
  Observable2.prototype.pipe = function() {
    var operations = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      operations[_i] = arguments[_i];
    }
    return pipeFromArray(operations)(this);
  };
  Observable2.prototype.toPromise = function(promiseCtor) {
    var _this = this;
    promiseCtor = getPromiseCtor(promiseCtor);
    return new promiseCtor(function(resolve, reject) {
      var value;
      _this.subscribe(function(x) {
        return value = x;
      }, function(err) {
        return reject(err);
      }, function() {
        return resolve(value);
      });
    });
  };
  Observable2.create = function(subscribe) {
    return new Observable2(subscribe);
  };
  return Observable2;
}();
function getPromiseCtor(promiseCtor) {
  var _a;
  return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
  return value && isFunction(value.next) && isFunction(value.error) && isFunction(value.complete);
}
function isSubscriber(value) {
  return value && value instanceof Subscriber || isObserver(value) && isSubscription(value);
}
function hasLift(source) {
  return isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
  return function(source) {
    if (hasLift(source)) {
      return source.lift(function(liftedSource) {
        try {
          return init(liftedSource, this);
        } catch (err) {
          this.error(err);
        }
      });
    }
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
  return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
var OperatorSubscriber = function(_super) {
  __extends(OperatorSubscriber2, _super);
  function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
    var _this = _super.call(this, destination) || this;
    _this.onFinalize = onFinalize;
    _this.shouldUnsubscribe = shouldUnsubscribe;
    _this._next = onNext ? function(value) {
      try {
        onNext(value);
      } catch (err) {
        destination.error(err);
      }
    } : _super.prototype._next;
    _this._error = onError ? function(err) {
      try {
        onError(err);
      } catch (err2) {
        destination.error(err2);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._error;
    _this._complete = onComplete ? function() {
      try {
        onComplete();
      } catch (err) {
        destination.error(err);
      } finally {
        this.unsubscribe();
      }
    } : _super.prototype._complete;
    return _this;
  }
  OperatorSubscriber2.prototype.unsubscribe = function() {
    var _a;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var closed_1 = this.closed;
      _super.prototype.unsubscribe.call(this);
      !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
    }
  };
  return OperatorSubscriber2;
}(Subscriber);
var ObjectUnsubscribedError = createErrorClass(function(_super) {
  return function ObjectUnsubscribedErrorImpl() {
    _super(this);
    this.name = "ObjectUnsubscribedError";
    this.message = "object unsubscribed";
  };
});
var Subject = function(_super) {
  __extends(Subject2, _super);
  function Subject2() {
    var _this = _super.call(this) || this;
    _this.closed = false;
    _this.observers = [];
    _this.isStopped = false;
    _this.hasError = false;
    _this.thrownError = null;
    return _this;
  }
  Subject2.prototype.lift = function(operator) {
    var subject = new AnonymousSubject(this, this);
    subject.operator = operator;
    return subject;
  };
  Subject2.prototype._throwIfClosed = function() {
    if (this.closed) {
      throw new ObjectUnsubscribedError();
    }
  };
  Subject2.prototype.next = function(value) {
    var _this = this;
    errorContext(function() {
      var e_1, _a;
      _this._throwIfClosed();
      if (!_this.isStopped) {
        var copy = _this.observers.slice();
        try {
          for (var copy_1 = __values(copy), copy_1_1 = copy_1.next(); !copy_1_1.done; copy_1_1 = copy_1.next()) {
            var observer = copy_1_1.value;
            observer.next(value);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (copy_1_1 && !copy_1_1.done && (_a = copy_1.return))
              _a.call(copy_1);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
      }
    });
  };
  Subject2.prototype.error = function(err) {
    var _this = this;
    errorContext(function() {
      _this._throwIfClosed();
      if (!_this.isStopped) {
        _this.hasError = _this.isStopped = true;
        _this.thrownError = err;
        var observers = _this.observers;
        while (observers.length) {
          observers.shift().error(err);
        }
      }
    });
  };
  Subject2.prototype.complete = function() {
    var _this = this;
    errorContext(function() {
      _this._throwIfClosed();
      if (!_this.isStopped) {
        _this.isStopped = true;
        var observers = _this.observers;
        while (observers.length) {
          observers.shift().complete();
        }
      }
    });
  };
  Subject2.prototype.unsubscribe = function() {
    this.isStopped = this.closed = true;
    this.observers = null;
  };
  Object.defineProperty(Subject2.prototype, "observed", {
    get: function() {
      var _a;
      return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
    },
    enumerable: false,
    configurable: true
  });
  Subject2.prototype._trySubscribe = function(subscriber) {
    this._throwIfClosed();
    return _super.prototype._trySubscribe.call(this, subscriber);
  };
  Subject2.prototype._subscribe = function(subscriber) {
    this._throwIfClosed();
    this._checkFinalizedStatuses(subscriber);
    return this._innerSubscribe(subscriber);
  };
  Subject2.prototype._innerSubscribe = function(subscriber) {
    var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
    return hasError || isStopped ? EMPTY_SUBSCRIPTION : (observers.push(subscriber), new Subscription(function() {
      return arrRemove(observers, subscriber);
    }));
  };
  Subject2.prototype._checkFinalizedStatuses = function(subscriber) {
    var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
    if (hasError) {
      subscriber.error(thrownError);
    } else if (isStopped) {
      subscriber.complete();
    }
  };
  Subject2.prototype.asObservable = function() {
    var observable2 = new Observable();
    observable2.source = this;
    return observable2;
  };
  Subject2.create = function(destination, source) {
    return new AnonymousSubject(destination, source);
  };
  return Subject2;
}(Observable);
var AnonymousSubject = function(_super) {
  __extends(AnonymousSubject2, _super);
  function AnonymousSubject2(destination, source) {
    var _this = _super.call(this) || this;
    _this.destination = destination;
    _this.source = source;
    return _this;
  }
  AnonymousSubject2.prototype.next = function(value) {
    var _a, _b;
    (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
  };
  AnonymousSubject2.prototype.error = function(err) {
    var _a, _b;
    (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
  };
  AnonymousSubject2.prototype.complete = function() {
    var _a, _b;
    (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
  };
  AnonymousSubject2.prototype._subscribe = function(subscriber) {
    var _a, _b;
    return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
  };
  return AnonymousSubject2;
}(Subject);
var dateTimestampProvider = {
  now: function() {
    return (dateTimestampProvider.delegate || Date).now();
  },
  delegate: void 0
};
var Action = function(_super) {
  __extends(Action2, _super);
  function Action2(scheduler, work) {
    return _super.call(this) || this;
  }
  Action2.prototype.schedule = function(state, delay) {
    return this;
  };
  return Action2;
}(Subscription);
var intervalProvider = {
  setInterval: function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var delegate = intervalProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.setInterval) || setInterval).apply(void 0, __spreadArray([], __read(args)));
  },
  clearInterval: function(handle) {
    var delegate = intervalProvider.delegate;
    return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearInterval) || clearInterval)(handle);
  },
  delegate: void 0
};
var AsyncAction = function(_super) {
  __extends(AsyncAction2, _super);
  function AsyncAction2(scheduler, work) {
    var _this = _super.call(this, scheduler, work) || this;
    _this.scheduler = scheduler;
    _this.work = work;
    _this.pending = false;
    return _this;
  }
  AsyncAction2.prototype.schedule = function(state, delay) {
    if (delay === void 0) {
      delay = 0;
    }
    if (this.closed) {
      return this;
    }
    this.state = state;
    var id = this.id;
    var scheduler = this.scheduler;
    if (id != null) {
      this.id = this.recycleAsyncId(scheduler, id, delay);
    }
    this.pending = true;
    this.delay = delay;
    this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
    return this;
  };
  AsyncAction2.prototype.requestAsyncId = function(scheduler, _id, delay) {
    if (delay === void 0) {
      delay = 0;
    }
    return intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
  };
  AsyncAction2.prototype.recycleAsyncId = function(_scheduler, id, delay) {
    if (delay === void 0) {
      delay = 0;
    }
    if (delay != null && this.delay === delay && this.pending === false) {
      return id;
    }
    intervalProvider.clearInterval(id);
    return void 0;
  };
  AsyncAction2.prototype.execute = function(state, delay) {
    if (this.closed) {
      return new Error("executing a cancelled action");
    }
    this.pending = false;
    var error = this._execute(state, delay);
    if (error) {
      return error;
    } else if (this.pending === false && this.id != null) {
      this.id = this.recycleAsyncId(this.scheduler, this.id, null);
    }
  };
  AsyncAction2.prototype._execute = function(state, _delay) {
    var errored = false;
    var errorValue;
    try {
      this.work(state);
    } catch (e) {
      errored = true;
      errorValue = e ? e : new Error("Scheduled action threw falsy error");
    }
    if (errored) {
      this.unsubscribe();
      return errorValue;
    }
  };
  AsyncAction2.prototype.unsubscribe = function() {
    if (!this.closed) {
      var _a = this, id = _a.id, scheduler = _a.scheduler;
      var actions = scheduler.actions;
      this.work = this.state = this.scheduler = null;
      this.pending = false;
      arrRemove(actions, this);
      if (id != null) {
        this.id = this.recycleAsyncId(scheduler, id, null);
      }
      this.delay = null;
      _super.prototype.unsubscribe.call(this);
    }
  };
  return AsyncAction2;
}(Action);
var Scheduler = function() {
  function Scheduler2(schedulerActionCtor, now) {
    if (now === void 0) {
      now = Scheduler2.now;
    }
    this.schedulerActionCtor = schedulerActionCtor;
    this.now = now;
  }
  Scheduler2.prototype.schedule = function(work, delay, state) {
    if (delay === void 0) {
      delay = 0;
    }
    return new this.schedulerActionCtor(this, work).schedule(state, delay);
  };
  Scheduler2.now = dateTimestampProvider.now;
  return Scheduler2;
}();
var AsyncScheduler = function(_super) {
  __extends(AsyncScheduler2, _super);
  function AsyncScheduler2(SchedulerAction, now) {
    if (now === void 0) {
      now = Scheduler.now;
    }
    var _this = _super.call(this, SchedulerAction, now) || this;
    _this.actions = [];
    _this._active = false;
    _this._scheduled = void 0;
    return _this;
  }
  AsyncScheduler2.prototype.flush = function(action) {
    var actions = this.actions;
    if (this._active) {
      actions.push(action);
      return;
    }
    var error;
    this._active = true;
    do {
      if (error = action.execute(action.state, action.delay)) {
        break;
      }
    } while (action = actions.shift());
    this._active = false;
    if (error) {
      while (action = actions.shift()) {
        action.unsubscribe();
      }
      throw error;
    }
  };
  return AsyncScheduler2;
}(Scheduler);
var asyncScheduler = new AsyncScheduler(AsyncAction);
var EMPTY = new Observable(function(subscriber) {
  return subscriber.complete();
});
var isArrayLike = function(x) {
  return x && typeof x.length === "number" && typeof x !== "function";
};
function isPromise(value) {
  return isFunction(value === null || value === void 0 ? void 0 : value.then);
}
function isInteropObservable(input) {
  return isFunction(input[observable]);
}
function isAsyncIterable(obj) {
  return Symbol.asyncIterator && isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}
function createInvalidObservableTypeError(input) {
  return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
function getSymbolIterator() {
  if (typeof Symbol !== "function" || !Symbol.iterator) {
    return "@@iterator";
  }
  return Symbol.iterator;
}
var iterator = getSymbolIterator();
function isIterable(input) {
  return isFunction(input === null || input === void 0 ? void 0 : input[iterator]);
}
function readableStreamLikeToAsyncGenerator(readableStream) {
  return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
    var reader, _a, value, done;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          reader = readableStream.getReader();
          _b.label = 1;
        case 1:
          _b.trys.push([1, , 9, 10]);
          _b.label = 2;
        case 2:
          return [4, __await(reader.read())];
        case 3:
          _a = _b.sent(), value = _a.value, done = _a.done;
          if (!done)
            return [3, 5];
          return [4, __await(void 0)];
        case 4:
          return [2, _b.sent()];
        case 5:
          return [4, __await(value)];
        case 6:
          return [4, _b.sent()];
        case 7:
          _b.sent();
          return [3, 2];
        case 8:
          return [3, 10];
        case 9:
          reader.releaseLock();
          return [7];
        case 10:
          return [2];
      }
    });
  });
}
function isReadableStreamLike(obj) {
  return isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
}
function innerFrom(input) {
  if (input instanceof Observable) {
    return input;
  }
  if (input != null) {
    if (isInteropObservable(input)) {
      return fromInteropObservable(input);
    }
    if (isArrayLike(input)) {
      return fromArrayLike(input);
    }
    if (isPromise(input)) {
      return fromPromise(input);
    }
    if (isAsyncIterable(input)) {
      return fromAsyncIterable(input);
    }
    if (isIterable(input)) {
      return fromIterable(input);
    }
    if (isReadableStreamLike(input)) {
      return fromReadableStreamLike(input);
    }
  }
  throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
  return new Observable(function(subscriber) {
    var obs = obj[observable]();
    if (isFunction(obs.subscribe)) {
      return obs.subscribe(subscriber);
    }
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function fromArrayLike(array) {
  return new Observable(function(subscriber) {
    for (var i = 0; i < array.length && !subscriber.closed; i++) {
      subscriber.next(array[i]);
    }
    subscriber.complete();
  });
}
function fromPromise(promise) {
  return new Observable(function(subscriber) {
    promise.then(function(value) {
      if (!subscriber.closed) {
        subscriber.next(value);
        subscriber.complete();
      }
    }, function(err) {
      return subscriber.error(err);
    }).then(null, reportUnhandledError);
  });
}
function fromIterable(iterable) {
  return new Observable(function(subscriber) {
    var e_1, _a;
    try {
      for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
        var value = iterable_1_1.value;
        subscriber.next(value);
        if (subscriber.closed) {
          return;
        }
      }
    } catch (e_1_1) {
      e_1 = { error: e_1_1 };
    } finally {
      try {
        if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return))
          _a.call(iterable_1);
      } finally {
        if (e_1)
          throw e_1.error;
      }
    }
    subscriber.complete();
  });
}
function fromAsyncIterable(asyncIterable) {
  return new Observable(function(subscriber) {
    process(asyncIterable, subscriber).catch(function(err) {
      return subscriber.error(err);
    });
  });
}
function fromReadableStreamLike(readableStream) {
  return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function process(asyncIterable, subscriber) {
  var asyncIterable_1, asyncIterable_1_1;
  var e_2, _a;
  return __awaiter(this, void 0, void 0, function() {
    var value, e_2_1;
    return __generator(this, function(_b) {
      switch (_b.label) {
        case 0:
          _b.trys.push([0, 5, 6, 11]);
          asyncIterable_1 = __asyncValues(asyncIterable);
          _b.label = 1;
        case 1:
          return [4, asyncIterable_1.next()];
        case 2:
          if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done))
            return [3, 4];
          value = asyncIterable_1_1.value;
          subscriber.next(value);
          if (subscriber.closed) {
            return [2];
          }
          _b.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          e_2_1 = _b.sent();
          e_2 = { error: e_2_1 };
          return [3, 11];
        case 6:
          _b.trys.push([6, , 9, 10]);
          if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return)))
            return [3, 8];
          return [4, _a.call(asyncIterable_1)];
        case 7:
          _b.sent();
          _b.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (e_2)
            throw e_2.error;
          return [7];
        case 10:
          return [7];
        case 11:
          subscriber.complete();
          return [2];
      }
    });
  });
}
function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
  if (delay === void 0) {
    delay = 0;
  }
  if (repeat === void 0) {
    repeat = false;
  }
  var scheduleSubscription = scheduler.schedule(function() {
    work();
    if (repeat) {
      parentSubscription.add(this.schedule(null, delay));
    } else {
      this.unsubscribe();
    }
  }, delay);
  parentSubscription.add(scheduleSubscription);
  if (!repeat) {
    return scheduleSubscription;
  }
}
function throwError(errorOrErrorFactory, scheduler) {
  var errorFactory = isFunction(errorOrErrorFactory) ? errorOrErrorFactory : function() {
    return errorOrErrorFactory;
  };
  var init = function(subscriber) {
    return subscriber.error(errorFactory());
  };
  return new Observable(scheduler ? function(subscriber) {
    return scheduler.schedule(init, 0, subscriber);
  } : init);
}
var EmptyError = createErrorClass(function(_super) {
  return function EmptyErrorImpl() {
    _super(this);
    this.name = "EmptyError";
    this.message = "no elements in sequence";
  };
});
function isValidDate(value) {
  return value instanceof Date && !isNaN(value);
}
var TimeoutError = createErrorClass(function(_super) {
  return function TimeoutErrorImpl(info) {
    if (info === void 0) {
      info = null;
    }
    _super(this);
    this.message = "Timeout has occurred";
    this.name = "TimeoutError";
    this.info = info;
  };
});
function timeout(config2, schedulerArg) {
  var _a = isValidDate(config2) ? { first: config2 } : typeof config2 === "number" ? { each: config2 } : config2, first2 = _a.first, each = _a.each, _b = _a.with, _with = _b === void 0 ? timeoutErrorFactory : _b, _c = _a.scheduler, scheduler = _c === void 0 ? schedulerArg !== null && schedulerArg !== void 0 ? schedulerArg : asyncScheduler : _c, _d = _a.meta, meta = _d === void 0 ? null : _d;
  if (first2 == null && each == null) {
    throw new TypeError("No timeout provided.");
  }
  return operate(function(source, subscriber) {
    var originalSourceSubscription;
    var timerSubscription;
    var lastValue = null;
    var seen = 0;
    var startTimer = function(delay) {
      timerSubscription = executeSchedule(subscriber, scheduler, function() {
        try {
          originalSourceSubscription.unsubscribe();
          innerFrom(_with({
            meta,
            lastValue,
            seen
          })).subscribe(subscriber);
        } catch (err) {
          subscriber.error(err);
        }
      }, delay);
    };
    originalSourceSubscription = source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
      seen++;
      subscriber.next(lastValue = value);
      each > 0 && startTimer(each);
    }, void 0, void 0, function() {
      if (!(timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.closed)) {
        timerSubscription === null || timerSubscription === void 0 ? void 0 : timerSubscription.unsubscribe();
      }
      lastValue = null;
    }));
    startTimer(first2 != null ? typeof first2 === "number" ? first2 : +first2 - scheduler.now() : each);
  });
}
function timeoutErrorFactory(info) {
  throw new TimeoutError(info);
}
function map(project, thisArg) {
  return operate(function(source, subscriber) {
    var index = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      subscriber.next(project.call(thisArg, value, index++));
    }));
  });
}
function filter(predicate, thisArg) {
  return operate(function(source, subscriber) {
    var index = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      return predicate.call(thisArg, value, index++) && subscriber.next(value);
    }));
  });
}
function catchError(selector) {
  return operate(function(source, subscriber) {
    var innerSub = null;
    var syncUnsub = false;
    var handledResult;
    innerSub = source.subscribe(createOperatorSubscriber(subscriber, void 0, void 0, function(err) {
      handledResult = innerFrom(selector(err, catchError(selector)(source)));
      if (innerSub) {
        innerSub.unsubscribe();
        innerSub = null;
        handledResult.subscribe(subscriber);
      } else {
        syncUnsub = true;
      }
    }));
    if (syncUnsub) {
      innerSub.unsubscribe();
      innerSub = null;
      handledResult.subscribe(subscriber);
    }
  });
}
function defaultIfEmpty(defaultValue) {
  return operate(function(source, subscriber) {
    var hasValue = false;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      hasValue = true;
      subscriber.next(value);
    }, function() {
      if (!hasValue) {
        subscriber.next(defaultValue);
      }
      subscriber.complete();
    }));
  });
}
function take(count) {
  return count <= 0 ? function() {
    return EMPTY;
  } : operate(function(source, subscriber) {
    var seen = 0;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      if (++seen <= count) {
        subscriber.next(value);
        if (count <= seen) {
          subscriber.complete();
        }
      }
    }));
  });
}
function throwIfEmpty(errorFactory) {
  if (errorFactory === void 0) {
    errorFactory = defaultErrorFactory;
  }
  return operate(function(source, subscriber) {
    var hasValue = false;
    source.subscribe(createOperatorSubscriber(subscriber, function(value) {
      hasValue = true;
      subscriber.next(value);
    }, function() {
      return hasValue ? subscriber.complete() : subscriber.error(errorFactory());
    }));
  });
}
function defaultErrorFactory() {
  return new EmptyError();
}
function first(predicate, defaultValue) {
  var hasDefaultValue = arguments.length >= 2;
  return function(source) {
    return source.pipe(predicate ? filter(function(v, i) {
      return predicate(v, i, source);
    }) : identity, take(1), hasDefaultValue ? defaultIfEmpty(defaultValue) : throwIfEmpty(function() {
      return new EmptyError();
    }));
  };
}
class AsgardClient {
  constructor(config2, responder = {
    fireAndForget(payload) {
      console.log(payload.data);
    }
  }) {
    __publicField(this, "config");
    __publicField(this, "_rsocket");
    __publicField(this, "isManualClose", false);
    __publicField(this, "connectionStatus", new Subject());
    __publicField(this, "clientFactory", () => {
      return new build$3.RSocketClient({
        setup: {
          dataMimeType: AsgardClientConfig.dataMimeType,
          keepAlive: this.config.keepAlive,
          lifetime: this.config.lifetime,
          metadataMimeType: AsgardClientConfig.metadataMimeType,
          payload: {
            data: this.setupData()
          }
        },
        transport: new build$3.RSocketResumableTransport(() => new default_1({
          debug: true,
          url: this.config.url,
          wsCreator: (url) => new WebSocket(url)
        }, build$3.BufferEncoders), {
          bufferSize: 10,
          resumeToken: Buffer.from(this.config.clientId),
          sessionDurationSeconds: 180
        }, build$3.BufferEncoders),
        responder: this.responder
      });
    });
    __publicField(this, "responder");
    this.config = config2;
    this.responder = responder;
  }
  get rsocket() {
    return new Observable((subscriber) => {
      if (this._rsocket) {
        subscriber.next(this._rsocket);
      } else {
        const a = setInterval(() => {
          if (this._rsocket) {
            subscriber.next(this._rsocket);
            clearInterval(a);
          }
        }, 100);
      }
    });
  }
  connect() {
    this.isManualClose = false;
    if (this.config.clientId.length > 0) {
      this._connect();
    } else {
      this.config.funConnect = this._connect.bind(this);
    }
  }
  _connect() {
    this.clientFactory().connect().subscribe({
      onComplete: (rsocket) => {
        this._rsocket = rsocket;
        this._rsocket.connectionStatus().subscribe({
          onError: (error) => {
            console.error(error);
          },
          onNext: (event) => {
            this.connectionStatus.next(event);
            if (!this.isManualClose && (event.kind == "ERROR" || event.kind == "CLOSED"))
              ;
          },
          onSubscribe: (subscription) => subscription.request(2147483647)
        });
      },
      onError: (error) => {
        console.error(error);
      }
    });
  }
  close() {
    this.isManualClose = true;
    this.rsocket.pipe(first()).subscribe((rsocket) => rsocket.close());
  }
  broadcast(uri, data, options = {}) {
    options.header = options.header || /* @__PURE__ */ new Map();
    options.header.set("method", "broadcast");
    return this.rsocket.pipe(first(), map((r) => r.requestChannel(build$2.Flowable.just(this.getRequestPayload(uri, data, options.header)))), transFlowable, map((p) => AsgardClient.getResponsePayload(p)));
  }
  get(path, data, options = {}) {
    options.header = options.header || /* @__PURE__ */ new Map();
    options.header.set("method", "get");
    return this.rsocket.pipe(first(), map((r) => r.requestResponse(this.getRequestPayload(path, data, options.header))), transSingle, timeout(options.timeout || 6e3), catchError((e) => {
      return throwError(() => {
        if (e.name == "TimeoutError") {
          return {
            code: -1,
            space: "global"
          };
        } else {
          return e;
        }
      });
    }), map((p) => AsgardClient.getResponsePayload(p)));
  }
  post(path, data, options = {}) {
    options.header = options.header || /* @__PURE__ */ new Map();
    options.header.set("method", "post");
    return this.rsocket.pipe(first(), map((r) => r.requestResponse(this.getRequestPayload(path, data, options.header))), transSingle, timeout(options.timeout || 6e3), catchError((e) => {
      return throwError(() => {
        if (e.name == "TimeoutError") {
          return {
            code: -1,
            space: "global"
          };
        } else {
          return e;
        }
      });
    }), map((p) => null));
  }
  fire(path, data, header = /* @__PURE__ */ new Map()) {
    header.set("method", "fire");
    this.rsocket.pipe(first(), map((r) => r.fireAndForget(this.getRequestPayload(path, data, header))));
  }
  stream(uri, data, options = {}) {
    options.header = options.header || /* @__PURE__ */ new Map();
    options.header.set("method", "stream");
    return this.rsocket.pipe(first(), map((r) => r.requestStream(this.getRequestPayload(uri, data, options.header))), transFlowable, map((p) => {
      return AsgardClient.getResponsePayload(p);
    }));
  }
  static getResponsePayload(value) {
    let data;
    if (value.data) {
      try {
        data = JSON.parse(value.data.toString());
      } catch (e) {
        data = value.data.toString();
      }
    } else {
      data = {};
    }
    return data;
  }
  getRequestPayload(uri, data, header = /* @__PURE__ */ new Map()) {
    const route = [
      build$3.MESSAGE_RSOCKET_ROUTING,
      build$3.encodeRoute(uri)
    ];
    if (!header.get("sessionId")) {
      header.set("sessionId", this.config.clientId);
    }
    let obj = {};
    for (const key of header.keys()) {
      obj[key] = header.get(key);
    }
    const json = [
      build$3.APPLICATION_JSON,
      Buffer.from(JSON.stringify(obj))
    ];
    let dataBuffer;
    if (data) {
      dataBuffer = Buffer.from(typeof data == "object" ? JSON.stringify(data) : data);
    } else {
      dataBuffer = void 0;
    }
    return {
      data: dataBuffer,
      metadata: build$3.encodeCompositeMetadata([route, json])
    };
  }
  setupData() {
    return Buffer.from(JSON.stringify({
      token: this.config.token == "" ? void 0 : this.config.token,
      clientId: this.config.clientId,
      clientType: this.config.clientType
    }));
  }
}
function transSingle(s) {
  return new Observable((subscriber) => {
    s.subscribe((single) => {
      single.subscribe({
        onError(error) {
          try {
            const info = JSON.parse(error.source.message);
            console.error(info.errMsg);
            subscriber.error({ code: info.errCode, space: info.errSpace });
          } catch (e) {
            console.error(error);
            subscriber.error({ code: 0, space: "global" });
          }
        },
        onComplete(value) {
          subscriber.next(value);
          subscriber.complete();
        },
        onSubscribe(cancel) {
          let a = subscriber.unsubscribe;
          subscriber.unsubscribe = () => {
            a.call(subscriber);
          };
        }
      });
    });
  });
}
function transFlowable(f) {
  return new Observable((subscriber) => {
    f.subscribe((flowable) => {
      flowable.subscribe({
        onNext(value) {
          subscriber.next(value);
        },
        onError(error) {
          try {
            const info = JSON.parse(error.source.message);
            console.error(info.errMsg);
            subscriber.error({ code: info.errCode, space: info.errSpace });
          } catch (e) {
            console.error(error);
            subscriber.error({ code: 0, space: "global" });
          }
        },
        onComplete() {
          subscriber.complete();
        },
        onSubscribe(subscription) {
          let a = subscriber.unsubscribe;
          subscriber.unsubscribe = () => {
            subscription.cancel();
            a.call(subscriber);
          };
          subscription.request(2147483647);
        }
      });
    });
  });
}
class Api$3 {
  constructor(asgardClientConfig) {
    __publicField(this, "asgardClientConfig");
    __publicField(this, "asgardClient");
    this.asgardClientConfig = asgardClientConfig;
    this.asgardClient = new AsgardClient(this.asgardClientConfig);
  }
  connect() {
    this.asgardClient.connect();
  }
  loadingGameList() {
    return this.asgardClient.get("/home/loading/gameList");
  }
  loadingLevel() {
    return this.asgardClient.get("/home/loading/level");
  }
  loadingRouletteCounter() {
    return this.asgardClient.get("/home/loading/rouletteCounter");
  }
  rouletteCollect() {
    return this.asgardClient.get("/home/roulette/collect");
  }
  loadingFreeRoulette() {
    return this.asgardClient.get("/home/loading/freeRoulette");
  }
  loadingPiggyBank() {
    return this.asgardClient.get("/home/loading/piggyBank");
  }
  rouletteFreePrizeLuckyDraw() {
    return this.asgardClient.get("/home/roulette/freePrizeLuckyDraw");
  }
  loadingPayRoulette() {
    return this.asgardClient.get("/home/loading/payRoulette");
  }
  tempSetBalance(payload) {
    return this.asgardClient.get("/home/temp/setBalance", payload);
  }
  loadingUserInfo() {
    return this.asgardClient.get("/home/loading/userInfo");
  }
  loadingUserBalance() {
    return this.asgardClient.get("/home/loading/userBalance");
  }
  loadingOftenPlayGame() {
    return this.asgardClient.get("/home/loading/oftenPlayGame");
  }
  timeSynchronous() {
    return this.asgardClient.get("/home/time/synchronous");
  }
  loadingTreasureChest() {
    return this.asgardClient.get("/home/loading/treasureChest");
  }
  treasureChestAcceptOrPass(payload) {
    return this.asgardClient.post("/home/treasureChest/acceptOrPass", payload);
  }
  treasureChestCountdown(payload) {
    return this.asgardClient.post("/home/treasureChest/countdown", payload);
  }
  treasureChestSpeedUp(payload) {
    return this.asgardClient.get("/home/treasureChest/speedUp", payload);
  }
  treasureChestOpen(payload) {
    return this.asgardClient.get("/home/treasureChest/open", payload);
  }
}
class Api$2 {
  constructor(asgardClientConfig) {
    __publicField(this, "asgardClientConfig");
    __publicField(this, "asgardClient");
    this.asgardClientConfig = asgardClientConfig;
    this.asgardClient = new AsgardClient(this.asgardClientConfig);
  }
  connect() {
    this.asgardClient.connect();
  }
  boardIncome(parameter) {
    return this.asgardClient.broadcast(`/mail/income/${parameter["userId"]}`);
  }
  getMail() {
    return this.asgardClient.get("/mail/mail");
  }
}
class Api$1 {
  constructor(asgardClientConfig) {
    __publicField(this, "asgardClientConfig");
    __publicField(this, "asgardClient");
    this.asgardClientConfig = asgardClientConfig;
    this.asgardClient = new AsgardClient(this.asgardClientConfig);
  }
  connect() {
    this.asgardClient.connect();
  }
  getSeasonTaskDetail() {
    return this.asgardClient.get("/season/task/detail");
  }
  submitSeasonTask(payload) {
    return this.asgardClient.get("/season/task/submit", payload);
  }
  getSeasonTaskReward(payload) {
    return this.asgardClient.get("/season/task/draw", payload);
  }
}
class Api {
  constructor(asgardClientConfig) {
    __publicField(this, "asgardClientConfig");
    __publicField(this, "asgardClient");
    this.asgardClientConfig = asgardClientConfig;
    this.asgardClient = new AsgardClient(this.asgardClientConfig);
  }
  connect() {
    this.asgardClient.connect();
  }
  loginDeviceNumber(payload) {
    return this.asgardClient.get("/user/login/deviceNumber", payload);
  }
  getAchievements() {
    return this.asgardClient.get("/user/achievement");
  }
  getGetReward(payload) {
    return this.asgardClient.get("/user/achievement/getReward", payload);
  }
}
export { Api$3 as EvelynnServiceHome, Api$2 as EvelynnServiceMail, Api$1 as EvelynnServiceSeason, Api as EvelynnServiceUser };
