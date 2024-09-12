import IProduct from "./product.schema";

export interface IOtherProduct extends IProduct {
    condition: string;
}

export interface IFurniture extends IOtherProduct {}

export interface IMachinery extends IOtherProduct {}

export interface IFashionProduct extends IOtherProduct {}


