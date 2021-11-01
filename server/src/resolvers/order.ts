import { ProductDetails } from "./../entities/ProductDetails";
import {
    Resolver,
    Ctx,
    Arg,
    Field,
    Mutation,
    ObjectType,
    Query,
    InputType,
    registerEnumType,
} from "type-graphql";
import { MyContext } from "../types";
import { Order, OrderStatus } from "../entities/Order";
import { User } from "../entities/User";
import { FieldError } from "./FieldError";
import { Product } from "../entities/Product";

registerEnumType(OrderStatus, {
    name: "OrderStatus",
});

@ObjectType()
class OrderResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => Order, { nullable: true })
    order?: Order;
}

@InputType()
class ProductDetailsInput {
    @Field()
    productId!: number;
    @Field()
    size!: string;
}

@ObjectType()
class ProductDetailsResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => ProductDetails, { nullable: true })
    productDetails?: ProductDetails;
}

@Resolver()
export class OrderResolver {
    @Query(() => [Order], { nullable: true })
    async orders(@Ctx() { em }: MyContext): Promise<Order[]> {
        return await em.find(Order, { relations: ["user", "products"] });
    }

    @Query(() => OrderResponse)
    async order(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext
    ): Promise<OrderResponse> {
        const order = await em.find(Order, {
            where: { id },
            relations: ["user", "products"],
        });

        if (!order) {
            return {
                errors: [
                    {
                        field: "name",
                        message: "Order doesn't exists",
                    },
                ],
            };
        }
        console.log(order);
        return { order };
    }

    @Mutation(() => OrderResponse)
    async createOrder(
        @Arg("userId") userId: number,
        @Arg("amount") amount: number,
        @Arg("rentalDate") rentalDate: Date,
        @Arg("productDetails", () => [ProductDetailsInput])
        productDetails: ProductDetailsInput[],
        @Ctx() context: MyContext
    ): Promise<OrderResponse> {
        const user = await context.em.findOne(User, { id: userId });
        if (!user) {
            return {
                errors: [
                    {
                        field: "userId",
                        message: "User doesn't exists",
                    },
                ],
            };
        }

        const order = context.em.create(Order, {
            amount: amount,
            rentalDate: rentalDate,
            user: user,
        });
        try {
            await order.save();

            productDetails.map((detail) => {
                return this.createProductDetails(
                    order.id,
                    detail.productId,
                    detail.size,
                    context
                );
            });
        } catch (err) {
            console.log(err.details);

            return {
                errors: [
                    {
                        field: "",
                        message: err.detail,
                    },
                ],
            };
        }

        return { order };
    }

    @Mutation(() => OrderResponse)
    async updateOrder(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext
    ): Promise<OrderResponse> {
        let order = await em.findOne(Order, { id });
        if (!order) {
            return {
                errors: [
                    {
                        field: "id",
                        message: "Order doesn't exists",
                    },
                ],
            };
        }

        try {
            await em.save(order);
        } catch (err) {
            console.log(err.details);

            return {
                errors: [
                    {
                        field: "",
                        message: err.detail,
                    },
                ],
            };
        }

        return { order };
    }

    @Mutation(() => OrderResponse)
    async deleteOrder(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext
    ): Promise<OrderResponse> {
        let order = await em.findOne(Order, { id });
        if (!order) {
            return {
                errors: [
                    {
                        field: "id",
                        message: "Order doesn't exists",
                    },
                ],
            };
        }

        try {
            await em.delete(Order, order);
        } catch (err) {
            console.log(err.details);

            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "name",
                            message: "Order name already exists",
                        },
                    ],
                };
            } else {
                return {
                    errors: [
                        {
                            field: "order",
                            message: err.detail,
                        },
                    ],
                };
            }
        }

        return { order };
    }

    @Mutation(() => ProductDetailsResponse, { nullable: true })
    async createProductDetails(
        @Arg("orderId") orderId: number,
        @Arg("productId") productId: number,
        @Arg("size") size: string,
        @Ctx() { em }: MyContext
    ): Promise<ProductDetailsResponse> {
        const product = await em.findOne(Product, { id: productId });

        if (!product) {
            return {
                errors: [
                    {
                        field: "productId",
                        message: "Product doesn't exists",
                    },
                ],
            };
        }

        const order = await em.findOne(Order, { id: orderId });

        if (!order) {
            return {
                errors: [
                    {
                        field: "orderId",
                        message: "Order doesn't exists",
                    },
                ],
            };
        }

        try {
            const productDetails = em.create(ProductDetails, {
                productId: productId,
                orderId: orderId,
                size: size,
            });

            await productDetails.save();

            return { productDetails };
        } catch (err) {
            console.log(err.detail);
            return {
                errors: [
                    {
                        field: "",
                        message: "something went wrong: " + err.detail,
                    },
                ],
            };
        }
    }
}
