import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import React, { useState, useRef } from "react";
import { fetchUserBySecretKey } from "../api";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";


// Define your admin's secret key here.
// In a real app, this should be stored securely as an environment variable.
const ADMIN_SECRET_KEY = "123456"; // Replace with your actual admin key


export default function Login() {
  const navigate = useNavigate();
  const { register, setValue, formState: { errors } } = useForm();
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  // You can use your custom color classes here
  const primaryColor = "text-primary";

  const handleInputChange = async (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    setValue("secretKey", value);

    if (value.length === 6) {
      setLoginError("");
      setLoading(true);
      try {
        const user = await fetchUserBySecretKey(value);
        if (!user) {
          setLoginError("Invalid secret key. Please try again.");
          setValue("secretKey", "");
          inputRef.current.value = "";
          setLoading(false);
          return;
        }

        localStorage.clear();

        // Check if the entered key is the admin key
        if (value === ADMIN_SECRET_KEY) {
            localStorage.setItem("isAdmin", "true");
            console.log("Admin user logged in.");
        } else {
            localStorage.setItem("isAdmin", "false");
        }

        localStorage.setItem("userName", user.fields["User Name"] || "User");
        localStorage.setItem("secretKey", value);
        localStorage.setItem("userRecordId", user.id);
        localStorage.setItem("accountIds", JSON.stringify(user.fields.Accounts || []));
        localStorage.setItem("projectIds", JSON.stringify(user.fields.Projects || []));
        localStorage.setItem("updateIds", JSON.stringify(user.fields.Updates || []));
        localStorage.setItem("taskIds", JSON.stringify(user.fields["Tasks (Assigned To)"] || []));
        localStorage.setItem("createdTaskIds", JSON.stringify(user.fields["Tasks (Created By)"] || []));
        setLoading(false);
        navigate("/");
      } catch (err) {
        setLoginError("Authentication failed. Please check your connection and try again.");
        setValue("secretKey", "");
        inputRef.current.value = "";
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full space-y-10 p-14 bg-white rounded-3xl shadow-2xl border border-gray-100">
          <div className="flex flex-col items-center space-y-4">
            <h2 className={`text-4xl font-extrabold text-center ${primaryColor} font-merriweather`}>
              Sign in to your account
            </h2>
            <p className="text-base text-gray-600 text-center max-w-xs leading-relaxed">
              Enter your 6-digit secret key to continue
            </p>
          </div>
          <form className="space-y-8 w-full" autoComplete="off" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block text-md font-semibold text-gray-700 mb-2">
                Secret Key
              </label>
              <input
                {...register("secretKey", {
                  required: "Secret key is required",
                  minLength: 6,
                  maxLength: 6,
                  pattern: /^\d{6}$/,
                })}
                type="password"
                placeholder="Enter 6-digit secret key"
                className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-primary focus:ring-primary bg-gray-50 text-gray-900 placeholder-gray-400 py-4 px-5 text-center tracking-widest text-2xl font-mono placeholder:text-sm"
                disabled={loading}
                autoFocus
                maxLength={6}
                ref={inputRef}
                onChange={handleInputChange}
                inputMode="numeric"
                pattern="\d*"
                spellCheck="false"
              />
              {errors.secretKey && (
                <span className="text-red-600 text-sm mt-1 block">{errors.secretKey.message}</span>
              )}
            </div>
            {/* No submit button */}
          </form>
          {loginError && (
            <div className="text-red-600 text-center text-sm mt-4 font-semibold">{loginError}</div>
          )}
          <p className="text-xs text-gray-500 text-center mt-6 max-w-xs mx-auto leading-relaxed">
            Ask admin for your key
          </p>
          <p className="text-xs text-yellow-700 text-center mt-2 font-semibold max-w-xs mx-auto leading-relaxed">
            Please <span className="underline">do not share</span> your secret key with anyone.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
