import IProduct from "../types/product.schema";
import Product from "./product.model"

type ProductCoords = [number, number];

class ProductService {

    static async filterAndSortByLocation(
        coordinates: ProductCoords,
        category: string,
        limit: number,
        skips: number
    ) {
        //! todo => Populate owner field of product
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
            { $match: { category } },
            { $sort: { distance: 1 } },
            // Begin new
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            { $unwind: "$owner" },
            // End new
            { $limit: limit },
            { $skip: skips }
        ]);

        return products;
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