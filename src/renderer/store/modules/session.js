import workerMgr from '@/worker/manager'
import rootSvc from '@/services/root'
import sessionSvc from '@/services/session'
import * as mt from '@/store/mutation-types'
import router from '@/router'

const LS_KEYCAT_URL_ROOT = 'lsKeyCatUrlRoot'
const LS_KEYCAT_SESSION_DATA = 'lsKeyCatSessionData'

const state = {
  loading: false,
  urlRoot: '',
  sessionToken: ''
}

const mutations = {
  [mt.SESSION_LOAD_STATE_FROM_STORAGE] (state) {
    var urlRoot = localStorage.getItem(LS_KEYCAT_URL_ROOT)
    if( urlRoot === null ) {
      urlRoot = process.env.NODE_ENV === 'development' ? 'http://localhost:23764' : 'https://pen.key.cat/api'
    }
    state.urlRoot = urlRoot
    rootSvc.setUrlRoot(urlRoot)
  },
  [mt.SESSION_SET_URL_ROOT] (state, urlRoot) {
    state.urlRoot = urlRoot
    rootSvc.setUrlRoot(urlRoot)
    localStorage.setItem(LS_KEYCAT_URL_ROOT, urlRoot)
  },
  [mt.SESSION_LOGOUT] (state) {
    state.sessionToken = ''
    rootSvc.setToken(state.sessionToken)
    localStorage.removeItem(LS_KEYCAT_SESSION_DATA)
  },
  [mt.SESSION_LOGIN] (state, payload) {
    state.sessionToken = payload.token
    rootSvc.setToken(state.sessionToken)
  },
  [mt.SESSION_SET_LOADING] (state, loading) {
    state.loading = loading
  }
}

const actions = {
  sessionStoreServerSession (context, payload) {
    var srvKeys = { publicKeys: payload.sessionData.public_key, secretKeys: payload.sessionData.secret_key }
    workerMgr.setKeysFromServer( payload.password, payload.sessionData.store_token, srvKeys ).then((storedKeys) => {
      var sData = { keys: storedKeys, uid: payload.sessionData.user_id, token: payload.sessionData.session_token }
      localStorage.setItem(LS_KEYCAT_SESSION_DATA, JSON.stringify(sData))
      context.commit(mt.SESSION_LOGIN, {token: payload.sessionData.session_token})
      router.push('/home')
    })
  },
  sessionLoadFromLocalStorage (context) {
    context.commit(mt.SESSION_LOAD_STATE_FROM_STORAGE)
    var stub = localStorage.getItem(LS_KEYCAT_SESSION_DATA)
    if( !stub || stub.length === 0 ) {
      context.commit(mt.SESSION_SET_LOADING, false)
      return
    }
    var data = JSON.parse( stub )
    context.commit(mt.SESSION_LOGIN, data)
    console.log('ssessss log')
    sessionSvc.getSessionData(data).then((sessionData) => {
      workerMgr.setKeysFromStore( sessionData.store_token, data.keys ).then((ok) => {
        router.push('/home')
        console.log('ssessss log done')
        context.commit(mt.SESSION_SET_LOADING, false)
      })
    }).catch(() => {
      context.commit(mt.SESSION_LOGOUT)
      context.commit(mt.SESSION_SET_LOADING, false)
    })
  },
  sessionLogout (context) {
    sessionSvc.deleteSession({token: context.state.sessionToken}).then(() => {
      context.commit(mt.SESSION_LOGOUT)
      router.push('/')
    }).catch((err) => {
      context.commit(mt.MSG_ERROR, rootSvc.processError(err))
    })
  }
}

export default {
  state,
  mutations,
  actions
}
