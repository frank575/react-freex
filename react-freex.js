import React, { createContext, useReducer } from "react";
/** v0.2.0 */
const fx = {};
const Providers = [];
const FreexProvider = props => {
  return Providers.reduceRight((BP, AP) => <AP>{BP}</AP>, props.children);
};
const createProviders = store => {
  const _store = store;
  let providerValue = {};
  let isSave = false;
  const saves = {};
  const fxStorage = localStorage.fx;
  const jsonFxStorage = fxStorage ? JSON.parse(fxStorage) : {};
  for (const key in _store) {
    const store = _store[key];
    const state = {};
    const storage = jsonFxStorage[key] || {};
    let _payload = [];
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
          const save = saves[key];
          const stor = storage[afterKey];
          !isSave && (isSave = true);
          if (save) save = { ...save, [afterKey]: cur };
          else saves[key] = { [afterKey]: cur };
          if (stor !== undefined) state[afterKey] = stor;
          else state[afterKey] = cur;
        } else {
          state[skey] = cur;
        }
      }
    }
    fx[key] = createContext();
    Object.defineProperty(state, "$root", {
      get() {
        return providerValue;
      },
      enumerable: true
    });
    Providers.push(props => {
      const Fx = fx[key];
      let pVal = {};
      const reFunc = (state, action) => {
        const result = action.apply(state, _payload) || state;
        const getters = result.getters;
        if (isSave) {
          for (const svkey in saves[key]) {
            saves[key][svkey] = result[svkey];
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
      const [reducer, dispatch] = useReducer(reFunc, state);
      providerValue[key] = reducer;
      pVal = providerValue[key];
      pVal.dispatch = dispatch;
      return <Fx.Provider value={pVal}>{props.children}</Fx.Provider>;
    });
  }
};
export default createProviders;
export { fx, FreexProvider };
