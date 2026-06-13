// pages/login.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/router";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username là bắt buộc" }),
  password: z.string().min(1, { message: "Password là bắt buộc" }),
});

type LoginFormType = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormType) => {
    setServerError(null);
    try {
      const response = await axios.post(
        "http://localhost:3002/api/auth/login",
        data,
      );

      // LƯU TOKEN VÀO LOCALSTORAGE KHI LOGIN THÀNH CÔNG
      const token = response.data.access_token;
      localStorage.setItem("token", token);

      alert("Đăng nhập thành công!");
      router.push("/product");
    } catch (error) {
      // Nhận và hiển thị thông báo lỗi từ NestJS gửi về nếu sai tài khoản
      if (axios.isAxiosError(error)) {
        setServerError(
          error.response?.data?.message || "Sai username hoặc password",
        );
      } else {
        setServerError("Sai username hoặc password");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 text-gray-800">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-8 shadow-md"
      >
        <h2 className="text-2xl font-bold text-blue-600 text-center">
          LOGIN FORM
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

        {/* Khung hiển thị thông báo lỗi màu đỏ từ Server */}
        {serverError && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600 text-center font-medium">
            ⚠️ {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-blue-600 p-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
