// Purpose: Composer for sending a chat message.
import { useRef } from 'react'
import useLanguage from '../../hooks/useLanguage.js'

function MessageInput({
  draft,
  onDraftChange,
  onSubmit,
  sending = false,
  disabled = false,
  file,
  onFileChange,
  onClearFile,
  onTyping,
  attachmentAccept = '.pdf,.doc,.docx,.ppt,.pptx',
  attachmentHint = 'Attach a PDF, DOC, DOCX, PPT or PPTX file up to 20 MB.',
  attachmentLabel = 'Attach document',
}) {
  const { t } = useLanguage()
  const fileInput = useRef(null)

  function chooseFile(event) {
    onFileChange?.(event.target.files?.[0] || null)
    event.target.value = ''
  }

  return (
    <form className="border-top p-3" onSubmit={onSubmit}>
      {file && (
        <div className="d-flex align-items-center gap-2 small mb-2">
          <span className="text-truncate">{file.name}</span>
          <button className="btn btn-link btn-sm p-0" onClick={onClearFile} type="button">{t('Remove')}</button>
        </div>
      )}
      <label className="visually-hidden" htmlFor="chat-message-input">{t('Write a message')}</label>
      <div className="input-group">
        <textarea
          className="form-control"
          disabled={disabled || sending}
          id="chat-message-input"
          maxLength="5000"
          onChange={(event) => {
            onDraftChange(event.target.value)
            onTyping?.(Boolean(event.target.value.trim()))
          }}
          placeholder={t('Write a message…')}
          rows="2"
          value={draft}
        />
        <button
          aria-label={t(attachmentLabel)}
          className="btn btn-outline-secondary"
          disabled={disabled || sending || Boolean(file)}
          onClick={() => fileInput.current?.click()}
          title={t(attachmentLabel)}
          type="button"
        >
          <span aria-hidden="true">＋</span>
        </button>
        <input
          accept={attachmentAccept}
          className="d-none"
          disabled={disabled || sending || Boolean(file)}
          onChange={chooseFile}
          ref={fileInput}
          type="file"
        />
        <button className="btn btn-primary" disabled={disabled || sending || (!draft.trim() && !file)} type="submit">
          {t(sending ? 'Sending…' : 'Send')}
        </button>
      </div>
      <div className="form-text">{t(attachmentHint)}</div>
    </form>
  )
}

export default MessageInput
