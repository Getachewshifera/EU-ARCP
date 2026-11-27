// Purpose: Conversation view that combines messages and message entry.
import MessageInput from './MessageInput.jsx'
import MessageList from './MessageList.jsx'
import useLanguage from '../../hooks/useLanguage.js'

function ChatWindow({
  title,
  status,
  headerActions,
  typingLabel,
  messages,
  currentUserId,
  canModerate,
  showReceipts,
  hasMore,
  loadingMore,
  onLoadOlder,
  onReply,
  onDelete,
  onDeleteForMe,
  onDeleteForEveryone,
  onDownload,
  onReact,
  reactionsDisabled,
  draft,
  onDraftChange,
  onSubmit,
  sending,
  disabled,
  file,
  onFileChange,
  onClearFile,
  onTyping,
  appearance = 'default',
  attachmentUrls = {},
  attachmentAccept,
  attachmentHint,
  attachmentLabel,
  headerAvatar,
  headerAvatarInitial,
}) {
  const { t } = useLanguage()

  return (
    <section className={`card h-100 overflow-hidden chat-window ${appearance === 'group' ? 'chat-window--group' : appearance === 'private' ? 'chat-window--private' : ''}`}>
      <header className="card-header bg-body d-flex justify-content-between align-items-center gap-2">
        <h2 className="h6 mb-0 text-truncate d-flex align-items-center gap-2">
          {headerAvatar
            ? <img alt="" className="chat-window__avatar" src={headerAvatar} />
            : headerAvatarInitial
              ? <span aria-hidden="true" className="chat-window__avatar chat-window__avatar--initial">{headerAvatarInitial}</span>
              : null}
          <span className="text-truncate">{title || t('Choose a conversation')}</span>
        </h2>
        <div className="d-flex align-items-center gap-2">
          {status && <span className={`small text-nowrap ${status.online ? 'text-success' : 'text-secondary'}`}>
            <span aria-hidden="true">● </span>{t(status.online ? 'Online' : 'Offline')}
          </span>}
          {headerActions}
        </div>
      </header>
      <div className="card-body overflow-auto d-flex flex-column chat-window__messages" style={{ minHeight: '22rem', maxHeight: '60vh' }} aria-live="polite">
        {hasMore && (
          <button className="btn btn-link btn-sm align-self-center" disabled={loadingMore} onClick={onLoadOlder} type="button">
            {t(loadingMore ? 'Loading…' : 'Load older messages')}
          </button>
        )}
        {loadingMore && !messages.length
          ? <div className="text-secondary text-center my-auto" role="status">{t('Loading messages…')}</div>
          : <MessageList
            canModerate={canModerate}
            currentUserId={currentUserId}
            appearance={appearance}
            attachmentUrls={attachmentUrls}
            messages={messages}
            onDelete={onDelete}
            onDeleteForMe={onDeleteForMe}
            onDeleteForEveryone={onDeleteForEveryone}
            onDownload={onDownload}
            onReact={onReact}
            reactionsDisabled={reactionsDisabled}
            onReply={onReply}
            showReceipts={showReceipts}
          />}
        {typingLabel && <div className="small text-secondary mt-2" role="status">{typingLabel}</div>}
      </div>
      <MessageInput
        disabled={disabled}
        draft={draft}
        file={file}
        onClearFile={onClearFile}
        onDraftChange={onDraftChange}
        onFileChange={onFileChange}
        onSubmit={onSubmit}
        onTyping={onTyping}
        sending={sending}
        attachmentAccept={attachmentAccept}
        attachmentHint={attachmentHint}
        attachmentLabel={attachmentLabel}
      />
    </section>
  )
}

export default ChatWindow
