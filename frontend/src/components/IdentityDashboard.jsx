import React from 'react'

export default function IdentityDashboard({ userData }) {
  return (
    <div className="font-mono text-green-400 p-6 bg-black rounded-lg whitespace-pre-wrap select-none">
      <h2 className="text-3xl font-bold mb-6">Identity Dashboard</h2>
      <pre>{JSON.stringify(userData, null, 2)}</pre>
    </div>
  )
}
