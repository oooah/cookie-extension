import { describe, expect, it } from 'vitest';

import { buildRuleTargets } from '@/utils/rules';

describe('rule target expansion', () => {
  it('expands a parent whitelist domain into concrete request targets and excludes child overlaps', () => {
    expect(
      buildRuleTargets(['.baidu.com'], [
        '.baidu.com',
        'tieba.baidu.com',
        'map.baidu.com',
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requestDomain: 'tieba.baidu.com',
          excludedRequestDomains: [],
        }),
        expect.objectContaining({
          requestDomain: 'map.baidu.com',
          excludedRequestDomains: [],
        }),
        expect.objectContaining({
          requestDomain: 'baidu.com',
          excludedRequestDomains: expect.arrayContaining([
            'tieba.baidu.com',
            'map.baidu.com',
          ]),
        }),
      ]),
    );
  });
});
