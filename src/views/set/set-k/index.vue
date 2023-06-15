<!--
 * @Author      : Mr.bin
 * @Date        : 2023-06-15 14:52:20
 * @LastEditTime: 2023-06-15 14:53:02
 * @Description : 设置K
-->
<template>
  <div class="set-k">
    <div class="wrapper">
      <el-page-header
        class="page"
        title="返回首页"
        content="设置K"
        @back="handleToHome"
      ></el-page-header>

      <div class="box">
        <div class="left-k">
          <span>左K值(默认83.879)：</span>
          <el-input-number
            v-model="leftK"
            :precision="3"
            @change="handleLeftKChange"
          ></el-input-number>
        </div>
        <div class="right-k">
          <span>右K值(默认85.138)：</span>
          <el-input-number
            v-model="rightK"
            :precision="3"
            @change="handleRightKChange"
          ></el-input-number>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'set-k',

  data() {
    return {
      leftK: 0,
      rightK: 0
    }
  },

  created() {
    this.leftK = parseFloat(window.localStorage.getItem('leftK'))
    this.rightK = parseFloat(window.localStorage.getItem('rightK'))
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
     * @description: 左K值变化时触发
     * @param {*} value
     */
    handleLeftKChange(value) {
      if (!value) {
        value = 83.879
      }
      window.localStorage.setItem('leftK', value)
      this.$message({
        message: '修改左K值成功',
        type: 'success',
        duration: 500
      })
    },

    /**
     * @description: 右K值变化时触发
     * @param {*} value
     */
    handleRightKChange(value) {
      if (!value) {
        value = 85.138
      }
      window.localStorage.setItem('rightK', value)
      this.$message({
        message: '修改右K值成功',
        type: 'success',
        duration: 500
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.set-k {
  width: 100%;
  height: 100%;
  @include flex(row, center, center);

  .wrapper {
    width: 86%;
    height: 90%;
    border-radius: 34px;
    background-color: #ffffff;
    box-shadow: 0 0 10px #929292;
    padding: 40px;
    @include flex(column, center, center);
    position: relative;

    .page {
      position: absolute;
      top: 20px;
      left: 30px;
    }

    .box {
      @include flex(row, center, center);
      .left-k,
      .right-k {
        margin: 0 60px;
      }
    }
  }
}
</style>
