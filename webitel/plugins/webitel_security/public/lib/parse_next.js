
import { parse } from 'url';

export function parseNext(href, basePath = '') {
    const { query, hash } = parse(href, true);
    if (!query.next) {
        return `${basePath}/`;
    }

    let next = '';
    if (Array.isArray(query.next) && query.next.length > 0) {
        next = query.next[0];
    } else {
        next = query.next;
    }

    const { protocol, hostname, port, pathname } = parse(
        next,
        false /* parseQueryString */,
        true /* slashesDenoteHost */
    );

    if (protocol !== null || hostname !== null || port !== null) {
        return `${basePath}/`;
    }

    if (!String(pathname).startsWith(basePath)) {
        return `${basePath}/`;
    }

    return query.next + (hash || '');
}
