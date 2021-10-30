import { Category } from "../entities/Category";
import {
    Resolver,
    Ctx,
    Arg,
    Field,
    Mutation,
    ObjectType,
    Query,
} from "type-graphql";
import { MyContext } from "../types";
import { Product } from "../entities/Product";
import { FieldError } from "./FieldError";
import e from "express";

@ObjectType()
class ProductResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => Product, { nullable: true })
    product?: Product;
}

@Resolver()
export class ProductResolver {
    @Query(() => [Product], { nullable: true })
    async products(@Ctx() { em }: MyContext) {
        const products = await em.find(Product, {});
        console.log(products);
        return products;
    }

    @Query(() => Product, { nullable: true })
    async product(@Arg("id") id: number, @Ctx() { em }: MyContext) {
        const product = await em.findOne(Product, { id });

        console.log(product);
        return product;
    }

    @Mutation(() => ProductResponse)
    async createProduct(
        @Arg("name") name: string,
        @Arg("description") description: string,
        @Arg("categoryId") categoryId: number,
        @Arg("photos", () => [String]) photos: string[],
        @Arg("price") price: number,
        @Arg("stock") stock: number,
        @Ctx() { em }: MyContext
    ): Promise<ProductResponse> {
        const category = await em.findOne(Category, { id: categoryId });
        if (!category) {
            return {
                errors: [
                    {
                        field: "categoryId",
                        message: "Category doesn't exists",
                    },
                ],
            };
        }

        const product = em.create(Product, {
            name: name,
            description: description,
            categoryId: categoryId,
            photos: photos,
            price: price,
            stock: stock,
        });
        try {
            await product.save();
        } catch (err) {
            console.log(err.details);

            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "name",
                            message: "Product already exists",
                        },
                    ],
                };
            } else {
                return {
                    errors: [
                        {
                            field: "product",
                            message: err.detail,
                        },
                    ],
                };
            }
        }

        console.log(product);

        return { product };
    }

    @Mutation(() => ProductResponse)
    async updateProduct(
        @Arg("id") id: number,
        @Arg("name") name: string,
        @Arg("description") description: string,
        @Arg("categoryId") categoryId: number,
        @Arg("photos", () => [String]) photos: string[],
        @Arg("price") price: number,
        @Arg("stock") stock: number,
        @Ctx() { em }: MyContext
    ): Promise<ProductResponse> {
        let product = await em.findOne(Product, { id });
        if (!product) {
            return {
                errors: [
                    {
                        field: "id",
                        message: "Product doesn't exists",
                    },
                ],
            };
        }

        const category = em.findOne(Category, { id: categoryId });
        if (!category) {
            return {
                errors: [
                    {
                        field: "categoryId",
                        message: "Category doesn't exists",
                    },
                ],
            };
        }

        product.name = name;
        product.description = description;
        product.categoryId = categoryId;
        product.photos = photos;
        product.price = price;
        product.stock = stock;

        try {
            ``;
            await em.save(product);
        } catch (err) {
            console.log(err.details);

            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "name",
                            message: "Product name already exists",
                        },
                    ],
                };
            } else {
                return {
                    errors: [
                        {
                            field: "product",
                            message: err.detail,
                        },
                    ],
                };
            }
        }

        return { product };
    }

    @Mutation(() => ProductResponse)
    async deleteProduct(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext
    ): Promise<ProductResponse> {
        const productRepository = em.getRepository(Product);
        let product = await productRepository.findOne({ id });
        if (!product) {
            return {
                errors: [
                    {
                        field: "id",
                        message: "Product doesn't exists",
                    },
                ],
            };
        }
        try {
            console.log(await productRepository.remove(product));
        } catch (err) {
            console.log(err.details);
        }

        product.id = id;
        return { product };
    }
}
