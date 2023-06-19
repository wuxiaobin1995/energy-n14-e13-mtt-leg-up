<!--
 * @Author      : Mr.bin
 * @Date        : 2023-06-15 16:56:39
 * @LastEditTime: 2023-06-19 15:14:11
 * @Description : 下肢测试-具体测量
-->
<template>
  <div class="lower-limb-measure">
    <!-- 语音播放 -->
    <audio ref="audio" controls="controls" hidden :src="audioSrc" />

    <div class="wrapper">
      <!-- 顶部栏 -->
      <el-page-header
        class="page"
        title="退出订单"
        content="下肢测试"
        @back="handleExit"
      ></el-page-header>

      <!-- 左区域 -->
      <div class="left">
        <!-- 图形 -->
        <div class="chart">
          <div id="chart" :style="{ width: '100%', height: '100%' }"></div>
        </div>
        <!-- 按钮 -->
        <div class="btn">
          <el-button
            class="item"
            type="success"
            round
            :disabled="testValueArray.length === 3 || isStart ? true : false"
            @click="handleStart"
            >开始测量</el-button
          >
        </div>
      </div>

      <div class="divider"></div>

      <!-- 右区域 -->
      <div class="right">
        <!-- 倒计时 -->
        <div class="time">
          <el-image class="img" :src="timeBgSrc" fit="scale-down"></el-image>
          <div class="text">倒计时</div>
          <div class="value">{{ nowTime }}</div>
        </div>

        <!-- 测量结果 -->
        <div class="result">
          <el-image :src="testValueSrc" fit="scale-down"></el-image>
          <div class="title">测量数值</div>
          <div class="item1">
            <el-input class="value" v-model="testValueArray[0]" disabled>
              <template slot="prepend">1</template>
            </el-input>
          </div>
          <div class="item2">
            <el-input class="value" v-model="testValueArray[1]" disabled>
              <template slot="prepend">2</template>
            </el-input>
          </div>
          <div class="item3">
            <el-input class="value" v-model="testValueArray[2]" disabled>
              <template slot="prepend">3</template>
            </el-input>
          </div>
        </div>

        <!-- 其他按钮组 -->
        <div class="btn">
          <el-button class="item" type="primary" round @click="handleRefresh"
            >刷新页面</el-button
          >
        </div>
      </div>

      <!-- 示意图弹窗 -->
      <el-dialog
        :title="dialogTitle"
        :visible.sync="centerDialogVisible"
        width="30%"
        top="25vh"
        :show-close="false"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        center
      >
        <div class="dialog-content">
          <el-image
            v-if="
              (this.$store.state.testSelection[0] === '优势' &&
                affectedSide === '右腿') ||
              (this.$store.state.testSelection[0] === '劣势' &&
                affectedSide === '左腿')
            "
            class="img"
            :src="leftLegSrc"
            fit="scale-down"
          ></el-image>
          <el-image
            v-else-if="
              (this.$store.state.testSelection[0] === '优势' &&
                affectedSide === '左腿') ||
              (this.$store.state.testSelection[0] === '劣势' &&
                affectedSide === '右腿')
            "
            class="img"
            :src="rightLegSrc"
            fit="scale-down"
          ></el-image>
          <el-image
            v-else-if="this.$store.state.testSelection[0] === '双'"
            class="img"
            :src="bothLegSrc"
            fit="scale-down"
          ></el-image>
        </div>
        <span slot="footer">
          <el-button
            type="success"
            plain
            round
            icon="el-icon-circle-check"
            @click="centerDialogVisible = false"
            >确 认</el-button
          >
        </span>
      </el-dialog>
    </div>
  </div>
</template>

<script>
/* 路径模块 */
import path from 'path'

/* 串口通信库 */
import SerialPort from 'serialport'
import Readline from '@serialport/parser-readline'

export default {
  name: 'lower-limb-measure',

  data() {
    return {
      /* 语音相关 */
      audioOpen: this.$store.state.voiceSwitch,
      audioSrc: path.join(__static, `narrate/mandarin/Test/优势腿具体测试.mp3`),

      leftLegSrc: require('@/assets/img/Test/Measure/左腿蹬伸示意图.png'),
      rightLegSrc: require('@/assets/img/Test/Measure/右腿蹬伸示意图.png'),
      bothLegSrc: require('@/assets/img/Test/Measure/双腿蹬伸示意图.png'),
      timeBgSrc: require('@/assets/img/Test/Measure/倒计时背景.png'),
      testValueSrc: require('@/assets/img/Test/Measure/测量数值背景.png'),
      centerDialogVisible: true, // 弹窗显隐

      /* 按钮禁用控制 */
      isStart: false,

      /* 串口相关变量 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200, // 默认波特率115200

      /* 图形相关变量 */
      myChart: null,
      option: {},
      xData: [], // 横坐标数组

      /* 其他 */
      timeClock: null, // 计时器
      time: 10, // 倒计时，默认10秒
      nowTime: 10, // 实时倒计时

      leftK: 0, // 左K
      rightK: 0, // 右K
      leftStandard: 0, // 左调零值
      rightStandard: 0, // 右调零值
      affectedSide: this.$store.state.settings[0].side, // 患侧

      leftWeight: 0, // 左负重（kg），精确到0.1kg
      rightWeight: 0, // 右负重（kg），精确到0.1kg
      addWeight: 0, // 左右合计负重（kg），精确到0.1kg
      leftWeightArray: [], // 左负重数组
      rightWeightArray: [], // 右负重数组
      addWeightArray: [], // 左右合计负重数组

      /* 结果相关 */
      testValueArray: [] // 该项目测量值数组
    }
  },

  created() {
    this.leftK = parseFloat(window.localStorage.getItem('leftK'))
    this.rightK = parseFloat(window.localStorage.getItem('rightK'))
    this.leftStandard = this.$store.state.zeroStandard.leftStandard
    this.rightStandard = this.$store.state.zeroStandard.rightStandard

    if (this.$store.state.testSelection[0] === '优势') {
      this.audioSrc = path.join(
        __static,
        `narrate/mandarin/Test/优势腿具体测试.mp3`
      )
    } else if (this.$store.state.testSelection[0] === '劣势') {
      this.audioSrc = path.join(
        __static,
        `narrate/mandarin/Test/劣势腿具体测试.mp3`
      )
    } else {
      this.audioSrc = path.join(
        __static,
        `narrate/mandarin/Test/双腿具体测试.mp3`
      )
    }

    this.initSerialPort()
  },
  mounted() {
    if (this.audioOpen === true) {
      setTimeout(() => {
        this.$refs.audio.currentTime = 0
        this.$refs.audio.play()
      }, 500)
    }

    this.initChart()
  },
  beforeDestroy() {
    // 清除计时器
    if (this.timeClock) {
      clearInterval(this.timeClock)
    }
    // 关闭串口
    if (this.usbPort) {
      if (this.usbPort.isOpen) {
        this.usbPort.close()
      }
    }
  },

  computed: {
    /* 弹窗的标题 */
    dialogTitle() {
      if (this.$store.state.testSelection[0] === '优势') {
        if (this.affectedSide === '左腿') {
          return '优势腿(右)蹬伸等长肌力测试示意图'
        } else if (this.affectedSide === '右腿') {
          return '优势腿(左)蹬伸等长肌力测试示意图'
        }
      } else if (this.$store.state.testSelection[0] === '劣势') {
        if (this.affectedSide === '左腿') {
          return '劣势腿(左)蹬伸等长肌力测试示意图'
        } else if (this.affectedSide === '右腿') {
          return '劣势腿(右)蹬伸等长肌力测试示意图'
        }
      } else if (this.$store.state.testSelection[0] === '双') {
        return '双腿蹬伸等长肌力测试示意图'
      }
    },

    /* 用于区分左、右、双腿 */
    whichLeg() {
      if (this.$store.state.testSelection[0] === '优势') {
        if (this.affectedSide === '左腿') {
          return '(右)'
        } else if (this.affectedSide === '右腿') {
          return '(左)'
        }
      } else if (this.$store.state.testSelection[0] === '劣势') {
        if (this.affectedSide === '左腿') {
          return '(左)'
        } else if (this.affectedSide === '右腿') {
          return '(右)'
        }
      } else if (this.$store.state.testSelection[0] === '双') {
        return ''
      }
    }
  },

  methods: {
    /**
     * @description: 退出订单
     */
    handleExit() {
      this.$confirm(
        '订单进行中，此操作会退出该订单，之前的数据将会丢失，是否退出？',
        '警告',
        {
          type: 'warning',
          showClose: true,
          closeOnClickModal: true,
          closeOnPressEscape: true,
          center: true,
          confirmButtonText: '退 出',
          cancelButtonText: '否'
        }
      )
        .then(() => {
          this.$router.push({
            path: '/home'
          })
        })
        .catch(() => {})
    },

    /**
     * @description: 初始化串口对象
     */
    initSerialPort() {
      SerialPort.list()
        .then(ports => {
          /* 遍历设备的USB串口，目标设备需安装驱动 */
          let comPath = ''
          for (const port of ports) {
            if (/^USB/.test(port.pnpId)) {
              comPath = port.path
              break
            }
          }

          /* 验证USB有没有连接到电脑，但不能验证有无数据发送给上位机 */
          if (comPath) {
            /**
             * @description: 创建串口实例
             * @param {String} comPath 串行端口的系统路径。例如：在Mac、Linux上的/dev/tty.XXX或Windows上的COM1
             * @param {Object} 配置项
             */
            this.usbPort = new SerialPort(comPath, {
              baudRate: this.scmBaudRate, // 默认波特率115200
              autoOpen: false // 是否自动开启串口
            })
            /* 调用 this.usbPort.open() 成功时触发（开启串口成功） */
            this.usbPort.on('open', () => {
              this.isStart = true
              this.timeClock = setInterval(() => {
                this.nowTime -= 1
                if (this.nowTime === 0) {
                  this.handleOver()
                }
              }, 1000)
            })
            /* 调用 this.usbPort.open() 失败时触发（开启串口失败） */
            this.usbPort.on('error', () => {
              this.$alert(
                `请重新连接USB线，然后点击"刷新页面"按钮！`,
                '串口开启失败',
                {
                  type: 'error',
                  showClose: false,
                  center: true,
                  confirmButtonText: '刷新页面',
                  callback: () => {
                    this.handleRefresh()
                  }
                }
              )
            })

            this.parser = this.usbPort.pipe(new Readline({ delimiter: '\n' }))
            this.parser.on('data', data => {
              // console.log(data) // {String} 00326740032826,125

              const dataArray = data.split(',') // 将原始数据以逗号作为分割符，组成一个数组
              const weightDigital = dataArray[0] // 负重数字量，比如00327640032720
              // const distancePulse = dataArray[1] // 位移脉冲量

              /* 计算左负重、右负重、左右合计负重，精确到0.1kg */
              this.leftWeight = parseFloat(
                (
                  (parseInt(weightDigital.slice(2, 7)) - this.leftStandard) /
                  -this.leftK
                ).toFixed(1)
              )
              this.rightWeight = parseFloat(
                (
                  (parseInt(weightDigital.slice(9, 14)) - this.rightStandard) /
                  -this.rightK
                ).toFixed(1)
              )
              this.addWeight = parseFloat(
                (this.leftWeight + this.rightWeight).toFixed(1)
              )
              if (this.leftWeight < 0) {
                this.leftWeight = 0
              }
              if (this.rightWeight < 0) {
                this.rightWeight = 0
              }
              if (this.addWeight < 0) {
                this.addWeight = 0
              }
              /* 数据校验 */
              if (
                !isNaN(this.leftWeight) &&
                !isNaN(this.rightWeight) &&
                !isNaN(this.addWeight)
              ) {
                /* 过滤掉突变值 */
                if (
                  this.leftWeight <= 500 &&
                  this.rightWeight <= 500 &&
                  this.addWeight <= 1000
                ) {
                  /* 数据插入数组中 */
                  this.leftWeightArray.push(this.leftWeight)
                  this.rightWeightArray.push(this.rightWeight)
                  this.addWeightArray.push(this.addWeight)

                  /* 实时渲染图形 */
                  if (this.$store.state.testSelection[0] === '优势') {
                    if (this.affectedSide === '左腿') {
                      this.option.series[0].data = this.rightWeightArray
                    } else if (this.affectedSide === '右腿') {
                      this.option.series[0].data = this.leftWeightArray
                    }
                  } else if (this.$store.state.testSelection[0] === '劣势') {
                    if (this.affectedSide === '左腿') {
                      this.option.series[0].data = this.leftWeightArray
                    } else if (this.affectedSide === '右腿') {
                      this.option.series[0].data = this.rightWeightArray
                    }
                  } else if (this.$store.state.testSelection[0] === '双') {
                    this.option.series[0].data = this.addWeightArray
                  }
                  this.myChart.setOption(this.option)
                }
              }
            })
          } else {
            this.$getLogger('没有检测到USB连接')
            this.$alert(
              `请重新连接USB线，然后点击"刷新页面"按钮，重新测试！`,
              '没有检测到USB连接',
              {
                type: 'error',
                showClose: false,
                center: true,
                confirmButtonText: '刷新页面',
                callback: () => {
                  this.handleRefresh()
                }
              }
            )
          }
        })
        .catch(err => {
          this.$getLogger(err)
          this.$alert(
            `${err}。请重新连接USB线，然后点击"刷新页面"按钮，重新测试！`,
            `初始化SerialPort.list失败`,
            {
              type: 'error',
              showClose: false,
              center: true,
              confirmButtonText: '刷新页面',
              callback: () => {
                this.handleRefresh()
              }
            }
          )
        })
    },

    /**
     * @description: 图形初始化
     */
    initChart() {
      // 计算横坐标数组
      this.xData = []
      for (let i = 0; i < parseInt(this.time * 10); i++) {
        this.xData.push(parseFloat((i * 0.1).toFixed(1)))
      }

      this.myChart = this.$echarts.init(document.getElementById('chart'))
      this.option = {
        title: {
          text: `${this.$store.state.testSelection[0]}腿${this.whichLeg}蹬伸等长肌力测试`,
          left: 'center',
          textStyle: {
            fontSize: 30
          }
        },
        xAxis: {
          type: 'category',
          name: '单位：秒',
          data: this.xData,
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '单位：kg',
          min: 0
          // max: 500
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{c} kg'
        },
        series: [
          {
            data: [' '],
            type: 'line',
            areaStyle: {
              color: 'rgba(174, 217, 206, 1)'
            },
            lineStyle: {
              color: 'rgba(43, 151, 122, 1)'
            },
            markPoint: {
              data: [
                {
                  type: 'max'
                }
              ],
              symbol: 'pin'
            },
            smooth: true,
            showSymbol: false
          }
        ],
        animation: false
      }

      this.myChart.setOption(this.option)
    },

    /**
     * @description: 开始测量按钮
     */
    handleStart() {
      this.leftWeightArray = [0] // 此处保证第一个值是0，为了应付医院
      this.rightWeightArray = [0] // 此处保证第一个值是0，为了应付医院
      this.addWeightArray = [0] // 此处保证第一个值是0，为了应付医院
      this.nowTime = this.time

      if (this.usbPort) {
        if (!this.usbPort.isOpen) {
          this.usbPort.open()
        }
      }
    },

    /**
     * @description: 结束该次测量按钮
     */
    handleOver() {
      if (this.usbPort) {
        if (this.usbPort.isOpen) {
          this.usbPort.close()

          if (this.timeClock) {
            clearInterval(this.timeClock)
          }
          this.nowTime = this.time

          if (this.testValueArray.length <= 2) {
            if (this.$store.state.testSelection[0] === '优势') {
              if (this.affectedSide === '左腿') {
                this.testValueArray.push(Math.max(...this.rightWeightArray))
              } else if (this.affectedSide === '右腿') {
                this.testValueArray.push(Math.max(...this.leftWeightArray))
              }
            } else if (this.$store.state.testSelection[0] === '劣势') {
              if (this.affectedSide === '左腿') {
                this.testValueArray.push(Math.max(...this.leftWeightArray))
              } else if (this.affectedSide === '右腿') {
                this.testValueArray.push(Math.max(...this.rightWeightArray))
              }
            } else if (this.$store.state.testSelection[0] === '双') {
              this.testValueArray.push(Math.max(...this.addWeightArray))
            }
          }

          this.isStart = false

          // 完成项目
          if (this.testValueArray.length === 3) {
            this.finishData()
          }
        }
      }
    },

    /**
     * @description: 完成该项目
     */
    finishData() {
      /* 该项目最终测量结果（取三次的最大值），kg */
      const testResult = Math.max(...this.testValueArray)

      /* 只有不为NaN和不为零，才算完成本项测试 */
      if (isNaN(testResult)) {
        this.$alert(
          `最终计算结果为${testResult}，请检查测量数值是否有误，然后点击“刷新页面”按钮。`,
          `提示`,
          {
            type: 'warning',
            showClose: false,
            center: true,
            confirmButtonText: '刷新页面',
            callback: () => {
              this.handleRefresh()
            }
          }
        )
      } else if (testResult === 0) {
        this.$alert(
          `最终计算结果为0，请检查测量数值是否有误，然后点击“刷新页面”按钮。`,
          `提示`,
          {
            type: 'warning',
            showClose: false,
            center: true,
            confirmButtonText: '刷新页面',
            callback: () => {
              this.handleRefresh()
            }
          }
        )
      } else {
        /* 最新的测试最终结果kg，更新到Vuex中 */
        let testName = ''
        if (this.$store.state.testSelection[0] === '优势') {
          testName = 'goodLegResult'
        } else if (this.$store.state.testSelection[0] === '劣势') {
          testName = 'badLegResult'
        } else if (this.$store.state.testSelection[0] === '双') {
          testName = 'bothLegResult'
        }
        let newResultValue = JSON.parse(
          JSON.stringify(this.$store.state.resultValue)
        )
        newResultValue[`${testName}`] = testResult
        this.$store.dispatch('changeResultValue', newResultValue).then(() => {
          /* 最新的测试项目数组，更新到Vuex中 */
          let newTestSelection = JSON.parse(
            JSON.stringify(this.$store.state.testSelection)
          )
          newTestSelection.shift()
          this.$store
            .dispatch('changeTestSelection', newTestSelection)
            .then(() => {
              /* 3个子项目都测试完成，上传数据 */
              if (this.$store.state.testSelection.length === 0) {
                /* 删除Vuex参数配置数组的第一个元素 */
                let settings = JSON.parse(
                  JSON.stringify(this.$store.state.settings)
                )
                settings.shift()
                this.$store.dispatch('setSettings', settings).then(() => {
                  /* 数据 */
                  const currentAge = this.$moment().diff(
                    this.$store.state.currentUserInfo.birthday,
                    'years'
                  )
                  const obj = {
                    pattern: '下肢测试',
                    side: this.affectedSide, // 患侧（左腿、右腿）
                    currentAge: currentAge, // 完成该次测试时的岁数
                    result: this.$store.state.resultValue // 测试结果
                  }

                  /* 暂存至 sessionStorage */
                  let resultArray = JSON.parse(
                    window.sessionStorage.getItem('resultArray')
                  )
                  resultArray.push(obj)
                  window.sessionStorage.setItem(
                    'resultArray',
                    JSON.stringify(resultArray)
                  )

                  if (this.$store.state.settings.length) {
                    this.$alert(`请点击“下一项”按钮`, '完成', {
                      type: 'success',
                      showClose: false,
                      center: true,
                      confirmButtonText: '下一项',
                      callback: () => {
                        this.handleFinish()
                      }
                    })
                  } else {
                    this.$alert(`请点击“完成订单”按钮`, '完成', {
                      type: 'success',
                      showClose: false,
                      center: true,
                      confirmButtonText: '完成订单',
                      callback: () => {
                        this.handleFinish()
                      }
                    })
                  }
                })
              } else {
                /* 通过刷新来进行下一个子项目的测量（即优势腿、劣势腿、双腿） */
                this.handleRefresh()
              }
            })
        })
      }
    },

    /**
     * @description: 完成订单或者下一项
     */
    handleFinish() {
      if (this.$store.state.settings.length) {
        // 因为这个只有一个测试，所以没有下一项
      } else {
        // 完成订单
        this.$router.push({
          path: '/test-send'
        })
      }
    },

    /**
     * @description: 刷新页面按钮
     */
    handleRefresh() {
      this.$router.push({
        path: '/refresh',
        query: {
          routerName: JSON.stringify('/lower-limb-measure'),
          duration: JSON.stringify(300)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.lower-limb-measure {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 96%;
    height: 96%;
    border-radius: 20px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    position: relative;
    @include flex(row, stretch, stretch);

    .page {
      position: absolute;
      top: 15px;
      left: 30px;
    }

    .left {
      padding: 45px 5px 10px 5px;
      flex: 1;
      @include flex(column, stretch, stretch);
      .chart {
        flex: 1;
      }
      .btn {
        margin-bottom: 16px;
        @include flex(row, center, center);
        .item {
          font-size: 30px;
        }
      }
    }

    .divider {
      border: 1px solid #e0e0e0;
    }

    .right {
      width: 20%;
      @include flex(column, stretch, center);
      // 倒计时
      .time {
        position: relative;
        @include flex(column, center, center);
        transform: scale(0.8);
        .img {
          transform: scale(1.2);
        }
        .text {
          position: absolute;
          top: 6%;
          left: 50%;
          transform: translateX(-50%);
          color: #ffffff;
          font-size: 20px;
        }
        .value {
          position: absolute;
          color: #ffffff;
          font-size: 94px;
        }
      }
      // 测量结果
      .result {
        position: relative;
        @include flex(column, stretch, center);
        .title {
          position: absolute;
          top: 6%;
          color: #ffffff;
          font-size: 28px;
        }
        .item1 {
          position: absolute;
          @include flex(row, center, center);
          top: 22%;
        }
        .item2 {
          position: absolute;
          @include flex(row, center, center);
          top: 40%;
        }
        .item3 {
          position: absolute;
          @include flex(row, center, center);
          top: 58%;
        }
        .value {
          width: 70%;
          font-weight: 700;
          font-size: 22px;
        }
        .confirm-btn {
          position: absolute;
          @include flex(row, center, center);
          top: 75%;
          color: #000000;
          font-weight: 700;
        }
      }
      // 其他按钮组
      .btn {
        width: 80%;
        @include flex(column, center, stretch);
        .item {
          margin: 5px 0;
        }
      }
    }

    /* 示意图弹窗相关 */
    .dialog-content {
      @include flex(row, center, center);
      .img {
        width: 100%;
      }
    }
  }
}
</style>
