'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = withAvailableSize;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint-disable comma-dangle, no-underscore-dangle */


function defaultObserver(_domElement, notify) {
  window.addEventListener('resize', notify, { passive: true });
  return function () {
    window.removeEventListener('resize', notify, { passive: true });
  };
}

/**
 * HoC that injects a `availableWidth` prop to the component, equal to the
 * available width in the current context
 *
 * @param {Object} Component
 * @return {Object} a wrapped Component
 */
function withAvailableSize(Component) {
  var observer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultObserver;

  return function (_PureComponent) {
    _inherits(_class, _PureComponent);

    function _class() {
      _classCallCheck(this, _class);

      var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

      _this._instanceId = 'waw-' + Math.random().toString(36).substring(7);
      _this.state = {
        dirty: true,
        dirtyCount: 0,
        availableSize: undefined
      };
      _this._handleDivRef = _this._handleDivRef.bind(_this);
      return _this;
    }

    _createClass(_class, [{
      key: 'componentDidMount',
      value: function componentDidMount() {
        var _this2 = this;

        this._unobserve = observer(this._containerElement, function () {
          _this2.setState({
            dirty: true,
            dirtyCount: _this2.state.dirtyCount + 1
          });
        });
        if (typeof this._unobserve !== 'function') {
          throw new Error('The observer did not provide a way to unobserve. ' + 'This will likely lead to memory leaks.');
        }
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        this._unobserve();
      }
    }, {
      key: '_handleDivRef',
      value: function _handleDivRef(domElement) {
        if (!domElement) {
          return;
        }
        this._containerElement = domElement.parentNode;

        this.setState({
          availableSize: {
            width: domElement.offsetWidth,
            height: domElement.offsetHeight
          },
          dirty: false
        });
      }
    }, {
      key: 'render',
      value: function render() {
        var _state = this.state,
            availableSize = _state.availableSize,
            dirty = _state.dirty,
            dirtyCount = _state.dirtyCount;


        return _react2.default.createElement(
          _react2.default.Fragment,
          null,
          dirty && _react2.default.createElement('style', {
            type: 'text/css'
            // eslint-disable-next-line react/no-danger
            , dangerouslySetInnerHTML: {
              __html: '#' + this._instanceId + ' + * { display: none !important; }'
            }
          }),
          _react2.default.createElement('div', {
            id: this._instanceId,
            key: dirtyCount,
            ref: this._handleDivRef,
            style: {
              display: dirty ? 'block' : 'none',
              flexGrow: '1',
              width: '100%',
              height: '100%'
            }
          }),
          typeof availableSize !== 'undefined' && _react2.default.createElement(Component, _extends({
            availableSize: availableSize
          }, this.props))
        );
      }
    }]);

    return _class;
  }(_react.PureComponent);
}
module.exports = exports['default'];