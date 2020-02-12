import React from 'react'
import PropTypes from 'prop-types'
import SvgIcon from '@material-ui/core/SvgIcon'

const LineIcon = props => (
    <SvgIcon viewBox={props.viewBox}>
        <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g>
                <mask id="mask-2" fill="white">
                    <rect x="0" y="0" width="16" height="16"></rect>
                </mask>
                <rect
                    fill={props.color}
                    mask="url(#mask-2)"
                    x="0"
                    y="15"
                    width="16"
                    height="1"
                ></rect>
                <rect
                    fill={props.color}
                    mask="url(#mask-2)"
                    x="0"
                    y="0"
                    width="1"
                    height="16"
                ></rect>
                <polyline
                    stroke={props.color}
                    strokeWidth="1.5"
                    mask="url(#mask-2)"
                    points="0 5 5 9 9 7 15 12"
                ></polyline>
            </g>
        </g>
    </SvgIcon>
)

LineIcon.propTypes = {
    color: PropTypes.string,
    viewBox: PropTypes.string,
}
LineIcon.defaultProps = {
    color: '#7B8998',
    viewBox: '0 0 16 16',
}

export default LineIcon
