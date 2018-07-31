import rootSvc from '@/services/root'
import teamSvc from '@/services/team'
import workerMgr from '@/worker/manager'
import * as mt from '@/store/mutation-types'
import Vue from 'vue'
import { DateTime } from 'luxon'
import SecretData from '@/classes/secret-data'

const state = () => {
  return {
    secrets: {}
  }
}

const mutations = {
  [mt.SECRET_SET] (state, {teamId, secret, openData}) {
    var sid = `${teamId}.${secret.vault}.${secret.id}`
    var sd = new SecretData()
    sd.fromJson(openData)
    Vue.set(state.secrets, sid, {
      id: secret.id,
      vaultId: secret.vault,
      teamId: teamId,
      fullId: sid,
      data: openData,
      closed: secret.data,
      createdAt: DateTime.fromISO(secret.created_at),
      updatedAt: DateTime.fromISO(secret.updated_at),
      vaultVersion: secret.vault_version
    })
  },
  [mt.SECRET_UNSET] (state, {teamId, vaultId, secretId}) {
    var sid = `${teamId}.${vaultId}.${secretId}`
    Vue.delete(state.secrets, sid)
  }
}

function filterPass( secret, filter ) {
  if( filter.labels.length > 0 ) {
    var found = secret.data.labels.filter( label => {
      return filter.labels.indexOf(label) > -1
    }).length > 0
    if( !found ) {
      return false
    }
  }
  if( filter.teams.length > 0 ) {
    if( filter.teams.indexOf(secret.teamId) === -1 ) {
      return false
    }
  }
  if( filter.vaults.length > 0 ) {
    if( filter.vaults.indexOf( `${secret.teamId}/${secret.vaultId}` ) === -1 ) {
      return false
    }
  }
  return ( filter.search.length === 0 || ( secret.data.name || '' ).toLowerCase().indexOf( filter.search.toLowerCase() ) > -1 )
}

const getters = {
  filteredSecrets: state => {
    return filter => {
      var filtered = []
      for( var sid in state.secrets ) {
        if( filterPass( state.secrets[sid], filter ) ) {
          filtered.push( state.secrets[sid] )
        }
      }
      return filtered
    }
  }
}

var gVKeys = {}

function getVaultKeyFromList( vaults, tid, vid ) {
  var key = `${tid}.${vid}`
  if( !(key in gVKeys) ) {
    vaults.forEach((vault) => {
      if( vid === vault.id ) {
        gVKeys[key] = {
          publicKeys: vault.public_key,
          secretKeys: vault.key
        }
      }
    })
  }
  return gVKeys[key]
}

const actions = {
  loadSecretsFromTeam(context, { teamId, vaults }) {
    teamSvc.loadSecrets(teamId).then((resp) => {
      resp.secrets.forEach((secret) => {
        var vKeys = getVaultKeyFromList( vaults, teamId, secret.vault )
        workerMgr.openAndDeserialize(vKeys, secret.data).then((data) => {
          context.commit(mt.SECRET_SET, {teamId: teamId, secret: secret, openData: data})
        })
      })
    })
  },
  create(context, { teamId, vaultId, secretData }) {
    var vKeys = {}
    context.rootState[`team.${teamId}`].vaults.forEach((v) => {
      if ( v.id === vaultId ) {
        vKeys.publicKeys = v.public_key
        vKeys.secretKeys = v.key
      }
    })
    workerMgr.serializeAndClose(vKeys, secretData).then((data) => {
      teamSvc.createSecret(teamId, vaultId, data).then((secret) => {
        workerMgr.openAndDeserialize(vKeys, secret.data).then((openData) => {
          context.commit(mt.SECRET_SET, {teamId: teamId, secret: secret, openData: data})
        })
      }).catch((err) => {
        context.commit(mt.MSG_ERROR, rootSvc.processError(err))
      })
    })
  },
  delete(context, { teamId, vaultId, secretId }) {
    teamSvc.deleteSecret(teamId, vaultId, secretId).then((resp) => {
      context.commit(mt.SECRET_UNSET, {teamId: teamId, vaultId: vaultId, secretId: secretId})
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters,
  actions
}
