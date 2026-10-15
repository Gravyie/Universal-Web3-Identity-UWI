import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Toaster } from 'sonner'
import { Web3 } from './web3/Web3'
import { CommandMenu } from './components/layout/CommandMenu'
import { Spinner } from './components/ui/Spinner'
import { useTheme } from './theme/ThemeProvider'

const Landing = lazy(() => import('./pages/Landing'))
const AppShell = lazy(() => import('./components/layout/AppShell').then((m) => ({ default: m.AppShell })))
const RequireWallet = lazy(() => import('./components/layout/AppShell').then((m) => ({ default: m.RequireWallet })))
const Onboard = lazy(() => import('./pages/onboard/Onboard'))
const Profile = lazy(() => import('./pages/Profile'))
const GateJoin = lazy(() => import('./pages/GateJoin'))
const Developers = lazy(() => import('./pages/Developers'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Overview = lazy(() => import('./pages/app/Overview'))
const Gates = lazy(() => import('./pages/app/Gates'))
const GateDetail = lazy(() => import('./pages/app/GateDetail'))
const Settings = lazy(() => import('./pages/app/Settings'))

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }))
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function Fallback() {
  return (
    <div className="grid min-h-[60dvh] place-items-center text-muted">
      <Spinner />
    </div>
  )
}

function Page() {
  const { pathname } = useLocation()
  return (
    <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
      <Suspense fallback={<Fallback />}>
        <Outlet />
      </Suspense>
    </motion.div>
  )
}

const Param = ({ to }) => {
  const params = useParams()
  return <Navigate to={to(params)} replace />
}

export default function App() {
  const { resolved } = useTheme()
  return (
    <>
      <a href="#main" className="sr-only rounded-full bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-80">
        Skip to content
      </a>
      <ScrollManager />
      <CommandMenu />
      <Routes>
        {/* The landing experience has its own chrome. */}
        <Route
          index
          element={
            <Suspense fallback={<div className="min-h-dvh bg-[#020306]" />}>
              <Landing />
            </Suspense>
          }
        />

        {/* Everything else lives in one app shell, so it all looks and works the same. */}
        <Route
          element={
            <Web3 fallback={<div className="min-h-dvh bg-bg" />}>
              <AppShell />
            </Web3>
          }
        >
          <Route element={<Page />}>
            <Route path="app/verify" element={<Onboard />} />
            <Route path="app/developers" element={<Developers />} />
            <Route path="u/:handle" element={<Profile />} />
            <Route path="g/:id" element={<GateJoin />} />
            <Route element={<RequireWallet />}>
              <Route path="app" element={<Overview />} />
              <Route path="app/gates" element={<Gates />} />
              <Route path="app/gates/:id" element={<GateDetail />} />
              <Route path="app/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>

        {/* Old links */}
        <Route path="start" element={<Navigate to="/app/verify" replace />} />
        <Route path="create" element={<Navigate to="/app/verify" replace />} />
        <Route path="developers" element={<Navigate to="/app/developers" replace />} />
        <Route path="verify" element={<Navigate to="/app/developers#lookup" replace />} />
        <Route path="id/:handle" element={<Param to={(p) => `/u/${p.handle}`} />} />
      </Routes>
      <Toaster
        theme={resolved}
        position="bottom-center"
        offset={88}
        toastOptions={{
          classNames: {
            toast: '!rounded-[16px] !border-line-strong !bg-bg-elev !text-ink !shadow-card',
            description: '!text-ink-2',
          },
        }}
      />
    </>
  )
}
