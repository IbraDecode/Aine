import { motion } from 'framer-motion'

export default function ApiCard({ endpoint, index, onClick, isFavorite, onToggleFavorite }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
            className="group relative flex flex-col justify-between p-5 rounded-[26px] bg-white text-left border border-aine-stroke shadow-aine-sm hover:shadow-aine cursor-pointer overflow-hidden transition-all"
            onClick={onClick}
        >
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    className={`p-2 rounded-full transition-all active:scale-95 hover:bg-slate-50 ${isFavorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
                >
                    {isFavorite ? (
                        <img src="/images/icons/star-fill.svg" className="w-5 h-5 drop-shadow-sm" alt="Fav" />
                    ) : (
                        <img src="/images/icons/star.svg" className="w-5 h-5 opacity-40 hover:opacity-100 transition-opacity" alt="Unfav" />
                    )}
                </button>
            </div>

            <div>
                <div className="flex items-center gap-2.5 mb-3">
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-[10px] border border-emerald-100/50">
                        GET
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest line-clamp-1">
                        {endpoint.category}
                    </span>
                </div>

                <h3 className="font-display font-bold text-lg leading-snug text-slate-800 mb-1.5 group-hover:text-aine-deep transition-colors line-clamp-1">
                    {endpoint.name}
                </h3>

                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                    {endpoint.desc || "Simple and fast REST API endpoint for developers."}
                </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <code className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded-lg truncate max-w-[160px]">
                    {endpoint.path.split('?')[0]}
                </code>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-aine-surface border border-aine-stroke text-aine-primary shadow-sm group-hover:bg-aine-primary group-hover:text-white group-hover:border-transparent transition-all"
                >
                    <img src="/images/icons/play.svg" className="w-4 h-4 ml-0.5 group-hover:brightness-[10]" alt="Try" />
                </motion.button>
            </div>
        </motion.div>
    )
}
