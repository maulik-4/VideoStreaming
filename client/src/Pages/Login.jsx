import { useState } from "react";
import { FaYoutube } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
const Login = () => {
    const navigate = useNavigate();
    const [user, setuser] = useState({ "userName": "", "password": "" });
    const handleInput = (event, name) => {
        setuser({
            ...user,
            [name]: event.target.value
        })
    }

    const handleLogin = async ()=>{
        axios.post("http://localhost:9999/auth/login" , user,{
            withCredentials: true,
            
        })
        .then((res) =>{
            if(res.data.success === "yes"){
                const { user, token } = res.data;
                localStorage.setItem("token" , token);
                localStorage.setItem("user" , JSON.stringify(user));
                
                setTimeout(() => {
                    window.location.href = '/';

                }, 2000);
                

                toast.success("Login Successful");
            }else{
                alert("Invalid Credentials");
            }
        })
        .catch((err) => {
            console.log(err);
            toast.error("Invalid Credentials");
        }
        )
    }
    return (
        <div className="login bg-black text-white  flex justify-center items-center h-screen  ">
            <div className="login_box flex flex-col gap-10 w-[50vw] h-[60vh] py-[2vw]  border-gray-400 border-solid border-3 ">
                <div className="login_title flex justify-center items-center gap-4">
                    <FaYoutube color="red" size={32} />
                    <h1 className="font-bold text-[2vw]"> Login</h1>
                </div>
                <div className="input flex flex-col gap-4 justify-center items-center">
                    <input type="text" value={user.userName} onChange={(e) => {
                        handleInput(e,"userName");
                    }} className="bg-[#212121] text-center w-[15vw] rounded-[10px] py-[1.5vw] h-[2vw] focus:border-2 forced-colors:grayscale-25" placeholder="userName" />
                    <input type="text" value={user.password} onChange={(e) =>{
                        handleInput(e,"password");
                    }} className="bg-[#212121] text-center w-[15vw] rounded-[10px] py-[1.5vw] h-[2vw] focus:border-2 forced-colors:grayscale-25" placeholder="Password" />
                </div>
                <div className="btn flex justify-center gap-4">
                    <button type="submit" onClick={handleLogin} className="font-bold cursor-pointer text-center border-2 w-[8vw] py-[.7vw] border-gray-500 text-[1vw]">Login</button>
                    <button onClick={() => {
                        navigate('/signup');
                    }
                    } className="font-bold cursor-pointer text-center border-2 w-[8vw] py-[.7vw] border-gray-500 text-[1vw]">SignUp</button>
                    <button onClick={() => {
                        navigate('/')
                    }} className="font-bold cursor-pointer text-center border-2 w-[8vw] py-[.7vw] border-gray-500 text-[1vw]">Cancel</button>
                </div>

            </div>
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
        </div>
    )
}
export default Login;