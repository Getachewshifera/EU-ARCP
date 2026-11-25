import useLanguage from '../../hooks/useLanguage.js'

function LanguageToggle({ className = '' }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <button
      aria-label={t(language === 'en' ? 'Switch to Amharic' : 'Switch to English')}
      className={`btn btn-outline-secondary btn-sm ${className}`.trim()}
      onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
      type="button"
    >
      {language === 'en' ? 'አማርኛ' : 'English'}
    </button>
  )
}

export default LanguageToggle
