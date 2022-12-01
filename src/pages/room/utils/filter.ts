/**
 * 针对字符比较大的字段进行过滤，防止数据过大导致部分浏览器崩溃
 * @param result
 */
export const filterBigData = (result: unknown): string => {
  return JSON.stringify(result, (key, value) => {
    if (typeof value === 'string' && value.length > 10) {
      return null;
    }
    return value;
  });
};
