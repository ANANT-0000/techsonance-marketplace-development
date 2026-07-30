'use client';
import {type  CategoryList } from "@/utils/Types";
import { motion } from "motion/react";
import { CATEGORY_LIST_TEXT } from "@/constants/customerText";

export function CategoryList({ categories, styles }: { categories?: CategoryList[], styles?: string }) {

    // Parent container variant to stagger the children
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15, // Delay between each category appearing
                delayChildren: 0.2
            }
        }
    };

    // Individual item variant
    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring" as const, stiffness: 100, damping: 15 }
        }
    };

    return (
        <section className="xl:pt-10 pb-8 xl:px-32 lg:px-8 md:px-4 sm:px-2 py-1 overflow-hidden">
            <motion.h2
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-theme-h4 text-center font-bold mt-8 mb-8"
            >
                {CATEGORY_LIST_TEXT.TITLE}
            </motion.h2>

            <motion.ul
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className={`px-4 flex flex-wrap justify-center sm:justify-evenly gap-6 sm:gap-8 ${styles}`}
            >
                {categories && categories.slice(0, 6).map((category, idx) => (
                    <motion.li
                        key={idx}
                        variants={itemVariants}
                        className="group flex flex-col items-center cursor-pointer max-w-[120px] sm:max-w-[160px]"
                    >
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-50 border-[4px] border-white shadow-sm ring-1 ring-slate-100 group-hover:shadow-md transition-shadow duration-300 flex items-center justify-center">
                            <motion.img
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.4 }}
                                className="w-full h-full object-cover"
                                src={category.url}
                                alt={category.title.trim()}
                            />
                        </div>
                        <span className="mt-4 text-sm sm:text-base font-bold text-slate-800 group-hover:text-theme-primary transition-colors text-center">
                            {category.title.trim()}
                        </span>
                        <span className="mt-1 text-[10px] sm:text-xs text-slate-400 font-medium">
                            {category.itemsCount ? `${category.itemsCount}+ Items` : "100+ Items"}
                        </span>
                    </motion.li>
                ))}
            </motion.ul>
        </section>
    );
}