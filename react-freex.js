import React, { createContext, useReducer, useEffect } from 'react'
/** v0.3.3 */
const fx = {}
const Providers = []
const FreexProvider = props => {
  return Providers.reduceRight((BP, AP) => <AP>{BP}</AP>, props.children)
}
const createProviders = store => {
  const _store = store
  let providerValue = {}
  let isSave = false
  const saves = {}
  const fxStorage = localStorage.fx
  const jsonFxStorage = fxStorage ? JSON.parse(fxStorage) : {}
  for (const key in _store) {
    const store = _store[key]
    const state = {}
    const storage = jsonFxStorage[key] || {}
    const _dispatch = {
      state,
      fn: null,
    }
    for (const skey in store) {
      const cur = store[skey]
      if (typeof cur === 'function') {
        if (/^_{2}/.test(skey)) {
          const rpSkey = skey.replace(/^_{2}/, '')
          state[rpSkey] = cur.call(state)
          if (state.__getters) {
            state.__getters[rpSkey] = cur
          } else {
            state.__getters = {}
            state.__getters[rpSkey] = cur
          }
        } else {
          state[skey] = (...args) =>
            _dispatch.fn(cur.apply(_dispatch.state, args))
        }
      } else {
        if (/^\$/.test(skey)) {
          const afterKey = skey.substr(1, skey.length - 1)
          const save = saves[key]
          const stor = storage[afterKey]
          !isSave && (isSave = true)
          if (save) save = { ...save, [afterKey]: cur }
          else saves[key] = { [afterKey]: cur }
          if (stor !== undefined) state[afterKey] = stor
          else state[afterKey] = cur
        } else {
          state[skey] = cur
        }
      }
    }
    fx[key] = createContext()
    Object.defineProperty(state, '$fx', {
      get() {
        return providerValue
      },
      enumerable: true,
    })
    Providers.push(props => {
      const Fx = fx[key]
      let pVal = {}
      const reFunc = (_, result) => {
        const getters = result.__getters
        _dispatch.state = result
        if (isSave) {
          for (const svkey in saves[key]) {
            saves[key][svkey] = result[svkey]
          }
          localStorage.setItem('fx', JSON.stringify(saves))
        }
        if (getters) {
          for (const key in getters) {
            const rpKey = key.replace(/^_{2}/, '')
            result[rpKey] = getters[rpKey].call(result)
          }
        }
        return result
      }
      const [reducer, dispatch] = useReducer(reFunc, state)
      providerValue[key] = reducer
      pVal = providerValue[key]
      useEffect(() => {
        pVal.$set = (key, val) =>
          dispatch({
            ...pVal,
            [key]: val,
          })
        _dispatch.fn = dispatch
      }, [])
      return <Fx.Provider value={pVal}>{props.children}</Fx.Provider>
    })
  }
}
export default createProviders
export { fx, FreexProvider }
