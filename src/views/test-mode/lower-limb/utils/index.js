/*
 * @Author      : Mr.bin
 * @Date        : 2023-07-03 09:22:31
 * @LastEditTime: 2023-07-03 09:54:13
 * @Description : 数据处理
 */

const calculate = parameter => {
  const sex = parameter.sex // 性别
  const height = parseFloat((parameter.height / 100).toFixed(2)) // 身高（m）
  const weight = parameter.weight // 体重（kg）
  const currentAge = parameter.currentAge // 当时测试时的岁数
  const affectedSide = parameter.affectedSide // 患侧
  const resultValue = parameter.resultValue // 测量结果

  const BMI = parseInt((weight / height ** 2).toFixed(0)) // BMI指数
  const sqrtWeight = Math.sqrt(weight / 23) // 开根号

  /* 计算单腿、双腿的推荐值kg */
  let singleRecommendedValue = 0
  let bothRecommendedValue = 0
  if (sex === '男') {
    if (currentAge >= 41) {
      if (BMI > 23) {
        // 公式1
        singleRecommendedValue =
          (1.1 * weight - ((height - sqrtWeight) / sqrtWeight) * 140) *
          (1 - (currentAge - 40) * 0.01)
      } else if (BMI === 23) {
        // 公式2
        singleRecommendedValue = 1.1 * weight * (1 - (currentAge - 40) * 0.01)
      } else if (BMI < 23) {
        // 公式3
        singleRecommendedValue =
          (1.1 * weight + ((height - sqrtWeight) / sqrtWeight) * 140) *
          (1 - (currentAge - 40) * 0.01)
      }
    } else {
      if (BMI > 23) {
        // 公式4
        singleRecommendedValue =
          1.1 * weight - ((height - sqrtWeight) / sqrtWeight) * 140
      } else if (BMI === 23) {
        // 公式5
        singleRecommendedValue = 1.1 * weight
      } else if (BMI < 23) {
        // 公式6
        singleRecommendedValue =
          1.1 * weight + ((height - sqrtWeight) / sqrtWeight) * 140
      }
    }
  } else if (sex === '女') {
    if (currentAge >= 41) {
      if (BMI > 23) {
        // 公式7
        singleRecommendedValue =
          (1.1 * weight - ((height - sqrtWeight) / sqrtWeight) * 140) *
          0.8 *
          (1 - (currentAge - 40) * 0.01)
      } else if (BMI === 23) {
        // 公式8
        singleRecommendedValue =
          1.1 * weight * 0.8 * (1 - (currentAge - 40) * 0.01)
      } else if (BMI < 23) {
        // 公式9
        singleRecommendedValue =
          (1.1 * weight + ((height - sqrtWeight) / sqrtWeight) * 140) *
          0.8 *
          (1 - (currentAge - 40) * 0.01)
      }
    } else {
      if (BMI > 23) {
        // 公式10
        singleRecommendedValue =
          (1.1 * weight - ((height - sqrtWeight) / sqrtWeight) * 140) * 0.8
      } else if (BMI === 23) {
        // 公式11
        singleRecommendedValue = 1.1 * weight * 0.8
      } else if (BMI < 23) {
        // 公式12
        singleRecommendedValue =
          (1.1 * weight + ((height - sqrtWeight) / sqrtWeight) * 140) * 0.8
      }
    }
  }
  singleRecommendedValue = parseFloat(singleRecommendedValue.toFixed(1))
  bothRecommendedValue = parseFloat((singleRecommendedValue * 1.5).toFixed(1))

  /* 左、右、双腿的测量值kg */
  let leftValue = 0
  let rightValue = 0
  let bothValue = 0
  if (affectedSide === '左腿') {
    leftValue = resultValue.badLegResult
    rightValue = resultValue.goodLegResult
  } else {
    leftValue = resultValue.goodLegResult
    rightValue = resultValue.badLegResult
  }
  bothValue = resultValue.bothLegResult
  // 保留一位小数
  leftValue = parseFloat(leftValue.toFixed(1))
  rightValue = parseFloat(rightValue.toFixed(1))
  bothValue = parseFloat(bothValue.toFixed(1))

  /* 计算左腿、右腿、双腿、肌力比的得分 */
  let leftScore = 0
  let rightScore = 0
  let bothScore = 0
  let muscleRatioScore = 0
  // 左腿得分
  if (leftValue <= singleRecommendedValue) {
    leftScore = (leftValue / singleRecommendedValue) * 5
  } else if (leftValue > singleRecommendedValue && leftValue < 1.8 * weight) {
    leftScore =
      ((leftValue - singleRecommendedValue) /
        (1.8 * weight - singleRecommendedValue)) *
        5 +
      5
  } else if (leftValue >= 1.8 * weight) {
    leftScore = 10
  }
  // 右腿得分
  if (rightValue <= singleRecommendedValue) {
    rightScore = (rightValue / singleRecommendedValue) * 5
  } else if (rightValue > singleRecommendedValue && rightValue < 1.8 * weight) {
    rightScore =
      ((rightValue - singleRecommendedValue) /
        (1.8 * weight - singleRecommendedValue)) *
        5 +
      5
  } else if (rightValue >= 1.8 * weight) {
    rightScore = 10
  }
  // 双腿得分
  if (bothValue <= bothRecommendedValue) {
    bothScore = (bothValue / bothRecommendedValue) * 5
  } else if (bothValue > bothRecommendedValue && bothValue < 3 * weight) {
    bothScore =
      ((bothValue - bothRecommendedValue) /
        (3 * weight - bothRecommendedValue)) *
        5 +
      5
  } else if (bothValue >= 3 * weight) {
    bothScore = 10
  }
  // 肌力比得分
  let newLeftValue = null // 经过转换的值，用于肌力比求差值，取整数
  let newRightValue = null // 经过转换的值，用于肌力比求差值，取整数
  let rate = null
  if (leftValue > rightValue) {
    newLeftValue = 100
    rate = 100 / leftValue
    newRightValue = parseInt((rightValue * rate).toFixed(0))
  } else if (leftValue < rightValue) {
    newRightValue = 100
    rate = 100 / rightValue
    newLeftValue = parseInt((leftValue * rate).toFixed(0))
  } else {
    newLeftValue = 100
    newRightValue = 100
  }
  const diff = Math.abs(newLeftValue - newRightValue) // 计算差值
  if (diff <= 5) {
    muscleRatioScore = 10
  } else if (diff >= 5.1 && diff <= 15) {
    muscleRatioScore = parseFloat((10 - (diff / 15) * 5).toFixed(1))
  } else if (diff >= 15.1 && diff <= 56) {
    muscleRatioScore = parseFloat((5 - (diff / 56) * 5).toFixed(1))
  } else if (diff > 56) {
    muscleRatioScore = 0
  }
  // 保留一位小数
  leftScore = parseFloat(leftScore.toFixed(1))
  rightScore = parseFloat(rightScore.toFixed(1))
  bothScore = parseFloat(bothScore.toFixed(1))
  muscleRatioScore = parseFloat(muscleRatioScore.toFixed(1))

  /* 根据得分进行评价：优、良、中、较差、差 */
  let leftEvaluateText = ''
  let rightEvaluateText = ''
  let bothEvaluateText = ''
  let muscleRatioEvaluateText = ''
  // 左腿评价
  if (leftScore <= 3.9) {
    leftEvaluateText = '差'
  } else if (leftScore >= 4.0 && leftScore <= 4.9) {
    leftEvaluateText = '较差'
  } else if (leftScore >= 5.0 && leftScore <= 6.9) {
    leftEvaluateText = '中'
  } else if (leftScore >= 7.0 && leftScore <= 7.9) {
    leftEvaluateText = '良'
  } else if (leftScore >= 8.0) {
    leftEvaluateText = '优'
  }
  // 右腿评价
  if (rightScore <= 3.9) {
    rightEvaluateText = '差'
  } else if (rightScore >= 4.0 && rightScore <= 4.9) {
    rightEvaluateText = '较差'
  } else if (rightScore >= 5.0 && rightScore <= 6.9) {
    rightEvaluateText = '中'
  } else if (rightScore >= 7.0 && rightScore <= 7.9) {
    rightEvaluateText = '良'
  } else if (rightScore >= 8.0) {
    rightEvaluateText = '优'
  }
  // 双腿评价
  if (bothScore <= 3.9) {
    bothEvaluateText = '差'
  } else if (bothScore >= 4.0 && bothScore <= 4.9) {
    bothEvaluateText = '较差'
  } else if (bothScore >= 5.0 && bothScore <= 6.9) {
    bothEvaluateText = '中'
  } else if (bothScore >= 7.0 && bothScore <= 7.9) {
    bothEvaluateText = '良'
  } else if (bothScore >= 8.0) {
    bothEvaluateText = '优'
  }
  // 肌力比评价
  if (muscleRatioScore <= 3.9) {
    muscleRatioEvaluateText = '差'
  } else if (muscleRatioScore >= 4.0 && muscleRatioScore <= 4.9) {
    muscleRatioEvaluateText = '较差'
  } else if (muscleRatioScore >= 5.0 && muscleRatioScore <= 6.9) {
    muscleRatioEvaluateText = '中'
  } else if (muscleRatioScore >= 7.0 && muscleRatioScore <= 7.9) {
    muscleRatioEvaluateText = '良'
  } else if (muscleRatioScore >= 8.0) {
    muscleRatioEvaluateText = '优'
  }

  /* 计算左腿、右腿的肌力亏欠值 */
  let leftTrainRecommend = ''
  let rightTrainRecommend = ''
  if (
    leftValue < singleRecommendedValue &&
    rightValue < singleRecommendedValue
  ) {
    leftTrainRecommend = parseFloat(
      (singleRecommendedValue - leftValue).toFixed(0)
    )
    rightTrainRecommend = parseFloat(
      (singleRecommendedValue - rightValue).toFixed(0)
    )
  } else if (
    leftValue > singleRecommendedValue &&
    rightValue > singleRecommendedValue
  ) {
    if (leftValue > rightValue) {
      leftTrainRecommend = '/'
      rightTrainRecommend = parseFloat((leftValue - rightValue).toFixed(0))
    } else if (leftValue < rightValue) {
      rightTrainRecommend = '/'
      leftTrainRecommend = parseFloat((rightValue - leftValue).toFixed(0))
    } else {
      leftTrainRecommend = '/'
      rightTrainRecommend = '/'
    }
  } else if (
    leftValue > singleRecommendedValue &&
    rightValue < singleRecommendedValue
  ) {
    leftTrainRecommend = '/'
    rightTrainRecommend = parseFloat((leftValue - rightValue).toFixed(0))
  } else if (
    leftValue < singleRecommendedValue &&
    rightValue > singleRecommendedValue
  ) {
    rightTrainRecommend = '/'
    leftTrainRecommend = parseFloat((rightValue - leftValue).toFixed(0))
  } else {
    leftTrainRecommend = '/'
    rightTrainRecommend = '/'
  }

  return {
    singleRecommendedValue,
    bothRecommendedValue,

    leftValue,
    rightValue,
    bothValue,

    leftScore,
    rightScore,
    bothScore,
    muscleRatioScore,

    leftEvaluateText,
    rightEvaluateText,
    bothEvaluateText,
    muscleRatioEvaluateText,

    leftTrainRecommend,
    rightTrainRecommend
  }
}

export { calculate }
