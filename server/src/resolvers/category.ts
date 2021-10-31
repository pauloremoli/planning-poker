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
import { Category } from "../entities/Category";
import { FieldError } from "./FieldError";

@ObjectType()
class CategoryResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => Category, { nullable: true })
    category?: Category;
}

@Resolver()
export class CategoryResolver {
    @Query(() => [Category], { nullable: true })
    async categories(@Ctx() { em }: MyContext) {
        return await em.find(Category, {});
    }

    @Query(() => Category, { nullable: true })
    async category(@Arg("id") id: number, @Ctx() { em }: MyContext) {
        const category = await em.findOne(Category, { id });
        if (!category) {
            return {
                errors: [
                    {
                        field: "name",
                        message: "Category already exists",
                    },
                ],
            };
        }
        return category;
    }

    @Mutation(() => CategoryResponse)
    async createCategory(
        @Arg("name") name: string,
        @Ctx() { em }: MyContext
    ): Promise<CategoryResponse> {
        const category = em.create(Category, {
            name: name,
        });
        try {
            await em.save(category);
        } catch (err) {
            console.log(err.details);

            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "name",
                            message: "Category already exists",
                        },
                    ],
                };
            } else {
                return {
                    errors: [
                        {
                            field: "category",
                            message: err.detail,
                        },
                    ],
                };
            }
        }

        return { category };
    }

    @Mutation(() => CategoryResponse)
    async updateCategory(
        @Arg("id") id: number,
        @Arg("name") name: string,
        @Ctx() { em }: MyContext
    ): Promise<CategoryResponse> {
        let category = await em.findOne(Category, { id });
        if (!category) {
            return {
                errors: [
                    {
                        field: "id",
                        message: "Category doesn't exists",
                    },
                ],
            };
        }

        category.name = name;
        try {
            await em.save(category);
        } catch (err) {
            console.log(err.details);

            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "name",
                            message: "Category name already exists",
                        },
                    ],
                };
            } else {
                return {
                    errors: [
                        {
                            field: "category",
                            message: err.detail,
                        },
                    ],
                };
            }
        }

        return { category };
    }

    @Mutation(() => CategoryResponse)
    async deleteCategory(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext
    ): Promise<CategoryResponse> {
        let category = await em.findOne(Category, { id });
        if (!category) {
            return {
                errors: [
                    {
                        field: "id",
                        message: "Category doesn't exists",
                    },
                ],
            };
        }

        try {
            await em.delete(Category, category);
        } catch (err) {
            console.log(err.details);

            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "name",
                            message: "Category name already exists",
                        },
                    ],
                };
            } else {
                return {
                    errors: [
                        {
                            field: "category",
                            message: err.detail,
                        },
                    ],
                };
            }
        }

        return { category };
    }
}
