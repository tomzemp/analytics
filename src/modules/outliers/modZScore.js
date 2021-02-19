import { deNormalizerMap } from './normalization'

export const MODIFIED_Z_SCORE = 'MODIFIED_Z_SCORE'

const MEDIAN_AD_CORRECTION = 0.6745
const MEAN_AD_CORRECTION = 1.253314

export const getMean = values =>
    values.reduce((total, value) => total + value, 0) / values.length

export const getMedian = values => {
    const hl = values.length / 2
    return hl % 1
        ? values[Math.floor(hl)]
        : getMean([values[hl - 1], values[hl]])
}

// Absolute deviation

export const getMedianAbsoluteDeviation = (
    values,
    median = getMedian(values)
) =>
    getMedian(
        values.map(value => Math.abs(value - median)).sort((a, b) => a - b)
    )

export const getMeanAbsoluteDeviation = (values, mean = getMean(values)) =>
    getMean(values.map(value => Math.abs(value - mean)))

// Modified z-scores

export const getModZScore = (value, median, medianAD) =>
    (MEDIAN_AD_CORRECTION * (value - median)) / medianAD

export const getModZScoreMAD0 = (value, median, meanAD) =>
    (value - median) / (meanAD * MEAN_AD_CORRECTION)

// Thresholds

export const getModZScoreThresholds = (
    thresholdFactor,
    medianAD,
    median,
    k = MEDIAN_AD_CORRECTION
) => [
    median - (medianAD * thresholdFactor) / k,
    median + (medianAD * thresholdFactor) / k,
]

export const getModZScoreMAD0Thresholds = (
    thresholdFactor,
    meanAD,
    median,
    k = MEAN_AD_CORRECTION
) => [
    median - thresholdFactor * meanAD * k,
    median + thresholdFactor * meanAD * k,
]

export const getDataWithZScore = (dataWithNormalization, cache) => {
    const normalizedData =
        cache.normalizedData || dataWithNormalization.map(obj => obj.normalized)
    const median = cache.median || getMedian(normalizedData)
    const medianAD = cache.medianAD || getMedianAbsoluteDeviation()
    let dataWithZScore

    if (medianAD === 0) {
        const meanAD = cache.meanAD || getMeanAbsoluteDeviation(normalizedData)
        dataWithZScore = dataWithNormalization.map(obj => ({
            ...obj,
            zScore: getModZScoreMAD0(obj.normalized, median, meanAD),
        }))
    } else {
        dataWithZScore = dataWithNormalization.map(obj => ({
            ...obj,
            zScore: getModZScore(obj.normalized, median, medianAD),
        }))
    }

    return dataWithZScore
}

export const getModZScoreHelper = (
    dataWithNormalization,
    config,
    { xyStats }
) => {
    if (!dataWithNormalization.length) {
        throw 'Modified z-score analysis requires at least one value'
    }
    const normalizedData = dataWithNormalization.map(obj => obj.normalized)
    const median = getMedian(normalizedData)
    const medianAD = getMedianAbsoluteDeviation(normalizedData, median)
    const meanAD =
        medianAD === 0 ? getMeanAbsoluteDeviation(normalizedData) : null

    const dataWithZScore = getDataWithZScore(dataWithNormalization, {
        normalizedData,
        median,
        medianAD,
    })

    const [lowThreshold, highThreshold] =
        medianAD === 0
            ? getModZScoreMAD0Thresholds(config.thresholdFactor, meanAD, median)
            : getModZScoreThresholds(config.thresholdFactor, medianAD, median)

    const deNormalizer = deNormalizerMap[config.normalizationMethod]

    const lowThresholdLine = [
        [config.xMin, deNormalizer(xyStats.xMin, lowThreshold)],
        [config.xMax, deNormalizer(xyStats.xMax, lowThreshold)],
    ]
    const highThresholdLine = [
        [config.xMin, deNormalizer(xyStats.xMin, highThreshold)],
        [config.xMax, deNormalizer(xyStats.xMax, highThreshold)],
    ]

    const isLowOutlier = value => value < lowThreshold
    const isHighOutlier = value => value > highThreshold
    const isOutlier = value => isLowOutlier(value) || isHighOutlier(value)
    const outlierPoints = []
    const inlierPoints = []
    const detectOutliers = () =>
        dataWithZScore.forEach(obj => {
            isOutlier(obj.normalized)
                ? outlierPoints.push(obj.point)
                : inlierPoints.push(obj.point)
        })

    return {
        thresholds: [
            {
                name: `${config.thresholdFactor} x Modified Z-score Low`,
                value: lowThreshold,
                line: lowThresholdLine,
            },
            {
                name: `${config.thresholdFactor} x Modified Z-score High`,
                value: highThreshold,
                line: highThresholdLine,
            },
        ],
        isLowOutlier,
        isHighOutlier,
        isOutlier,
        detectOutliers,
        outlierPoints,
        inlierPoints,
        vars: {
            normalizedData,
            median,
            medianAD,
            meanAD,
            lowThreshold,
            highThreshold,
            dataWithNormalization,
            dataWithZScore,
            normalizedData,
            config,
            xyStats,
        },
    }
}
