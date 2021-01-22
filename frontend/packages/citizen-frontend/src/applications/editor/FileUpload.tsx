import React, { useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from '~localization'
import { Gap } from '@evaka/lib-components/src/white-space'
import colors from '@evaka/lib-components/src/colors'
import IconButton from '@evaka/lib-components/src/atoms/buttons/IconButton'
import {
  faExclamationTriangle,
  faFile,
  faFileImage,
  faFilePdf,
  faFileWord,
  faTimes
} from '@evaka/lib-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { UUID } from '@evaka/lib-common/src/types'
import { Result } from '@evaka/lib-common/src/api'
import { Attachment, FileObject } from '@evaka/lib-common/src/api-types/application/ApplicationDetails'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

export type FileUploadProps = {
  files: Attachment[]
  onUpload: (
    file: File,
    onUploadProgress: (progressEvent: ProgressEvent) => void
  ) => Promise<Result<UUID>>
  onDelete: (id: UUID) => Promise<Result<void>>
}

export type ProgressEvent = {
  loaded: number
  total: number
}

const FileUploadContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
`

const FileInputLabel = styled.label`
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: ${colors.greyscale.lightest};
  border: 1px dashed ${colors.greyscale.medium};
  border-radius: 8px;
  width: min(500px, 70vw);
  padding: 24px;
  text-align: center;

  & input {
    display: none;
  }

  & h4 {
    font-size: 18px;
    margin-bottom: 14px;
  }
`

const Icon = styled(FontAwesomeIcon)`
  height: 1rem !important;
  width: 1rem !important;
  margin-right: 10px;
`

const UploadedFiles = styled.div`
  display: flex;
  flex-direction: column;

  > *:not(:last-child) {
    margin-bottom: 20px;
  }
`

const File = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  color: ${colors.greyscale.dark};
`

const FileIcon = styled(FontAwesomeIcon)`
  margin-right: 16px;
  flex: 0;
  color: ${colors.blues.primary};
`

const FileDetails = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
`

const FileHeader = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  font-size: 15px;
`

const ProgressBarContainer = styled.div`
  position: relative;
  background: ${colors.greyscale.medium};
  height: 3px;
  border-radius: 1px;
`

interface ProgressBarProps {
  progress: number
}

const ProgressBar = styled.div<ProgressBarProps>`
  width: ${(props) => props.progress}%;
  position: absolute;
  top: 0;
  left: 0;
  background: ${colors.blues.medium};
  height: 3px;
  border-radius: 1px;
  transition: width 0.5s ease-out;
`
const FileDownloadButton = styled.button`
  border: none;
  background: none;
  cursor: pointer;
  color: ${colors.blues.primary};
`

const FileDeleteButton = styled(IconButton)`
  border: none;
  background: none;
  padding: 4px;
  margin-left: 12px;
  color: ${colors.greyscale.medium};
  cursor: pointer;

  &:hover {
    color: ${colors.blues.medium};
  }

  &:disabled {
    color: ${colors.greyscale.lighter};
    cursor: not-allowed;
  }
`

const ProgressBarDetails = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  color: ${colors.greyscale.dark};
`

const ProgressBarError = styled.div`
  color: ${colors.accents.orangeDark} svg {
    color: ${colors.accents.orange};
    margin-left: 8px;
  }
`

const attachmentToFile = (attachment: Attachment): FileObject => {
  return {
    id: attachment.id,
    file: undefined,
    key: Math.random(),
    name: attachment.name,
    contentType: attachment.contentType,
    progress: 100,
    error: undefined
  }
}

const fileIcon = (file: FileObject): IconDefinition => {
  switch (file.contentType) {
    case 'image/jpeg':
    case 'image/png':
      return faFileImage
    case 'application/pdf':
      return faFilePdf
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/vnd.oasis.opendocument.text':
      return faFileWord
    default:
      return faFile
  }
}

const inProgress = (file: FileObject): boolean =>
  !file.error && file.progress !== 100

export default React.memo(function FileUpload({
  files,
  onUpload,
  onDelete
}: FileUploadProps) {
  const t = useTranslation()

  const [uploadedFiles, setUploadedFiles] = useState<FileObject[]>(
    files.map(attachmentToFile)
  )

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // FileList is empty when one file is uploaded and then selecting another one is cancelled,
    // clearing the input's value
    if (event.target.files && event.target.files.length > 0) {
      void addAttachment(event.target.files[0], onUpload)
    }
  }

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    if (event.dataTransfer && event.dataTransfer.files[0]) {
      void addAttachment(event.dataTransfer.files[0], onUpload)
    }
  }

  const deleteFile = async (id: UUID) => {
    try {
      const result = await onDelete(id)
      result.isSuccess &&
        setUploadedFiles((old: FileObject[]) => {
          return old.filter((item) => item.id !== id)
        })
    } catch (e) {
      console.error(e)
    }
  }

  const addAttachment = async (
    file: File,
    onUpload: (
      file: File,
      onUploadProgress: (progressEvent: ProgressEvent) => void
    ) => Promise<Result<UUID>>
  ) => {
    const error = file.size > 10000000 ? 'file-too-big' : undefined
    const fileObject: FileObject = {
      id: Math.random().toString(),
      key: 1,
      file,
      name: file.name,
      contentType: file.type,
      progress: 0,
      error
    }

    if (error) {
      return
    }

    const updateProgress = ({ loaded, total }: ProgressEvent) => {
      const progress = Math.round((loaded / total) * 100)
      setUploadedFiles((old: FileObject[]) => {
        const others = old.filter((item) => item.id !== fileObject.id)
        const progressedFile = { ...fileObject, progress }
        return [...others, progressedFile]
      })
    }

    try {
      const result = await onUpload(file, updateProgress)
      result.isSuccess &&
        setUploadedFiles((old: FileObject[]) => {
          const others = old.filter((item) => item.id !== fileObject.id)
          const progressedFile = {
            ...fileObject,
            progress: 100,
            id: result.value
          }
          return [...others, progressedFile]
        })
    } catch (e) {
      console.error(e)
      setUploadedFiles((old: FileObject[]) => {
        const others = old.filter((item) => item.id !== fileObject.id)
        const progressedFile = { ...fileObject, error: 'server-error' }
        return [...others, progressedFile]
      })
    }
  }

  return (
    <FileUploadContainer>
      <FileInputLabel className="file-input-label" onDrop={onDrop}>
        <input
          type="file"
          accept="image/jpeg, image/png, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.oasis.opendocument.text"
          onChange={onChange}
          data-qa="btn-upload-file"
        />
        <h4>{t.fileUpload.input.title}</h4>
        <p>{t.fileUpload.input.text.join('\n')}</p>
      </FileInputLabel>
      <Gap horizontal size={'s'} />
      <UploadedFiles>
        {uploadedFiles.map((file) => (
          <File key={file.key}>
            <FileIcon icon={fileIcon(file)}></FileIcon>
            <FileDetails>
              <FileHeader>
                {file.id ? (
                  <FileDownloadButton>{file.name}</FileDownloadButton>
                ) : (
                  <span>{file.name}</span>
                )}
                <FileDeleteButton
                  icon={faTimes}
                  onClick={() => deleteFile(file.id)}
                />
              </FileHeader>
              {inProgress(file) && (
                <ProgressBarContainer>
                  <ProgressBar progress={file.progress}></ProgressBar>
                  {file.error && (
                    <ProgressBarError>
                      <Icon icon={faExclamationTriangle} />
                    </ProgressBarError>
                  )}
                  {!file.error && (
                    <ProgressBarDetails>
                      <span>
                        {inProgress(file)
                          ? t.fileUpload.loading
                          : t.fileUpload.loaded}
                      </span>
                      <span>{file.progress} %</span>
                    </ProgressBarDetails>
                  )}
                </ProgressBarContainer>
              )}
            </FileDetails>
          </File>
        ))}
      </UploadedFiles>
    </FileUploadContainer>
  )
})
