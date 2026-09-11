import { Languages } from 'lucide-react'
import { useI18n } from '@/i18n'
import { Button } from './ui/button'

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  const next = language === 'vi' ? 'en' : 'vi'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 text-white hover:bg-white/15 hover:text-white"
      onClick={() => setLanguage(next)}
      aria-label={t('language')}
      title={t('language')}
    >
      <Languages className="size-4" />
      <span>{language === 'vi' ? 'EN' : 'VI'}</span>
    </Button>
  )
}
