import React, { Component } from 'react'
import propTypes from '@dhis2/prop-types'
import i18n from '@dhis2/d2-i18n'
import { SingleSelectField, SingleSelectOption } from '@dhis2/ui'
import FixedPeriodFilter from './FixedPeriodFilter.js'
import {
    parsePeriodCode,
    getFixedPeriodsOptionsById as getPeriodById,
    getYearOffsetFromNow,
} from './utils/fixedPeriods.js'
import styles from './styles/FixedPeriodSelect.style.js'

class FixedPeriodSelect extends Component {
    state = {
        periodType: '',
        year: '',
        options: null,
    }

    static getDerivedStateFromProps({ value, allowedPeriodTypes }) {
        const period = parsePeriodCode(value, allowedPeriodTypes)

        if (!period) {
            return null
        }

        return {
            periodType: period.id,
            year: period.year,
            options: period.options,
        }
    }

    onSelectPeriodType = periodType => {
        this.setState({
            periodType,
            options: this.getUpdatedOptions(periodType, this.state.year),
        })
        this.props.onChange()
    }

    onSelectYear = year => {
        this.setState({
            year,
            options: this.getUpdatedOptions(this.state.periodType, year),
        })
        this.props.onChange()
    }

    onSelectPeriod = ({ selected: periodId }, event) => {
        const period = this.state.options.find(({ id }) => id === periodId)
        this.props.onChange(period, event)
    }

    getUpdatedOptions(periodType, year) {
        const offset = getYearOffsetFromNow(year)
        return getPeriodById(periodType).getPeriods({ offset })
    }

    render() {
        return (
            <div
                data-test={this.props.dataTest}
                className={this.props.className}
            >
                <div className="row">
                    <FixedPeriodFilter
                        allowedPeriodTypes={this.props.allowedPeriodTypes}
                        currentPeriodType={this.state.periodType}
                        currentYear={this.state.year}
                        onSelectPeriodType={this.onSelectPeriodType}
                        onSelectYear={this.onSelectYear}
                    />
                </div>

                {this.state.periodType && this.state.year && (
                    <SingleSelectField
                        label={i18n.t('Period')}
                        onChange={this.onSelectPeriod}
                        dense
                        selected={this.props.value}
                    >
                        {this.state.options.map(option => (
                            <SingleSelectOption
                                key={option.id}
                                value={option.id}
                                label={option.name}
                            />
                        ))}
                    </SingleSelectField>
                )}
                <style jsx>{styles}</style>
            </div>
        )
    }
}

FixedPeriodSelect.defaultProps = {
    dataTest: 'dhis2-analytics-fixedperiodselect',
    value: '',
}

FixedPeriodSelect.propTypes = {
    onChange: propTypes.func.isRequired,
    allowedPeriodTypes: propTypes.arrayOf(propTypes.string),
    className: propTypes.string,
    dataTest: propTypes.string,
    value: propTypes.string,
}

export default FixedPeriodSelect
