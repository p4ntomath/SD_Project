import SignUpForm from '../components/SignUpForm';
import welcomeImage from '../assets/welcomeDisplayImage.jpg';

const SignUpPage = () => (
  <div className="min-h-screen flex flex-col md:flex-row">
    <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-8 rounded-tr-2xl rounded-br-2xl">
  <img
    src={welcomeImage}
    alt="Welcome"
    className="h-auto object-contain rounded-lg shadow-md"
  />
</div>
    <div className="md:w-1/2 flex items-center justify-center p-8 bg-white">
      <SignUpForm />
    </div>
  </div>
);

export default SignUpPage;