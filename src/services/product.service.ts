import type IProduct from "../types/product.schema";
import Product from "../models/product.model"

type ProductCoords = [number, number];

class ProductService {

    static async filterAndSortByLocation(
        coordinates: ProductCoords,
        category: string,
        limit: number,
        skips: number
    ) {

        try {
            const products = await Product.aggregate([
                {
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates,
                        },
                        distanceField: "distance",
                        spherical: true,
                    },
                },
                { $match: { category, status: "available" } },
                { $sort: { distance: 1 } },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                { $unwind: "$owner" },
                { $limit: limit },
                { $skip: skips }
            ]);

            return products;
        } catch (error) {
            throw error;
        }
    }

    static readonly SEARCH_LIMITS = 100;
    static readonly PRODUCT_SEARCH_WEIGHTS = { NAME: 3, DESCRIPTION: 2, CATEGORY: 1 };

    private static escapeStringRegexp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapes special characters
    }

    private static createSearchRegex(word: string) {
        const escapedWord = this.escapeStringRegexp(word);
        return { $regex: new RegExp(`\\b${escapedWord}\\b`, 'i') };
    }

    static buildSearchQuery(words: string[]) {
        return {
            status: "available",
            $and: words.map((word) => ({
                $or: [
                    { title: this.createSearchRegex(word) },
                    { description: this.createSearchRegex(word) },
                    { category: this.createSearchRegex(word) },
                ],
            })),
        };
    }

    static newBuildSearchQuery(q: string) {
        return {
            $or: [
                { $text: q },
                { title: this.createSearchRegex(q) },
                { description: this.createSearchRegex(q) },
                { category: this.createSearchRegex(q) },
            ]
        }
    }

    static newBuildSearchQueryForCategories

    static buildSearchQueryForCategories(words: string[], category: string) {
        return {
            category,
            status: "available",
            $and: words.map((word) => ({
                $or: [
                    { title: this.createSearchRegex(word) },
                    { description: this.createSearchRegex(word) },
                    { category: this.createSearchRegex(word) },
                ],
            })),
        };
    }

    static calculateRelevanceScore(product: IProduct, searchWords: string[]) {
        return searchWords.reduce((score, word) => {
            const regex = new RegExp(word, 'i');
            const nameBonus = regex.test(product.name) ? this.PRODUCT_SEARCH_WEIGHTS.NAME : 0;
            const descriptionBonus = regex.test(product.description)
                ? this.PRODUCT_SEARCH_WEIGHTS.DESCRIPTION
                : 0;
            return score + nameBonus + descriptionBonus;
        }, 0);
    }

}

export default ProductService;