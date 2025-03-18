import React, { useState } from "react";
// import { Mail, Lock, User, Loader2 } from "lucide-react"; // Remove Lucide import
import { Icons } from "./Icons"; // Import our custom icons

interface AuthFormProps {
  isLogin: boolean;
  onSubmit: (data: { email: string; password: string; name?: string }) => void;
  isLoading?: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  isLogin,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {!isLogin && (
        <div className="relative">
          <Icons.User
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Full Name"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={isLoading}
            required={!isLogin}
          />
        </div>
      )}
      <div className="relative">
        <Icons.Mail
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
          required
        />
      </div>
      <div className="relative">
        <Icons.Lock
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          disabled={isLoading}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Icons.Loader className="animate-spin mr-2" size={18} />
            Loading...
          </>
        ) : isLogin ? (
          "Login"
        ) : (
          "Sign Up"
        )}
      </button>
    </form>
  );
};
