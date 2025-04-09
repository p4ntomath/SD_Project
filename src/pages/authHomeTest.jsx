import React from "react";
import {logOut} from "../backend/firebase/authFirebase";
import {createProject} from "../backend/firebase/projectDB";

export default function AuthHomeTest() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <p>Hello This Home Page After Login</p>
            <button 
            className="p-2 bg-blue-500 rounded-lg"
            onClick={()=>{
                logOut();
                window.location.href = "/login";
            }}>
                Log Out
            </button>
        </div>
    );
    }