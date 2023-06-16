/*
 * @Author      : Mr.bin
 * @Date        : 2023-06-10 11:19:30
 * @LastEditTime: 2023-06-16 09:34:07
 * @Description : Vuex
 */
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    /* 左K、右K调零基准值 */
    zeroStandard: {
      leftStandard: null,
      rightStandard: null
    },

    /* 订单号 */
    orderId: '',

    /* 当前登录的用户及其信息 */
    currentUserInfo: {
      userId: '', // 用户id
      userName: '', // 姓名
      sex: '', // 性别（男、女）
      height: '', // 身高
      weight: '', // 体重
      birthday: '', // 出生日期
      admission: '', // 住院号
      stage: '' // MTT分期类型
    },

    /* 蹬伸的范围位移量mm，用于训练模式的参考曲线 */
    relativeDistance: null,

    /* 下肢测试专用 */
    /* 测试项目数组 */
    testSelection: ['优势', '劣势', '双'],
    /* 测试最终结果，kg */
    resultValue: {
      goodLegResult: null, // 优势腿
      badLegResult: null, // 劣势腿
      bothLegResult: null // 双腿
    },

    /* 参数配置数组 */
    settings: [],

    /* 下一个设备的名称（用于结束后提示下一个设备，增加用户体验） */
    nextDevice: '',

    /* 语音开关 */
    voiceSwitch: true
  },

  mutations: {
    /* 左K、右K调零基准值 */
    SET_ZEROSTANDARD(state, zeroStandard) {
      state.zeroStandard = zeroStandard
    },

    /* 订单号 */
    SET_ORDERID(state, orderId) {
      state.orderId = orderId
    },

    /* 当前登录的用户及其信息 */
    CHANGE_CURRENTUSERINFO(state, currentUserInfo) {
      state.currentUserInfo = currentUserInfo
    },

    /* 蹬伸的范围位移量mm，用于训练模式的参考曲线 */
    SET_RELATIVEDISTANCE(state, relativeDistance) {
      state.relativeDistance = relativeDistance
    },

    /* 测试项目数组 */
    CHANGE_TESTSELECTION(state, testSelection) {
      state.testSelection = testSelection
    },
    /* 测试最终结果，kg */
    CHANGE_RESULTVALUE(state, resultValue) {
      state.resultValue = resultValue
    },

    /* 参数配置数组 */
    SET_SETTINGS(state, settings) {
      state.settings = settings
    },

    /* 下一个设备的名称（用于结束后提示下一个设备，增加用户体验） */
    SET_NEXTDEVICE(state, nextDevice) {
      state.nextDevice = nextDevice
    },

    /* 语音开关 */
    SET_VOICESWITCH(state, voiceSwitch) {
      state.voiceSwitch = voiceSwitch
    }
  },

  actions: {
    /* 左K、右K调零基准值 */
    setZeroStandard({ commit }, zeroStandard) {
      return new Promise((resolve, reject) => {
        commit('SET_ZEROSTANDARD', zeroStandard)
        resolve()
      })
    },

    /* 订单号 */
    setOrderId({ commit }, orderId) {
      return new Promise((resolve, reject) => {
        commit('SET_ORDERID', orderId)
        resolve()
      })
    },

    /* 当前登录的用户及其信息 */
    changeCurrentUserInfo({ commit }, currentUserInfo) {
      return new Promise((resolve, reject) => {
        commit('CHANGE_CURRENTUSERINFO', currentUserInfo)
        resolve()
      })
    },

    /* 蹬伸的范围位移量mm，用于训练模式的参考曲线 */
    setRelativeDistance({ commit }, relativeDistance) {
      return new Promise((resolve, reject) => {
        commit('SET_RELATIVEDISTANCE', relativeDistance)
        resolve()
      })
    },

    /* 测试项目数组 */
    changeTestSelection({ commit }, testSelection) {
      return new Promise((resolve, reject) => {
        commit('CHANGE_TESTSELECTION', testSelection)
        resolve()
      })
    },
    /* 测试最终结果，kg */
    changeResultValue({ commit }, resultValue) {
      return new Promise((resolve, reject) => {
        commit('CHANGE_RESULTVALUE', resultValue)
        resolve()
      })
    },

    /* 参数配置数组 */
    setSettings({ commit }, settings) {
      return new Promise((resolve, reject) => {
        commit('SET_SETTINGS', settings)
        resolve()
      })
    },

    /* 下一个设备的名称（用于结束后提示下一个设备，增加用户体验） */
    setNextDevice({ commit }, nextDevice) {
      return new Promise((resolve, reject) => {
        commit('SET_NEXTDEVICE', nextDevice)
        resolve()
      })
    },

    /* 语音开关 */
    setVoiceSwitch({ commit }, voiceSwitch) {
      return new Promise((resolve, reject) => {
        commit('SET_VOICESWITCH', voiceSwitch)
        resolve()
      })
    }
  }
})
