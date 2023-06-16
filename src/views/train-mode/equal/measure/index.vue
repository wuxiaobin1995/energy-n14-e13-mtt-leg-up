<!--
 * @Author      : Mr.bin
 * @Date        : 2023-06-16 15:49:43
 * @LastEditTime: 2023-06-16 16:31:26
 * @Description : 等长训练-具体测量
-->
<template>
  <div class="equal-measure">
    <!-- 语音播放 -->
    <audio ref="audio" controls="controls" hidden :src="audioSrc" />

    <div class="wrapper">
      <div class="left">
        <!-- 标题 -->
        <div class="title">
          <el-button
            class="item"
            icon="el-icon-location-information"
            type="info"
            round
            >等长训练</el-button
          >
        </div>
        <!-- 按钮组 -->
        <div class="btn">
          <div>【部位：{{ trainPart }}】</div>
          <div>
            【负重：{{ parseFloat((bearWeightNum * 2.5).toFixed(1)) }}kg】
          </div>
          <el-button
            class="item"
            type="primary"
            :disabled="isStart"
            @click="handleStart"
            >开始训练</el-button
          >
          <el-button class="item" type="info" @click="handleRefresh"
            >刷新页面</el-button
          >
          <el-button class="item" type="danger" @click="handleExit"
            >退出订单</el-button
          >
        </div>
      </div>

      <div class="right">
        <div class="top">
          <div class="both-press" v-if="trainPart === '双腿' ? true : false">
            <div class="text">双侧实时压力变化</div>
            <div class="press">
              <div :style="activeLeft" class="left-press">{{ leftWeight }}</div>
              <div :style="activeRight" class="right-press">
                {{ rightWeight }}
              </div>
            </div>
          </div>

          <div class="num-wrapper">
            <div class="title">剩余次数</div>
            <div class="num">
              <span class="now-num">{{ nowNum }}</span> / {{ num }}
            </div>
          </div>
        </div>
        <div class="chart">
          <div id="chart" :style="{ width: '100%', height: '100%' }"></div>
        </div>
      </div>
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
  name: 'equal-measure',

  data() {
    return {
      /* 语音相关 */
      audioOpen: this.$store.state.voiceSwitch,
      audioSrc: path.join(__static, `narrate/mandarin/Train/等长训练.mp3`),

      /* 串口相关变量 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200, // 默认波特率115200

      /* 图形相关变量 */
      myChart: null,
      option: {},
      xData: [], // 横坐标数组

      /* 控制类 */
      isStart: false, // 是否开始
      isUp: false, // 是否在直线上

      /* 其他 */
      num: this.$store.state.settings[0].num, // 次数
      nowNum: 0, // 实时的次数
      bearWeightNum: this.$store.state.settings[0].bearWeightNum, // 负重块数量（2.5kg/块）
      trainPart: this.$store.state.settings[0].trainPart, // 训练部位（左腿、右腿、双腿）

      activeLeft: {}, // 左侧实时压力边框红色高亮
      activeRight: {}, // 右侧实时压力边框红色高亮

      leftK: 0, // 左K
      rightK: 0, // 右K
      leftStandard: 0, // 左调零值
      rightStandard: 0, // 右调零值

      leftWeight: 0, // 左负重（kg），精确到0.1kg
      rightWeight: 0, // 右负重（kg），精确到0.1kg
      addWeight: 0, // 左右合计负重（kg），精确到0.1kg
      leftWeightArray: [], // 左负重数组
      rightWeightArray: [], // 右负重数组
      addWeightArray: [], // 左右合计负重数组

      showWeight: 0, // 展示的负重（kg）

      /* 参考曲线 */
      showWeightArray: [] // 展示的负重数组
    }
  },

  created() {
    this.leftK = parseFloat(window.localStorage.getItem('leftK'))
    this.rightK = parseFloat(window.localStorage.getItem('rightK'))
    this.leftStandard = this.$store.state.zeroStandard.leftStandard
    this.rightStandard = this.$store.state.zeroStandard.rightStandard

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
    // 关闭串口
    if (this.usbPort) {
      if (this.usbPort.isOpen) {
        this.usbPort.close()
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
            this.usbPort.on('open', () => {})
            /* 调用 this.usbPort.open() 失败时触发（开启串口失败） */
            this.usbPort.on('error', () => {
              this.$alert(
                `请重新连接USB线，然后点击"刷新页面"按钮，重新训练！`,
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

              /* 计算左负重、右负重，精确到0.1kg */
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

                  /* 左右负重提示部分 */
                  // 左右负重，任意一个大于设定的值时有提示
                  let maxVal = parseFloat(
                    (this.leftWeight + this.rightWeight) * 0.55
                  )
                  // 偏大的显示红色边框
                  if (this.leftWeight > maxVal) {
                    this.activeLeft = {
                      border: '2px solid red'
                    }
                    this.activeRight = {}
                  } else if (this.rightWeight > maxVal) {
                    this.activeRight = {
                      border: '2px solid red'
                    }
                    this.activeLeft = {}
                  } else {
                    this.activeLeft = {}
                    this.activeRight = {}
                  }

                  /* 实时渲染图形 */
                  if (this.trainPart === '左腿') {
                    this.showWeight = this.leftWeight
                    this.showWeightArray.push(this.showWeight)
                    this.option.series[0].data = this.showWeightArray
                  } else if (this.trainPart === '右腿') {
                    this.showWeight = this.rightWeight
                    this.showWeightArray.push(this.showWeight)
                    this.option.series[0].data = this.showWeightArray
                  } else if (this.trainPart === '双腿') {
                    this.showWeight = this.addWeight
                    this.showWeightArray.push(this.showWeight)
                    this.option.series[0].data = this.showWeightArray
                  }
                  if (this.showWeightArray.length > 100) {
                    this.showWeightArray = []
                    this.option.series[0].data = this.showWeightArray
                  }
                  this.myChart.setOption(this.option)

                  /* 判断完成次数逻辑 */
                  // 此时向上穿过参考曲线
                  if (this.showWeight > this.bearWeightNum * 2.5) {
                    this.isUp = true
                  }
                  if (this.isUp) {
                    // 此时向下穿过参考曲线
                    if (this.showWeight < this.bearWeightNum * 2.5) {
                      this.isUp = false
                      this.nowNum += 1
                    }
                  }

                  /* 训练完成 */
                  if (this.nowNum === this.num) {
                    this.finishData()
                  }
                }
              }
            })
          } else {
            this.$getLogger('没有检测到USB连接')
            this.$alert(
              `请重新连接USB线，然后点击"刷新页面"按钮，重新训练！`,
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
            `${err}。请重新连接USB线，然后点击"刷新页面"按钮，重新训练！`,
            '初始化SerialPort.list失败',
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
      const referenceLine = []
      for (let i = 0; i < 101; i++) {
        this.xData.push(parseFloat((i * 0.1).toFixed(1)))
        referenceLine.push(this.bearWeightNum * 2.5)
      }

      this.myChart = this.$echarts.init(document.getElementById('chart'))
      this.option = {
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
          max: this.bearWeightNum * 2.5 * 1.5
        },
        // tooltip: {},
        series: [
          {
            data: [],
            type: 'line',
            name: '轨迹曲线',
            lineStyle: {
              color: 'rgba(255, 0, 0, 1)'
            },
            smooth: true,
            showSymbol: false
          },
          {
            data: referenceLine,
            type: 'line',
            name: '参考曲线',
            smooth: false,
            showSymbol: false,
            lineStyle: {
              opacity: 0.8
            }
          }
        ],
        animation: false
      }

      this.myChart.setOption(this.option)
    },

    /**
     * @description: 开始按钮
     */
    handleStart() {
      this.isStart = true

      if (this.usbPort) {
        if (!this.usbPort.isOpen) {
          this.usbPort.open()
        }
      }
    },

    /**
     * @description: 完成该项目
     */
    finishData() {
      /* 关闭串口通信 */
      if (this.usbPort) {
        if (this.usbPort.isOpen) {
          this.usbPort.close()
        }
      }

      /* 计算左、右负重平均值kg */
      let leftWeightAverage = 0 // 左负重平均值
      if (this.leftWeightArray.length) {
        // 左负重平均值
        leftWeightAverage = parseFloat(
          (
            this.leftWeightArray.reduce((acc, curr) => acc + curr) /
            this.leftWeightArray.length
          ).toFixed(1)
        )
      }
      let rightWeightAverage = 0 // 右负重平均值
      if (this.rightWeightArray.length) {
        rightWeightAverage = parseFloat(
          (
            this.rightWeightArray.reduce((acc, curr) => acc + curr) /
            this.rightWeightArray.length
          ).toFixed(1)
        )
      }

      /* 删除 Vuex 参数配置数组的第一个元素 */
      let settings = JSON.parse(JSON.stringify(this.$store.state.settings))
      settings.shift()
      this.$store.dispatch('setSettings', settings).then(() => {
        /* 数据 */
        const obj = {
          pattern: '等长训练',
          side: this.affectedSide, // 患侧（左腿、右腿）
          num: this.num, // 次数
          trainPart: this.trainPart, // 训练部位（左腿、右腿、双腿）
          bearWeightNum: this.bearWeightNum, // 负重块数量（2.5kg/块）
          leftWeightArray: JSON.stringify(this.leftWeightArray), // 左侧负重数组
          rightWeightArray: JSON.stringify(this.rightWeightArray), // 右侧负重数组
          addWeightArray: JSON.stringify(this.addWeightArray), // 左右合计负重数组
          leftWeightAverage: leftWeightAverage, // 左侧负重平均值
          rightWeightAverage: rightWeightAverage // 右侧负重平均值
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
    },

    /**
     * @description: 完成订单或者下一项
     */
    handleFinish() {
      if (this.$store.state.settings.length) {
        // 下一项
        let route = ''
        switch (this.$store.state.settings[0].pattern) {
          case '基础训练':
            route = 'basics-measure'
            break
          case '进阶训练':
            route = 'advance-measure'
            break
          case '离心训练':
            route = 'offcenter-measure'
            break
          case '等长训练':
            route = 'equal-measure'
            break
          case '自定义训练':
            route = 'custom-measure'
            break
          default:
            break
        }

        this.$router.push({
          path: '/' + route
        })
      } else {
        // 完成订单
        this.$router.push({
          path: '/train-send'
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
          routerName: JSON.stringify('/equal-measure'),
          duration: JSON.stringify(300)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.equal-measure {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 96%;
    height: 96%;
    border-radius: 20px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    padding: 20px;
    @include flex(row, space-between, stretch);

    .left {
      position: relative;
      width: 15%;
      .title {
        position: absolute;
        left: -70px;
        top: -15px;
        @include flex(row, center, center);
        .item {
          width: 200px;
          font-size: 26px;
        }
      }
      .btn {
        height: 100%;
        width: 100%;
        @include flex(column, flex-end, center);
        .item {
          margin: 20px 0 0 0;
          width: 190px;
        }
      }
    }

    .right {
      flex: 1;
      @include flex(column, stretch, center);
      .top {
        width: 100%;
        height: 80px;
        border: 1px solid rgb(140, 180, 134);
        box-shadow: 0 0 6px #929292;
        border-radius: 16px;
        @include flex(row, space-around, center);
        padding-bottom: 5px;
        .both-press {
          @include flex(column, center, center);
          .text {
            font-size: 22px;
            margin-bottom: 5px;
          }
          .press {
            @include flex(row, center, center);
            .left-press,
            .right-press {
              @include flex(row, center, center);
              border: 2px solid rgba(0, 0, 0, 0.5);
              border-radius: 10px;
              padding: 4px 10px;
              width: 70px;
              margin: 0 10px;
            }
          }
        }
        .num-wrapper {
          @include flex(column, center, center);
          .title {
            font-size: 22px;
            margin-bottom: 5px;
          }
          .num {
            font-size: 18px;
            .now-num {
              background-color: rgba(155, 155, 155, 0.6);
              border-radius: 4px;
              padding: 2px 10px;
            }
          }
        }
      }
      .chart {
        flex: 1;
        width: 100%;
      }
    }
  }
}
</style>
