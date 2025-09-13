import React, { useState } from "react"
import axios from "axios"

const RegisterComponent = ({ setNoAccount }) => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")

  // Send input data to backend to save it in the db
  const sendRegister = async () => {
    const userData = {
      username: username,
      password: password,
      email: email
    }
    await axios.post(`${import.meta.env.VITE_API_URL}/api/user`, userData)
  }

  return (
    <div>
      <label htmlFor="email">E-mail:</label>
      <input id="email" onChange={e => setEmail(e.target.value)} />
      <label htmlFor="username">Username:</label>
      <input id="username" onChange={e => setUsername(e.target.value)} />
      <label htmlFor="password">Password:</label>
      <input id="password" onChange={e => setPassword(e.target.value)} type="password" />
      <button onClick={sendRegister}>Register Now</button>
      <button onClick={() => setNoAccount(false)}>To Login</button>
    </div>
  )
}

export default RegisterComponent