import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function Header({
    totalEndpoints,
    totalCategories,
    onBrowse,
    darkMode,
    setDarkMode
}) {
    const [stats, setStats] = useState({
        requests: 0,
        success: 0,
        failed: 0
    });

    useEffect(() => {
        // Fetch real-time stats from server
        const fetchStats = async () => {
            try {
                const response = await fetch('/stats');
                const data = await response.json();
                if (data.status) {
                    setStats(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    // Calculate server status based on failed rate
    const failedRate = stats.requests > 0 ? (stats.failed / stats.requests) * 100 : 0;
    const statusIndicator = failedRate > 20 ? "error" : failedRate > 10 ? "warning" : "success";

    return (
        <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-[28px] shadow-aine mb-8 group select-none bg-white z-10"
        >
            {/* Status Indicator */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute top-4 right-4 z-20"
                title={`Server Status: ${statusIndicator === 'success' ? 'Healthy' : statusIndicator === 'warning' ? 'Warning' : 'Error'} (${failedRate.toFixed(1)}% failed)`}
            >
                <div className={`w-3 h-3 rounded-full shadow-lg ${statusIndicator === 'success' ? 'bg-emerald-500' : statusIndicator === 'warning' ? 'bg-amber-500' : 'bg-red-500'} ${statusIndicator === 'error' ? 'animate-pulse' : ''}`}></div>
            </motion.div>

            <img
                src="/images/banner.webp"
                alt="Banner"
                className="w-full h-[380px] sm:h-[320px] object-cover block saturate-[1.05] contrast-[1.05] scale-[1.02] transition-transform duration-700 group-hover:scale-105"
            />
            <div className={`absolute inset-0 bg-gradient-to-b ${darkMode ? 'from-slate-900/10 via-slate-900/70 to-slate-900' : 'from-white/10 via-[#F7FDFF]/60 to-[#F7FDFF]'}`}></div>

            <div className="absolute inset-0 p-5 sm:p-10 flex flex-col justify-end gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <motion.img
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            src="/images/logo.svg"
                            className="w-10 h-10 sm:w-16 sm:h-16 shadow-lg rounded-xl bg-white/20 backdrop-blur-sm p-1"
                            alt="Logo"
                        />
                        <div>
                            <motion.h1
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="font-display text-2xl sm:text-6xl font-extrabold leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-aine-text via-aine-deep to-aine-primary"
                            >
                                Aine Api'S
                            </motion.h1>
                            <motion.p
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xs sm:text-[16px] text-slate-700 font-medium mt-1 opacity-90 max-w-lg leading-relaxed"
                            >
                                Dokumentasi REST API dengan fitur testing langsung.
                            </motion.p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center gap-2 flex-wrap"
                    >
                        <span className="pill shadow-sm text-[10px] sm:text-xs">
                            <img src="/images/icons/check.svg" className="w-3 h-3 sm:w-4 sm:h-4 opacity-80" alt="" />
                            v1.0.0
                        </span>
                        <button className="btn backdrop-blur-xl bg-white/50 hover:bg-white !py-2 !px-3 !text-xs sm:!text-sm" onClick={() => navigator.clipboard.writeText(window.location.origin)}>
                            <img src="/images/icons/copy.svg" className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" alt="" />
                            Salin URL
                        </button>
                        <a href="#endpoints" onClick={(e) => { e.preventDefault(); onBrowse(); }} className="btn btn-primary no-underline !py-2 !px-3 !text-xs sm:!text-sm hover:scale-105 active:scale-95 transition-transform">
                            <img src="/images/icons/docs.svg" className="w-4 h-4 sm:w-5 sm:h-5 opacity-95" alt="" />
                            Jelajahi
                        </a>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="btn backdrop-blur-xl bg-white/50 hover:bg-white !p-2.5"
                            title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
                        >
                            <img src={darkMode ? '/images/icons/sun.svg' : '/images/icons/moon.svg'} className="w-5 h-5 opacity-80" alt="" />
                        </button>
                    </motion.div>
                </div>

                {/* Stats Grid */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                    <StatBox label="Total Endpoint" value={totalEndpoints || '—'} />
                    <StatBox label="Kategori" value={totalCategories || '—'} />
                    <StatBox label="Total Request" value={stats.requests.toLocaleString()} />
                    <StatBox 
                        label="Sukses Rate" 
                        value={`${stats.requests > 0 ? Math.round((stats.success / stats.requests) * 100) : 0}%`}
                        color={failedRate > 20 ? "text-red-600" : failedRate > 10 ? "text-amber-600" : "text-emerald-600"}
                    />
                </motion.div>
            </div>
        </motion.section>
    )
}

function StatBox({ label, value, color = "text-aine-text" }) {
    return (
        <div className="glass p-4 border border-white/60">
            <div className="text-xs font-bold text-slate-500">{label}</div>
            <div className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
        </div>
    )
}
