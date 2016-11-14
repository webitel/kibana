import { get } from 'lodash';

export function isBoom(err) {
  return !!err.isBoom;
}

export function isInvalidCookie(err) {
  return get(err, 'output.payload.message') === 'Invalid cookie';
}

export function isUnauthorized(err) {
  return get(err, 'output.statusCode') === 401;
}
