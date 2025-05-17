'use client'

import React from 'react'
import { Database } from '@/types/database'
import ProductCard from './IntrestCard'
import ReadOnlyProductCard from './ReadOnlyIntrestsCard'
import Image from 'next/image'

type Product = Database['public']['Tables']['products']['Row']

interface TagGroupedProductsProps {
    groupedProducts: {
        [tag: string]: {
            left: Product[],
            right: Product[]
        }
    }
    isOwner: boolean
    onDelete?: (id: string) => void
    onEdit?: (product: Product) => void
    onTagClick: (tag: string) => void
    onImageUpdate?: (product: Product) => void
    tagFilter: string  // Current tag filter
}

export default function TagGroupedInterests({
    groupedProducts,
    isOwner,
    onDelete,
    onEdit,
    onTagClick,
    onImageUpdate,
    tagFilter
}: TagGroupedProductsProps) {
    // Get all tags and sort them alphabetically
    const sortedTags = Object.keys(groupedProducts).sort((a, b) => {
        // Check if the tags are in Russian or English and sort accordingly
        // We assume Cyrillic letters have higher Unicode values than Latin
        const isARussian = /[а-яА-Я]/.test(a[0]);
        const isBRussian = /[а-яА-Я]/.test(b[0]);

        if (isARussian && !isBRussian) return 1;
        if (!isARussian && isBRussian) return -1;

        return a.localeCompare(b);
    });

    // Filter tags if there's a tag filter active
    const tagsToDisplay = tagFilter ?
        sortedTags.filter(tag => tag === tagFilter) :
        sortedTags;

    if (tagsToDisplay.length === 0) {
        return (
            <div className="py-10 text-center text-gray-500 animate-pulse">
                Нет интересов для отображения.
            </div>
        );
    } return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            {/* Left Display Section - like interests */}
            <section className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden relative">
                {/* Rounded top border for "like" section */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-green-500 rounded-t-lg"></div>

                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
                        Нравится
                    </h2>
                    <Image
                        src="/assets/like.png"
                        width={32}
                        height={32}
                        alt="Like"
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                    />
                </div><div className="space-y-10">
                    {tagsToDisplay.map(tag => (
                        <div key={`left-${tag}`} className="space-y-3">
                            <div className="lg:hidden mb-3 text-[#3d82f7] font-semibold">
                                {tag.replace(/^#/, '')}
                            </div>                            {groupedProducts[tag].left.length > 0 ? (
                                <>
                                    {groupedProducts[tag].left.map(product => (
                                        isOwner ? (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                onDelete={onDelete || (() => { })}
                                                onEdit={onEdit || (() => { })}
                                                onTagClick={onTagClick}
                                                onImageUpdate={onImageUpdate}
                                            />
                                        ) : (
                                            <ReadOnlyProductCard
                                                key={product.id}
                                                product={product}
                                                onTagClick={onTagClick}
                                            />
                                        )
                                    ))}
                                </>
                            ) : (
                                <div className="py-10 mb-4 text-center text-gray-400 text-sm italic border border-dashed border-gray-200 rounded-lg">
                                    Нет интересов в разделе &quot;Нравится&quot; с тегом {tag.replace(/^#/, '')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>            {/* Center divider with tag badges */}            <div className="hidden lg:flex absolute left-1/2 top-0 bottom-0 z-10 flex-col items-center transform -translate-x-1/2">
                <div className={`h-full flex flex-col justify-start pt-16 ${tagsToDisplay.length <= 1 ? '' : 'space-y-32'
                    }`}>
                    {tagsToDisplay.map(tag => (
                        <div
                            key={tag}
                            className="bg-[#3d82f7] text-white rounded-lg py-1.5 px-3.5 shadow-md text-sm whitespace-nowrap flex items-center justify-center"
                        >
                            <span className="font-medium">{tag.replace(/^#/, '')}</span>
                        </div>
                    ))}
                </div>
            </div>            {/* Mobile tag badges (only visible on small screens) */}
            {!tagFilter && (
                <div className="lg:hidden col-span-1 flex flex-wrap justify-center gap-2 mb-4">
                    {tagsToDisplay.map(tag => (
                        <div
                            key={tag}
                            className="bg-[#3d82f7] text-white rounded-lg py-1.5 px-3.5 shadow-md text-sm whitespace-nowrap flex items-center justify-center"
                        >
                            <span className="font-medium">{tag.replace(/^#/, '')}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Vertical separator line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 opacity-70 transform -translate-x-1/2"></div>

            {/* Right Display Section - dislike interests */}
            <section className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden relative">
                {/* Rounded top border for "dislike" section */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-red-500 rounded-t-lg"></div>

                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
                        Не Нравится
                    </h2>
                    <Image
                        src="/assets/dislike.png"
                        width={32}
                        height={32}
                        alt="Dislike"
                        className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                    />
                </div>                <div className="space-y-10">
                    {tagsToDisplay.map(tag => (
                        <div key={`right-${tag}`} className="space-y-3">
                            <div className="lg:hidden mb-3 text-[#3d82f7] font-semibold">
                                {tag.replace(/^#/, '')}
                            </div>                            {groupedProducts[tag].right.length > 0 ? (
                                <>
                                    {groupedProducts[tag].right.map(product => (
                                        isOwner ? (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                onDelete={onDelete || (() => { })}
                                                onEdit={onEdit || (() => { })}
                                                onTagClick={onTagClick}
                                                onImageUpdate={onImageUpdate}
                                            />
                                        ) : (
                                            <ReadOnlyProductCard
                                                key={product.id}
                                                product={product}
                                                onTagClick={onTagClick}
                                            />
                                        )
                                    ))}
                                </>
                            ) : (
                                <div className="py-10 mb-4 text-center text-gray-400 text-sm italic border border-dashed border-gray-200 rounded-lg">
                                    Нет интересов в разделе &quot;Не Нравится&quot; с тегом {tag.replace(/^#/, '')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
