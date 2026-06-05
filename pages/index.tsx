// pages/signup.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";

// 1. Định nghĩa khuôn Validate bằng Zod theo yêu cầu trong ảnh
const signupSchema = z
  .object({
    username: z.string().min(1, { message: "Username là bắt buộc" }),
    password: z
      .string()
      .min(6, { message: "Mật khẩu phải từ 6 ký tự trở lên" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Vui lòng xác nhận lại mật khẩu" }),
    sex: z.enum(["Nam", "Nữ", "Khác"], {
      message: "Vui lòng chọn giới tính",
    }),
    email: z
      .string()
      .email({ message: "Email không đúng định dạng" })
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });

type SignupFormType = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormType>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormType) => {
    try {
      // Gửi dữ liệu qua NestJS (Cổng 3000)
      await axios.post("http://localhost:3000/api/auth/register", {
        username: data.username,
        password: data.password,
        sex: data.sex,
        email: data.email || null,
      });
      alert("Đăng ký tài khoản thành công!");
    } catch (error) {
      const errorMessage =
        error instanceof axios.AxiosError
          ? error.response?.data?.message
          : "Tên tài khoản đã tồn tại hoặc có lỗi xảy ra";
      alert(errorMessage || "Tên tài khoản đã tồn tại hoặc có lỗi xảy ra");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-800">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-md"
      >
        <h2 className="text-2xl font-bold text-blue-600 text-center">
          SIGNUP FORM
        </h2>

        <div>
          <label className="block font-medium text-gray-700">Username *</label>
          <input
            {...register("username")}
            className="mt-1 w-full rounded border p-2 focus:outline-blue-500"
            placeholder="Nhập username"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-500">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium text-gray-700">Password *</label>
          <input
            type="password"
            {...register("password")}
            className="mt-1 w-full rounded border p-2 focus:outline-blue-500"
            placeholder="Nhập password"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium text-gray-700">
            Password again *
          </label>
          <input
            type="password"
            {...register("confirmPassword")}
            className="mt-1 w-full rounded border p-2 focus:outline-blue-500"
            placeholder="Nhập lại password"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium text-gray-700">Sex *</label>
          <div className="mt-2 flex space-x-6">
            {["Nam", "Nữ", "Khác"].map((item) => (
              <label
                key={item}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="radio"
                  value={item}
                  {...register("sex")}
                  className="h-4 w-4 text-blue-600"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          {errors.sex && (
            <p className="mt-1 text-sm text-red-500">{errors.sex.message}</p>
          )}
        </div>

        <div>
          <label className="block font-medium text-gray-700">
            Email <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            {...register("email")}
            className="mt-1 w-full rounded border p-2 focus:outline-blue-500"
            placeholder="Nhập email"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-blue-600 p-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>
    </div>
  );
}
