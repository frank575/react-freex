import React, { createContext, useReducer, useCallback } from "react";

const Context = createContext();
const Provider = props => {
  const _store = props.store;
  let providerValue = {};
  let isSave = false;
  const saves = {};
  const fxStorage = localStorage.fx;
  const jsonFxStorage = fxStorage ? JSON.parse(fxStorage) : {};
  for (const key in _store) {
    const store = _store[key];
    const state = {};
    const storage = jsonFxStorage[key] || {};
    let _dispatch = () => {};
    let _payload = [];
    for (const skey in store) {
      const cur = store[skey];
      if (typeof cur === "function") {
        state[skey] = (...payload) => {
          _payload = payload;
          return cur;
        };
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
    const reducer = (state, action) => {
      const result = action.apply(state, _payload) || state;
      providerValue[key][0] = result;
      if (isSave) {
        for (const svkey in saves[key]) {
          saves[key][svkey] = result.$root[key][0][svkey];
        }
        localStorage.setItem("fx", JSON.stringify(saves));
      }
      return result;
    };
    providerValue = {
      ...providerValue,
      [key]: useReducer(useCallback(reducer, [store]), state)
    };
    _dispatch = providerValue[key][1];
    state.dispatch = _dispatch;
    Object.defineProperty(state, "$root", {
      get() {
        return providerValue;
      },
      enumerable: true
    });
  }
  return (
    <Context.Provider value={providerValue}>{props.children}</Context.Provider>
  );
};
export { Provider, Context };
