import IProduct from "./product.schema";

interface IElectronics extends IProduct {
    brand: string;
    item_model: string;
    condition: "new" | "used";
}

export default IElectronics;