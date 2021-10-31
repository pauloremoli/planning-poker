import DataLoader from "dataloader";
import { In } from "typeorm";
import { Product } from "../entities/Product";
import { ProductDetails } from "../entities/ProductDetails";

const batchProducts = async (orderIds: readonly number[]) => {
    const keys = [...orderIds];
    const productDetails = await ProductDetails.find({
        join: {
            alias: "productDetails",
            innerJoinAndSelect: {
                product: "productDetails.product",
            },
        },
        where: {
            orderId: In(keys),
        },
    });

    const orderIdToProducts: { [key: number]: Product[] } = {};

    productDetails.forEach((pd) => {
        if (pd.orderId in orderIdToProducts) {
            orderIdToProducts[pd.orderId].push((pd as any).__product__);
        } else {
            orderIdToProducts[pd.orderId] = [(pd as any).__product__];
        }
    });

    return orderIds.map((orderId) => orderIdToProducts[orderId]);
};

export const createProductsLoader = () => new DataLoader(batchProducts);
