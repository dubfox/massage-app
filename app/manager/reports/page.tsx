'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ManagerReports() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Reports</h1>
        </div>
      </header>

      {/* Side Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-900">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="w-6 h-6 text-gray-900" />
              </button>
            </div>
            <nav className="p-4">
              <Link
                href="/"
                className="block py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/manager"
                className="block py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Daily Matrix
              </Link>
              <Link
                href="/manager/therapists"
                className="flex items-center gap-2 py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="w-5 h-5 text-gray-900" />
                Therapist Management
              </Link>
              <Link
                href="/manager/services"
                className="block py-2 px-4 hover:bg-gray-100 rounded-lg mb-2 text-gray-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Services Management
              </Link>
              <Link
                href="/manager/reports"
                className="block py-2 px-4 bg-blue-50 text-gray-900 rounded-lg font-semibold"
                onClick={() => setIsMenuOpen(false)}
              >
                Reports
              </Link>
            </nav>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
          <p className="text-gray-600 text-center py-8">
            Reports feature coming soon...
          </p>
          <Link
            href="/manager"
            className="block text-center text-blue-600 hover:text-blue-800 font-semibold"
          >
            Back to Daily Matrix
          </Link>
        </div>
      </div>
    </div>
  )
}

