// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { UrlUtils } from '@laserfiche/lf-js-utils';

export function getEntryWebAccessUrl(
  nodeId: string,
  repoId: string,
  waUrl: string,
  isContainer: boolean
): string | undefined {
  if (nodeId?.length === 0 || repoId?.length === 0 || waUrl?.length === 0) {
    return undefined;
  }
  let newUrl: string = '';
  if (isContainer) {
    const queryParams: UrlUtils.QueryParameter[] = [['repo', repoId]];
    newUrl = UrlUtils.combineURLs(waUrl ?? '', 'Browse.aspx', queryParams);
    newUrl += `#?id=${encodeURIComponent(nodeId)}`;
  } else {
    const queryParams: UrlUtils.QueryParameter[] = [
      ['repo', repoId],
      ['docid', nodeId],
    ];
    newUrl = UrlUtils.combineURLs(waUrl ?? '', 'DocView.aspx', queryParams);
  }
  return newUrl;
}
