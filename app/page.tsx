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
            {showGuide ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {/* Simple usage guide */}
        {showGuide && (
          <div className="mt-1 text-xs text-gray-700 space-y-3 border-t border-gray-100 pt-3">
            <div className="font-semibold text-gray-900">
              How to use this system
            </div>
            <div>
              <div className="font-semibold text-gray-800">For Manager</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Go to <span className="font-semibold">Manager Interface</span>.</li>
                <li>Check therapists in or out from <span className="font-semibold">Therapist Management</span> so the queue is correct.</li>
                <li>Use the <span className="font-semibold">Daily Matrix</span> to add services; the system will choose the next available, certified therapist.</li>
                <li>Click <span className="font-semibold">End Service</span> when a session is finished so therapists re‑enter the queue.</li>
                <li>Use the <span className="font-semibold">Service Chart</span> and <span className="font-semibold">Therapist Revenue</span> tabs to review daily performance and revenue.</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-800">For Therapist</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Go to <span className="font-semibold">Therapist Interface</span> to Clock In and join the queue.</li>
                <li>When leaving or taking a break, use <span className="font-semibold">Clock Out / Check Out</span> so the queue stays accurate.</li>
                <li>You can close the screen with <span className="font-semibold">Close Screen (Stay Clocked In)</span> and remain in the queue.</li>
                <li>Use <span className="font-semibold">View Daily Summary</span> to see your sessions and totals for the day.</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

