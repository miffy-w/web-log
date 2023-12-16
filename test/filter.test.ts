// run script: npx ts-node filter.test.ts

import { replaceSensitiveData, getReg } from '../lib/filter';

const data = {
  securityKey: 'deguidhwkllfdlewqdlqhskjwqhd1237829137981gcasbjwbkwkbew',
  token: 'deguid-hwkllfdl-ewqdlqhsk-jwqhd12378-29137981-gcasbjwbk-wkbew',
  name: 'ming',
  age: 24,
};

const skHalfLen = 8;
const tkHalfLen = 4;

const config = {
  securityKey: { reservedSize: skHalfLen * 2 },
  token: { reservedSize: tkHalfLen * 2 },
};

const filter = replaceSensitiveData(JSON.stringify(data), config);

const testReg = (content: string, word: string, halfLen: number) => {
  const reg = new RegExp(
    `${word.slice(0, halfLen)}[\\*]{4,}${word.slice(word.length - halfLen)}`
  );
  return reg.test(content);
};

const urlEncodeStr = Object.keys(data).reduce((acc, key) => {
  acc += `&${key}=${data[key as keyof typeof data]}`;
  return acc;
}, '');

const dataUrl = replaceSensitiveData(urlEncodeStr, config);

console.log(
  '是否过滤了 data.securityKey 的值:',
  testReg(filter, data.securityKey, skHalfLen),
  filter
);

console.log(
  '是否过滤了 data.token 的值:',
  testReg(filter, data.token, tkHalfLen),
  filter
);

console.log(
  '是否过滤了 dataUrl securityKey 的值:',
  testReg(dataUrl, data.securityKey, skHalfLen),
  dataUrl
);

console.log(
  '是否过滤了 dataUrl token 的值:',
  testReg(dataUrl, data.token, tkHalfLen),
  dataUrl
);

const { urlReg, jsonReg } = getReg(config);
const _urlReg = /(securityKey|token)=([\w-]+)&?/g;
const _jsonReg = /(securityKey|token)"\s*:\s*"([\w-]+)"/g;

console.log(
  'urlReg 生成是否符合预期:',
  urlReg.toString() === _urlReg.toString()
);
console.log(
  'jsonReg 生成是否符合预期:',
  jsonReg.toString() === _jsonReg.toString()
);
