import React from 'react'

import PropTypes from '@dhis2/prop-types'
import i18n from '@dhis2/d2-i18n'
import { useConfig } from '@dhis2/app-runtime'
import {
    Modal,
    ModalContent,
    ModalActions,
    ButtonStrip,
    Button,
} from '@dhis2/ui'

import { supportedFileTypes, appPathFor } from './utils'

export const GetLinkDialog = ({ type, id, onClose }) => {
    const { baseUrl } = useConfig()

    // TODO simply use href from the visualization object?
    const appUrl = new URL(
        `${baseUrl}/${appPathFor(type, id)}`,
        `${window.location.origin}${window.location.pathname}`
    )

    return (
        <Modal onClose={onClose}>
            <ModalContent>
                <p>{i18n.t('Open in this app')}</p>
                <a href={appUrl.href}>{appUrl.href}</a>
            </ModalContent>
            <ModalActions>
                <ButtonStrip>
                    <Button onClick={onClose} secondary>
                        {i18n.t('Close')}
                    </Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}

GetLinkDialog.propTypes = {
    id: PropTypes.string,
    type: PropTypes.oneOf(supportedFileTypes),
    onClose: PropTypes.func,
}
