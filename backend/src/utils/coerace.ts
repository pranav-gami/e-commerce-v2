// helper: coerce multipart/form-data strings → correct types
export const coerceProductBody = (body: any) => {
  const coerced: any = { ...body };

  if (body.price !== undefined) coerced.price = parseFloat(body.price);

  if (body.discount !== undefined && body.discount !== "")
    coerced.discount = parseFloat(body.discount);
  else if (body.discount === "") delete coerced.discount;

  if (body.stock !== undefined) coerced.stock = parseInt(body.stock);

  if (body.subCategoryId !== undefined)
    coerced.subCategoryId = parseInt(body.subCategoryId);

  if (body.isFeatured === "true") coerced.isFeatured = true;
  else if (body.isFeatured === "false") coerced.isFeatured = false;

  return coerced;
};
