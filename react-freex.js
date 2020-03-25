import React, { createContext, useReducer, useEffect } from "react";
/** v0.3.0 */
const fx = {};
const Providers = [];
const FreexProvider = props => {
  return Providers.reduceRight((BP, AP) => <AP>{BP}</AP>, props.children);
};
class On {
  constructor(fn, store) {
    this._fn = fn;
    this.store = store;
    this._dispatch = null;
  }
  set dispatch(dispatch) {
    return (this._dispatch = dispatch);
  }
  call(...args) {
    const _dispatch = this._dispatch;
    return _dispatch._fn(this._fn.apply(_dispatch.store, args));
  }
}
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
    const _dispatch = new On(null, state);
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
          const on = new On(cur, null);
          on.dispatch = _dispatch;
          state[skey] = on.call.bind(on);
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
    Object.defineProperty(state, "$fx", {
      get() {
        return providerValue;
      },
      enumerable: true
    });
    Providers.push(props => {
      const Fx = fx[key];
      let pVal = {};
      const reFunc = (_, result) => {
        const getters = result.getters;
        _dispatch.store = result;
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
      useEffect(() => {
        pVal.$set = (key, val) =>
          dispatch({
            ...pVal,
            [key]: val
          });
        _dispatch._fn = dispatch;
      }, []);
      return <Fx.Provider value={pVal}>{props.children}</Fx.Provider>;
    });
  }
};
export default createProviders;
export { fx, FreexProvider };
