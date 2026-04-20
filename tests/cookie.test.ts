import { beforeEach, describe, expect, it } from 'vitest';

import { getDomainCookie, storeCookie } from '@/utils/cookie';

describe('cookie domain matching', () => {
  beforeEach(() => {
    storeCookie([]);
  });

  it('includes parent-domain cookies for a subdomain request', () => {
    storeCookie([
      {
        domain: '.baidu.com',
        name: 'baidu_session',
        value: 'session-token',
      },
      {
        domain: '.baidu.com',
        name: '_baidu_trace',
        value: 'trace-token',
      },
    ]);

    expect(getDomainCookie('tieba.baidu.com')).toBe(
      'baidu_session=session-token; _baidu_trace=trace-token; ',
    );
  });

  it('merges exact-domain and parent-domain cookies for the same request host', () => {
    storeCookie([
      {
        domain: 'tieba.baidu.com',
        name: 'tieba_only',
        value: '1',
      },
      {
        domain: '.baidu.com',
        name: '_baidu_trace',
        value: '2',
      },
    ]);

    expect(getDomainCookie('tieba.baidu.com')).toBe(
      'tieba_only=1; _baidu_trace=2; ',
    );
  });
});
