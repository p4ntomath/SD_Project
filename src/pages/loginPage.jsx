import loginDisplay from '../assets/Screenshot 2025-03-31 194547.png';
import LoginForm from  '../components/LogInForm'

const LoginPage = () => (
  <section className="min-h-screen flex flex-col md:flex-row">
    <section className="md:w-1/2 bg-gray-100 flex items-center justify-center p-8 rounded-tr-2xl rounded-br-2xl">
      <img
        src={loginDisplay}
        alt="Creative workspace illustration"
        className="h-auto object-contain rounded-lg shadow-md"
      />
    </section>
    <section className="md:w-1/2 flex items-center justify-center p-8 bg-white">
      <LoginForm />
    </section>
  </section>
);

export default LoginPage;