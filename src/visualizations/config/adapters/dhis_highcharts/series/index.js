import { colors } from '@dhis2/ui'

import getCumulativeData from '../getCumulativeData'
import getPie from './pie'
import getGauge from './gauge'
import getScatter from './scatter'
import getType from '../type'
import { getFullIdAxisMap, getAxisIdsMap } from '../customAxes'
import { generateColors } from '../../../../util/colors/gradientColorGenerator'
import {
    colorSets,
    COLOR_SET_PATTERNS,
} from '../../../../util/colors/colorSets'
import {
    VIS_TYPE_PIE,
    VIS_TYPE_GAUGE,
    isDualAxisType,
    isYearOverYear,
    VIS_TYPE_LINE,
    VIS_TYPE_SCATTER,
    isLegendSetType,
} from '../../../../../modules/visTypes'
import { hasCustomAxes } from '../../../../../modules/axis'
import { getAxisStringFromId } from '../../../../util/axisId'
import { axisHasRelativeItems } from '../../../../../modules/layout/axisHasRelativeItems'
import {
    LEGEND_DISPLAY_STRATEGY_BY_DATA_ITEM,
    LEGEND_DISPLAY_STRATEGY_FIXED,
} from '../../../../../modules/legends'

const DEFAULT_ANIMATION_DURATION = 200

const HIGHCHARTS_TYPE_COLUMN = 'column'
const HIGHCHARTS_TYPE_BAR = 'bar'
const HIGHCHARTS_TYPE_PERCENT = 'percent'
const HIGHCHARTS_TYPE_NORMAL = 'normal'

const INCREASED_Z_INDEX = 1

const epiCurveTypes = [HIGHCHARTS_TYPE_COLUMN, HIGHCHARTS_TYPE_BAR]

function getAnimation(option, fallback) {
    return typeof option === 'number' ? option : fallback
}

function getColor(colors, index) {
    return colors[index] || getColor(colors, index - colors.length)
}

function getPatternIndex(index) {
    return index < 10 ? index : getPatternIndex(index - 10)
}

function getIndexColorPatternMap(series, layout, extraOptions) {
    const colors = colorSets[layout.colorSet]?.colors || extraOptions.colors

    return series.reduce((map, s, index) => {
        map[index] =
            layout.colorSet === COLOR_SET_PATTERNS
                ? { patternIndex: getPatternIndex(index) }
                : getColor(colors, index)
        return map
    }, {})
}

function getIdColorMap(series, layout, extraOptions) {
    const filteredSeries = layout.series?.filter(layoutSeriesItem =>
        series.some(
            seriesItem => seriesItem.id === layoutSeriesItem.dimensionItem
        )
    )

    if (
        isDualAxisType(layout.type) &&
        hasCustomAxes(filteredSeries) &&
        !axisHasRelativeItems(layout.columns)
    ) {
        const axisIdsMap = getAxisIdsMap(layout.series, series)
        const theme = extraOptions.multiAxisTheme

        const colorsByAxis = Object.keys(axisIdsMap).reduce((map, axis) => {
            const numberOfIds = axisIdsMap[axis].length
            map[axis] =
                numberOfIds > 1
                    ? generateColors(
                          theme[axis].startColor,
                          theme[axis].endColor,
                          numberOfIds
                      )
                    : [theme[axis].mainColor]
            return map
        }, {})

        return Object.keys(colorsByAxis).reduce((map, axis) => {
            const colors = colorsByAxis[axis]
            const ids = axisIdsMap[axis]

            ids.forEach((id, index) => {
                map[id] = colors[index]
            })

            return map
        }, {})
    } else {
        const indexColorPatternMap = getIndexColorPatternMap(
            series,
            layout,
            extraOptions
        )

        return series.reduce((map, s, index) => {
            map[s.id] = indexColorPatternMap[index]
            return map
        }, {})
    }
}

function getDefault(series, metaData, layout, isStacked, extraOptions) {
    const fullIdAxisMap = getFullIdAxisMap(layout.series, series)
    const idColorMap = getIdColorMap(series, layout, extraOptions)
    const indexColorPatternMap = getIndexColorPatternMap(
        series,
        layout,
        extraOptions
    )

    series.forEach((seriesObj, index) => {
        // show values
        if (!seriesObj.dataLabels && (layout.showValues || layout.showData)) {
            seriesObj.dataLabels = {
                enabled: true,
                color: colors.grey900,
            }
        }

        // stacked
        if (isStacked && !seriesObj?.custom?.isTwoCategoryFakeSerie) {
            // DHIS2-1060: stacked charts can optionally be shown as 100% stacked charts
            if (layout.percentStackedValues === true) {
                seriesObj.stacking = HIGHCHARTS_TYPE_PERCENT
                seriesObj.connectNulls = false
            } else {
                seriesObj.stacking = HIGHCHARTS_TYPE_NORMAL
            }
        }

        const matchedObject = layout.series?.find(
            item => item.dimensionItem === seriesObj.id
        )

        if (matchedObject && !axisHasRelativeItems(layout.columns)) {
            // Checks if the item has custom options
            if (matchedObject.type) {
                seriesObj.type = getType(matchedObject.type).type

                if (matchedObject.type === VIS_TYPE_LINE) {
                    seriesObj.zIndex = INCREASED_Z_INDEX // Custom options, item type Line
                }
            } else if (layout.type === VIS_TYPE_LINE) {
                seriesObj.zIndex = INCREASED_Z_INDEX // Custom options, no item type, visType Line
            }
        } else if (layout.type === VIS_TYPE_LINE) {
            seriesObj.zIndex = INCREASED_Z_INDEX // No custom options, visType Line
        }

        // DHIS2-2101
        // show bar/column chart as EPI curve (basically remove spacing between bars/columns)
        if (
            layout.noSpaceBetweenColumns &&
            epiCurveTypes.includes(getType(layout.type).type)
        ) {
            seriesObj.pointPadding = 0
            seriesObj.groupPadding = 0
        }

        let legendSet
        if (isLegendSetType(layout.type)) {
            const legendSets = extraOptions?.legendSets || []
            if (
                layout.legendDisplayStrategy ===
                LEGEND_DISPLAY_STRATEGY_BY_DATA_ITEM
            ) {
                legendSet = legendSets.find(
                    legendSet =>
                        legendSet.id === metaData.items[seriesObj.id]?.legendSet
                )
            } else if (
                layout.legendDisplayStrategy === LEGEND_DISPLAY_STRATEGY_FIXED
            ) {
                legendSet = legendSets[0]
            }
        }

        // color
        if (isYearOverYear(layout.type)) {
            // YearOverYear: Fetch colors directly from color sets
            seriesObj.color = indexColorPatternMap[index]
        } else if (legendSet?.legends?.length) {
            // Legendset: Fetch the middle color of the set
            seriesObj.color = legendSet.legends.sort(
                (a, b) => a.startValue - b.startValue
            )[Math.ceil(legendSet.legends.length / 2) - 1].color
        } else {
            // Default: Either generate colors or fetch from color sets
            seriesObj.color = idColorMap[seriesObj.id]
        }

        // axis number
        seriesObj.yAxis =
            isDualAxisType(layout.type) && !axisHasRelativeItems(layout.columns)
                ? getAxisStringFromId(fullIdAxisMap[seriesObj.id])
                : getAxisStringFromId(0)

        // custom names for "year over year" series
        if (extraOptions.yearlySeries) {
            seriesObj.name = extraOptions.yearlySeries[index]
        }
    })

    // DHIS2-701: use cumulative values
    if (layout.cumulativeValues === true) {
        series = getCumulativeData(series, layout)
    }

    return series
}

export default function (series, metaData, layout, isStacked, extraOptions) {
    switch (layout.type) {
        case VIS_TYPE_PIE:
            series = getPie(
                series,
                Object.values(getIdColorMap(series, layout, extraOptions))
            )
            break
        case VIS_TYPE_GAUGE:
            series = getGauge(series, layout, extraOptions.legendSets[0])
            break
        case VIS_TYPE_SCATTER:
            series = getScatter(extraOptions)
            break
        default:
            series = getDefault(
                series,
                metaData,
                layout,
                isStacked,
                extraOptions
            )
    }

    series.forEach(seriesObj => {
        // animation
        seriesObj.animation = {
            duration: getAnimation(
                extraOptions.animation,
                DEFAULT_ANIMATION_DURATION
            ),
        }
    })

    return series
}
