import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// 1. ĐỊNH NGHĨA ZOD SCHEMA (Có nested validation cho mảng variants)
const productSchema = z.object({
  productName: z
    .string()
    .min(1, { message: "Product name là bắt buộc" })
    .max(100, { message: "Product name không được vượt quá 100 ký tự" }),
  description: z.string().optional(),
  basePrice: z.coerce
    .number({ error: "Base price phải là một số" })
    .min(0, { message: "Base price phải lớn hơn hoặc bằng 0" }),
  variants: z
    .array(
      z.object({
        variantName: z.string().min(1, { message: "Variant name là bắt buộc" }),
        extraPrice: z.coerce.number().default(0),
        stock: z.coerce
          .number({ error: "Stock phải là một số" })
          .min(0, { message: "Stock phải lớn hơn hoặc bằng 0" }),
      }),
    )
    .min(1),
});

type ProductFormType = z.infer<typeof productSchema>;

export default function ProductFormPage() {
  // 2. KHỞI TẠO USEFORM
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormType>({
    // zodResolver's inferred types can be incompatible with RHF's Resolver generic in some setups
    // cast to Resolver<ProductFormType> to satisfy the linter instead of using `any`
    resolver: zodResolver(productSchema) as Resolver<ProductFormType>,
    mode: "onChange",
    defaultValues: {
      productName: "",
      description: "",
      basePrice: 0,
      variants: [{ variantName: "", extraPrice: 0, stock: 0 }], // Luôn có sẵn 1 variant ban đầu
    },
  });

  // 3. SỬ DỤNG USEFIELDARRAY ĐỂ QUẢN LÝ DANH SÁCH VARIANTS (Thêm/Xóa động)
  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  // 4. HIỂN THỊ REALTIME: DÙNG USEWATCH ĐỂ TÍNH TỔNG VARIANTS & TỔNG STOCK
  const watchedVariants = useWatch({
    control,
    name: "variants",
  });

  const totalVariants = fields.length;
  const totalStock = watchedVariants
    ? watchedVariants.reduce((sum, item) => sum + (Number(item?.stock) || 0), 0)
    : 0;

  // 5. HÀM SUBMIT FORM (Kết nối trực tiếp tới cổng BE 3000)
  const onSubmit = async (data: ProductFormType) => {
    try {
      // 🌟 Lấy token trực tiếp từ localStorage ra trước khi gọi fetch
      const storedToken = localStorage.getItem("token");

      // Gọi API POST tới đúng endpoint đã mở trên Swagger của NestJS
      const response = await fetch("http://localhost:3002/api/products", {
        method: "POST",
        headers: {
          // Đính kèm token vừa lấy được vào header (dùng toán tử || chuỗi rỗng đề phòng chưa đăng nhập)
          Authorization: `Bearer ${storedToken || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data), // Nhớ đừng quên dòng chuyển dữ liệu form sang JSON này nhé!
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert(
            "Phiên đăng nhập hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại!",
          );
          return;
        }
        throw new Error("Lỗi khi lưu sản phẩm");
      }

      alert("Lưu sản phẩm thành công!");
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối đến server Back-end!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold text-purple-900 mb-6 uppercase tracking-wide"></h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Product Name Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                {...register("productName")}
                placeholder="Nhập tên sản phẩm (tối đa 100 ký tự)"
                className={`w-full border rounded px-3 py-2 text-sm text-gray-950 font-medium outline-none focus:border-purple-500 ${
                  errors.productName
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
              />
            </div>
            {errors.productName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.productName.message}
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              placeholder="Mô tả sản phẩm (không bắt buộc)"
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-500"
            />
          </div>

          {/* Base Price Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Base Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("basePrice", { valueAsNumber: true })}
              placeholder="Nhập giá gốc (>= 0)"
              className={`w-full border rounded px-3 py-2 text-sm text-gray-950 font-medium outline-none focus:border-purple-500 ${
                errors.basePrice
                  ? "border-red-500 bg-red-50"
                  : "border-gray-300"
              }`}
            />
            {errors.basePrice && (
              <p className="text-red-500 text-xs mt-1">
                {errors.basePrice.message}
              </p>
            )}
          </div>

          {/* --- DANH SÁCH VARIANTS (DYNAMIC) --- */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-md font-bold text-gray-800">Variants</h2>
              <div className="text-xs font-semibold space-x-4 text-purple-700">
                <span>
                  Tổng variants:{" "}
                  <strong className="text-sm">{totalVariants}</strong>
                </span>
                <span>|</span>
                <span>
                  Tổng stock: <strong className="text-sm">{totalStock}</strong>
                </span>
              </div>
            </div>
            {/* ==================== HÀNG TIÊU ĐỀ  ==================== */}
            <div className="flex gap-3 items-center p-3 pb-0 pt-1 text-xs font-bold text-gray-700 select-none">
              <span className="w-4 text-center"></span>

              <div className="flex-1 text-left pl-1">
                Variant Name <span className="text-red-500">*</span>
              </div>

              <div className="w-28 text-left pl-1">Extra Price</div>

              <div className="w-24 text-left pl-1">
                Stock <span className="text-red-500">*</span>
              </div>

              <div className="w-8.5 text-center whitespace-nowrap">
                Thao tác
              </div>
            </div>
            {/* ====================================================================================== */}
            {/* BẢNG CHỨA BIẾN THỂ */}
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-start gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                    <span className="text-gray-400 font-bold self-center text-sm w-4">
                      {index + 1}
                    </span>

                    {/* Variant Name Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        {...register(`variants.${index}.variantName` as const)}
                        placeholder="Tên biến thể (M - Trắng)"
                        className={`w-full border rounded px-3 py-1.5 text-sm text-gray-950 font-medium outline-none ${
                          errors.variants?.[index]?.variantName
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                      />
                    </div>

                    {/* Extra Price Input */}
                    <div className="w-28">
                      <input
                        type="number"
                        {...register(`variants.${index}.extraPrice` as const, {
                          valueAsNumber: true,
                        })}
                        placeholder="Extra Price"
                        className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-900 outline-none"
                      />
                    </div>

                    {/* Stock Input */}
                    <div className="w-24">
                      <input
                        type="number"
                        {...register(`variants.${index}.stock` as const, {
                          valueAsNumber: true,
                        })}
                        placeholder="Stock"
                        className={`w-full border rounded px-3 py-1.5 text-sm text-gray-900 outline-none ${
                          errors.variants?.[index]?.stock
                            ? "border-red-500 bg-red-50" // Khi có lỗi (như nhập số âm) -> Viền đỏ lập tức
                            : "border-gray-300 focus:border-purple-500"
                        }`}
                      />
                    </div>

                    {/* Nút Thao tác (Xóa) */}
                    <button
                      type="button"
                      disabled={fields.length <= 1} // Không cho xóa khi chỉ còn 1 variant (Yêu cầu số 5)
                      onClick={() => remove(index)}
                      className={`p-2 rounded text-white ${
                        fields.length <= 1
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600 transition"
                      }`}
                    >
                      {/* Thùng rác biểu tượng */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Hiển thị lỗi riêng biệt của từng dòng Variant */}
                  <div className="flex gap-4 pl-7 text-[11px] text-red-500 font-medium">
                    {errors.variants?.[index]?.variantName && (
                      <p className="flex-1">
                        {errors.variants[index]?.variantName?.message}
                      </p>
                    )}
                    {errors.variants?.[index]?.stock && (
                      <p className="w-full text-right pr-14">
                        {errors.variants[index]?.stock?.message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Nút Thêm Variant */}
            <button
              type="button"
              onClick={() =>
                append({ variantName: "", extraPrice: 0, stock: 0 })
              }
              className="mt-3 px-4 py-1.5 border border-purple-600 text-purple-600 text-xs font-bold rounded hover:bg-purple-50 transition"
            >
              + Thêm variant
            </button>
          </div>

          {/* Nút Submit chính */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded font-bold text-sm text-white transition ${
                isSubmitting
                  ? "bg-purple-400 cursor-not-allowed"
                  : "bg-purple-700 hover:bg-purple-800"
              }`}
            >
              Lưu sản phẩm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
