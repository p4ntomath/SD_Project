import React, {useState} from 'react'
import {Navigate,Link} from 'react-router-dom'
import { doSignInWithEmailAndPassword,doSignInWithGoogle } from '../../../firebase/auth'
import { useAuth } from '../../../contexts/authContext'

const Login = () =>{
    const {userLoggedIn} = useAuth()

    const [email,setEmail] = useState('')
    const [password,setPassword] = useState('')
    const [isSigningIn,setIsSigningIn] = useState(false)
    const [errorMessage,setErrorMessage] = useState('') // need to find a way to set error message

    const onSubmit = async (e) => {
        e.preventDefault()
        if(!isSigningIn){
            setIsSigningIn(true)
            await doSignInWithEmailAndPassword(email,password)
        }
    }

    const onGoogleSgnIn = (e) => {
        e.preventDefault()
        if(!isSigningIn){
            setIsSigningIn(true)
            doSignInWithGoogle().catch(err => {
                setIsSigningIn(false)
            })
        }
        
    }
    //not sure what is going on here, think it is navigation of the page
    return (
        <div className="login-container">
            {userLoggedIn ? (
                // If the user is logged in, redirect to another page (like dashboard or home)
                <Navigate to="/home" />
            ) : (
                // If the user is not logged in, show the login form
                <form onSubmit={onSubmit} className="login-form">
                    <h2>Login</h2>
    
                    {/* Email input */}
                    <div>
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            id="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            placeholder="Enter your email"
                        />
                    </div>
    
                    {/* Password input */}
                    <div>
                        <label htmlFor="password">Password</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Enter your password"
                        />
                    </div>
    
                    {/* Show an error message if there is one */}
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
    
                    {/* Submit button */}
                    <button type="submit" disabled={isSigningIn}>
                        {isSigningIn ? 'Signing In...' : 'Sign In'}
                    </button>
    
                    {/* Google Sign-In button */}
                    <button onClick={onGoogleSgnIn} disabled={isSigningIn}>
                        {isSigningIn ? 'Signing In with Google...' : 'Sign In with Google'}
                    </button>
    
                    {/* Link to register page */}
                    <p>Don't have an account? <Link to="/register">Sign up</Link></p>
                </form>
            )}
        </div>
    );
    
}

//somewhere here you need to export default Home