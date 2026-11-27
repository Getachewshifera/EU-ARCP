// Purpose: Rendered list of messages in a conversation.
import { Fragment } from 'react'
import { getAvatarUrl } from '../../services/studentService.js'
import useLanguage from '../../hooks/useLanguage.js'

const REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏']

function messageDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
}

function messageTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function messageDay(value, t) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  const difference = Math.round((today.getTime() - day.getTime()) / 86400000)
  if (difference === 0) return t('Today')
  if (difference === 1) return t('Yesterday')
  return date.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  })
}

function MessageList({
  messages = [],
  currentUserId,
  canModerate = false,
  onReply,
  onDelete,
  onDeleteForMe,
  onDeleteForEveryone,
  onDownload,
  onReact,
  reactionsDisabled = false,
  showReceipts = false,
  appearance = 'default',
  attachmentUrls = {},
}) {
  const { t } = useLanguage()
  const groupAppearance = appearance === 'group'
  const privateAppearance = appearance === 'private'

  if (!messages.length) {
    return <p className="text-secondary text-center my-5">{t('No messages in this conversation yet.')}</p>
  }

  return (
    <ol className={`list-unstyled d-flex flex-column gap-3 mb-0 ${groupAppearance ? 'group-chat-message-list' : ''} ${privateAppearance ? 'private-chat-message-list' : ''}`}>
      {messages.map((message, index) => {
        const senderId = String(message.sender?._id || message.sender?.id || message.sender || '')
        const mine = senderId === String(currentUserId)
        const senderName = message.sender?.name || [message.sender?.firstName, message.sender?.lastName].filter(Boolean).join(' ') || t('Participant')
        const senderHue = [...senderId].reduce((hue, character) => (hue * 31 + character.charCodeAt(0)) % 360, 0)
        const reactions = message.reactions || []
        const hasPrivateActions = !message.deletedAt
          && (onReply || onDeleteForMe || (mine && onDeleteForEveryone))
        const currentDay = new Date(message.createdAt).toDateString()
        const previousDay = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : ''
        const renderReaction = (emoji) => {
          const count = reactions.filter((reaction) => reaction.emoji === emoji).length
          const selected = reactions.some((reaction) => (
            reaction.emoji === emoji
            && String(reaction.user?._id || reaction.user?.id || reaction.user) === String(currentUserId)
          ))
          return (
            <button
              aria-label={`${emoji}${count ? ` ${count}` : ''}`}
              aria-pressed={selected}
              className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
              disabled={reactionsDisabled}
              key={emoji}
              onClick={() => onReact(message, emoji)}
              title={emoji}
              type="button"
            >
              {emoji}{count > 0 && <span className="ms-1">{count}</span>}
            </button>
          )
        }
        return (
          <Fragment key={message._id || message.id || index}>
            {privateAppearance && currentDay !== previousDay && (
              <li className="private-chat-day-divider" role="separator">
                <span>{messageDay(message.createdAt, t)}</span>
              </li>
            )}
            <li className={`d-flex gap-2 ${mine && !groupAppearance && !privateAppearance ? 'flex-row-reverse' : ''} ${groupAppearance ? `group-chat-message-row ${mine ? 'group-chat-message-row--mine' : ''}` : ''} ${privateAppearance ? `private-chat-message-row ${mine ? 'private-chat-message-row--mine' : ''}` : ''}`}>
            {(!groupAppearance && !privateAppearance || (groupAppearance && !mine)) && (message.sender?.profilePhoto
              ? <img alt="" className="rounded-circle border flex-shrink-0" height="32" src={getAvatarUrl(message.sender.profilePhoto)} style={{ objectFit: 'cover' }} width="32" />
              : <span aria-hidden="true" className="rounded-circle bg-secondary-subtle flex-shrink-0 d-inline-flex justify-content-center align-items-center small fw-semibold" style={{ height: 32, width: 32 }}>
                  {senderName.trim().slice(0, 1).toUpperCase()}
                </span>)}
            <article
              className={`border rounded-3 p-3 ${groupAppearance ? `group-chat-bubble ${mine ? 'group-chat-bubble--mine' : ''}` : privateAppearance ? `private-chat-bubble ${mine ? 'private-chat-bubble--mine' : ''}` : mine ? 'bg-primary-subtle' : 'bg-body-tertiary'}`}
              style={groupAppearance ? { '--group-chat-sender-hue': senderHue } : privateAppearance ? undefined : { maxWidth: '75%' }}
            >
              {(groupAppearance || (!mine && !privateAppearance)) && <div className={`small fw-semibold mb-1 ${groupAppearance ? 'group-chat-sender' : ''}`}>{senderName}</div>}
              {message.replyTo && (
                <blockquote className={`small mb-2 text-secondary ${groupAppearance ? 'group-chat-reply' : 'border-start border-3 ps-2'}`}>
                  {groupAppearance && message.replyTo.sender && (
                    <strong className="d-block group-chat-reply__sender">
                      {message.replyTo.sender.name || [message.replyTo.sender.firstName, message.replyTo.sender.lastName].filter(Boolean).join(' ') || t('Participant')}
                    </strong>
                  )}
                  {message.replyTo.deletedAt
                    ? t('Message deleted')
                    : message.replyTo.body || (message.replyTo.attachments?.[0]?.mimeType?.startsWith('image/')
                      ? t('Photo')
                      : message.replyTo.attachments?.[0]?.name || t('Attachment'))}
                </blockquote>
              )}
              {message.deletedAt
                ? <p className="small fst-italic text-secondary mb-1">{t('Message deleted')}</p>
                : <>
                  {message.body && <p className="mb-1 text-break">{message.body}</p>}
                  {(message.attachments || []).map((attachment, attachmentIndex) => {
                    const isImage = groupAppearance && attachment.mimeType?.startsWith('image/')
                    const imageUrl = attachmentUrls[`${message._id || message.id}:${attachmentIndex}`]
                    return isImage
                      ? <button
                        aria-label={t('Open photo')}
                        className="group-chat-photo-button d-block my-1"
                        key={attachment._id || attachment.name || attachmentIndex}
                        onClick={() => onDownload?.(message, attachmentIndex)}
                        type="button"
                      >
                        {imageUrl
                          ? <img alt={attachment.name || t('Photo')} className="group-chat-photo" loading="lazy" src={imageUrl} />
                          : <span className="group-chat-photo-placeholder">{t('Loading photo…')}</span>}
                        <span className="d-block small text-start mt-1">{t('Photo')}</span>
                      </button>
                      : <button
                        className="btn btn-sm btn-outline-secondary d-block my-1"
                        key={attachment._id || attachment.name || attachmentIndex}
                        onClick={() => onDownload?.(message, attachmentIndex)}
                        type="button"
                      >
                        {attachment.name} <span className="small">({Math.ceil(attachment.size / 1024)} KB)</span>
                      </button>
                  })}
                </>}
              {!message.deletedAt && onReact && (
                groupAppearance || privateAppearance
                  ? <div className={groupAppearance ? 'group-chat-reactions' : 'private-chat-reactions'}>
                    {REACTION_OPTIONS
                      .filter((emoji) => reactions.some((reaction) => reaction.emoji === emoji))
                      .map(renderReaction)}
                    <details className={groupAppearance ? 'group-chat-reaction-picker' : 'private-chat-reaction-picker'}>
                      <summary aria-label={t('Add reaction')} title={t('Add reaction')}>☺</summary>
                      <div className={groupAppearance ? 'group-chat-reaction-picker__options' : 'private-chat-reaction-picker__options'}>{REACTION_OPTIONS.map(renderReaction)}</div>
                    </details>
                  </div>
                  : <div className="d-flex flex-wrap gap-1 mt-2">{REACTION_OPTIONS.map(renderReaction)}</div>
              )}
              <div className={`d-flex flex-wrap align-items-center gap-2 mt-2 ${privateAppearance ? 'private-chat-meta' : 'justify-content-end'}`}>
                {!privateAppearance && <time className={`small text-secondary ${groupAppearance ? 'group-chat-time' : ''}`} dateTime={message.createdAt}>{messageDate(message.createdAt)}</time>}
                {privateAppearance && <time className="small text-secondary private-chat-time" dateTime={message.createdAt}>{messageTime(message.createdAt)}</time>}
                {showReceipts && mine && !message.deletedAt && (
                  <span
                    aria-label={t(message.readAt ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent')}
                    className={`small ${privateAppearance ? `private-chat-receipt ${message.readAt ? 'private-chat-receipt--read' : ''}` : 'text-secondary'}`}
                    title={t(message.readAt ? 'Read' : message.deliveredAt ? 'Delivered' : 'Sent')}
                  >
                    {privateAppearance
                      ? message.readAt || message.deliveredAt ? '✓✓' : '✓'
                      : message.readAt ? t('Read') : message.deliveredAt ? t('Delivered') : t('Sent')}
                  </span>
                )}
                {privateAppearance ? hasPrivateActions && (
                  <details className="private-chat-actions">
                    <summary aria-label={t('Message actions')} title={t('Message actions')}>···</summary>
                    <div className="private-chat-actions__menu">
                      {!message.deletedAt && onReply && (
                        <button className="btn btn-sm" onClick={() => onReply(message)} type="button">{t('Reply')}</button>
                      )}
                      {!message.deletedAt && onDeleteForMe && (
                        <button className="btn btn-sm text-danger" onClick={() => onDeleteForMe(message)} type="button">{t('Delete for me')}</button>
                      )}
                      {!message.deletedAt && mine && onDeleteForEveryone && (
                        <button className="btn btn-sm text-danger" onClick={() => onDeleteForEveryone(message)} type="button">{t('Delete for everyone')}</button>
                      )}
                    </div>
                  </details>
                ) : <>
                {!message.deletedAt && onReply && (
                  <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={() => onReply(message)} type="button">
                    {t('Reply')}
                  </button>
                )}
                {!message.deletedAt && onDelete && (mine || canModerate) && (
                  <button className="btn btn-link btn-sm p-0 text-danger text-decoration-none" onClick={() => onDelete(message)} type="button">
                    {t('Delete')}
                  </button>
                )}
                {!message.deletedAt && onDeleteForMe && (
                  <button className="btn btn-link btn-sm p-0 text-danger text-decoration-none" onClick={() => onDeleteForMe(message)} type="button">
                    {t('Delete for me')}
                  </button>
                )}
                {!message.deletedAt && mine && onDeleteForEveryone && (
                  <button className="btn btn-link btn-sm p-0 text-danger text-decoration-none" onClick={() => onDeleteForEveryone(message)} type="button">
                    {t('Delete for everyone')}
                  </button>
                )}
                </>}
              </div>
            </article>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

export default MessageList
