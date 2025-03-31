import React from "react";
import loginDisplay from '../assets/Screenshot 2025-03-31 194547.png';
import googleLogo from '../assets/googleLogo.png'
import facebookLogo from '../assets/facebookLogo.png'
import { Link } from "react-router-dom";

export default function LoginPage() {
    return (
<main className="min-h-screen flex">
  
  <figure className="w-1/2 bg-gray-100 flex items-center justify-center p-8">
    <img
      src={loginDisplay}
      alt="Creative workspace illustration"
      className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-md rounded-tr-2xl rounded-br-2xl rounded-tl-2xl rounded-bl-2xl"
    />
  </figure>


  <section className="w-1/2 flex flex-col justify-center p-10 bg-white">
    <header className="text-center mb-6">
      <h1 className="text-4xl font-bold">Welcome!</h1>
      <p className="text-lg font-semibold text-gray-600 mt-1">Login.</p>
    </header>

    <form className="space-y-4">
      <input
        type="email"
        placeholder="Email"
        className="w-full border border-gray-300 rounded-md p-2"
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border border-gray-300 rounded-md p-2"
      />

      <div className="flex items-center justify-between text-sm text-gray-600">
        <label className="inline-flex items-center">
          <input type="checkbox" className="mr-1" />
          Remember me
        </label>
        <Link to="/forgotpassword" className="text-green-600 hover:underline">Forgot Password?</Link>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
      >
        Login
      </button>
    </form>

    <div className="flex items-center my-6">
      <hr className="flex-grow border-gray-300" />
      <span className="mx-2 text-sm text-gray-500">OR</span>
      <hr className="flex-grow border-gray-300" />
    </div>

    <div className="space-y-3">
      <button className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
        <img src={googleLogo} alt="Google" className="w-5 h-5" />
        <span>Continue with Google</span>
      </button>
      <button className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
        <img src={facebookLogo} alt="Facebook" className="w-5 h-5" />
        <span>Continue with Facebook</span>
      </button>
    </div>

    <p className="text-center text-sm text-gray-500 mt-6">
      Don't have an account? <a href="/register" className="text-green-600 hover:underline">Register</a>
    </p>
  </section>
</main>

    );
}
