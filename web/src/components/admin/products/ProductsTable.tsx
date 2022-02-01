// import React, { useEffect, useState } from "react";
// import { DataGrid, GridActionsCellItem, GridColDef } from "@mui/x-data-grid";
import styled from "styled-components";
// import { Product, useDeleteProductMutation } from "../../../generated/graphql";
// import { MdDeleteForever } from "react-icons/md";
// import Link from "next/link";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

const ImageContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const ButtonContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ProductImage = styled.img`
    width: 70px;
    height: 100px;
`;

// const EditButton = styled.button`
//     border-radius: 15%;
//     border: none;
//     background-color: #2f015a;
//     color: white;
//     padding: 5px;
//     cursor: pointer;
//     margin-right: 10px;
// `;

// interface ProductTableProps {
//     data: Product[];
// }

// const ProductsTable: React.FC<ProductTableProps> = ({ data }) => {
//     const [products, setProducts] = useState<Product[]>([]);
//     const [deleteProduct] = useDeleteProductMutation();

//     useEffect(() => {
//         setProducts(data);

//         console.log(data);
//     }, [data]);

//     const handleDelete = React.useCallback(
//         async (id) => () => {
//             setTimeout(async () => {
//                 setProducts((prev) =>
//                     prev.filter((product) => product.id !== id)
//                 );

//                 // const { errors } = await deleteProduct({
//                 //     variables: {
//                 //         id: id,
//                 //     },
//                 // });

//                 // if (errors) {
//                 //     console.log(JSON.stringify(errors, null, 2));
//                 //     toast.error("Não foi possível remover o produto.", {
//                 //         position: "bottom-center",
//                 //         autoClose: 2000,
//                 //         hideProgressBar: true,
//                 //         closeOnClick: true,
//                 //         pauseOnHover: true,
//                 //         draggable: true,
//                 //         progress: undefined,
//                 //     });
//                 // }

//                 // toast.success("Produto removido!", {
//                 //     position: "bottom-center",
//                 //     autoClose: 2000,
//                 //     hideProgressBar: true,
//                 //     closeOnClick: true,
//                 //     pauseOnHover: true,
//                 //     draggable: true,
//                 //     progress: undefined,
//                 // });
//             });
//         },
//         []
//     );

//     const columns = [
//         { field: "id", headerName: "ID", width: 15 },
//         {
//             field: "photos",
//             headerName: "Foto",
//             sortable: false,
//             width: 160,

//             renderCell: (params) => {
//                 return (
//                     <ImageContainer>
//                         <ProductImage
//                             className="productListImg"
//                             src={params.row.photos[0]}
//                             alt=""
//                         />
//                     </ImageContainer>
//                 );
//             },
//         },
//         {
//             field: "name",
//             headerName: "Nome",
//             sortable: true,
//             width: 150,
//             editable: false,
//         },
//         {
//             field: "category",
//             headerName: "Categoria",
//             sortable: true,
//             width: 150,
//             editable: false,
//         },
//         {
//             field: "price",
//             headerName: "Preço",
//             sortable: true,
//             type: "number",
//             width: 110,
//             editable: false,
//         },
//         {
//             field: "actions",
//             type: "actions",
//             width: 80,
//             getActions: (params) => [
//                 <GridActionsCellItem
//                     icon={<MdDeleteForever />}
//                     label="Delete"
//                     size="large"
//                     onClick={handleDelete(params.row.id)}
//                 />,
//             ],
//         },
//         [handleDelete],
//         // {
//         //     field: "action",
//         //     headerName: "Ações",
//         //     width: 150,

//         //     renderCell: (params) => {
//         //         return (
//         //             <ButtonContainer>
//         //                 <Link href={"/admin/newProduct/" + params.row.id}>
//         //                     <EditButton>Editar</EditButton>
//         //                 </Link>

//         //                 <MdDeleteForever
//         //                     size={30}
//         //                     color="red"
//         //                     cursor={"pointer"}
//         //                     onClick={() => handidleDelete(params.row.id)}
//         //                 />
//         //             </ButtonContainer>
//         //         );
//         //     },
//         // },
//     ];

//     return (
//         <>
//             <div style={{ height: 600, width: "100%" }}>
//                 <DataGrid
//                     rows={products}
//                     columns={columns}
//                     pageSize={20}
//                     rowsPerPageOptions={[20]}
//                     checkboxSelection
//                     disableSelectionOnClick
//                 />
//             </div>
//             <ToastContainer />
//         </>
//     );
// };

// export default ProductsTable;

import * as React from "react";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import { MdDeleteForever } from "react-icons/md";
import { useRouter } from "next/router";

export default function ProductsTable({ data }) {
    const [rows, setRows] = React.useState(data);
    const router = useRouter();

    const deleteProduct = React.useCallback(
        (id) => () => {
            setTimeout(() => {
                setRows((prevRows) => prevRows.filter((row) => row.id !== id));
            });
        },
        []
    );

    const editProduct = React.useCallback(
        (id) => () => {
          router.push("/admin/product/"+ id);
        },
        []
    );

    const columns = React.useMemo(
        () => [
            { field: "id", headerName: "ID", width: 15 },
            {
                field: "photos",
                headerName: "Foto",
                sortable: false,
                width: 160,

                renderCell: (params) => {
                    return (
                        <ImageContainer>
                            <ProductImage
                                className="productListImg"
                                src={params.row.photos[0]}
                                alt=""
                            />
                        </ImageContainer>
                    );
                },
            },
            {
                field: "name",
                headerName: "Nome",
                sortable: true,
                width: 150,
                editable: false,
            },
            {
                field: "category",
                headerName: "Categoria",
                sortable: true,
                width: 150,
                editable: false,
            },
            {
                field: "price",
                headerName: "Preço",
                sortable: true,
                type: "number",
                width: 110,
                editable: false,
            },
            {
                field: "actions",
                type: "actions",
                width: 80,
                getActions: (params) => [
                    <GridActionsCellItem
                        icon={<MdDeleteForever />}
                        label="Delete"
                        onClick={deleteProduct(params.id)}
                    />,
                    <GridActionsCellItem
                        icon={<MdDeleteForever />}
                        label="Editar"
                        onClick={editProduct(params.id)}
                    />
                ],
            },
        ],
        [deleteProduct, editProduct]
    );

    return (
        <div style={{ height: 300, width: "100%" }}>
            <DataGrid columns={columns} rows={rows} />
        </div>
    );
}
