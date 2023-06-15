<!--
 * @Author      : Mr.bin
 * @Date        : 2023-06-15 15:21:59
 * @LastEditTime: 2023-06-15 22:12:01
 * @Description : 任务详情页
-->
<template>
  <div class="task">
    <div class="wrapper">
      <!-- 标题 -->
      <el-page-header
        title="返回首页"
        content="任务详情页"
        @back="handleToHome"
      ></el-page-header>

      <!-- 步骤条 -->
      <div class="step">
        <el-steps :active="settings.length" align-center>
          <el-step
            v-for="(item, index) in settings"
            :key="index"
            :title="item.pattern"
          ></el-step>
        </el-steps>
      </div>

      <!-- 轮播图 -->
      <div class="carousel">
        <el-card>
          <div slot="header">
            <span :style="{ 'font-weight': 700 }"
              >订单类型：{{ orderIdType }}</span
            >
            <div :style="{ float: 'right', padding: '3px 0' }">
              <span>说明</span>
              <i class="el-icon-share"></i>
            </div>
          </div>
          <el-carousel
            trigger="click"
            :interval="5000"
            :loop="true"
            height="350px"
            arrow="always"
          >
            <el-carousel-item v-for="(item, index) in settings" :key="index">
              <div class="box">
                <div class="title">({{ index + 1 }}){{ item.pattern }}</div>
                <!-- 评估 -->
                <div class="item" v-if="item.pattern === '下肢测试'">
                  <div>请确认设备调整为等长模式，将依次开始三项测试</div>
                </div>
                <!-- 训练 -->
                <div class="item" v-if="item.pattern === '基础训练'">
                  <div>训练要求：在进行蹬伸动作时，尽量贴合绿色曲线</div>
                  <div>
                    动作特点：在动作的向心、离心阶段保持缓慢、匀速，加强下肢的协调能力、促进肌肉力量的增强
                  </div>
                </div>
                <div class="item" v-if="item.pattern === '进阶训练'">
                  <div>训练要求：在进行蹬伸动作时，尽量贴合绿色曲线</div>
                  <div>
                    动作特点：在动作进行到末端时进行持续的等长收缩，加强关节的稳定性、促进肌肉力量的增强
                  </div>
                </div>
                <div class="item" v-if="item.pattern === '离心训练'">
                  <div>训练要求：在进行蹬伸动作时，尽量贴合绿色曲线</div>
                  <div>
                    动作特点：在离心阶段控制动作速度，进一步提升关节的稳定性、促进肌肉力量的增强，预防关节损伤
                  </div>
                </div>
                <div class="item" v-if="item.pattern === '等长训练'">
                  <div>
                    训练要求：请将设备调整为等长模式，在进行蹬伸动作时，将圆点缓慢上升到绿线之上，进行重复训练
                  </div>
                  <div>
                    动作特点：康复早期可增强患侧下肢稳定性，每次收缩保持的时间按治疗师要求而定
                  </div>
                </div>
                <div class="item" v-if="item.pattern === '自定义训练'">
                  <div>训练要求：在进行蹬伸动作时，尽量贴合绿色曲线</div>
                  <div>动作特点：自定义</div>
                </div>
              </div>
            </el-carousel-item>
          </el-carousel>
        </el-card>
      </div>

      <!-- 按钮组 -->
      <div class="btn">
        <el-button class="item" type="primary" @click="handleStart"
          >正式开始</el-button
        >
        <el-button class="item" type="danger" @click="handleToHome"
          >返回首页</el-button
        >
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'task',

  data() {
    return {
      /* 路由传参 */
      orderIdType: JSON.parse(this.$route.query.orderIdType),

      settings: this.$store.state.settings
    }
  },

  methods: {
    /**
     * @description: 返回首页
     */
    handleToHome() {
      this.$confirm('订单进行中，此操作会退出该订单，是否退出？', '提示', {
        type: 'warning',
        showClose: true,
        closeOnClickModal: true,
        closeOnPressEscape: true,
        center: true,
        confirmButtonText: '退 出',
        cancelButtonText: '否'
      })
        .then(() => {
          this.$router.push({
            path: '/home'
          })
        })
        .catch(() => {})
    },

    /**
     * @description: 正式开始
     */
    handleStart() {
      const settings = this.settings
      let settingsRouter = []

      if (this.orderIdType === '评估') {
        for (let i = 0; i < settings.length; i++) {
          const item = settings[i]
          switch (item.pattern) {
            case '下肢测试':
              settingsRouter.push('lower-limb-measure')
              break
            default:
              break
          }
        }
      } else if (this.orderIdType === '训练') {
        for (let i = 0; i < settings.length; i++) {
          const item = settings[i]
          switch (item.pattern) {
            case '基础训练':
              settingsRouter.push('basics-measure')
              break
            case '进阶训练':
              settingsRouter.push('advance-measure')
              break
            case '离心训练':
              settingsRouter.push('offcenter-measure')
              break
            case '等长训练':
              settingsRouter.push('equal-measure')
              break
            case '自定义训练':
              settingsRouter.push('custom-measure')
              break
            default:
              break
          }
        }
      }

      // console.log(settingsRouter)
      this.$router.push({
        path: '/' + settingsRouter[0]
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.task {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 96%;
    height: 96%;
    border-radius: 34px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    padding: 20px 40px;
    @include flex(column, stretch, stretch);

    .step {
      margin-top: 20px;
      margin-bottom: 20px;
    }

    .carousel {
      flex: 1;
      .el-carousel__item .box {
        @include flex(column, center, center);
        height: 350px;
        position: relative;
      }
      .el-carousel__item .box .title {
        color: #475669;
        font-size: 30px;
        font-weight: 700;
        position: absolute;
        top: 15px;
        left: 20px;
      }
      .el-carousel__item .box .item {
        width: 80%;
        color: #475669;
        font-size: 26px;
        font-weight: 700;
      }
      .el-carousel__item {
        background-color: #d3dce6;
      }
    }

    .btn {
      margin-top: 15px;
      @include flex(row, center, center);
      .item {
        font-size: 22px;
        margin: 0 50px;
      }
    }
  }
}
</style>
