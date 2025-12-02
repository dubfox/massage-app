'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguagePicker from '@/components/LanguagePicker'

export default function Home() {
  const { t } = useLanguage()
  const [showGuide, setShowGuide] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-green-50 via-white to-brand-green-100 p-4">
      <div className="absolute top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full border-2 border-brand-green-200">
        {/* Logo and Store Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            {/* Logo placeholder - replace with actual logo image */}
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-brand-green-500 to-brand-green-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-brand-green-100">
              <span className="text-white text-4xl font-bold">N</span>
            </div>
            {/* To use actual logo, replace the div above with:
            <img
              src="/logo.png"
              alt="Nantika Logo"
              className="w-24 h-24 mx-auto"
            />
            */}
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-brand-green-600 tracking-tight leading-tight">
            Nantika Physical Thai Massage
          </h1>
          <p className="text-xs text-gray-500 text-center mt-2">
            Service Management System
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-4 mb-4">
          <Link
            href="/manager"
            className="block w-full bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {t('landing.manager')}
          </Link>
          <Link
            href="/therapist/login"
            className="block w-full bg-brand-green-500 hover:bg-brand-green-600 text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {t('landing.therapist')}
          </Link>
          <Link
            href="/display"
            className="block w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-lg text-center transition-colors shadow-md border border-gray-200"
          >
            Live Service Board (Shop Display)
          </Link>
        </div>
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowGuide((prev) => !prev)}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {showGuide ? t('guide.landing.toggle.hide') : t('guide.landing.toggle.show')}
          </button>
        </div>

        {/* Simple usage guide */}
        {showGuide && (
          <div className="mt-1 text-xs text-gray-700 space-y-3 border-t border-gray-100 pt-3">
            <div className="font-semibold text-gray-900">
              {t('guide.landing.title')}
            </div>
            <div>
              <div className="font-semibold text-gray-800">
                {t('guide.landing.manager.title')}
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('guide.landing.manager.step1')}</li>
                <li>{t('guide.landing.manager.step2')}</li>
                <li>{t('guide.landing.manager.step3')}</li>
                <li>{t('guide.landing.manager.step4')}</li>
                <li>{t('guide.landing.manager.step5')}</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-800">
                {t('guide.landing.therapist.title')}
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('guide.landing.therapist.step1')}</li>
                <li>{t('guide.landing.therapist.step2')}</li>
                <li>{t('guide.landing.therapist.step3')}</li>
                <li>{t('guide.landing.therapist.step4')}</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

