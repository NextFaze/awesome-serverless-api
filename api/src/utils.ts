export function sanitizeIdsForClient(rowId: string, prefix: string) {
  if (!rowId.startsWith(prefix)) {
    throw new Error('Possible misconfiguration of prefix/rowId');
  }
  return rowId.replace(prefix, '');
}
