import { useEffect, useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import Header from './components/Header'
import ApiCard from './components/ApiCard'
import EndpointModal from './components/EndpointModal'
import CategoryCarousel from './components/CategoryCarousel'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)

  // Favorites Logic
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('aine_favs')
    return saved ? JSON.parse(saved) : []
  })

  const toggleFavorite = (path) => {
    setFavorites(prev => {
      const next = prev.includes(path)
        ? prev.filter(p => p !== path)
        : [...prev, path]
      localStorage.setItem('aine_favs', JSON.stringify(next))
      return next
    })
  }

  // Dark Mode Logic
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('aine_dark')
    return saved === 'true'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('aine_dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    axios.get('/settings')
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const categories = data?.categories || []
  const categoryNames = categories.map(c => c.name).sort()

  // Flatten for search/filter
  const allEndpoints = categories.flatMap(cat =>
    cat.items.map(item => ({ ...item, category: cat.name }))
  )

  const filtered = allEndpoints.filter(ep => {
    const s = search.toLowerCase()

    // Search match
    const matchesSearch = ep.name.toLowerCase().includes(s) ||
      ep.path.toLowerCase().includes(s) ||
      ep.desc.toLowerCase().includes(s) ||
      ep.category.toLowerCase().includes(s)

    // Method match
    const matchesMethod = methodFilter === 'all' || methodFilter === 'fav'
      ? true
      : 'get' === methodFilter // All are GET for now

    // Category match
    const matchesCategory = categoryFilter === 'all' || ep.category === categoryFilter

    // Favorites match
    const matchesFav = methodFilter === 'fav' ? favorites.includes(ep.path) : true

    return matchesSearch && matchesMethod && matchesCategory && matchesFav
  })

  // Stats
  const totalEndpoints = allEndpoints.length
  const totalCategories = categories.length

  return (
    <div className="min-h-screen pb-10 bg-[url('/images/bg-dots.svg')] bg-[length:14px_14px]">
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-aine-bg/90 backdrop-blur-sm"
          >
            <div className="glass overflow-hidden border border-white/60 shadow-lg max-w-md w-full p-4">
              <div className="text-center font-bold text-slate-500 mb-2">Memuat...</div>
              <img src="/images/loading-search.webp" className="w-full h-auto block rounded-xl" alt="Loading" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Header
          totalEndpoints={totalEndpoints}
          totalCategories={totalCategories}
          onBrowse={() => document.getElementById('endpoints')?.scrollIntoView({ behavior: 'smooth' })}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Category Carousel */}
        {!loading && (
          <section className="mb-4">
            <CategoryCarousel categories={categoryNames} selected={categoryFilter} onSelect={setCategoryFilter} />
          </section>
        )}

        {/* Search & Filter */}
        <section id="endpoints" className="mb-6 space-y-4">
          <div className="glass p-4 sm:p-5 border border-white/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="relative">
                <img src="/images/icons/search.svg" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-70" alt="search" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-[46px]"
                  placeholder="Cari endpoint… contoh: anime / tools..."
                />
              </div>

              <div className="overflow-x-auto pb-1 hide-scrollbar">
                <div className="flex gap-2 min-w-max">
                  {['all', 'fav', 'get'].map(m => (
                    <button
                      key={m}
                      onClick={() => setMethodFilter(m)}
                      className={`pill uppercase transition-colors cursor-pointer ${methodFilter === m
                        ? 'bg-aine-primary text-white border-aine-primary'
                        : 'text-slate-700 bg-white/70 hover:bg-white'
                        }`}
                    >
                      {m === 'fav' && <img src="/images/icons/star-fill.svg" className={`w-3 h-3 ${methodFilter === 'fav' ? 'brightness-[10]' : 'opacity-50'}`} alt="" />}
                      {m === 'fav' ? 'Favorit' : m === 'all' ? 'Semua' : m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* List */}
        <motion.section
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((ep, i) => (
              <ApiCard
                key={ep.path + i}
                endpoint={ep}
                index={i}
                onClick={() => setSelectedEndpoint(ep)}
                isFavorite={favorites.includes(ep.path)}
                onToggleFavorite={() => toggleFavorite(ep.path)}
              />
            ))}
          </AnimatePresence>

          {!loading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-24 text-center opacity-60 flex flex-col items-center justify-center p-6 border-2 border-dashed border-aine-stroke rounded-[32px] bg-aine-surface/30"
            >
              <img src="/images/no-results.webp" className="h-40 mx-auto rounded-xl opacity-80 mb-4 shadow-aine" alt="No results" />
              <p className="font-bold text-xl text-slate-600">Tidak ada endpoint ditemukan.</p>
              <p className="text-slate-500 mt-2">Coba ubah pencarian atau filter Anda</p>
              <button onClick={() => { setSearch(''); setCategoryFilter('all'); }} className="mt-4 btn bg-white hover:bg-slate-50">Hapus Filter</button>
            </motion.div>
          )}
        </motion.section>

        <footer className="mt-20 pb-8 text-center text-slate-500 text-sm font-medium">
          <p>© 2024 Aine Api'S — Dibuat Untuk Developer Oleh Developer</p>
        </footer>
      </main>

      <AnimatePresence>
        {selectedEndpoint && (
          <EndpointModal
            endpoint={selectedEndpoint}
            onClose={() => setSelectedEndpoint(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default App