import IProduct from "./product.schema";

interface IGadget extends IProduct {
    brand: string;
    item_model: string;
    RAM: string;
    conditon: "new" | "used";
}

export default IGadget;