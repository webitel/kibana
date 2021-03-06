'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KuiTextArea = exports.TEXTAREA_SIZE = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const sizeToClassNameMap = {
  small: 'kuiTextArea--small',
  medium: undefined,
  large: 'kuiTextArea--large'
};

const TEXTAREA_SIZE = exports.TEXTAREA_SIZE = Object.keys(sizeToClassNameMap);

const KuiTextArea = (_ref) => {
  let className = _ref.className,
      onChange = _ref.onChange,
      isInvalid = _ref.isInvalid,
      isNonResizable = _ref.isNonResizable,
      isDisabled = _ref.isDisabled,
      size = _ref.size,
      rest = _objectWithoutProperties(_ref, ['className', 'onChange', 'isInvalid', 'isNonResizable', 'isDisabled', 'size']);

  const classes = (0, _classnames2.default)('kuiTextArea', className, {
    'kuiTextArea-isInvalid': isInvalid,
    'kuiTextArea--nonResizable': isNonResizable
  }, sizeToClassNameMap[size]);

  return _react2.default.createElement('textarea', _extends({
    className: classes,
    onChange: onChange,
    disabled: isDisabled
  }, rest));
};

exports.KuiTextArea = KuiTextArea;
KuiTextArea.defaultProps = {
  isInvalid: false,
  isNonResizable: false,
  isDisabled: false,
  size: 'medium'
};

KuiTextArea.propTypes = {
  className: _propTypes2.default.string,
  onChange: _propTypes2.default.func.isRequired,
  isInvalid: _propTypes2.default.bool,
  isNonResizable: _propTypes2.default.bool,
  isDisabled: _propTypes2.default.bool,
  size: _propTypes2.default.oneOf(TEXTAREA_SIZE)
};
