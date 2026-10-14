import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ContractBanner } from './components/ContractBanner'
import { Spinner } from './components/ui/Spinner'
import Home from './pages/Home'

// The Self SDK alone is ~550 kB, so everything past the landing page loads on demand.
const Create = lazy(() => import('./pages/Create'))
const Credential = lazy(() => import('./pages/Credential'))
const Lookup = lazy(() => import('./pages/Lookup'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      // Wait a frame so the target section exists after a route change.
      requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }))
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-muted">
      <Spinner />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <div className="grain flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <ScrollManager />
      <ContractBanner />
      <Header />
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense fallback={<PageFallback />}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<Create />} />
                <Route path="/id/:address" element={<Credential />} />
                <Route path="/verify" element={<Lookup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
