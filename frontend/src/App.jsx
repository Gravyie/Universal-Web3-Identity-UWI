import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Toaster } from 'sonner'
import { ReactLenis } from 'lenis/react'
import { SiteHeader } from './components/layout/SiteHeader'
import { Footer } from './components/layout/Footer'
import { AppShell } from './components/layout/AppShell'
import { CommandMenu } from './components/layout/CommandMenu'
import { Spinner } from './components/ui/Spinner'
import { useTheme } from './theme/ThemeProvider'

const Film = lazy(() => import('./pages/Film'))
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
    if (hash) {
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }))
    } else {
      window.scrollTo(0, 0)
    }
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
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <Suspense fallback={<Fallback />}>
        <Outlet />
      </Suspense>
    </motion.div>
  )
}

function SiteLayout() {
  return (
    <ReactLenis root options={{ lerp: 0.12, smoothWheel: true }}>
      <SiteHeader />
      <main id="main" className="min-h-[70dvh]">
        <Page />
      </main>
      <Footer />
    </ReactLenis>
  )
}

function RedirectToProfile() {
  const { handle } = useParams()
  return <Navigate to={`/u/${handle}`} replace />
}

export default function App() {
  const { resolved } = useTheme()
  return (
    <div className="grain">
      <a href="#main" className="sr-only rounded-full bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-80">
        Skip to content
      </a>
      <ScrollManager />
      <CommandMenu />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="start" element={<Onboard />} />
          <Route path="u/:handle" element={<Profile />} />
          <Route path="g/:id" element={<GateJoin />} />
          <Route path="developers" element={<Developers />} />
          <Route path="create" element={<Navigate to="/start" replace />} />
          <Route path="verify" element={<Navigate to="/developers#lookup" replace />} />
          <Route path="id/:handle" element={<RedirectToProfile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        {/* The landing page is a film with its own chrome, outside the site layout. */}
        <Route
          index
          element={
            <Suspense fallback={<div className="min-h-dvh bg-[#020306]" />}>
              <Film />
            </Suspense>
          }
        />
        <Route path="app" element={<AppShell />}>
          <Route element={<Page />}>
            <Route index element={<Overview />} />
            <Route path="gates" element={<Gates />} />
            <Route path="gates/:id" element={<GateDetail />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
      <Toaster
        theme={resolved}
        position="bottom-center"
        offset={88}
        toastOptions={{
          classNames: {
            toast: '!rounded-[20px] !border-line-strong !bg-bg-elev !text-ink !shadow-card',
            description: '!text-ink-2',
          },
        }}
      />
    </div>
  )
}
