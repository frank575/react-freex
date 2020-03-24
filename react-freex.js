import React, { createContext, useReducer, useCallback } from "react";
/** v0.1.0 */
const FreexContext = createContext();
let isSet = false;
let providerValue = {};
const FreexProvider = props => {
  const _store = props.store;
  let isSave = false;
  const saves = {};
  const fxStorage = localStorage.fx;
  const jsonFxStorage = fxStorage ? JSON.parse(fxStorage) : {};
  for (const key in _store) {
    const store = _store[key];
    const state = providerValue;
    const storage = jsonFxStorage[key] || {};
    let _payload = [];
    if (isSet === false) {
      state.$$name = key;
      for (const skey in store) {
        const cur = store[skey];
        if (typeof cur === "function") {
          if (/^_{2}/.test(skey)) {
            state[skey] = cur;
            state[skey.replace(/^_{2}/, "")] = cur.call(state);
            if (state.getters) {
              state.getters.push(skey);
            } else {
              state.getters = [skey];
            }
          } else {
            state[skey] = (...payload) => {
              _payload = payload;
              return cur;
            };
          }
        } else {
          if (/^\$/.test(skey)) {
            const afterKey = skey.substr(1, skey.length - 1);
            !isSave && (isSave = true);
            if (saves[key]) saves[key] = { ...saves[key], [afterKey]: cur };
            else saves[key] = { [afterKey]: cur };
            if (storage[afterKey] !== undefined)
              state[afterKey] = storage[afterKey];
            else state[afterKey] = cur;
          } else {
            state[skey] = cur;
          }
        }
      }
    }
    const reFunc = (state, action) => {
      const result = action.apply(state, _payload) || state;
      const getters = result.getters;
      providerValue[key] = result;
      if (isSave) {
        for (const svkey in saves[key]) {
          saves[key][svkey] = providerValue[key][svkey];
        }
        localStorage.setItem("fx", JSON.stringify(saves));
      }
      if (getters) {
        getters.forEach(e => {
          result[e.replace(/^_{2}/, "")] = result[e].call(result);
        });
      }
      return result;
    };
    const reducer = useReducer(useCallback(reFunc, [store]), state);
    const dispatch = reducer[1];
    providerValue = {
      ...providerValue,
      [key]: reducer[0]
    };
    providerValue[key].dispatch = dispatch;
    state.dispatch = dispatch;
    Object.defineProperty(state, "$root", {
      get() {
        return providerValue;
      },
      enumerable: true
    });
  }
  isSet = true;
  return (
    <FreexContext.Provider value={providerValue}>
      {props.children}
    </FreexContext.Provider>
  );
};
export default FreexProvider;
export const fx = FreexContext;
