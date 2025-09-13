import React, {useState, useEffect} from "react"
import RegisterComponent from "./RegisterComponent"
import axios from "axios"

const LoginComponent = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [noAccount, setNoAccount] = useState(false)

  // Send input data to backend
  const sendLogin = async () => {
    const loginData = {
      username: username,
      password: password
    }
    await axios.post(`${import.meta.env.VITE_API_URL}/api/user/login`, loginData)
  }

  return (
    <div>
      { noAccount === false ? (
        <div>
          <label htmlFor="username">Username:</label>
          <input id="username" onChange={e => setUsername(e.target.value)} />
          <label htmlFor="password">Password:</label>
          <input id="password" onChange={e => setPassword(e.target.value)} type="password" />
          <button onClick={sendLogin}>Login</button>
          <button onClick={() => setNoAccount(true)}>No Account ?</button>
        </div>
      ) : 
        <RegisterComponent setNoAccount={setNoAccount} />
      }
    </div>
  )
}

export default LoginComponent