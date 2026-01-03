import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export default function CategoryCarousel({ categories, selected, onSelect }) {
    const scrollRef = useRef(null)

    // Optional: Auto-scroll to selected item logic could go here

    return (
        <div className="relative group">
            {/* Fade gradients for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-aine-bg to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300 sm:group-hover:opacity-100" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-aine-bg to-transparent z-10 pointer-events-none" />

            <motion.div
                className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide py-1 px-1"
                ref={scrollRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <button
                    onClick={() => onSelect('all')}
                    className={cn(
                        "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border select-none",
                        selected === 'all'
                            ? "bg-aine-primary text-white border-aine-primary shadow-lg shadow-aine-primary/25 scale-105"
                            : "bg-white/60 text-slate-600 border-white/60 hover:bg-white hover:border-aine-stroke hover:text-aine-deep"
                    )}
                >
                    All
                </button>

                {categories.map((cat, i) => (
                    <button
                        key={cat}
                        onClick={() => onSelect(cat)}
                        className={cn(
                            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 border select-none whitespace-nowrap",
                            selected === cat
                                ? "bg-aine-primary text-white border-aine-primary shadow-lg shadow-aine-primary/25 scale-105"
                                : "bg-white/60 text-slate-600 border-white/60 hover:bg-white hover:border-aine-stroke hover:text-aine-deep"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </motion.div>
        </div>
    )
}
