import {
    AXIS_NAME_COLUMNS,
    AXIS_NAME_ROWS,
    AXIS_NAME_FILTERS,
} from '../layout/axis'
import { DIMENSION_ID_PERIOD } from '../fixedDimensions'
import {
    VIS_TYPE_COLUMN,
    VIS_TYPE_STACKED_COLUMN,
    VIS_TYPE_BAR,
    VIS_TYPE_STACKED_BAR,
    VIS_TYPE_LINE,
    VIS_TYPE_AREA,
    VIS_TYPE_PIE,
    VIS_TYPE_RADAR,
    VIS_TYPE_GAUGE,
    VIS_TYPE_YEAR_OVER_YEAR_LINE,
    VIS_TYPE_YEAR_OVER_YEAR_COLUMN,
    VIS_TYPE_SINGLE_VALUE,
} from '../visTypes'

const RULE_PROP_AVAILABLE_AXES = {
    name: 'availableAxes',
    isValid: prop => Array.isArray(prop),
}

const defaultRules = {
    [RULE_PROP_AVAILABLE_AXES.name]: [
        AXIS_NAME_COLUMNS,
        AXIS_NAME_ROWS,
        AXIS_NAME_FILTERS,
    ],
    maxNumberOfDimsPerAxis: {
        [AXIS_NAME_COLUMNS]: 1,
        [AXIS_NAME_ROWS]: 1,
    },
    minNumberOfDimsPerAxis: {
        [AXIS_NAME_COLUMNS]: 1,
        [AXIS_NAME_ROWS]: 1,
    },
}

const pieRules = {
    [RULE_PROP_AVAILABLE_AXES.name]: [AXIS_NAME_COLUMNS, AXIS_NAME_FILTERS],
    maxNumberOfDimsPerAxis: {
        [AXIS_NAME_COLUMNS]: 1,
    },
    minNumberOfDimsPerAxis: {
        [AXIS_NAME_COLUMNS]: 1,
    },
}

const singleValueRules = {
    [RULE_PROP_AVAILABLE_AXES.name]: [AXIS_NAME_FILTERS],
    maxNumberOfDimsPerAxis: {
        [AXIS_NAME_COLUMNS]: 1,
    },
    minNumberOfDimsPerAxis: {
        [AXIS_NAME_COLUMNS]: 1,
    },
    maxNumberOfItemsPerAxis: {
        [AXIS_NAME_COLUMNS]: 1,
    },
}

const yearOverYearRules = {
    [RULE_PROP_AVAILABLE_AXES.name]: [AXIS_NAME_FILTERS],
    disallowedDims: [DIMENSION_ID_PERIOD],
}

const visTypeToRules = {
    [VIS_TYPE_COLUMN]: defaultRules,
    [VIS_TYPE_STACKED_COLUMN]: defaultRules,
    [VIS_TYPE_BAR]: defaultRules,
    [VIS_TYPE_STACKED_BAR]: defaultRules,
    [VIS_TYPE_LINE]: defaultRules,
    [VIS_TYPE_AREA]: defaultRules,
    [VIS_TYPE_RADAR]: defaultRules,
    [VIS_TYPE_GAUGE]: defaultRules,
    [VIS_TYPE_PIE]: pieRules,
    [VIS_TYPE_SINGLE_VALUE]: singleValueRules,
    [VIS_TYPE_YEAR_OVER_YEAR_LINE]: yearOverYearRules,
    [VIS_TYPE_YEAR_OVER_YEAR_COLUMN]: yearOverYearRules,
}

export const getRulesByVisType = visType => visTypeToRules[visType]

// Test exports

export const testResourceRules = Object.values(visTypeToRules)

export const testResourceRequiredProps = [RULE_PROP_AVAILABLE_AXES]
