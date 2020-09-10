import { useState, useMemo } from 'react';
import { isObject, isArray } from '../utils/helper';

/**
 *
 * @param initialState 当前代理的对象(嵌套对象)
 * @param callback 每次set的时候触发
 * @param rootObj 根对象
 * @param layerObj 基于root根对象扩展
 * @param immutableState 初始值
 */
function observer<S extends object>(
  initialState: S,
  callback,
  rootObj = {},
  layerObj = rootObj,
  immutableState = initialState,
) {
  return new Proxy<S>(initialState, {
    get(obj, prop, receiver) {
      if (isObject(obj[prop])) {
        let newObj = (layerObj[prop] = {});
        // 传递一个新对象下一层
        return observer(obj[prop], callback, rootObj, newObj, immutableState);
      } else if (isArray(obj[prop])) {
        //  传递当前的数组下一层
        let newObj = (layerObj[prop] = [...obj[prop]]);
        return observer(obj[prop], callback, rootObj, newObj, immutableState);
      } else {
        //  获取数据
        return Reflect.get(obj, prop, receiver);
      }
    },
    set(obj, prop, value, receiver) {
      // 写入当前对象key val
      layerObj[prop] = value;
      callback(Object.assign({}, immutableState, rootObj));
      return Reflect.set(obj, prop, value, receiver);
    },
  });
}

export function useReactive<S extends object>(initialState: S): [S, S] {
  let [immutable, setImmutable] = useState<S>(initialState);

  let proxyState = useMemo<S>(() => {
    return observer(
      initialState,
      (newState) => {
        setImmutable(newState);
      },
      {},
    );
  }, []);

  return [proxyState, immutable];
}