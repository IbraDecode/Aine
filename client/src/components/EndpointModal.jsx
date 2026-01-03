import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'

export default function EndpointModal({ endpoint, onClose }) {
    const [params, setParams] = useState([])
    const [paramValues, setParamValues] = useState({})
    const [result, setResult] = useState(null)
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(false)
    const [time, setTime] = useState(0)

    const [history, setHistory] = useState([])
    const [tab, setTab] = useState('request') // 'request' | 'history'

    // Load history
    useEffect(() => {
        try {
            const saved = localStorage.getItem('aine_history')
            if (saved) setHistory(JSON.parse(saved))
        } catch { }
    }, [])

    // Parse query params from path
    useEffect(() => {
        // path format: /foo?bar=&baz=
        const [base, query] = endpoint?.path.split('?') || []
        if (query) {
            const keys = query.split('&').map(pair => pair.split('=')[0])
            setParams(keys)
            // Initialize values
            const initial = {}
            keys.forEach(k => initial[k] = '')
            setParamValues(initial)
        } else {
            setParams([])
            setParamValues({})
        }
        setResult(null) // Reset result on new endpoint
        setTab('request')
    }, [endpoint])

    const execute = async () => {
        if (!endpoint) return
        setLoading(true)
        setResult(null)
        setStatus(null)
        const start = Date.now()

        try {
            // Construct URL
            const queryString = new URLSearchParams(paramValues).toString()
            const url = `${endpoint.path.split('?')[0]}?${queryString}`

            const res = await axios.get(url, { responseType: 'blob' })

            setStatus({ code: res.status, text: res.statusText })

            const contentType = res.headers['content-type']

            let finalResult = null;
            if (contentType && (contentType.startsWith('image/') || contentType.startsWith('video/') || contentType.startsWith('audio/'))) {
                const blobUrl = URL.createObjectURL(res.data)
                finalResult = {
                    _isBinary: true,
                    type: contentType.split('/')[0],
                    url: blobUrl,
                    mime: contentType
                }
                setResult(finalResult)
            } else {
                // Try to parse as JSON
                const text = await res.data.text()
                try {
                    finalResult = JSON.parse(text)
                } catch {
                    finalResult = text
                }
                setResult(finalResult)
            }

            // Save history after success
            // We need to re-read history from state to avoid closure staleness if possible,
            // but simpler to just append unique logic or refresh
            // Here we just fire-and-forget
            const entry = {
                path: endpoint.path,
                name: endpoint.name,
                params: paramValues,
                timestamp: Date.now(),
                status: res.status
            }
            const saved = localStorage.getItem('aine_history')
            const prevHistory = saved ? JSON.parse(saved) : []
            const nextHistory = [entry, ...prevHistory].slice(0, 10)
            localStorage.setItem('aine_history', JSON.stringify(nextHistory))
            setHistory(nextHistory)

        } catch (err) {
            console.error(err)
            const status = err.response?.status || 500
            const text = err.message
            setStatus({ code: status, text: text })

            if (err.response?.data instanceof Blob) {
                try {
                    const errText = await err.response.data.text()
                    setResult(JSON.parse(errText))
                } catch {
                    setResult({ error: 'Request failed', details: err.message })
                }
            } else {
                setResult({ error: 'Request failed', details: err.message })
            }
        } finally {
            setTime(Date.now() - start)
            setLoading(false)
        }
    }

    const generatedUrl = () => {
        if (!endpoint) return ''
        const queryString = new URLSearchParams(paramValues).toString()
        const cleanPath = endpoint.path.split('?')[0]
        return `${window.location.origin}${cleanPath}${queryString ? '?' + queryString : ''}`
    }

    if (!endpoint) return null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
        >
            <div className="absolute inset-0" onClick={onClose}></div>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="modal w-full sm:max-w-4xl max-h-[90vh] flex flex-col bg-aine-surface backdrop-blur-xl rounded-t-[32px] sm:rounded-[26px] shadow-2xl border-t sm:border border-white/60 overflow-hidden"
            >

                <div className="flex items-center justify-between px-5 py-4 border-b border-white/60 bg-white/40">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">GET</span>
                            <span className="font-mono text-sm font-semibold text-slate-800 truncate">{endpoint.path.split('?')[0]}</span>
                        </div>
                        <div className="text-sm text-slate-500 truncate">{endpoint.name}</div>
                    </div>
                    <button onClick={onClose} className="btn !p-2 bg-white/50 hover:bg-white">
                        <img src="/images/icons/close.svg" className="w-5 h-5 opacity-70" alt="Close" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-5 border-b border-white/40 bg-white/20 gap-6">
                    <button
                        onClick={() => setTab('request')}
                        className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'request' ? 'text-aine-deep border-aine-deep' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                    >
                        Permintaan
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        className={`py-3 text-sm font-bold border-b-2 transition-colors ${tab === 'history' ? 'text-aine-deep border-aine-deep' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                    >
                        Riwayat <span className="ml-1 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{history.filter(h => h.path === endpoint.path).length}</span>
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 sm:p-5 scroll-smooth">
                    {tab === 'request' ? (
                        <>
                            <div className="glass p-4 sm:p-5 border border-white/60">
                                <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2 tracking-wider">
                                    <img src="/images/icons/link.svg" className="w-3.5 h-3.5 opacity-60" alt="" />
                                    URL PERMINTAAN
                                </div>

                                <div className="flex gap-2 mb-5">
                                    <div className="flex-1 bg-slate-50/80 border border-slate-200/60 rounded-xl px-4 py-3 overflow-x-auto mx-1">
                                        <code className="text-[13px] font-mono text-slate-700 whitespace-nowrap">
                                            {generatedUrl()}
                                        </code>
                                    </div>
                                    <button className="btn !p-3" onClick={() => navigator.clipboard.writeText(generatedUrl())}>
                                        <img src="/images/icons/copy.svg" className="w-5 h-5 opacity-70" alt="" />
                                    </button>
                                </div>

                                {params.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                        {params.map(key => (
                                            <div key={key}>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1 uppercase">{key}</label>
                                                <input
                                                    className="input !py-2.5 !text-[13px]"
                                                    value={paramValues[key]}
                                                    onChange={e => setParamValues(p => ({ ...p, [key]: e.target.value }))}
                                                    placeholder={`Masukkan ${key}...`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-3 mb-5">
                                    <button onClick={execute} disabled={loading} className="btn btn-primary min-w-[120px] justify-center w-full sm:w-auto">
                                        {loading ? 'Memproses...' : (
                                            <>
                                                <img src="/images/icons/play.svg" className="w-5 h-5 opacity-90" alt="" />
                                                Jalankan
                                            </>
                                        )}
                                    </button>
                                    <button onClick={() => { setResult(null); setParamValues(p => { const n = {}; params.forEach(k => n[k] = ''); return n; }) }} className="btn">
                                        Hapus
                                    </button>
                                </div>

                                {result && (
                                    <div className="mt-5 animate-in slide-in-from-bottom-2">
                                        <MediaPreview data={result} />

                                        <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2 tracking-wider mt-5">
                                            <img src="/images/icons/code.svg" className="w-3.5 h-3.5 opacity-60" alt="" />
                                            RESPON
                                        </div>

                                        <div className="glass overflow-hidden border border-white/60">
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-white/50 border-b border-white/60">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 ${status.code >= 200 && status.code < 300 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                                        {status.code} {status.text}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono">{time}ms</span>
                                                </div>
                                                <button className="btn !p-1.5 !rounded-lg" onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}>
                                                    <img src="/images/icons/copy.svg" className="w-4 h-4 opacity-70" alt="" />
                                                </button>
                                            </div>
                                            <pre className="p-4 text-xs font-mono text-slate-700 overflow-auto max-h-[400px]">
                                                {JSON.stringify(result, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            {history.filter(h => h.path === endpoint.path).length === 0 && (
                                <div className="text-center py-10 text-slate-400 text-sm">Belum ada riwayat untuk endpoint ini.</div>
                            )}
                            {history.filter(h => h.path === endpoint.path).map((h, i) => (
                                <div key={i} className="glass p-4 border border-white/60 flex items-center justify-between group">
                                    <div>
                                        <div className="text-xs text-slate-400 mb-1">{new Date(h.timestamp).toLocaleTimeString()}</div>
                                        <div className="flex gap-2 text-xs font-mono text-slate-600 flex-wrap">
                                            {Object.entries(h.params).map(([k, v]) => (
                                                <span key={k} className="bg-white/50 px-1.5 py-0.5 rounded border border-white/60 max-w-[150px] truncate">{k}={v}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setParamValues(h.params); setTab('request'); }}
                                        className="btn !p-2 !text-xs bg-white hover:bg-slate-50"
                                    >
                                        Pulihkan
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

function MediaPreview({ data }) {
    const [media, setMedia] = useState([])

    useEffect(() => {
        // Direct binary handling
        if (data && data._isBinary) {
            setMedia([{ type: data.type, url: data.url }])
            return
        }

        const found = []

        const scan = (obj) => {
            if (!obj) return
            if (typeof obj === 'string') {
                if (obj.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
                    found.push({ type: 'image', url: obj })
                }
                else if (obj.match(/\.(mp4|webm|mov)($|\?)/i) || obj.includes('googlevideo.com')) {
                    found.push({ type: 'video', url: obj })
                }
                else if (obj.match(/\.(mp3|wav|m4a)($|\?)/i)) {
                    found.push({ type: 'audio', url: obj })
                }
                return
            }

            if (Array.isArray(obj)) {
                obj.forEach(scan)
                return
            }

            if (typeof obj === 'object') {
                Object.values(obj).forEach(scan)
            }
        }

        scan(data)
        // Dedup and limit
        const unique = Array.from(new Set(found.map(i => i.url))).map(url => found.find(i => i.url === url))
        setMedia(unique.slice(0, 5)) // Limit to 5 previews
    }, [data])

    if (media.length === 0) return null

    return (
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2 tracking-wider">
                <img src="/images/icons/play.svg" className="w-3.5 h-3.5 opacity-60" alt="" />
                PRATINJAU MEDIA
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {media.map((item, i) => (
                    <div key={i} className="glass overflow-hidden p-2 border border-white/60">
                        {item.type === 'image' && (
                            <div className="relative group">
                                <img src={item.url} className="w-full h-48 object-cover rounded-xl bg-slate-100" alt="Preview" />
                                <a href={item.url} target="_blank" className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <img src="/images/icons/play.svg" className="w-4 h-4 rotate-[-45deg]" alt="Open" />
                                </a>
                            </div>
                        )}
                        {item.type === 'video' && (
                            <video controls className="w-full h-48 object-cover rounded-xl bg-black" src={item.url}></video>
                        )}
                        {item.type === 'audio' && (
                            <div className="p-4 flex flex-col justify-center h-full bg-slate-50 rounded-xl">
                                <div className="text-xs font-bold text-slate-500 mb-2 truncate px-1">{item.url.split('/').pop()}</div>
                                <audio controls className="w-full h-8" src={item.url}></audio>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
