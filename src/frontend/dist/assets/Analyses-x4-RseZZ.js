import { c as createLucideIcon, z as React, a6 as clsx, r as reactExports, j as jsxRuntimeExports, d as Gauge, a7 as Activity } from "./index-CLvvNGC5.js";
import { T as TransformationModel, F as FeatureDetector } from "./backend-DPWNum9l.js";
import { M as MetricCard } from "./MetricCard-CUJmwOnQ.js";
import { S as StatusBadge } from "./StatusBadge-BeOJaX2E.js";
import { D as DataOriginBadge, L as LoadingState, E as ErrorState, a as EmptyState } from "./LoadingState-CJmkDIGR.js";
import { S as SectionCard } from "./SectionCard-j39JmNct.js";
import { D as DataTable } from "./DataTable-DvpL2mbN.js";
import { P as PrototypeStatusBadge } from "./PrototypeStatusBadge-DeOLmAG7.js";
import { r as runPipeline } from "./cv-engine-jhIfoGkm.js";
import { l as loadImageToImageData } from "./metrics-CXdDL_t5.js";
import { generateAllDemoPairs } from "./demo-pairs-DZbS-Ryj.js";
import { S as Sun, a as Scaling } from "./sun-BbvhDRjE.js";
import { L as Layers } from "./layers-DXSet5IY.js";
import { i as isFunction, D as Dot, f as findAllByType, E as ErrorBar, L as Layer, a as filterProps, C as Curve, A as Animate, b as interpolateNumber, c as isEqual, d as isNil, h as hasClipDot, e as LabelList, g as getValueByDataKey, u as uniqueId, G as Global, j as getCateCoordinateOfLine, k as generateCategoricalChart, X as XAxis, Y as YAxis, l as formatAxisMap, R as ResponsiveContainer, B as BarChart, m as CartesianGrid, T as Tooltip, n as Legend, o as Bar } from "./BarChart-pevpRXUd.js";
import "./circle-check-DcUF21bz.js";
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
const Eye = createLucideIcon("eye", __iconNode);
var _excluded = ["type", "layout", "connectNulls", "ref"], _excluded2 = ["key"];
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", { writable: false });
  return Constructor;
}
function _callSuper(t, o, e) {
  return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
}
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return _assertThisInitialized(self);
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch (t2) {
  }
  return (_isNativeReflectConstruct = function _isNativeReflectConstruct2() {
    return !!t;
  })();
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf2(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _getPrototypeOf(o);
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } });
  Object.defineProperty(subClass, "prototype", { writable: false });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(t);
}
var Line = /* @__PURE__ */ function(_PureComponent) {
  function Line2() {
    var _this;
    _classCallCheck(this, Line2);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, Line2, [].concat(args));
    _defineProperty(_this, "state", {
      isAnimationFinished: true,
      totalLength: 0
    });
    _defineProperty(_this, "generateSimpleStrokeDasharray", function(totalLength, length) {
      return "".concat(length, "px ").concat(totalLength - length, "px");
    });
    _defineProperty(_this, "getStrokeDasharray", function(length, totalLength, lines) {
      var lineLength = lines.reduce(function(pre, next) {
        return pre + next;
      });
      if (!lineLength) {
        return _this.generateSimpleStrokeDasharray(totalLength, length);
      }
      var count = Math.floor(length / lineLength);
      var remainLength = length % lineLength;
      var restLength = totalLength - length;
      var remainLines = [];
      for (var i = 0, sum = 0; i < lines.length; sum += lines[i], ++i) {
        if (sum + lines[i] > remainLength) {
          remainLines = [].concat(_toConsumableArray(lines.slice(0, i)), [remainLength - sum]);
          break;
        }
      }
      var emptyLines = remainLines.length % 2 === 0 ? [0, restLength] : [restLength];
      return [].concat(_toConsumableArray(Line2.repeat(lines, count)), _toConsumableArray(remainLines), emptyLines).map(function(line) {
        return "".concat(line, "px");
      }).join(", ");
    });
    _defineProperty(_this, "id", uniqueId("recharts-line-"));
    _defineProperty(_this, "pathRef", function(node) {
      _this.mainCurve = node;
    });
    _defineProperty(_this, "handleAnimationEnd", function() {
      _this.setState({
        isAnimationFinished: true
      });
      if (_this.props.onAnimationEnd) {
        _this.props.onAnimationEnd();
      }
    });
    _defineProperty(_this, "handleAnimationStart", function() {
      _this.setState({
        isAnimationFinished: false
      });
      if (_this.props.onAnimationStart) {
        _this.props.onAnimationStart();
      }
    });
    return _this;
  }
  _inherits(Line2, _PureComponent);
  return _createClass(Line2, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      if (!this.props.isAnimationActive) {
        return;
      }
      var totalLength = this.getTotalLength();
      this.setState({
        totalLength
      });
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      if (!this.props.isAnimationActive) {
        return;
      }
      var totalLength = this.getTotalLength();
      if (totalLength !== this.state.totalLength) {
        this.setState({
          totalLength
        });
      }
    }
  }, {
    key: "getTotalLength",
    value: function getTotalLength() {
      var curveDom = this.mainCurve;
      try {
        return curveDom && curveDom.getTotalLength && curveDom.getTotalLength() || 0;
      } catch (err) {
        return 0;
      }
    }
  }, {
    key: "renderErrorBar",
    value: function renderErrorBar(needClip, clipPathId) {
      if (this.props.isAnimationActive && !this.state.isAnimationFinished) {
        return null;
      }
      var _this$props = this.props, points = _this$props.points, xAxis = _this$props.xAxis, yAxis = _this$props.yAxis, layout = _this$props.layout, children = _this$props.children;
      var errorBarItems = findAllByType(children, ErrorBar);
      if (!errorBarItems) {
        return null;
      }
      var dataPointFormatter = function dataPointFormatter2(dataPoint, dataKey) {
        return {
          x: dataPoint.x,
          y: dataPoint.y,
          value: dataPoint.value,
          errorVal: getValueByDataKey(dataPoint.payload, dataKey)
        };
      };
      var errorBarProps = {
        clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : null
      };
      return /* @__PURE__ */ React.createElement(Layer, errorBarProps, errorBarItems.map(function(item) {
        return /* @__PURE__ */ React.cloneElement(item, {
          key: "bar-".concat(item.props.dataKey),
          data: points,
          xAxis,
          yAxis,
          layout,
          dataPointFormatter
        });
      }));
    }
  }, {
    key: "renderDots",
    value: function renderDots(needClip, clipDot, clipPathId) {
      var isAnimationActive = this.props.isAnimationActive;
      if (isAnimationActive && !this.state.isAnimationFinished) {
        return null;
      }
      var _this$props2 = this.props, dot = _this$props2.dot, points = _this$props2.points, dataKey = _this$props2.dataKey;
      var lineProps = filterProps(this.props, false);
      var customDotProps = filterProps(dot, true);
      var dots = points.map(function(entry, i) {
        var dotProps = _objectSpread(_objectSpread(_objectSpread({
          key: "dot-".concat(i),
          r: 3
        }, lineProps), customDotProps), {}, {
          index: i,
          cx: entry.x,
          cy: entry.y,
          value: entry.value,
          dataKey,
          payload: entry.payload,
          points
        });
        return Line2.renderDotItem(dot, dotProps);
      });
      var dotsProps = {
        clipPath: needClip ? "url(#clipPath-".concat(clipDot ? "" : "dots-").concat(clipPathId, ")") : null
      };
      return /* @__PURE__ */ React.createElement(Layer, _extends({
        className: "recharts-line-dots",
        key: "dots"
      }, dotsProps), dots);
    }
  }, {
    key: "renderCurveStatically",
    value: function renderCurveStatically(points, needClip, clipPathId, props) {
      var _this$props3 = this.props, type = _this$props3.type, layout = _this$props3.layout, connectNulls = _this$props3.connectNulls;
      _this$props3.ref;
      var others = _objectWithoutProperties(_this$props3, _excluded);
      var curveProps = _objectSpread(_objectSpread(_objectSpread({}, filterProps(others, true)), {}, {
        fill: "none",
        className: "recharts-line-curve",
        clipPath: needClip ? "url(#clipPath-".concat(clipPathId, ")") : null,
        points
      }, props), {}, {
        type,
        layout,
        connectNulls
      });
      return /* @__PURE__ */ React.createElement(Curve, _extends({}, curveProps, {
        pathRef: this.pathRef
      }));
    }
  }, {
    key: "renderCurveWithAnimation",
    value: function renderCurveWithAnimation(needClip, clipPathId) {
      var _this2 = this;
      var _this$props4 = this.props, points = _this$props4.points, strokeDasharray = _this$props4.strokeDasharray, isAnimationActive = _this$props4.isAnimationActive, animationBegin = _this$props4.animationBegin, animationDuration = _this$props4.animationDuration, animationEasing = _this$props4.animationEasing, animationId = _this$props4.animationId, animateNewValues = _this$props4.animateNewValues, width = _this$props4.width, height = _this$props4.height;
      var _this$state = this.state, prevPoints = _this$state.prevPoints, totalLength = _this$state.totalLength;
      return /* @__PURE__ */ React.createElement(Animate, {
        begin: animationBegin,
        duration: animationDuration,
        isActive: isAnimationActive,
        easing: animationEasing,
        from: {
          t: 0
        },
        to: {
          t: 1
        },
        key: "line-".concat(animationId),
        onAnimationEnd: this.handleAnimationEnd,
        onAnimationStart: this.handleAnimationStart
      }, function(_ref) {
        var t = _ref.t;
        if (prevPoints) {
          var prevPointsDiffFactor = prevPoints.length / points.length;
          var stepData = points.map(function(entry, index) {
            var prevPointIndex = Math.floor(index * prevPointsDiffFactor);
            if (prevPoints[prevPointIndex]) {
              var prev = prevPoints[prevPointIndex];
              var interpolatorX = interpolateNumber(prev.x, entry.x);
              var interpolatorY = interpolateNumber(prev.y, entry.y);
              return _objectSpread(_objectSpread({}, entry), {}, {
                x: interpolatorX(t),
                y: interpolatorY(t)
              });
            }
            if (animateNewValues) {
              var _interpolatorX = interpolateNumber(width * 2, entry.x);
              var _interpolatorY = interpolateNumber(height / 2, entry.y);
              return _objectSpread(_objectSpread({}, entry), {}, {
                x: _interpolatorX(t),
                y: _interpolatorY(t)
              });
            }
            return _objectSpread(_objectSpread({}, entry), {}, {
              x: entry.x,
              y: entry.y
            });
          });
          return _this2.renderCurveStatically(stepData, needClip, clipPathId);
        }
        var interpolator = interpolateNumber(0, totalLength);
        var curLength = interpolator(t);
        var currentStrokeDasharray;
        if (strokeDasharray) {
          var lines = "".concat(strokeDasharray).split(/[,\s]+/gim).map(function(num) {
            return parseFloat(num);
          });
          currentStrokeDasharray = _this2.getStrokeDasharray(curLength, totalLength, lines);
        } else {
          currentStrokeDasharray = _this2.generateSimpleStrokeDasharray(totalLength, curLength);
        }
        return _this2.renderCurveStatically(points, needClip, clipPathId, {
          strokeDasharray: currentStrokeDasharray
        });
      });
    }
  }, {
    key: "renderCurve",
    value: function renderCurve(needClip, clipPathId) {
      var _this$props5 = this.props, points = _this$props5.points, isAnimationActive = _this$props5.isAnimationActive;
      var _this$state2 = this.state, prevPoints = _this$state2.prevPoints, totalLength = _this$state2.totalLength;
      if (isAnimationActive && points && points.length && (!prevPoints && totalLength > 0 || !isEqual(prevPoints, points))) {
        return this.renderCurveWithAnimation(needClip, clipPathId);
      }
      return this.renderCurveStatically(points, needClip, clipPathId);
    }
  }, {
    key: "render",
    value: function render() {
      var _filterProps;
      var _this$props6 = this.props, hide = _this$props6.hide, dot = _this$props6.dot, points = _this$props6.points, className = _this$props6.className, xAxis = _this$props6.xAxis, yAxis = _this$props6.yAxis, top = _this$props6.top, left = _this$props6.left, width = _this$props6.width, height = _this$props6.height, isAnimationActive = _this$props6.isAnimationActive, id = _this$props6.id;
      if (hide || !points || !points.length) {
        return null;
      }
      var isAnimationFinished = this.state.isAnimationFinished;
      var hasSinglePoint = points.length === 1;
      var layerClass = clsx("recharts-line", className);
      var needClipX = xAxis && xAxis.allowDataOverflow;
      var needClipY = yAxis && yAxis.allowDataOverflow;
      var needClip = needClipX || needClipY;
      var clipPathId = isNil(id) ? this.id : id;
      var _ref2 = (_filterProps = filterProps(dot, false)) !== null && _filterProps !== void 0 ? _filterProps : {
        r: 3,
        strokeWidth: 2
      }, _ref2$r = _ref2.r, r = _ref2$r === void 0 ? 3 : _ref2$r, _ref2$strokeWidth = _ref2.strokeWidth, strokeWidth = _ref2$strokeWidth === void 0 ? 2 : _ref2$strokeWidth;
      var _ref3 = hasClipDot(dot) ? dot : {}, _ref3$clipDot = _ref3.clipDot, clipDot = _ref3$clipDot === void 0 ? true : _ref3$clipDot;
      var dotSize = r * 2 + strokeWidth;
      return /* @__PURE__ */ React.createElement(Layer, {
        className: layerClass
      }, needClipX || needClipY ? /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("clipPath", {
        id: "clipPath-".concat(clipPathId)
      }, /* @__PURE__ */ React.createElement("rect", {
        x: needClipX ? left : left - width / 2,
        y: needClipY ? top : top - height / 2,
        width: needClipX ? width : width * 2,
        height: needClipY ? height : height * 2
      })), !clipDot && /* @__PURE__ */ React.createElement("clipPath", {
        id: "clipPath-dots-".concat(clipPathId)
      }, /* @__PURE__ */ React.createElement("rect", {
        x: left - dotSize / 2,
        y: top - dotSize / 2,
        width: width + dotSize,
        height: height + dotSize
      }))) : null, !hasSinglePoint && this.renderCurve(needClip, clipPathId), this.renderErrorBar(needClip, clipPathId), (hasSinglePoint || dot) && this.renderDots(needClip, clipDot, clipPathId), (!isAnimationActive || isAnimationFinished) && LabelList.renderCallByParent(this.props, points));
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(nextProps, prevState) {
      if (nextProps.animationId !== prevState.prevAnimationId) {
        return {
          prevAnimationId: nextProps.animationId,
          curPoints: nextProps.points,
          prevPoints: prevState.curPoints
        };
      }
      if (nextProps.points !== prevState.curPoints) {
        return {
          curPoints: nextProps.points
        };
      }
      return null;
    }
  }, {
    key: "repeat",
    value: function repeat(lines, count) {
      var linesUnit = lines.length % 2 !== 0 ? [].concat(_toConsumableArray(lines), [0]) : lines;
      var result = [];
      for (var i = 0; i < count; ++i) {
        result = [].concat(_toConsumableArray(result), _toConsumableArray(linesUnit));
      }
      return result;
    }
  }, {
    key: "renderDotItem",
    value: function renderDotItem(option, props) {
      var dotItem;
      if (/* @__PURE__ */ React.isValidElement(option)) {
        dotItem = /* @__PURE__ */ React.cloneElement(option, props);
      } else if (isFunction(option)) {
        dotItem = option(props);
      } else {
        var key = props.key, dotProps = _objectWithoutProperties(props, _excluded2);
        var className = clsx("recharts-line-dot", typeof option !== "boolean" ? option.className : "");
        dotItem = /* @__PURE__ */ React.createElement(Dot, _extends({
          key
        }, dotProps, {
          className
        }));
      }
      return dotItem;
    }
  }]);
}(reactExports.PureComponent);
_defineProperty(Line, "displayName", "Line");
_defineProperty(Line, "defaultProps", {
  xAxisId: 0,
  yAxisId: 0,
  connectNulls: false,
  activeDot: true,
  dot: true,
  legendType: "line",
  stroke: "#3182bd",
  strokeWidth: 1,
  fill: "#fff",
  points: [],
  isAnimationActive: !Global.isSsr,
  animateNewValues: true,
  animationBegin: 0,
  animationDuration: 1500,
  animationEasing: "ease",
  hide: false,
  label: false
});
_defineProperty(Line, "getComposedData", function(_ref4) {
  var props = _ref4.props, xAxis = _ref4.xAxis, yAxis = _ref4.yAxis, xAxisTicks = _ref4.xAxisTicks, yAxisTicks = _ref4.yAxisTicks, dataKey = _ref4.dataKey, bandSize = _ref4.bandSize, displayedData = _ref4.displayedData, offset = _ref4.offset;
  var layout = props.layout;
  var points = displayedData.map(function(entry, index) {
    var value = getValueByDataKey(entry, dataKey);
    if (layout === "horizontal") {
      return {
        x: getCateCoordinateOfLine({
          axis: xAxis,
          ticks: xAxisTicks,
          bandSize,
          entry,
          index
        }),
        y: isNil(value) ? null : yAxis.scale(value),
        value,
        payload: entry
      };
    }
    return {
      x: isNil(value) ? null : xAxis.scale(value),
      y: getCateCoordinateOfLine({
        axis: yAxis,
        ticks: yAxisTicks,
        bandSize,
        entry,
        index
      }),
      value,
      payload: entry
    };
  });
  return _objectSpread({
    points,
    layout
  }, offset);
});
var LineChart = generateCategoricalChart({
  chartName: "LineChart",
  GraphicalChild: Line,
  axisComponents: [{
    axisType: "xAxis",
    AxisComp: XAxis
  }, {
    axisType: "yAxis",
    AxisComp: YAxis
  }],
  formatAxisMap
});
const DEFAULT_CONFIG = {
  preprocessing: {
    grayscale: true,
    denoise: true,
    contrastEnhancement: true
  },
  detector: {
    detector: FeatureDetector.orb,
    maxFeatures: 800n,
    scaleFactor: 1.2,
    nLevels: 4n,
    edgeThreshold: 31n
  },
  matching: {
    ratioThreshold: 0.75,
    crossCheck: true,
    maxMatches: 500n
  },
  model: TransformationModel.similarity,
  thresholds: {
    ransacReprojThreshold: 3,
    minInlierRatio: 0.3
  }
};
const CHART = {
  primary: "var(--chart-1)",
  accent: "var(--chart-2)",
  muted: "var(--chart-3)",
  success: "var(--chart-4)",
  destructive: "var(--chart-5)"
};
const SCENARIOS = [
  {
    id: "sun-angle",
    label: "Sun Angle Variation",
    description: "Registers a pair with a pronounced sun azimuth/elevation difference to test illumination robustness.",
    pairId: "demo-iirs-mineral-spectral",
    icon: Sun
  },
  {
    id: "scale",
    label: "Scale Variation",
    description: "Registers a pair with a pronounced scale difference to test scale robustness.",
    pairId: "demo-lro-nac-highland",
    icon: Scaling
  },
  {
    id: "viewpoint",
    label: "Viewpoint Variation",
    description: "Registers a pair with pronounced viewpoint and rotation variation.",
    pairId: "demo-lro-nac-highland",
    icon: Eye
  },
  {
    id: "multi-modal",
    label: "Multi-Modal Registration",
    description: "Registers a pair with strong multi-modal appearance contrast between source and reference.",
    pairId: "demo-iirs-mineral-spectral",
    icon: Layers
  }
];
const yieldToUI = () => new Promise((r) => setTimeout(r, 0));
function inlierRatioOf(result) {
  if (result.correspondences.length === 0) return 0;
  return result.correspondences.filter((c) => c.inlier).length / result.correspondences.length;
}
function fmt(v, digits = 2) {
  if (v === null || v === void 0 || Number.isNaN(v)) return "N/A";
  return v.toFixed(digits);
}
function pct(v) {
  if (v === null || v === void 0 || Number.isNaN(v)) return "N/A";
  return `${(v * 100).toFixed(1)}%`;
}
async function runPair(pair, config) {
  const [source, reference] = await Promise.all([
    loadImageToImageData(pair.sourceDataUrl, 512),
    loadImageToImageData(pair.referenceDataUrl, 512)
  ]);
  const output = runPipeline({
    sourceImageData: source.imageData,
    referenceImageData: reference.imageData,
    config,
    spatialGrid: 8
  });
  return output.result;
}
function AnalysesPage() {
  const [pairs, setPairs] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  const [sunAngle, setSunAngle] = reactExports.useState([]);
  const [scale, setScale] = reactExports.useState([]);
  const [multiModal, setMultiModal] = reactExports.useState([]);
  const [scenarioId, setScenarioId] = reactExports.useState("sun-angle");
  const [scenarioResult, setScenarioResult] = reactExports.useState(null);
  const [scenarioLoading, setScenarioLoading] = reactExports.useState(false);
  const [scenarioError, setScenarioError] = reactExports.useState(null);
  const runAll = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const generated = generateAllDemoPairs();
      setPairs(generated);
      const sun = [];
      for (const pair of generated) {
        const normConfig = {
          ...DEFAULT_CONFIG,
          preprocessing: {
            ...DEFAULT_CONFIG.preprocessing,
            contrastEnhancement: true
          }
        };
        const rawConfig = {
          ...DEFAULT_CONFIG,
          preprocessing: {
            ...DEFAULT_CONFIG.preprocessing,
            contrastEnhancement: false
          }
        };
        const normResult = await runPair(pair, normConfig);
        await yieldToUI();
        const rawResult = await runPair(pair, rawConfig);
        await yieldToUI();
        sun.push({
          pairId: pair.metadata.id,
          sensor: pair.metadata.sensor,
          sunAzimuthDeg: pair.metadata.sunAzimuthDeg,
          sunElevationDeg: pair.metadata.sunElevationDeg,
          inlierRatioNorm: inlierRatioOf(normResult),
          rmseNorm: normResult.metrics.rmse ?? null,
          inlierRatioRaw: inlierRatioOf(rawResult),
          rmseRaw: rawResult.metrics.rmse ?? null
        });
      }
      setSunAngle(sun);
      const sc = [];
      for (const pair of generated) {
        const result = await runPair(pair, DEFAULT_CONFIG);
        await yieldToUI();
        sc.push({
          sensor: pair.metadata.sensor,
          scaleRatio: pair.metadata.scaleRatio,
          inlierRatio: inlierRatioOf(result),
          rmse: result.metrics.rmse ?? null
        });
      }
      setScale(sc);
      const mm = [];
      for (const pair of generated) {
        const result = await runPair(pair, DEFAULT_CONFIG);
        await yieldToUI();
        mm.push({
          sensor: pair.metadata.sensor,
          inlierRatio: inlierRatioOf(result),
          rmse: result.metrics.rmse ?? null,
          inlierCount: Number(result.metrics.inlierCount ?? 0n),
          spatialCoverage: result.metrics.spatialCoverage ?? null
        });
      }
      setMultiModal(mm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    void runAll();
  }, [runAll]);
  const runScenario = reactExports.useCallback(
    async (id) => {
      const scenario = SCENARIOS.find((s) => s.id === id);
      if (!scenario) return;
      const pair = pairs.find((p) => p.metadata.id === scenario.pairId);
      if (!pair) return;
      setScenarioId(id);
      setScenarioLoading(true);
      setScenarioError(null);
      try {
        const result = await runPair(pair, DEFAULT_CONFIG);
        setScenarioResult({ pair, result });
      } catch (err) {
        setScenarioError(
          err instanceof Error ? err.message : "Scenario run failed"
        );
      } finally {
        setScenarioLoading(false);
      }
    },
    [pairs]
  );
  const sunInlierData = reactExports.useMemo(
    () => sunAngle.map((p) => ({
      sensor: p.sensor,
      Normalized: p.inlierRatioNorm,
      Raw: p.inlierRatioRaw
    })),
    [sunAngle]
  );
  const sunRmseData = reactExports.useMemo(
    () => sunAngle.map((p) => ({
      sensor: p.sensor,
      Normalized: p.rmseNorm,
      Raw: p.rmseRaw
    })),
    [sunAngle]
  );
  const scaleData = reactExports.useMemo(
    () => [...scale].sort((a, b) => a.scaleRatio - b.scaleRatio).map((p) => ({
      sensor: p.sensor,
      scaleRatio: p.scaleRatio,
      inlierRatio: p.inlierRatio,
      rmse: p.rmse
    })),
    [scale]
  );
  const multiModalData = reactExports.useMemo(
    () => multiModal.map((p) => ({
      sensor: p.sensor,
      inlierRatio: p.inlierRatio
    })),
    [multiModal]
  );
  const activeScenario = SCENARIOS.find((s) => s.id === scenarioId);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Robustness & Multi-Modal Analyses" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DataOriginBadge, { origin: "demo" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-3xl text-sm", children: "Every metric below is computed from real in-browser CV pipeline runs on the bundled DEMO/SAMPLE DATA pairs — never fabricated. The pipeline detects features, matches descriptors, verifies geometry via RANSAC, and evaluates RMSE and inlier ratio on actual pixel data." })
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      LoadingState,
      {
        label: "Running robustness analyses on demo pairs…",
        rows: 4
      }
    ) : error ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      ErrorState,
      {
        message: error,
        onRetry: () => void runAll(),
        retryLabel: "Re-run analyses"
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        SectionCard,
        {
          title: "Demo Scenario Selector",
          description: "Pick a scenario to load the corresponding demo pair and run a focused registration analysis for quick SIH presentation.",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: SCENARIOS.map((s) => {
              const Icon = s.icon;
              const active = s.id === scenarioId;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  "data-ocid": `analyses.scenario.${s.id}`,
                  type: "button",
                  onClick: () => void runScenario(s.id),
                  className: `flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none ${active ? "border-primary/60 bg-primary/10" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary flex size-9 items-center justify-center rounded-md border bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4", "aria-hidden": "true" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: s.label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs leading-relaxed", children: s.description })
                  ]
                },
                s.id
              );
            }) }),
            scenarioLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, { label: "Running scenario registration…", rows: 2 }) }) : scenarioError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              ErrorState,
              {
                message: scenarioError,
                onRetry: () => void runScenario(scenarioId)
              }
            ) }) : scenarioResult && activeScenario ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-col gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold", children: scenarioResult.pair.metadata.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-xs", children: [
                    scenarioResult.pair.metadata.sensor,
                    " · Sun",
                    " ",
                    scenarioResult.pair.metadata.sunAzimuthDeg,
                    "° az /",
                    " ",
                    scenarioResult.pair.metadata.sunElevationDeg,
                    "° el · Scale",
                    " ",
                    scenarioResult.pair.metadata.scaleRatio.toFixed(2)
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ml-auto flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    StatusBadge,
                    {
                      status: inlierRatioOf(scenarioResult.result) >= 0.5 ? "pass" : inlierRatioOf(scenarioResult.result) >= 0.3 ? "warning" : "failed",
                      label: "REGISTERED"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(PrototypeStatusBadge, { status: "functional" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetricCard,
                  {
                    label: "Inlier Ratio",
                    value: pct(inlierRatioOf(scenarioResult.result)),
                    explanation: "Fraction of matched correspondences classified as inliers under the fitted transformation model. Higher indicates a more robust registration.",
                    tone: inlierRatioOf(scenarioResult.result) >= 0.5 ? "success" : "warning"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetricCard,
                  {
                    label: "RMSE",
                    value: fmt(scenarioResult.result.metrics.rmse),
                    unit: "px",
                    explanation: "Root-mean-square reprojection error over inliers. Lower indicates a tighter geometric fit."
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetricCard,
                  {
                    label: "Inliers",
                    value: String(
                      Number(scenarioResult.result.metrics.inlierCount ?? 0n)
                    ),
                    explanation: "Number of geometrically consistent correspondence points retained after RANSAC and spatial grid optimization."
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  MetricCard,
                  {
                    label: "Spatial Coverage",
                    value: pct(scenarioResult.result.metrics.spatialCoverage),
                    explanation: "Fraction of the image area spanned by the inlier correspondence points. Higher indicates better spatial distribution."
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs", children: [
                "Scenario: ",
                activeScenario.label,
                ". This run uses the",
                " ",
                scenarioResult.pair.metadata.sensor,
                " demo pair with real in-browser CV. All values are computed from the actual pipeline output."
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              EmptyState,
              {
                icon: Gauge,
                title: "Select a demo scenario",
                description: "Choose a scenario above to load the corresponding demo pair and run a focused registration analysis."
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        SectionCard,
        {
          title: "Sun-Angle Robustness Analysis",
          description: "Registration performance across demo pairs with different sun azimuth/elevation, compared with illumination normalization ON vs OFF.",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: "Inlier Ratio by Sun Angle" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: sunInlierData, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CartesianGrid,
                    {
                      strokeDasharray: "3 3",
                      stroke: "var(--border)"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    XAxis,
                    {
                      dataKey: "sensor",
                      stroke: "var(--muted-foreground)",
                      fontSize: 12
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    YAxis,
                    {
                      domain: [0, 1],
                      tickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
                      stroke: "var(--muted-foreground)",
                      fontSize: 12
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Tooltip,
                    {
                      formatter: (value) => pct(Number(value)),
                      contentStyle: {
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Bar,
                    {
                      dataKey: "Normalized",
                      fill: CHART.primary,
                      radius: [4, 4, 0, 0]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Bar,
                    {
                      dataKey: "Raw",
                      fill: CHART.muted,
                      radius: [4, 4, 0, 0]
                    }
                  )
                ] }) }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: "RMSE by Sun Angle" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: sunRmseData, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CartesianGrid,
                    {
                      strokeDasharray: "3 3",
                      stroke: "var(--border)"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    XAxis,
                    {
                      dataKey: "sensor",
                      stroke: "var(--muted-foreground)",
                      fontSize: 12
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "var(--muted-foreground)", fontSize: 12 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Tooltip,
                    {
                      formatter: (value) => fmt(Number(value)),
                      contentStyle: {
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Legend, {}),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Bar,
                    {
                      dataKey: "Normalized",
                      fill: CHART.success,
                      radius: [4, 4, 0, 0]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Bar,
                    {
                      dataKey: "Raw",
                      fill: CHART.destructive,
                      radius: [4, 4, 0, 0]
                    }
                  )
                ] }) }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              DataTable,
              {
                data: sunAngle,
                rowKey: (r) => r.pairId,
                columns: [
                  {
                    header: "Sensor",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: r.sensor })
                  },
                  {
                    header: "Sun Az (°)",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: r.sunAzimuthDeg }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "Sun El (°)",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: r.sunElevationDeg }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "Inlier Ratio (Norm)",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: pct(r.inlierRatioNorm) }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "Inlier Ratio (Raw)",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: pct(r.inlierRatioRaw) }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "RMSE (Norm)",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs", children: [
                      fmt(r.rmseNorm),
                      " px"
                    ] }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "RMSE (Raw)",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs", children: [
                      fmt(r.rmseRaw),
                      " px"
                    ] }),
                    cellClassName: "text-right"
                  }
                ]
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        SectionCard,
        {
          title: "Scale Robustness Analysis",
          description: "How inlier ratio and RMSE change as the scale ratio between source and reference increases, across the bundled demo pairs.",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: "Inlier Ratio vs Scale Ratio" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: scaleData, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CartesianGrid,
                    {
                      strokeDasharray: "3 3",
                      stroke: "var(--border)"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    XAxis,
                    {
                      dataKey: "scaleRatio",
                      type: "number",
                      domain: ["dataMin", "dataMax"],
                      tickFormatter: (v) => v.toFixed(2),
                      stroke: "var(--muted-foreground)",
                      fontSize: 12
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    YAxis,
                    {
                      domain: [0, 1],
                      tickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
                      stroke: "var(--muted-foreground)",
                      fontSize: 12
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Tooltip,
                    {
                      formatter: (value) => pct(Number(value)),
                      labelFormatter: (v) => `Scale ${v.toFixed(2)}`,
                      contentStyle: {
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Line,
                    {
                      type: "monotone",
                      dataKey: "inlierRatio",
                      stroke: CHART.primary,
                      strokeWidth: 2,
                      dot: { r: 4 }
                    }
                  )
                ] }) }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: "RMSE vs Scale Ratio" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: scaleData, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    CartesianGrid,
                    {
                      strokeDasharray: "3 3",
                      stroke: "var(--border)"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    XAxis,
                    {
                      dataKey: "scaleRatio",
                      type: "number",
                      domain: ["dataMin", "dataMax"],
                      tickFormatter: (v) => v.toFixed(2),
                      stroke: "var(--muted-foreground)",
                      fontSize: 12
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "var(--muted-foreground)", fontSize: 12 }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Tooltip,
                    {
                      formatter: (value) => fmt(Number(value)),
                      labelFormatter: (v) => `Scale ${v.toFixed(2)}`,
                      contentStyle: {
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Line,
                    {
                      type: "monotone",
                      dataKey: "rmse",
                      stroke: CHART.accent,
                      strokeWidth: 2,
                      dot: { r: 4 },
                      connectNulls: true
                    }
                  )
                ] }) }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              DataTable,
              {
                data: scale,
                rowKey: (r) => r.sensor,
                columns: [
                  {
                    header: "Sensor",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: r.sensor })
                  },
                  {
                    header: "Scale Ratio",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: r.scaleRatio.toFixed(3) }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "Inlier Ratio",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: pct(r.inlierRatio) }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "RMSE",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs", children: [
                      fmt(r.rmse),
                      " px"
                    ] }),
                    cellClassName: "text-right"
                  }
                ]
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        SectionCard,
        {
          title: "Multi-Modal Analysis",
          description: "Per-sensor registration metrics across the supported multi-modal demo pairs (OHRC, TMC-2, IIRS, LRO NAC, SELENE). Each pair carries genuine multi-modal appearance variation between source and reference.",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-muted-foreground text-xs font-medium uppercase tracking-wider", children: "Inlier Ratio by Sensor" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BarChart, { data: multiModalData, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  CartesianGrid,
                  {
                    strokeDasharray: "3 3",
                    stroke: "var(--border)"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  XAxis,
                  {
                    dataKey: "sensor",
                    stroke: "var(--muted-foreground)",
                    fontSize: 12
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  YAxis,
                  {
                    domain: [0, 1],
                    tickFormatter: (v) => `${(v * 100).toFixed(0)}%`,
                    stroke: "var(--muted-foreground)",
                    fontSize: 12
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Tooltip,
                  {
                    formatter: (value) => pct(Number(value)),
                    contentStyle: {
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12
                    }
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Bar,
                  {
                    dataKey: "inlierRatio",
                    fill: CHART.primary,
                    radius: [4, 4, 0, 0]
                  }
                )
              ] }) }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              DataTable,
              {
                data: multiModal,
                rowKey: (r) => r.sensor,
                columns: [
                  {
                    header: "Sensor",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: r.sensor })
                  },
                  {
                    header: "Inlier Ratio",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: pct(r.inlierRatio) }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "RMSE",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-xs", children: [
                      fmt(r.rmse),
                      " px"
                    ] }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "Inliers",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: r.inlierCount }),
                    cellClassName: "text-right"
                  },
                  {
                    header: "Spatial Coverage",
                    cell: (r) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs", children: pct(r.spatialCoverage) }),
                    cellClassName: "text-right"
                  }
                ]
              }
            ) })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-muted-foreground text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "size-3.5", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "All analyses run the full in-browser CV pipeline on bundled DEMO/SAMPLE DATA. Sub-pixel refinement is Prototype/Integration Pending in-browser; results are pixel-level." })
      ] })
    ] })
  ] });
}
export {
  AnalysesPage as default
};
