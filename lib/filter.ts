export type FilterWords = Record<
  string,
  {
    reservedSize?: number;
  }
>;

export const getReg = (filterSensitiveData: FilterWords) => {
  const words = Object.keys(filterSensitiveData).join('|');
  const jsonReg = new RegExp(`(${words})"\\s*:\\s*"([\\w-]+)"`, 'g');
  const urlReg = new RegExp(`(${words})=([\\w-]+)&?`, 'g');
  return { jsonReg, urlReg };
};

/** 替换敏感数据 */
export function replaceSensitiveData(
  msg: string,
  filterSensitiveData: FilterWords
): string {
  const { urlReg, jsonReg } = getReg(filterSensitiveData);

  let resultMsg = msg;

  const replace = (replaceStr?: string, reservedSize = 12) => {
    const half = Math.floor(reservedSize / 2);
    if (replaceStr) {
      resultMsg = resultMsg.replace(
        replaceStr,
        `${replaceStr.slice(0, half)}********${replaceStr.slice(
          replaceStr.length - half
        )}`
      );
    }
  };

  let result = urlReg.exec(msg);
  while (result) {
    const word = result[1];
    const latest = result[result.length - 1];
    replace(
      latest,
      filterSensitiveData[word as keyof FilterWords]?.reservedSize
    );
    result = urlReg.exec(msg);
  }
  result = jsonReg.exec(msg);
  while (result) {
    const word = result[1];
    const latest = result[result.length - 1];
    replace(
      latest,
      filterSensitiveData[word as keyof FilterWords]?.reservedSize
    );
    result = jsonReg.exec(msg);
  }
  return resultMsg;
}
