import { isSameUser } from './../utils/isSameUser';
import { isAuth, isAdmin } from './../middleware/isAuth';
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
    UseMiddleware,
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
    //@UseMiddleware(isAdmin)
    async orders(@Ctx() { em }: MyContext): Promise<Order[]> {
        return await em.find(Order, { relations: ["user", "products"] });
    }

    @Query(() => OrderResponse)
    //@UseMiddleware(isAuth)
    async order(
        @Arg("id") id: number,
        @Ctx() { req, em }: MyContext
    ): Promise<OrderResponse> {
        const order = await em.findOne(Order, {
            where: { id },
            relations: ["user", "products"],
        });

        if(!order?.user.id)
        return {
            errors: [
                {
                    field: "user",
                    message: "User id doesn't exists",
                },
            ],
        };
        
        await isSameUser(em, req, order?.user.id);

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
        console.log({ order });
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
    @UseMiddleware(isAdmin)
    async updateOrder(
        @Arg("id") id: number,
        @Arg("rentalDate") rentalDate: Date,
        @Arg("status", () => OrderStatus) status: OrderStatus,
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
            order.rentalDate = rentalDate;
            order.status = status;
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

    @Mutation(() => Boolean)
    @UseMiddleware(isAdmin)
    async deleteOrder(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext
    ): Promise<Boolean> {
        try {
            let result = await em.delete(Order, { id });
            return result.affected != 0;
        } catch (err) {
            console.log(err.details);
            return false;
        }
    }

    @Mutation(() => ProductDetailsResponse, { nullable: true })
    @UseMiddleware(isAuth)
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

