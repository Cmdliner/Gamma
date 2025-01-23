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

    static readonly PRODUCT_SEARCH_WEIGHTS = {
        NAME: 3,
        DESCRIPTION: 2,
        CATEGORY: 1
    }
    
    static readonly SEARCH_LIMITS = 100;
    
    private static createSearchRegex(word) {
        return ({
            $regex: `(\\b${word}\\b|${word})`,
            $options: 'i'
        });
    }
    
    static buildSearchQuery = (words: string[])  => ({
            $and: words.map(word => ({
                $or: [
                    { title: this.createSearchRegex(word) },
                    { description: this.createSearchRegex(word) },
                    { category: this.createSearchRegex(word) }
                ]
            }))
        })
    
    static calculateRelevanceScore(product: IProduct, searchWords: string[]) { 
        return searchWords.reduce((score: number, word: string) => {
            const wordRegex = new RegExp(word, 'i');
    
            // Calculate position based relevance for name and description
            const nameMatch = product.name.match(wordRegex);
            const descriptionMatch = product.description.match(wordRegex);
            const positionBonus = (match: RegExpMatchArray) => match ? 1 / (match.index + 1) : 0;
    
            return score + 
            (nameMatch ? this.PRODUCT_SEARCH_WEIGHTS.NAME + positionBonus(nameMatch) : 0) +
            (descriptionMatch ? this.PRODUCT_SEARCH_WEIGHTS.DESCRIPTION + positionBonus(descriptionMatch) : 0)
        }, 0);
    }
    
    
    
}

export default ProductService;