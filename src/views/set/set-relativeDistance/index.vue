<!--
 * @Author      : Mr.bin
 * @Date        : 2023-06-15 11:46:52
 * @LastEditTime: 2023-06-15 14:38:08
 * @Description : 设置蹬伸动作范围
-->
<template>
  <div class="set-relativeDistance">
    <div class="wrapper">
      <el-page-header
        class="page"
        title="返回首页"
        content="设置蹬伸动作范围"
        @back="handleToHome"
      ></el-page-header>

      <!-- 文字说明 -->
      <div class="text">
        PS：为设置个性化训练任务，每次开始训练前，请调整坐椅位置，确认训练起始位置后，点击“开始”，蹬伸到最大动作范围后回到起始位置。
      </div>

      <!-- 蹬伸动作范围结果 -->
      <div class="result">
        结果(mm)：<span class="value">{{
          relativeDistance ? relativeDistance : '待测'
        }}</span>
      </div>

      <!-- 图形区 -->
      <div class="chart">
        <div id="chart" :style="{ width: '100%', height: '100%' }"></div>
      </div>

      <!-- 按钮组 -->
      <div class="btn">
        <el-button
          class="item"
          type="primary"
          :disabled="!startAllow"
          @click="handleStart"
          >开 始</el-button
        >
        <el-button class="item" type="danger" @click="handleRefresh"
          >刷新页面</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
/* 串口通信库 */
import SerialPort from 'serialport'
import Readline from '@serialport/parser-readline'

export default {
  name: 'set-relativeDistance',

  data() {
    return {
      /* 串口相关变量 */
      usbPort: null,
      parser: null,
      scmBaudRate: 115200, // 默认波特率115200

      /* 图形相关变量 */
      myChart: null,
      option: {},
      xData: [], // 横坐标数组

      /* 其他 */
      startAllow: true, // 开始按钮的禁用与否

      distanceDataArray: [], // 完整的位移数组
      relativeDistance: 0 // 蹬伸动作范围结果mm
    }
  },

  created() {
    this.initSerialPort()
  },
  mounted() {
    this.initChart()
  },
  beforeDestroy() {
    if (this.usbPort) {
      if (this.usbPort.isOpen) {
        this.usbPort.close()
      }
    }
  },

  methods: {
    /**
     * @description: 回到首页
     */
    handleToHome() {
      this.$router.push({
        path: '/home'
      })
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
              // const weightDigital = dataArray[0] // 负重数字量，比如00327640032720
              const distancePulse = dataArray[1] // 位移脉冲量

              /* 计算拉绳位移值，有正负，精确到1mm */
              const distance = parseFloat(
                (parseInt(distancePulse) * 1).toFixed(0)
              )
              /* 数据校验 */
              if (!isNaN(distance)) {
                this.distanceDataArray.push(distance) // 完整的位移数组

                this.option.series[0].data = this.distanceDataArray
                this.myChart.setOption(this.option)

                // 暂定5秒时长，结束
                if (this.distanceDataArray.length === 50) {
                  // 关闭串口
                  if (this.usbPort) {
                    if (this.usbPort.isOpen) {
                      this.usbPort.close()
                    }
                  }
                  // 计算范围
                  const min = Math.min(...this.distanceDataArray)
                  const max = Math.max(...this.distanceDataArray)
                  this.relativeDistance = parseInt(max - min)

                  if (this.relativeDistance) {
                    this.$store
                      .dispatch('setRelativeDistance', this.relativeDistance)
                      .then(() => {
                        this.$message({
                          message: `设置蹬伸动作范围成功，请返回首页。`,
                          type: 'success',
                          duration: 3000
                        })
                      })
                      .then(() => {
                        this.startAllow = true
                      })
                      .catch(err => {
                        this.$alert(
                          `${err}。设置蹬伸动作范围失败，然后点击"刷新页面"按钮，重新测量！`,
                          '提示',
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
                  } else if (this.relativeDistance === 0) {
                    this.$alert(
                      `蹬伸动作范围不能为0mm，请点击"刷新页面"按钮，重新测量！`,
                      '警告',
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
                    this.$alert(
                      `蹬伸动作范围值异常：${this.relativeDistance}，请点击"刷新页面"按钮，重新测量！`,
                      '设置失败',
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
                }
              }
            })
          } else {
            this.$confirm(
              `请重新连接USB线，然后点击"刷新页面"按钮！`,
              '没有检测到USB连接',
              {
                type: 'error',
                showClose: false,
                closeOnClickModal: false,
                closeOnPressEscape: false,
                center: true,
                confirmButtonText: '刷新页面',
                cancelButtonText: '返回首页'
              }
            )
              .then(() => {
                this.handleRefresh()
              })
              .catch(() => {
                this.handleToHome()
              })
          }
        })
        .catch(err => {
          this.$confirm(
            `${err}。请重新连接USB线，然后点击"刷新页面"按钮！`,
            `初始化SerialPort.list失败`,
            {
              type: 'error',
              showClose: false,
              closeOnClickModal: false,
              closeOnPressEscape: false,
              center: true,
              confirmButtonText: '刷新页面',
              cancelButtonText: '返回首页'
            }
          )
            .then(() => {
              this.handleRefresh()
            })
            .catch(() => {
              this.handleToHome()
            })
        })
    },

    /**
     * @description: 图形初始化
     */
    initChart() {
      // 计算横坐标数组
      this.xData = []
      for (let i = 0; i < 50; i++) {
        this.xData.push(parseFloat((i * 0.1).toFixed(1)))
      }

      this.myChart = this.$echarts.init(document.getElementById('chart'))
      this.option = {
        title: {},
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
          name: '单位：mm'
        },
        series: [
          {
            data: [' '],
            type: 'line',
            lineStyle: {
              color: 'rgba(0, 0, 255, 1)'
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
     * @description: 开始按钮
     */
    handleStart() {
      this.startAllow = false

      this.distanceDataArray = []
      this.relativeDistance = 0

      if (this.usbPort) {
        if (!this.usbPort.isOpen) {
          this.usbPort.open()
        }
      }
    },

    /**
     * @description: 刷新页面按钮
     */
    handleRefresh() {
      this.$router.push({
        path: '/refresh',
        query: {
          routerName: JSON.stringify('/set-relativeDistance'),
          duration: JSON.stringify(300)
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.set-relativeDistance {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 86%;
    height: 90%;
    border-radius: 34px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    padding: 40px 40px 20px 40px;
    @include flex(column, stretch, stretch);
    position: relative;

    .page {
      position: absolute;
      top: 20px;
      left: 30px;
    }

    /* 文字说明 */
    .text {
      margin: 20px 0 0 0;
      @include flex(row, flex-start, center);
      font-size: 18px;
      color: red;
    }
    /* 蹬伸动作范围结果 */
    .result {
      margin: 10px 0 0 0;
      @include flex(row, center, center);
      font-size: 18px;
      .value {
        color: #ffffff;
        background-color: #929292;
        padding: 6px 20px;
        border-radius: 6px;
      }
    }
    /* 图形区 */
    .chart {
      flex: 1;
    }
    /* 按钮组 */
    .btn {
      @include flex(row, center, center);
      .item {
        margin: 0 50px;
        font-size: 22px;
      }
    }
  }
}
</style>
