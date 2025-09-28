import React from 'react'

export default function IdentityDashboard({ userData }) {
  return (
    <div className="font-mono text-green-400 p-6 bg-black rounded-lg border border-green-600 whitespace-pre-wrap select-none">
      <div className="mx-auto text-3xl font-bold mb-6">UWI ID</div>
      <pre>{JSON.stringify(userData, null, 2)}</pre>
    </div>
  )
}
