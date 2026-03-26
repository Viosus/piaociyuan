'use client';

import { useState, useEffect } from 'react';

const CONSENT_KEY = 'privacy-consent-accepted';

export default function PrivacyConsent() {
  const [visible, setVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setVisible(false);
  };

  const handleDecline = () => {
    setWarningMessage('您需要同意隐私政策才能使用本应用');
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-4">
          隐私政策与用户协议
        </h2>

        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          在使用本应用之前，请您仔细阅读并同意我们的
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#46467A] underline mx-1 hover:text-[#3a3a6a]"
          >
            隐私政策
          </a>
          和
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#46467A] underline mx-1 hover:text-[#3a3a6a]"
          >
            服务条款
          </a>
          。我们重视您的个人信息保护，仅在提供服务所必需的范围内收集和使用您的信息。
        </p>

        {warningMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 text-center">{warningMessage}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleAccept}
            className="w-full py-3 bg-[#46467A] text-white rounded-lg text-sm font-medium hover:bg-[#3a3a6a] transition-colors"
          >
            同意并继续
          </button>
          <button
            onClick={handleDecline}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            不同意
          </button>
        </div>
      </div>
    </div>
  );
}
