import loginDisplay from '../assets/Screenshot 2025-03-31 194547.png';
import LoginForm from  '../components/LogInForm'

const LoginPage = () => (
  <main className="min-h-screen flex flex-col md:flex-row">
    <aside aria-label='aside' className="md:w-1/2 bg-gray-100 flex items-center justify-center p-8 rounded-tr-2xl rounded-br-2xl">
      <figure>
        <img
          src={loginDisplay}
          alt="Creative workspace illustration"
          className="h-auto object-contain rounded-lg shadow-md"
        />
      </figure>
    </aside>
    <section className="md:w-1/2 flex items-center justify-center p-8 bg-white" aria-label="Login form">
      <LoginForm />
    </section>
  </main>
);

export default LoginPage;