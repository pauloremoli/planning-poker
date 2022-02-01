import { isAdmin } from "./../middleware/isAuth";
import { Category } from "../entities/Category";
import {
    Resolver,
    Ctx,
    Arg,
    Field,
    Mutation,
    ObjectType,
    Query,
    UseMiddleware,
    Int,
} from "type-graphql";
import { MyContext } from "../types";
import { Product } from "../entities/Product";
import { FieldError } from "./FieldError";
import { getConnection } from "typeorm";

@ObjectType()
class ProductResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => Product, { nullable: true })
    product?: Product;
}

@ObjectType()
class ProductsResponse {
    @Field()
    hasMore: Boolean;

    @Field(() => [Product], { nullable: true })
    products?: Product[];
}

@Resolver()
export class ProductResolver {
    @Query(() => ProductsResponse)
    async products(
        @Arg("limit", () => Int) limit: number,
        @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
        @Arg("category", () => Int, { nullable: true }) category: number
    ): Promise<ProductsResponse> {
        const realLimit = Math.min(50, limit);
        const reaLimitPlusOne = realLimit + 1;
        const qb = getConnection()
            .getRepository(Product)
            .createQueryBuilder("product")
            .leftJoinAndSelect("product.category", "category")
 
        if (cursor) {
            qb.where('p."createdAt" < :cursor', {
                cursor: new Date(parseInt(cursor)),
            });
        }

        console.log(category);

        if (category) {
            qb.where(`p."categoryId" = ${category}`);
        }

        const products = await qb.getMany();

        console.log(products);

        return {
            products: products.slice(0, realLimit),
            hasMore: products.length === reaLimitPlusOne,
        };
    }

    @Query(() => ProductResponse, { nullable: true })
    async product(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext
    ): Promise<ProductResponse> {
        const product = await em.findOne(Product, { id });

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

        return { product };
    }

    @Mutation(() => ProductResponse)
    @UseMiddleware(isAdmin)
    async createProduct(
        @Arg("name") name: string,
        @Arg("description") description: string,
        @Arg("categoryId") categoryId: number,
        @Arg("photos", () => [String]) photos: string[],
        @Arg("price") price: number,
        @Arg("stock") stock: number,
        @Ctx() { em }: MyContext
    ): Promise<ProductResponse> {
        console.log("CREATE PRODUCT");

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
            category: category,
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
    @UseMiddleware(isAdmin)
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

        product.name = name;
        product.description = description;
        product.category = category;
        product.photos = photos;
        product.price = price;
        product.stock = stock;

        try {
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
    @UseMiddleware(isAdmin)
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
