import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Axios, { AxiosResponse } from "axios";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
    Category,
    Product,
    useCategoriesQuery,
    useCreateProductMutation,
    useProductLazyQuery,
} from "../../../generated/graphql";
import router, { useRouter } from "next/router";

const Container = styled.div`
    display: flex;
    padding: 50px;
    align-items: center;
    justify-content: center;
    margin: auto;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 50px;
`;

const Title = styled.span`
    font-size: 30px;
    justify-content: center;
    align-items: center;
`;
const InputText = styled.input`
    font-size: 18px;
    padding: 10px;
    margin: 0px 10px 10px 10px;
    border-radius: 10px;
    border: 0px;
    border-bottom: 1px solid #9f6ccf;
    flex: 3;
`;

const Label = styled.label`
    font-size: 15px;
    padding: 10px 0px 10px 10px;
`;
const Select = styled.select`
    font-size: 18px;
    background-color: white;
    margin: 0px 10px 10px 10px;
    padding: 10px 0px 10px 10px;
    border-radius: 10px;
    border: 0px;
    border-bottom: 1px solid #9f6ccf;
    flex: 3;
`;

const RowContainer = styled.div`
    display: flex;
    align-items: center;
`;

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    margin: 50px 0px;
`;

const ImageContainer = styled.div`
    padding: 10px;
    position: relative;
`;

const CloseButton = styled.button`
    position: absolute;
    top: 0px;
    right: 0px;
    background-color: red;
    color: white;
    padding: 2px;
    border-radius: 20px;
`;

const Button = styled.button`
    font-size: 18px;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.5s ease;
    background-color: #2f015a;
    color: white;
    padding: 5px;
    margin-right: 4px;
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    flex: 1;

    &:hover {
        background-color: #543a6d;
    }
`;

interface ProductFormProps {
    product?: Product;
}

interface FormInputData {
    name: string;
    description: string;
    price: number;
    categoryId: number;
    stock: number;
    photos: String[];
}

const ProductForm: React.FC<FormInputData> = ({ product }) => {
    const router = useRouter();
    const { data: categoryData, loading, error } = useCategoriesQuery();
    const [createProductMutation] = useCreateProductMutation();
    const [
        productQuery,
        { data: productData, loading: productLoading, error: productError },
    ] = useProductLazyQuery();

    const initialData = {
        name: "",
        description: "",
        price: 0,
        categoryId: null,
        stock: 0,
        photos: [],
        photo: "",
    };
    const [formInputData, setFormInputData] =
        useState<FormInputData>(initialData);

    const handleSave = async () => {
        try {
            const { errors } = await createProductMutation({
                variables: {
                    stock: parseInt(formInputData.stock),
                    name: formInputData.name,
                    photos: formInputData.photos,
                    description: formInputData.description,
                    categoryId: parseInt(formInputData.categoryId),
                    price: parseFloat(formInputData.price),
                },
            });

            if (errors) {
                console.log(JSON.stringify(errors, null, 2));
                toast.error("Não foi possível salvar o produto.", {
                    position: "bottom-center",
                    autoClose: 5000,
                    hideProgressBar: true,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }

            toast.success("Produto salvo com sucesso!", {
                position: "bottom-center",
                autoClose: 2000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });

            setFormInputData(initialData);
        } catch (e) {
            console.log(e.networkError.result.errors);
        }
    };
    const handleCancel = () => {
        router.push('/admin/products');
    };

    const handleChange = (e: any) => {
        setFormInputData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));

        console.log(formInputData);
    };

    const handleCreateCategory = () => {
        //TODO
    };

    const handleRemoveImage = (e: any) => {
        e.preventDefault();
        const photo = e.target.id;

        setFormInputData((prevState) => ({
            ...prevState,
            ["photos"]: prevState.photos.filter((item) => item !== photo),
        }));

        console.log(formInputData);
    };

    const handleSelectedFile = (e: any) => {
        e.preventDefault();

        if (!e.target.files) return;
        const photo = e.target.files[0];

        setFormInputData((prevState) => ({
            ...prevState,
            [e.target.name]: photo,
        }));
    };

    const handleUploadPhoto = (e: any) => {
        e.preventDefault();
        if (!formInputData.photo) {
            alert("Selecione o arquivo da foto.");
            return;
        }
        const photoData = new FormData();
        photoData.append("file", formInputData.photo);
        photoData.append("upload_preset", "hfmnx9ow");

        Axios.post(
            "https://api.cloudinary.com/v1_1/pauloremoli/image/upload/",
            photoData
        )
            .then((resp: AxiosResponse) => {
                console.log(resp);
                const photos = formInputData.photos;
                photos.push(resp.data.secure_url);
                setFormInputData((prevState) => ({
                    ...prevState,
                    ["photos"]: photos,
                }));

                console.log(formInputData);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    useEffect(() => {
        if (!product) return;

        setFormInputData({
            id: product.id,
            name: product.name,
            category: product.category.name,
            photos: product.photos,
            price: product.price,
            stock: product.stock,
            description: product.description,
        });
    }, [product]);

    return (
        <>
            <Container>
                <Content>
                    <RowContainer>
                        <Title>Produto</Title>
                    </RowContainer>
                    <Label>Nome:</Label>
                    <InputText
                        type="text"
                        name="name"
                        placeholder="nome"
                        value={formInputData.name}
                        onChange={handleChange}
                    />

                    <Label>Preço:</Label>
                    <InputText
                        type="number"
                        name="price"
                        step="1"
                        placeholder="preço"
                        value={formInputData.price}
                        onChange={handleChange}
                    />

                    <Label>Descrição:</Label>
                    <InputText
                        type="text"
                        name="description"
                        placeholder="descrição"
                        value={formInputData.description}
                        onChange={handleChange}
                    />

                    <Label>Categoria:</Label>
                    <RowContainer>
                        <Select
                            name="categoryId"
                            onChange={handleChange}
                            value={formInputData.categoryId}
                        >
                            <option value="" id="empty">
                                Selecione uma categoria
                            </option>
                            {categoryData &&
                                categoryData.categories.map(
                                    (category: Category) => {
                                        return (
                                            <option value={category.id}>
                                                {category.name}
                                            </option>
                                        );
                                    }
                                )}
                        </Select>

                        <Button onClick={handleCreateCategory}>
                            Nova categoria
                        </Button>
                    </RowContainer>

                    <Label>Em estoque:</Label>
                    <InputText
                        type="number"
                        name="stock"
                        step="1"
                        value="1"
                        onChange={handleChange}
                    />

                    <Label>Fotos:</Label>
                    <RowContainer>
                        <InputText
                            type="file"
                            name="photo"
                            onChange={handleSelectedFile}
                        />
                        <Button onClick={handleUploadPhoto}>Upload</Button>
                    </RowContainer>
                    <RowContainer>
                        {formInputData.photos.map((item) => (
                            <ImageContainer key={item}>
                                <Image src={item} width="70px" height="80px" />
                                <CloseButton
                                    id={item}
                                    onClick={handleRemoveImage}
                                >
                                    X
                                </CloseButton>
                            </ImageContainer>
                        ))}
                    </RowContainer>

                    <ButtonContainer>
                        <Button onClick={handleCancel}>Cancelar</Button>
                        <Button onClick={handleSave}>Salvar</Button>
                    </ButtonContainer>
                </Content>
            </Container>
            <ToastContainer />
        </>
    );
};

export default ProductForm;
